import type { IndexedSourcePage } from './sourceIndexTypes'

/** A lossless, bounded transport over the existing immutable page index. */
export function buildSourcePacket(pages: IndexedSourcePage[], cursor?: string, budget = 36_000, format: 'detailed' | 'compact' = 'detailed', includeDetails = false) {
  if (!pages.length) throw new Error('No indexed pages are available in this range.')
  let pageIndex = 0
  let elementIndex = 0
  let offset = 0
  if (cursor) {
    if (!/^\d+:\d+:\d+$/.test(cursor)) throw new Error('Invalid evidence cursor.')
    const values = cursor.split(':').map(Number)
    if (values.some(value => !Number.isSafeInteger(value))) throw new Error('Invalid evidence cursor.')
    pageIndex = pages.findIndex(page => page.page_number === values[0])
    elementIndex = values[1]; offset = values[2]
    const page = pages[pageIndex]
    if (!page || elementIndex > page.elements.length || offset > (page.elements[elementIndex]?.text.length ?? 0)) throw new Error('Evidence cursor is outside this range.')
  }
  const evidence: Array<{ page: number; id: string; kind: string; bbox: number[]; status: string; text: string; text_offset: number; continued: boolean; confidence?: number; order?: number; reasons?: string[] }> = []
  const inspected = new Set<number>()
  const completed: number[] = []
  let used = 0
  while (pageIndex < pages.length) {
    const page = pages[pageIndex]
    inspected.add(page.page_number)
    if (elementIndex >= page.elements.length) {
      completed.push(page.page_number); pageIndex++; elementIndex = 0; offset = 0
      continue
    }
    const element = page.elements[elementIndex]
    const remaining = element.text.slice(offset)
    const base = { page: page.page_number, id: element.element_id, kind: element.kind, bbox: element.bbox_normalized, status: element.status, text_offset: offset, ...(includeDetails ? { confidence: element.confidence, order: element.order, reasons: element.reasons } : {}) }
    let text = remaining
    let entry = { ...base, text, continued: false }
    const encodedSize = (value: typeof entry) => JSON.stringify(format === 'compact' ? evidenceRow(value) : value).length
    let size = encodedSize(entry)
    if (used + size > budget && evidence.length) break
    while (size > budget && text.length > 1) {
      text = text.slice(0, Math.floor(text.length / 2))
      entry = { ...base, text, continued: true }
      size = encodedSize(entry)
    }
    if (size > budget) throw new Error('Evidence metadata exceeds the packet limit.')
    evidence.push(entry); used += size
    if (text.length < remaining.length) { offset += text.length; break }
    elementIndex++; offset = 0
  }
  const metadata = pages.filter(page => inspected.has(page.page_number)).map(page => ({
    page: page.page_number,
    ...(includeDetails ? { profile: page.profile, total_elements: page.elements.length } : {}),
    image_anchor: `${page.source_id}:page:${page.page_number}:image:${page.index_version}`,
    parser_version: page.index_version,
    layout: page.profile.layout_state,
    warnings: page.profile.warnings,
    caption_ids: page.elements.filter(element => element.kind === 'caption_candidate').slice(0, 6).map(element => element.element_id),
    caption_count: page.elements.filter(element => element.kind === 'caption_candidate').length,
  }))
  return {
    source_id: pages[0].source_id,
    range: [pages[0].page_number, pages.at(-1)!.page_number],
    pages: metadata, elements: evidence,
    pages_completed_in_packet: completed,
    next_cursor: pageIndex < pages.length ? `${pages[pageIndex].page_number}:${elementIndex}:${offset}` : null,
    complete_for_range: !cursor && pageIndex === pages.length,
    instructions: 'Read every packet until next_cursor is null. Text is exact extracted evidence, not a summary. continued/text_offset join pieces of the same element. Layout and captions are candidates; inspect relevant original pixels before interpretation.',
  }
}

/** Accept the learner's full range, while loading at most eight pages per call. */
export async function readSourcePacket(
  request: { source_id: string; page_start: number; page_end: number; cursor?: string; format?: 'detailed' | 'compact'; include_details?: boolean },
  pageCount: number,
  loadPages: (sourceId: string, start: number, end: number) => Promise<IndexedSourcePage[]>,
  budget = 36_000,
) {
  const { source_id, page_start, page_end, cursor } = request
  if (request.include_details !== undefined && typeof request.include_details !== 'boolean') throw new Error('include_details must be a boolean.')
  if (request.format !== undefined && !['detailed', 'compact'].includes(request.format)) throw new Error('Choose detailed or compact evidence format.')
  if (!Number.isSafeInteger(page_start) || !Number.isSafeInteger(page_end) || page_start < 1 || page_end < page_start || page_end > pageCount) {
    throw new Error(`Choose PDF pages within 1–${pageCount}; page_end must be at least page_start.`)
  }
  if (cursor !== undefined && !/^\d+:\d+:\d+$/.test(cursor)) throw new Error('Invalid evidence cursor. Use the exact next_call from the previous packet.')
  const start = cursor ? Number(cursor.split(':')[0]) : page_start
  if (!Number.isSafeInteger(start) || start < page_start || start > page_end) throw new Error('Evidence cursor is outside this range.')
  const end = Math.min(start + 7, page_end)
  const pages = await loadPages(source_id, start, end)
  if (pages.length !== end - start + 1 || pages.some((page, index) => page.page_number !== start + index || page.source_id !== source_id)) {
    throw new Error('This packet is not fully indexed yet. Resume the same request after indexing completes.')
  }
  const packet = buildSourcePacket(pages, cursor, budget, request.format, request.include_details)
  const next = packet.next_cursor ?? (end < page_end ? `${end + 1}:0:0` : null)
  return {
    ...packet,
    include_details: request.include_details ?? false,
    range: [page_start, page_end],
    next_cursor: next,
    complete_for_range: !cursor && next === null,
    range_exhausted: next === null,
    next_call: next ? { tool: 'read_source_packet', arguments: { source_id, page_start, page_end, cursor: next, ...(request.format ? { format: request.format } : {}), ...(request.include_details ? { include_details: true } : {}) } } : null,
    instructions: 'Read this evidence, then use next_call unchanged until null. Text is exact extracted evidence, not a summary. continued/text_offset join pieces of the same element. pages_completed_in_packet counts transported pages, not verified understanding. Scans and uncertain layouts require original-pixel inspection. Save scope reviews in nonoverlapping ranges of at most eight pages.',
  }
}

// Tuple columns remove repeated JSON keys, never text, geometry or citation IDs.
// Keep the detailed representation as the compatibility default.
function evidenceRow(element: ReturnType<typeof buildSourcePacket>['elements'][number]) {
  return [element.page, element.id, element.kind, element.bbox, element.status, element.text_offset, element.continued, element.text, ...(element.confidence !== undefined ? [element.confidence, element.order, element.reasons] : [])]
}

export function compactSourcePacket(packet: Awaited<ReturnType<typeof readSourcePacket>>) {
  const { elements, ...metadata } = packet
  return {
    ...metadata,
    format: 'compact',
    columns: ['page', 'id', 'kind', 'bbox', 'status', 'text_offset', 'continued', 'text', ...(packet.include_details ? ['confidence', 'order', 'reasons'] : [])],
    rows: elements.map(evidenceRow),
  }
}

import type { IndexedSourcePage } from './sourceIndexTypes'

/** A lossless, bounded transport over the existing immutable page index. */
export function buildSourcePacket(pages: IndexedSourcePage[], cursor?: string, budget = 36_000) {
  if (!pages.length) throw new Error('No indexed pages are available in this range.')
  let pageIndex = 0
  let elementIndex = 0
  let offset = 0
  if (cursor) {
    if (!/^\d+:\d+:\d+$/.test(cursor)) throw new Error('Invalid evidence cursor.')
    const values = cursor.split(':').map(Number)
    pageIndex = pages.findIndex(page => page.page_number === values[0])
    elementIndex = values[1]; offset = values[2]
    const page = pages[pageIndex]
    if (!page || elementIndex > page.elements.length || offset > (page.elements[elementIndex]?.text.length ?? 0)) throw new Error('Evidence cursor is outside this range.')
  }
  const evidence: Array<{ page: number; id: string; kind: string; bbox: number[]; status: string; text: string; text_offset: number; continued: boolean }> = []
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
    const base = { page: page.page_number, id: element.element_id, kind: element.kind, bbox: element.bbox_normalized, status: element.status, text_offset: offset }
    let text = remaining
    let entry = { ...base, text, continued: false }
    let size = JSON.stringify(entry).length
    if (used + size > budget && evidence.length) break
    while (size > budget && text.length > 1) {
      text = text.slice(0, Math.floor(text.length / 2))
      entry = { ...base, text, continued: true }
      size = JSON.stringify(entry).length
    }
    if (size > budget) throw new Error('Evidence metadata exceeds the packet limit.')
    evidence.push(entry); used += size
    if (text.length < remaining.length) { offset += text.length; break }
    elementIndex++; offset = 0
  }
  const metadata = pages.filter(page => inspected.has(page.page_number)).map(page => ({
    page: page.page_number,
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

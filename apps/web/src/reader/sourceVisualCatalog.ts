import { loadPdfjs } from '../pdfjs'
import { acquireSourcePdf } from '../storage/sourcePdfDocument'
import { getBrowserSourcePages, pageImageElement } from '../storage/browserSources'
import type { IndexedSourcePage } from '../storage/sourceIndexTypes'

type Box = [number, number, number, number]
interface Region { bbox: Box; components: string[] }
interface OperationBounds { length: number; isEmpty: (i: number) => boolean; minX: (i: number) => number; minY: (i: number) => number; maxX: (i: number) => number; maxY: (i: number) => number }

// Small metadata-only cache. No PDF bytes, image data, or grants are retained.
const cache = new Map<string, Promise<ReturnType<typeof catalogPage>>>()

export function imageRegions(coordinates: ArrayLike<number>): Region[] {
  const regions: Region[] = []
  for (let i = 0; i + 5 < coordinates.length; i += 6) {
    const [ax, ay, bx, by, cx, cy] = Array.from({ length: 6 }, (_, j) => coordinates[i + j])
    // PDF.js records three corners; the fourth is needed for rotated images.
    const xs = [ax, bx, cx, bx + cx - ax], ys = [ay, by, cy, by + cy - ay]
    const bbox = normalizedBox([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)])
    if (bbox && area(bbox) >= .001) regions.push({ bbox, components: ['raster'] })
  }
  return regions
}

function normalizedBox(box: number[]): Box | null {
  if (box.length !== 4 || box.some(value => !Number.isFinite(value))) return null
  const [l, t, r, b] = box.map(value => Math.max(0, Math.min(1, value)))
  return r > l && b > t ? [l, t, r, b] : null
}
const area = (box: Box) => (box[2] - box[0]) * (box[3] - box[1])
const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]
const near = (a: Box, b: Box) => a[0] <= b[2] + .012 && b[0] <= a[2] + .012 && a[1] <= b[3] + .012 && b[1] <= a[3] + .012

function captionCandidates(page: IndexedSourcePage) {
  return page.elements.filter(element => element.kind === 'caption_candidate').map(caption => {
    let box = caption.bbox_normalized
    const lineHeight = box[3] - box[1]
    // The text index may label only the caption's first line. Include contiguous
    // lines of similar size; stop at paragraph spacing instead of cutting a caption.
    for (let line = 0; line < 20; line++) {
      const next = page.fragments.filter(({ bbox_normalized: b }) =>
        b[1] >= box[3] - .002 && b[1] <= box[3] + lineHeight * .65 &&
        b[3] > box[3] + .002 && b[3] - b[1] <= lineHeight * 1.25 &&
        b[0] >= caption.bbox_normalized[0] - .015 && b[2] <= caption.bbox_normalized[2] + .015)
      if (!next.length) break
      const top = Math.min(...next.map(item => item.bbox_normalized[1]))
      for (const fragment of next.filter(item => item.bbox_normalized[1] <= top + .003)) box = union(box, fragment.bbox_normalized)
    }
    return { ...caption, bbox_normalized: box }
  })
}

export function catalogPage(page: IndexedSourcePage, input: Region[], warnings: string[] = []) {
  const regions: Region[] = []
  for (const item of input.slice(0, 600)) {
    let current = { bbox: [...item.bbox] as Box, components: [...item.components] }
    for (let i = 0; i < regions.length;) {
      if (!near(current.bbox, regions[i].bbox)) { i++; continue }
      current = { bbox: union(current.bbox, regions[i].bbox), components: [...new Set([...current.components, ...regions[i].components])] }
      regions.splice(i, 1)
      i = 0
    }
    regions.push(current)
  }
  const captions = captionCandidates(page)
  const useful = regions.filter(region => area(region.bbox) >= .004).sort((a, b) => a.bbox[1] - b.bbox[1])
  const anchor = pageImageElement(page).element_id
  return {
    page_number: page.page_number,
    source_element_id: anchor,
    source_only: page.profile.layout_state === 'source_only',
    candidate_count: useful.length,
    omitted_candidates: Math.max(0, useful.length - 12),
    warnings: [...warnings, ...(input.length > 600 ? ['drawing_inventory_capped_use_original_page'] : []), 'regions_and_caption_associations_are_unverified', 'raster_objects_may_exclude_separate_axis_labels_or_legends'],
    captions: captions.slice(0, 12).map(caption => ({ element_id: caption.element_id, text: caption.text.slice(0, 280), bbox: caption.bbox_normalized })),
    candidates: useful.slice(0, 12).map((region, index) => {
      const caption = captions.map(item => {
        const box = item.bbox_normalized
        const overlap = Math.min(region.bbox[2], box[2]) - Math.max(region.bbox[0], box[0])
        const distance = Math.min(Math.abs(box[1] - region.bbox[3]), Math.abs(region.bbox[1] - box[3]))
        return { item, distance, eligible: overlap > .08 && distance < .06 }
      }).filter(item => item.eligible).sort((a, b) => a.distance - b.distance)[0]?.item
      const context = caption ? union(region.bbox, caption.bbox_normalized) : region.bbox
      const bbox = normalizedBox([context[0] - .025, context[1] - .025, context[2] + .025, context[3] + .025])!
      // Avoid a sliver of adjacent body text at the crop edge. Do not trim text
      // inside the detected object: that may be an axis, legend or panel label.
      const overlaps = (box: Box) => Math.min(context[2], box[2]) > Math.max(context[0], box[0])
      for (const element of page.elements) {
        const box = element.bbox_normalized
        if (element.kind === 'paragraph_candidate' && overlaps(box) && box[3] <= context[1] && box[3] > bbox[1]) bbox[1] = Math.min(context[1], box[3] + .004)
      }
      if (caption) for (const fragment of page.fragments) {
        const box = fragment.bbox_normalized
        if (overlaps(box) && box[1] >= context[3] + .004 && box[1] < bbox[3]) bbox[3] = Math.max(context[3], box[1] - .004)
      }
      return {
        candidate_id: `page-${page.page_number}-visual-${index + 1}`,
        components: region.components,
        kind: area(region.bbox) > .85 ? 'page_sized_image_or_graphic' : 'graphic_region_candidate',
        object_bbox: region.bbox,
        caption_element_id: caption?.element_id ?? null,
        caption: caption?.text.slice(0, 280) ?? null,
        suggested_view: { page_number: page.page_number, bbox },
      }
    }),
    fallback_view: { page_number: page.page_number, bbox: [0, 0, 1, 1] },
  }
}

async function detectPage(page: IndexedSourcePage) {
  const [lease, pdfjs] = await Promise.all([acquireSourcePdf(page.source_id), loadPdfjs()])
  const canvas = document.createElement('canvas')
  try {
    const pdfPage = await lease.document.getPage(page.page_number)
    const original = pdfPage.getViewport({ scale: 1 })
    const viewport = pdfPage.getViewport({ scale: Math.min(1, 600 / Math.max(original.width, original.height)) })
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable for local figure detection.')
    const operators = await pdfPage.getOperatorList({ annotationMode: 0 })
    const task = pdfPage.render({ canvas, canvasContext: context, viewport, annotationMode: 0, recordImages: true, recordOperations: true })
    const timeout = setTimeout(() => task.cancel(), 12_000)
    try { await task.promise } finally { clearTimeout(timeout) }
    const coordinates: unknown = pdfPage.imageCoordinates
    const regions = coordinates && typeof coordinates === 'object' && 'length' in coordinates
      ? imageRegions(coordinates as ArrayLike<number>) : []
    const bounds = pdfPage.recordedBBoxes as OperationBounds | null
    const paths = new Set<number>([pdfjs.OPS.constructPath, pdfjs.OPS.stroke, pdfjs.OPS.fill, pdfjs.OPS.eoFill, pdfjs.OPS.fillStroke, pdfjs.OPS.eoFillStroke])
    const warnings: string[] = []
    if (bounds && typeof bounds.minX === 'function' && typeof bounds.isEmpty === 'function') {
      for (let i = 0; i < Math.min(operators.fnArray.length, bounds.length); i++) {
        if (!paths.has(operators.fnArray[i]) || bounds.isEmpty(i)) continue
        const box = normalizedBox([bounds.minX(i), bounds.minY(i), bounds.maxX(i), bounds.maxY(i)])
        if (box && area(box) < .85) regions.push({ bbox: box, components: ['vector'] })
      }
    } else warnings.push('vector_bounds_unavailable_use_original_page')
    return catalogPage(page, regions, warnings)
  } finally { canvas.width = 0; canvas.height = 0; lease.release() }
}

export async function getSourceVisualCatalog(sourceId: string, start: number, end: number, pageCount: number, cursor?: number) {
  const first = cursor ?? start
  if (![start, end, first].every(Number.isSafeInteger) || start < 1 || end < start || end > pageCount || first < start || first > end) throw new Error('Choose a valid PDF page range and use next_call for continuation.')
  const last = Math.min(first + 3, end)
  const pages = await getBrowserSourcePages(sourceId, first, last)
  if (pages.length !== last - first + 1 || pages.some((page, i) => page.source_id !== sourceId || page.page_number !== first + i)) throw new Error('Wait for these pages to finish indexing before requesting their figure catalog.')
  const items = []
  // Two pages at a time keeps CPU/memory bounded while avoiding serial host calls.
  for (let offset = 0; offset < pages.length; offset += 2) {
    items.push(...await Promise.all(pages.slice(offset, offset + 2).map(page => {
      const key = `${sourceId}:${page.index_version}:${page.page_number}`
      let pending = cache.get(key)
      if (!pending) {
        pending = detectPage(page).catch((cause: unknown) => { cache.delete(key); return catalogPage(page, [], [cause instanceof Error ? cause.message : 'Visual detection failed; use the original page.']) })
        cache.set(key, pending)
        if (cache.size > 48) cache.delete(cache.keys().next().value!)
      }
      return pending
    })))
  }
  return {
    source_id: sourceId, requested_range: [start, end], pages: items,
    next_call: last < end ? { tool: 'get_source_visual_catalog', arguments: { source_id: sourceId, page_start: start, page_end: end, cursor: last + 1 } } : null,
    instructions: 'Use indexed text and these caption/region candidates to select relevant visuals. Pass up to four suggested_view objects to inspect_source_visual views, then inspect actual pixels. Check axes, legends and full-page context before reusing a crop. Candidates can merge or miss figures. No original encoded image files or numeric chart data are extracted. Image crops render PDF objects, including vectors, at the requested display resolution.',
  }
}

import type { SourceVisualRequest } from '../reader/sourceInspectionBridge'

export const cropSchema = { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number', minimum: 0, maximum: 1 } }

export function normalizeVisualRequest(args: Record<string, unknown>, pageCount: number): SourceVisualRequest[] {
  if (args.views !== undefined && (args.page_number !== undefined || args.bbox !== undefined)) throw new Error('Choose views for a batch OR page_number/bbox for one detailed view.')
  const views = args.views ?? [{ page_number: args.page_number, bbox: args.bbox }]
  if (!Array.isArray(views) || views.length < 1 || views.length > 4) throw new Error('Choose one to four relevant source views per call.')
  return views.map(view => {
    if (typeof view !== 'object' || view === null || Array.isArray(view)) throw new Error('Each view needs a page_number and optional normalized bbox.')
    const page = Number(view.page_number)
    if (!Number.isSafeInteger(page) || page < 1 || page > pageCount) throw new Error(`Choose PDF pages within 1–${pageCount}.`)
    const bbox = view.bbox ?? [0, 0, 1, 1]
    if (!Array.isArray(bbox) || bbox.length !== 4 || bbox.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) throw new Error('Invalid normalized crop. Use [left, top, right, bottom] within 0–1; retain relevant axes, legends and labels.')
    return { page_number: page, bbox: bbox as SourceVisualRequest['bbox'] }
  })
}

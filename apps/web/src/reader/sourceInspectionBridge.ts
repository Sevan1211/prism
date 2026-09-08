export const SOURCE_INSPECTION_EVENT = 'prism:inspect-source-page'
export interface SourceVisualRequest { page_number: number; bbox: [number, number, number, number] }
export interface Inspection { requestId: number; sourceId: string; page: number; bbox: [number, number, number, number]; views?: SourceVisualRequest[]; complete: (result: object) => void }
let requestId = 0

export function inspectSourcePage(sourceId: string, page: number, bbox: [number, number, number, number]): Promise<object> {
  return openInspection(sourceId, page, bbox)
}

export function inspectSourcePages(sourceId: string, views: SourceVisualRequest[]): Promise<object> {
  if (!views.length || views.length > 4) return Promise.resolve({ error: 'Choose one to four source views.' })
  return openInspection(sourceId, views[0].page_number, views[0].bbox, views)
}

function openInspection(sourceId: string, page: number, bbox: [number, number, number, number], views?: SourceVisualRequest[]): Promise<object> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ error: 'Page rendering did not finish. Inspect the visible page or retry.' }), 20_000)
    window.dispatchEvent(new CustomEvent<Inspection>(SOURCE_INSPECTION_EVENT, { detail: { requestId: ++requestId, sourceId, page, bbox, views, complete: (result) => { clearTimeout(timeout); resolve(result) } } }))
  })
}

export function closeSourceInspection(): void { window.dispatchEvent(new Event(`${SOURCE_INSPECTION_EVENT}:close`)) }

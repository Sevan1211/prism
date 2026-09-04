export const SOURCE_INSPECTION_EVENT = 'prism:inspect-source-page'
export interface Inspection { sourceId: string; page: number; bbox: [number, number, number, number]; complete: (result: object) => void }

export function inspectSourcePage(sourceId: string, page: number, bbox: [number, number, number, number]): Promise<object> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ error: 'Page rendering did not finish. Inspect the visible page or retry.' }), 20_000)
    window.dispatchEvent(new CustomEvent<Inspection>(SOURCE_INSPECTION_EVENT, { detail: { sourceId, page, bbox, complete: (result) => { clearTimeout(timeout); resolve(result) } } }))
  })
}

export function closeSourceInspection(): void { window.dispatchEvent(new Event(`${SOURCE_INSPECTION_EVENT}:close`)) }

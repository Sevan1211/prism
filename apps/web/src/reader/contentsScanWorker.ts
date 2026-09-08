import type { IndexedSourcePage } from '../storage/sourceIndexTypes'
import { scanDocumentContents, type ContentsScan } from './documentContentsScanner'

/** Keep document-wide analysis off the reading thread. Nothing leaves the browser. */
export function scanContentsInWorker(pages: IndexedSourcePage[], pageCount: number): Promise<ContentsScan> {
  if (typeof Worker === 'undefined') return Promise.resolve(scanDocumentContents(pages, pageCount))
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./contents.worker.ts', import.meta.url), { type: 'module' })
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Contents analysis timed out. Try reopening the source.')) }, 60_000)
    const finish = () => { clearTimeout(timeout); worker.terminate() }
    worker.onmessage = (event: MessageEvent<ContentsScan>) => { finish(); resolve(event.data) }
    worker.onerror = () => { finish(); reject(new Error('Contents analysis failed. The original source is still available.')) }
    worker.postMessage({ pages, pageCount })
  })
}

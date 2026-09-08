import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdfjs } from '../pdfjs'
import { pdfDocumentOptions } from '../pdfResources'
import { createBrowserSourceObjectUrl } from './browserSources'

interface Entry { promise: Promise<PDFDocumentProxy>; users: number; dispose: () => void; timer?: ReturnType<typeof setTimeout> }
const documents = new Map<string, Entry>()

// Share parsing between nearby figures. Idle PDFs are released after 15 seconds.
export async function acquireSourcePdf(sourceId: string): Promise<{ document: PDFDocumentProxy; release: () => void }> {
  let entry = documents.get(sourceId)
  if (!entry) {
    let destroy: (() => void) | undefined
    let disposed = false
    const created: Entry = {
      users: 0,
      dispose: () => {
        if (disposed) return
        disposed = true
        if (created.timer) clearTimeout(created.timer)
        if (documents.get(sourceId) === created) documents.delete(sourceId)
        destroy?.()
      },
      promise: loadPdfjs().then(async (pdfjs) => {
        const file = await createBrowserSourceObjectUrl(sourceId)
        destroy = file.revoke
        const task = pdfjs.getDocument({ url: file.url, ...pdfDocumentOptions(pdfjs.version) })
        destroy = () => { void task.destroy().catch(() => undefined); file.revoke() }
        return await task.promise
      }).catch((error: unknown) => {
        created.dispose()
        throw error
      }),
    }
    entry = created
    documents.set(sourceId, created)
  }
  if (entry.timer) clearTimeout(entry.timer)
  entry.users++
  let released = false
  const release = () => {
    if (released) return
    released = true
    entry.users--
    if (!entry.users && documents.get(sourceId) === entry) entry.timer = setTimeout(entry.dispose, 15_000)
  }
  try { return { document: await entry.promise, release } } catch (error) { release(); throw error }
}

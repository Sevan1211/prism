import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { pdfDocumentOptions } from '../pdfResources'
import {
  INDEX_PAGE_BATCH_SIZE,
  type IndexedSourcePage,
  type SourceIndexRequest,
  type SourceIndexWorkerMessage,
} from './sourceIndexTypes'
import { buildIndexedSourcePage } from './sourceIntelligence'
import { textFragment } from './pdfTextGeometry'

interface WorkerScope {
  onmessage: ((event: MessageEvent<SourceIndexRequest | { type: 'batch_saved' }>) => void) | null
  postMessage: (message: SourceIndexWorkerMessage) => void
}

const workerScope = self as unknown as WorkerScope
let acknowledgeBatch: (() => void) | undefined

workerScope.onmessage = (event) => {
  if ('type' in event.data) { acknowledgeBatch?.(); acknowledgeBatch = undefined; return }
  void extractSource(event.data).catch((cause: unknown) => {
    workerScope.postMessage({
      message: cause instanceof Error ? cause.message : 'The local evidence index could not be built.',
      name: cause instanceof Error ? cause.name : 'IndexError',
      type: 'error',
    })
  })
}

async function extractSource(request: SourceIndexRequest): Promise<void> {
  const pdfjs = await import('pdfjs-dist')
  const bytes = new Uint8Array(await request.file.arrayBuffer())
  // The display API's automatic setup reads window/document. This extractor is
  // itself a worker, so supply the parser port and resource-fetch policy explicitly.
  const parserPort = new Worker(new URL(pdfWorkerUrl, self.location.href), { type: 'module' })
  const parser = pdfjs.PDFWorker.create({ port: parserPort })
  let task: ReturnType<typeof pdfjs.getDocument> | undefined
  const batch: IndexedSourcePage[] = []

  try {
    task = pdfjs.getDocument({
      data: bytes,
      ...pdfDocumentOptions(pdfjs.version),
      worker: parser,
      useWorkerFetch: true,
      disableFontFace: true,
    })
    const document = await task.promise
    const startPage = Math.min(Math.max(1, request.startPage), document.numPages + 1)
    for (let pageNumber = startPage; pageNumber <= document.numPages; pageNumber += 1) {
      let page: Awaited<ReturnType<typeof document.getPage>> | undefined
      try {
        page = await document.getPage(pageNumber)
        const [content, viewport] = await Promise.all([
          page.getTextContent({ includeMarkedContent: false }),
          Promise.resolve(page.getViewport({ scale: 1 })),
        ])
        const fragments = content.items.flatMap((item) => (
          'str' in item ? [textFragment(item, viewport, pdfjs.Util, content.styles[item.fontName])] : []
        ))
        batch.push(buildIndexedSourcePage({
          fragments,
          height: viewport.height,
          pageNumber,
          rotation: viewport.rotation,
          sourceId: request.sourceId,
          width: viewport.width,
        }))
      } catch {
        const viewport = page?.getViewport({ scale: 1 })
        const fallback = buildIndexedSourcePage({ fragments: [], height: viewport?.height ?? 0, width: viewport?.width ?? 0, rotation: viewport?.rotation ?? 0, pageNumber, sourceId: request.sourceId })
        fallback.profile.warnings.push('page_text_extraction_failed')
        batch.push(fallback)
      } finally {
        page?.cleanup()
      }
      if (batch.length >= INDEX_PAGE_BATCH_SIZE || pageNumber === document.numPages) {
        const saved = new Promise<void>((resolve) => { acknowledgeBatch = resolve })
        workerScope.postMessage({ pages: batch.splice(0), type: 'batch' })
        await saved
      }
      workerScope.postMessage({ page: pageNumber, total: document.numPages, type: 'progress' })
    }
    workerScope.postMessage({ type: 'complete' })
  } finally {
    try { await task?.destroy() } finally {
      parser.destroy()
      parserPort.terminate()
    }
  }
}

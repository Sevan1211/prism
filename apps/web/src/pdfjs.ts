import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// PDF.js is loaded only when a learner imports or opens a source. The library
// shell should not pay its bundle and browser-global cost on first paint.
export async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  return pdfjs
}

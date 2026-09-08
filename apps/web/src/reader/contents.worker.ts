import { scanDocumentContents } from './documentContentsScanner'
import type { IndexedSourcePage } from '../storage/sourceIndexTypes'

self.onmessage = (event: MessageEvent<{ pages: IndexedSourcePage[]; pageCount: number }>) => {
  self.postMessage(scanDocumentContents(event.data.pages, event.data.pageCount))
}

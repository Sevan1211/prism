import type {
  IndexedSourcePage,
  SourceIndexRequest,
  SourceIndexWorkerMessage,
} from './sourceIndexTypes'

export interface SourcePageExtractorOptions {
  onBatch: (pages: IndexedSourcePage[]) => Promise<void>
  onProgress?: (page: number, total: number) => void
}

export type SourcePageExtractor = (
  file: File,
  sourceId: string,
  startPage: number,
  options: SourcePageExtractorOptions,
) => Promise<void>

export const extractSourcePagesInWorker: SourcePageExtractor = (
  file,
  sourceId,
  startPage,
  options,
) => new Promise((resolve, reject) => {
  const worker = new Worker(new URL('./sourceIndex.worker.ts', import.meta.url), { type: 'module' })
  let batchWrite = Promise.resolve()
  let settled = false

  const finish = (result: 'resolve' | 'reject', cause?: Error) => {
    if (settled) return
    settled = true
    worker.terminate()
    if (result === 'resolve') resolve()
    else reject(cause ?? new Error('The local evidence-index worker stopped unexpectedly.'))
  }

  worker.onmessage = (event: MessageEvent<SourceIndexWorkerMessage>) => {
    const message = event.data
    if (message.type === 'batch') {
      batchWrite = batchWrite.then(async () => {
        if (settled) return
        await options.onBatch(message.pages)
        if (!settled) worker.postMessage({ type: 'batch_saved' })
      })
      batchWrite.catch((cause: unknown) => {
        finish('reject', cause instanceof Error ? cause : new Error('Local index storage failed.'))
      })
      return
    }
    if (message.type === 'progress') {
      options.onProgress?.(message.page, message.total)
      return
    }
    if (message.type === 'error') {
      finish('reject', new Error(message.message, { cause: message.name }))
      return
    }
    if (message.type === 'complete') {
      void batchWrite.then(
        () => finish('resolve'),
        (cause: unknown) => finish(
          'reject',
          cause instanceof Error ? cause : new Error('Local index storage failed.'),
        ),
      )
    }
  }
  worker.onerror = (event) => {
    finish('reject', new Error(event.message || 'The local evidence-index worker crashed.'))
  }

  const request: SourceIndexRequest = { file, sourceId, startPage }
  worker.postMessage(request)
})

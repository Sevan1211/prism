import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IndexedSourcePage } from './sourceIndexTypes'
import { extractSourcePagesInWorker } from './sourceIndexWorker'

class FakeWorker {
  static current: FakeWorker | null = null

  onerror: ((event: ErrorEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()

  constructor() {
    FakeWorker.current = this
  }

  emit(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data }))
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  FakeWorker.current = null
})

describe('source index worker bridge', () => {
  it('acknowledges a batch only after storage has committed it', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    let commit: (() => void) | undefined
    const extraction = extractSourcePagesInWorker(new File(['pdf'], 'test.pdf'), 'source', 1, { onBatch: () => new Promise<void>((resolve) => { commit = resolve }) })
    const worker = FakeWorker.current!
    worker.emit({ pages: [{ page_number: 1 }], type: 'batch' })
    await Promise.resolve()
    expect(worker.postMessage).not.toHaveBeenCalledWith({ type: 'batch_saved' })
    commit?.()
    await Promise.resolve()
    await Promise.resolve()
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'batch_saved' })
    worker.emit({ type: 'complete' })
    await extraction
  })
  it('waits for the explicit complete event and flushes queued page batches', async () => {
    vi.stubGlobal('Worker', FakeWorker)
    const onBatch = vi.fn(async () => undefined)
    let settled = false
    const extraction = extractSourcePagesInWorker(
      new File(['%PDF-worker'], 'worker.pdf', { type: 'application/pdf' }),
      'source-1',
      1,
      { onBatch },
    ).finally(() => {
      settled = true
    })
    const worker = FakeWorker.current
    if (!worker) throw new Error('Expected the worker bridge to create a worker.')

    worker.emit({ type: 'ready' })
    await Promise.resolve()
    expect(settled).toBe(false)

    const page = { page_number: 1 } as IndexedSourcePage
    worker.emit({ pages: [page], type: 'batch' })
    worker.emit({ type: 'complete' })
    await extraction

    expect(onBatch).toHaveBeenCalledWith([page])
    expect(worker.terminate).toHaveBeenCalledOnce()
  })
})

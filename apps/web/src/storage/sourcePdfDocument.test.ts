import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), file: vi.fn() }))
vi.mock('../pdfjs', () => ({ loadPdfjs: async () => ({ getDocument: mocks.getDocument, version: '6.2.108' }) }))
vi.mock('./browserSources', () => ({ createBrowserSourceObjectUrl: mocks.file }))

import { acquireSourcePdf } from './sourcePdfDocument'

describe('shared PDF lifetime', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
  afterEach(() => { vi.runAllTimers(); vi.useRealTimers() })

  it('shares a document and keeps it alive while any figure is using it', async () => {
    const revoke = vi.fn()
    const destroy = vi.fn().mockResolvedValue(undefined)
    const document = { numPages: 4 }
    mocks.file.mockResolvedValue({ url: 'blob:shared', revoke })
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve(document), destroy })
    const [first, second] = await Promise.all([acquireSourcePdf('shared'), acquireSourcePdf('shared')])
    expect(first.document).toBe(second.document)
    expect(mocks.getDocument).toHaveBeenCalledTimes(1)
    expect(mocks.getDocument.mock.calls[0][0]).toMatchObject({ cMapPacked: true })
    first.release()
    await vi.advanceTimersByTimeAsync(16_000)
    expect(destroy).not.toHaveBeenCalled()
    second.release()
    second.release()
    await vi.advanceTimersByTimeAsync(15_000)
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledTimes(1)
  })

  it('releases failed loads and permits a retry without an old timer evicting it', async () => {
    const revokeFailed = vi.fn()
    const revokeRetry = vi.fn()
    const destroyFailed = vi.fn().mockResolvedValue(undefined)
    const destroyRetry = vi.fn().mockResolvedValue(undefined)
    mocks.file.mockResolvedValueOnce({ url: 'blob:failed', revoke: revokeFailed })
      .mockResolvedValueOnce({ url: 'blob:retry', revoke: revokeRetry })
    mocks.getDocument.mockImplementationOnce(() => ({ promise: Promise.reject(new Error('damaged PDF')), destroy: destroyFailed }))
      .mockImplementation(() => ({ promise: Promise.resolve({ numPages: 2 }), destroy: destroyRetry }))
    await expect(acquireSourcePdf('retry')).rejects.toThrow('damaged PDF')
    expect(revokeFailed).toHaveBeenCalledOnce()
    const retry = await acquireSourcePdf('retry')
    await vi.advanceTimersByTimeAsync(16_000)
    const concurrent = await acquireSourcePdf('retry')
    expect(mocks.getDocument).toHaveBeenCalledTimes(2)
    expect(revokeRetry).not.toHaveBeenCalled()
    retry.release()
    concurrent.release()
  })

  it('revokes the object URL if PDF task creation throws synchronously', async () => {
    const revoke = vi.fn()
    mocks.file.mockResolvedValue({ url: 'blob:sync-error', revoke })
    mocks.getDocument.mockImplementationOnce(() => { throw new Error('worker unavailable') })
    await expect(acquireSourcePdf('sync-error')).rejects.toThrow('worker unavailable')
    expect(revoke).toHaveBeenCalledOnce()
  })
})

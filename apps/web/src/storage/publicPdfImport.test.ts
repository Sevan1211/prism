import { afterEach, expect, it, vi } from 'vitest'
import { downloadPublicPdf } from './publicPdfImport'

afterEach(() => vi.unstubAllGlobals())
it('downloads a public PDF without credentials and rejects web pages', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('%PDF-1.7\nexample', { status: 200 }))
  vi.stubGlobal('fetch', fetcher)
  const file = await downloadPublicPdf('https://example.com/paper')
  expect(file.name).toBe('paper.pdf')
  expect(await file.text()).toContain('%PDF-1.7')
  expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' })
  fetcher.mockResolvedValue(new Response('<html>Download page</html>', { status: 200 }))
  await expect(downloadPublicPdf('https://example.com/landing')).rejects.toThrow('web page')
})
it('rejects embedded credentials, insecure URLs and excessive downloads', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('too large', { headers: { 'content-length': String(129 * 1024 * 1024) } }))
  vi.stubGlobal('fetch', fetcher)
  await expect(downloadPublicPdf('http://example.com/file.pdf')).rejects.toThrow('HTTPS')
  await expect(downloadPublicPdf('https://user:secret@example.com/file.pdf')).rejects.toThrow('credentials')
  expect(fetcher).not.toHaveBeenCalled()
  await expect(downloadPublicPdf('https://example.com/file.pdf')).rejects.toThrow('128 MB')
})

import { afterEach, expect, it, vi } from 'vitest'
import { uploadSource } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

it('imports locally without accepting a blanket cloud permission', async () => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const form = init?.body as FormData
    expect(form.get('rights_status')).toBe('open_license')
    expect(form.has('cloud_allowed')).toBe(false)
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)

  await uploadSource(new File(['%PDF-fixture'], 'fixture.pdf'), 'open_license')

  expect(fetchMock).toHaveBeenCalledOnce()
})

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SourceReader } from './SourceReader'
import { createBrowserSourceObjectUrl, getBrowserSourceStructure, type LibrarySource } from '../storage/browserSources'
vi.mock('../Reader', () => ({ Reader: ({ access, onReload }: { access: { pdfUrl: string }; onReload: () => void }) => <div><p>{access.pdfUrl}</p><button onClick={onReload}>Reload PDF</button></div> }))
vi.mock('../storage/useSyncStatus', () => ({ useSyncStatus: () => ({ connected: false }) }))
vi.mock('../storage/browserSources', () => ({ createBrowserSourceObjectUrl: vi.fn(), getBrowserSourceStructure: vi.fn() }))
const source = { id: 'local_test', storage_location: 'browser_vault' } as LibrarySource
const props = { source, onExit: vi.fn() }
afterEach(cleanup)
beforeEach(() => { vi.mocked(getBrowserSourceStructure).mockResolvedValue({ origin: 'none', sections: [], source_id: 'local_test' }) })
it('reopens a PDF with a fresh URL and never renders the revoked URL while loading', async () => {
  const revoke = vi.fn()
  vi.mocked(createBrowserSourceObjectUrl).mockResolvedValueOnce({ url: 'blob:first', revoke })
  const first = render(<SourceReader {...props} />)
  expect(await screen.findByText('blob:first')).toBeVisible()
  first.unmount()
  expect(revoke).toHaveBeenCalledOnce()
  let resolve!: (value: { url: string; revoke: () => void }) => void
  vi.mocked(createBrowserSourceObjectUrl).mockReturnValueOnce(new Promise(done => { resolve = done }))
  render(<SourceReader {...props} />)
  expect(screen.queryByText('blob:first')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Opening your source')
  await act(async () => resolve({ url: 'blob:second', revoke: vi.fn() }))
  expect(await screen.findByText('blob:second')).toBeVisible()
})
it('releases a resource whose download completes after leaving Reader', async () => {
  let resolve!: (value: { url: string; revoke: () => void }) => void
  const revoke = vi.fn()
  vi.mocked(createBrowserSourceObjectUrl).mockReturnValueOnce(new Promise(done => { resolve = done }))
  const view = render(<SourceReader {...props} />); view.unmount()
  await act(async () => resolve({ url: 'blob:late', revoke }))
  expect(revoke).toHaveBeenCalledOnce()
})
it('can retry a failed download and still read a PDF with unavailable outline metadata', async () => {
  vi.mocked(createBrowserSourceObjectUrl).mockRejectedValueOnce(new Error('Network interrupted')).mockResolvedValueOnce({ url: 'blob:retry', revoke: vi.fn() })
  vi.mocked(getBrowserSourceStructure).mockRejectedValueOnce(new Error('Outline unavailable'))
  render(<SourceReader {...props} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('could not open')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('blob:retry')).toBeVisible()
})

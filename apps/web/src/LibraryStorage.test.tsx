import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { LibraryStorage, LibraryStorageHost } from './LibraryStorage'
import { useSyncStatus } from './storage/useSyncStatus'
import { SYNC_CHANGED, syncStatus } from './storage/syncedLibrary'
vi.mock('./storage/useSyncStatus', () => ({ useSyncStatus: vi.fn() }))
vi.mock('./storage/syncedLibrary', () => ({ SYNC_CHANGED: 'prism:sync-changed', syncStatus: vi.fn() }))
const lifetime = vi.hoisted(() => ({ mount: vi.fn(), unmount: vi.fn() }))
vi.mock('./account/AccountPanel', () => ({ AccountPanel: () => {
  useEffect(() => { lifetime.mount(); return lifetime.unmount }, [])
  return <p>Account library options</p>
} }))
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
  const state = { connected: false, state: 'local' as const, detail: 'Saved in this browser', lastSynced: null, pending: 0 }
  vi.mocked(useSyncStatus).mockReturnValue(state)
  vi.mocked(syncStatus).mockReturnValue(state)
})
it('offers account storage without recovery keys or a folder picker', () => {
  render(<><LibraryStorageHost /><LibraryStorage /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Account library options')
  expect(screen.queryByText(/recovery.key/i)).not.toBeInTheDocument()
  expect(screen.queryByText('Choose destination')).not.toBeInTheDocument()
})
it('signals background errors and conflicts without reopening a dismissed dialog', () => {
  const view = render(<><LibraryStorageHost /><LibraryStorage /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close library storage' }))
  for (const state of ['error', 'syncing', 'error', 'conflict'] as const) {
    const status = { connected: true, state, detail: 'Sync needs review', lastSynced: null, pending: 1 }
    vi.mocked(syncStatus).mockReturnValue(status)
    vi.mocked(useSyncStatus).mockReturnValue(status)
    fireEvent(window, new Event(SYNC_CHANGED))
    view.rerender(<><LibraryStorageHost /><LibraryStorage /></>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }
  expect(screen.getByRole('button', { name: 'Library storage' })).toHaveAttribute('data-attention', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Account library options')
})

it('keeps the activated account mounted when the workspace header leaves for the reader', () => {
  const view = render(<><LibraryStorageHost /><LibraryStorage /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close library storage' }))
  view.rerender(<><LibraryStorageHost /><p>Reader page</p></>)
  expect(lifetime.mount).toHaveBeenCalledTimes(1)
  expect(lifetime.unmount).not.toHaveBeenCalled()
  view.rerender(<><LibraryStorageHost /><LibraryStorage /></>)
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Account library options')
  expect(lifetime.mount).toHaveBeenCalledTimes(1)
})

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
it('opens a visible dialog when sync needs a conflict decision', () => {
  render(<><LibraryStorageHost /><LibraryStorage /></>)
  vi.mocked(syncStatus).mockReturnValue({ connected: true, state: 'conflict', detail: 'Two versions need review', lastSynced: null, pending: 1 })
  fireEvent(window, new Event(SYNC_CHANGED))
  expect(screen.getByRole('dialog')).toBeVisible()
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

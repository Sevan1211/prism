import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LibraryStorage } from './LibraryStorage'
import { useSyncStatus } from './storage/useSyncStatus'
import { SYNC_CHANGED, syncStatus } from './storage/syncedLibrary'
vi.mock('./storage/useSyncStatus', () => ({ useSyncStatus: vi.fn() }))
vi.mock('./storage/syncedLibrary', () => ({ SYNC_CHANGED: 'prism:sync-changed', syncStatus: vi.fn() }))
vi.mock('./SyncStoragePanel', () => ({ SyncStoragePanel: () => <p>Encrypted library options</p> }))
afterEach(cleanup)
beforeEach(() => {
  const state = { connected: false, state: 'local' as const, detail: 'Saved in this browser', lastSynced: null, pending: 0 }
  vi.mocked(useSyncStatus).mockReturnValue(state)
  vi.mocked(syncStatus).mockReturnValue(state)
})
it('offers browser storage and encrypted sync without a folder picker', () => {
  render(<LibraryStorage />)
  fireEvent.click(screen.getByRole('button', { name: 'Library storage' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Encrypted library options')
  expect(screen.queryByText('Choose destination')).not.toBeInTheDocument()
})
it('opens a visible dialog when sync needs a conflict decision', () => {
  render(<LibraryStorage />)
  vi.mocked(syncStatus).mockReturnValue({ connected: true, state: 'conflict', detail: 'Two versions need review', lastSynced: null, pending: 1 })
  fireEvent(window, new Event(SYNC_CHANGED))
  expect(screen.getByRole('dialog')).toBeVisible()
})

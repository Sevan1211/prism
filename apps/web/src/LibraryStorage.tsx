import { useEffect, useRef, useState } from 'react'
import { CloudCheck, HardDrive, X } from '@phosphor-icons/react'
import { SyncStoragePanel } from './SyncStoragePanel'
import { useSyncStatus } from './storage/useSyncStatus'
import { SYNC_CHANGED, syncStatus } from './storage/syncedLibrary'

export function LibraryStorage({ compact = false }: { compact?: boolean }) {
  const synced = useSyncStatus()
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    let shown = ''
    const attention = () => {
      const next = syncStatus()
      const message = ['conflict', 'error'].includes(next.state) ? `${next.state}:${next.detail}` : ''
      if (message && message !== shown) setOpen(true)
      shown = message
    }
    window.addEventListener(SYNC_CHANGED, attention)
    return () => window.removeEventListener(SYNC_CHANGED, attention)
  }, [])
  useEffect(() => { if (open) dialog.current?.showModal?.(); else dialog.current?.close?.() }, [open])
  const label = synced.connected ? ({ syncing: 'Syncing…', synced: 'Synced', offline: 'Offline', conflict: 'Review sync', error: 'Sync needs attention', local: 'Local' })[synced.state] : 'Browser only'
  return <>
    <button className={`storage-header-button${compact ? ' storage-compact' : ''}`} type="button" onClick={() => setOpen(true)} data-attention={['conflict', 'error'].includes(synced.state)} aria-label="Library storage" title={`Library storage · ${label}`}>
      {synced.connected ? <CloudCheck aria-hidden="true" /> : <HardDrive aria-hidden="true" />}{!compact && <span>{label}</span>}
    </button>
    <dialog ref={dialog} className="storage-dialog" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="storage-heading">
      <header><div><p className="page-kicker">Your library, connected</p><h2 id="storage-heading">Library storage</h2></div><button type="button" className="icon-button" aria-label="Close library storage" onClick={() => setOpen(false)}><X /></button></header>
      <SyncStoragePanel />
    </dialog>
  </>
}

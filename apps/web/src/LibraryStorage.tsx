import { useEffect, useRef, useState } from 'react'
import { CloudCheck, HardDrive, X } from '@phosphor-icons/react'
import { useSyncStatus } from './storage/useSyncStatus'
import { SYNC_CHANGED, syncStatus } from './storage/syncedLibrary'
import { AccountPanel } from './account/AccountPanel'
import { consumeAccountReturnFlag, isAccountReturn } from './account/accountReturn'
import { containDialogFocus } from './workspace/dialogKeyboard'

export function LibraryStorage({ compact = false }: { compact?: boolean }) {
  const synced = useSyncStatus()
  const [open, setOpen] = useState(() => isAccountReturn(window.location.search))
  const [activated, setActivated] = useState(() => isAccountReturn(window.location.search) || Object.keys(localStorage).some(key => key.startsWith('prism-cloud-enabled:') && localStorage.getItem(key) === 'true'))
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { consumeAccountReturnFlag() }, [])
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
  const label = synced.connected ? ({ syncing: 'Syncing…', synced: 'Synced', offline: 'Offline', conflict: 'Review sync', error: 'Sync needs attention', local: 'Local' })[synced.state] : 'This browser'
  return <>
    <button className={`storage-header-button${compact ? ' storage-compact' : ''}`} type="button" onClick={() => { setActivated(true); setOpen(true) }} data-attention={['conflict', 'error'].includes(synced.state)} aria-label="Library storage" title={`Library storage · ${label}`}>
      {synced.connected ? <CloudCheck aria-hidden="true" /> : <HardDrive aria-hidden="true" />}{!compact && <span>Storage<span className="storage-button-detail"> · {label}</span></span>}
    </button>
    <dialog ref={dialog} className="storage-dialog account-storage-dialog" tabIndex={-1} onKeyDown={containDialogFocus} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="storage-heading">
      <header><div><p className="page-kicker">PRISM</p><h2 id="storage-heading">Account & storage</h2></div><button type="button" className="icon-button" aria-label="Close library storage" onClick={() => setOpen(false)}><X /></button></header>
      <div className="dialog-body account-dialog-body">{(activated || open) && <AccountPanel />}</div>
    </dialog>
  </>
}

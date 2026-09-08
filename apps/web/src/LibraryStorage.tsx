import { useEffect, useRef, useState } from 'react'
import { CloudCheck, HardDrive, X } from '@phosphor-icons/react'
import { useSyncStatus } from './storage/useSyncStatus'
import { AccountPanel } from './account/AccountPanel'
import { consumeAccountReturnFlag, isAccountReturn } from './account/accountReturn'
import { containDialogFocus } from './workspace/dialogKeyboard'

const OPEN_STORAGE = 'prism:open-storage'

/** Mounted once above page navigation, so Reader visits keep their cloud identity. */
export function LibraryStorageHost() {
  const [open, setOpen] = useState(() => isAccountReturn(window.location.search))
  const [activated, setActivated] = useState(() => isAccountReturn(window.location.search) || Object.keys(localStorage).some(key => key.startsWith('prism-cloud-enabled:') && localStorage.getItem(key) === 'true'))
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const show = () => { setActivated(true); setOpen(true) }
    window.addEventListener(OPEN_STORAGE, show)
    return () => window.removeEventListener(OPEN_STORAGE, show)
  }, [])
  useEffect(() => { consumeAccountReturnFlag() }, [])
  useEffect(() => { if (open) dialog.current?.showModal?.(); else dialog.current?.close?.() }, [open])
  return <>
    <dialog ref={dialog} className="storage-dialog account-storage-dialog" tabIndex={-1} onKeyDown={containDialogFocus} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="storage-heading">
      <header><div><p className="page-kicker">PRISM</p><h2 id="storage-heading">Account & storage</h2></div><button type="button" className="icon-button" aria-label="Close library storage" onClick={() => setOpen(false)}><X /></button></header>
      <div className="dialog-body account-dialog-body">{(activated || open) && <AccountPanel />}</div>
    </dialog>
  </>
}

export function LibraryStorage({ compact = false }: { compact?: boolean }) {
  const synced = useSyncStatus()
  const label = synced.connected ? ({ syncing: 'Syncing…', synced: 'Synced', offline: 'Offline', conflict: 'Review sync', error: 'Sync needs attention', local: 'Local' })[synced.state] : 'This browser'
  return <button className={`storage-header-button${compact ? ' storage-compact' : ''}`} type="button" onClick={() => window.dispatchEvent(new Event(OPEN_STORAGE))} data-attention={['conflict', 'error'].includes(synced.state)} aria-label="Library storage" title={`Library storage · ${label}`}>
    {synced.connected ? <CloudCheck aria-hidden="true" /> : <HardDrive aria-hidden="true" />}{!compact && <span>Storage<span className="storage-button-detail"> · {label}</span></span>}
  </button>
}

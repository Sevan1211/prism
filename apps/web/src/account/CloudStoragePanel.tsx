import { useEffect, useState } from 'react'
import { ArrowClockwise, Cloud, HardDrive, ShieldCheck } from '@phosphor-icons/react'
import { cloudLibraryInfo, connectCloudLibrary, deleteSyncedLibrary, disconnectSyncedLibrary, resolveSyncConflict, syncNow, type CloudLibraryInfo } from '../storage/syncedLibrary'
import { useSyncStatus } from '../storage/useSyncStatus'

export function CloudStoragePanel() {
  const status = useSyncStatus()
  const [info, setInfo] = useState<CloudLibraryInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copy, setCopy] = useState(false)
  const [consent, setConsent] = useState(false)
  const [deleteWord, setDeleteWord] = useState('')
  async function refresh() { setInfo(await cloudLibraryInfo()) }
  useEffect(() => { let active = true; void cloudLibraryInfo().then(value => { if (active) setInfo(value) }).catch(cause => { if (active) setError(cause.message) }); return () => { active = false } }, [status.lastSynced])
  async function act(work: () => Promise<void>) {
    setBusy(true); setError('')
    try { await work(); await refresh() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Cloud storage could not finish. Please retry.') }
    finally { setBusy(false) }
  }
  const percent = info ? Math.min(100, info.usedBytes / info.quotaBytes * 100) : 0
  return <section className="cloud-storage" aria-label="Cloud library">
    <div className="cloud-storage-heading"><div><p className="page-kicker">A place for your reading</p><h3>Your cloud library</h3><p>PDFs, lessons, folders, and your place in the original.</p></div><Cloud aria-hidden="true" /></div>
    <div className="cloud-allowance"><div><strong>1 GB</strong><span>{info ? `${(info.usedBytes / 1_000_000).toFixed(1)} MB used · files and saved versions` : 'Storage allowance per account'}</span></div><progress value={percent} max={100} aria-label="Cloud storage used" /></div>
    {info?.mode === 'local' && <p className="account-notice">Local storage test: files go to Cloudflare’s emulator on this computer. Cross-device cloud storage starts after the Cloudflare service is deployed.</p>}
    {error && <div className="account-notice" role="alert"><p>{error}</p><button className="button-secondary" disabled={busy} onClick={() => void act(refresh)}>Retry connection</button></div>}
    {status.connected ? <>
      <div className="sync-status" data-state={status.state} role="status"><span className="sync-dot" /><div><strong>{({ local: 'On this browser', syncing: 'Saving changes…', synced: 'Up to date', offline: 'Saved here · waiting for connection', conflict: 'Choose a version', error: 'Needs attention' })[status.state]}</strong><p>{status.detail}</p></div></div>
      <div className="storage-actions"><button className="button-secondary" disabled={busy} onClick={() => void act(syncNow)}><ArrowClockwise />Sync now</button><button className="button-quiet" disabled={busy} onClick={() => void act(disconnectSyncedLibrary)}><HardDrive />Use browser library</button></div>
      {status.state === 'conflict' && <div className="account-notice"><p>Both versions are saved on this browser. Choose which version to keep working with.</p><div className="storage-actions"><button disabled={busy} className="button-secondary" onClick={() => void act(() => resolveSyncConflict('local'))}>Keep this version</button><button disabled={busy} className="button-secondary" onClick={() => void act(() => resolveSyncConflict('remote'))}>Use cloud version</button></div></div>}
      <p className="account-privacy"><ShieldCheck />Only your signed-in account can access this library. Source access for agents stays a separate choice on each browser.</p>
      <details className="cloud-delete"><summary>Delete cloud library</summary><p>Remove the cloud files and saved history. Your original browser library and downloaded copies stay on their devices. This action cannot be undone.</p><label>Type DELETE to confirm<input value={deleteWord} onChange={event => setDeleteWord(event.target.value)} autoComplete="off" /></label><button disabled={busy || deleteWord !== 'DELETE'} className="button-secondary" onClick={() => void act(async () => { await deleteSyncedLibrary(); setDeleteWord('') })}>Delete cloud library</button></details>
    </> : info?.library?.deleted === 1 ? <p className="account-notice">This cloud library was deleted. Your browser library is still available.</p> : info?.library && !info.library.deleted ? <div className="cloud-start"><p>Your cloud library is ready to open. Your original browser library stays separate.</p><button disabled={busy} className="button-primary" onClick={() => void act(() => connectCloudLibrary(false, false))}>{busy ? 'Opening…' : 'Open cloud library'}</button></div> : info && <div className="cloud-start">
      <h4>Choose what travels with you.</h4>
      <label className="sync-checkbox"><input type="checkbox" checked={copy} onChange={event => setCopy(event.target.checked)} />Copy this browser’s PDFs, lessons, folders and reading history.</label>
      <p className="storage-help">Leave this off to start an empty cloud library. Original local files stay intact. New imports and edits inside the cloud library will sync automatically.</p>
      <label className="sync-checkbox"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />{info.mode === 'local' ? 'I agree to test account storage on this computer.' : 'I agree to store my library with PRISM on Cloudflare.'}</label>
      <p className="storage-help">Protected in transit and at rest. PRISM’s service can read stored data; this is not end-to-end encryption.</p>
      <button disabled={busy || !consent} className="button-primary" onClick={() => void act(() => connectCloudLibrary(true, copy))}>{busy ? 'Preparing your library…' : info.mode === 'local' ? 'Create local test library' : 'Create cloud library'}</button>
    </div>}
  </section>
}

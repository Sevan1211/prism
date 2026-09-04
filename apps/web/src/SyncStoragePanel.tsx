import { useEffect, useState } from 'react'
import { ArrowClockwise, Check, CloudCheck, Copy, DownloadSimple, Key, LinkSimple } from '@phosphor-icons/react'
import { downloadRecoveryKey } from './storage/recoveryBackup'
import { verifyConnectedRecoveryKey } from './storage/syncedLibrary'
import { connectedBrowsers, connectSyncedLibrary, createSyncedLibrary, deleteSyncedLibrary, disconnectSyncedLibrary, newRecoveryKey, resolveSyncConflict, restoreSyncedLibrary, revokeBrowser, startSyncWatching, syncAvailable, syncNow } from './storage/syncedLibrary'
import { useSyncStatus } from './storage/useSyncStatus'

export function SyncStoragePanel() {
  const status = useSyncStatus()
  const [mode, setMode] = useState<'none' | 'create' | 'connect'>('none')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [recovery, setRecovery] = useState('')
  const [saved, setSaved] = useState(false)
  const [copyLibrary, setCopyLibrary] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [backupKey, setBackupKey] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [browsers, setBrowsers] = useState<Awaited<ReturnType<typeof connectedBrowsers>> | null>(null)
  const [deleteWord, setDeleteWord] = useState('')
  useEffect(() => {
    let active = true
    void syncAvailable().then(value => { if (active) setAvailable(value) })
    void restoreSyncedLibrary().catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'The library connection could not be restored.') })
    const stop = startSyncWatching()
    return () => { active = false; stop() }
  }, [])
  async function act(work: () => Promise<void>) {
    setBusy(true); setError('')
    try { await work() } catch (cause) { setError(cause instanceof Error ? cause.message : 'The connection could not be completed.') }
    finally { setBusy(false) }
  }
  function begin(next: 'create' | 'connect') { setMode(next); setRecovery(next === 'create' ? newRecoveryKey() : ''); setSaved(false); setCopied(false); setError('') }
  return <section className="sync-panel" aria-label="Encrypted library sync">
    <div className="sync-intro"><CloudCheck aria-hidden="true" /><div><h3>{status.connected ? 'Your synced library' : 'One library, in every browser'}</h3><p>{status.connected ? 'This browser connects directly to your encrypted library.' : 'Open the same PDFs, lessons and history in Chrome, ChatGPT and your other browsers.'}</p></div></div>
    <div className="sync-status" data-state={status.state} role="status"><span className="sync-dot" /><div><strong>{({ local: 'Saved on this browser', syncing: 'Syncing', synced: 'Synced', offline: 'Offline · changes pending', conflict: 'Choose a version', error: 'Sync needs attention' })[status.state]}</strong><p>{status.detail}</p></div></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {status.connected ? <>
      {status.state === 'conflict' && <div className="sync-conflict"><p>Choose the version to continue with. Both versions are retained in recovery history on this browser.</p><div className="storage-actions"><button className="button-primary" disabled={busy} onClick={() => void act(() => resolveSyncConflict('local'))}>Keep this browser’s version</button><button className="button-secondary" disabled={busy} onClick={() => void act(() => resolveSyncConflict('remote'))}>Use synced version</button></div></div>}
      <div className="storage-actions"><button className="button-secondary" disabled={busy} onClick={() => void act(syncNow)}><ArrowClockwise /> Sync now</button><button className="button-secondary" disabled={busy} onClick={() => void act(async () => setBrowsers(await connectedBrowsers()))}>Connected browsers</button><button className="button-quiet" disabled={busy} onClick={() => void act(async () => { await disconnectSyncedLibrary(); setBrowsers(null) })}>Return to local library</button></div>
      <aside className="sync-instructions"><h4>Connect another browser</h4><ol><li>Open this same PRISM site in the other browser.</li><li>Open Library storage → <strong>Connect existing library</strong>.</li><li>Enter your saved recovery key. Use the <strong>same key</strong> everywhere.</li></ol><p>The connection is remembered. Wait for <strong>Synced</strong> before switching browsers. Large PDFs take longer to download the first time.</p></aside>
      <details className="sync-backup"><summary>Back up your recovery key</summary><p>Already saved your key? Paste it here to check it and download a text backup. PRISM remembers a secure connection, not a copy of your original key, so it cannot display a lost key.</p><label className="sync-key-label">Saved recovery key<input type="password" autoComplete="off" value={backupKey} onChange={event => { setBackupKey(event.target.value); setDownloaded(false) }} /></label><button className="button-secondary" disabled={busy || !backupKey.trim()} onClick={() => void act(async () => { await verifyConnectedRecoveryKey(backupKey); downloadRecoveryKey(backupKey); setBackupKey(''); setDownloaded(true) })}><DownloadSimple /> Download key (.txt)</button>{downloaded && <p role="status">Download started. Store the file somewhere private; anyone with it can open your library.</p>}</details>
      {browsers && <ul className="sync-browser-list">{browsers.devices.filter(browser => !browser.revoked).map((browser, index) => <li key={browser.id}><div><strong>{browser.id === browsers.current ? 'This browser' : `Connected browser ${index + 1}`}</strong><span>Connected {new Date(browser.created).toLocaleString()}</span></div><button className="button-quiet" disabled={busy} onClick={() => void act(async () => { await revokeBrowser(browser.id); setBrowsers(browser.id === browsers.current ? null : await connectedBrowsers()) })}>Disconnect</button></li>)}</ul>}
      <details className="sync-delete"><summary>Delete encrypted cloud library</summary><p>This removes synced PDFs and history from the server and disconnects the library. Downloaded local copies remain on their devices.</p><label>Type DELETE to confirm<input value={deleteWord} onChange={event => setDeleteWord(event.target.value)} autoComplete="off" /></label><button className="button-secondary" disabled={busy || deleteWord !== 'DELETE'} onClick={() => void act(async () => { await deleteSyncedLibrary(); setDeleteWord(''); setBrowsers(null) })}>Delete cloud library</button></details>
    </> : <>
      {mode === 'none' ? <>
        <p>PRISM encrypts your library in this browser before storing a copy online. PDF processing stays on your device. No account is required.</p>
        <div className="storage-actions"><button className="button-primary" disabled={busy || available !== true} onClick={() => begin('create')}><CloudCheck /> Enable encrypted sync</button><button className="button-secondary" disabled={busy || available !== true} onClick={() => begin('connect')}><LinkSimple /> Connect existing library</button></div>
        {available === false && <p className="storage-help">The sync service is unavailable on this deployment. Your local library remains available.</p>}
      </> : <form onSubmit={event => { event.preventDefault(); void act(async () => { if (mode === 'create') await createSyncedLibrary(recovery, copyLibrary); else await connectSyncedLibrary(recovery); setRecovery(''); setMode('none') }) }}>
        <div className="sync-form-heading"><Key aria-hidden="true" /><h4>{mode === 'create' ? 'Save your recovery key' : 'Connect your library'}</h4></div>
        <p>{mode === 'create' ? 'Keep this key in your password manager. Anyone with it can open your library. If you lose it and every connected browser, PRISM cannot recover your files.' : 'Paste the recovery key you saved when you enabled sync. This browser will remember the connection.'}</p>
        <label className="sync-key-label">Recovery key{mode === 'create' ? <textarea value={recovery} readOnly rows={3} spellCheck={false} /> : <input type="password" value={recovery} onChange={event => setRecovery(event.target.value)} autoComplete="off" spellCheck={false} required />}</label>
        {mode === 'create' && <>
          <div className="storage-actions"><button className="button-secondary" type="button" onClick={() => void act(async () => { await navigator.clipboard.writeText(recovery); setCopied(true) })}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy recovery key'}</button><button className="button-secondary" type="button" onClick={() => downloadRecoveryKey(recovery)}><DownloadSimple /> Download key (.txt)</button></div>
          <p className="storage-help">The text file contains your private key. Store it safely; downloading it does not protect it from being lost or shared.</p>
          <label className="sync-checkbox"><input type="checkbox" checked={saved} onChange={event => setSaved(event.target.checked)} />I saved my recovery key.</label>
          <label className="sync-checkbox"><input type="checkbox" checked={copyLibrary} onChange={event => setCopyLibrary(event.target.checked)} />Sync this browser’s current library, including PDFs, lessons and history.</label>
          <p className="storage-help">Encrypted copies are stored with PRISM’s hosting service on Cloudflare. Your original library stays intact. This release allows 512 MB of encrypted storage per library; retained history also uses space.</p>
        </>}
        <div className="storage-actions"><button className="button-primary" disabled={busy || !recovery || (mode === 'create' && !saved)}>{busy ? 'Connecting…' : mode === 'create' ? 'Create synced library' : 'Connect library'}</button><button className="button-quiet" type="button" disabled={busy} onClick={() => { setMode('none'); setRecovery('') }}>Cancel</button></div>
      </form>}
    </>}
  </section>
}

import { openVaultDatabase, accessBrowserVault, type DirectoryHandleLike } from './browserVault'
import { snapshotVaultRecords, writeVaultFile } from './vaultTransfer'
import { allRecords, getRecord, isPortable, putRecord, recordKey, trackSyncWrites, transactionDone, type PendingCommit, type SyncChange } from './syncDatabase'
import { hex, randomHex, recoveryKeys, seal, SYNC_CHUNK_BYTES, unseal } from './syncCrypto'

export const SYNC_CHANGED = 'prism:sync-changed'
interface Connection { library: string; encryption: CryptoKey; token: string; device: string }
interface BlobReference { kind: 'prism-sync-blob-v1'; chunks: string[]; size: number; type: string }
interface UploadPlan extends BlobReference { sent: number }
interface RemoteCommit { revision: number; mutation: string; objects: string[] }
interface CommitBody { format: 1; parent: number; entries: PendingCommit[]; files: Record<string, BlobReference> }
export interface SyncStatus { connected: boolean; state: 'local' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error'; detail: string; lastSynced: number | null; pending: number; conflict?: string }
let connection: Connection | null | undefined
let restoring: Promise<void> | undefined
let sequence: Promise<unknown> = Promise.resolve()
let running: Promise<void> | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let status: SyncStatus = { connected: false, state: 'local', detail: 'This library is saved on this browser.', lastSynced: null, pending: 0 }
export const syncStatus = () => status
function announce(change: Partial<SyncStatus>) { status = { ...status, ...change }; window.dispatchEvent(new Event(SYNC_CHANGED)) }
function changed() { for (const event of ['prism:vault-changed', 'prism:sources-changed', 'prism:lesson-document-changed']) window.dispatchEvent(new Event(event)) }
function serialized<T>(work: () => Promise<T>): Promise<T> { const result = sequence.then(work, work); sequence = result.catch(() => undefined); return result }
async function locked<T>(work: () => Promise<T>) {
  return serialized(async () => navigator.locks ? await navigator.locks.request('prism-sync-library', work) : await work())
}
async function settings(value?: Connection | null): Promise<Connection | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('prism-sync-connection', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('settings')
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
  try {
    if (value !== undefined) { const tx = db.transaction('settings', 'readwrite'); if (value) tx.objectStore('settings').put(value, 'current'); else tx.objectStore('settings').delete('current'); await transactionDone(tx) }
    return await getRecord<Connection>(db, 'settings', 'current') ?? null
  } finally { db.close() }
}
export async function restoreSyncedLibrary() {
  if (typeof indexedDB === 'undefined') return
  if (restoring) return restoring
  if (connection !== undefined) return
  restoring = (async () => {
    connection = await settings()
    if (connection) { announce({ connected: true, state: 'syncing', detail: 'Checking for library changes…' }); schedule() }
  })()
  try { await restoring } finally { restoring = undefined }
}
function current() { if (!connection) throw new Error('Connect a synced library first.'); return connection }
async function cache() { return openVaultDatabase(indexedDB, () => new Date().toISOString(), `prism-sync-${current().library}`) }
async function directory() { return (await navigator.storage.getDirectory()).getDirectoryHandle(`prism-sync-${current().library}`, { create: true }) }
class SyncHttpError extends Error { constructor(readonly code: number, message: string) { super(message) } }
async function api(path: string, init: RequestInit = {}, auth = current().token, library = current().library): Promise<Response> {
  let response: Response
  try { response = await fetch(`/api/sync/libraries/${library}${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${auth}` }, cache: 'no-store', signal: AbortSignal.timeout(45_000) }) }
  catch { throw new SyncHttpError(0, 'Offline or unable to reach sync. Changes are saved on this browser and will retry.') }
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new SyncHttpError(response.status, result.error ?? 'The sync request failed. Your local changes are retained.') }
  return response
}
export async function syncAvailable() {
  try { const response = await fetch('/api/sync/status', { cache: 'no-store' }); return response.ok && (await response.json()).available === true }
  catch { return false }
}
function schedule() {
  if (timer || !connection) return
  timer = setTimeout(() => { timer = undefined; void syncNow() }, 250)
}
export function startSyncWatching() {
  const refresh = () => { if (document.visibilityState === 'visible') void syncNow() }
  const interval = setInterval(refresh, 5000)
  window.addEventListener('online', refresh); window.addEventListener('focus', refresh)
  return () => { clearInterval(interval); window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh) }
}

async function uploadBlob(db: IDBDatabase, blob: Blob, cacheKey: string): Promise<BlobReference> {
  const c = current(), root = await directory(), ciphertexts = await root.getDirectoryHandle('encrypted', { create: true })
  let plan = await getRecord<UploadPlan>(db, 'sync_meta', `upload:${cacheKey}`)
  if (!plan) { plan = { kind: 'prism-sync-blob-v1', chunks: [], size: blob.size, type: blob.type, sent: 0 }; await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan) }
  if (plan.size !== blob.size || plan.type !== blob.type) throw new Error('A cached upload does not match its source.')
  const count = Math.max(1, Math.ceil(blob.size / SYNC_CHUNK_BYTES))
  for (let index = plan.sent; index < count; index++) {
    let id = plan.chunks[index]
    if (!id) {
      const encrypted = await seal(c.encryption, c.library, new Uint8Array(await blob.slice(index * SYNC_CHUNK_BYTES, (index + 1) * SYNC_CHUNK_BYTES).arrayBuffer()))
      id = encrypted.id
      await writeVaultFile(ciphertexts, id, new Blob([encrypted.ciphertext as Uint8Array<ArrayBuffer>]))
      plan.chunks[index] = id
      await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan)
    }
    await api(`/objects/${id}`, { method: 'PUT', body: await (await ciphertexts.getFileHandle(id)).getFile() })
    plan.sent = index + 1
    await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan)
  }
  return { kind: plan.kind, chunks: plan.chunks, size: plan.size, type: plan.type }
}
function validateReference(value: unknown): asserts value is BlobReference {
  const ref = value as BlobReference
  if (!ref || ref.kind !== 'prism-sync-blob-v1' || !Array.isArray(ref.chunks) || !ref.chunks.length || ref.chunks.length > 1024 || !ref.chunks.every(id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)) || !Number.isSafeInteger(ref.size) || ref.size < 0 || ref.size > 512 * 1024 * 1024 || typeof ref.type !== 'string') throw new Error('Invalid encrypted file reference.')
}
async function plaintext(id: string) {
  const c = current()
  const encrypted = await (await directory()).getDirectoryHandle('encrypted', { create: true })
  try { return await unseal(c.encryption, c.library, id, await (await (await encrypted.getFileHandle(id)).getFile()).arrayBuffer()) }
  catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
  return unseal(c.encryption, c.library, id, await (await api(`/objects/${id}`)).arrayBuffer())
}
async function downloadBlob(reference: BlobReference): Promise<Blob> {
  validateReference(reference)
  const parts: ArrayBuffer[] = []
  for (const id of reference.chunks) parts.push((await plaintext(id)).buffer as ArrayBuffer)
  const blob = new Blob(parts, { type: reference.type })
  if (blob.size !== reference.size) throw new Error('An encrypted file is incomplete. Retry before continuing.')
  return blob
}
async function encode(db: IDBDatabase, value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    const digest = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', await value.arrayBuffer())))
    return uploadBlob(db, value, `blob:${digest}:${value.type}`)
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => encode(db, item)))
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await encode(db, item)])))
  return value
}
async function decode(value: unknown): Promise<unknown> {
  if (value && typeof value === 'object' && 'kind' in value && value.kind === 'prism-sync-blob-v1') { validateReference(value); return downloadBlob(value) }
  if (Array.isArray(value)) return Promise.all(value.map(decode))
  if (value && typeof value === 'object') return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await decode(item)])))
  return value
}
async function cachedDirectory(db: IDBDatabase): Promise<DirectoryHandleLike> {
  const root = await directory()
  return {
    getDirectoryHandle: async name => {
      if (name !== 'sources') return root.getDirectoryHandle(name, { create: true })
      const sources = await root.getDirectoryHandle('sources', { create: true })
      return { getDirectoryHandle: (...args) => sources.getDirectoryHandle(...args), removeEntry: async () => undefined,
        getFileHandle: async (name, options) => {
          if (options?.create) return sources.getFileHandle(name, options)
          try { return await sources.getFileHandle(name) } catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
          const reference = await getRecord<BlobReference>(db, 'sync_files', name)
          if (!reference) throw new Error('This PDF has not finished syncing from the importing browser.')
          validateReference(reference)
          const handle = await sources.getFileHandle(name, { create: true }), writer = await handle.createWritable()
          try {
            let size = 0
            for (const id of reference.chunks) { const bytes = await plaintext(id); size += bytes.length; await writer.write(bytes as Uint8Array<ArrayBuffer>) }
            if (size !== reference.size) throw new Error('The downloaded PDF is incomplete.')
            await writer.close()
          } catch (error) { await writer.abort(); await sources.removeEntry(name).catch(() => undefined); throw error }
          return handle
        } }
    },
    getFileHandle: (...args) => root.getFileHandle(...args), removeEntry: async () => undefined,
  }
}
export async function withSyncedLibrary<T>(work: (db: IDBDatabase, directory: DirectoryHandleLike) => Promise<T>): Promise<{ value: T } | null> {
  await restoreSyncedLibrary()
  if (!connection) return null
  return locked(async () => {
    const db = await cache()
    try { return { value: await work(trackSyncWrites(db, () => { announce({ state: 'syncing', detail: 'Changes saved here. Syncing…' }); schedule() }), await cachedDirectory(db)) } }
    finally { db.close() }
  })
}

async function pull(db: IDBDatabase) {
  let head = await getRecord<number>(db, 'sync_meta', 'head') ?? 0
  while (true) {
    const response: { head: number; commits: RemoteCommit[] } = await (await api(`/commits?after=${head}`)).json()
    for (const remote of response.commits) {
      if (remote.revision !== head + 1 || !Array.isArray(remote.objects) || remote.objects.length > 64) throw new Error('The synced revision history is incomplete.')
      const chunks = await Promise.all(remote.objects.map(plaintext))
      const encoded = await new Blob(chunks as Uint8Array<ArrayBuffer>[]).text()
      const document = JSON.parse(encoded) as CommitBody
      if (document.format !== 1 || document.parent !== head || !Array.isArray(document.entries) || document.entries.length > 100) throw new Error('The synced revision format is not supported.')
      const entries = await decode(document.entries) as PendingCommit[]
      const pending = (await allRecords<PendingCommit>(db, 'sync_outbox')).filter(entry => !entries.some(incoming => incoming.id === entry.id))
      const protectedKeys = new Set(pending.flatMap(entry => entry.changes.map(change => recordKey(change.store, change.key))))
      const names = Array.from(db.objectStoreNames)
      for (const entry of entries) {
        if (typeof entry.id !== 'string' || !Array.isArray(entry.changes)) throw new Error('Invalid synced changes.')
        for (const change of entry.changes) if (!names.includes(change.store) || !isPortable(change.store) || change.key === undefined) throw new Error('This library requires a newer PRISM version.')
      }
      for (const reference of Object.values(document.files)) validateReference(reference)
      const tx = db.transaction(names, 'readwrite')
      for (const entry of entries) {
        tx.objectStore('sync_outbox').delete(entry.id)
        for (const change of entry.changes) {
          const key = recordKey(change.store, change.key)
          tx.objectStore('sync_committed').put({ revision: entry.id, change }, key)
          if (protectedKeys.has(key)) continue
          if (change.value === undefined) tx.objectStore(change.store).delete(change.key)
          else tx.objectStore(change.store).put(change.value)
          tx.objectStore('sync_versions').put(entry.id, key)
        }
      }
      for (const [name, reference] of Object.entries(document.files)) tx.objectStore('sync_files').put(reference, name)
      tx.objectStore('sync_meta').put(remote.revision, 'head')
      await transactionDone(tx)
      head = remote.revision
      changed()
    }
    if (!response.commits.length || head >= response.head) return head
  }
}
function ordered(entries: PendingCommit[]) { return entries.sort((a, b) => a.created - b.created) }
async function flush(db: IDBDatabase) {
  let attempts = 0
  while (true) {
    const head = await pull(db)
    const pending = ordered(await allRecords<PendingCommit>(db, 'sync_outbox'))
    announce({ pending: pending.length })
    if (!pending.length) { announce({ connected: true, state: 'synced', detail: 'PDFs, lessons and history are synced.', lastSynced: Date.now(), conflict: undefined }); return }
    const batchKey = `batch:${head}:${pending[0].id}`
    let ids = await getRecord<string[]>(db, 'sync_meta', batchKey)
    if (!ids) { ids = pending.slice(0, 20).map(entry => entry.id); await putRecord(db, 'sync_meta', batchKey, ids) }
    const entries = pending.filter(entry => ids.includes(entry.id)), revisions = new Map<string, string | null>()
    for (const entry of entries) for (const change of entry.changes) {
      const identity = recordKey(change.store, change.key)
      if (!revisions.has(identity)) revisions.set(identity, (await getRecord<{ revision: string }>(db, 'sync_committed', identity))?.revision ?? null)
      if (change.base !== revisions.get(identity)) {
        announce({ state: 'conflict', conflict: identity, detail: 'Both browsers changed the same item. Your version and the synced version are preserved. Choose which to continue with.' })
        return
      }
      revisions.set(identity, entry.id)
    }
    announce({ state: 'syncing', detail: `Syncing ${pending.length} saved change${pending.length === 1 ? '' : 's'}…` })
    const files: Record<string, BlobReference> = {}
    for (const entry of entries) for (const change of entry.changes) {
      if (change.store !== 'sources' || !change.value) continue
      const name = (change.value as { file_name?: string }).file_name
      if (!name || files[name] || await getRecord(db, 'sync_files', name)) continue
      const file = await (await (await directory()).getDirectoryHandle('sources')).getFileHandle(name)
      files[name] = await uploadBlob(db, await file.getFile(), `source:${name}`)
    }
    const document = { format: 1, parent: head, entries: await encode(db, entries), files }
    const reference = await uploadBlob(db, new Blob([JSON.stringify(document)], { type: 'application/json' }), `commit:${entries[0].id}:${head}`)
    try { await api('/commits', { method: 'POST', body: JSON.stringify({ base: head, mutation: entries[0].id, objects: reference.chunks }) }) }
    catch (error) { if (error instanceof SyncHttpError && error.code === 409 && attempts++ < 5) continue; throw error }
    // Pull our acknowledged commit too: one apply path handles lost responses,
    // pending deletion, local revisions and the authoritative head atomically.
  }
}
export async function syncNow() {
  await restoreSyncedLibrary()
  if (!connection) return
  if (running) return running
  running = locked(async () => {
    const db = await cache()
    try { await flush(db) }
    catch (error) { announce({ state: error instanceof SyncHttpError && error.code === 0 ? 'offline' : 'error', detail: error instanceof Error ? error.message : 'Sync could not finish. Local changes are retained.' }) }
    finally { db.close() }
  })
  try { await running } finally { running = undefined }
}
export async function connectSyncedLibrary(recovery: string) {
  const keys = await recoveryKeys(recovery)
  const response = await api('/devices', { method: 'POST' }, keys.authorization, keys.library)
  const device: { id: string; token: string } = await response.json()
  await locked(async () => {
    const next = { library: keys.library, encryption: keys.encryption, token: device.token, device: device.id }
    await settings(next); connection = next
    announce({ connected: true, state: 'syncing', detail: 'Opening your encrypted library…', pending: 0, conflict: undefined })
  })
  await syncNow(); changed()
}
export function newRecoveryKey() { return `prism1.${randomHex()}.${randomHex()}` }
export async function verifyConnectedRecoveryKey(recovery: string) {
  const selected = current(), keys = await recoveryKeys(recovery)
  if (keys.library !== selected.library) throw new Error('This key belongs to a different library.')
  const challenge = await seal(selected.encryption, selected.library, crypto.getRandomValues(new Uint8Array(32)))
  try { await unseal(keys.encryption, keys.library, challenge.id, challenge.ciphertext.buffer as ArrayBuffer) }
  catch { throw new Error('This key does not unlock the connected library. Check your saved key.') }
}
export async function createSyncedLibrary(recovery: string, copyExisting: boolean) {
  // Capture the browser library before changing the active connection.
  const original = copyExisting ? await accessBrowserVault(async (db, directory) => ({ records: await snapshotVaultRecords(db), directory })) : null
  const keys = await recoveryKeys(recovery)
  if (original) await locked(async () => {
    const db = await openVaultDatabase(indexedDB, () => new Date().toISOString(), `prism-sync-${keys.library}`)
    try {
      const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(`prism-sync-${keys.library}`, { create: true })
      const destination = await root.getDirectoryHandle('sources', { create: true })
      for (const record of original.records.filter(record => record.store === 'sources')) {
        const name = (record.value as { file_name: string }).file_name
        await writeVaultFile(destination, name, await (await (await original.directory.getDirectoryHandle('sources')).getFileHandle(name)).getFile())
      }
      // A failed first setup can be retried with the same recovery key without
      // duplicating imported records or replacing the selected original library.
      if (await getRecord(db, 'sync_meta', 'migrationPrepared')) return
      for (let offset = 0; offset < original.records.length; offset += 64) {
        const batch = original.records.slice(offset, offset + 64)
        const tx = trackSyncWrites(db, schedule).transaction(Array.from(new Set(batch.map(record => record.store))), 'readwrite')
        for (const record of batch) tx.objectStore(record.store).put(record.value)
        await transactionDone(tx)
      }
      await putRecord(db, 'sync_meta', 'migrationPrepared', true)
    } finally { db.close() }
  })
  const response = await fetch('/api/sync/libraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: keys.library, recovery: keys.authorization }) })
  if (!response.ok && response.status !== 409) { const result = await response.json().catch(() => ({})); throw new Error(result.error ?? 'The encrypted library could not be created.') }
  await connectSyncedLibrary(recovery)
  changed(); schedule()
}
export async function disconnectSyncedLibrary() {
  await locked(async () => { await settings(null); connection = null; announce({ connected: false, state: 'local', detail: 'Using your original local library. Synced data and cached drafts are retained.', pending: 0, conflict: undefined }) })
  changed()
}
export async function resolveSyncConflict(choice: 'local' | 'remote') {
  await locked(async () => {
    const identity = status.conflict
    if (!identity) return
    const db = await cache()
    try {
      const committed = await getRecord<{ revision: string; change: SyncChange }>(db, 'sync_committed', identity)
      const pending = ordered(await allRecords<PendingCommit>(db, 'sync_outbox'))
      const affected = pending.filter(entry => entry.changes.some(change => recordKey(change.store, change.key) === identity))
      const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite')
      tx.objectStore('sync_conflicts').put({ identity, choice, committed, pending: affected, saved: Date.now() }, crypto.randomUUID())
      if (choice === 'local') {
        const first = affected[0]
        first.changes.find(change => recordKey(change.store, change.key) === identity)!.base = committed?.revision ?? null
        tx.objectStore('sync_outbox').put(first, first.id)
      } else {
        for (const entry of affected) {
          entry.changes = entry.changes.filter(change => recordKey(change.store, change.key) !== identity)
          if (entry.changes.length) tx.objectStore('sync_outbox').put(entry, entry.id); else tx.objectStore('sync_outbox').delete(entry.id)
        }
        const [store, key] = JSON.parse(identity) as [string, IDBValidKey]
        if (committed?.change.value !== undefined) tx.objectStore(store).put(committed.change.value); else tx.objectStore(store).delete(key)
        if (committed) tx.objectStore('sync_versions').put(committed.revision, identity); else tx.objectStore('sync_versions').delete(identity)
      }
      // No conflicting pending commit has been accepted remotely. Re-encrypt the
      // corrected proposal with fresh object keys and rebuild its pending batch.
      const cursor = tx.objectStore('sync_meta').openCursor()
      cursor.onsuccess = () => { if (cursor.result) { if (/^(upload:commit:|batch:)/.test(String(cursor.result.key))) cursor.result.delete(); cursor.result.continue() } }
      await transactionDone(tx)
    } finally { db.close() }
    announce({ conflict: undefined, state: 'syncing', detail: 'Conflict resolved. Syncing the selected version…' })
  })
  changed(); await syncNow()
}
export async function connectedBrowsers(): Promise<{ current: string; devices: Array<{ id: string; created: number; revoked: number }> }> { return (await api('/devices')).json() }
export async function revokeBrowser(id: string) { await api(`/devices/${id}`, { method: 'DELETE' }); if (id === current().device) await disconnectSyncedLibrary() }
export async function deleteSyncedLibrary() {
  let result: { deleted: boolean }
  do { result = await (await api('', { method: 'DELETE' })).json() } while (!result.deleted)
  await disconnectSyncedLibrary()
}

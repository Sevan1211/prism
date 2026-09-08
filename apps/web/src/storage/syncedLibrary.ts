import { openVaultDatabase, accessBrowserVault, type DirectoryHandleLike } from './browserVault'
import { snapshotVaultRecords, writeVaultFile } from './vaultTransfer'
import { allRecords, getRecord, isPortable, putRecord, recordKey, trackSyncWrites, transactionDone, type PendingCommit, type SyncChange } from './syncDatabase'
import { hex, packObject, SYNC_CHUNK_BYTES, verifyObject } from './cloudObjects'
import { mergeReadingProgress } from './syncReadingProgress'
import { cloudRetryAt, cloudRetryMessage, deferCloudRequests } from './cloudRetry'

export const SYNC_CHANGED = 'prism:sync-changed'
interface Connection { library: string; owner: string }
interface Identity { owner: string; getToken: () => Promise<string | null>; controller: AbortController }
let identity: Identity | null = null
export interface CloudLibraryInfo { library: { id: string; head: number; deleted: number } | null; usedBytes: number; quotaBytes: number; mode: 'local' | 'remote' }
interface BlobReference { kind: 'prism-cloud-blob-v1'; chunks: string[]; size: number; type: string }
interface UploadPlan extends BlobReference { sent: number }
interface RemoteCommit { revision: number; mutation: string; objects: string[] }
interface CommitBody { format: 1; parent: number; entries: PendingCommit[]; files: Record<string, BlobReference> }
export interface SyncStatus { connected: boolean; state: 'local' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error'; detail: string; lastSynced: number | null; pending: number; conflict?: string }
let connection: Connection | null | undefined
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
// Tokens are never persisted. Cached library pointers are scoped to the restored owner.
export function bindCloudIdentity(owner: string, getToken: () => Promise<string | null>) {
  identity?.controller.abort()
  const selected = { owner, getToken, controller: new AbortController() }
  identity = selected; connection = null
  announce({ connected: false, state: 'local', detail: 'Your browser library is available.', pending: 0, conflict: undefined })
  changed()
  if (localStorage.getItem(`prism-cloud-enabled:${owner}`) === 'true') {
    const library = localStorage.getItem(`prism-cloud-library:${owner}`)
    if (library && /^[a-f0-9]{64}$/.test(library)) {
      connection = { library, owner }
      announce({ connected: true, state: 'offline', detail: 'Opening your saved account library. Checking the connection…' })
      changed()
      void syncNow()
    } else void connectCloudLibrary(false, false).catch(error => {
      if (identity === selected) announce({ state: 'error', detail: error instanceof Error ? error.message : 'Reopen storage to reconnect your account.' })
    })
  }
  return () => {
    selected.controller.abort()
    if (identity !== selected) return
    identity = null; connection = null
    if (timer) clearTimeout(timer); timer = undefined
    announce({ connected: false, state: 'local', detail: 'Signed out of cloud storage. Your original browser library is available.', pending: 0, conflict: undefined })
    changed()
  }
}
function selectedIdentity() { if (!identity) throw new Error('Sign in to use cloud storage.'); return identity }
export async function cloudRequest(path: string, init: RequestInit = {}) {
  const selected = selectedIdentity()
  const retryAt = cloudRetryAt(selected.owner)
  if (retryAt) { schedule(); throw new SyncHttpError(429, cloudRetryMessage(retryAt)) }
  const token = await selected.getToken()
  if (!token || identity !== selected || selected.controller.signal.aborted) throw new Error('Sign in again to continue.')
  let response: Response
  try { response = await fetch(`/api/cloud${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.any([selected.controller.signal, AbortSignal.timeout(45000)]) }) }
  catch { throw new SyncHttpError(0, 'Unable to reach cloud storage. Your changes are saved on this browser.') }
  if (identity !== selected) throw new Error('Account changed. No data was applied.')
  if (response.status === 429) {
    const deadline = deferCloudRequests(selected.owner, response.headers.get('Retry-After'))
    schedule()
    throw new SyncHttpError(429, cloudRetryMessage(deadline))
  }
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new SyncHttpError(response.status, data.error ?? 'Cloud storage could not finish this request.') }
  return response
}
export async function cloudLibraryInfo(): Promise<CloudLibraryInfo> { return (await cloudRequest('/library')).json() }
function current() { if (!connection) throw new Error('Connect a synced library first.'); return connection }
async function cache() { return openVaultDatabase(indexedDB, () => new Date().toISOString(), `prism-cloud-${current().library}`) }
async function directory() { return (await navigator.storage.getDirectory()).getDirectoryHandle(`prism-cloud-${current().library}`, { create: true }) }
class SyncHttpError extends Error { constructor(readonly code: number, message: string) { super(message) } }
async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const selected = current()
  if (selected.owner !== selectedIdentity().owner) throw new Error('Account changed. Reopen your cloud library.')
  return cloudRequest(`/libraries/${selected.library}${path}`, init)
}
function schedule() {
  if (timer || !connection) return
  const delay = Math.max(1000, cloudRetryAt(connection.owner) - Date.now() + 100)
  timer = setTimeout(() => { timer = undefined; void syncNow() }, delay)
}
export function startSyncWatching() {
  const refresh = () => { if (document.visibilityState === 'visible') void syncNow() }
  const interval = setInterval(refresh, 120000)
  window.addEventListener('online', refresh); window.addEventListener('focus', refresh)
  return () => { clearInterval(interval); window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh) }
}

async function uploadBlob(db: IDBDatabase, blob: Blob, cacheKey: string): Promise<BlobReference> {
  const root = await directory(), objectFiles = await root.getDirectoryHandle('objects', { create: true })
  let plan = await getRecord<UploadPlan>(db, 'sync_meta', `upload:${cacheKey}`)
  if (!plan) { plan = { kind: 'prism-cloud-blob-v1', chunks: [], size: blob.size, type: blob.type, sent: 0 }; await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan) }
  if (plan.size !== blob.size || plan.type !== blob.type) throw new Error('A cached upload does not match its source.')
  const count = Math.max(1, Math.ceil(blob.size / SYNC_CHUNK_BYTES))
  for (let index = plan.sent; index < count; index++) {
    let id = plan.chunks[index]
    if (!id) {
      const packed = await packObject(new Uint8Array(await blob.slice(index * SYNC_CHUNK_BYTES, (index + 1) * SYNC_CHUNK_BYTES).arrayBuffer()))
      id = packed.id
      await writeVaultFile(objectFiles, id, new Blob([packed.bytes as Uint8Array<ArrayBuffer>]))
      plan.chunks[index] = id
      await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan)
    }
    await api(`/objects/${id}`, { method: 'PUT', body: await (await objectFiles.getFileHandle(id)).getFile() })
    plan.sent = index + 1
    await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan)
  }
  return { kind: plan.kind, chunks: plan.chunks, size: plan.size, type: plan.type }
}
function validateReference(value: unknown): asserts value is BlobReference {
  const ref = value as BlobReference
  if (!ref || ref.kind !== 'prism-cloud-blob-v1' || !Array.isArray(ref.chunks) || !ref.chunks.length || ref.chunks.length > 1024 || !ref.chunks.every(id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)) || !Number.isSafeInteger(ref.size) || ref.size < 0 || ref.size > 512 * 1024 * 1024 || typeof ref.type !== 'string') throw new Error('Invalid cloud file reference.')
}
async function plaintext(id: string) {
  const packed = await (await directory()).getDirectoryHandle('objects', { create: true })
  try { return await verifyObject(id, await (await (await packed.getFileHandle(id)).getFile()).arrayBuffer()) }
  catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
  const bytes = await (await api(`/objects/${id}`)).arrayBuffer()
  const verified = await verifyObject(id, bytes)
  await writeVaultFile(packed, id, new Blob([bytes]))
  return verified
}
async function downloadBlob(reference: BlobReference): Promise<Blob> {
  validateReference(reference)
  const parts: ArrayBuffer[] = []
  for (const id of reference.chunks) parts.push((await plaintext(id)).buffer as ArrayBuffer)
  const blob = new Blob(parts, { type: reference.type })
  if (blob.size !== reference.size) throw new Error('A cloud file is incomplete. Retry before continuing.')
  return blob
}
// Walk binary records in order: a lesson with many figures must not start an
// unbounded burst of uploads/downloads that continue after the first failure.
async function mapRecords<T, U>(values: T[], transform: (value: T) => Promise<U>): Promise<U[]> {
  const results: U[] = []
  for (const value of values) results.push(await transform(value))
  return results
}
async function encode(db: IDBDatabase, value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    const digest = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', await value.arrayBuffer())))
    return uploadBlob(db, value, `blob:${digest}:${value.type}`)
  }
  if (Array.isArray(value)) return mapRecords(value, item => encode(db, item))
  if (value && typeof value === 'object') return Object.fromEntries(await mapRecords(Object.entries(value), async ([key, item]) => [key, await encode(db, item)]))
  return value
}
async function decode(value: unknown): Promise<unknown> {
  if (value && typeof value === 'object' && 'kind' in value && value.kind === 'prism-cloud-blob-v1') { validateReference(value); return downloadBlob(value) }
  if (Array.isArray(value)) return mapRecords(value, decode)
  if (value && typeof value === 'object') return Object.fromEntries(await mapRecords(Object.entries(value), async ([key, item]) => [key, await decode(item)]))
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
  if (!connection) return null
  const selected = connection
  return locked(async () => {
    if (connection !== selected) throw new Error('The active library changed. Please retry.')
    const db = await cache()
    try { return { value: await work(trackSyncWrites(db, () => {
      const retryAt = cloudRetryAt(selected.owner)
      announce(retryAt ? { state: 'error', detail: cloudRetryMessage(retryAt) } : { state: 'syncing', detail: 'Changes saved here. Syncing…' })
      schedule()
    }), await cachedDirectory(db)) } }
    finally { db.close() }
  })
}

async function pull(db: IDBDatabase) {
  const selected = current()
  let head = await getRecord<number>(db, 'sync_meta', 'head') ?? 0
  while (true) {
    const response: { head: number; commits: RemoteCommit[] } = await (await api(`/commits?after=${head}`)).json()
    for (const remote of response.commits) {
      if (remote.revision !== head + 1 || !Array.isArray(remote.objects) || remote.objects.length > 64) throw new Error('The synced revision history is incomplete.')
      const chunks = await mapRecords(remote.objects, plaintext)
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
      if (connection !== selected) throw new Error('Account changed. No downloaded data was applied.')
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
  let previousHead = -1, stalled = 0
  flushLoop: while (true) {
    const head = await pull(db)
    const pending = ordered(await allRecords<PendingCommit>(db, 'sync_outbox'))
    announce({ pending: pending.length })
    if (!pending.length) { announce({ connected: true, state: 'synced', detail: 'PDFs, lessons and history are synced.', lastSynced: Date.now(), conflict: undefined }); return }
    stalled = head === previousHead ? stalled + 1 : 0
    previousHead = head
    if (stalled >= 5) throw new Error('Sync could not confirm progress. Your pending changes are saved on this browser. Please retry from Storage.')
    const batchKey = `batch:${head}:${pending[0].id}`
    let ids = await getRecord<string[]>(db, 'sync_meta', batchKey)
    if (!ids) { ids = pending.slice(0, 20).map(entry => entry.id); await putRecord(db, 'sync_meta', batchKey, ids) }
    const entries = pending.filter(entry => ids.includes(entry.id)), revisions = new Map<string, string | null>()
    for (const entry of entries) for (const change of entry.changes) {
      const identity = recordKey(change.store, change.key)
      if (!revisions.has(identity)) revisions.set(identity, (await getRecord<{ revision: string }>(db, 'sync_committed', identity))?.revision ?? null)
      if (change.base !== revisions.get(identity)) {
        const committed = await getRecord<{ revision: string; change: SyncChange }>(db, 'sync_committed', identity)
        if (await mergeReadingProgress(db, pending, identity, committed)) { changed(); continue flushLoop }
        const item = change.store === 'reading_state' ? 'reading history' : change.store.replaceAll('_', ' ')
        announce({ state: 'conflict', conflict: identity, detail: `Both browsers changed ${item}. Your version and the synced version are preserved. Choose which to continue with.` })
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
  if (!connection) return
  if (running) return running
  if (timer) clearTimeout(timer); timer = undefined
  const selected = connection
  running = locked(async () => {
    if (connection !== selected) return
    const db = await cache()
    try { announce({ pending: (await allRecords<PendingCommit>(db, 'sync_outbox')).length }); await flush(db) }
    catch (error) { if (connection === selected) announce({ state: error instanceof SyncHttpError && error.code === 0 ? 'offline' : 'error', detail: error instanceof Error ? error.message : 'Sync could not finish. Local changes are retained.' }) }
    finally { db.close() }
  })
  try { await running } finally { running = undefined }
}
export async function connectCloudLibrary(create: boolean, copyExisting: boolean) {
  const selected = selectedIdentity()
  const info: CloudLibraryInfo = create
    ? await (await cloudRequest('/library', { method: 'POST', body: JSON.stringify({ consent: true }) })).json()
    : await cloudLibraryInfo()
  if (!info.library || info.library.deleted) throw new Error(info.library?.deleted ? 'This cloud library was deleted. Your original local library remains available.' : 'Create your cloud library first.')
  const library = info.library.id
  if (copyExisting && info.library.head !== 0) throw new Error('Open the existing cloud library first. Import additional PDFs from inside it.')
  // Only the explicit create/copy action snapshots the original browser library.
  const original = copyExisting && !connection ? await accessBrowserVault(async (db, directory) => ({ records: await snapshotVaultRecords(db), directory })) : null
  await locked(async () => {
    if (identity !== selected) throw new Error('Account changed. Please retry.')
    if (original) {
      const db = await openVaultDatabase(indexedDB, () => new Date().toISOString(), `prism-cloud-${library}`)
      try {
        const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(`prism-cloud-${library}`, { create: true })
        const destination = await root.getDirectoryHandle('sources', { create: true })
        if (!await getRecord(db, 'sync_meta', 'migrationPrepared')) {
          for (const record of original.records.filter(record => record.store === 'sources')) {
            const name = (record.value as { file_name: string }).file_name
            await writeVaultFile(destination, name, await (await (await original.directory.getDirectoryHandle('sources')).getFileHandle(name)).getFile())
          }
          for (let offset = 0; offset < original.records.length; offset += 64) {
            const batch = original.records.slice(offset, offset + 64)
            const tx = trackSyncWrites(db, schedule).transaction(Array.from(new Set(batch.map(record => record.store))), 'readwrite')
            for (const record of batch) tx.objectStore(record.store).put(record.value)
            await transactionDone(tx)
          }
          await putRecord(db, 'sync_meta', 'migrationPrepared', true)
        }
      } finally { db.close() }
    }
    if (identity !== selected) throw new Error('Account changed. Local files were retained.')
    connection = { library, owner: selected.owner }
    localStorage.setItem(`prism-cloud-enabled:${selected.owner}`, 'true')
    localStorage.setItem(`prism-cloud-library:${selected.owner}`, library)
    announce({ connected: true, state: 'syncing', detail: 'Opening your account library…', pending: 0, conflict: undefined })
  })
  changed(); await syncNow()
}
export async function disconnectSyncedLibrary() {
  const owner = identity?.owner
  if (owner) localStorage.removeItem(`prism-cloud-enabled:${owner}`)
  await locked(async () => { connection = null; announce({ connected: false, state: 'local', detail: 'Using your original browser library. Cloud files and cached drafts are retained.', pending: 0, conflict: undefined }) })
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
export async function deleteSyncedLibrary() {
  let result: { deleted: boolean }
  let attempts = 0
  do { if (attempts++ >= 10) throw new Error('Deletion is still in progress. Retry to finish removing cloud files.'); result = await (await api('', { method: 'DELETE' })).json() } while (!result.deleted)
  await disconnectSyncedLibrary()
}

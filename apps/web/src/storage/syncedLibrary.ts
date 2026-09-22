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
let connectionEpoch = 0
let restoreAccountLibrary: (() => void) | undefined
let libraryLookup: { identity: Identity; promise: Promise<CloudLibraryInfo> } | undefined
export interface CloudLibraryInfo { library: { id: string; head: number; deleted: number } | null; usedBytes: number; quotaBytes: number; mode: 'local' | 'remote' }
interface BlobReference { kind: 'prism-cloud-blob-v1'; chunks: string[]; size: number; type: string }
interface UploadPlan extends BlobReference { sent: number }
interface RemoteCommit { revision: number; mutation: string; objects: string[] }
interface CommitBody { format: 1; parent: number; entries: PendingCommit[]; files: Record<string, BlobReference> }
export interface SyncStatus { connected: boolean; state: 'local' | 'syncing' | 'synced' | 'offline' | 'conflict' | 'error'; detail: string; lastSynced: number | null; pending: number; conflict?: string; revision?: number; restoring?: boolean }
let connection: Connection | null | undefined
let sequence: Promise<unknown> = Promise.resolve()
const transfers = new Map<string, Promise<unknown>>()
let running: { connection: Connection; promise: Promise<void> } | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let status: SyncStatus = { connected: false, state: 'local', detail: 'This library is saved on this browser.', lastSynced: null, pending: 0, restoring: Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()) }
export const syncStatus = () => status
function announce(change: Partial<SyncStatus>) { status = { ...status, ...change }; window.dispatchEvent(new Event(SYNC_CHANGED)) }
export function settleCloudAccount() { if (!identity) announce({ restoring: false }) }
function changed() { for (const event of ['prism:vault-changed', 'prism:sources-changed', 'prism:lesson-document-changed']) window.dispatchEvent(new Event(event)) }
function serialized<T>(work: () => Promise<T>): Promise<T> { const result = sequence.then(work, work); sequence = result.catch(() => undefined); return result }
async function locked<T>(work: () => Promise<T>) {
  return serialized(async () => navigator.locks ? await navigator.locks.request('prism-sync-library', work) : await work())
}
async function transportLocked<T>(selected: Connection, work: () => Promise<T>) {
  const run = async () => navigator.locks ? await navigator.locks.request(`prism-sync-transport:${selected.library}`, work) : await work()
  const result = (transfers.get(selected.library) ?? Promise.resolve()).then(run, run)
  transfers.set(selected.library, result)
  try { return await result } finally { if (transfers.get(selected.library) === result) transfers.delete(selected.library) }
}
// Tokens are never persisted. Cached library pointers are scoped to the restored owner.
export function bindCloudIdentity(owner: string, getToken: () => Promise<string | null>) {
  const epoch = ++connectionEpoch
  restoreAccountLibrary = undefined
  identity?.controller.abort()
  const selected = { owner, getToken, controller: new AbortController() }
  identity = selected; connection = null
  announce({ connected: false, state: 'local', detail: 'Your browser library is available.', pending: 0, conflict: undefined, restoring: false, revision: undefined })
  changed()
  if (localStorage.getItem(`prism-cloud-enabled:${owner}`) !== 'false') {
    const library = localStorage.getItem(`prism-cloud-library:${owner}`)
    if (library && /^[a-f0-9]{64}$/.test(library)) {
      connection = { library, owner }
      announce({ connected: true, state: 'syncing', restoring: true, revision: undefined, detail: 'Opening your saved account library. Checking the connection…' })
      changed()
      void syncNow()
    } else {
      restoreAccountLibrary = () => {
        if (connection || identity !== selected || epoch !== connectionEpoch || status.restoring) return
        announce({ restoring: true, state: 'syncing', detail: 'Finding your account library…' })
        void cloudLibraryInfo().then(async info => {
          if (identity !== selected || epoch !== connectionEpoch) return
          if (info.library && !info.library.deleted) await openCloudLibrary(info, false, selected, epoch)
          else { restoreAccountLibrary = undefined; announce({ state: 'local', detail: 'Your browser library is available.' }) }
        }).catch(error => {
          if (identity === selected && epoch === connectionEpoch) announce({ state: 'error', detail: error instanceof Error ? error.message : 'Cloud storage will retry when the connection is available.' })
        }).finally(() => { if (identity === selected && epoch === connectionEpoch) announce({ restoring: false }) })
      }
      restoreAccountLibrary()
    }
  }
  return () => {
    selected.controller.abort()
    if (identity !== selected) return
    connectionEpoch++
    restoreAccountLibrary = undefined
    identity = null; connection = null
    if (timer) clearTimeout(timer); timer = undefined
    announce({ connected: false, state: 'local', detail: 'Signed out of cloud storage. Your original browser library is available.', pending: 0, conflict: undefined, restoring: false, revision: undefined })
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
export async function cloudLibraryInfo(): Promise<CloudLibraryInfo> {
  const selected = selectedIdentity()
  if (libraryLookup?.identity === selected) return libraryLookup.promise
  const promise = cloudRequest('/library').then(response => response.json() as Promise<CloudLibraryInfo>)
    .finally(() => { if (libraryLookup?.promise === promise) libraryLookup = undefined })
  libraryLookup = { identity: selected, promise }
  return promise
}
function current() { if (!connection) throw new Error('Connect a synced library first.'); return connection }
function assertConnection(selected: Connection) {
  if (connection !== selected || identity?.owner !== selected.owner) throw new Error('The active library changed. Please retry.')
}
async function cache(selected = current()) { assertConnection(selected); return openVaultDatabase(indexedDB, () => new Date().toISOString(), `prism-cloud-${selected.library}`) }
async function directory(selected = current()) {
  assertConnection(selected)
  const root = await navigator.storage.getDirectory()
  assertConnection(selected)
  return root.getDirectoryHandle(`prism-cloud-${selected.library}`, { create: true })
}
class SyncHttpError extends Error { constructor(readonly code: number, message: string) { super(message) } }
async function api(path: string, init: RequestInit = {}, selected = current()): Promise<Response> {
  assertConnection(selected)
  const response = await cloudRequest(`/libraries/${selected.library}${path}`, init)
  assertConnection(selected)
  return response
}
function schedule() {
  if (timer || !connection) return
  const delay = Math.max(1000, cloudRetryAt(connection.owner) - Date.now() + 100)
  timer = setTimeout(() => { timer = undefined; void syncNow() }, delay)
}
export function startSyncWatching() {
  let lastRefresh = 0
  const reconnect = () => { if (connection) void syncNow(); else restoreAccountLibrary?.() }
  const refresh = () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastRefresh < 1000) return
    lastRefresh = Date.now()
    reconnect()
  }
  const interval = setInterval(refresh, 30000)
  window.addEventListener('online', reconnect); window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('pageshow', refresh)
  return () => { clearInterval(interval); window.removeEventListener('online', reconnect); window.removeEventListener('focus', refresh); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', refresh) }
}

async function uploadBlob(db: IDBDatabase, blob: Blob, cacheKey: string, selected: Connection): Promise<BlobReference> {
  const root = await directory(selected), objectFiles = await root.getDirectoryHandle('objects', { create: true })
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
    await api(`/objects/${id}`, { method: 'PUT', body: await (await objectFiles.getFileHandle(id)).getFile() }, selected)
    plan.sent = index + 1
    await putRecord(db, 'sync_meta', `upload:${cacheKey}`, plan)
  }
  return { kind: plan.kind, chunks: plan.chunks, size: plan.size, type: plan.type }
}
function validateReference(value: unknown): asserts value is BlobReference {
  const ref = value as BlobReference
  if (!ref || ref.kind !== 'prism-cloud-blob-v1' || !Array.isArray(ref.chunks) || !ref.chunks.length || ref.chunks.length > 1024 || !ref.chunks.every(id => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)) || !Number.isSafeInteger(ref.size) || ref.size < 0 || ref.size > 512 * 1024 * 1024 || typeof ref.type !== 'string') throw new Error('Invalid cloud file reference.')
}
const objectDownloads = new Map<string, Promise<Uint8Array>>()
function plaintext(id: string, selected: Connection): Promise<Uint8Array> {
  assertConnection(selected)
  const key = `${connectionEpoch}:${selected.library}:${id}`
  const existing = objectDownloads.get(key)
  if (existing) return existing
  const pending = readPlaintext(id, selected).finally(() => { objectDownloads.delete(key) })
  objectDownloads.set(key, pending)
  return pending
}
async function readPlaintext(id: string, selected: Connection) {
  const packed = await (await directory(selected)).getDirectoryHandle('objects', { create: true })
  try { return await verifyObject(id, await (await (await packed.getFileHandle(id)).getFile()).arrayBuffer()) }
  catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error }
  const bytes = await (await api(`/objects/${id}`, {}, selected)).arrayBuffer()
  const verified = await verifyObject(id, bytes)
  assertConnection(selected)
  await writeVaultFile(packed, id, new Blob([bytes]))
  return verified
}
async function downloadBlob(reference: BlobReference, selected: Connection): Promise<Blob> {
  validateReference(reference)
  const parts: ArrayBuffer[] = []
  for (const id of reference.chunks) parts.push((await plaintext(id, selected)).buffer as ArrayBuffer)
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
async function encode(db: IDBDatabase, value: unknown, selected: Connection): Promise<unknown> {
  if (value instanceof Blob) {
    const digest = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', await value.arrayBuffer())))
    return uploadBlob(db, value, `blob:${digest}:${value.type}`, selected)
  }
  if (Array.isArray(value)) return mapRecords(value, item => encode(db, item, selected))
  if (value && typeof value === 'object') return Object.fromEntries(await mapRecords(Object.entries(value), async ([key, item]) => [key, await encode(db, item, selected)]))
  return value
}
async function decode(value: unknown, selected: Connection): Promise<unknown> {
  if (value && typeof value === 'object' && 'kind' in value && value.kind === 'prism-cloud-blob-v1') { validateReference(value); return downloadBlob(value, selected) }
  if (Array.isArray(value)) return mapRecords(value, item => decode(item, selected))
  if (value && typeof value === 'object') return Object.fromEntries(await mapRecords(Object.entries(value), async ([key, item]) => [key, await decode(item, selected)]))
  return value
}
async function cachedDirectory(db: IDBDatabase, selected: Connection): Promise<DirectoryHandleLike> {
  const root = await directory(selected)
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
            for (const id of reference.chunks) { const bytes = await plaintext(id, selected); size += bytes.length; await writer.write(bytes as Uint8Array<ArrayBuffer>) }
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
      if (connection !== selected) return
      const retryAt = cloudRetryAt(selected.owner)
      announce(retryAt ? { state: 'error', detail: cloudRetryMessage(retryAt) } : { state: 'syncing', detail: 'Changes saved here. Syncing…' })
      schedule()
    }), await cachedDirectory(db, selected)) } }
    finally { db.close() }
  })
}

async function pull(db: IDBDatabase, selected: Connection) {
  let head = await getRecord<number>(db, 'sync_meta', 'head') ?? 0
  let applied = false
  try {
    while (true) {
      const response: { head: number; commits: RemoteCommit[] } = await (await api(`/commits?after=${head}`, {}, selected)).json()
      assertConnection(selected)
      for (let offset = 0; offset < response.commits.length; offset += 4) {
        announce({ state: 'syncing', detail: `Loading saved changes (${head} of ${response.head})…` })
        // A bounded window hides request latency without an unbounded download burst.
        // Settle every in-flight read before reporting failure. Downloads do not
        // hold the local-operation lock, so reading and editing can continue.
        const window = response.commits.slice(offset, offset + 4)
        for (const [index, remote] of window.entries()) {
          if (remote.revision !== head + index + 1 || !Array.isArray(remote.objects) || !remote.objects.length || remote.objects.length > 64) throw new Error('The synced revision history is incomplete.')
        }
        const downloads = await Promise.allSettled(window.map(async remote => {
          const chunks = await mapRecords(remote.objects, id => plaintext(id, selected))
          const encoded = await new Blob(chunks as Uint8Array<ArrayBuffer>[]).text()
          const document = JSON.parse(encoded) as CommitBody
          if (document.format !== 1 || document.parent !== remote.revision - 1 || !Array.isArray(document.entries) || document.entries.length > 100) throw new Error('The synced revision format is not supported.')
          return { remote, document, entries: await decode(document.entries, selected) as PendingCommit[] }
        }))
        for (const result of downloads) if (result.status === 'rejected') throw result.reason
        for (const result of downloads) {
          if (result.status !== 'fulfilled') continue
          const { remote, document, entries } = result.value
          await locked(async () => {
            assertConnection(selected)
            const appliedHead = await getRecord<number>(db, 'sync_meta', 'head') ?? 0
            if (appliedHead >= remote.revision) { head = appliedHead; return }
            if (appliedHead !== remote.revision - 1) throw new Error('The synced revision history changed. Retry before continuing.')
            // Re-read pending edits only after transport has finished and while
            // local operations are excluded. A save during download must win here.
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
            applied = true
          })
        }
        assertConnection(selected)
        announce({ detail: `Loading saved changes (${head} of ${response.head})…` })
      }
      if (!response.commits.length || head >= response.head) return head
    }
  } finally {
    // Reload once after replay, including partial recovery, for this library only.
    if (applied && connection === selected) changed()
  }
}
function ordered(entries: PendingCommit[]) { return entries.sort((a, b) => a.created - b.created) }
async function flush(db: IDBDatabase, selected: Connection) {
  let attempts = 0
  let previousHead = -1, stalled = 0
  flushLoop: while (true) {
    const head = await pull(db, selected)
    const entries = await locked(async () => {
      assertConnection(selected)
      const pending = ordered(await allRecords<PendingCommit>(db, 'sync_outbox'))
      assertConnection(selected)
      announce({ pending: pending.length })
      if (!pending.length) { announce({ connected: true, state: 'synced', detail: 'PDFs, lessons and history sync automatically while this browser is online.', lastSynced: Date.now(), revision: head, conflict: undefined }); return null }
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
          if (await mergeReadingProgress(db, pending, identity, committed)) { assertConnection(selected); changed(); return undefined }
          assertConnection(selected)
          const item = change.store === 'reading_state' ? 'reading history' : change.store.replaceAll('_', ' ')
          announce({ state: 'conflict', conflict: identity, detail: `Both browsers changed ${item}. Your version and the synced version are preserved. ${topicConflictKeys(pending, identity).size > 1 ? 'This choice includes the related topic plans and pending lesson changes. ' : ''}Choose which to continue with.` })
          return null
        }
        revisions.set(identity, entry.id)
      }
      assertConnection(selected)
      announce({ state: 'syncing', detail: `Syncing ${pending.length} saved change${pending.length === 1 ? '' : 's'}…` })
      return entries
    })
    if (entries === null) return
    if (entries === undefined) continue flushLoop
    const files: Record<string, BlobReference> = {}
    for (const entry of entries) for (const change of entry.changes) {
      if (change.store !== 'sources' || !change.value) continue
      const name = (change.value as { file_name?: string }).file_name
      if (!name || files[name] || await getRecord(db, 'sync_files', name)) continue
      const file = await (await (await directory(selected)).getDirectoryHandle('sources')).getFileHandle(name)
      files[name] = await uploadBlob(db, await file.getFile(), `source:${name}`, selected)
    }
    const document = { format: 1, parent: head, entries: await encode(db, entries, selected), files }
    const reference = await uploadBlob(db, new Blob([JSON.stringify(document)], { type: 'application/json' }), `commit:${entries[0].id}:${head}`, selected)
    try { await api('/commits', { method: 'POST', body: JSON.stringify({ base: head, mutation: entries[0].id, objects: reference.chunks }) }, selected) }
    catch (error) { if (error instanceof SyncHttpError && error.code === 409 && attempts++ < 5) continue; throw error }
    // Pull our acknowledged commit too: one apply path handles lost responses,
    // pending deletion, local revisions and the authoritative head atomically.
  }
}
export async function syncNow() {
  if (!connection) return
  if (running?.connection === connection) return running.promise
  if (timer) clearTimeout(timer); timer = undefined
  const selected = connection
  const transfer = async () => {
    if (connection !== selected) return
    let db: IDBDatabase | undefined
    try { db = await cache(selected); await flush(db, selected) }
    catch (error) { if (connection === selected) announce({ state: error instanceof SyncHttpError && error.code === 0 ? 'offline' : 'error', detail: error instanceof Error ? error.message : 'Sync could not finish. Local changes are retained.' }) }
    finally { db?.close(); if (connection === selected) announce({ restoring: false }) }
  }
  // One transport writer per library across tabs; normal local operations use
  // their own short lock and never wait for this network-bound critical section.
  const promise = transportLocked(selected, transfer)
  const active = { connection: selected, promise }
  running = active
  try { await promise } finally { if (running === active) running = undefined }
}
export async function connectCloudLibrary(create: boolean, copyExisting: boolean) {
  const epoch = connectionEpoch
  const selected = selectedIdentity()
  const info: CloudLibraryInfo = create
    ? await (await cloudRequest('/library', { method: 'POST', body: JSON.stringify({ consent: true }) })).json()
    : await cloudLibraryInfo()
  await openCloudLibrary(info, copyExisting, selected, epoch)
}
async function openCloudLibrary(info: CloudLibraryInfo, copyExisting: boolean, selected: Identity, epoch: number) {
  if (!info.library || info.library.deleted) throw new Error(info.library?.deleted ? 'This cloud library was deleted. Your original local library remains available.' : 'Create your cloud library first.')
  const library = info.library.id
  if (copyExisting && info.library.head !== 0) throw new Error('Open the existing cloud library first. Import additional PDFs from inside it.')
  // Only the explicit create/copy action snapshots the original browser library.
  const original = copyExisting && !connection ? await accessBrowserVault(async (db, directory) => ({ records: await snapshotVaultRecords(db), directory })) : null
  await locked(async () => {
    if (identity !== selected || epoch !== connectionEpoch) throw new Error('Library selection changed. Please retry.')
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
    if (identity !== selected || epoch !== connectionEpoch) throw new Error('Library selection changed. Local files were retained.')
    connection = { library, owner: selected.owner }
    localStorage.setItem(`prism-cloud-enabled:${selected.owner}`, 'true')
    localStorage.setItem(`prism-cloud-library:${selected.owner}`, library)
    announce({ connected: true, state: 'syncing', restoring: true, detail: 'Opening your account library…', pending: 0, conflict: undefined })
  })
  changed(); await syncNow()
}
export async function disconnectSyncedLibrary() {
  const epoch = ++connectionEpoch
  const owner = identity?.owner
  if (owner) localStorage.setItem(`prism-cloud-enabled:${owner}`, 'false')
  // Invalidate queued reconciliation immediately, even if a local callback is
  // still finishing. Its captured handles remain scoped to the previous cache.
  connection = null
  await locked(async () => { if (epoch !== connectionEpoch) return; connection = null; announce({ connected: false, state: 'local', detail: 'Using your original browser library. Cloud files and cached drafts are retained.', pending: 0, conflict: undefined, restoring: false, revision: undefined }) })
  if (epoch === connectionEpoch) changed()
}
export async function resolveSyncConflict(choice: 'local' | 'remote') {
  const selected = current()
  await transportLocked(selected, () => locked(async () => {
    assertConnection(selected)
    const identity = status.conflict
    if (!identity) return
    const db = await cache()
    try {
      const pending = ordered(await allRecords<PendingCommit>(db, 'sync_outbox'))
      const keys = topicConflictKeys(pending, identity)
      const affected = pending.filter(entry => entry.changes.some(change => keys.has(recordKey(change.store, change.key))))
      const committedByKey = new Map(await Promise.all([...keys].map(async key => [key, await getRecord<{ revision: string; change: SyncChange }>(db, 'sync_committed', key)] as const)))
      const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite')
      tx.objectStore('sync_conflicts').put({ identity, choice, committed: committedByKey.get(identity), related: [...committedByKey], pending: affected, saved: Date.now() }, crypto.randomUUID())
      if (choice === 'local') {
        const rebased = new Set<string>()
        for (const entry of affected) {
          for (const change of entry.changes) {
            const key = recordKey(change.store, change.key)
            if (keys.has(key) && !rebased.has(key)) { change.base = committedByKey.get(key)?.revision ?? null; rebased.add(key) }
          }
          tx.objectStore('sync_outbox').put(entry, entry.id)
        }
      } else {
        for (const entry of affected) {
          entry.changes = entry.changes.filter(change => !keys.has(recordKey(change.store, change.key)))
          if (entry.changes.length) tx.objectStore('sync_outbox').put(entry, entry.id); else tx.objectStore('sync_outbox').delete(entry.id)
        }
        for (const key of keys) {
          const committed = committedByKey.get(key)
          const [store, recordId] = JSON.parse(key) as [string, IDBValidKey]
          if (committed?.change.value !== undefined) tx.objectStore(store).put(committed.change.value); else tx.objectStore(store).delete(recordId)
          if (committed) tx.objectStore('sync_versions').put(committed.revision, key); else tx.objectStore('sync_versions').delete(key)
        }
      }
      // No conflicting pending commit has been accepted remotely. Re-encrypt the
      // corrected proposal with fresh object keys and rebuild its pending batch.
      const cursor = tx.objectStore('sync_meta').openCursor()
      cursor.onsuccess = () => { if (cursor.result) { if (/^(upload:commit:|batch:)/.test(String(cursor.result.key))) cursor.result.delete(); cursor.result.continue() } }
      await transactionDone(tx)
    } finally { db.close() }
    assertConnection(selected)
    announce({ conflict: undefined, state: 'syncing', detail: 'Conflict resolved. Syncing the selected version…' })
  }))
  assertConnection(selected)
  changed(); await syncNow()
}
export async function deleteSyncedLibrary() {
  const selected = current()
  await transportLocked(selected, async () => {
    let result: { deleted: boolean }
    let attempts = 0
    do { if (attempts++ >= 10) throw new Error('Deletion is still in progress. Retry to finish removing cloud files.'); result = await (await api('', { method: 'DELETE' }, selected)).json() } while (!result.deleted)
    assertConnection(selected)
    await disconnectSyncedLibrary()
  })
}


/** A topic proposal/approval and its dependent draft writes are one conflict choice. */
function topicConflictKeys(pending: PendingCommit[], identity: string): Set<string> {
  const keys = new Set([identity])
  const scopeChanges = pending.filter(entry => entry.changes.some(change => recordKey(change.store, change.key) === identity))
  if (!scopeChanges.some(entry => entry.changes.some(change => change.store === 'topic_series') && entry.changes.some(change => change.store === 'lesson_plans'))) return keys
  const plans = new Set<string>()
  let expanded = true
  while (expanded) {
    expanded = false
    for (const entry of pending) {
      const linked = entry.changes.some(change => keys.has(recordKey(change.store, change.key)) || (
        change.value && typeof change.value === 'object' && 'plan_id' in change.value && plans.has(String(change.value.plan_id))
      ))
      if (!linked) continue
      for (const change of entry.changes) {
        const key = recordKey(change.store, change.key)
        if (!keys.has(key)) { keys.add(key); expanded = true }
        if (change.store === 'lesson_plans') plans.add(String(change.key))
      }
    }
  }
  return keys
}

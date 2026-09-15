// @vitest-environment node
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, expect, it, vi } from 'vitest'

class Directory {
  directories = new Map<string, Directory>()
  files = new Map<string, Blob>()
  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<Directory> {
    if (!this.directories.has(name)) { if (!options?.create) throw new DOMException('missing', 'NotFoundError'); this.directories.set(name, new Directory()) }
    return this.directories.get(name)!
  }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    if (!this.files.has(name) && !options?.create) throw new DOMException('missing', 'NotFoundError')
    return { getFile: async () => new File([this.files.get(name)!], name), createWritable: async () => {
      const parts: BlobPart[] = []
      return { write: async (data: BlobPart) => { parts.push(data) }, close: async () => { this.files.set(name, new Blob(parts)) }, abort: async () => undefined }
    } }
  }
  async removeEntry(name: string) { this.files.delete(name) }
}
let release: (() => void) | undefined
afterEach(() => { release?.(); release = undefined; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules() })
async function browser(fetcher: typeof fetch) {
  vi.resetModules()
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('navigator', { storage: { getDirectory: async () => root } })
  const root = new Directory(), preferences = new Map<string, string>([['prism-cloud-enabled:user_alpha', 'false'], ['prism-cloud-enabled:user_beta', 'false']])
  vi.stubGlobal('localStorage', { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => preferences.set(key, value), removeItem: (key: string) => preferences.delete(key) })
  vi.stubGlobal('fetch', fetcher)
  return import('./syncedLibrary')
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

function cloudServer() {
  const id = '7'.repeat(64)
  const objects = new Map<string, Blob>()
  const commits: Array<{ revision: number; mutation: string; objects: string[] }> = []
  const gates: { before?: (path: string, init?: RequestInit) => Promise<void>; loseAcknowledgement?: boolean } = {}
  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input)
    await gates.before?.(path, init)
    if (path === '/api/cloud/library') return Response.json({ library: { id, head: commits.length, deleted: 0 } })
    if (init?.method === 'DELETE') return Response.json({ deleted: true })
    if (path.includes('/objects/')) {
      const key = path.split('/').at(-1)!
      if (init?.method === 'PUT') { objects.set(key, init.body as Blob); return Response.json({ stored: true }) }
      return new Response(objects.get(key))
    }
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body as string)
      const existing = commits.find(commit => commit.mutation === body.mutation)
      if (existing) return Response.json({ revision: existing.revision })
      if (body.base !== commits.length) return Response.json({ error: 'Head changed' }, { status: 409 })
      commits.push({ revision: commits.length + 1, mutation: body.mutation, objects: body.objects })
      if (gates.loseAcknowledgement) { gates.loseAcknowledgement = false; throw new TypeError('Acknowledgement lost') }
      return Response.json({ revision: commits.length })
    }
    const after = Number(new URL(path, 'http://test').searchParams.get('after'))
    return Response.json({ head: commits.length, commits: commits.filter(commit => commit.revision > after) })
  })
  return { id, objects, commits, gates, fetcher }
}

async function saveFolder(client: typeof import('./syncedLibrary'), name: string) {
  const { transactionDone } = await import('./syncDatabase')
  await client.withSyncedLibrary(async db => {
    const tx = db.transaction('library_folders', 'readwrite')
    tx.objectStore('library_folders').put({ id: 'folder', name })
    await transactionDone(tx)
  })
}

it.each(['pull', 'upload', 'commit'] as const)('keeps local reads and durable saves usable during a stalled %s', async phase => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  await saveFolder(client, 'Before transfer')
  let gated = false
  server.gates.before = async (path, init) => {
    const matches = phase === 'pull' ? path.includes('/commits?') : init?.method === (phase === 'upload' ? 'PUT' : 'POST')
    if (matches && !gated) { gated = true; entered.resolve(); await resume.promise }
  }
  const syncing = client.syncNow()
  try {
    await entered.promise
    let saved = false
    const saving = saveFolder(client, 'Edited while transferring').then(() => { saved = true })
    await vi.waitFor(() => expect(saved).toBe(true), { timeout: 1000 })
    await saving
    const { allRecords } = await import('./syncDatabase')
    await client.withSyncedLibrary(async db => {
      expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Edited while transferring' }])
      expect(await allRecords(db, 'sync_outbox')).toHaveLength(2)
    })
  } finally { resume.resolve(); await syncing }
  expect(client.syncStatus().state).toBe('synced')
  // Reopen a separate cache to prove both the acknowledged snapshot and the later
  // edit survived, rather than merely observing optimistic local state.
  release(); release = undefined
  const fresh = await browser(server.fetcher as typeof fetch)
  release = fresh.bindCloudIdentity('user_alpha', async () => 'fresh-token')
  await fresh.connectCloudLibrary(false, false)
  const { allRecords } = await import('./syncDatabase')
  await fresh.withSyncedLibrary(async db => {
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Edited while transferring' }])
    expect(await allRecords(db, 'sync_outbox')).toEqual([])
  })
})

it('protects a local edit made during remote download and retains both sides of the conflict', async () => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  const { packObject } = await import('./cloudObjects')
  const packed = await packObject(new TextEncoder().encode(JSON.stringify({ format: 1, parent: 0, files: {}, entries: [{ id: 'remote-edit', created: 1, changes: [{ store: 'library_folders', key: 'folder', base: null, value: { id: 'folder', name: 'Remote edit' } }] }] })))
  server.objects.set(packed.id, new Blob([packed.bytes as Uint8Array<ArrayBuffer>]))
  server.commits.push({ revision: 1, mutation: 'remote-edit', objects: [packed.id] })
  server.gates.before = async path => { if (path.endsWith(packed.id)) { entered.resolve(); await resume.promise } }
  const syncing = client.syncNow()
  try {
    await entered.promise
    let saved = false
    const saving = saveFolder(client, 'Local edit').then(() => { saved = true })
    await vi.waitFor(() => expect(saved).toBe(true), { timeout: 1000 })
    await saving
  } finally { resume.resolve(); await syncing }
  expect(client.syncStatus().state).toBe('conflict')
  const { allRecords, getRecord, recordKey } = await import('./syncDatabase')
  await client.withSyncedLibrary(async db => {
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Local edit' }])
    expect(await allRecords(db, 'sync_outbox')).toHaveLength(1)
    expect(await getRecord(db, 'sync_committed', recordKey('library_folders', 'folder'))).toMatchObject({ change: { value: { name: 'Remote edit' } } })
  })
  await client.resolveSyncConflict('local')
  expect(client.syncStatus().state).toBe('synced')
  expect(server.commits).toHaveLength(2)
})

it('recovers a lost commit acknowledgement without duplicating or dropping later local edits', async () => {
  const server = cloudServer()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  await saveFolder(client, 'First edit')
  server.gates.loseAcknowledgement = true
  await client.syncNow()
  expect(client.syncStatus().state).toBe('offline')
  expect(server.commits).toHaveLength(1)
  await saveFolder(client, 'Later edit')
  await client.syncNow()
  expect(client.syncStatus().state).toBe('synced')
  expect(server.commits).toHaveLength(2)
  const { allRecords } = await import('./syncDatabase')
  await client.withSyncedLibrary(async db => {
    expect(await allRecords(db, 'sync_outbox')).toEqual([])
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Later edit' }])
  })
})

it('lets a different account sync before an old stalled transfer settles', async () => {
  const entered = deferred(), resume = deferred()
  const first = '5'.repeat(64), second = '6'.repeat(64)
  let owner = first, stall = false
  const fetcher = vi.fn(async (input: string | URL | Request) => {
    const path = String(input)
    if (path === '/api/cloud/library') return Response.json({ library: { id: owner, head: 0 } })
    if (path.includes(first) && stall) { entered.resolve(); await resume.promise }
    return Response.json({ head: 0, commits: [] })
  })
  const client = await browser(fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'alpha-token')
  await client.connectCloudLibrary(false, false)
  stall = true
  const oldSync = client.syncNow()
  try {
    await entered.promise
    release()
    owner = second
    release = client.bindCloudIdentity('user_beta', async () => 'beta-token')
    await client.connectCloudLibrary(false, false)
    expect(client.syncStatus()).toMatchObject({ connected: true, state: 'synced', restoring: false })
    expect(await client.withSyncedLibrary(async db => db.name)).toEqual({ value: `prism-cloud-${second}` })
  } finally { resume.resolve(); await oldSync }
  expect(client.syncStatus()).toMatchObject({ connected: true, state: 'synced', restoring: false })
  expect(fetcher.mock.calls.filter(([path]) => String(path).includes(second))).toHaveLength(1)
})

it('switches to the browser library without waiting for a stalled cloud transfer', async () => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  server.gates.before = async path => { if (path.includes('/commits?')) { entered.resolve(); await resume.promise } }
  const syncing = client.syncNow()
  try {
    await entered.promise
    let disconnected = false
    const disconnecting = client.disconnectSyncedLibrary().then(() => { disconnected = true })
    await vi.waitFor(() => expect(disconnected).toBe(true), { timeout: 1000 })
    await disconnecting
    expect(await client.withSyncedLibrary(async db => db.name)).toBeNull()
  } finally { resume.resolve(); await syncing }
  expect(client.syncStatus()).toMatchObject({ connected: false, state: 'local', restoring: false })
})

it('serializes a same-library rebind without Web Locks until the previous transfer unwinds', async () => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  let requests = 0
  server.gates.before = async path => {
    if (path.includes('/commits?')) { requests++; if (requests === 1) { entered.resolve(); await resume.promise } }
  }
  const oldSync = client.syncNow()
  let newSync: Promise<void> | undefined
  try {
    await entered.promise
    release()
    release = client.bindCloudIdentity('user_alpha', async () => 'refreshed-token')
    newSync = client.syncNow()
    await new Promise(resolve => setImmediate(resolve))
    expect(requests).toBe(1)
    expect(await client.withSyncedLibrary(async db => db.name)).toEqual({ value: `prism-cloud-${server.id}` })
  } finally { resume.resolve(); await oldSync; await newSync }
  expect(requests).toBe(2)
  expect(client.syncStatus()).toMatchObject({ state: 'synced', restoring: false })
})

it('invalidates cloud selection immediately when disconnect queues behind a local operation', async () => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  const reading = client.withSyncedLibrary(async () => { entered.resolve(); await resume.promise })
  await entered.promise
  const disconnecting = client.disconnectSyncedLibrary()
  try {
    let result: { value: string } | null | undefined
    const selection = client.withSyncedLibrary(async db => db.name).then(value => { result = value })
    await vi.waitFor(() => expect(result).toBeNull(), { timeout: 1000 })
    await selection
  } finally { resume.resolve(); await reading; await disconnecting }
  expect(client.syncStatus()).toMatchObject({ connected: false, state: 'local' })
})

it('serializes cloud deletion after an in-flight upload while keeping local writes available', async () => {
  const server = cloudServer(), entered = deferred(), resume = deferred()
  const client = await browser(server.fetcher as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  await saveFolder(client, 'Pending')
  server.gates.before = async (_path, init) => { if (init?.method === 'PUT') { entered.resolve(); await resume.promise } }
  const syncing = client.syncNow()
  let deleting: Promise<void> | undefined
  try {
    await entered.promise
    deleting = client.deleteSyncedLibrary()
    await saveFolder(client, 'Retained locally')
    expect(server.fetcher.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  } finally { resume.resolve(); await syncing; await deleting }
  expect(server.fetcher.mock.calls.at(-1)?.[1]?.method).toBe('DELETE')
  expect(client.syncStatus()).toMatchObject({ connected: false, state: 'local' })
})
it('transfers saved records and lazy file bytes into a fresh device, without transferring agent grants', async () => {
  const id = 'a'.repeat(64), objects = new Map<string, Uint8Array>(), commits: Array<{ revision: number; mutation: string; objects: string[] }> = []
  const transport = vi.fn(async (path: string | URL | Request, init?: RequestInit) => {
    const url = String(path), method = init?.method ?? 'GET'
    if (url === '/api/cloud/library') return Response.json({ library: { id, head: commits.length, deleted: 0 }, usedBytes: 0, quotaBytes: 1e9, mode: 'local' })
    if (url.includes('/objects/')) {
      const key = url.split('/').at(-1)!
      if (method === 'PUT') { objects.set(key, new Uint8Array(await (init!.body as Blob).arrayBuffer())); return Response.json({ stored: true }) }
      return new Response(objects.get(key) as Uint8Array<ArrayBuffer>)
    }
    if (method === 'POST') { const body = JSON.parse(init!.body as string); commits.push({ revision: commits.length + 1, mutation: body.mutation, objects: body.objects }); return Response.json({ revision: commits.length }) }
    const after = Number(new URL(url, 'http://local').searchParams.get('after') ?? 0)
    return Response.json({ head: commits.length, commits: commits.filter(c => c.revision > after) })
  }) as unknown as typeof fetch
  let client = await browser(transport)
  release = client.bindCloudIdentity('user_alpha', async () => 'test-token')
  await client.connectCloudLibrary(true, false)
  await client.withSyncedLibrary(async (db, directory) => {
    const writer = await (await (await directory.getDirectoryHandle('sources', { create: true })).getFileHandle('synthetic.pdf', { create: true })).createWritable()
    await writer.write(new Blob(['synthetic PDF bytes'])); await writer.close()
    const tx = db.transaction(['sources', 'library_folders', 'source_agent_grants'], 'readwrite')
    tx.objectStore('sources').put({ id: 'source-test', file_name: 'synthetic.pdf', title: 'Test' })
    tx.objectStore('library_folders').put({ id: 'folder-test', name: 'Science' })
    tx.objectStore('source_agent_grants').put({ source_id: 'source-test', granted: true })
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error) })
  })
  await vi.waitFor(() => {
    expect(commits).toHaveLength(1)
    expect(client.syncStatus().state).toBe('synced')
  }, { timeout: 3000 })
  release(); release = undefined
  client = await browser(transport)
  release = client.bindCloudIdentity('user_alpha', async () => 'fresh-device-token')
  await client.connectCloudLibrary(false, false)
  expect(client.syncStatus().state).toBe('synced')
  await client.withSyncedLibrary(async (db, directory) => {
    const get = (store: string, key: string) => new Promise(resolve => { const req = db.transaction(store).objectStore(store).get(key); req.onsuccess = () => resolve(req.result) })
    expect(await get('sources', 'source-test')).toMatchObject({ title: 'Test' })
    expect(await get('library_folders', 'folder-test')).toMatchObject({ name: 'Science' })
    expect(await get('source_agent_grants', 'source-test')).toBeUndefined()
    const file = await (await (await directory.getDirectoryHandle('sources')).getFileHandle('synthetic.pdf')).getFile()
    expect(await file.text()).toBe('synthetic PDF bytes')
  })
})
it('aborts an old account request when identity changes and never persists its token', async () => {
  let finish!: (value: Response) => void
  const client = await browser(vi.fn(() => new Promise<Response>(resolve => { finish = resolve })) as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'private-test-token')
  const pending = client.cloudLibraryInfo()
  await Promise.resolve(); await Promise.resolve()
  release()
  release = client.bindCloudIdentity('user_beta', async () => 'other-token')
  finish(Response.json({ library: { id: 'old-owner' } }))
  await expect(pending).rejects.toThrow('Account changed')
  expect(client.syncStatus().connected).toBe(false)
})
it('reopens only the restored owner’s opted-in cache when the network is offline', async () => {
  const id = 'b'.repeat(64)
  const client = await browser(vi.fn(async () => { throw new TypeError('offline') }) as typeof fetch)
  localStorage.setItem('prism-cloud-enabled:user_alpha', 'true')
  localStorage.setItem('prism-cloud-library:user_alpha', id)
  release = client.bindCloudIdentity('user_alpha', async () => 'restored-session')
  await client.syncNow()
  expect(client.syncStatus()).toMatchObject({ connected: true, state: 'offline' })
  expect(await client.withSyncedLibrary(async db => db.name)).toEqual({ value: `prism-cloud-${id}` })
  release()
  release = client.bindCloudIdentity('user_beta', async () => 'other-session')
  expect(await client.withSyncedLibrary(async db => db.name)).toBeNull()
})

it('honors rate limits across retries and account rebinding, then sends retained changes', async () => {
  let now = Date.now(), limited = false
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now)
  const id = 'c'.repeat(64), objects = new Map<string, Blob>(), commits: Array<{ revision: number; mutation: string; objects: string[] }> = []
  const transport = vi.fn(async (path: string, init?: RequestInit) => {
    if (limited) return Response.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': '120' } })
    if (path === '/api/cloud/library') return Response.json({ library: { id, head: commits.length }, usedBytes: 0, quotaBytes: 1e9 })
    if (path.includes('/objects/')) { const key = path.split('/').at(-1)!; if (init?.method === 'PUT') { objects.set(key, init.body as Blob); return Response.json({ stored: true }) } return new Response(objects.get(key)) }
    if (init?.method === 'POST') { const body = JSON.parse(init.body as string); commits.push({ revision: commits.length + 1, mutation: body.mutation, objects: body.objects }); return Response.json({ revision: commits.length }) }
    const after = Number(new URL(path, 'http://local').searchParams.get('after'))
    return Response.json({ head: commits.length, commits: commits.filter(c => c.revision > after) })
  })
  const client = await browser(transport as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'test-token')
  await client.connectCloudLibrary(false, false)
  limited = true
  await client.withSyncedLibrary(async db => {
    const { transactionDone } = await import('./syncDatabase')
    const tx = db.transaction('library_folders', 'readwrite')
    tx.objectStore('library_folders').put({ id: 'pending-folder', name: 'Retained offline' })
    await transactionDone(tx)
  })
  await client.syncNow()
  const count = transport.mock.calls.length
  expect(client.syncStatus().state).toBe('error')
  expect(client.syncStatus().detail).toContain('retry after')
  release(); release = client.bindCloudIdentity('user_alpha', async () => 'restored-token')
  for (let n = 0; n < 5; n++) await client.syncNow()
  await expect(client.cloudLibraryInfo()).rejects.toThrow('retry after')
  expect(transport).toHaveBeenCalledTimes(count)
  now += 121000; limited = false
  await client.syncNow()
  expect(client.syncStatus().state).toBe('synced')
  expect(commits).toHaveLength(1)
  await client.withSyncedLibrary(async db => {
    const { allRecords } = await import('./syncDatabase')
    expect(await allRecords(db, 'sync_outbox')).toEqual([])
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'pending-folder', name: 'Retained offline' }])
  })
  clock.mockRestore()
})

it('stops an acknowledgement loop without discarding the pending change', async () => {
  const id = 'd'.repeat(64)
  const transport = vi.fn(async (path: string, init?: RequestInit) => {
    if (path === '/api/cloud/library') return Response.json({ library: { id, head: 0 } })
    if (init?.method) return Response.json({ revision: 1, stored: true })
    return Response.json({ head: 0, commits: [] })
  })
  const client = await browser(transport as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'test-token')
  await client.connectCloudLibrary(false, false)
  await client.withSyncedLibrary(async db => {
    const { transactionDone } = await import('./syncDatabase')
    const tx = db.transaction('library_folders', 'readwrite')
    tx.objectStore('library_folders').put({ id: 'pending-folder', name: 'Keep me' })
    await transactionDone(tx)
  })
  await client.syncNow()
  expect(client.syncStatus()).toMatchObject({ state: 'error', pending: 1 })
  expect(client.syncStatus().detail).toContain('could not confirm progress')
  expect(transport.mock.calls.length).toBeLessThan(20)
  await client.withSyncedLibrary(async db => {
    const { allRecords } = await import('./syncDatabase')
    expect(await allRecords(db, 'sync_outbox')).toHaveLength(1)
  })
})

it('resumes an interrupted multi-object download from verified cached chunks', async () => {
  const { packObject } = await import('./cloudObjects')
  const id = 'e'.repeat(64)
  const bytes = new TextEncoder().encode(JSON.stringify({ format: 1, parent: 0, files: {}, entries: [{ id: 'remote', created: 1, changes: [{ store: 'library_folders', key: 'folder', base: null, value: { id: 'folder', name: 'Restored' } }] }] }))
  const first = await packObject(bytes.slice(0, 50)), second = await packObject(bytes.slice(50))
  let fail = true
  const transport = vi.fn(async (path: string) => {
    if (path === '/api/cloud/library') return Response.json({ library: { id, head: 1 } })
    if (path.endsWith(first.id)) return new Response(new Uint8Array(first.bytes))
    if (path.endsWith(second.id)) { if (fail) throw new TypeError('Connection interrupted'); return new Response(new Uint8Array(second.bytes)) }
    return Response.json({ head: 1, commits: path.endsWith('after=0') ? [{ revision: 1, mutation: 'remote', objects: [first.id, second.id] }] : [] })
  })
  const client = await browser(transport as typeof fetch)
  release = client.bindCloudIdentity('user_alpha', async () => 'test-token')
  await client.connectCloudLibrary(false, false)
  expect(client.syncStatus().state).toBe('offline')
  fail = false
  await client.syncNow()
  expect(client.syncStatus().state).toBe('synced')
  expect(transport.mock.calls.filter(([path]) => path.endsWith(first.id))).toHaveLength(1)
  expect(transport.mock.calls.filter(([path]) => path.endsWith(second.id))).toHaveLength(2)
  await client.withSyncedLibrary(async db => {
    const { allRecords } = await import('./syncDatabase')
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Restored' }])
  })
})


it('automatically opens an existing account library on a new browser without creating or copying one', async () => {
  const id = 'f'.repeat(64)
  const transport = vi.fn(async (path: string, init?: RequestInit) => !init?.method && path === '/api/cloud/library'
    ? Response.json({ library: { id, head: 0, deleted: 0 } })
    : Response.json({ head: 0, commits: [] }))
  const client = await browser(transport as typeof fetch)
  localStorage.removeItem('prism-cloud-enabled:user_alpha')
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  expect(client.syncStatus().restoring).toBe(true)
  await vi.waitFor(() => expect(client.syncStatus()).toMatchObject({ connected: true, state: 'synced', restoring: false }))
  expect(transport.mock.calls.every(call => call[1]?.method === undefined)).toBe(true)
  expect(transport.mock.calls.filter(([path]) => path === '/api/cloud/library')).toHaveLength(1)
  expect(localStorage.getItem('prism-cloud-enabled:user_alpha')).toBe('true')
})

it.each([false, true])('restores a fresh device in bounded download windows, in order, with interruption=%s', async interrupted => {
  const { packObject } = await import('./cloudObjects')
  const objects = new Map<string, Uint8Array>()
  const commits: Array<{ revision: number; mutation: string; objects: string[] }> = []
  for (let revision = 1; revision <= 8; revision++) {
    const packed = await packObject(new TextEncoder().encode(JSON.stringify({ format: 1, parent: revision - 1, files: {}, entries: [{ id: `change-${revision}`, created: revision, changes: [{ store: 'library_folders', key: 'folder', base: revision === 1 ? null : `change-${revision - 1}`, value: { id: 'folder', name: `Version ${revision}` } }] }] })))
    objects.set(packed.id, packed.bytes)
    commits.push({ revision, mutation: `change-${revision}`, objects: [packed.id] })
  }
  const waiting: Array<{ id: string; resolve: (response: Response) => void }> = []
  let active = 0, peak = 0
  const transport = vi.fn(async (path: string) => {
    if (path === '/api/cloud/library') return Response.json({ library: { id: '8'.repeat(64), head: 8 } })
    if (path.includes('/objects/')) {
      active++; peak = Math.max(peak, active)
      try { return await new Promise<Response>(resolve => waiting.push({ id: path.split('/').at(-1)!, resolve })) }
      finally { active-- }
    }
    return Response.json({ head: 8, commits: commits.filter(commit => commit.revision > Number(new URL(path, 'http://test').searchParams.get('after'))) })
  })
  const client = await browser(transport as typeof fetch)
  const refresh = vi.fn()
  window.addEventListener('prism:vault-changed', refresh)
  localStorage.removeItem('prism-cloud-enabled:user_alpha')
  release = client.bindCloudIdentity('user_alpha', async () => 'fresh-device-token')
  // The mounted account panel asks for allowance at the same time as discovery.
  await client.cloudLibraryInfo()
  await vi.waitFor(() => expect(waiting).toHaveLength(4))
  expect(transport.mock.calls.filter(([path]) => path === '/api/cloud/library')).toHaveLength(1)
  expect(client.syncStatus()).toMatchObject({ restoring: true, state: 'syncing' })
  const finish = () => { for (const item of waiting.splice(0).reverse()) item.resolve(new Response(new Uint8Array(objects.get(item.id)!))) }
  if (interrupted) {
    waiting.shift()!.resolve(Response.json({ error: 'Temporary download failure' }, { status: 503 }))
    await new Promise(resolve => setImmediate(resolve))
    expect(client.syncStatus().state).toBe('syncing')
    finish()
    await vi.waitFor(() => expect(client.syncStatus()).toMatchObject({ state: 'error', restoring: false }))
    expect(active).toBe(0)
    void client.syncNow()
    await vi.waitFor(() => expect(waiting).toHaveLength(1))
    // The other three verified objects survive the interruption.
    finish()
  } else finish()
  await vi.waitFor(() => expect(waiting).toHaveLength(4))
  finish()
  await vi.waitFor(() => expect(client.syncStatus()).toMatchObject({ state: 'synced', restoring: false, revision: 8 }))
  expect(peak).toBe(4)
  expect(active).toBe(0)
  // Identity selection, cloud selection, and one completed replay notification.
  expect(refresh).toHaveBeenCalledTimes(3)
  await client.withSyncedLibrary(async db => {
    const { allRecords, getRecord } = await import('./syncDatabase')
    expect(await allRecords(db, 'library_folders')).toEqual([{ id: 'folder', name: 'Version 8' }])
    expect(await getRecord(db, 'sync_meta', 'head')).toBe(8)
    expect(await allRecords(db, 'sync_outbox')).toEqual([])
  })
})

it('keeps a new account local when no cloud library exists, and respects an explicit browser-library choice', async () => {
  const transport = vi.fn(async () => Response.json({ library: null }))
  const client = await browser(transport as typeof fetch)
  localStorage.removeItem('prism-cloud-enabled:user_alpha')
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await vi.waitFor(() => expect(client.syncStatus().restoring).toBe(false))
  expect(client.syncStatus().connected).toBe(false)
  await client.disconnectSyncedLibrary()
  release()
  transport.mockClear()
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await Promise.resolve()
  expect(transport).not.toHaveBeenCalled()
})

it('does not reopen cloud storage if the learner chooses the browser library during restoration', async () => {
  let respond!: (response: Response) => void
  const transport = vi.fn(() => new Promise<Response>(resolve => { respond = resolve }))
  const client = await browser(transport as typeof fetch)
  localStorage.removeItem('prism-cloud-enabled:user_alpha')
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1))
  await client.disconnectSyncedLibrary()
  respond(Response.json({ library: { id: 'f'.repeat(64), head: 0, deleted: 0 } }))
  await new Promise(resolve => setImmediate(resolve))
  expect(transport).toHaveBeenCalledTimes(1)
  expect(client.syncStatus()).toMatchObject({ connected: false, state: 'local', restoring: false })
  expect(localStorage.getItem('prism-cloud-enabled:user_alpha')).toBe('false')
})

it('retries a failed fresh-browser restoration when connectivity returns, even in a hidden tab', async () => {
  let offline = true
  const transport = vi.fn(async (path: string) => {
    if (offline) throw new TypeError('offline')
    return path === '/api/cloud/library' ? Response.json({ library: { id: '9'.repeat(64), head: 0 } }) : Response.json({ head: 0, commits: [] })
  })
  const client = await browser(transport as typeof fetch)
  const doc = Object.assign(new EventTarget(), { visibilityState: 'hidden' })
  vi.stubGlobal('document', doc)
  localStorage.removeItem('prism-cloud-enabled:user_alpha')
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  const stop = client.startSyncWatching()
  try {
    await vi.waitFor(() => expect(client.syncStatus()).toMatchObject({ state: 'error', restoring: false }))
    offline = false
    window.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(client.syncStatus()).toMatchObject({ connected: true, state: 'synced', restoring: false }))
  } finally { stop() }
})

it('retrieves remote changes on tab visibility and polls only visible tabs, without manual sync', async () => {
  const transport = vi.fn(async (path: string) => path === '/api/cloud/library'
    ? Response.json({ library: { id: '1'.repeat(64), head: 0 } })
    : Response.json({ head: 0, commits: [] }))
  const client = await browser(transport as typeof fetch)
  const page = Object.assign(new EventTarget(), { visibilityState: 'hidden' })
  vi.stubGlobal('document', page)
  release = client.bindCloudIdentity('user_alpha', async () => 'token')
  await client.connectCloudLibrary(false, false)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  const stop = client.startSyncWatching()
  try {
    transport.mockClear()
    await vi.advanceTimersByTimeAsync(30000)
    expect(transport).not.toHaveBeenCalled()
    page.visibilityState = 'visible'
    page.dispatchEvent(new Event('visibilitychange'))
    await client.syncNow()
    expect(transport).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30000)
    await client.syncNow()
    expect(transport).toHaveBeenCalledTimes(2)
  } finally { stop() }
})

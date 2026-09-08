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
afterEach(() => { release?.(); release = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules() })
async function browser(fetcher: typeof fetch) {
  vi.resetModules()
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange)
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('navigator', { storage: { getDirectory: async () => root } })
  const root = new Directory(), preferences = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => preferences.set(key, value), removeItem: (key: string) => preferences.delete(key) })
  vi.stubGlobal('fetch', fetcher)
  return import('./syncedLibrary')
}
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
  await client.syncNow()
  expect(client.syncStatus().state).toBe('synced')
  expect(commits).toHaveLength(1)
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

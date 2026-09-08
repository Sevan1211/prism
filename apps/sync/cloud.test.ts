import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { afterEach, expect, it, vi } from 'vitest'
import worker, { reconcileDeletedAccounts, type Env } from './worker'

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
const origin = 'http://127.0.0.1:5173'
const databases: DatabaseSync[] = []
afterEach(() => { databases.splice(0).forEach(db => db.close()); vi.unstubAllGlobals() })
function jwt(owner: string) {
  const now = Math.floor(Date.now() / 1000)
  const head = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ sub: owner, sid: 'sess_test', iss: 'https://prism-test.clerk.accounts.dev', azp: origin, iat: now, nbf: now - 1, exp: now + 60 })).toString('base64url')
  return `${head}.${body}.${sign('RSA-SHA256', Buffer.from(`${head}.${body}`), pair.privateKey).toString('base64url')}`
}
function fixture() {
  const db = new DatabaseSync(':memory:'); databases.push(db)
  db.exec(readFileSync('drizzle/0001_cloud_accounts.sql', 'utf8'))
  function prepare(sql: string, values: SQLInputValue[] = []) {
    return { bind: (...args: SQLInputValue[]) => prepare(sql, args),
      first: async () => db.prepare(sql).get(...values) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...values) }),
      run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...values).changes) } }),
    }
  }
  const files = new Map<string, Uint8Array>()
  const env = { CLERK_JWT_KEY: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(), CLERK_ISSUER: 'https://prism-test.clerk.accounts.dev', PRISM_APP_ORIGIN: origin,
    CLOUD_STORAGE_ENABLED: 'true', CLOUD_STORAGE_MODE: 'local',
    DB: { prepare, batch: async (statements: Array<{ run: () => Promise<unknown> }>) => { db.exec('BEGIN'); try { const results = []; for (const s of statements) results.push(await s.run()); db.exec('COMMIT'); return results } catch (e) { db.exec('ROLLBACK'); throw e } } },
    FILES: { head: async (key: string) => files.has(key) ? {} : null,
      get: async (key: string) => files.has(key) ? { body: files.get(key) } : null,
      put: async (key: string, bytes: Uint8Array) => { files.set(key, bytes); return {} },
      list: async ({ prefix }: { prefix: string }) => ({ objects: [...files.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }),
      delete: async (keys: string | string[]) => { for (const key of [keys].flat()) files.delete(key) },
    }, ASSETS: { fetch: async () => new Response('not found', { status: 404 }) },
  } as unknown as Env
  const request = (owner: string, path: string, method = 'GET', data?: unknown) => worker.fetch(new Request(`${origin}/api/cloud${path}`, { method, headers: { Authorization: `Bearer ${jwt(owner)}`, Origin: origin }, ...(data !== undefined ? { body: data instanceof Uint8Array ? data : JSON.stringify(data) } : {}) }), env)
  const create = async (owner = 'user_alpha') => { const response = await request(owner, '/library', 'POST', { consent: true }); expect(response.status).toBe(200); return (await response.json() as { library: { id: string } }).library.id }
  const upload = async (id: string, value: number, owner = 'user_alpha') => { const bytes = new Uint8Array(16).fill(value), hash = createHash('sha256').update(bytes).digest('hex'); return { hash, bytes, response: await request(owner, `/libraries/${id}/objects/${hash}`, 'PUT', bytes) } }
  return { db, env, files, request, create, upload }
}
it('requires consent and derives one library from the signed account', async () => {
  const f = fixture()
  expect((await f.request('user_alpha', '/library', 'POST', { owner: 'user_beta' })).status).toBe(400)
  const id = await f.create()
  expect(await f.create()).toBe(id)
  expect(f.db.prepare('SELECT owner FROM cloud_libraries').get()?.owner).toBe('user_alpha')
  expect((await f.request('user_beta', `/libraries/${id}/commits`)).status).toBe(404)
  expect((await f.request('user_beta', `/libraries/${id}`, 'DELETE')).status).toBe(404)
})
it('reclaims deleted accounts, preserves existing users and retries interrupted deletion', async () => {
  const f = fixture(), removed = await f.create(), kept = await f.create('user_beta')
  await f.upload(removed, 2)
  await f.upload(kept, 3, 'user_beta')
  f.env.CLOUD_STORAGE_MODE = 'remote'; f.env.CLERK_SECRET_KEY = 'sk_live_test'
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(null, { status: url.endsWith('user_alpha') ? 404 : 200 })))
  await reconcileDeletedAccounts(f.env)
  expect(f.db.prepare('SELECT deleted FROM cloud_libraries WHERE id = ?').get(removed)?.deleted).toBe(2)
  expect([...f.files.keys()].every(key => key.startsWith(kept))).toBe(true)
  f.db.prepare('UPDATE cloud_libraries SET deleted = 1 WHERE id = ?').run(kept)
  await reconcileDeletedAccounts(f.env)
  expect(f.files.size).toBe(0)
})
it('never erases an account library when the identity provider is unavailable', async () => {
  const f = fixture(), id = await f.create(); await f.upload(id, 1)
  f.env.CLOUD_STORAGE_MODE = 'remote'; f.env.CLERK_SECRET_KEY = 'sk_live_test'
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
  await expect(reconcileDeletedAccounts(f.env)).rejects.toThrow('provider unavailable')
  expect(f.files.size).toBe(1)
  expect(f.db.prepare('SELECT deleted FROM cloud_libraries WHERE id = ?').get(id)?.deleted).toBe(0)
})
it('rejects API bursts before authentication or storage work', async () => {
  const f = fixture()
  f.env.API_RATE_LIMIT = { limit: async () => ({ success: false }) }
  const response = await worker.fetch(new Request(`${origin}/api/account/session`), f.env)
  expect(response.status).toBe(429)
  expect(f.db.prepare('SELECT COUNT(*) AS count FROM cloud_libraries').get()?.count).toBe(0)
})
it('round-trips bytes, commits idempotently and keeps another account out', async () => {
  const f = fixture(), id = await f.create(), uploaded = await f.upload(id, 5)
  expect(uploaded.response.status).toBe(201)
  expect((await f.upload(id, 5)).response.status).toBe(200)
  const path = `/libraries/${id}/objects/${uploaded.hash}`
  expect(new Uint8Array(await (await f.request('user_alpha', path)).arrayBuffer())).toEqual(uploaded.bytes)
  expect((await f.request('user_beta', path)).status).toBe(404)
  expect((await f.upload(id, 6, 'user_beta')).response.status).toBe(404)
  const commit = { base: 0, mutation: crypto.randomUUID(), objects: [uploaded.hash] }
  expect((await f.request('user_alpha', `/libraries/${id}/commits`, 'POST', commit)).status).toBe(201)
  expect((await f.request('user_alpha', `/libraries/${id}/commits`, 'POST', commit)).status).toBe(200)
  expect((await f.request('user_alpha', `/libraries/${id}/commits`, 'POST', { ...commit, mutation: crypto.randomUUID() })).status).toBe(409)
  const history = await (await f.request('user_alpha', `/libraries/${id}/commits`)).json()
  expect(history).toMatchObject({ head: 1, commits: [{ objects: [uploaded.hash] }] })
})
it('rejects corrupt objects and missing commit objects', async () => {
  const f = fixture(), id = await f.create()
  expect((await f.request('user_alpha', `/libraries/${id}/objects/${'a'.repeat(64)}`, 'PUT', new Uint8Array(16))).status).toBe(400)
  expect((await f.request('user_alpha', `/libraries/${id}/commits`, 'POST', { base: 0, mutation: crypto.randomUUID(), objects: ['a'.repeat(64)] })).status).toBe(409)
})
it('atomically enforces 1 GB including competing upload reservations', async () => {
  const f = fixture(), id = await f.create()
  f.db.prepare('INSERT INTO cloud_objects VALUES (?, ?, ?)').run(id, 'reserved', 1_000_000_000 - 16)
  const results = await Promise.all([f.upload(id, 1), f.upload(id, 2)])
  expect(results.map(r => r.response.status).sort()).toEqual([201, 413])
  expect((await (await f.request('user_alpha', '/library')).json() as { usedBytes: number }).usedBytes).toBe(1_000_000_000)
})
it('enforces 50 GB globally and 50 active account libraries', async () => {
  const f = fixture(), id = await f.create()
  f.db.prepare('INSERT INTO cloud_objects VALUES (?, ?, ?)').run('other', 'reserved', 50_000_000_000 - 16)
  expect((await f.upload(id, 1)).response.status).toBe(201)
  expect((await f.upload(id, 2)).response.status).toBe(413)
  for (let n = 1; n < 50; n++) f.db.prepare('INSERT INTO cloud_libraries(id,owner,created) VALUES(?,?,0)').run(`library-${n}`, `user_${n}`)
  expect((await f.request('user_extra', '/library', 'POST', { consent: true })).status).toBe(409)
})
it('deletes cloud bytes and revisions, and blocks further writes to the deleted library', async () => {
  const f = fixture(), id = await f.create(); await f.upload(id, 1)
  expect((await f.request('user_alpha', `/libraries/${id}`, 'DELETE')).status).toBe(200)
  expect(f.files.size).toBe(0)
  expect((await f.upload(id, 2)).response.status).toBe(410)
  const replacement = await f.create()
  expect(replacement).not.toBe(id)
  expect((await f.upload(id, 3)).response.status).toBe(404)
  expect((await f.upload(replacement, 4)).response.status).toBe(201)
})
it('fails closed when storage is disabled, unsigned or a recovery route is used', async () => {
  const f = fixture()
  expect((await worker.fetch(new Request(`${origin}/api/cloud/library`), f.env)).status).toBe(401)
  expect((await worker.fetch(new Request(`${origin}/api/sync/libraries`), f.env)).status).toBe(410)
  f.env.CLOUD_STORAGE_ENABLED = 'false'
  expect((await f.request('user_alpha', '/library')).status).toBe(503)
})

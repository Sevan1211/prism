import { accountSession, authenticateAccount, type AccountEnv } from './account'
import { CLOUD_POLICY } from '../../shared/cloudPolicy'

export interface Env extends AccountEnv { DB: D1Database; FILES: R2Bucket; ASSETS: Fetcher; API_RATE_LIMIT?: RateLimit }
const MAX_OBJECT = 4 * 1024 * 1024 + 64
const LIBRARY_QUOTA = CLOUD_POLICY.quotaBytes
const SITE_QUOTA = CLOUD_POLICY.globalQuotaBytes
const idPattern = /^[a-f0-9]{64}$/
const uuidPattern = /^[a-f0-9-]{36}$/
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
class HttpError extends Error { constructor(readonly status: number, message: string) { super(message) } }
function assert(value: unknown, status: number, message: string): asserts value { if (!value) throw new HttpError(status, message) }
async function hashBytes(value: Uint8Array) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value as Uint8Array<ArrayBuffer>)), b => b.toString(16).padStart(2, '0')).join('') }
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
async function boundedBody(request: Request, max: number) {
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  let size = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) { await reader.cancel(); throw new HttpError(413, 'Upload exceeds the request limit.') }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const part of chunks) { bytes.set(part, offset); offset += part.length }
  return bytes
}
async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(await boundedBody(request, 32_768)))
    assert(value && typeof value === 'object' && !Array.isArray(value), 400, 'Invalid request.')
    return value as Record<string, unknown>
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Invalid request.') }
}
async function rate(env: Env, key: string, limit: number, period: number) {
  const now = Math.floor(Date.now() / 1000), window = Math.floor(now / period)
  const result = await env.DB.prepare('INSERT INTO cloud_limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(`${key}:${window}`, now + period * 2).first<{ count: number }>()
  assert(result && result.count <= limit, 429, 'Please wait before trying again.')
  // Bounded cleanup; no source content or raw client addresses enter this table.
  if (result.count === 1) await env.DB.prepare('DELETE FROM cloud_limits WHERE key IN (SELECT key FROM cloud_limits WHERE expires < ? LIMIT 100)').bind(now).run()
}
async function eraseLibrary(env: Env, library: string) {
  await env.DB.prepare('UPDATE cloud_libraries SET deleted = 1 WHERE id = ?').bind(library).run()
  for (let batch = 0; batch < 8; batch++) {
    const listed = await env.FILES.list({ prefix: `${library}/`, limit: 1000 })
    if (!listed.objects.length) {
      await env.DB.batch(['cloud_objects', 'cloud_commits'].map(table => env.DB.prepare(`DELETE FROM ${table} WHERE library = ?`).bind(library)))
      await env.DB.prepare('UPDATE cloud_libraries SET deleted = 2 WHERE id = ?').bind(library).run()
      return true
    }
    await env.FILES.delete(listed.objects.map(object => object.key))
  }
  return false
}

// Account deletion in Clerk must also remove its private library. Hourly retries
// also finish interrupted library deletions. Provider outages never erase data.
export async function reconcileDeletedAccounts(env: Env) {
  if (env.CLOUD_STORAGE_MODE !== 'remote' || !env.CLERK_SECRET_KEY?.startsWith('sk_live_')) return
  const rows = await env.DB.prepare('SELECT id, owner, deleted FROM cloud_libraries WHERE deleted < 2 ORDER BY deleted DESC, created ASC LIMIT 50').all<{ id: string; owner: string; deleted: number }>()
  for (const library of rows.results) {
    if (library.deleted === 1) { await eraseLibrary(env, library.id); continue }
    const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(library.owner)}`, {
      headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` }, signal: AbortSignal.timeout(10000),
    })
    if (response.status === 404) await eraseLibrary(env, library.id)
    else if (!response.ok) throw new Error('Account cleanup provider unavailable; retry next scheduled run.')
  }
}
async function route(request: Request, env: Env) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/') && env.API_RATE_LIMIT) {
    // Coarse pre-auth burst protection; account-level limits still apply after
    // verification. Cloudflare maintains these counters locally at each edge.
    const limited = await env.API_RATE_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'local' })
    assert(limited.success, 429, 'Too many requests. Please wait a minute before trying again.')
  }
  if (url.pathname === '/api/account/session') return accountSession(request, env)
  if (url.pathname.startsWith('/api/account/')) throw new HttpError(404, 'Not found.')
  if (url.pathname.startsWith('/api/sync/')) return json({ error: 'Recovery-key sync has been retired. Use your PRISM account.' }, 410)
  if (!url.pathname.startsWith('/api/cloud/')) {
    const asset = await env.ASSETS.fetch(request)
    // Preserve direct document navigation when an asset host has no SPA fallback.
    // Document navigations must still reopen routed sources and lessons directly.
    if (asset.status === 404 && request.method === 'GET' && (request.headers.get('Accept')?.includes('text/html') || /^\/sources(?:\/|$)/.test(url.pathname))) {
      return env.ASSETS.fetch(new Request(new URL('/', url), request))
    }
    return asset
  }
  const account = await authenticateAccount(request, env)
  if (account instanceof Response) return account
  assert(env.CLOUD_STORAGE_ENABLED === 'true' && env.DB && env.FILES, 503, 'Cloud storage is not connected yet. Your local library is available.')
  await rate(env, `requests:${account.accountId}`, 2400, 3600)
  const parts = url.pathname.split('/').filter(Boolean)
  if (url.pathname === '/api/cloud/library') {
    if (request.method === 'POST') {
      const data = await body(request)
      assert(data.consent === true, 400, 'Confirm cloud storage before creating a library.')
      await env.DB.prepare('INSERT INTO cloud_libraries (id, owner, created) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM cloud_libraries WHERE deleted = 0) < ? ON CONFLICT(owner) DO UPDATE SET id = excluded.id, head = 0, last_mutation = NULL, created = excluded.created, deleted = 0 WHERE cloud_libraries.deleted = 2')
        .bind(randomId(), account.accountId, Date.now(), CLOUD_POLICY.maxLibraries).run()
    } else assert(request.method === 'GET', 405, 'Method not allowed.')
    const library = await env.DB.prepare('SELECT id, head, deleted FROM cloud_libraries WHERE owner = ?').bind(account.accountId).first<{ id: string; head: number; deleted: number }>()
    if (request.method === 'POST') assert(library && library.deleted === 0, 409, 'A cloud library cannot be created yet. The beta may be full or a previous deletion may still be finishing. Your local library remains available.')
    const usage = library ? await env.DB.prepare('SELECT COALESCE(SUM(bytes), 0) AS bytes FROM cloud_objects WHERE library = ?').bind(library.id).first<{ bytes: number }>() : null
    return json({ library, usedBytes: usage?.bytes ?? 0, quotaBytes: LIBRARY_QUOTA, mode: env.CLOUD_STORAGE_MODE === 'remote' ? 'remote' : 'local' })
  }
  const library = parts[3]
  assert(parts[2] === 'libraries' && library && idPattern.test(library), 404, 'Not found.')
  const vault = await env.DB.prepare('SELECT id, head, deleted FROM cloud_libraries WHERE id = ? AND owner = ?').bind(library, account.accountId).first<{ id: string; head: number; deleted: number }>()
  assert(vault, 404, 'Cloud library not found for this account.')
  if (parts.length === 4 && request.method === 'DELETE') {
    const deleted = await eraseLibrary(env, library)
    return json(deleted ? { deleted: true } : { deleted: false, retry: true }, deleted ? 200 : 202)
  }
  assert(!vault.deleted, 410, 'This synced library was deleted. Cached files remain on this browser.')
  if (parts[4] === 'commits' && parts.length === 5) {
    if (request.method === 'GET') {
      const after = Number(url.searchParams.get('after') ?? 0)
      assert(Number.isSafeInteger(after) && after >= 0, 400, 'Invalid revision.')
      const rows = await env.DB.prepare('SELECT revision, mutation, objects FROM cloud_commits WHERE library = ? AND revision > ? ORDER BY revision LIMIT 50').bind(library, after).all<{ revision: number; mutation: string; objects: string }>()
      return json({ head: vault.head, commits: rows.results.map(row => ({ ...row, objects: JSON.parse(row.objects) })) })
    }
    if (request.method === 'POST') {
      const data = await body(request)
      assert(typeof data.mutation === 'string' && uuidPattern.test(data.mutation) && Number.isSafeInteger(data.base) && Number(data.base) >= 0, 400, 'Invalid commit.')
      assert(Array.isArray(data.objects) && data.objects.length > 0 && data.objects.length <= 64 && data.objects.every(id => typeof id === 'string' && idPattern.test(id)), 400, 'Invalid cloud object list.')
      const known = await env.DB.prepare('SELECT revision FROM cloud_commits WHERE library = ? AND mutation = ?').bind(library, data.mutation).first<{ revision: number }>()
      if (known) return json(known)
      const present = await Promise.all(data.objects.map(id => env.FILES.head(`${library}/${id}`)))
      assert(present.every(Boolean), 409, 'Finish uploading all commit chunks first.')
      const expected = Number(data.base), next = expected + 1
      await env.DB.batch([
        env.DB.prepare('UPDATE cloud_libraries SET head = head + 1, last_mutation = ? WHERE id = ? AND head = ? AND deleted = 0').bind(data.mutation, library, expected),
        env.DB.prepare('INSERT INTO cloud_commits (library, revision, mutation, objects, created) SELECT id, head, ?, ?, ? FROM cloud_libraries WHERE id = ? AND head = ? AND last_mutation = ?').bind(data.mutation, JSON.stringify(data.objects), Date.now(), library, next, data.mutation),
      ])
      const saved = await env.DB.prepare('SELECT revision FROM cloud_commits WHERE library = ? AND mutation = ?').bind(library, data.mutation).first<{ revision: number }>()
      assert(saved, 409, 'The library changed in another browser. Refresh before retrying.')
      return json(saved, 201)
    }
  }
  if (parts[4] === 'objects' && parts.length === 6 && idPattern.test(parts[5])) {
    const object = parts[5], key = `${library}/${object}`
    if (request.method === 'GET') {
      const result = await env.FILES.get(key)
      assert(result, 404, 'A cloud library object is missing.')
      return new Response(result.body, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
    }
    if (request.method === 'PUT') {
      const bytes = await boundedBody(request, MAX_OBJECT)
      assert(await hashBytes(bytes) === object, 400, 'The uploaded file failed verification.')
      const existing = await env.FILES.head(key)
      if (existing) return json({ stored: true })
      // Reserve space atomically before the blob write. Interrupted reservations count
      // toward quota and can be reused by the same immutable object on retry.
      await env.DB.prepare('INSERT INTO cloud_objects (library, id, bytes) SELECT ?, ?, ? WHERE (SELECT COALESCE(SUM(bytes), 0) FROM cloud_objects WHERE library = ?) + ? <= ? AND (SELECT COALESCE(SUM(bytes), 0) FROM cloud_objects) + ? <= ? ON CONFLICT(library, id) DO NOTHING').bind(library, object, bytes.length, library, bytes.length, LIBRARY_QUOTA, bytes.length, SITE_QUOTA).run()
      const reserved = await env.DB.prepare('SELECT bytes FROM cloud_objects WHERE library = ? AND id = ?').bind(library, object).first<{ bytes: number }>()
      assert(reserved && reserved.bytes === bytes.length, 413, 'Cloud storage is full. Your pending changes remain on this browser.')
      assert((await env.DB.prepare('SELECT deleted FROM cloud_libraries WHERE id = ?').bind(library).first<{ deleted: number }>())?.deleted === 0, 410, 'Cloud library was deleted.')
      await env.FILES.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: 'application/octet-stream' } })
      if ((await env.DB.prepare('SELECT deleted FROM cloud_libraries WHERE id = ?').bind(library).first<{ deleted: number }>())?.deleted !== 0) { await env.FILES.delete(key); throw new HttpError(410, 'Cloud library was deleted.') }
      return json({ stored: true }, 201)
    }
  }
  throw new HttpError(404, 'Not found.')
}
export default { async scheduled(_event: ScheduledController, env: Env) { await reconcileDeletedAccounts(env) }, async fetch(request: Request, env: Env) {
  try { return await route(request, env) }
  catch (error) { return json({ error: error instanceof HttpError ? error.message : 'The sync service could not complete this request. Your local changes are retained.' }, error instanceof HttpError ? error.status : 503) }
} }

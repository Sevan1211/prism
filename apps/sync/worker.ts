export interface Env { DB: D1Database; FILES: R2Bucket; ASSETS: Fetcher }
const MAX_OBJECT = 4 * 1024 * 1024 + 64
const LIBRARY_QUOTA = 512 * 1024 * 1024
const SITE_QUOTA = 5 * 1024 * 1024 * 1024
const idPattern = /^[a-f0-9]{64}$/
const uuidPattern = /^[a-f0-9-]{36}$/
const encoder = new TextEncoder()
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
class HttpError extends Error { constructor(readonly status: number, message: string) { super(message) } }
function assert(value: unknown, status: number, message: string): asserts value { if (!value) throw new HttpError(status, message) }
async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('') }
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
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
  const result = await env.DB.prepare('INSERT INTO sync_limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(`${key}:${window}`, now + period * 2).first<{ count: number }>()
  assert(result && result.count <= limit, 429, 'Please wait before trying again.')
  // Bounded cleanup; no source content or raw client addresses enter this table.
  await env.DB.prepare('DELETE FROM sync_limits WHERE key IN (SELECT key FROM sync_limits WHERE expires < ? LIMIT 100)').bind(now).run()
}
async function route(request: Request, env: Env) {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/sync/')) {
    const asset = await env.ASSETS.fetch(request)
    // Sites serves Worker assets without the local Wrangler SPA fallback.
    // Document navigations must still reopen routed sources and lessons directly.
    if (asset.status === 404 && request.method === 'GET' && (request.headers.get('Accept')?.includes('text/html') || /^\/sources(?:\/|$)/.test(url.pathname))) {
      return env.ASSETS.fetch(new Request(new URL('/', url), request))
    }
    return asset
  }
  if (url.pathname === '/api/sync/status' && request.method === 'GET') return json({ available: Boolean(env.DB && env.FILES), protocol: 1, quotaBytes: LIBRARY_QUOTA })
  assert(env.DB && env.FILES, 503, 'Encrypted sync is not available on this deployment yet.')
  const origin = request.headers.get('Origin')
  assert(!origin || origin === url.origin, 403, 'Use PRISM on its own website.')
  assert(request.headers.get('Sec-Fetch-Site') !== 'cross-site', 403, 'Cross-site requests are not allowed.')
  const client = await hash(request.headers.get('CF-Connecting-IP') ?? 'local')
  await rate(env, `requests:${client}`, 1200, 60)
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 3 && parts[2] === 'libraries' && request.method === 'POST') {
    await rate(env, `create:${client}`, 6, 86400)
    const data = await body(request)
    assert(typeof data.id === 'string' && idPattern.test(data.id) && typeof data.recovery === 'string' && idPattern.test(data.recovery), 400, 'Invalid library credentials.')
    const result = await env.DB.prepare('INSERT INTO sync_libraries (id, recovery_hash, created) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM sync_libraries WHERE deleted = 0) < 100 ON CONFLICT(id) DO NOTHING').bind(data.id, await hash(data.recovery), Date.now()).run()
    assert(result.meta.changes === 1, 409, 'This library already exists or the service has reached its library limit.')
    return json({ id: data.id }, 201)
  }
  const library = parts[3]
  assert(parts[2] === 'libraries' && library && idPattern.test(library), 404, 'Not found.')
  const credential = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  assert(idPattern.test(credential), 401, 'Reconnect your library with its recovery key.')
  const credentialHash = await hash(credential)
  const vault = await env.DB.prepare('SELECT id, recovery_hash, head, deleted FROM sync_libraries WHERE id = ?').bind(library).first<{ id: string; recovery_hash: string; head: number; deleted: number }>()
  assert(vault, 401, 'Library credentials were not accepted.')
  if (parts[4] === 'devices' && parts.length === 5 && request.method === 'POST') {
    assert(vault.recovery_hash === credentialHash && !vault.deleted, 401, 'Library credentials were not accepted.')
    const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM sync_devices WHERE library = ? AND revoked = 0').bind(library).first<{ count: number }>()
    assert(count && count.count < 20, 409, 'Disconnect an old browser before adding another.')
    const id = crypto.randomUUID(), secret = token()
    await env.DB.prepare('INSERT INTO sync_devices (library, id, token_hash, created) VALUES (?, ?, ?, ?)').bind(library, id, await hash(secret), Date.now()).run()
    return json({ id, token: secret }, 201)
  }
  const device = await env.DB.prepare('SELECT id FROM sync_devices WHERE library = ? AND token_hash = ? AND revoked = 0').bind(library, credentialHash).first<{ id: string }>()
  assert(device, 401, 'This browser has been disconnected. Use your recovery key to reconnect.')
  if (parts.length === 4 && request.method === 'DELETE') {
    await env.DB.prepare('UPDATE sync_libraries SET deleted = 1 WHERE id = ?').bind(library).run()
    for (let batch = 0; batch < 8; batch++) {
      const listed = await env.FILES.list({ prefix: `${library}/`, limit: 1000 })
      if (!listed.objects.length) {
        await env.DB.batch(['sync_objects', 'sync_commits'].map(table => env.DB.prepare(`DELETE FROM ${table} WHERE library = ?`).bind(library)))
        return json({ deleted: true })
      }
      await env.FILES.delete(listed.objects.map(object => object.key))
    }
    return json({ deleted: false, retry: true }, 202)
  }
  assert(!vault.deleted, 410, 'This synced library was deleted. Cached files remain on this browser.')
  if (parts[4] === 'devices' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id, created, revoked FROM sync_devices WHERE library = ? ORDER BY created DESC').bind(library).all()
    return json({ current: device.id, devices: result.results })
  }
  if (parts[4] === 'devices' && parts.length === 6 && request.method === 'DELETE') {
    assert(uuidPattern.test(parts[5]), 400, 'Invalid browser.')
    await env.DB.prepare('UPDATE sync_devices SET revoked = 1 WHERE library = ? AND id = ?').bind(library, parts[5]).run()
    return json({ revoked: true })
  }
  if (parts[4] === 'commits' && parts.length === 5) {
    if (request.method === 'GET') {
      const after = Number(url.searchParams.get('after') ?? 0)
      assert(Number.isSafeInteger(after) && after >= 0, 400, 'Invalid revision.')
      const rows = await env.DB.prepare('SELECT revision, mutation, objects FROM sync_commits WHERE library = ? AND revision > ? ORDER BY revision LIMIT 50').bind(library, after).all<{ revision: number; mutation: string; objects: string }>()
      return json({ head: vault.head, commits: rows.results.map(row => ({ ...row, objects: JSON.parse(row.objects) })) })
    }
    if (request.method === 'POST') {
      const data = await body(request)
      assert(typeof data.mutation === 'string' && uuidPattern.test(data.mutation) && Number.isSafeInteger(data.base) && Number(data.base) >= 0, 400, 'Invalid commit.')
      assert(Array.isArray(data.objects) && data.objects.length > 0 && data.objects.length <= 64 && data.objects.every(id => typeof id === 'string' && idPattern.test(id)), 400, 'Invalid encrypted object list.')
      const known = await env.DB.prepare('SELECT revision FROM sync_commits WHERE library = ? AND mutation = ?').bind(library, data.mutation).first<{ revision: number }>()
      if (known) return json(known)
      const present = await Promise.all(data.objects.map(id => env.FILES.head(`${library}/${id}`)))
      assert(present.every(Boolean), 409, 'Finish uploading all commit chunks first.')
      const expected = Number(data.base), next = expected + 1
      await env.DB.batch([
        env.DB.prepare('UPDATE sync_libraries SET head = head + 1, last_mutation = ? WHERE id = ? AND head = ? AND deleted = 0').bind(data.mutation, library, expected),
        env.DB.prepare('INSERT INTO sync_commits (library, revision, mutation, objects, created) SELECT id, head, ?, ?, ? FROM sync_libraries WHERE id = ? AND head = ? AND last_mutation = ?').bind(data.mutation, JSON.stringify(data.objects), Date.now(), library, next, data.mutation),
      ])
      const saved = await env.DB.prepare('SELECT revision FROM sync_commits WHERE library = ? AND mutation = ?').bind(library, data.mutation).first<{ revision: number }>()
      assert(saved, 409, 'The library changed in another browser. Refresh before retrying.')
      return json(saved, 201)
    }
  }
  if (parts[4] === 'objects' && parts.length === 6 && idPattern.test(parts[5])) {
    const object = parts[5], key = `${library}/${object}`
    if (request.method === 'GET') {
      const result = await env.FILES.get(key)
      assert(result, 404, 'An encrypted library object is missing.')
      return new Response(result.body, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
    }
    if (request.method === 'PUT') {
      const bytes = await boundedBody(request, MAX_OBJECT)
      assert(bytes.length >= 16, 400, 'Invalid encrypted object.')
      const existing = await env.FILES.head(key)
      if (existing) return json({ stored: true })
      // Reserve space atomically before the blob write. Interrupted reservations count
      // toward quota and can be reused by the same immutable object on retry.
      await env.DB.prepare('INSERT INTO sync_objects (library, id, bytes) SELECT ?, ?, ? WHERE (SELECT COALESCE(SUM(bytes), 0) FROM sync_objects WHERE library = ?) + ? <= ? AND (SELECT COALESCE(SUM(bytes), 0) FROM sync_objects) + ? <= ? ON CONFLICT(library, id) DO NOTHING').bind(library, object, bytes.length, library, bytes.length, LIBRARY_QUOTA, bytes.length, SITE_QUOTA).run()
      const reserved = await env.DB.prepare('SELECT bytes FROM sync_objects WHERE library = ? AND id = ?').bind(library, object).first<{ bytes: number }>()
      assert(reserved && reserved.bytes === bytes.length, 413, 'Encrypted storage is full. Your pending changes remain on this browser.')
      await env.FILES.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, httpMetadata: { contentType: 'application/octet-stream' } })
      return json({ stored: true }, 201)
    }
  }
  throw new HttpError(404, 'Not found.')
}
export default { async fetch(request: Request, env: Env) {
  try { return await route(request, env) }
  catch (error) { return json({ error: error instanceof HttpError ? error.message : 'The sync service could not complete this request. Your local changes are retained.' }, error instanceof HttpError ? error.status : 503) }
} }

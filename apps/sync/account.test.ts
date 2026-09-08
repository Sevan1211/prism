import { generateKeyPairSync, sign } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountSession } from './account'

// Real signatures exercise the SDK verifier; no provider requests or credentials.
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
afterEach(() => vi.unstubAllGlobals())
const env = {
  CLERK_JWT_KEY: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  CLERK_ISSUER: 'https://prism-test.clerk.accounts.dev',
  PRISM_APP_ORIGIN: 'http://127.0.0.1:5173',
}
function jwt(changes: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: env.CLERK_ISSUER, azp: env.PRISM_APP_ORIGIN,
    sub: 'user_alpha', sid: 'sess_alpha', iat: now, nbf: now - 1, exp: now + 60, ...changes })).toString('base64url')
  const data = `${header}.${payload}`
  return `${data}.${sign('RSA-SHA256', Buffer.from(data), pair.privateKey).toString('base64url')}`
}
function request(token?: string, origin = env.PRISM_APP_ORIGIN) {
  return new Request(`${env.PRISM_APP_ORIGIN}/api/account/session`, {
    headers: { Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
}

describe('account session boundary', () => {
  it('fetches production signing keys and requires a production server credential', async () => {
    const fetcher = vi.fn(async () => Response.json({ keys: [{ ...pair.publicKey.export({ format: 'jwk' }), kid: 'test', alg: 'RS256', use: 'sig' }] }))
    vi.stubGlobal('fetch', fetcher)
    const remote = { ...env, CLOUD_STORAGE_MODE: 'remote', CLERK_JWT_KEY: undefined, CLERK_SECRET_KEY: 'sk_live_test' }
    expect((await accountSession(request(jwt()), remote)).status).toBe(200)
    expect(fetcher).toHaveBeenCalled()
    expect((await accountSession(request(jwt()), { ...remote, CLERK_SECRET_KEY: 'sk_test_invalid' })).status).toBe(503)
  })
  it('verifies a real signed session without granting storage access or exposing token claims', async () => {
    const response = await accountSession(request(jwt()), env)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ accountId: 'user_alpha', cloudStorage: { enabled: false, quotaBytes: 1_000_000_000 } })
  })
  it('fails closed without provider configuration or authentication', async () => {
    expect((await accountSession(request(), {})).status).toBe(503)
    expect((await accountSession(request(), env)).status).toBe(401)
    expect((await accountSession(request('not-a-token'), env)).status).toBe(401)
  })
  it.each([
    { iss: 'https://different.clerk.accounts.dev' },
    { azp: 'https://attacker.example' },
    { azp: undefined },
    { exp: Math.floor(Date.now() / 1000) - 60 },
    { exp: undefined },
    { exp: Math.floor(Date.now() / 1000) + 3600 },
    { iat: undefined },
    { nbf: Math.floor(Date.now() / 1000) + 600 },
    { sid: undefined },
    { sub: 'service_alpha' },
    { sts: 'pending' },
  ])('rejects an invalid session even with a valid signature: %j', async claims => {
    expect((await accountSession(request(jwt(claims)), env)).status).toBe(401)
  })
  it('rejects cross-origin, oversized and tampered requests', async () => {
    expect((await accountSession(request(jwt(), 'https://attacker.example'), env)).status).toBe(403)
    expect((await accountSession(request('a'.repeat(8192)), env)).status).toBe(401)
    const valid = jwt()
    const tampered = valid.slice(0, -12) + 'AAAAAAAAAAAA'
    expect((await accountSession(request(tampered), env)).status).toBe(401)
    expect((await accountSession(new Request(`${env.PRISM_APP_ORIGIN}/api/account/session`, { method: 'POST' }), env)).status).toBe(405)
  })
})

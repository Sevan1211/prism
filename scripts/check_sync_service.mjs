import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { recoveryKeys, seal, unseal } from '../apps/web/src/storage/syncCrypto.ts'

// Isolated synthetic transport/security acceptance. Never reads a personal PDF,
// uses an existing library credential, or prints the temporary recovery secrets.
const base = process.argv[2] ?? 'http://127.0.0.1:8787'
const random = () => randomBytes(32).toString('hex')
const request = (path, token, method = 'GET', body) => fetch(`${base}/api/sync/${path}`, {
  method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Origin: new URL(base).origin }, body,
})
const created = []
const started = performance.now()
try {
  const page = await fetch(`${base}/sources/sync-route-check/lessons`, { headers: { Accept: 'text/html' }, redirect: 'manual' })
  assert.equal(page.status, 200, 'Anonymous deep links must render the application.')
  assert.ok((await page.text()).includes('id="root"'), 'The public page must contain the PRISM application root.')
  for (let i = 0; i < 2; i++) {
    const keys = await recoveryKeys(`prism1.${random()}.${random()}`)
    const make = await request('libraries', null, 'POST', JSON.stringify({ id: keys.library, recovery: keys.authorization }))
    assert.equal(make.status, 201, await make.text())
    const enroll = await request(`libraries/${keys.library}/devices`, keys.authorization, 'POST')
    assert.equal(enroll.status, 201)
    created.push({ ...keys, ...await enroll.json() })
  }
  const a = created[0], b = created[1], path = `libraries/${a.library}`
  const data = new Uint8Array(1024 * 1024).map((_, i) => i % 251)
  const encrypted = await seal(a.encryption, a.library, data)
  assert.equal((await request(`${path}/objects/${encrypted.id}`, a.token, 'PUT', encrypted.ciphertext)).status, 201)
  assert.equal((await request(`${path}/objects/${encrypted.id}`, a.token, 'PUT', encrypted.ciphertext)).status, 200)
  assert.equal((await request(`${path}/objects/${encrypted.id}`, b.token)).status, 401)
  assert.equal((await request(`${path}/objects/${encrypted.id}`, null)).status, 401)
  const fetched = await request(`${path}/objects/${encrypted.id}`, a.token)
  assert.deepEqual(await unseal(a.encryption, a.library, encrypted.id, await fetched.arrayBuffer()), data)
  const mutate = mutation => request(`${path}/commits`, a.token, 'POST', JSON.stringify({ base: 0, mutation, objects: [encrypted.id] }))
  const ids = [randomUUID(), randomUUID()]
  const competing = await Promise.all(ids.map(mutate))
  assert.deepEqual(competing.map(result => result.status).sort(), [201, 409])
  const winner = competing.findIndex(result => result.status === 201)
  assert.equal((await mutate(ids[winner])).status, 200)
  const history = await (await request(`${path}/commits?after=0`, a.token)).json()
  assert.equal(history.commits.length, 1)
  assert.equal(history.head, 1)
  const deviceResponse = await request(`${path}/devices`, a.authorization, 'POST')
  const second = await deviceResponse.json()
  assert.equal((await request(`${path}/devices/${second.id}`, a.token, 'DELETE')).status, 200)
  assert.equal((await request(`${path}/commits`, second.token)).status, 401)
  const crossSite = await fetch(`${base}/api/sync/${path}/commits`, { headers: { Authorization: `Bearer ${a.token}`, Origin: 'https://unrelated.invalid' } })
  assert.equal(crossSite.status, 403)
  console.log(JSON.stringify({ passed: ['encrypted 1 MiB round trip', 'idempotent upload', 'cross-library isolation', 'anonymous denial', 'concurrent commit rejection', 'idempotent commit retry', 'browser revocation', 'cross-site rejection'], elapsedMs: Math.round(performance.now() - started) }))
} finally {
  for (const library of created) {
    const deleted = await request(`libraries/${library.library}`, library.token, 'DELETE')
    assert.equal(deleted.status, 200)
    assert.equal((await request(`libraries/${library.library}/commits`, library.token)).status, 410)
  }
  if (created.length) console.log('Temporary test libraries deleted; deleted libraries reject reads.')
}

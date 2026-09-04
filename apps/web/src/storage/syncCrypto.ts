const text = new TextEncoder()
export const SYNC_CHUNK_BYTES = 4 * 1024 * 1024
export const randomHex = () => hex(crypto.getRandomValues(new Uint8Array(32)))
export function hex(bytes: Uint8Array) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') }
function unhex(value: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error('The recovery key is incomplete. Paste the entire key.')
  return Uint8Array.from(value.match(/../g)!, byte => parseInt(byte, 16))
}
async function derive(root: CryptoKey, salt: string, info: string) {
  return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: text.encode(salt), info: text.encode(info) }, root, 256)
}
export async function recoveryKeys(recovery: string) {
  const parts = recovery.trim().split('.')
  if (parts.length !== 3 || parts[0] !== 'prism1') throw new Error('Paste a PRISM recovery key beginning with prism1.')
  const [, library, secret] = parts
  unhex(library)
  const root = await crypto.subtle.importKey('raw', unhex(secret), 'HKDF', false, ['deriveBits'])
  const encryption = await crypto.subtle.importKey('raw', await derive(root, library, 'prism-sync-encryption-v1'), 'HKDF', false, ['deriveBits'])
  return { library, encryption, authorization: hex(new Uint8Array(await derive(root, library, 'prism-sync-authorization-v1'))) }
}
async function objectKey(root: CryptoKey, library: string, id: string) {
  unhex(id)
  return crypto.subtle.importKey('raw', await derive(root, library, `prism-object-v1:${id}`), 'AES-GCM', false, ['encrypt', 'decrypt'])
}
// Every encryption gets a fresh 256-bit object ID and derived key. A fixed nonce
// is used exactly once with that key; retries reuse the stored ciphertext bytes.
export async function seal(root: CryptoKey, library: string, bytes: Uint8Array) {
  const id = randomHex()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(12), additionalData: text.encode(`prism:1:${library}:${id}`) }, await objectKey(root, library, id), bytes as Uint8Array<ArrayBuffer>)
  return { id, ciphertext: new Uint8Array(ciphertext) }
}
export async function unseal(root: CryptoKey, library: string, id: string, bytes: ArrayBuffer) {
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(12), additionalData: text.encode(`prism:1:${library}:${id}`) }, await objectKey(root, library, id), bytes))
  } catch { throw new Error('An encrypted library file failed verification. It has not been applied. Retry sync or restore a trusted backup.') }
}

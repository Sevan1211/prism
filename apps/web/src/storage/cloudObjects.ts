export const SYNC_CHUNK_BYTES = 4 * 1024 * 1024
export function hex(bytes: Uint8Array) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') }
export async function packObject(bytes: Uint8Array) {
  const id = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)))
  return { id, bytes }
}
export async function verifyObject(id: string, bytes: ArrayBuffer) {
  const object = await packObject(new Uint8Array(bytes))
  if (object.id !== id) throw new Error('A cloud file failed verification. It has not been applied. Retry sync.')
  return object.bytes
}

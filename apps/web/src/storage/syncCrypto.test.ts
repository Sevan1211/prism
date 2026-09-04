// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { recoveryKeys, seal, unseal } from './syncCrypto'
const recovery = `prism1.${'a'.repeat(64)}.${'b'.repeat(64)}`
describe('encrypted library objects', () => {
  it('recovers the same library in another browser without giving the server its encryption key', async () => {
    const first = await recoveryKeys(recovery), second = await recoveryKeys(recovery)
    const bytes = new TextEncoder().encode('A source-bound lesson, with a revision.')
    const encrypted = await seal(first.encryption, first.library, bytes)
    expect(await unseal(second.encryption, second.library, encrypted.id, encrypted.ciphertext.buffer as ArrayBuffer)).toEqual(bytes)
    expect(first.encryption.extractable).toBe(false)
    expect(first.authorization).toBe(second.authorization)
    expect(first.authorization).not.toBe('b'.repeat(64))
  })
  it('uses fresh object keys and detects corruption, substitution and another library', async () => {
    const keys = await recoveryKeys(recovery), bytes = new Uint8Array([1, 2, 3])
    const a = await seal(keys.encryption, keys.library, bytes), b = await seal(keys.encryption, keys.library, bytes)
    expect(a.id).not.toBe(b.id)
    expect(a.ciphertext).not.toEqual(b.ciphertext)
    await expect(unseal(keys.encryption, keys.library, b.id, a.ciphertext.buffer as ArrayBuffer)).rejects.toThrow('verification')
    await expect(unseal(keys.encryption, 'c'.repeat(64), a.id, a.ciphertext.buffer as ArrayBuffer)).rejects.toThrow('verification')
    a.ciphertext[0] ^= 1
    await expect(unseal(keys.encryption, keys.library, a.id, a.ciphertext.buffer as ArrayBuffer)).rejects.toThrow('verification')
    await expect(unseal(keys.encryption, keys.library, a.id, a.ciphertext.slice(0, 3).buffer as ArrayBuffer)).rejects.toThrow('verification')
  })
  it('rejects incomplete recovery keys', async () => {
    await expect(recoveryKeys('secret')).rejects.toThrow('recovery key')
    await expect(recoveryKeys('prism1.abc.def')).rejects.toThrow('incomplete')
  })
})

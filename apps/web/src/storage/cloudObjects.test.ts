// @vitest-environment node
import { expect, it } from 'vitest'
import { packObject, verifyObject } from './cloudObjects'
it('verifies content-addressed bytes and detects corruption before applying a download', async () => {
  const bytes = new TextEncoder().encode('A synthetic source and its saved lesson.')
  const object = await packObject(bytes)
  expect(await verifyObject(object.id, bytes.buffer)).toEqual(bytes)
  expect((await packObject(bytes)).id).toBe(object.id)
  const corrupted = bytes.slice(); corrupted[0] ^= 1
  await expect(verifyObject(object.id, corrupted.buffer)).rejects.toThrow('verification')
})

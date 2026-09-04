import { expect, it } from 'vitest'
import { recoveryBackupText } from './recoveryBackup'
it('exports the exact key with reconnection instructions and no page-specific data', () => {
  const key = `prism1.${'a'.repeat(64)}.${'b'.repeat(64)}`
  const text = recoveryBackupText(key, 'https://example.com/lessons/private?anything=sensitive')
  expect(text).toContain(key)
  expect(text).toContain('https://example.com/sources')
  expect(text).toContain('Connect existing library')
  expect(text).toContain('not encrypted')
  expect(text).not.toContain('sensitive')
  expect(() => recoveryBackupText('incomplete', 'https://example.com')).toThrow('complete')
})

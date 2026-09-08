import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFakeModelContext } from '../test/fakeModelContext'
import { textResult } from './context'
import { getRegistrationStatus, registerPageTool, retryRegistrations } from './registration'

let fake: ReturnType<typeof installFakeModelContext> | undefined
const cleanups: Array<() => void> = []
function register() {
  cleanups.push(registerPageTool({ name: 'orient', description: 'Start here', inputSchema: {}, execute: async args => textResult(args.fail ? { error: 'Try again' } : { ok: true }) }))
}
afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup())
  fake?.uninstall()
  fake = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('page tool discovery and recovery', () => {
  it('registers when the API arrives late and stops probing unsupported hosts', () => {
    vi.useFakeTimers()
    register()
    expect(getRegistrationStatus()).toMatchObject({ supported: false, pending: 1 })
    vi.runAllTimers()
    expect(vi.getTimerCount()).toBe(0)
    fake = installFakeModelContext()
    window.dispatchEvent(new Event('focus'))
    expect(fake.tools.has('orient')).toBe(true)
    expect(getRegistrationStatus()).toMatchObject({ supported: true, offered: 1, pending: 0 })
    window.dispatchEvent(new Event('pageshow'))
    expect(fake.registrationCount).toBe(1)
  })

  it('recovers during the initial bounded probe without requiring focus', () => {
    vi.useFakeTimers()
    register()
    fake = installFakeModelContext()
    vi.advanceTimersByTime(350)
    expect(fake.tools.has('orient')).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports failures, removes failed registrations, and retries explicitly', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fake = installFakeModelContext({ registrationFailure: new Error('Host rejected tool') })
    register()
    await Promise.resolve()
    expect(fake.tools.has('orient')).toBe(false)
    expect(getRegistrationStatus()).toMatchObject({ offered: 0, failures: ['orient'] })
    fake.uninstall()
    fake = installFakeModelContext({ rejectRegistrationOnAbort: true })
    retryRegistrations()
    expect(getRegistrationStatus()).toMatchObject({ offered: 1, failures: [] })
    expect(getRegistrationStatus().lastCall).toBeNull()
    await fake.execute('orient')
    expect(getRegistrationStatus().lastCall).toEqual({ name: 'orient', succeeded: true })
    await fake.execute('orient', { fail: true })
    expect(getRegistrationStatus().lastCall).toEqual({ name: 'orient', succeeded: false })
  })

  it('cleans old handles when the host replaces its interface', () => {
    fake = installFakeModelContext()
    const old = fake
    register()
    fake = installFakeModelContext()
    window.dispatchEvent(new Event('focus'))
    expect(old.tools.size).toBe(0)
    expect(fake.tools.size).toBe(1)
    cleanups.splice(0).forEach(cleanup => cleanup())
    expect(fake.tools.size).toBe(0)
    expect(getRegistrationStatus().offered).toBe(0)
  })

  it('ignores a stale rejection after cleanup and preserves the replacement', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    fake = installFakeModelContext({ registrationFailure: new Error('Old attempt') })
    register()
    cleanups.pop()!()
    fake.uninstall()
    fake = installFakeModelContext()
    register()
    await Promise.resolve()
    expect(getRegistrationStatus()).toMatchObject({ offered: 1, failures: [] })
    expect(warn).not.toHaveBeenCalled()
  })
})

import { afterEach, expect, it } from 'vitest'
import { accountReturnPath, consumeAccountReturnFlag, isAccountReturn } from './accountReturn'

afterEach(() => window.history.replaceState(null, '', '/'))

it('opens account controls for a requested return or provider handshake only', () => {
  expect(isAccountReturn('?prism_account=1')).toBe(true)
  expect(isAccountReturn('?__clerk_handshake=synthetic-test')).toBe(true)
  expect(isAccountReturn('?prism_account=0')).toBe(false)
  expect(isAccountReturn('?query=book')).toBe(false)
})

it('keeps the local route and useful query while excluding provider return data', () => {
  expect(accountReturnPath('/sources', '?query=physics&__clerk_handshake=synthetic-test&__clerk_status=done'))
    .toBe('/sources?query=physics&prism_account=1')
})

it('returns landing and external-looking destinations to the library', () => {
  expect(accountReturnPath('/', '')).toBe('/sources?prism_account=1')
  expect(accountReturnPath('//outside.example', '')).toBe('/sources?prism_account=1')
  expect(accountReturnPath('/sources/example/reader', '?page=2')).toBe('/sources/example/reader?page=2&prism_account=1')
})

it('consumes only the app return flag and preserves history, hash and SDK handshake', () => {
  window.history.replaceState({ selected: true }, '', '/sources?prism_account=1&__clerk_handshake=synthetic-test#chapter')
  consumeAccountReturnFlag()
  expect(window.location.search).toBe('?__clerk_handshake=synthetic-test')
  expect(window.location.hash).toBe('#chapter')
  expect(window.history.state).toEqual({ selected: true })
})

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useBriefDraft } from './useBriefDraft'

afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear() })

it('restores edits after remount while keeping sources separate', () => {
  const first = renderHook(() => useBriefDraft('test-source-a', 20))
  act(() => { first.result.current.update('name', 'Keep my request'); first.result.current.update('pageEnd', 8) })
  first.unmount()
  const other = renderHook(() => useBriefDraft('test-source-b', 12))
  expect(other.result.current.draft.name).toBe('')
  const resumed = renderHook(() => useBriefDraft('test-source-a', 20))
  expect(resumed.result.current.draft).toMatchObject({ name: 'Keep my request', pageEnd: 8 })
  expect(resumed.result.current.restored).toBe(true)
})

it('clears the recovery copy and resets all fields', () => {
  const form = renderHook(() => useBriefDraft('test-source-a', 20))
  act(() => { form.result.current.update('name', 'Draft'); form.result.current.update('includeQuestions', true) })
  act(() => form.result.current.clear())
  expect(form.result.current.draft).toMatchObject({ name: '', includeQuestions: false, pageEnd: 20 })
  form.unmount()
  expect(renderHook(() => useBriefDraft('test-source-a', 20)).result.current.restored).toBe(false)
})

it('retains current edits and reports unavailable recovery storage', () => {
  const form = renderHook(() => useBriefDraft('test-source-a', 20))
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  act(() => form.result.current.update('assignment', 'Preserve this text'))
  expect(form.result.current.draft.assignment).toBe('Preserve this text')
  expect(form.result.current.storageError).toBe(true)
})

it('rejects malformed stored records instead of breaking the form', () => {
  sessionStorage.setItem('prism:brief-draft:v1:test-source-a', '{"name":42}')
  expect(renderHook(() => useBriefDraft('test-source-a', 20)).result.current.draft.name).toBe('')
})

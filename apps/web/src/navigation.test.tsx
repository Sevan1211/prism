import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  libraryPath,
  lessonPath,
  navigatePrism,
  parsePrismRoute,
  readPrismNavigationState,
  rememberReturnTarget,
  readerPath,
  sourcePath,
  usePrismNavigationState,
  usePrismRoute,
} from './navigation'

describe('PRISM navigation', () => {
  beforeEach(() => window.history.replaceState({}, '', '/sources'))

  it('parses stable library, source, lesson, and Reader URLs', () => {
    expect(parsePrismRoute('/')).toEqual({ kind: 'landing' })
    expect(parsePrismRoute('/sources')).toEqual({ kind: 'library' })
    expect(parsePrismRoute('/lessons/lesson%20one#section-2')).toEqual({ kind: 'lesson', lessonId: 'lesson one' })
    expect(parsePrismRoute('/sources/local_abc')).toEqual({
      kind: 'source', sourceId: 'local_abc', view: 'overview',
    })
    expect(parsePrismRoute('/sources/local_abc/lessons')).toEqual({
      kind: 'source', planId: null, sourceId: 'local_abc', view: 'lessons',
    })
    expect(parsePrismRoute('/sources/local_abc/lessons?plan=plan%20one')).toEqual({
      kind: 'source', planId: 'plan one', sourceId: 'local_abc', view: 'lessons',
    })
    expect(parsePrismRoute('/sources/local_abc/reader?page=40')).toEqual({
      kind: 'reader', page: 40, sourceId: 'local_abc',
    })
    expect(parsePrismRoute('/something-else')).toEqual({ kind: 'not_found' })
  })

  it('rejects malformed, unsafe, and invalid route components', () => {
    expect(parsePrismRoute('/lessons/%E0%A4%A')).toEqual({ kind: 'not_found' })
    expect(parsePrismRoute('/lessons/a%2Fb')).toEqual({ kind: 'not_found' })
    expect(parsePrismRoute('/lessons/a%00b')).toEqual({ kind: 'not_found' })
    expect(parsePrismRoute('/sources/source/reader?page=0')).toEqual({ kind: 'reader', page: null, sourceId: 'source' })
    expect(parsePrismRoute('/sources/source/reader?page=1.5')).toEqual({ kind: 'reader', page: null, sourceId: 'source' })
    expect(parsePrismRoute('/sources/source/reader?page=9007199254740992')).toEqual({ kind: 'reader', page: null, sourceId: 'source' })
    expect(parsePrismRoute('/sources/source/reader?page=12')).toEqual({ kind: 'reader', page: 12, sourceId: 'source' })
  })

  it('builds encoded paths', () => {
    expect(libraryPath()).toBe('/sources')
    expect(lessonPath('lesson one')).toBe('/lessons/lesson%20one')
    expect(sourcePath('source with spaces')).toBe('/sources/source%20with%20spaces')
    expect(sourcePath('source', 'lessons')).toBe('/sources/source/lessons')
    expect(sourcePath('source', 'lessons', 'plan one')).toBe('/sources/source/lessons?plan=plan%20one')
    expect(readerPath('source', 12)).toBe('/sources/source/reader?page=12')
  })

  it('updates route subscribers through push and popstate navigation', () => {
    const { result } = renderHook(() => usePrismRoute())
    expect(result.current).toEqual({ kind: 'library' })

    act(() => navigatePrism('/sources/source-a'))
    expect(result.current).toEqual({ kind: 'source', sourceId: 'source-a', view: 'overview' })

    act(() => {
      window.history.replaceState({}, '', '/sources')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current).toEqual({ kind: 'library' })
  })

  it('preserves unrelated history state while writing a namespaced navigation state', () => {
    window.history.replaceState({ clerkHandshake: 'keep-me' }, '', '/sources')

    act(() => navigatePrism('/sources/source-a'))

    expect(window.history.state.clerkHandshake).toBe('keep-me')
    expect(window.history.state.prism).toMatchObject({ version: 1 })
    expect(readPrismNavigationState()).toMatchObject({ version: 1 })
  })

  it('rejects cross-origin navigation and validates reader state by source', () => {
    expect(() => navigatePrism('https://attacker.example/collect')).toThrow(/same-origin/i)

    const reader = {
      sourceId: 'source-a',
      requestKey: 'request-a',
      returnHref: '/lessons/lesson-a',
      targetId: 'block-a',
      highlight: { elementId: 'element-a', page: 4, bounds: [0.1, 0.2, 0.8, 0.9] as [number, number, number, number] },
    }
    window.history.replaceState({ prism: { version: 1, key: 'entry-a', reader } }, '', readerPath('source-b', 4))

    expect(readPrismNavigationState()).toMatchObject({ version: 1, key: 'entry-a' })
    expect(readPrismNavigationState()?.reader).toBeUndefined()
  })

  it('keeps reader return context across pushed and replaced page entries', () => {
    const reader = {
      sourceId: 'source-a',
      requestKey: 'request-a',
      returnHref: '/lessons/lesson-a',
      targetId: 'block-a',
      highlight: { elementId: 'element-a', page: 4, bounds: [0.1, 0.2, 0.8, 0.9] as [number, number, number, number] },
    }
    window.history.replaceState({ prism: { version: 1, key: 'entry-a', reader } }, '', readerPath('source-a', 4))

    act(() => navigatePrism(readerPath('source-a', 9)))
    const pushed = readPrismNavigationState()
    expect(pushed?.reader).toEqual(reader)
    expect(pushed?.key).not.toBe('entry-a')

    act(() => navigatePrism(readerPath('source-a', 12), { replace: true }))
    const replaced = readPrismNavigationState()
    expect(replaced?.reader).toEqual(reader)
    expect(replaced?.key).toBe(pushed?.key)
  })

  it('stores only bounded citation identifiers and geometry, never passage text', () => {
    const reader = {
      sourceId: 'source-a',
      requestKey: 'request-a',
      returnHref: '/lessons/lesson-a',
      targetId: 'block-a',
      highlight: { elementId: 'element-a', page: 4, bounds: [0.1, 0.2, 0.8, 0.9] as [number, number, number, number], snippet: 'private source passage' },
      snippet: 'private source passage',
    }
    act(() => navigatePrism(readerPath('source-a', 4), { state: { reader } }))

    expect(JSON.stringify(window.history.state)).not.toContain('private source passage')
    expect(readPrismNavigationState()?.reader?.highlight).toEqual({ elementId: 'element-a', page: 4, bounds: [0.1, 0.2, 0.8, 0.9] })
  })

  it('preserves a return target in the current lesson entry without adding history', () => {
    window.history.replaceState({ external: 'keep-me' }, '', '/lessons/lesson-a')
    const beforeLength = window.history.length

    act(() => rememberReturnTarget('block-a'))

    expect(window.history.length).toBe(beforeLength)
    expect(window.history.state.external).toBe('keep-me')
    expect(readPrismNavigationState()?.returnTargetId).toBe('block-a')
  })

  it('increments the navigation revision on push and Back/Forward traversal', async () => {
    const { result } = renderHook(() => usePrismNavigationState())
    const initial = result.current.revision

    act(() => navigatePrism('/sources/source-a'))
    const pushed = result.current.revision
    expect(pushed).toBeGreaterThan(initial)

    await act(async () => {
      window.history.back()
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })
    await waitFor(() => expect(result.current.revision).toBeGreaterThan(pushed))
    const backed = result.current.revision

    await act(async () => {
      window.history.forward()
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })
    await waitFor(() => expect(result.current.revision).toBeGreaterThan(backed))
  })
})

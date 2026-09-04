import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  libraryPath,
  lessonPath,
  navigatePrism,
  parsePrismRoute,
  readerPath,
  sourcePath,
  usePrismRoute,
} from './navigation'

describe('PRISM navigation', () => {
  beforeEach(() => window.history.replaceState({}, '', '/sources'))

  it('parses stable library, source, lesson, and Reader URLs', () => {
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
})

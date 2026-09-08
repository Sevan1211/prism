import { describe, expect, it } from 'vitest'
import { paginateToolItems, requireOneSelector } from './toolPagination'

describe('bounded tool discovery', () => {
  it('recovers every item through exact calls within the character budget', () => {
    const items = Array.from({ length: 250 }, (_, id) => ({ id, label: 'Long name '.repeat(90) }))
    let args: Record<string, unknown> = { query: 'Long', limit: 40 }
    const recovered = []
    for (;;) {
      const page = paginateToolItems(items, 'list_sources', args)
      expect(JSON.stringify(page.items).length).toBeLessThan(12_100)
      recovered.push(...page.items)
      if (!page.next_call) break
      expect(page.next_call.tool).toBe('list_sources')
      expect(page.next_call.arguments.query).toBe('Long')
      args = page.next_call.arguments
    }
    expect(recovered).toEqual(items)
    expect(paginateToolItems([], 'list_sources', {})).toMatchObject({ items: [], total: 0, next_call: null })
  })
  it('rejects stale, cross-filter and malformed cursors rather than skipping records', () => {
    const items = [1, 2, 3]
    const next = paginateToolItems(items, 'tool', { limit: 1 }).next_call!.arguments
    expect(() => paginateToolItems([0, ...items], 'tool', next)).toThrow('changed')
    expect(() => paginateToolItems(items, 'tool', { ...next, query: 'other' })).toThrow('changed')
    for (const cursor of [12, '', 'bad', 'x:-1']) expect(() => paginateToolItems(items, 'tool', { cursor })).toThrow()
    for (const limit of [0, 41, 1.5, '2']) expect(() => paginateToolItems(items, 'tool', { limit })).toThrow()
  })
  it('requires explicit non-conflicting identity', () => {
    for (const args of [{}, { lesson_id: '' }, { lesson_id: 'a', plan_id: 'b' }, { lesson_id: 12 }]) expect(() => requireOneSelector(args, ['lesson_id', 'plan_id'])).toThrow()
    expect(() => requireOneSelector({ plan_id: 'plan' }, ['lesson_id', 'plan_id'])).not.toThrow()
  })
})

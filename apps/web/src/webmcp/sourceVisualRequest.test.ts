import { describe, expect, it } from 'vitest'
import { normalizeVisualRequest } from './sourceVisualRequest'

describe('bounded visual selection', () => {
  it('keeps single-view calls compatible and normalizes a selected batch', () => {
    expect(normalizeVisualRequest({ page_number: 3 }, 10)).toEqual([{ page_number: 3, bbox: [0, 0, 1, 1] }])
    expect(normalizeVisualRequest({ views: [{ page_number: 2 }, { page_number: 4, bbox: [0, .2, 1, .8] }] }, 10)).toEqual([{ page_number: 2, bbox: [0, 0, 1, 1] }, { page_number: 4, bbox: [0, .2, 1, .8] }])
  })
  it('rejects unbounded, mixed, invalid-page and invalid-crop requests', () => {
    for (const args of [{ views: [] }, { views: Array.from({ length: 5 }, () => ({ page_number: 1 })) }, { views: [{ page_number: 1 }], page_number: 1 }, { page_number: 11 }, { page_number: 1, bbox: [0, 0, 2, 1] }, { page_number: 1, bbox: [1, 0, 0, 1] }, {}]) expect(() => normalizeVisualRequest(args, 10)).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import { buildContentsTree, completeContents, filterContentsTree } from './contentsTree'
import type { SourceSection } from '../types'

const section = (id: string, title: string, level: number, parent_id: string | null = null): SourceSection => ({ id, title, level, parent_id, page_start: 1, page_end: 20, confidence: 1, origin: 'outline' })

describe('reader contents', () => {
  it('preserves six heading levels, printed numbering and ancestry during search', () => {
    const tree = buildContentsTree([
      section('a', '4 Methods', 1), section('b', '4.2 Model', 2, 'a'),
      section('c', '4.2.1 Assumptions', 3, 'b'), section('d', '4.2.1.1 Boundary', 4, 'c'),
      section('e', '4.2.1.1.1 Special case', 5, 'd'), section('f', '4.2.1.1.1.1 Proof', 6, 'e'),
    ])
    const match = filterContentsTree(tree, 'proof')
    let leaf = match[0]
    for (let i = 0; i < 5; i++) leaf = leaf.children[0]
    expect(leaf).toMatchObject({ title: 'Proof', number: '4.2.1.1.1.1' })
    expect(match[0].title).toBe('Methods')
  })
  it('supplements missing subheadings only under matching source-numbered parents', () => {
    const merged = completeContents([section('a', 'Methods', 1)], [
      section('b', '4 Methods', 1), section('c', '4.1 Sampling', 2), section('d', '90210 Postal address', 1),
    ])
    expect(merged.map(item => item.title)).toEqual(['4 Methods', '4.1 Sampling'])
    expect(merged[1].parent_id).toBe('a')
  })
})

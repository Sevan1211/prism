import { describe, expect, it } from 'vitest'
import { buildContentsTree, completeContents, filterContentsTree, sectionAtPosition } from './contentsTree'
import type { SourceSection } from '../types'

const section = (id: string, title: string, level: number, parent_id: string | null = null): SourceSection => ({ id, title, level, parent_id, page_start: 1, page_end: 20, confidence: 1, origin: 'outline' })

describe('reader contents', () => {
  it('tracks the current heading by its position within a page', () => {
    const headings = [{ ...section('a', 'Permissions', 1), page_y: .2 }, { ...section('b', 'Adding a user', 2, 'a'), page_y: .7 }]
    expect(sectionAtPosition(headings, 1, .2)?.id).toBe('a')
    expect(sectionAtPosition(headings, 1, .8)?.id).toBe('b')
  })
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
  it('preserves authored hierarchy and rejects repeats on other pages', () => {
    const authored = [section('a', '4 Methods', 1), section('b', '4.1 Sampling', 2, 'a')]
    const detected = [2, 3, 8].map(page_start => ({ ...section(`d${page_start}`, '4.1 Sampling', 2), page_start, origin: 'computed' as const }))
    expect(completeContents(authored, detected)).toEqual(authored)
  })
  it('does not invent printed numbers for unnumbered headings', () => {
    expect(buildContentsTree([section('p', 'Preface', 1)])[0].number).toBe('')
  })
})

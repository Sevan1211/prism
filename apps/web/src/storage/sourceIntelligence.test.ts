import { describe, expect, it } from 'vitest'
import { buildIndexedSourcePage } from './sourceIntelligence'
import type { IndexedTextFragment } from './sourceIndexTypes'

describe('browser source intelligence', () => {
  it('keeps a numeric table row source-only even when the surrounding page reads linearly', () => {
    const page = buildIndexedSourcePage({ sourceId: 'table', pageNumber: 1, height: 800, width: 600, rotation: 0, fragments: [
      fragment('The comparison requires reading each column heading.', [.1, .2, .8, .22]),
      fragment('Model A 78.2 91.4 62.0 45.6', [.1, .4, .8, .42]),
    ] })
    expect(page.elements.find((element) => element.text.startsWith('The comparison'))?.status).toBe('transform_with_warning')
    expect(page.elements.find((element) => element.text.startsWith('Model A'))?.status).toBe('source_only')
  })
  it('reads sustained two-column prose down each column while retaining a spanning heading', () => {
    const fragments: IndexedTextFragment[] = [fragment('A STUDY OF TWO SYSTEMS', [.1, .04, .9, .07])]
    for (let i = 0; i < 8; i++) {
      fragments.push(fragment(`Left ${i} contains a complete explanatory sentence.`, [.08, .15 + i * .04, .47, .17 + i * .04]))
      fragments.push(fragment(`Right ${i} continues a separate argument in prose.`, [.53, .15 + i * .04, .92, .17 + i * .04]))
    }
    const page = buildIndexedSourcePage({ sourceId: 'columns', pageNumber: 1, height: 800, width: 600, rotation: 0, fragments })
    expect(page.profile.layout_state).toBe('column_candidate')
    expect(page.text.indexOf('Left 7')).toBeLessThan(page.text.indexOf('Right 0'))
    expect(page.text.startsWith('A STUDY')).toBe(true)
    expect(page.elements.every((element) => element.status === 'transform_with_warning')).toBe(true)
  })
  it('joins touching word fragments without inserting a false space, and retains a real word gap', () => {
    const page = buildIndexedSourcePage({ sourceId: 'split', pageNumber: 1, height: 800, width: 600, rotation: 0, fragments: [
      { text: 'trans', bbox_normalized: [.1, .2, .15, .22], has_eol: false },
      { text: 'mission', bbox_normalized: [.15, .2, .22, .22], has_eol: false },
      { text: 'delay', bbox_normalized: [.23, .2, .28, .22], has_eol: true },
    ] })
    expect(page.text).toBe('transmission delay')
  })

  it('exposes damaged character mappings as source-only instead of readable evidence', () => {
    const page = buildIndexedSourcePage({ sourceId: 'broken', pageNumber: 1, height: 800, width: 600, rotation: 0, fragments: [fragment('text �������� with broken glyphs', [.1, .2, .7, .22])] })
    expect(page.profile.layout_state).toBe('source_only')
    expect(page.profile.warnings).toContain('unreliable_character_mapping')
    expect(page.elements.every((element) => element.status === 'source_only')).toBe(true)
  })
  it('creates stable, warning-labeled candidate elements without claiming verified structure', () => {
    const fragments = [
      fragment('CHAPTER 1', [0.1, 0.08, 0.42, 0.12]),
      fragment('Packets move through a network in bounded units.', [0.1, 0.2, 0.82, 0.22]),
      fragment('Each layer gives those units a specific role.', [0.1, 0.225, 0.78, 0.245]),
      fragment('Figure 1.1 Packet flow across two hosts', [0.1, 0.4, 0.7, 0.42]),
    ]

    const first = buildIndexedSourcePage({
      fragments,
      height: 792,
      pageNumber: 7,
      rotation: 0,
      sourceId: 'local_source',
      width: 612,
    })
    const second = buildIndexedSourcePage({
      fragments,
      height: 792,
      pageNumber: 7,
      rotation: 0,
      sourceId: 'local_source',
      width: 612,
    })

    expect(first.profile).toMatchObject({
      layout_state: 'linear_candidate',
      visual_inventory: 'not_indexed',
    })
    expect(first.profile.warnings).toEqual(expect.arrayContaining([
      'reading_order_unverified',
      'visual_inventory_not_indexed',
    ]))
    expect(first.elements.map((element) => element.kind)).toEqual([
      'heading_candidate',
      'paragraph_candidate',
      'caption_candidate',
    ])
    expect(first.elements.every((element) => element.status === 'transform_with_warning')).toBe(true)
    expect(first.elements.map((element) => element.element_id)).toEqual(
      second.elements.map((element) => element.element_id),
    )
  })

  it('fails closed when text geometry suggests parallel columns or a table', () => {
    const page = buildIndexedSourcePage({
      fragments: [
        fragment('left one', [0.08, 0.1, 0.35, 0.12]),
        fragment('right one', [0.62, 0.1, 0.9, 0.12]),
        fragment('left two', [0.08, 0.15, 0.35, 0.17]),
        fragment('right two', [0.62, 0.15, 0.9, 0.17]),
      ],
      height: 792,
      pageNumber: 2,
      rotation: 0,
      sourceId: 'local_columns',
      width: 612,
    })

    expect(page.profile.layout_state).toBe('complex_candidate')
    expect(page.profile.warnings).toContain('possible_multicolumn_or_table_layout')
    expect(page.elements.every((element) => element.status === 'source_only')).toBe(true)
  })

  it('does not mistake one equation row or a split footer for parallel columns', () => {
    const page = buildIndexedSourcePage({
      fragments: [
        fragment('Where delay comes from', [0.1, 0.1, 0.72, 0.14]),
        fragment('d_process + d_queue', [0.2, 0.3, 0.48, 0.33]),
        fragment('L / R + d_propagation', [0.62, 0.3, 0.88, 0.33]),
        fragment('A full-width explanation follows the equation and keeps reading order linear.', [0.1, 0.4, 0.88, 0.43]),
        fragment('LICENSE', [0.08, 0.96, 0.25, 0.98]),
        fragment('PAGE 2', [0.82, 0.96, 0.92, 0.98]),
      ],
      height: 792,
      pageNumber: 2,
      rotation: 0,
      sourceId: 'local_equation',
      width: 612,
    })

    expect(page.profile.layout_state).toBe('linear_candidate')
    expect(page.profile.warnings).not.toContain('possible_multicolumn_or_table_layout')
  })

  it('keeps an image-only page source-only instead of fabricating text elements', () => {
    const page = buildIndexedSourcePage({
      fragments: [],
      height: 792,
      pageNumber: 3,
      rotation: 0,
      sourceId: 'local_scan',
      width: 612,
    })

    expect(page.elements).toEqual([])
    expect(page.profile.layout_state).toBe('source_only')
    expect(page.profile.warnings).toContain('no_embedded_text')
  })
})

function fragment(
  text: string,
  bounds: [number, number, number, number],
): IndexedTextFragment {
  return { bbox_normalized: bounds, has_eol: true, text }
}

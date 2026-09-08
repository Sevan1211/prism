import { describe, expect, it, vi } from 'vitest'
import { catalogPage, getSourceVisualCatalog, imageRegions } from './sourceVisualCatalog'
import { buildIndexedSourcePage } from '../storage/sourceIntelligence'
import { getBrowserSourcePages } from '../storage/browserSources'

vi.mock('../storage/browserSources', async importOriginal => ({
  ...await importOriginal<typeof import('../storage/browserSources')>(),
  getBrowserSourcePages: vi.fn(),
}))

function page() {
  return buildIndexedSourcePage({ sourceId: 'visual-test', pageNumber: 1, fragments: [], width: 600, height: 800, rotation: 0 })
}

describe('candidate figure catalog', () => {
  it('uses all four corners of rotated embedded images and rejects invalid geometry', () => {
    const regions = imageRegions([.4, .1, .8, .3, .2, .5, NaN, 0, 1, 0, 0, 1])
    expect(regions).toHaveLength(1)
    expect(regions[0].bbox[0]).toBeCloseTo(.2)
    expect(regions[0].bbox[3]).toBeCloseTo(.7)
    expect(regions[0].components).toEqual(['raster'])
  })

  it('groups neighboring raster/vector objects and preserves separate figures', () => {
    const result = catalogPage(page(), [
      { bbox: [.1, .1, .3, .3], components: ['raster'] },
      { bbox: [.305, .12, .45, .3], components: ['vector'] },
      { bbox: [.65, .6, .9, .8], components: ['vector'] },
    ])
    expect(result.candidates).toHaveLength(2)
    expect(result.candidates[0].components).toEqual(expect.arrayContaining(['raster', 'vector']))
    expect(result.candidates[0].object_bbox).toEqual([.1, .1, .45, .3])
    expect(result.source_element_id).toContain(':page:1:image:')
    expect(result.warnings).toContain('regions_and_caption_associations_are_unverified')
  })

  it('keeps continuation lines of a caption inside the suggested crop', () => {
    const indexed = page()
    indexed.elements = [{ bbox_normalized: [.1, .4, .8, .41], confidence: .5, element_id: 'caption', kind: 'caption_candidate', order: 0, page_number: 1, reasons: [], status: 'transform_with_warning', text: 'Figure 1: Evidence' }]
    indexed.fragments = [
      { text: 'continued caption', has_eol: true, bbox_normalized: [.1, .412, .8, .422] },
      { text: 'final caption line', has_eol: true, bbox_normalized: [.1, .424, .6, .434] },
      { text: 'Next body paragraph', has_eol: true, bbox_normalized: [.1, .46, .8, .475] },
    ]
    const candidate = catalogPage(indexed, [{ bbox: [.15, .1, .75, .38], components: ['raster'] }]).candidates[0]
    expect(candidate.caption_element_id).toBe('caption')
    expect(candidate.suggested_view.bbox[3]).toBeCloseTo(.459)
    expect(candidate.suggested_view.bbox[3]).toBeLessThan(.46)
  })

  it('preserves a full-page fallback for scans and for missed detections', () => {
    const scan = catalogPage(page(), imageRegions([0, 0, 1, 0, 0, 1]))
    expect(scan.source_only).toBe(true)
    expect(scan.candidates[0].kind).toBe('page_sized_image_or_graphic')
    expect(scan.candidates[0].suggested_view.bbox).toEqual([0, 0, 1, 1])
    expect(catalogPage(page(), []).fallback_view.bbox).toEqual([0, 0, 1, 1])
  })

  it('bounds large inventories and discloses omissions', () => {
    const regions = Array.from({ length: 20 }, (_, i) => ({ bbox: [i % 5 * .19, Math.floor(i / 5) * .22, i % 5 * .19 + .1, Math.floor(i / 5) * .22 + .1] as [number, number, number, number], components: ['raster'] }))
    const result = catalogPage(page(), regions)
    expect(result.candidate_count).toBe(20)
    expect(result.candidates).toHaveLength(12)
    expect(result.omitted_candidates).toBe(8)
    expect(JSON.stringify({ pages: Array.from({ length: 4 }, () => result) }).length).toBeLessThan(48_000)
  })

  it('rejects invalid scopes and incomplete or mismatched indexes before rendering', async () => {
    const load = vi.mocked(getBrowserSourcePages)
    await expect(getSourceVisualCatalog('visual-test', 1, 10, 9)).rejects.toThrow('valid PDF')
    expect(load).not.toHaveBeenCalled()
    load.mockResolvedValue([page()])
    await expect(getSourceVisualCatalog('visual-test', 1, 4, 4)).rejects.toThrow('indexing')
    await expect(getSourceVisualCatalog('other-source', 1, 1, 1)).rejects.toThrow('indexing')
    expect(load.mock.calls[0]).toEqual(['visual-test', 1, 4])
  })
})

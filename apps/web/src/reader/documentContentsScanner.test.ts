import { describe, expect, it } from 'vitest'
import { buildIndexedSourcePage } from '../storage/sourceIntelligence'
import type { IndexedTextFragment } from '../storage/sourceIndexTypes'
import { scanDocumentContents } from './documentContentsScanner'
import { paginateContents } from './contentsPagination'

const line = (text: string, y: number, h = .014, x = .1, right = .8): IndexedTextFragment => ({
  text, has_eol: true, bbox_normalized: [x, y, right, y + h],
})
const prose = [line('Ordinary body text provides context and a stable reference for the document typography.', .65),
  line('A second line explains the example and continues the ordinary prose used in this fixture.', .68)]
const page = (n: number, lines: IndexedTextFragment[]) => buildIndexedSourcePage({
  fragments: [...lines, ...prose], height: 800, width: 600, pageNumber: n, rotation: 0, sourceId: 'synthetic',
})

describe('document contents analysis', () => {
  it('repairs unambiguous letter-spaced labels without guessing word boundaries', () => {
    const sections = scanDocumentContents([page(1, [line('f o r e w o r D', .2, .035)]),
      page(2, [line('PaRT I', .2, .04)]), page(3, [line('t H e B a s i C s', .2, .04)])], 3).sections
    expect(sections.map(section => section.title)).toEqual(['Foreword', 'Part I', 't H e B a s i C s'])
  })
  it('uses observed typography for sparse slides instead of treating every large line as a heading', () => {
    const slide = (n: number, title: string) => buildIndexedSourcePage({ sourceId: 'slides', pageNumber: n,
      width: 960, height: 540, rotation: 0, fragments: [line(title, .15, .055),
        line('A short supporting statement', .35, .03), line('Another short supporting statement', .5, .03),
        line('One final supporting statement', .65, .03)] })
    expect(scanDocumentContents([slide(1, 'Energy transfer'), slide(2, 'Conservation principles')], 2).sections.map(s => s.title))
      .toEqual(['Energy transfer', 'Conservation principles'])
  })

  it('rejects large table cells and short command-output runs', () => {
    const result = scanDocumentContents([page(1, [
      line('Account name', .15, .03, .1, .35), line('Balance remaining', .15, .03, .6, .9),
      line('CALL EAX', .3, .025), line('PUSH EBP', .335, .025), line('RETURN VALUE', .37, .025),
      line('$ inspect sample', .5, .025), line('load_document()', .56, .025),
    ])], 1)
    expect(result.sections).toEqual([])
    expect(result.warnings.join(' ')).toContain('No reliable text headings')
  })

  it('prefers a verified printed outline over unrelated enlarged callouts', () => {
    const titles = ['Energy', 'Motion', 'Forces', 'Work', 'Power']
    const pages = [page(1, [line('Contents', .1, .03), ...titles.map((title, i) => line(`${title} .... ${i + 1}`, .2 + i * .05))]),
      ...titles.map((title, i) => page(i + 5, [line(title, .2, .03), line('Enlarged sidebar callout', .4, .025)]))]
    expect(scanDocumentContents(pages, 9).sections.map(s => s.title)).toEqual(titles)
  })
  it('removes recto/verso running headers and page-number prefixes but retains the actual section start', () => {
    const pages = [page(1, [line('Chapter 1 Growth', .25, .04), line('1.1 Roots', .4, .022)]),
      ...[2, 4, 6].map(n => page(n, [line(`${n} Chapter 1`, .04), line('1.1 Roots', .08)])),
      ...[3, 5, 7].map(n => page(n, [line(`Growth ${n}`, .04)]))]
    const before = JSON.stringify(pages)
    const result = scanDocumentContents(pages, 7).sections
    expect(result.map(item => item.title)).toEqual(['Chapter 1 Growth', '1.1 Roots'])
    expect(result[1]).toMatchObject({ page_start: 1, parent_id: result[0].id, level: 2 })
    expect(result[1].page_y).toBeCloseTo(.385)
    expect(JSON.stringify(pages)).toBe(before)
  })

  it('does not turn printed contents, mini-contents, table cells or machine output into destinations', () => {
    const rows = ['1.1 Roots 8', '1.2 Stems 12', '1.3 Leaves 16', '1.4 Flowers 20', '1.5 Seeds 24']
    const result = scanDocumentContents([
      page(1, [line('B r i e f C o n t e n t s', .15, .035), line('Part I: Growth', .3, .022)]),
      page(2, rows.map((text, i) => line(text, .2 + i * .05, .021))),
      page(3, [line('1 Garden September', .2), line('2 Meadow January', .23),
        line('192.0.2.0 U 0 0 0 eth0', .3, .023), line('1 First choice', .4, .014, .1, .3), line('September', .4, .014, .55, .8)]),
      page(8, [line('1.1 Roots', .25, .022)]),
    ], 24).sections
    expect(result.map(item => item.title)).toEqual(['1.1 Roots'])
    expect(result[0].page_start).toBe(8)
  })

  it('keeps deeply numbered sections, wraps titles, and retains distinct unnumbered headings', () => {
    const pages = [page(1, [line('Preface', .2, .035)]), page(2, [line('Chapter 1 Growth', .2, .04),
      line('1.1 A lengthy heading', .3, .023), line('continued on another line', .328, .023),
      line('1.1.1.1.1.1 Fine structure', .45, .022)]),
    page(3, [line('Summary', .2, .025)]), page(4, [line('Chapter 2 Seasons', .2, .04), line('Summary', .4, .025)])]
    const sections = scanDocumentContents(pages, 4).sections
    expect(sections.map(item => item.title)).toContain('1.1 A lengthy heading continued on another line')
    expect(sections.find(item => item.title.includes('Fine structure'))?.level).toBe(6)
    expect(sections.filter(item => item.title === 'Summary')).toHaveLength(2)
    expect(new Set(sections.map(item => item.id)).size).toBe(sections.length)
    expect(scanDocumentContents([...pages].reverse(), 4).sections).toEqual(sections)
  })

  it('discloses scans and damaged mappings without inventing headings', () => {
    const scan = page(1, [])
    scan.fragments = []; scan.elements = []; scan.profile.layout_state = 'source_only'
    const result = scanDocumentContents([scan], 1)
    expect(result.sections).toEqual([])
    expect(result.warnings.join(' ')).toContain('OCR')
  })
  it('resolves letter-spaced chapter titles from printed contents to actual text, not guessed offsets', () => {
    const pages = [page(1, [line('Contents', .1, .035), line('Chapter 1: Seeds .... 1', .2),
      line('1.1 Roots .... 2', .25), line('1.2 Leaves .... 3', .3), line('1.3 Flowers .... 4', .35),
      line('1.4 Missing .... 5', .4), line('Chapter 2: Climate .... 6', .45)]),
    page(5, [line('S E E D S', .3, .04)]), page(6, [line('1.1 Roots', .3, .022)]),
    page(7, [line('1.2 Leaves', .3, .022)]), page(8, [line('1.3 Flowers', .3, .022)]),
    page(10, [line('C L I M A T E', .3, .04)]), page(20, [line('Missing', .3)])]
    const sections = scanDocumentContents(pages, 20).sections
    expect(sections[0]).toMatchObject({ title: 'Chapter 1: Seeds', page_start: 5, level: 1, detection_reasons: ['verified_printed_contents'] })
    expect(sections.some(section => section.page_start === 1 || section.title.includes('Missing'))).toBe(false)
    expect(sections.find(section => section.title === 'Chapter 2: Climate')?.page_start).toBe(10)
  })

  it('keeps stable navigation IDs when unrelated earlier headings are added', () => {
    const destination = page(4, [line('4.1 Seasonality', .3, .022)])
    const original = scanDocumentContents([destination], 4).sections[0]
    const expanded = scanDocumentContents([page(1, [line('Preface', .2, .035)]), destination], 4).sections.at(-1)
    expect(expanded?.id).toBe(original.id)
  })

  it('paginates a large outline without gaps, duplicates or oversized batches', () => {
    const section = scanDocumentContents([page(1, [line('Preface', .2, .035)])], 1).sections[0]
    const sections = Array.from({ length: 665 }, (_, i) => ({ ...section, id: `section-${i}` }))
    const collected = []
    let cursor: string | null = '0'
    do {
      const batch = paginateContents(sections, cursor, 40)
      expect(batch.outline.length).toBeLessThanOrEqual(40)
      collected.push(...batch.outline); cursor = batch.next_cursor
    } while (cursor !== null)
    expect(collected).toEqual(sections)
    for (const bad of ['-1', 'Infinity', '0.5', '666']) expect(() => paginateContents(sections, bad)).toThrow()
  })
})

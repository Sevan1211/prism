// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { textFragment } from './pdfTextGeometry'
import { buildIndexedSourcePage } from './sourceIntelligence'

describe('independent textbook extraction', () => {
  it('keeps real single-column text transformable despite inline font changes and a source figure', async () => {
    const bytes = await readFile(new URL('../../../../benchmarks/fixtures/computer-networks-v6.1.pdf', import.meta.url))
    const task = getDocument({ data: new Uint8Array(bytes) })
    try {
      const pdf = await task.promise
      expect(pdf.numPages).toBe(489)
      for (const pageNumber of [41, 42, 43]) {
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const content = await page.getTextContent()
        const result = buildIndexedSourcePage({
          sourceId: 'reference', pageNumber, width: viewport.width, height: viewport.height, rotation: viewport.rotation,
          fragments: content.items.flatMap((item) => 'str' in item ? [textFragment(item, viewport, Util, content.styles[item.fontName])] : []),
        })
        expect(result.profile.layout_state, `page ${pageNumber}: ${result.profile.warnings.join(',')}`).toBe('linear_candidate')
        expect(result.elements.some((element) => /bandwidth/i.test(element.text))).toBe(true)
        if (pageNumber === 42) {
          expect(result.text).toContain('bandwidth requirements of an application')
          expect(result.elements.some((element) => element.kind === 'caption_candidate' && /1.16/.test(element.text))).toBe(true)
        }
        if (pageNumber === 43) expect(result.elements.find((element) => element.text.startsWith('where Distance'))?.kind).toBe('paragraph_candidate')
        page.cleanup()
      }
    } finally { await task.destroy() }
  })

  it.each([90, 180, 270])('rotates every corner of a text highlight with a %s degree page', async (rotation) => {
    const task = getDocument({ data: new Uint8Array(await readFile(new URL('../../../../benchmarks/fixtures/computer-networks-v6.1.pdf', import.meta.url))) })
    try {
      const pdf = await task.promise
      const page = await pdf.getPage(42)
      const content = await page.getTextContent()
      const item = content.items.find((entry) => 'str' in entry && entry.str.length > 20)
      if (!item || !('str' in item)) throw new Error('Missing text fixture')
      const upright = textFragment(item, page.getViewport({ scale: 1, rotation: 0 }), Util, content.styles[item.fontName]).bbox_normalized
      const rotated = textFragment(item, page.getViewport({ scale: 1, rotation }), Util, content.styles[item.fontName]).bbox_normalized
      const [l, t, r, b] = upright
      const expected = rotation === 90 ? [1 - b, l, 1 - t, r] : rotation === 180 ? [1 - r, 1 - b, 1 - l, 1 - t] : [t, 1 - r, b, 1 - l]
      expected.forEach((value, index) => expect(rotated[index]).toBeCloseTo(value, 6))
      page.cleanup()
    } finally { await task.destroy() }
  })
})

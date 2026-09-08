import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getDocument, Util } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { buildIndexedSourcePage } from '../apps/web/src/storage/sourceIntelligence'
import { textFragment } from '../apps/web/src/storage/pdfTextGeometry'

// Explicitly invoked with npm run audit:pdf. These independently published PDFs
// are downloaded by the operator, never bundled with the application or silently
// fetched by a test. This is extraction evidence, not a semantic accuracy score.
const corpus = [
  { file: 'downloads/recursive-language-models-v3.pdf', name: 'Recursive Language Models v3', pages: 43, terms: ['Recursive Language Models', 'Negative Results', 'context'] },
  { file: 'downloads/physical-geology-ch10.pdf', name: 'Physical Geology, chapter 10', pages: 43, terms: ['Plate Tectonics', 'Wegener', 'subduction'] },
  { file: 'downloads/bert.pdf', name: 'BERT v2 (held out)', pages: 16, terms: ['Bidirectional', 'masked', 'fine-tuning'] },
]

describe('independent PDF corpus', () => {
  it.each(corpus)('$name retains content and bounded original-page anchors', async ({ file, name, pages, terms }) => {
    const bytes = await readFile(new URL(file, import.meta.url))
    const task = getDocument({ data: new Uint8Array(bytes), standardFontDataUrl: fileURLToPath(new URL('./standard_fonts/', import.meta.resolve('pdfjs-dist/package.json'))).replaceAll('\\', '/') })
    try {
      const pdf = await task.promise
      if (pages) expect(pdf.numPages).toBe(pages)
      const layouts: Record<string, number> = {}
      const kinds: Record<string, number> = {}
      const texts: string[] = []
      let total = 0, transformable = 0
      const started = performance.now()
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number)
        const viewport = page.getViewport({ scale: 1 })
        const content = await page.getTextContent()
        const result = buildIndexedSourcePage({ sourceId: 'corpus', pageNumber: number, width: viewport.width, height: viewport.height, rotation: viewport.rotation,
          fragments: content.items.flatMap((item) => 'str' in item ? [textFragment(item, viewport, Util, content.styles[item.fontName])] : []),
        })
        texts.push(result.text)
        layouts[result.profile.layout_state] = (layouts[result.profile.layout_state] ?? 0) + 1
        const ids = new Set<string>()
        for (const element of result.elements) {
          expect(ids.has(element.element_id)).toBe(false)
          ids.add(element.element_id)
          expect(element.page_number).toBe(number)
          expect(element.bbox_normalized.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true)
          expect(element.bbox_normalized[2]).toBeGreaterThanOrEqual(element.bbox_normalized[0])
          expect(element.bbox_normalized[3]).toBeGreaterThanOrEqual(element.bbox_normalized[1])
          kinds[element.kind] = (kinds[element.kind] ?? 0) + 1
          total++
          if (element.status === 'transform_with_warning') transformable++
        }
        // Known mixed-layout regression: author columns must not suppress the
        // isolated full-width abstract. Table fragments remain conservative.
        if (name === 'Recursive Language Models v3' && number === 1) {
          expect(result.elements.some((element) => element.text.startsWith('We study allowing') && element.status === 'transform_with_warning')).toBe(true)
        }
        if (name === 'Recursive Language Models v3' && number === 6) {
          expect(result.elements.some((element) => element.status === 'source_only')).toBe(true)
        }
        page.cleanup()
      }
      const text = texts.join('\n')
      for (const term of terms) expect(text.toLowerCase()).toContain(term.toLowerCase())
      expect(text.length).toBeGreaterThan(10000)
      console.log(JSON.stringify({ name, sha256: createHash('sha256').update(bytes).digest('hex'), pages: pdf.numPages, characters: text.length, elements: total, transformable, layouts, kinds, elapsed_ms: Math.round(performance.now() - started) }))
    } finally { await task.destroy() }
  })
})

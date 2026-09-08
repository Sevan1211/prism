import { describe, expect, it, vi } from 'vitest'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { inspectPdfDocument } from './pdfDocumentStructure'

describe('PDF navigation destinations', () => {
  it('retains named and direct vertical destinations without rendering every page', async () => {
    const doc = {
      getOutline: async () => [
        { title: 'Methods', dest: 'methods', items: [{ title: 'Details', dest: [2, { name: 'FitH' }, 480], items: [] }] },
        { title: 'Invalid', dest: [99, { name: 'Fit' }], items: [] },
      ],
      getDestination: async () => [1, { name: 'XYZ' }, 0, 620, null],
      getMetadata: async () => ({ info: {} }), getPageLabels: async () => ['i', '1', '2'],
      getPage: vi.fn(),
    }
    const result = await inspectPdfDocument(doc as unknown as PDFDocumentProxy, 3)
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0]).toMatchObject({ page_start: 2, pdf_top: 620 })
    expect(result.sections[1]).toMatchObject({ page_start: 3, pdf_top: 480, parent_id: result.sections[0].id })
    expect(doc.getPage).not.toHaveBeenCalled()
  })
  it('isolates broken destinations and metadata, retaining reachable child bookmarks', async () => {
    const doc = {
      getOutline: async () => [{ title: 'Parent', dest: 'broken', items: [{ title: 'Child', dest: [0, { name: 'XYZ' }, 0, null, null], items: [] }] }],
      getDestination: async () => { throw new Error('Malformed destination') },
      getMetadata: async () => { throw new Error('No metadata') }, getPageLabels: async () => null,
    }
    const result = await inspectPdfDocument(doc as unknown as PDFDocumentProxy, 3)
    expect(result.sections.map(section => section.title)).toEqual(['Parent', 'Child'])
    expect(result.sections.every(section => section.pdf_top === undefined)).toBe(true)
  })
})

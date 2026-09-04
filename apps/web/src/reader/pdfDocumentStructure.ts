import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { SourceSection } from '../types'

interface PdfOutlineNode {
  dest: string | unknown[] | null
  items: PdfOutlineNode[]
  title: string
}

interface ResolvedOutlineNode {
  children: ResolvedOutlineNode[]
  page: number | null
  title: string
}

export interface PdfDocumentDetails {
  author: string | null
  creator: string | null
  format: string | null
  keywords: string | null
  producer: string | null
  subject: string | null
  title: string | null
}

export interface PdfDocumentInspection {
  details: PdfDocumentDetails
  pageLabels: string[] | null
  sections: SourceSection[]
}

const EMPTY_DETAILS: PdfDocumentDetails = {
  author: null,
  creator: null,
  format: null,
  keywords: null,
  producer: null,
  subject: null,
  title: null,
}

/**
 * Reads the document-authored navigation and metadata embedded in the PDF.
 * Each feature is isolated so a malformed outline cannot hide valid metadata,
 * page labels, or the PDF pages themselves.
 */
export async function inspectPdfDocument(
  doc: PDFDocumentProxy,
  pageCount: number,
): Promise<PdfDocumentInspection> {
  const [outline, metadata, pageLabels] = await Promise.all([
    doc.getOutline().catch(() => []),
    doc.getMetadata().catch(() => null),
    doc.getPageLabels().catch(() => null),
  ])

  const resolved = await Promise.all(
    ((outline ?? []) as PdfOutlineNode[]).map((node) => resolveOutlineNode(doc, node, pageCount)),
  )
  const sections = flattenOutline(resolved.filter((node) => node.page !== null), pageCount)

  return {
    details: metadata ? metadataDetails(metadata.info) : EMPTY_DETAILS,
    pageLabels: pageLabels?.length === pageCount ? pageLabels : null,
    sections,
  }
}

async function resolveOutlineNode(
  doc: PDFDocumentProxy,
  node: PdfOutlineNode,
  pageCount: number,
): Promise<ResolvedOutlineNode> {
  const children = await Promise.all(
    (node.items ?? []).map((child) => resolveOutlineNode(doc, child, pageCount)),
  )
  const directPage = await destinationPage(doc, node.dest, pageCount)
  return {
    children,
    page: directPage ?? children.find((child) => child.page !== null)?.page ?? null,
    title: node.title.trim(),
  }
}

async function destinationPage(
  doc: PDFDocumentProxy,
  destination: string | unknown[] | null,
  pageCount: number,
): Promise<number | null> {
  try {
    const explicit = typeof destination === 'string'
      ? await doc.getDestination(destination)
      : destination
    if (!explicit || explicit.length === 0) return null
    const reference = explicit[0]
    const pageIndex = typeof reference === 'number'
      ? reference
      : await doc.getPageIndex(reference as Parameters<PDFDocumentProxy['getPageIndex']>[0])
    const page = pageIndex + 1
    return page >= 1 && page <= pageCount ? page : null
  } catch {
    return null
  }
}

function flattenOutline(nodes: ResolvedOutlineNode[], pageCount: number): SourceSection[] {
  const provisional: SourceSection[] = []

  const visit = (
    node: ResolvedOutlineNode,
    path: number[],
    level: number,
    parentId: string | null,
  ) => {
    if (node.page === null || !node.title) return
    const id = `pdf-outline-${path.join('-')}`
    provisional.push({
      confidence: 1,
      id,
      level,
      origin: 'outline',
      page_end: pageCount,
      page_start: node.page,
      parent_id: parentId,
      title: node.title,
    })
    node.children.forEach((child, index) => visit(child, [...path, index], level + 1, id))
  }

  nodes.forEach((node, index) => visit(node, [index], 1, null))

  return provisional.map((section, index) => {
    const nextBoundary = provisional.slice(index + 1).find((candidate) => (
      candidate.level <= section.level && candidate.page_start >= section.page_start
    ))
    return {
      ...section,
      page_end: nextBoundary
        ? Math.max(section.page_start, nextBoundary.page_start - 1)
        : pageCount,
    }
  })
}

function metadataDetails(info: object): PdfDocumentDetails {
  const values = info as Record<string, unknown>
  return {
    author: textValue(values.Author),
    creator: textValue(values.Creator),
    format: textValue(values.PDFFormatVersion),
    keywords: textValue(values.Keywords),
    producer: textValue(values.Producer),
    subject: textValue(values.Subject),
    title: textValue(values.Title),
  }
}

function textValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

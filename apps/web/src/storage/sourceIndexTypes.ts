import type { SourceSection } from '../types'

export const BROWSER_TEXT_INDEX_VERSION = 'pdfjs-evidence-v7'
export function isSupportedEvidenceVersion(version: string): boolean {
  return version === BROWSER_TEXT_INDEX_VERSION || version === 'pdfjs-evidence-v6' || version === 'pdfjs-evidence-v5' || version === 'pdfjs-evidence-v4' || version === 'pdfjs-evidence-v2'
}
export const INDEX_PAGE_BATCH_SIZE = 8

export interface BrowserIndexStatus {
  error: string | null
  pages_indexed: number
  parser_version: string
  state: 'pending' | 'indexing' | 'ready' | 'failed'
  total_pages: number
}

export interface IndexedTextFragment {
  bbox_normalized: [number, number, number, number]
  has_eol: boolean
  text: string
}

export type SourceElementKind =
  | 'page_image'
  | 'heading_candidate'
  | 'paragraph_candidate'
  | 'list_candidate'
  | 'caption_candidate'
  | 'code_candidate'
  | 'equation_candidate'
  | 'example_candidate'
  | 'exercise_candidate'
  | 'unclassified_text'

export type SourceEvidenceStatus = 'transform_with_warning' | 'source_only'

export interface IndexedSourceElement {
  bbox_normalized: [number, number, number, number]
  confidence: number
  element_id: string
  kind: SourceElementKind
  order: number
  page_number: number
  reasons: string[]
  status: SourceEvidenceStatus
  text: string
}

export interface IndexedPageProfile {
  embedded_text_characters: number
  height_points: number
  layout_state: 'linear_candidate' | 'column_candidate' | 'complex_candidate' | 'source_only'
  rotation: number
  visual_inventory: 'not_indexed'
  warnings: string[]
  width_points: number
}

export interface IndexedSourcePage {
  elements: IndexedSourceElement[]
  fragments: IndexedTextFragment[]
  index_version: string
  page_number: number
  profile: IndexedPageProfile
  source_id: string
  text: string
}

export interface SourceAnchor {
  bbox_normalized: [number, number, number, number] | null
  element_id: string | null
  end_offset: number | null
  id: string
  parser_version: string
  pdf_page_index: number
  printed_page_label: string | null
  section_id: string | null
  source_hash: string
  start_offset: number | null
  text_snapshot_hash: string | null
}

export interface BrowserSourceMap {
  capabilities: {
    exact_search: boolean
    lesson_compilation: false
    render_original: true
    scope_manifest: boolean
    structural_detection: 'candidate_only'
    visual_detection: 'not_available'
  }
  content_hash: string
  index_status: BrowserIndexStatus
  name: string
  outline: SourceSection[]
  page_count: number
  page_labels: 'pdf_page_index_only'
  parser_version: string
  source_id: string
  warnings: string[]
}

export interface ScopeManifestItem {
  anchor: SourceAnchor
  confidence: number
  kind: SourceElementKind
  preview: string
  reasons: string[]
  status: SourceEvidenceStatus
}

export interface BrowserScopeManifest {
  complete_for_range: boolean
  cursor: string
  inventory: {
    element_counts: Partial<Record<SourceElementKind, number>>
    pages_source_only: number
    pages_with_embedded_text: number
  }
  items: ScopeManifestItem[]
  next_cursor: string | null
  omissions: string[]
  page_end: number
  page_start: number
  parser_version: string
  source_id: string
  warnings: string[]
}

export interface SourceEvidenceItem {
  anchor: SourceAnchor
  confidence: number
  context_for: string[]
  kind: SourceElementKind
  reasons: string[]
  status: SourceEvidenceStatus
  text: string
}

export interface BrowserEvidenceBundle {
  bundle_complete: boolean
  elements: SourceEvidenceItem[]
  omitted_element_ids: string[]
  parser_version: string
  source_id: string
  warnings: string[]
}

export interface SourceIndexRequest {
  file: File
  sourceId: string
  startPage: number
}

export type SourceIndexWorkerMessage =
  | { pages: IndexedSourcePage[]; type: 'batch' }
  | { page: number; total: number; type: 'progress' }
  | { type: 'complete' }
  | { message: string; name: string; type: 'error' }

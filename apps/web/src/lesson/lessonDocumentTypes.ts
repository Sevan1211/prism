import type { LessonEndQuestion } from './lessonPlanTypes'
import type { DataPlot, VisualScene } from './lessonVisuals'

export type LessonBlockProvenance =
  | 'source_authored'
  | 'source_grounded'
  | 'added_explanation'

export type LessonBlockContent =
  | VisualScene
  | DataPlot
  | { kind: 'illustration'; asset_id: string; alt: string; caption: string }
  | { kind: 'prose'; text: string }
  | { kind: 'rich_text'; markdown: string }
  | { kind: 'source_figure'; page_number: number; bbox: [number, number, number, number]; alt: string; caption: string }
  | { kind: 'network_delay'; caption: string; packet_bytes: number; link_mbps: number; propagation_ms: number }
  | { kind: 'definition'; definition: string; term: string }
  | { kind: 'source_excerpt'; text: string }
  | { kind: 'callout'; text: string; tone: 'note' | 'warning' | 'boundary' }
  | { kind: 'equation'; explanation: string; latex: string }
  | { kind: 'code'; code: string; explanation: string; language: string }
  | { kind: 'worked_example'; prompt: string; result: string; steps: string[] }
  | { kind: 'table'; caption: string; columns: string[]; rows: string[][] }
  | {
      kind: 'diagram'
      caption: string
      nodes: Array<{ label: string; node_id: string }>
      edges: Array<{ from: string; label: string; to: string }>
    }
  | {
      kind: 'animation'
      caption: string
      steps: Array<{ description: string; label: string; step_id: string }>
    }
  | { kind: 'summary'; points: string[] }

export interface LessonContentBlock {
  block_id: string
  content: LessonBlockContent
  provenance: LessonBlockProvenance
  source_element_ids: string[]
}

export interface LessonDocumentSection {
  blocks: LessonContentBlock[]
  objective_ids: string[]
  section_id: string
  title: string
}

export interface LessonValidationIssue {
  block_id: string | null
  code: string
  message: string
  section_id: string | null
}

export interface LessonValidationReport {
  block_count: number
  checked_at: string
  errors: LessonValidationIssue[]
  section_count: number
  valid_for_ready: boolean
  warnings: LessonValidationIssue[]
}

export interface LessonDocument {
  patch_receipt?: { request_id: string; fingerprint: string }
  approval_hash: string
  created_at: string
  document_version: number
  end_questions: LessonEndQuestion[]
  lesson_id: string
  plan_id: string
  plan_version: 1
  record_version: 1
  sections: LessonDocumentSection[]
  source_hash: string
  source_id: string
  status: 'draft' | 'ready'
  semantic_review?: { summary: string; reviewed_at: string; reviewer: string }
  title: string
  updated_at: string
  validation: LessonValidationReport
}

export type LessonPatchOperation =
  | {
      after_block_id: string | null
      block: LessonContentBlock
      operation: 'insert_block'
      section_id: string
    }
  | {
      block: LessonContentBlock
      block_id: string
      operation: 'replace_block'
    }
  | { block_id: string; operation: 'remove_block' }
  | {
      after_block_id: string | null
      block_id: string
      operation: 'move_block'
      section_id: string
    }

export interface ApplyLessonPatchInput {
  request_id?: string
  expected_version: number | null
  operations: LessonPatchOperation[]
  plan_id: string
}

export interface LessonEditProposal {
  proposal_id: string
  source_id: string
  lesson_id: string
  plan_id: string
  base_version: number
  candidate: LessonDocument
  summary: string
  created_at: string
}

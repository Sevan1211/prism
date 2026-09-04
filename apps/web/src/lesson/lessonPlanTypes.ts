export type LessonDepth = 'overview' | 'standard' | 'deep'
export type LessonPlanStatus = 'proposed' | 'approved'
export type LessonBriefKind = 'assignment' | 'repair'
export type LessonOutputKind = 'lesson' | 'research_brief'

export interface ScopeReview {
  page_start: number
  page_end: number
  summary: string
  essential_element_ids: string[]
  visual_review: 'inspected' | 'not_needed' | 'unresolved'
  visual_notes: string
  updated_at: string
}

export interface LessonCoverageRange {
  page_start: number
  page_end: number
  disposition: CoverageDisposition
  reason: string
}

export type CoverageDisposition =
  | 'core'
  | 'supporting'
  | 'compressed'
  | 'prerequisite'
  | 'omitted'
  | 'deferred'
  | 'source_only'

export type RepresentationIntent =
  | 'source_excerpt'
  | 'source_figure'
  | 'generated_diagram'
  | 'visual_scene'
  | 'data_plot'
  | 'equation'
  | 'code'
  | 'table'
  | 'animation'
  | 'worked_example'
  | 'analogy'

export type LessonQuestionKind =
  | 'explanation'
  | 'application'
  | 'prediction'
  | 'comparison'
  | 'trace'
  | 'diagnosis'
  | 'interpretation'

export interface LessonBrief {
  output_kind?: LessonOutputKind
  target_words?: number | null
  include_questions?: boolean
  scope_reviews?: ScopeReview[]
  assignment: string
  brief_id: string
  brief_kind?: LessonBriefKind
  created_at: string
  intended_depth: LessonDepth
  learner_goal: string
  name: string
  page_end: number
  page_start: number
  parent_lesson_id?: string | null
  parent_plan_id?: string | null
  prior_knowledge: string[]
  record_version: 1
  repair_for_analysis_ids?: string[]
  repair_for_criterion_ids?: string[]
  repair_source_element_ids?: string[]
  source_hash: string
  source_id: string
  time_budget_minutes: number
  updated_at: string
}

export interface LessonObjective {
  description: string
  importance: 'essential' | 'supporting'
  objective_id: string
}

export interface LessonSectionPlan {
  estimated_minutes: number
  objective_ids: string[]
  representation_intents: RepresentationIntent[]
  section_id: string
  source_element_ids: string[]
  title: string
}

export interface LessonCoverageEntry {
  disposition: CoverageDisposition
  element_id: string
  reason: string | null
}

export interface LessonEndQuestion {
  criteria: LessonAnswerCriterion[]
  kind: LessonQuestionKind
  objective_ids: string[]
  prompt: string
  question_id: string
}

export interface LessonAnswerCriterion {
  criterion_id: string
  description: string
  source_element_ids: string[]
}

export interface LessonPlan {
  coverage_ranges?: LessonCoverageRange[]
  target_words?: number | null
  output_kind?: LessonOutputKind
  approval_hash: string | null
  approved_at: string | null
  brief_id: string
  coverage: LessonCoverageEntry[]
  created_at: string
  end_questions: LessonEndQuestion[]
  estimated_minutes: number
  objectives: LessonObjective[]
  page_end: number
  page_start: number
  plan_id: string
  plan_version: 1
  sections: LessonSectionPlan[]
  source_hash: string
  source_id: string
  status: LessonPlanStatus
  title: string
  updated_at: string
  warnings: string[]
}

export interface LessonBriefInput {
  output_kind?: LessonOutputKind
  target_words?: number | null
  include_questions?: boolean
  assignment: string
  intended_depth: LessonDepth
  learner_goal: string
  name: string
  page_end: number
  page_start: number
  prior_knowledge: string[]
  source_id: string
  time_budget_minutes: number
}

export interface LessonPlanProposalInput {
  coverage_ranges?: LessonCoverageRange[]
  brief_id: string
  coverage: LessonCoverageEntry[]
  end_questions: LessonEndQuestion[]
  objectives: LessonObjective[]
  sections: LessonSectionPlan[]
  title: string
  warnings: string[]
}

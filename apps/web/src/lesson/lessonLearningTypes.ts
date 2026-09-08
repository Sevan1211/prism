import type { LessonBrief, LessonDepth } from './lessonPlanTypes'

export type LessonAnswerStatus =
  | 'demonstrated'
  | 'partially_demonstrated'
  | 'unclear'
  | 'contradicted'
  | 'not_attempted'

export type LessonCriterionStatus =
  | 'met'
  | 'partially_met'
  | 'unclear'
  | 'not_met'
  | 'not_attempted'

export interface LessonCriterionAnalysis {
  criterion_id: string
  evidence_element_ids: string[]
  note: string
  status: LessonCriterionStatus
}

export interface LessonAnswerAnalysis {
  agent_label: string
  analysis_id: string
  created_at: string
  criterion_analyses: LessonCriterionAnalysis[]
  document_version: number
  gaps: string[]
  learner_answer: string | null
  lesson_id: string
  plan_id: string
  question_id: string
  record_version: 1
  source_id: string
  status: LessonAnswerStatus
  strengths: string[]
  supersedes_analysis_id: string | null
  uncertainty: string | null
}

export interface RecordLessonAnswerAnalysisInput {
  agent_label: string
  criterion_analyses: LessonCriterionAnalysis[]
  document_version: number
  gaps: string[]
  learner_answer: string | null
  lesson_id: string
  question_id: string
  status: LessonAnswerStatus
  strengths: string[]
  uncertainty: string | null
}

export type LessonOutcomeRecommendation = 'close' | 'continue_discussion' | 'repair'
export type LessonOutcomeStatus = 'proposed' | 'accepted' | 'dismissed'

export interface LessonRepairDraft {
  assignment: string
  intended_depth: LessonDepth
  learner_goal: string
  name: string
  page_end: number
  page_start: number
  prior_knowledge: string[]
  source_element_ids: string[]
  time_budget_minutes: number
}

export interface ProposeLessonOutcomeInput {
  document_version: number
  lesson_id: string
  rationale: string
  recommendation: LessonOutcomeRecommendation
  repair: LessonRepairDraft | null
  unresolved_criterion_ids: string[]
}

export interface LessonOutcomeProposal {
  accepted_at: string | null
  analysis_ids: string[]
  child_brief_id: string | null
  created_at: string
  document_version: number
  lesson_id: string
  plan_id: string
  proposal_id: string
  rationale: string
  recommendation: LessonOutcomeRecommendation
  record_version: 1
  repair: LessonRepairDraft | null
  source_id: string
  status: LessonOutcomeStatus
  supersedes_proposal_id: string | null
  unresolved_criterion_ids: string[]
  updated_at: string
}

export interface LessonEndCheck {
  analyses: LessonAnswerAnalysis[]
  document_version: number
  lesson_id: string
  questions: Array<{
    criteria: Array<{
      criterion_id: string
      description: string
      source_element_ids: string[]
    }>
    kind: string
    objective_ids: string[]
    prompt: string
    question_id: string
  }>
  ready: boolean
  validation_errors: string[]
}

export interface LessonOutcomeAcceptance {
  proposal: LessonOutcomeProposal
  repair_brief: LessonBrief | null
}

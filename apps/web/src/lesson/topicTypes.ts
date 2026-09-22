import type { LessonSectionPlan, LessonObjective, LessonEndQuestion } from './lessonPlanTypes'

export type ResearchMode = 'knowledge_research' | 'knowledge_only' | 'selected_sources'
export interface TopicReference {
  id: string
  title: string
  kind: 'web' | 'source'
  url?: string
  accessed_at?: string
  locator: string
  support: string
  source_id?: string
  source_hash?: string
  element_ids?: string[]
}
export interface TopicLessonScope {
  series_id: string
  research_mode: ResearchMode
  references: TopicReference[]
  prerequisites: string[]
  exclusions: string[]
}
export interface TopicSeries {
  id: string
  folder_id: string | null
  title: string
  request: string
  research_mode: ResearchMode
  source_role: 'follow' | 'support'
  source_ids: string[]
  status: 'clarifying' | 'proposed' | 'approved'
  version: number
  clarifications: Array<{ question: string; answer: string }>
  plan_ids: string[]
  assumptions: string[]
  exclusions: string[]
  created_at: string
  updated_at: string
}
export interface TopicLessonProposal {
  title: string
  prerequisites: string[]
  exclusions: string[]
  objectives: LessonObjective[]
  sections: LessonSectionPlan[]
  end_questions: LessonEndQuestion[]
  references: TopicReference[]
}

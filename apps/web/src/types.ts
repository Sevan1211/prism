import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type RightsStatus = Schemas['RightsStatus']
export type SourceStatus = Schemas['SourceStatus']
export type JobState = Schemas['JobState']
export type SourceSummary = Schemas['SourceSummary']
export type SectionReadiness = Schemas['SectionReadiness']
export type SourceReadiness = Schemas['SourceReadiness']
export type SourceSpan = Schemas['SourceSpan']
// Navigation is derived separately from immutable source-evidence anchors.
export type SourceSection = Schemas['SourceSection'] & {
  page_y?: number
  pdf_top?: number
  detection_reasons?: string[]
}
export type SourceStructure = Omit<Schemas['SourceStructure'], 'sections'> & {
  sections: SourceSection[]
  navigation_warnings?: string[]
}
export type SearchHit = Schemas['SearchHit']
export type SearchResponse = Schemas['SearchResponse']
export type ReadingState = Schemas['ReadingState']

import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type RightsStatus = Schemas['RightsStatus']
export type SourceStatus = Schemas['SourceStatus']
export type JobState = Schemas['JobState']
export type SourceSummary = Schemas['SourceSummary']
export type SectionReadiness = Schemas['SectionReadiness']
export type SourceReadiness = Schemas['SourceReadiness']
export type SourceSpan = Schemas['SourceSpan']
export type SourceSection = Schemas['SourceSection']
export type SourceStructure = Schemas['SourceStructure']
export type SearchHit = Schemas['SearchHit']
export type SearchResponse = Schemas['SearchResponse']
export type ReadingState = Schemas['ReadingState']

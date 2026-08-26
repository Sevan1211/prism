import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type RightsStatus = Schemas['RightsStatus']
export type SourceStatus = Schemas['SourceStatus']
export type JobState = Schemas['JobState']
export type SourceSummary = Schemas['SourceSummary']
export type ImportJob = Schemas['ImportJob']
export type ImportResponse = Schemas['ImportResponse']
export type SectionReadiness = Schemas['SectionReadiness']
export type SourceReadiness = Schemas['SourceReadiness']
export type SourceSpan = Schemas['SourceSpan']
export type SourceVisual = Schemas['SourceVisual']
export type SemanticFrame = Schemas['SemanticFrame']
export type LessonPackage = Schemas['LessonPackage']
export type ResearchEvent = Schemas['ResearchEventIn']

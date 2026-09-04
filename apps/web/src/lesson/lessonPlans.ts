import {
  accessBrowserVault,
  PRISM_VAULT_CHANGED_EVENT,
  PRISM_VAULT_LESSON_BRIEF_STORE,
  PRISM_VAULT_LESSON_PLAN_STORE,
  type BrowserVaultEnvironment,
} from '../storage/browserVault'
import { getBrowserScopeManifest, getBrowserSourceMap, readBrowserSourceBundle } from '../storage/browserSources'
import { validateCoverageRanges } from './lessonScope'
import type { ScopeManifestItem } from '../storage/sourceIndexTypes'
import type {
  CoverageDisposition,
  LessonBrief,
  LessonBriefInput,
  LessonAnswerCriterion,
  LessonCoverageEntry,
  LessonEndQuestion,
  LessonObjective,
  LessonPlan,
  LessonPlanProposalInput,
  LessonQuestionKind,
  LessonSectionPlan,
  RepresentationIntent,
} from './lessonPlanTypes'

const MAX_SCOPE_ELEMENTS = 128
const coverageDispositions = new Set<CoverageDisposition>([
  'core', 'supporting', 'compressed', 'prerequisite', 'omitted', 'deferred', 'source_only',
])
const representationIntents = new Set<RepresentationIntent>([
  'source_excerpt', 'source_figure', 'generated_diagram', 'equation', 'code', 'table',
  'animation', 'worked_example', 'analogy', 'visual_scene', 'data_plot',
])
const questionKinds = new Set<LessonQuestionKind>([
  'explanation', 'application', 'prediction', 'comparison', 'trace', 'diagnosis',
  'interpretation',
])

interface LessonPlanDependencies {
  environment?: BrowserVaultEnvironment
  now?: () => string
  randomUUID?: () => string
}

export async function createLessonBrief(
  input: LessonBriefInput,
  dependencies: LessonPlanDependencies = {},
): Promise<LessonBrief> {
  const normalized = normalizeBriefInput(input)
  const sourceMap = await getBrowserSourceMap(normalized.source_id, dependencies.environment)
  if (sourceMap.index_status.state !== 'ready') {
    throw new Error('The browser-local evidence index must be ready before creating a lesson brief.')
  }
  if (normalized.page_end > sourceMap.page_count) {
    throw new Error(`The source has ${sourceMap.page_count} pages; the requested range is invalid.`)
  }
  const timestamp = (dependencies.now ?? currentTime)()
  const brief: LessonBrief = {
    ...normalized,
    brief_id: `brief_${(dependencies.randomUUID ?? randomUUID)()}`,
    brief_kind: 'assignment',
    created_at: timestamp,
    parent_lesson_id: null,
    parent_plan_id: null,
    record_version: 1,
    repair_for_analysis_ids: [],
    repair_for_criterion_ids: [],
    repair_source_element_ids: [],
    source_hash: sourceMap.content_hash,
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => putRecord(database, PRISM_VAULT_LESSON_BRIEF_STORE, brief),
    dependencies.environment,
  )
  notifyVaultChanged()
  return brief
}

export async function proposeLessonPlan(
  input: LessonPlanProposalInput,
  dependencies: LessonPlanDependencies = {},
): Promise<LessonPlan> {
  const brief = await getLessonBrief(input.brief_id, dependencies.environment)
  if (!brief) throw new Error('This lesson brief no longer exists.')
  const manifest = input.coverage_ranges?.length
    ? await selectedScopeManifest(input, brief, dependencies.environment)
    : await collectScopeManifest(brief, dependencies.environment)
  const normalized = validatePlanProposal(input, brief, manifest)
  const timestamp = (dependencies.now ?? currentTime)()
  const plan: LessonPlan = {
    ...normalized,
    ...(input.coverage_ranges?.length ? { coverage_ranges: validateCoverageRanges(input.coverage_ranges, brief), target_words: brief.target_words ?? null, output_kind: brief.output_kind ?? 'lesson' } : {}),
    approval_hash: null,
    approved_at: null,
    brief_id: brief.brief_id,
    created_at: timestamp,
    page_end: brief.page_end,
    page_start: brief.page_start,
    plan_id: `plan_${(dependencies.randomUUID ?? randomUUID)()}`,
    plan_version: 1,
    source_hash: brief.source_hash,
    source_id: brief.source_id,
    status: 'proposed',
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => putRecord(database, PRISM_VAULT_LESSON_PLAN_STORE, plan),
    dependencies.environment,
  )
  notifyVaultChanged()
  return plan
}

export function getLessonBrief(
  briefId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonBrief | undefined> {
  return accessBrowserVault(
    (database) => getRecord<LessonBrief>(database, PRISM_VAULT_LESSON_BRIEF_STORE, briefId),
    environment,
  )
}

export function listLessonBriefs(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonBrief[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<LessonBrief>(
      database,
      PRISM_VAULT_LESSON_BRIEF_STORE,
      'source_id',
      sourceId,
      environment,
    ).then((briefs) => briefs.sort((left, right) => right.updated_at.localeCompare(left.updated_at))),
    environment,
  )
}

export function getLessonPlan(
  planId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonPlan | undefined> {
  return accessBrowserVault(
    (database) => getRecord<LessonPlan>(database, PRISM_VAULT_LESSON_PLAN_STORE, planId),
    environment,
  )
}

export function listLessonPlans(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonPlan[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<LessonPlan>(
      database,
      PRISM_VAULT_LESSON_PLAN_STORE,
      'source_id',
      sourceId,
      environment,
    ).then((plans) => plans.sort((left, right) => right.updated_at.localeCompare(left.updated_at))),
    environment,
  )
}

export async function approveLessonPlan(
  planId: string,
  expectedUpdatedAt: string,
  dependencies: LessonPlanDependencies = {},
): Promise<LessonPlan> {
  const plan = await getLessonPlan(planId, dependencies.environment)
  if (!plan) throw new Error('This lesson plan no longer exists.')
  if (plan.status === 'approved') return plan
  if (plan.updated_at !== expectedUpdatedAt) {
    throw new Error('This plan changed before approval. Review the current proposal first.')
  }
  const timestamp = (dependencies.now ?? currentTime)()
  const approved: LessonPlan = {
    ...plan,
    approval_hash: await planFingerprint(plan),
    approved_at: timestamp,
    status: 'approved',
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => approveRecord(database, planId, expectedUpdatedAt, approved),
    dependencies.environment,
  )
  notifyVaultChanged()
  return approved
}

export function validatePlanProposal(
  input: LessonPlanProposalInput,
  brief: LessonBrief,
  manifest: ScopeManifestItem[],
): Pick<LessonPlan, 'coverage' | 'end_questions' | 'estimated_minutes' | 'objectives' | 'sections' | 'title' | 'warnings'> {
  if (input.brief_id !== brief.brief_id) throw new Error('The plan does not match this lesson brief.')
  if (manifest.length === 0) throw new Error('The selected range has no indexed source elements.')
  if (!input.coverage_ranges?.length && manifest.length > MAX_SCOPE_ELEMENTS) {
    throw new Error(`This range has more than ${MAX_SCOPE_ELEMENTS} elements. Propose a narrower lesson range.`)
  }

  const objectives = normalizeObjectives(input.objectives)
  const objectiveIds = new Set(objectives.map((objective) => objective.objective_id))
  const coverage = normalizeCoverage(input.coverage, manifest)
  const usableElements = new Set(coverage
    .filter((entry) => !['omitted', 'deferred', 'source_only'].includes(entry.disposition))
    .map((entry) => entry.element_id))
  const sections = normalizeSections(input.sections, objectiveIds, usableElements)
  const endQuestions = normalizeQuestions(input.end_questions, objectiveIds, usableElements)
  const estimatedMinutes = sections.reduce((sum, section) => sum + section.estimated_minutes, 0)
  for (const objectiveId of objectiveIds) {
    if (!sections.some((section) => section.objective_ids.includes(objectiveId))) {
      throw new Error(`Objective ${objectiveId} is not taught by any section.`)
    }
    if (brief.include_questions === true && !endQuestions.some((question) => question.objective_ids.includes(objectiveId))) {
      throw new Error(`Objective ${objectiveId} is not checked by an end question.`)
    }
  }

  return {
    coverage,
    end_questions: endQuestions,
    estimated_minutes: estimatedMinutes,
    objectives,
    sections,
    title: requiredText(input.title, 'title', 140),
    warnings: [...uniqueText(input.warnings, 'warnings', 12, 240), ...(estimatedMinutes > brief.time_budget_minutes ? [`Estimated reading time is ${estimatedMinutes} minutes, above the soft ${brief.time_budget_minutes}-minute target to preserve necessary detail.`] : [])],
  }
}

async function selectedScopeManifest(input: LessonPlanProposalInput, brief: LessonBrief, environment?: BrowserVaultEnvironment): Promise<ScopeManifestItem[]> {
  const ranges = validateCoverageRanges(input.coverage_ranges ?? [], brief)
  if (!Array.isArray(input.coverage) || input.coverage.length > 512) throw new Error('Select at most 512 evidence anchors; retain the full source through range reviews.')
  const items: ScopeManifestItem[] = []
  for (let start = 0; start < input.coverage.length; start += 4) {
    const bundle = await readBrowserSourceBundle(brief.source_id, input.coverage.slice(start, start + 4).map((entry) => entry.element_id), 0, environment)
    if (!bundle.bundle_complete) throw new Error('Selected coverage contains missing source anchors.')
    for (const item of bundle.elements) {
      const page = item.anchor.pdf_page_index
      const range = ranges.find((candidate) => candidate.page_start <= page && candidate.page_end >= page)
      if (!range || ['omitted', 'deferred', 'source_only'].includes(range.disposition)) throw new Error('Selected evidence must belong to an included coverage range.')
      const review = brief.scope_reviews?.find((candidate) => candidate.page_start <= page && candidate.page_end >= page)
      items.push({ ...item, preview: item.text.slice(0, 240), status: item.status === 'source_only' && review?.visual_review === 'inspected' ? 'transform_with_warning' : item.status })
    }
  }
  const selected = new Set(items.map((item) => item.anchor.element_id))
  for (const review of brief.scope_reviews ?? []) {
    for (const id of review.essential_element_ids) {
      const page = Number(id.slice(`${brief.source_id}:page:`.length).split(':')[0])
      const included = ranges.some((range) => range.page_start <= page && range.page_end >= page && !['omitted', 'deferred', 'source_only'].includes(range.disposition))
      if (included && !selected.has(id)) throw new Error(`Essential evidence ${id} is absent from selected coverage. Preserve it or revise its review explicitly.`)
    }
  }
  return items
}

async function collectScopeManifest(
  brief: LessonBrief,
  environment?: BrowserVaultEnvironment,
): Promise<ScopeManifestItem[]> {
  const items: ScopeManifestItem[] = []
  let cursor = '0'
  for (;;) {
    const page = await getBrowserScopeManifest(
      brief.source_id,
      brief.page_start,
      brief.page_end,
      cursor,
      16,
      environment,
    )
    items.push(...page.items)
    if (items.length > MAX_SCOPE_ELEMENTS) {
      throw new Error(`This range has more than ${MAX_SCOPE_ELEMENTS} elements. Create a narrower brief.`)
    }
    if (!page.next_cursor) return items
    cursor = page.next_cursor
  }
}

function normalizeBriefInput(input: LessonBriefInput): LessonBriefInput {
  if (input.output_kind !== undefined && !['lesson', 'research_brief'].includes(input.output_kind)) throw new Error('output_kind must be lesson or research_brief.')
  if (input.include_questions !== undefined && typeof input.include_questions !== 'boolean') throw new Error('include_questions must be a boolean.')
  const pageStart = positiveInteger(input.page_start, 'page_start', 10_000)
  const pageEnd = positiveInteger(input.page_end, 'page_end', 10_000)
  if (pageEnd < pageStart) throw new Error('page_end must be on or after page_start.')
  const depth = input.intended_depth
  if (!['overview', 'standard', 'deep'].includes(depth)) {
    throw new Error('intended_depth must be overview, standard, or deep.')
  }
  return {
    output_kind: input.output_kind === 'research_brief' ? 'research_brief' : 'lesson',
    target_words: input.target_words == null ? null : positiveInteger(input.target_words, 'target_words', 100_000),
    include_questions: input.include_questions === true,
    assignment: requiredText(input.assignment, 'assignment', 600),
    intended_depth: depth,
    learner_goal: requiredText(input.learner_goal, 'learner_goal', 400),
    name: requiredText(input.name, 'name', 140),
    page_end: pageEnd,
    page_start: pageStart,
    prior_knowledge: uniqueText(input.prior_knowledge, 'prior_knowledge', 12, 180),
    source_id: requiredText(input.source_id, 'source_id', 180),
    time_budget_minutes: positiveInteger(input.time_budget_minutes, 'time_budget_minutes', 1440),
  }
}

function normalizeObjectives(input: LessonObjective[]): LessonObjective[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 12) {
    throw new Error('A plan requires 1 to 12 objectives.')
  }
  const objectives = input.map((objective) => ({
    description: requiredText(objective.description, 'objective description', 300),
    importance: objective.importance,
    objective_id: identifier(objective.objective_id, 'objective_id'),
  }))
  if (objectives.some((objective) => !['essential', 'supporting'].includes(objective.importance))) {
    throw new Error('Objective importance must be essential or supporting.')
  }
  assertUnique(objectives.map((objective) => objective.objective_id), 'objective_id')
  return objectives
}

function normalizeCoverage(
  input: LessonCoverageEntry[],
  manifest: ScopeManifestItem[],
): LessonCoverageEntry[] {
  if (!Array.isArray(input)) throw new Error('coverage must be an array.')
  const manifestById = new Map(manifest.map((item) => [item.anchor.element_id, item]))
  if (manifestById.has(null)) throw new Error('The scope manifest contains an unanchored element.')
  const coverage = input.map((entry) => ({
    disposition: entry.disposition,
    element_id: identifier(entry.element_id, 'coverage element_id'),
    reason: entry.reason === null ? null : optionalText(entry.reason, 'coverage reason', 280),
  }))
  assertUnique(coverage.map((entry) => entry.element_id), 'coverage element_id')
  if (coverage.length !== manifest.length) {
    throw new Error('Coverage must classify every manifest element exactly once.')
  }
  for (const entry of coverage) {
    const item = manifestById.get(entry.element_id)
    if (!item) throw new Error(`Coverage references unknown element ${entry.element_id}.`)
    if (!coverageDispositions.has(entry.disposition)) {
      throw new Error(`Coverage disposition for ${entry.element_id} is invalid.`)
    }
    if (['omitted', 'deferred'].includes(entry.disposition) && !entry.reason) {
      throw new Error(`${entry.disposition} element ${entry.element_id} requires a reason.`)
    }
    if (item.status === 'source_only' && entry.disposition !== 'source_only') {
      throw new Error(`Source-only element ${entry.element_id} cannot be transformed.`)
    }
  }
  return coverage
}

function normalizeSections(
  input: LessonSectionPlan[],
  objectiveIds: Set<string>,
  usableElements: Set<string>,
): LessonSectionPlan[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 16) {
    throw new Error('A plan requires 1 to 16 sections.')
  }
  const sections = input.map((section) => ({
    estimated_minutes: positiveInteger(section.estimated_minutes, 'section estimated_minutes', 120),
    objective_ids: uniqueIdentifiers(section.objective_ids, 'section objective_ids', 12),
    representation_intents: uniqueRepresentations(section.representation_intents),
    section_id: identifier(section.section_id, 'section_id'),
    source_element_ids: uniqueIdentifiers(section.source_element_ids, 'section source_element_ids', 64),
    title: requiredText(section.title, 'section title', 140),
  }))
  assertUnique(sections.map((section) => section.section_id), 'section_id')
  for (const section of sections) {
    if (section.objective_ids.length === 0) throw new Error(`${section.section_id} needs an objective.`)
    if (section.source_element_ids.length === 0) throw new Error(`${section.section_id} needs source evidence.`)
    for (const objectiveId of section.objective_ids) {
      if (!objectiveIds.has(objectiveId)) throw new Error(`${section.section_id} references unknown objective ${objectiveId}.`)
    }
    for (const elementId of section.source_element_ids) {
      if (!usableElements.has(elementId)) {
        throw new Error(`${section.section_id} cannot teach from omitted, deferred, source-only, or unknown element ${elementId}.`)
      }
    }
  }
  return sections
}

function normalizeQuestions(
  input: LessonEndQuestion[],
  objectiveIds: Set<string>,
  usableElements: Set<string>,
): LessonEndQuestion[] {
  if (!Array.isArray(input) || input.length > 6) {
    throw new Error('A lesson plan supports up to 6 optional end questions.')
  }
  const questions = input.map((question) => ({
    criteria: normalizeAnswerCriteria(question.criteria, usableElements),
    kind: question.kind,
    objective_ids: uniqueIdentifiers(question.objective_ids, 'question objective_ids', 12),
    prompt: requiredText(question.prompt, 'question prompt', 500),
    question_id: identifier(question.question_id, 'question_id'),
  }))
  assertUnique(questions.map((question) => question.question_id), 'question_id')
  assertUnique(
    questions.flatMap((question) => question.criteria.map((criterion) => criterion.criterion_id)),
    'criterion_id',
  )
  for (const question of questions) {
    if (!questionKinds.has(question.kind)) throw new Error(`${question.question_id} has an invalid kind.`)
    if (question.objective_ids.length === 0) throw new Error(`${question.question_id} needs an objective.`)
    for (const objectiveId of question.objective_ids) {
      if (!objectiveIds.has(objectiveId)) throw new Error(`${question.question_id} references unknown objective ${objectiveId}.`)
    }
  }
  return questions
}

function normalizeAnswerCriteria(
  input: LessonAnswerCriterion[],
  usableElements: Set<string>,
): LessonAnswerCriterion[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 8) {
    throw new Error('Each end question requires 1 to 8 source-grounded criteria.')
  }
  const criteria = input.map((criterion) => ({
    criterion_id: identifier(criterion.criterion_id, 'criterion_id'),
    description: requiredText(criterion.description, 'criterion description', 400),
    source_element_ids: uniqueIdentifiers(
      criterion.source_element_ids,
      'criterion source_element_ids',
      12,
    ),
  }))
  assertUnique(criteria.map((criterion) => criterion.criterion_id), 'criterion_id')
  for (const criterion of criteria) {
    if (criterion.source_element_ids.length === 0) {
      throw new Error(`${criterion.criterion_id} requires source evidence.`)
    }
    for (const elementId of criterion.source_element_ids) {
      if (!usableElements.has(elementId)) {
        throw new Error(
          `${criterion.criterion_id} cannot use omitted, deferred, source-only, or unknown evidence ${elementId}.`,
        )
      }
    }
  }
  return criteria
}

function uniqueRepresentations(input: RepresentationIntent[]): RepresentationIntent[] {
  if (!Array.isArray(input) || input.length > 8) throw new Error('representation_intents is invalid.')
  const values = [...new Set(input)]
  if (values.some((value) => !representationIntents.has(value))) {
    throw new Error('A section contains an unsupported representation intent.')
  }
  return values
}

function uniqueIdentifiers(input: string[], label: string, maximum: number): string[] {
  if (!Array.isArray(input) || input.length > maximum) throw new Error(`${label} is invalid.`)
  const values = input.map((value) => identifier(value, label))
  assertUnique(values, label)
  return values
}

function uniqueText(input: string[], label: string, maximum: number, maxLength: number): string[] {
  if (!Array.isArray(input) || input.length > maximum) throw new Error(`${label} is invalid.`)
  return [...new Set(input.map((value) => requiredText(value, label, maxLength)))]
}

function requiredText(value: string, label: string, maxLength: number): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`)
  const normalized = normalizedText(value)
  if (!normalized) throw new Error(`${label} is required.`)
  if (normalized.length > maxLength) throw new Error(`${label} exceeds ${maxLength} characters.`)
  return normalized
}

function optionalText(value: string, label: string, maxLength: number): string | null {
  if (typeof value !== 'string') throw new Error(`${label} must be text or null.`)
  const normalized = normalizedText(value)
  if (!normalized) return null
  if (normalized.length > maxLength) throw new Error(`${label} exceeds ${maxLength} characters.`)
  return normalized
}

function identifier(value: string, label: string): string {
  const normalized = requiredText(value, label, 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(normalized)) {
    throw new Error(`${label} contains unsupported characters.`)
  }
  return normalized
}

function positiveInteger(value: number, label: string, maximum: number): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer from 1 to ${maximum}.`)
  }
  return value
}

function normalizedText(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 ? ' ' : character
  }).join('').replace(/\s+/g, ' ').trim()
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} values must be unique.`)
}

function currentTime(): string {
  return new Date().toISOString()
}

function randomUUID(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure local identifiers are unavailable.')
  return globalThis.crypto.randomUUID()
}

async function planFingerprint(plan: LessonPlan): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Secure plan approval is unavailable in this browser.')
  const frozen = {
    brief_id: plan.brief_id,
    coverage: plan.coverage,
    ...(plan.coverage_ranges ? { coverage_ranges: plan.coverage_ranges, target_words: plan.target_words, output_kind: plan.output_kind } : {}),
    end_questions: plan.end_questions,
    objectives: plan.objectives,
    page_end: plan.page_end,
    page_start: plan.page_start,
    sections: plan.sections,
    source_hash: plan.source_hash,
    source_id: plan.source_id,
    title: plan.title,
    warnings: plan.warnings,
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(frozen)))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function notifyVaultChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
}

function getRecord<T>(database: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, 'readonly').objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The local lesson record could not be read.'))
  })
}

function putRecord(database: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite')
    transaction.objectStore(store).put(value)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('The local lesson record could not be saved.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('The local lesson save was interrupted.'))
  })
}

function approveRecord(
  database: IDBDatabase,
  planId: string,
  expectedUpdatedAt: string,
  approved: LessonPlan,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PRISM_VAULT_LESSON_PLAN_STORE, 'readwrite')
    const store = transaction.objectStore(PRISM_VAULT_LESSON_PLAN_STORE)
    const request = store.get(planId)
    let failure: Error | null = null
    request.onsuccess = () => {
      const current = request.result as LessonPlan | undefined
      if (!current || current.status !== 'proposed' || current.updated_at !== expectedUpdatedAt) {
        failure = new Error('This plan changed before approval. Review the current proposal first.')
        transaction.abort()
        return
      }
      store.put(approved)
    }
    request.onerror = () => {
      failure = request.error ?? new Error('The current lesson plan could not be read.')
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The lesson plan could not be approved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The lesson plan approval was interrupted.'),
    )
  })
}

function recordsByIndex<T>(
  database: IDBDatabase,
  store: string,
  indexName: string,
  key: IDBValidKey,
  environment?: BrowserVaultEnvironment,
): Promise<T[]> {
  const keyRange = environment?.keyRange
    ?? (typeof IDBKeyRange === 'undefined' ? undefined : IDBKeyRange)
  if (!keyRange) return Promise.reject(new Error('IndexedDB key ranges are unavailable.'))
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(store, 'readonly')
      .objectStore(store)
      .index(indexName)
      .getAll(keyRange.only(key))
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('Local lesson plans could not be listed.'))
  })
}

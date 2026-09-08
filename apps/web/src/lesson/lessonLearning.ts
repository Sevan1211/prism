import {
  accessBrowserVault,
  PRISM_VAULT_CHANGED_EVENT,
  PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
  PRISM_VAULT_LESSON_BRIEF_STORE,
  PRISM_VAULT_LESSON_OUTCOME_STORE,
  type BrowserVaultEnvironment,
} from '../storage/browserVault'
import { getLessonDocument } from './lessonDocuments'
import type {
  LessonAnswerAnalysis,
  LessonAnswerStatus,
  LessonCriterionAnalysis,
  LessonCriterionStatus,
  LessonEndCheck,
  LessonOutcomeAcceptance,
  LessonOutcomeProposal,
  LessonOutcomeRecommendation,
  LessonRepairDraft,
  ProposeLessonOutcomeInput,
  RecordLessonAnswerAnalysisInput,
} from './lessonLearningTypes'
import { getLessonPlan } from './lessonPlans'
import type { LessonAnswerCriterion, LessonBrief, LessonPlan } from './lessonPlanTypes'

const ANSWER_STATUSES = new Set<LessonAnswerStatus>([
  'demonstrated',
  'partially_demonstrated',
  'unclear',
  'contradicted',
  'not_attempted',
])
const CRITERION_STATUSES = new Set<LessonCriterionStatus>([
  'met', 'partially_met', 'unclear', 'not_met', 'not_attempted',
])
const OUTCOME_RECOMMENDATIONS = new Set<LessonOutcomeRecommendation>([
  'close', 'continue_discussion', 'repair',
])

interface LessonLearningDependencies {
  environment?: BrowserVaultEnvironment
  now?: () => string
  randomUUID?: () => string
}

export async function getLessonEndCheck(
  lessonId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonEndCheck> {
  const document = await getLessonDocument(requiredIdentifier(lessonId, 'lesson_id'), environment)
  if (!document) throw new Error('This lesson document no longer exists.')
  const analyses = latestAnalyses(
    (await listLessonAnswerAnalyses(document.lesson_id, environment))
      .filter((analysis) => analysis.document_version === document.document_version),
  )
  const missingCriteria = document.end_questions
    .filter((question) => !Array.isArray(question.criteria) || question.criteria.length === 0)
    .map((question) => question.question_id)
  return {
    analyses,
    document_version: document.document_version,
    lesson_id: document.lesson_id,
    questions: document.end_questions.map((question) => ({
      criteria: Array.isArray(question.criteria) ? question.criteria : [],
      kind: question.kind,
      objective_ids: question.objective_ids,
      prompt: question.prompt,
      question_id: question.question_id,
    })),
    ready: document.validation.valid_for_ready && missingCriteria.length === 0,
    validation_errors: [
      ...document.validation.errors.map((issue) => issue.message),
      ...missingCriteria.map((questionId) => (
        `Question ${questionId} predates source-grounded answer criteria and requires a new plan.`
      )),
    ],
  }
}

export async function recordLessonAnswerAnalysis(
  input: RecordLessonAnswerAnalysisInput,
  dependencies: LessonLearningDependencies = {},
): Promise<LessonAnswerAnalysis> {
  const lessonId = requiredIdentifier(input.lesson_id, 'lesson_id')
  const document = await getLessonDocument(lessonId, dependencies.environment)
  if (!document) throw new Error('This lesson document no longer exists.')
  assertCurrentReadyDocument(document.document_version, input.document_version, document.validation.valid_for_ready)
  const questionId = requiredIdentifier(input.question_id, 'question_id')
  const question = document.end_questions.find((candidate) => candidate.question_id === questionId)
  if (!question) throw new Error('The answer analysis references an unknown end question.')
  if (!Array.isArray(question.criteria) || question.criteria.length === 0) {
    throw new Error('This lesson predates source-grounded answer criteria. Create a new lesson plan.')
  }

  const status = requiredEnum(input.status, ANSWER_STATUSES, 'answer status')
  const criterionAnalyses = normalizeCriterionAnalyses(input.criterion_analyses, question.criteria)
  const learnerAnswer = nullableText(input.learner_answer, 'learner_answer', 8_000)
  assertAnalysisCoherence(status, criterionAnalyses, learnerAnswer)
  const strengths = uniqueText(input.strengths, 'strengths', 12, 500)
  const gaps = uniqueText(input.gaps, 'gaps', 12, 500)
  const uncertainty = nullableText(input.uncertainty, 'uncertainty', 800)
  if (status === 'demonstrated' && strengths.length === 0) {
    throw new Error('A demonstrated analysis must name at least one observed strength.')
  }
  if (['partially_demonstrated', 'contradicted'].includes(status) && gaps.length === 0) {
    throw new Error('A partial or contradicted analysis must name at least one gap.')
  }
  if (status === 'unclear' && !uncertainty) {
    throw new Error('An unclear analysis must explain its uncertainty.')
  }

  const prior = latestAnalyses(await listLessonAnswerAnalyses(lessonId, dependencies.environment))
    .find((analysis) => (
      analysis.document_version === document.document_version
      && analysis.question_id === questionId
    ))
  const analysis: LessonAnswerAnalysis = {
    agent_label: requiredText(input.agent_label, 'agent_label', 120),
    analysis_id: `analysis_${(dependencies.randomUUID ?? randomUUID)()}`,
    created_at: (dependencies.now ?? currentTime)(),
    criterion_analyses: criterionAnalyses,
    document_version: document.document_version,
    gaps,
    learner_answer: learnerAnswer,
    lesson_id: document.lesson_id,
    plan_id: document.plan_id,
    question_id: question.question_id,
    record_version: 1,
    source_id: document.source_id,
    status,
    strengths,
    supersedes_analysis_id: prior?.analysis_id ?? null,
    uncertainty,
  }
  await accessBrowserVault(
    (database) => addRecord(database, PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE, analysis),
    dependencies.environment,
  )
  notifyVaultChanged()
  return analysis
}

export async function proposeLessonOutcome(
  input: ProposeLessonOutcomeInput,
  dependencies: LessonLearningDependencies = {},
): Promise<LessonOutcomeProposal> {
  const lessonId = requiredIdentifier(input.lesson_id, 'lesson_id')
  const document = await getLessonDocument(lessonId, dependencies.environment)
  if (!document) throw new Error('This lesson document no longer exists.')
  assertCurrentReadyDocument(document.document_version, input.document_version, document.validation.valid_for_ready)
  const plan = await requiredPlan(document.plan_id, dependencies.environment)
  const analyses = latestAnalyses(
    (await listLessonAnswerAnalyses(lessonId, dependencies.environment))
      .filter((analysis) => analysis.document_version === document.document_version),
  )
  if (analyses.length === 0) {
    throw new Error('Analyze at least one learner response before proposing a lesson outcome.')
  }
  const recommendation = requiredEnum(
    input.recommendation,
    OUTCOME_RECOMMENDATIONS,
    'outcome recommendation',
  )
  const unresolved = uniqueIdentifiers(
    input.unresolved_criterion_ids,
    'unresolved_criterion_ids',
    48,
  )
  const actualUnresolved = unresolvedCriteria(analyses)
  if (!sameSet(unresolved, actualUnresolved)) {
    throw new Error('The outcome must disclose every unresolved criterion from the latest analyses.')
  }
  const analyzedQuestionIds = new Set(analyses.map((analysis) => analysis.question_id))
  const unansweredQuestionIds = document.end_questions
    .filter((question) => !analyzedQuestionIds.has(question.question_id))
    .map((question) => question.question_id)
  const repair = normalizeRepairDraft(input.repair, recommendation, plan, analyses, actualUnresolved)
  if (recommendation === 'close' && actualUnresolved.length > 0) {
    throw new Error('A lesson with unresolved analyzed criteria cannot be recommended for closure.')
  }
  if (recommendation === 'close' && unansweredQuestionIds.length > 0) {
    throw new Error(
      `A lesson cannot close until every end question is analyzed. Missing: ${unansweredQuestionIds.join(', ')}.`,
    )
  }
  if (recommendation !== 'repair' && repair !== null) {
    throw new Error('Only a repair recommendation may include a repair draft.')
  }

  const prior = await getLatestLessonOutcomeProposalForPlan(document.plan_id, dependencies.environment)
  const timestamp = (dependencies.now ?? currentTime)()
  const proposal: LessonOutcomeProposal = {
    accepted_at: null,
    analysis_ids: analyses.map((analysis) => analysis.analysis_id),
    child_brief_id: null,
    created_at: timestamp,
    document_version: document.document_version,
    lesson_id: document.lesson_id,
    plan_id: document.plan_id,
    proposal_id: `outcome_${(dependencies.randomUUID ?? randomUUID)()}`,
    rationale: requiredText(input.rationale, 'rationale', 1_200),
    recommendation,
    record_version: 1,
    repair,
    source_id: document.source_id,
    status: 'proposed',
    supersedes_proposal_id: prior?.proposal_id ?? null,
    unresolved_criterion_ids: unresolved,
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => addRecord(database, PRISM_VAULT_LESSON_OUTCOME_STORE, proposal),
    dependencies.environment,
  )
  notifyVaultChanged()
  return proposal
}

export function listLessonAnswerAnalyses(
  lessonId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonAnswerAnalysis[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<LessonAnswerAnalysis>(
      database,
      PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
      'lesson_id',
      lessonId,
    ).then((records) => records.sort(compareCreated)),
    environment,
  )
}

export function listLatestLessonAnswerAnalysesForPlan(
  planId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonAnswerAnalysis[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<LessonAnswerAnalysis>(
      database,
      PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
      'plan_id',
      planId,
    ).then((records) => latestAnalyses(records)),
    environment,
  )
}

export function getLatestLessonOutcomeProposalForPlan(
  planId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonOutcomeProposal | undefined> {
  return accessBrowserVault(
    (database) => recordsByIndex<LessonOutcomeProposal>(
      database,
      PRISM_VAULT_LESSON_OUTCOME_STORE,
      'plan_id',
      planId,
    ).then((records) => records.sort(compareUpdated).at(-1)),
    environment,
  )
}

export async function acceptLessonOutcomeProposal(
  proposalId: string,
  expectedUpdatedAt: string,
  dependencies: LessonLearningDependencies = {},
): Promise<LessonOutcomeAcceptance> {
  const proposal = await getOutcomeProposal(proposalId, dependencies.environment)
  if (!proposal) throw new Error('This lesson outcome proposal no longer exists.')
  if (proposal.status !== 'proposed') throw new Error('This lesson outcome was already resolved.')
  if (proposal.updated_at !== expectedUpdatedAt) {
    throw new Error('This lesson outcome changed before approval. Review it again.')
  }
  const plan = await requiredPlan(proposal.plan_id, dependencies.environment)
  const timestamp = (dependencies.now ?? currentTime)()
  const repairBrief = proposal.recommendation === 'repair'
    ? repairBriefFrom(proposal, plan, timestamp, dependencies.randomUUID ?? randomUUID)
    : null
  const accepted: LessonOutcomeProposal = {
    ...proposal,
    accepted_at: timestamp,
    child_brief_id: repairBrief?.brief_id ?? null,
    status: 'accepted',
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => resolveOutcomeProposal(
      database,
      proposal.proposal_id,
      expectedUpdatedAt,
      accepted,
      repairBrief,
    ),
    dependencies.environment,
  )
  notifyVaultChanged()
  return { proposal: accepted, repair_brief: repairBrief }
}

export async function dismissLessonOutcomeProposal(
  proposalId: string,
  expectedUpdatedAt: string,
  dependencies: LessonLearningDependencies = {},
): Promise<LessonOutcomeProposal> {
  const proposal = await getOutcomeProposal(proposalId, dependencies.environment)
  if (!proposal) throw new Error('This lesson outcome proposal no longer exists.')
  if (proposal.status !== 'proposed') throw new Error('This lesson outcome was already resolved.')
  if (proposal.updated_at !== expectedUpdatedAt) {
    throw new Error('This lesson outcome changed before dismissal. Review it again.')
  }
  const dismissed: LessonOutcomeProposal = {
    ...proposal,
    status: 'dismissed',
    updated_at: (dependencies.now ?? currentTime)(),
  }
  await accessBrowserVault(
    (database) => resolveOutcomeProposal(
      database,
      proposal.proposal_id,
      expectedUpdatedAt,
      dismissed,
      null,
    ),
    dependencies.environment,
  )
  notifyVaultChanged()
  return dismissed
}

function normalizeCriterionAnalyses(
  input: LessonCriterionAnalysis[],
  criteria: LessonAnswerCriterion[],
): LessonCriterionAnalysis[] {
  if (!Array.isArray(input) || input.length !== criteria.length) {
    throw new Error('The answer analysis must classify every question criterion exactly once.')
  }
  const criteriaById = new Map(criteria.map((criterion) => [criterion.criterion_id, criterion]))
  const analyses = input.map((candidate) => {
    const criterionId = requiredIdentifier(candidate.criterion_id, 'criterion_id')
    const criterion = criteriaById.get(criterionId)
    if (!criterion) throw new Error(`Unknown answer criterion ${criterionId}.`)
    const status = requiredEnum(candidate.status, CRITERION_STATUSES, 'criterion status')
    const evidence = uniqueIdentifiers(
      candidate.evidence_element_ids,
      'criterion evidence_element_ids',
      12,
    )
    const allowedEvidence = new Set(criterion.source_element_ids)
    if (evidence.some((elementId) => !allowedEvidence.has(elementId))) {
      throw new Error(`${criterionId} cites evidence outside its approved answer criterion.`)
    }
    if (['met', 'partially_met', 'not_met'].includes(status) && evidence.length === 0) {
      throw new Error(`${criterionId} requires source evidence for this judgment.`)
    }
    return {
      criterion_id: criterionId,
      evidence_element_ids: evidence,
      note: requiredText(candidate.note, 'criterion note', 800),
      status,
    }
  })
  assertUnique(analyses.map((analysis) => analysis.criterion_id), 'criterion_id')
  if (!sameSet(analyses.map((analysis) => analysis.criterion_id), [...criteriaById.keys()])) {
    throw new Error('The answer analysis must classify every question criterion exactly once.')
  }
  return analyses
}

function assertAnalysisCoherence(
  status: string,
  criteria: LessonCriterionAnalysis[],
  learnerAnswer: string | null,
): void {
  const criterionStatuses = criteria.map((criterion) => criterion.status)
  if (status === 'not_attempted') {
    if (learnerAnswer !== null || criterionStatuses.some((candidate) => candidate !== 'not_attempted')) {
      throw new Error('A not-attempted analysis requires no learner answer and all criteria marked not attempted.')
    }
    return
  }
  if (!learnerAnswer) throw new Error('A learner answer is required for this analysis status.')
  if (status === 'demonstrated' && criterionStatuses.some((candidate) => candidate !== 'met')) {
    throw new Error('Demonstrated requires every criterion to be met.')
  }
  if (status === 'contradicted' && !criterionStatuses.includes('not_met')) {
    throw new Error('Contradicted requires at least one criterion marked not met.')
  }
  if (status === 'partially_demonstrated') {
    const hasProgress = criterionStatuses.some((candidate) => ['met', 'partially_met'].includes(candidate))
    if (!hasProgress || criterionStatuses.every((candidate) => candidate === 'met')) {
      throw new Error('Partially demonstrated requires mixed or partially met criteria.')
    }
    if (criterionStatuses.includes('not_met')) {
      throw new Error('Use contradicted when an analyzed criterion is not met.')
    }
  }
  if (status === 'unclear' && !criterionStatuses.some((candidate) => candidate === 'unclear')) {
    throw new Error('Unclear requires at least one criterion marked unclear.')
  }
}

function normalizeRepairDraft(
  input: LessonRepairDraft | null,
  recommendation: string,
  plan: LessonPlan,
  analyses: LessonAnswerAnalysis[],
  unresolved: string[],
): LessonRepairDraft | null {
  if (recommendation !== 'repair') return input === null ? null : input
  if (!input || unresolved.length === 0) {
    throw new Error('A repair recommendation requires unresolved criteria and a named repair draft.')
  }
  const pageStart = positiveInteger(input.page_start, 'repair page_start', 10_000)
  const pageEnd = positiveInteger(input.page_end, 'repair page_end', 10_000)
  if (pageEnd < pageStart || pageStart < plan.page_start || pageEnd > plan.page_end) {
    throw new Error('Repair pages must remain inside the learner-approved parent range.')
  }
  const unresolvedEvidence = evidenceForCriteria(plan, analyses, unresolved)
  const sourceElementIds = uniqueIdentifiers(input.source_element_ids, 'repair source_element_ids', 48)
  if (sourceElementIds.length === 0 || sourceElementIds.some((id) => !unresolvedEvidence.has(id))) {
    throw new Error('Repair evidence must come from the unresolved source-grounded criteria.')
  }
  if (!['overview', 'standard', 'deep'].includes(input.intended_depth)) {
    throw new Error('Repair intended_depth must be overview, standard, or deep.')
  }
  return {
    assignment: requiredText(input.assignment, 'repair assignment', 600),
    intended_depth: input.intended_depth,
    learner_goal: requiredText(input.learner_goal, 'repair learner_goal', 400),
    name: requiredText(input.name, 'repair name', 140),
    page_end: pageEnd,
    page_start: pageStart,
    prior_knowledge: uniqueText(input.prior_knowledge, 'repair prior_knowledge', 12, 180),
    source_element_ids: sourceElementIds,
    time_budget_minutes: positiveInteger(input.time_budget_minutes, 'repair time_budget_minutes', 120),
  }
}

function evidenceForCriteria(
  plan: LessonPlan,
  analyses: LessonAnswerAnalysis[],
  criterionIds: string[],
): Set<string> {
  const unresolved = new Set(criterionIds)
  const questions = new Map(plan.end_questions.map((question) => [question.question_id, question]))
  const evidence = new Set<string>()
  for (const analysis of analyses) {
    const question = questions.get(analysis.question_id)
    for (const criterion of question?.criteria ?? []) {
      if (unresolved.has(criterion.criterion_id)) {
        criterion.source_element_ids.forEach((elementId) => evidence.add(elementId))
      }
    }
  }
  return evidence
}

function unresolvedCriteria(analyses: LessonAnswerAnalysis[]): string[] {
  return analyses.flatMap((analysis) => analysis.criterion_analyses
    .filter((criterion) => criterion.status !== 'met')
    .map((criterion) => criterion.criterion_id))
}

function latestAnalyses(records: LessonAnswerAnalysis[]): LessonAnswerAnalysis[] {
  const latest = new Map<string, LessonAnswerAnalysis>()
  for (const record of [...records].sort(compareCreated)) {
    latest.set(`${record.document_version}:${record.question_id}`, record)
  }
  return [...latest.values()].sort((left, right) => left.question_id.localeCompare(right.question_id))
}

function repairBriefFrom(
  proposal: LessonOutcomeProposal,
  plan: LessonPlan,
  timestamp: string,
  createId: () => string,
): LessonBrief {
  if (!proposal.repair) throw new Error('The repair proposal is missing its lesson brief.')
  return {
    assignment: proposal.repair.assignment,
    brief_id: `brief_${createId()}`,
    brief_kind: 'repair',
    created_at: timestamp,
    intended_depth: proposal.repair.intended_depth,
    learner_goal: proposal.repair.learner_goal,
    name: proposal.repair.name,
    page_end: proposal.repair.page_end,
    page_start: proposal.repair.page_start,
    parent_lesson_id: proposal.lesson_id,
    parent_plan_id: proposal.plan_id,
    prior_knowledge: proposal.repair.prior_knowledge,
    record_version: 1,
    repair_for_analysis_ids: proposal.analysis_ids,
    repair_for_criterion_ids: proposal.unresolved_criterion_ids,
    repair_source_element_ids: proposal.repair.source_element_ids,
    source_hash: plan.source_hash,
    source_id: proposal.source_id,
    time_budget_minutes: proposal.repair.time_budget_minutes,
    updated_at: timestamp,
  }
}

async function requiredPlan(
  planId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonPlan> {
  const plan = await getLessonPlan(planId, environment)
  if (!plan) throw new Error('The approved parent lesson plan no longer exists.')
  return plan
}

function getOutcomeProposal(
  proposalId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonOutcomeProposal | undefined> {
  return accessBrowserVault(
    (database) => getRecord<LessonOutcomeProposal>(
      database,
      PRISM_VAULT_LESSON_OUTCOME_STORE,
      requiredIdentifier(proposalId, 'proposal_id'),
    ),
    environment,
  )
}

function resolveOutcomeProposal(
  database: IDBDatabase,
  proposalId: string,
  expectedUpdatedAt: string,
  next: LessonOutcomeProposal,
  repairBrief: LessonBrief | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stores = repairBrief
      ? [PRISM_VAULT_LESSON_OUTCOME_STORE, PRISM_VAULT_LESSON_BRIEF_STORE]
      : [PRISM_VAULT_LESSON_OUTCOME_STORE]
    const transaction = database.transaction(stores, 'readwrite')
    const outcomeStore = transaction.objectStore(PRISM_VAULT_LESSON_OUTCOME_STORE)
    const request = outcomeStore.get(proposalId)
    let failure: Error | null = null
    request.onsuccess = () => {
      const current = request.result as LessonOutcomeProposal | undefined
      if (!current || current.status !== 'proposed' || current.updated_at !== expectedUpdatedAt) {
        failure = new Error('This lesson outcome changed before the learner decision was saved.')
        transaction.abort()
        return
      }
      outcomeStore.put(next)
      if (repairBrief) transaction.objectStore(PRISM_VAULT_LESSON_BRIEF_STORE).add(repairBrief)
    }
    request.onerror = () => {
      failure = request.error ?? new Error('The lesson outcome could not be read.')
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The lesson outcome could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The lesson outcome save was interrupted.'),
    )
  })
}

function recordsByIndex<T>(
  database: IDBDatabase,
  storeName: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).index(indexName).getAll(key)
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('The local lesson learning record could not be read.'))
  })
}

function getRecord<T>(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The local lesson learning record could not be read.'))
  })
}

function addRecord(database: IDBDatabase, storeName: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).add(value)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      transaction.error ?? new Error('The local lesson learning record could not be saved.'),
    )
    transaction.onabort = () => reject(
      transaction.error ?? new Error('The local lesson learning save was interrupted.'),
    )
  })
}

function assertCurrentReadyDocument(current: number, expected: number, ready: boolean): void {
  if (!Number.isInteger(expected) || expected !== current) {
    throw new Error('This lesson changed before the learning record was written. Read the current version first.')
  }
  if (!ready) throw new Error('The lesson must pass current readiness validation before its end check opens.')
}

function requiredEnum<T extends string>(value: unknown, allowed: ReadonlySet<T>, label: string): T {
  if (typeof value !== 'string' || !allowed.has(value as T)) throw new Error(`${label} is invalid.`)
  return value as T
}

function uniqueIdentifiers(value: unknown, label: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${label} is invalid.`)
  const identifiers = value.map((item) => requiredIdentifier(item, label))
  assertUnique(identifiers, label)
  return identifiers
}

function uniqueText(value: unknown, label: string, maximum: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${label} is invalid.`)
  return [...new Set(value.map((item) => requiredText(item, label, maxLength)))]
}

function requiredIdentifier(value: unknown, label: string): string {
  const normalized = requiredText(value, label, 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(normalized)) {
    throw new Error(`${label} contains unsupported characters.`)
  }
  return normalized
}

function requiredText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`)
  const normalized = normalizeText(value)
  if (!normalized) throw new Error(`${label} is required.`)
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`)
  return normalized
}

function nullableText(value: unknown, label: string, maximum: number): string | null {
  if (value === null || value === undefined || value === '') return null
  return requiredText(value, label, maximum)
}

function normalizeText(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 && character !== '\n' && character !== '\t' || code === 127 ? ' ' : character
  }).join('').replace(/\s+/g, ' ').trim()
}

function positiveInteger(value: unknown, label: string, maximum: number): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new Error(`${label} must be an integer from 1 to ${maximum}.`)
  }
  return Number(value)
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} values must be unique.`)
}

function sameSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}

function compareCreated(left: { created_at: string }, right: { created_at: string }): number {
  return left.created_at.localeCompare(right.created_at)
}

function compareUpdated(left: { updated_at: string }, right: { updated_at: string }): number {
  return left.updated_at.localeCompare(right.updated_at)
}

function currentTime(): string {
  return new Date().toISOString()
}

function randomUUID(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure local identifiers are unavailable.')
  return globalThis.crypto.randomUUID()
}

function notifyVaultChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
}

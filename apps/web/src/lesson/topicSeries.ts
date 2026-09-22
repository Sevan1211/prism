import { accessBrowserVault, PRISM_VAULT_TOPIC_SERIES_STORE as SERIES, PRISM_VAULT_LESSON_PLAN_STORE as PLANS, PRISM_VAULT_FOLDER_STORE as FOLDERS, PRISM_VAULT_CHANGED_EVENT, type BrowserVaultEnvironment } from '../storage/browserVault'
import { requestValue, transactionDone } from '../storage/syncDatabase'
import { getBrowserSourceMap, readBrowserSourceBundle } from '../storage/browserSources'
import type { LessonPlan } from './lessonPlanTypes'
import type { TopicSeries, TopicLessonProposal, TopicReference } from './topicTypes'

const text = (value: unknown, name: string, max = 2000): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${name} must contain 1–${max} characters.`)
  return value.trim()
}
const list = <T>(value: T[], name: string, min = 0, max = 40): T[] => {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`${name} needs ${min}–${max} entries.`)
  return value
}
const texts = (value: string[], name: string) => list(value, name).map(item => text(item, name))
const identifier = (value: string) => { if (!/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new Error('Use short, unique alphanumeric identifiers.'); return value }
function unique(ids: string[]) { ids.forEach(identifier); if (new Set(ids).size !== ids.length) throw new Error('Identifiers must be unique.') }
function changed() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT)) }

export async function listTopicSeries(environment?: BrowserVaultEnvironment): Promise<TopicSeries[]> {
  return accessBrowserVault(db => requestValue<TopicSeries[]>(db.transaction(SERIES).objectStore(SERIES).getAll()), environment)
}
export async function getTopicSeries(id: string, environment?: BrowserVaultEnvironment): Promise<TopicSeries> {
  const series = await accessBrowserVault(db => requestValue<TopicSeries | undefined>(db.transaction(SERIES).objectStore(SERIES).get(id)), environment)
  if (!series) throw new Error('This lesson series no longer exists.')
  return series
}
export async function createTopicSeries(input: Pick<TopicSeries, 'title' | 'request' | 'folder_id' | 'research_mode' | 'source_role' | 'source_ids'>, environment?: BrowserVaultEnvironment): Promise<TopicSeries> {
  if (!['knowledge_research', 'knowledge_only', 'selected_sources'].includes(input.research_mode)) throw new Error('Choose a research mode.')
  if (!['follow', 'support'].includes(input.source_role)) throw new Error('Choose how sources should be used.')
  const sourceIds = texts(input.source_ids, 'Selected sources')
  if (input.research_mode === 'selected_sources' && !sourceIds.length) throw new Error('Select at least one source for Selected sources only.')
  if (input.research_mode === 'knowledge_only' && sourceIds.length) throw new Error('Knowledge only cannot include selected sources. Choose another research mode.')
  for (const id of sourceIds) await getBrowserSourceMap(id, environment)
  const now = new Date().toISOString()
  const series: TopicSeries = { ...input, title: text(input.title, 'Title', 160), request: text(input.request, 'Learning request', 6000), source_ids: [...new Set(sourceIds)], id: `series_${crypto.randomUUID()}`, status: 'clarifying', version: 1, clarifications: [], plan_ids: [], assumptions: [], exclusions: [], created_at: now, updated_at: now }
  await accessBrowserVault(async db => {
    const tx = db.transaction([SERIES, FOLDERS], 'readwrite'), done = transactionDone(tx)
    if (series.folder_id && !await requestValue(tx.objectStore(FOLDERS).get(series.folder_id))) { await done; throw new Error('Choose an existing folder.') }
    tx.objectStore(SERIES).add(series); await done
  }, environment)
  changed(); return series
}

export async function proposeTopicSeries(input: { series_id: string; expected_version: number; clarifications: TopicSeries['clarifications']; assumptions: string[]; exclusions: string[]; lessons: TopicLessonProposal[] }, environment?: BrowserVaultEnvironment): Promise<TopicSeries> {
  const series = await getTopicSeries(input.series_id, environment)
  if (series.version !== input.expected_version) throw new Error('Series changed. Read its current version before retrying.')
  if (series.status === 'approved') throw new Error('This series is approved. Create a new request for a material scope change; use lesson revisions for content improvements.')
  const clarifications = list(input.clarifications, 'Answered clarification questions', 1, 12).map(item => ({ question: text(item.question, 'Clarifying question'), answer: text(item.answer, 'Learner answer') }))
  const lessons = list(input.lessons, 'Lessons', 1, 24)
  const plans: LessonPlan[] = []
  for (const lesson of lessons) {
    const objectives = list(lesson.objectives, 'Objectives', 1, 24).map(item => ({ objective_id: identifier(item.objective_id), description: text(item.description, 'Objective'), importance: item.importance }))
    unique(objectives.map(item => item.objective_id))
    if (objectives.some(item => !['essential', 'supporting'].includes(item.importance))) throw new Error('Invalid objective importance.')
    const sections = list(lesson.sections, 'Sections', 1, 24).map(item => {
      if (!Number.isFinite(item.estimated_minutes) || item.estimated_minutes < 1 || item.estimated_minutes > 600) throw new Error('Section time must be between 1 and 600 minutes.')
      const objectiveIds = texts(item.objective_ids, 'Section objectives')
      if (!objectiveIds.length || objectiveIds.some(id => !objectives.some(objective => objective.objective_id === id))) throw new Error('Each section needs existing objectives.')
      if (item.source_element_ids?.length) throw new Error('Topic sections use references; leave source_element_ids empty.')
      const intents = list(item.representation_intents, 'Representations')
      if (intents.some(intent => !['visual_scene', 'data_plot', 'generated_diagram', 'equation', 'code', 'table', 'animation', 'worked_example', 'analogy'].includes(intent))) throw new Error('Unsupported topic representation. Attach PDF evidence as a reference.')
      return { ...item, section_id: identifier(item.section_id), title: text(item.title, 'Section title', 240), objective_ids: objectiveIds, source_element_ids: [] }
    })
    unique(sections.map(item => item.section_id))
    if (objectives.some(item => !sections.some(section => section.objective_ids.includes(item.objective_id)))) throw new Error('Every objective must be taught in a planned section.')
    const references = await normalizeReferences(lesson.references, series, environment)
    const questions = list(lesson.end_questions, 'Optional practice', 0, 12).map(question => {
      identifier(question.question_id)
      text(question.prompt, 'Practice prompt', 4000)
      if (!['explanation', 'application', 'prediction', 'comparison', 'trace', 'diagnosis', 'interpretation'].includes(question.kind)) throw new Error('Invalid practice kind.')
      if (!question.objective_ids.length || question.objective_ids.some(id => !objectives.some(item => item.objective_id === id))) throw new Error('Practice must relate to a planned objective.')
      list(question.criteria, 'Practice criteria', 1, 12).forEach(criterion => { identifier(criterion.criterion_id); text(criterion.description, 'Criterion'); if (criterion.source_element_ids.length) throw new Error('Topic practice criteria use objectives, not PDF anchors.') })
      unique(question.criteria.map(criterion => criterion.criterion_id))
      return question
    })
    unique(questions.map(question => question.question_id))
    const now = new Date().toISOString()
    plans.push({ plan_id: `plan_${crypto.randomUUID()}`, brief_id: series.id, source_id: '', source_hash: '', page_start: 0, page_end: 0, plan_version: 1, status: 'proposed', approval_hash: null, approved_at: null, title: text(lesson.title, 'Lesson title', 240), created_at: now, updated_at: now, objectives, sections, end_questions: questions, coverage: [], estimated_minutes: sections.reduce((sum, section) => sum + section.estimated_minutes, 0), warnings: series.research_mode === 'knowledge_only' ? ['Agent knowledge has not been independently checked against references.'] : [], topic: { series_id: series.id, research_mode: series.research_mode, references, prerequisites: texts(lesson.prerequisites, 'Prerequisites'), exclusions: texts(lesson.exclusions, 'Excluded topics') } })
  }
  if (series.source_role === 'follow' && series.source_ids.some(id => !plans.some(plan => plan.topic?.references.some(reference => reference.source_id === id)))) throw new Error('Every source selected for required coverage must be represented in the plan.')
  const next: TopicSeries = { ...series, status: 'proposed', version: series.version + 1, clarifications, assumptions: texts(input.assumptions, 'Assumptions'), exclusions: texts(input.exclusions, 'Exclusions'), plan_ids: plans.map(plan => plan.plan_id), updated_at: new Date().toISOString() }
  if (JSON.stringify({ clarifications: next.clarifications, assumptions: next.assumptions, exclusions: next.exclusions }).length > 14000) throw new Error('Keep the clarification and scope summary under 14,000 characters; detailed teaching belongs in lessons.')
  await saveSeries(next, series.version, plans, series.plan_ids, environment)
  changed(); return next
}

async function normalizeReferences(input: TopicReference[], series: TopicSeries, environment?: BrowserVaultEnvironment) {
  const references = list(input, 'References', 0, 40)
  if (series.research_mode !== 'knowledge_only' && !references.length) throw new Error('This research mode requires at least one inspected reference per lesson. If research is unavailable, ask the learner to change the request to Knowledge only.')
  unique(references.map(reference => reference.id))
  if (series.research_mode === 'knowledge_only' && references.length) throw new Error('Knowledge-only lessons cannot claim researched references.')
  for (const reference of references) {
    text(reference.title, 'Reference title', 240); text(reference.locator, 'Referenced section', 600); text(reference.support, 'What this reference supports', 2000)
    if (reference.kind === 'web') {
      if (series.research_mode === 'selected_sources') throw new Error('Selected sources only does not allow web references.')
      const url = new URL(reference.url ?? '')
      if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 4000) throw new Error('Web references require a public HTTPS URL without credentials.')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(reference.accessed_at ?? '') || !Number.isFinite(Date.parse(reference.accessed_at!))) throw new Error('Record when the agent actually inspected this web reference (YYYY-MM-DD).')
    } else if (reference.kind === 'source') {
      if (!reference.source_id || !series.source_ids.includes(reference.source_id)) throw new Error('Reference a source explicitly selected for this request.')
      const map = await getBrowserSourceMap(reference.source_id, environment)
      const ids = list(reference.element_ids ?? [], 'Reference anchors', 1, 12)
      const evidence = await readBrowserSourceBundle(reference.source_id, ids, 0, environment)
      if (ids.some(id => !evidence.elements.some(item => item.anchor.element_id === id))) throw new Error('Reference anchors do not exist in the selected source.')
      reference.source_hash = map.content_hash
    } else throw new Error('Choose a web or uploaded source reference.')
  }
  return structuredClone(references)
}

// Learner-only operation. Never registered as an agent tool.
export async function approveTopicSeries(id: string, expectedVersion: number, environment?: BrowserVaultEnvironment): Promise<TopicSeries> {
  const series = await getTopicSeries(id, environment)
  if (series.status !== 'proposed' || series.version !== expectedVersion) throw new Error('The proposal changed. Review the current plan before approving.')
  const plans = await accessBrowserVault(db => Promise.all(series.plan_ids.map(id => requestValue<LessonPlan>(db.transaction(PLANS).objectStore(PLANS).get(id)))), environment)
  if (plans.some(plan => !plan || plan.status !== 'proposed' || plan.topic?.series_id !== id)) throw new Error('The complete proposed series is unavailable.')
  const now = new Date().toISOString()
  for (const plan of plans) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ series, plan })))
    plan.approval_hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    plan.status = 'approved'; plan.approved_at = now; plan.updated_at = now
  }
  const next = { ...series, status: 'approved' as const, version: series.version + 1, updated_at: now }
  await saveSeries(next, expectedVersion, plans, [], environment)
  changed(); return next
}

async function saveSeries(series: TopicSeries, expected: number, plans: LessonPlan[], removed: string[], environment?: BrowserVaultEnvironment) {
  await accessBrowserVault(async db => {
    const tx = db.transaction([SERIES, PLANS], 'readwrite'), done = transactionDone(tx)
    const current = await requestValue<TopicSeries>(tx.objectStore(SERIES).get(series.id))
    if (current?.version !== expected) { await done; throw new Error('Series changed while saving. Read it again.') }
    removed.forEach(id => tx.objectStore(PLANS).delete(id))
    plans.forEach(plan => tx.objectStore(PLANS).put(plan))
    tx.objectStore(SERIES).put(series); await done
  }, environment)
}

/** Learner request settings only; this never edits lesson prose or approves content. */
export async function updateTopicRequest(id: string, expected: number, input: Pick<TopicSeries, 'title' | 'request' | 'research_mode' | 'source_role' | 'source_ids'>, environment?: BrowserVaultEnvironment) {
  const series = await getTopicSeries(id, environment)
  if (series.status === 'approved') throw new Error('The approved scope is frozen. Start a new request for a different scope.')
  if (!['knowledge_research', 'knowledge_only', 'selected_sources'].includes(input.research_mode) || !['follow', 'support'].includes(input.source_role)) throw new Error('Choose valid research settings.')
  const ids = texts(input.source_ids, 'Selected sources')
  if (input.research_mode === 'selected_sources' && !ids.length || input.research_mode === 'knowledge_only' && ids.length) throw new Error('The selected sources do not match this research mode.')
  for (const source of ids) await getBrowserSourceMap(source, environment)
  const next: TopicSeries = { ...series, ...input, title: text(input.title, 'Title', 160), request: text(input.request, 'Request', 6000), status: 'clarifying', plan_ids: [], clarifications: [], assumptions: [], exclusions: [], version: expected + 1, updated_at: new Date().toISOString() }
  await saveSeries(next, expected, [], series.plan_ids, environment)
  changed(); return next
}

export async function moveTopicSeries(id: string, folderId: string | null, expected: number, environment?: BrowserVaultEnvironment) {
  await accessBrowserVault(async db => {
    const tx = db.transaction([SERIES, FOLDERS], 'readwrite'), done = transactionDone(tx)
    const series = await requestValue<TopicSeries>(tx.objectStore(SERIES).get(id))
    const folder = folderId ? await requestValue(tx.objectStore(FOLDERS).get(folderId)) : true
    if (!series || series.version !== expected || !folder) { await done; throw new Error('The series or folder changed. Refresh and try again.') }
    tx.objectStore(SERIES).put({ ...series, folder_id: folderId, version: expected + 1, updated_at: new Date().toISOString() }); await done
  }, environment)
  changed()
}

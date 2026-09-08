import { getLessonBrief, getLessonPlan, listLessonBriefs, listLessonPlans } from '../lesson/lessonPlans'
import { getLessonDocumentByPlan } from '../lesson/lessonDocuments'
import { coverageReviewProgress } from '../lesson/lessonCoverageReview'
import type { LessonBrief, LessonPlan } from '../lesson/lessonPlanTypes'
import type { LessonDocument } from '../lesson/lessonDocumentTypes'
import { loadLibrarySources } from '../library/sourceLibrary'
import { isSupportedEvidenceVersion } from '../storage/sourceIndexTypes'
import { AGENT_ACCESS_REFUSAL, agentContentAllowed } from './context'
import { paginateToolItems, requireOneSelector } from './toolPagination'
import { withCurrentSourceAccess } from './sourceAccess'

type NextCall = { tool: string; arguments: Record<string, unknown> }

export async function readAuthoringWorkspace(args: Record<string, unknown>) {
  const view = args.view ?? 'resume'
  if (!['resume', 'discovery', 'brief', 'plan', 'reviews'].includes(String(view))) throw new Error('Choose resume, discovery, brief, plan or reviews.')
  if (view === 'resume') {
    if (args.cursor !== undefined || args.limit !== undefined || args.part !== undefined || args.kind !== undefined || args.source_id !== undefined) throw new Error('Resume takes a brief_id or plan_id, optional section_id and review_cursor. Use discovery for source_id.')
    return getAuthoringWorkspace(args)
  }
  if (args.review_cursor !== undefined) throw new Error('Use next_call and cursor for focused views; review_cursor is only for resume.')
  if (view === 'discovery') {
    requireOneSelector(args, ['source_id', 'brief_id', 'plan_id'])
    if (!args.source_id || args.section_id !== undefined || args.part !== undefined) throw new Error('Discovery requires source_id and optional kind, cursor and limit.')
    const kind = args.kind ?? 'briefs'
    if (kind !== 'briefs' && kind !== 'plans') throw new Error('Choose briefs or plans for discovery kind.')
    const source = (await loadLibrarySources()).find(item => item.id === args.source_id)
    if (!source || !agentContentAllowed(source)) throw new Error(AGENT_ACCESS_REFUSAL)
    const items = kind === 'briefs'
      ? (await listLessonBriefs(source.id)).map(brief => ({ brief_id: brief.brief_id, name: brief.name, learner_goal: brief.learner_goal, page_start: brief.page_start, page_end: brief.page_end, updated_at: brief.updated_at, source_version_matches: brief.source_hash === source.content_hash, next_call: { tool: 'get_authoring_workspace', arguments: { brief_id: brief.brief_id } } }))
      : (await listLessonPlans(source.id)).map(plan => ({ plan_id: plan.plan_id, brief_id: plan.brief_id, title: plan.title, status: plan.status, page_start: plan.page_start, page_end: plan.page_end, updated_at: plan.updated_at, source_version_matches: plan.source_hash === source.content_hash, next_call: { tool: 'get_authoring_workspace', arguments: { plan_id: plan.plan_id } } }))
    items.sort((a, b) => ('brief_id' in a ? String(a.brief_id) : '').localeCompare('brief_id' in b ? String(b.brief_id) : '') || ('plan_id' in a ? String(a.plan_id) : '').localeCompare('plan_id' in b ? String(b.plan_id) : ''))
    return withCurrentSourceAccess(source, { view, kind, source_id: source.id, ...paginateToolItems<unknown>(items, 'get_authoring_workspace', { ...args, view, kind }, 24_000) })
  }
  if (args.kind !== undefined || args.source_id !== undefined) throw new Error('kind and source_id belong to discovery; choose a saved brief_id or plan_id.')
  const { source, brief, plan } = await resolveWorkspace(args)
  const { scope_reviews: reviews = [], ...goal } = brief
  if (view === 'brief') {
    if (args.cursor !== undefined || args.limit !== undefined || args.section_id !== undefined || args.part !== undefined) throw new Error('The brief view takes only brief_id or plan_id.')
    return withCurrentSourceAccess(source, { view, brief: goal, scope_review_count: reviews.length, next_call: { tool: 'get_authoring_workspace', arguments: { view: 'reviews', brief_id: brief.brief_id } } })
  }
  if (view === 'reviews') {
    if (args.section_id !== undefined || args.part !== undefined) throw new Error('The reviews view takes a saved ID, cursor and limit.')
    const ordered = [...reviews].sort((a, b) => a.page_start - b.page_start)
    let first = brief.page_start
    for (const review of ordered) { if (review.page_start > first) break; first = Math.max(first, review.page_end + 1) }
    return withCurrentSourceAccess(source, { view, source_id: brief.source_id, brief_id: brief.brief_id, pages_requested: brief.page_end - brief.page_start + 1, pages_reviewed: reviews.reduce((n, review) => n + review.page_end - review.page_start + 1, 0), first_unreviewed_page: first <= brief.page_end ? first : null,
      ...paginateToolItems(ordered, 'get_authoring_workspace', { ...args, view }, 24_000) })
  }
  if (!plan) throw new Error('The plan view requires plan_id; discover saved plans with view: discovery, kind: plans and source_id.')
  const part = args.part ?? 'sections'
  if (!['sections', 'coverage', 'ranges', 'objectives', 'questions'].includes(String(part))) throw new Error('Choose sections, coverage, ranges, objectives or questions.')
  if (args.section_id !== undefined && part !== 'sections') throw new Error('section_id is only valid for the sections part.')
  const { sections, coverage, coverage_ranges = [], objectives, end_questions, ...metadata } = plan
  if (args.section_id !== undefined && !sections.some(section => section.section_id === args.section_id)) throw new Error('Section not found in this plan.')
  const items = part === 'sections' ? sections.filter(section => !args.section_id || section.section_id === args.section_id)
    : part === 'coverage' ? coverage : part === 'ranges' ? coverage_ranges : part === 'objectives' ? objectives : end_questions
  return withCurrentSourceAccess(source, { view, part, plan: metadata, counts: { sections: sections.length, coverage: coverage.length, ranges: coverage_ranges.length, objectives: objectives.length, questions: end_questions.length },
    ...paginateToolItems<unknown>(items, 'get_authoring_workspace', { ...args, view, part }, 24_000) })
}

async function resolveWorkspace(args: Record<string, unknown>) {
  if (typeof args.plan_id !== 'string' && typeof args.brief_id !== 'string') throw new Error('Provide a saved brief_id or plan_id.')
  for (const key of ['brief_id', 'plan_id']) if (args[key] !== undefined && (typeof args[key] !== 'string' || !String(args[key]).trim())) throw new Error(`${key} must be a nonempty string.`)
  const plan = typeof args.plan_id === 'string' ? await getLessonPlan(args.plan_id) : undefined
  if (typeof args.plan_id === 'string' && !plan) throw new Error('Lesson plan not found.')
  if (plan && args.brief_id !== undefined && args.brief_id !== plan.brief_id) throw new Error('The plan does not belong to this brief.')
  const brief = await getLessonBrief(plan?.brief_id ?? String(args.brief_id))
  if (!brief) throw new Error('Lesson brief not found.')
  const source = (await loadLibrarySources()).find(item => item.id === brief.source_id)
  if (!source || !agentContentAllowed(source)) throw new Error(AGENT_ACCESS_REFUSAL)
  if (source.content_hash !== brief.source_hash || (plan && (plan.source_hash !== brief.source_hash || plan.source_id !== brief.source_id))) throw new Error('The saved work does not match this source version.')
  return { source, brief, plan }
}

/** Read-only join of saved authoring state. No inferred source or plan selection. */
export async function getAuthoringWorkspace(args: Record<string, unknown>) {
  const { source, brief, plan } = await resolveWorkspace(args)
  const document = plan ? await getLessonDocumentByPlan(plan.plan_id) : undefined
  const state = buildAuthoringWorkspace(brief, plan, document, args)
  const ready = source.browser_index?.state === 'ready' && isSupportedEvidenceVersion(source.browser_index.parser_version)
  return withCurrentSourceAccess(source, {
    ...state,
    source: { source_id: source.id, pages: source.page_count, indexing: source.browser_index, content_allowed: true },
    ...(ready ? {} : { stage: 'indexing', next_calls: [{ tool: 'list_sources', arguments: {} }], instruction: 'Wait for or resume source indexing. Saved review notes remain available, but missing or stale evidence cannot support composition.' }),
  })
}

export function buildAuthoringWorkspace(brief: LessonBrief, plan: LessonPlan | undefined, document: LessonDocument | undefined, args: Record<string, unknown> = {}) {
  const reviews = brief.scope_reviews ?? []
  if (args.section_id !== undefined && (typeof args.section_id !== 'string' || !plan?.sections.some(section => section.section_id === args.section_id))) throw new Error('Section not found in this plan.')
  // A sorted interval walk is bounded by checkpoints, not the length of a textbook.
  const gaps: Array<{ page_start: number; page_end: number }> = []
  let next = brief.page_start
  for (const review of [...reviews].sort((a, b) => a.page_start - b.page_start)) {
    if (review.page_start > next) gaps.push({ page_start: next, page_end: review.page_start - 1 })
    next = Math.max(next, review.page_end + 1)
  }
  if (next <= brief.page_end) gaps.push({ page_start: next, page_end: brief.page_end })
  const selected = plan?.sections.find(section => section.section_id === args.section_id)
    ?? plan?.sections.find(section => !document?.sections.find(saved => saved.section_id === section.section_id)?.blocks.length)
    ?? plan?.sections[0]
  const saved = document?.sections.find(section => section.section_id === selected?.section_id)
  const relatedReviewCursors = reviews.flatMap((review, index) => review.essential_element_ids.some(id => selected?.source_element_ids.includes(id)) ? [index] : [])
  const cursor = args.review_cursor ?? relatedReviewCursors[0] ?? 0
  if (!Number.isSafeInteger(cursor) || Number(cursor) < 0 || Number(cursor) > reviews.length) throw new Error('Invalid review cursor.')
  const base = plan ? { plan_id: plan.plan_id } : { brief_id: brief.brief_id }
  const nextCalls: NextCall[] = []
  let stage = 'source_review'
  if (plan?.status === 'proposed') {
    stage = 'awaiting_approval'
    nextCalls.push({ tool: 'open_lesson', arguments: { plan_id: plan.plan_id } })
  } else if (plan?.status === 'approved') {
    stage = document?.status === 'ready' ? 'ready' : 'composition'
    if (saved?.blocks.length) nextCalls.push({ tool: 'get_lesson_document', arguments: { plan_id: plan.plan_id, section_id: selected?.section_id, include_content: true } })
    if (document && document.status !== 'ready' && plan.sections.every(section => document.sections.some(saved => saved.section_id === section.section_id && saved.blocks.length > 0))) stage = 'content_review'
  } else if (gaps.length) {
    nextCalls.push({ tool: 'read_source_packet', arguments: { source_id: brief.source_id, ...gaps[0], format: 'compact' } })
  } else {
    stage = 'planning'
  }
  const unresolved = reviews.filter(review => review.visual_review === 'unresolved').map(({ page_start, page_end }) => ({ page_start, page_end }))
  const { scope_reviews: _reviews, ...goal } = brief
  void _reviews
  return {
    stage, brief: goal,
    review_progress: { gaps: gaps.slice(0, 16), gap_count: gaps.length, unresolved_visual_ranges: unresolved.slice(0, 16), unresolved_range_count: unresolved.length, checkpoint_count: reviews.length },
    checkpoint: reviews[Number(cursor)] ?? null,
    review_cursor: Number(cursor), related_review_cursors: relatedReviewCursors.slice(0, 16), related_review_count: relatedReviewCursors.length,
    next_review_call: Number(cursor) + 1 < reviews.length ? { tool: 'get_authoring_workspace', arguments: { ...base, ...(args.section_id ? { section_id: args.section_id } : {}), review_cursor: Number(cursor) + 1 } } : null,
    plan: plan ? { plan_id: plan.plan_id, status: plan.status, title: plan.title, details_call: { tool: 'get_authoring_workspace', arguments: { view: 'plan', plan_id: plan.plan_id } } } : null,
    draft: document ? { lesson_id: document.lesson_id, status: document.status, expected_version: document.document_version, review_progress: coverageReviewProgress(document, plan), sections: document.sections.map(section => ({ section_id: section.section_id, title: section.title, block_count: section.blocks.length })) } : null,
    selected_section: selected ? { section_id: selected.section_id, title: selected.title, evidence_count: selected.source_element_ids.length, block_count: saved?.blocks.length ?? 0, last_block_id: saved?.blocks.at(-1)?.block_id ?? null, details_call: { tool: 'get_authoring_workspace', arguments: { view: 'plan', plan_id: plan!.plan_id, section_id: selected.section_id } } } : null,
    validation: document ? { error_count: document.validation.errors.length, errors: document.validation.errors.slice(0, 12), remaining_errors: Math.max(0, document.validation.errors.length - 12) } : null,
    next_calls: nextCalls,
    instruction: stage === 'awaiting_approval' ? 'Only the learner approves. Do not compose yet.'
      : stage === 'composition' ? 'Reuse inspected evidence and checkpoints. Save a coherent section with apply_lesson_patch, expected_version from draft (null if absent), and a unique request_id. Existing blocks are saved work, not proof the section is complete.'
        : stage === 'ready' ? 'For a learner-requested change, read only the relevant section and evidence, then propose a revision for review.'
          : stage === 'content_review' ? 'Inspect the rendered lesson and verify claims, numbers, qualifications, intermediate reasoning and omissions against evidence. Resolve validation errors before finalize_lesson. Nonempty sections do not establish completeness.'
            : stage === 'planning' ? 'Review checkpoints and unresolved visuals; propose_lesson_plan must account for the entire requested scope. Open the plan for learner approval.'
              : 'Read each remaining evidence gap once; inspect relevant visuals and save review checkpoints. Checkpoints are agent interpretations, not independent fidelity checks.',
  }
}

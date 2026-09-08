import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAuthoringWorkspace, getAuthoringWorkspace, readAuthoringWorkspace } from './authoringWorkspace'
import { getLessonBrief, getLessonPlan, listLessonBriefs, listLessonPlans } from '../lesson/lessonPlans'
import { getLessonDocumentByPlan } from '../lesson/lessonDocuments'
import { loadLibrarySources } from '../library/sourceLibrary'
import type { LessonBrief, LessonPlan, ScopeReview } from '../lesson/lessonPlanTypes'
import type { LessonDocument } from '../lesson/lessonDocumentTypes'

vi.mock('../lesson/lessonPlans', () => ({ getLessonBrief: vi.fn(), getLessonPlan: vi.fn(), listLessonBriefs: vi.fn(), listLessonPlans: vi.fn() }))
vi.mock('../lesson/lessonDocuments', () => ({ getLessonDocumentByPlan: vi.fn() }))
vi.mock('../library/sourceLibrary', () => ({ loadLibrarySources: vi.fn() }))

const review = (start: number, end: number): ScopeReview => ({ page_start: start, page_end: end, summary: 'Reviewed qualifications and definitions.', essential_element_ids: [], visual_review: 'not_needed', visual_notes: 'Linear text inspected.', updated_at: '2026-09-04' })
const brief = { brief_id: 'brief', source_id: 'source', source_hash: 'hash', page_start: 1, page_end: 24, learner_goal: 'Understand the uploaded source.', scope_reviews: [review(9, 16)] } as LessonBrief
const plan = { plan_id: 'plan', brief_id: 'brief', source_id: 'source', source_hash: 'hash', status: 'approved', sections: [{ section_id: 'one', title: 'Foundations', source_element_ids: ['e1'] }, { section_id: 'two', title: 'Application', source_element_ids: ['e2'] }] } as LessonPlan
const document = { lesson_id: 'lesson', plan_id: 'plan', document_version: 4, status: 'draft', sections: [{ section_id: 'one', blocks: [{ block_id: 'saved' }] }, { section_id: 'two', blocks: [] }], validation: { errors: [], warnings: [] } } as unknown as LessonDocument

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getLessonBrief).mockResolvedValue(brief)
  vi.mocked(getLessonPlan).mockResolvedValue(plan)
  vi.mocked(getLessonDocumentByPlan).mockResolvedValue(document)
  vi.mocked(loadLibrarySources).mockResolvedValue([{ id: 'source', content_hash: 'hash', rights_status: 'open_license', storage_location: 'browser_vault', browser_index: { state: 'ready', parser_version: 'pdfjs-evidence-v7' } }] as Awaited<ReturnType<typeof loadLibrarySources>>)
})

describe('authoring continuation', () => {
  it('refuses disclosure when source access is revoked during a saved-work read', async () => {
    const source = (await loadLibrarySources())[0]
    vi.mocked(loadLibrarySources).mockResolvedValueOnce(source ? [source] : []).mockResolvedValue([])
    await expect(readAuthoringWorkspace({ plan_id: 'plan' })).rejects.toThrow('agent_access_not_granted')
  })
  it('discovers many saved assignments without choosing one or exceeding the transport budget', async () => {
    const briefs = Array.from({ length: 180 }, (_, id) => ({ ...brief, brief_id: `brief-${String(id).padStart(3, '0')}`, learner_goal: 'goal '.repeat(70) }))
    vi.mocked(listLessonBriefs).mockResolvedValue(briefs)
    vi.mocked(listLessonPlans).mockResolvedValue([{ ...plan, updated_at: 'today' }])
    let args: Record<string, unknown> = { view: 'discovery', source_id: 'source', limit: 40 }
    const recovered: unknown[] = []
    for (;;) {
      const result = await readAuthoringWorkspace(args)
      expect('items' in result).toBe(true)
      if (!('items' in result)) throw new Error('Missing discovery items')
      expect(JSON.stringify(result).length).toBeLessThan(26_000)
      recovered.push(...result.items)
      if (!result.next_call) break
      args = result.next_call.arguments
    }
    expect(recovered).toHaveLength(180)
    expect(getLessonBrief).not.toHaveBeenCalled()
    expect(await readAuthoringWorkspace({ view: 'discovery', source_id: 'source', kind: 'plans' })).toMatchObject({ items: [{ plan_id: 'plan', status: 'approved' }] })
  })
  it('paginates complete plan evidence separately from plan metadata', async () => {
    const coverage = Array.from({ length: 120 }, (_, id) => ({ element_id: `e${id}`, disposition: 'core' as const, reason: 'Preserve the reasoning' }))
    vi.mocked(getLessonPlan).mockResolvedValue({ ...plan, coverage, objectives: [], coverage_ranges: [], end_questions: [] })
    const result = await readAuthoringWorkspace({ view: 'plan', plan_id: 'plan', part: 'coverage', limit: 40 })
    expect(result).toMatchObject({ part: 'coverage', total: 120, items: coverage.slice(0, 40), plan: { status: 'approved' } })
    if (!('next_call' in result) || !result.next_call) throw new Error('Missing continuation')
    expect(await readAuthoringWorkspace(result.next_call.arguments)).toMatchObject({ items: coverage.slice(40, 80) })
    expect(await readAuthoringWorkspace({ view: 'plan', plan_id: 'plan', section_id: 'one' })).toMatchObject({ items: [{ source_element_ids: ['e1'] }] })
    await expect(readAuthoringWorkspace({ view: 'plan', plan_id: 'plan', part: 'coverage', section_id: 'one' })).rejects.toThrow('section_id')
  })
  it('returns bounded reviews and rejects a changed checkpoint cursor', async () => {
    const reviews = Array.from({ length: 12 }, (_, id) => ({ ...review(id * 8 + 1, id * 8 + 8), summary: 'review '.repeat(800) }))
    vi.mocked(getLessonBrief).mockResolvedValue({ ...brief, page_end: 100, scope_reviews: reviews })
    const result = await readAuthoringWorkspace({ view: 'reviews', brief_id: 'brief' })
    expect(result).toMatchObject({ pages_reviewed: 96, pages_requested: 100, first_unreviewed_page: 97 })
    if (!('next_call' in result) || !result.next_call) throw new Error('Missing continuation')
    expect(JSON.stringify(result).length).toBeLessThan(26_000)
    vi.mocked(getLessonBrief).mockResolvedValue({ ...brief, page_end: 100, scope_reviews: reviews.slice(1) })
    await expect(readAuthoringWorkspace(result.next_call.arguments)).rejects.toThrow('changed')
  })
  it('rejects conflicting and wrong-view selectors before reading content', async () => {
    for (const args of [{ view: 'discovery', source_id: 'source', brief_id: 'brief' }, { view: 'resume', source_id: 'source' }, { view: 'plan', brief_id: 'brief' }, { view: 'brief', brief_id: 'brief', plan_id: 'plan', cursor: '0' }, { view: 'reviews', brief_id: 'brief', review_cursor: 0 }, { view: 'unknown' }]) await expect(readAuthoringWorkspace(args)).rejects.toThrow()
    vi.mocked(loadLibrarySources).mockResolvedValue([{ id: 'source', rights_status: 'private_authorized' }] as Awaited<ReturnType<typeof loadLibrarySources>>)
    for (const view of ['discovery', 'brief', 'plan', 'reviews']) await expect(readAuthoringWorkspace(view === 'discovery' ? { view, source_id: 'source' } : { view, plan_id: 'plan' })).rejects.toThrow('agent_access_not_granted')
  })
  it('does not advise composition while an index is incomplete or unsupported', async () => {
    for (const index of [{ state: 'indexing', parser_version: 'pdfjs-evidence-v7' }, { state: 'ready', parser_version: 'unknown' }]) {
      vi.mocked(loadLibrarySources).mockResolvedValue([{ id: 'source', content_hash: 'hash', rights_status: 'open_license', browser_index: index }] as Awaited<ReturnType<typeof loadLibrarySources>>)
      const state = await getAuthoringWorkspace({ plan_id: 'plan' })
      expect(state.stage).toBe('indexing')
      expect(state.next_calls.map(call => call.tool)).toEqual(['list_sources'])
    }
  })
  it('returns disjoint unread gaps without re-reading a saved checkpoint', () => {
    const state = buildAuthoringWorkspace(brief, undefined, undefined)
    expect(state.review_progress.gaps).toEqual([{ page_start: 1, page_end: 8 }, { page_start: 17, page_end: 24 }])
    expect(state.next_calls[0]).toEqual({ tool: 'read_source_packet', arguments: { source_id: 'source', page_start: 1, page_end: 8, format: 'compact' } })
    expect(state.checkpoint).toEqual(brief.scope_reviews![0])
    expect(state.brief).not.toHaveProperty('scope_reviews')
  })
  it('resumes the next empty section with the exact version and honors an explicit partial section', async () => {
    const state = await getAuthoringWorkspace({ plan_id: 'plan' })
    expect(state.selected_section?.section_id).toBe('two')
    expect(state.draft?.expected_version).toBe(4)
    const partial = buildAuthoringWorkspace(brief, plan, document, { section_id: 'one' })
    expect(partial.selected_section?.last_block_id).toBe('saved')
    expect(partial.next_calls[0]).toMatchObject({ tool: 'get_lesson_document', arguments: { section_id: 'one', include_content: true } })
  })
  it('never treats a proposed plan or nonempty draft as approval or verified completion', () => {
    const pending = buildAuthoringWorkspace(brief, { ...plan, status: 'proposed' }, undefined)
    expect(pending.stage).toBe('awaiting_approval')
    expect(pending.next_calls.map(call => call.tool)).toEqual(['open_lesson'])
    const full = buildAuthoringWorkspace(brief, plan, { ...document, sections: [document.sections[0], { ...document.sections[1], blocks: document.sections[0].blocks }] })
    expect(full.instruction).toContain('Nonempty sections do not establish completeness')
    const ready = buildAuthoringWorkspace(brief, plan, { ...document, status: 'ready' })
    expect(ready.stage).toBe('ready')
    expect(ready.instruction).toContain('revision')
  })
  it('requires explicit identity, current source permission and matching source versions', async () => {
    await expect(getAuthoringWorkspace({})).rejects.toThrow('Provide')
    await expect(getAuthoringWorkspace({ plan_id: 'plan', brief_id: 'other' })).rejects.toThrow('belong')
    vi.mocked(loadLibrarySources).mockResolvedValue([])
    await expect(getAuthoringWorkspace({ plan_id: 'plan' })).rejects.toThrow('agent_access_not_granted')
    expect(getLessonDocumentByPlan).not.toHaveBeenCalled()
    vi.mocked(loadLibrarySources).mockResolvedValue([{ id: 'source', rights_status: 'private_authorized', storage_location: 'browser_vault', content_hash: 'hash' }] as Awaited<ReturnType<typeof loadLibrarySources>>)
    await expect(getAuthoringWorkspace({ plan_id: 'plan' })).rejects.toThrow('agent_access_not_granted')
    vi.mocked(loadLibrarySources).mockResolvedValue([{ id: 'source', rights_status: 'open_license', content_hash: 'different' }] as Awaited<ReturnType<typeof loadLibrarySources>>)
    await expect(getAuthoringWorkspace({ plan_id: 'plan' })).rejects.toThrow('source version')
  })
  it('bounds checkpoints, validates selectors and preserves unresolved visual ranges', () => {
    const current = { ...brief, scope_reviews: [review(1, 8), { ...review(9, 16), visual_review: 'unresolved' as const }] }
    const state = buildAuthoringWorkspace(current, undefined, undefined)
    expect(state.next_review_call?.arguments).toEqual({ brief_id: 'brief', review_cursor: 1 })
    expect(state.review_progress.unresolved_visual_ranges).toEqual([{ page_start: 9, page_end: 16 }])
    expect(() => buildAuthoringWorkspace(brief, plan, document, { section_id: 'missing' })).toThrow('Section')
    expect(() => buildAuthoringWorkspace(brief, plan, document, { review_cursor: -1 })).toThrow('cursor')
    const related = buildAuthoringWorkspace({ ...brief, scope_reviews: [review(1, 8), { ...review(9, 16), essential_element_ids: ['e2'] }] }, plan, document)
    expect(related.review_cursor).toBe(1)
    expect(related.checkpoint?.page_start).toBe(9)
  })
})

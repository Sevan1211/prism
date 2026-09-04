import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { listSources, sourcePdfUrl } from './api'
import {
  approveLessonPlan,
  createLessonBrief,
  getLessonBrief,
  listLessonBriefs,
  listLessonPlans,
  proposeLessonPlan,
} from './lesson/lessonPlans'
import type { LessonBrief, LessonPlan } from './lesson/lessonPlanTypes'
import { sourcePath } from './navigation'
import {
  getBrowserReadingState,
  importBrowserSource,
  listBrowserSources,
} from './storage/browserSources'
import { installFakeModelContext } from './test/fakeModelContext'
import type { SourceSummary } from './types'

vi.mock('./api', () => ({
  listSources: vi.fn(),
  readingState: vi.fn(async (sourceId: string) => ({
    furthest_page: 1,
    last_page: 1,
    last_scroll_ratio: 0,
    source_id: sourceId,
    updated_at: null,
  })),
  searchSource: vi.fn(),
  sourceCoverUrl: vi.fn((sourceId: string) => `/covers/${sourceId}.webp`),
  sourcePdfUrl: vi.fn((sourceId: string) => `/source/${sourceId}`),
  sourceReadiness: vi.fn(async (sourceId: string) => ({
    capability_notes: [],
    latest_job: null,
    parser_current: true,
    phase: 'ready',
    recommended_range: null,
    selected_range: null,
    source_id: sourceId,
    source_only_body_pages: 0,
    source_status: 'structure_ready',
    trusted_body_pages: 1,
  })),
  sourceStructure: vi.fn(async (sourceId: string) => ({
    source_id: sourceId,
    origin: 'none',
    sections: [],
  })),
  updateReadingState: vi.fn(),
}))

vi.mock('./storage/browserSources', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storage/browserSources')>()
  return {
    ...actual,
    createBrowserSourceObjectUrl: vi.fn(),
    deleteBrowserSource: vi.fn(),
    getBrowserReadingState: vi.fn(),
    getBrowserScopeManifest: vi.fn(),
    getBrowserSourceMap: vi.fn(),
    importBrowserSource: vi.fn(),
    indexBrowserSource: vi.fn(),
    listBrowserSources: vi.fn(),
    readBrowserSourceBundle: vi.fn(),
    searchBrowserSource: vi.fn(),
    setBrowserAgentContentAccess: vi.fn(),
    updateBrowserReadingState: vi.fn(),
  }
})

vi.mock('./lesson/lessonPlans', () => ({
  approveLessonPlan: vi.fn(),
  createLessonBrief: vi.fn(),
  getLessonBrief: vi.fn(),
  getLessonPlan: vi.fn(),
  listLessonBriefs: vi.fn(),
  listLessonPlans: vi.fn(),
  proposeLessonPlan: vi.fn(),
}))

vi.mock('./lesson/lessonDocuments', () => ({
  applyLessonPatch: vi.fn(),
  getLessonDocument: vi.fn(),
  getLessonDocumentByPlan: vi.fn(async () => undefined),
  validateLesson: vi.fn(),
}))

vi.mock('./lesson/lessonLearning', () => ({
  acceptLessonOutcomeProposal: vi.fn(),
  dismissLessonOutcomeProposal: vi.fn(),
  getLatestLessonOutcomeProposalForPlan: vi.fn(async () => undefined),
  getLessonEndCheck: vi.fn(),
  listLatestLessonAnswerAnalysesForPlan: vi.fn(async () => []),
  proposeLessonOutcome: vi.fn(),
  recordLessonAnswerAnalysis: vi.fn(),
}))

vi.mock('./BrowserVaultStatus', () => ({
  BrowserVaultStatus: () => <section aria-label="Browser vault status">Browser vault healthy</section>,
}))

vi.mock('./Reader', () => ({
  Reader: ({ source }: { source: SourceSummary }) => <div>Reader · {source.original_name}</div>,
}))

const companionSource: SourceSummary = {
  cloud_policy: 'local_only',
  content_hash: 'source-hash',
  created_at: '2026-08-29T00:00:00Z',
  id: 'src_networks',
  original_name: 'computer-networks.pdf',
  page_count: 489,
  rights_status: 'private_authorized',
  size_bytes: 2048,
  status: 'structure_ready',
}

describe('PRISM source workspace', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PRISM_API_URL', 'http://127.0.0.1:8000')
    window.history.replaceState({}, '', '/sources')
    vi.mocked(listSources).mockResolvedValue([companionSource])
    vi.mocked(listBrowserSources).mockResolvedValue([])
    vi.mocked(listLessonBriefs).mockResolvedValue([])
    vi.mocked(listLessonPlans).mockResolvedValue([])
    vi.mocked(getBrowserReadingState).mockImplementation(async (sourceId) => ({
      furthest_page: 1,
      last_page: 1,
      last_scroll_ratio: 0,
      source_id: sourceId,
      updated_at: null,
    }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('opens into the routed source library and then the selected source workspace', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Sources' })).toBeVisible()
    expect(window.location.pathname).toBe('/sources')
    fireEvent.click(screen.getAllByRole('link', { name: /computer networks/i })[0])
    expect(screen.getByRole('heading', { name: /computer networks/i })).toBeVisible()
    expect(window.location.pathname).toBe('/sources/src_networks')
    expect(screen.getByText('Work from the source, then reconstruct it.')).toBeVisible()
    expect(screen.getByText('Reading mode')).toBeVisible()
    expect(screen.queryByText('Prepare a stream')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enter semantic stream' })).not.toBeInTheDocument()
  })

  it('opens the original in the full Reader from the source workspace', async () => {
    render(<App />)

    fireEvent.click((await screen.findAllByRole('link', { name: /computer networks/i }))[0])
    fireEvent.click(screen.getAllByRole('link', { name: /open reader/i })[0])

    expect(await screen.findByText('Reader · computer-networks.pdf')).toBeVisible()
    expect(window.location.pathname).toBe('/sources/src_networks/reader')
    expect(sourcePdfUrl).toHaveBeenCalledWith(companionSource.id)
  })

  it('registers only the current source and planning tools and fails private planning closed', async () => {
    const fake = installFakeModelContext()
    try {
      render(<App />)
      await screen.findByRole('heading', { name: 'Sources' })

      expect([...fake.tools.keys()].sort()).toEqual([
        'apply_lesson_patch',
        'close_source_visual',
        'create_lesson_brief',
        'finalize_lesson',
        'get_active_lesson_context',
        'get_authoring_guide',
        'get_lesson_brief',
        'get_lesson_document',
        'get_lesson_end_check',
        'get_lesson_plan',
        'get_scope_manifest',
        'get_scope_reviews',
        'get_source_map',
        'import_generated_illustration',
        'import_public_pdf',
        'list_sources',
        'open_lesson',
        'open_source_location',
        'open_source_visual',
        'prepare_source_import',
        'propose_lesson_outcome',
        'propose_lesson_plan',
        'propose_lesson_revision',
        'read_source_bundle',
        'read_source_packet',
        'read_source_page',
        'record_answer_analysis',
        'record_scope_review',
        'search_source',
        'validate_lesson',
      ])
      expect(fake.tools.has('prepare_stream')).toBe(false)
      expect(fake.tools.has('get_player_state')).toBe(false)

      let refusal: unknown
      await act(async () => {
        refusal = await fake.execute('create_lesson_brief', {
          source_id: companionSource.id,
          name: 'Private assignment',
        })
      })
      expect(refusal).toMatchObject({ error: expect.stringContaining('agent_access_not_granted') })
      expect(createLessonBrief).not.toHaveBeenCalled()
    } finally {
      fake.uninstall()
    }
  })

  it('lets WebMCP prepare the visible local import without accepting a file path', async () => {
    const fake = installFakeModelContext()
    try {
      render(<App />)
      await screen.findByRole('heading', { name: 'Sources' })

      let result: unknown
      await act(async () => {
        result = await fake.execute('prepare_source_import', {
          rights_status: 'private_authorized',
        })
      })

      expect(result).toMatchObject({
        import_completed: false,
        visible_state: 'import_dialog_open_waiting_for_learner_file_selection',
      })
      expect(screen.getByRole('heading', { name: 'Add a source' })).toBeVisible()
      expect(screen.getByRole('combobox')).toHaveValue('private_authorized')
      expect(fake.tools.get('prepare_source_import')?.inputSchema).not.toHaveProperty(
        'properties.file_path',
      )
    } finally {
      fake.uninstall()
    }
  })

  it('lets an external agent reopen a learner-saved local assignment brief', async () => {
    const fake = installFakeModelContext()
    const localSource = browserSource()
    const brief = briefFixture(localSource.id)
    vi.mocked(listSources).mockResolvedValue([])
    vi.mocked(listBrowserSources).mockResolvedValue([localSource])
    vi.mocked(getLessonBrief).mockResolvedValue(brief)
    try {
      render(<App />)
      await screen.findByRole('heading', { name: 'Sources' })

      let result: unknown
      await act(async () => {
        result = await fake.execute('get_lesson_brief', { brief_id: brief.brief_id })
      })

      expect(result).toMatchObject({ briefs: [brief] })
      expect(fake.tools.get('get_lesson_brief')?.annotations?.readOnlyHint).toBe(true)
    } finally {
      fake.uninstall()
    }
  })

  it('saves a learner-defined assignment from the visible Lessons route', async () => {
    const localSource = browserSource()
    const brief = briefFixture(localSource.id)
    vi.mocked(listSources).mockResolvedValue([])
    vi.mocked(listBrowserSources).mockResolvedValue([localSource])
    vi.mocked(createLessonBrief).mockResolvedValue(brief)
    window.history.replaceState({}, '', sourcePath(localSource.id, 'lessons'))

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'New lesson' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Lesson name' }), {
      target: { value: 'Week one systems foundations' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'What should your agent create?' }), { target: { value: 'Explain the source in detail.' } })
    fireEvent.click(screen.getByText('Customize depth, length and prior knowledge'))
    fireEvent.change(screen.getByRole('textbox', { name: 'What should you be able to do afterward? Optional' }), { target: { value: 'Apply the ideas to a new problem.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save lesson request' }))

    await waitFor(() => expect(createLessonBrief).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Week one systems foundations',
      page_end: 2,
      page_start: 1,
      source_id: localSource.id,
    })))
  })

  it('shows source-owned lesson plans and keeps approval in the visible UI', async () => {
    const localSource = browserSource()
    const brief = briefFixture(localSource.id)
    const proposed = planFixture(localSource.id, brief.brief_id)
    const approved: LessonPlan = {
      ...proposed,
      approval_hash: 'a'.repeat(64),
      approved_at: '2026-08-30T12:10:00.000Z',
      status: 'approved',
      updated_at: '2026-08-30T12:10:00.000Z',
    }
    vi.mocked(listSources).mockResolvedValue([])
    vi.mocked(listBrowserSources).mockResolvedValue([localSource])
    vi.mocked(listLessonPlans).mockResolvedValue([proposed])
    vi.mocked(approveLessonPlan).mockResolvedValue(approved)
    vi.mocked(getLessonBrief).mockResolvedValue(brief)
    vi.mocked(proposeLessonPlan).mockResolvedValue(proposed)

    render(<App />)
    fireEvent.click((await screen.findAllByRole('link', { name: /open course/i }))[0])
    fireEvent.click(screen.getByRole('link', { name: 'Lessons' }))

    expect(await screen.findByText('Foundations reconstructed')).toBeVisible()
    expect(window.location.pathname).toMatch(/\/lessons$/)
    fireEvent.click(screen.getByRole('link', { name: /Foundations reconstructed/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve plan & authorize composition' }))
    expect(await screen.findByText(/The approved structure is ready/)).toBeVisible()
    fireEvent.click(screen.getByText('Plan, coverage & scope'))
    expect(screen.getByText(/Approved locally/)).toBeVisible()
    expect(approveLessonPlan).toHaveBeenCalledWith(proposed.plan_id, proposed.updated_at)
  })

  it('exposes the routed lesson plan as compact active agent context', async () => {
    const fake = installFakeModelContext()
    const localSource = browserSource()
    const brief = briefFixture(localSource.id)
    const proposed = planFixture(localSource.id, brief.brief_id)
    vi.mocked(listSources).mockResolvedValue([])
    vi.mocked(listBrowserSources).mockResolvedValue([localSource])
    vi.mocked(listLessonBriefs).mockResolvedValue([brief])
    vi.mocked(listLessonPlans).mockResolvedValue([proposed])
    window.history.replaceState({}, '', sourcePath(localSource.id, 'lessons', proposed.plan_id))
    try {
      render(<App />)
      expect(await screen.findByText('Foundations reconstructed')).toBeVisible()

      let context: unknown
      await act(async () => {
        context = await fake.execute('get_active_lesson_context')
      })

      expect(context).toMatchObject({
        active_lesson: null,
        active_plan: { plan_id: proposed.plan_id, status: 'proposed' },
        active_surface: 'lessons',
        plan_selection: 'url',
        source_id: localSource.id,
      })
    } finally {
      fake.uninstall()
    }
  })

  it('imports through the browser-local source dialog instead of a hosted upload path', async () => {
    const imported = browserSource()
    vi.mocked(importBrowserSource).mockResolvedValue(imported)
    vi.mocked(listBrowserSources)
      .mockResolvedValueOnce([])
      .mockResolvedValue([imported])

    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add a source' }))
    await waitFor(() => expect(screen.getByLabelText('Choose a PDF')).toHaveFocus())
    expect(document.querySelector('.workspace-body')).toHaveAttribute('inert')
    const file = new File(['%PDF-fixture'], 'course.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Close import').closest('section')?.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add to library' }))

    await waitFor(() => expect(importBrowserSource).toHaveBeenCalledWith(file, 'private_authorized'))
    expect(await screen.findByRole('heading', { name: /open course/i })).toBeVisible()
    expect(window.location.pathname).toContain(imported.id)
  })

  it('starts empty and makes source import the primary action', async () => {
    vi.mocked(listSources).mockResolvedValue([])
    vi.mocked(listBrowserSources).mockResolvedValue([])
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Choose your PDF' })).toBeVisible()
    expect(screen.queryByRole('button', { name: /Explore a complete lesson/ })).not.toBeInTheDocument()
  })

  it('restores source pages through browser history', async () => {
    render(<App />)
    fireEvent.click((await screen.findAllByRole('link', { name: /computer networks/i }))[0])
    expect(await screen.findByRole('heading', { name: /computer networks/i })).toBeVisible()

    await act(async () => {
      window.history.back()
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })

    expect(await screen.findByRole('heading', { name: 'Sources' })).toBeVisible()
    expect(window.location.pathname).toBe('/sources')
  })
})

function browserSource() {
  return {
    ...companionSource,
    browser_index: {
      error: null,
      pages_indexed: 2,
      parser_version: 'pdfjs-evidence-v2',
      state: 'ready' as const,
      total_pages: 2,
    },
    id: `local_${'c'.repeat(64)}`,
    original_name: 'open-course.pdf',
    page_count: 2,
    rights_status: 'open_license' as const,
    storage_location: 'browser_vault' as const,
  }
}

function briefFixture(sourceId: string): LessonBrief {
  return {
    assignment: 'Read the assigned section.',
    brief_id: 'brief-course',
    created_at: '2026-08-30T12:00:00.000Z',
    intended_depth: 'standard',
    learner_goal: 'Explain and apply the central mechanism.',
    name: 'Week one · Foundations',
    page_end: 2,
    page_start: 1,
    prior_knowledge: ['Basic terminology'],
    record_version: 1,
    source_hash: 'source-hash',
    source_id: sourceId,
    time_budget_minutes: 25,
    updated_at: '2026-08-30T12:00:00.000Z',
  }
}

function planFixture(sourceId: string, briefId: string): LessonPlan {
  return {
    approval_hash: null,
    approved_at: null,
    brief_id: briefId,
    coverage: [
      { disposition: 'core', element_id: 'element-1', reason: null },
      { disposition: 'omitted', element_id: 'element-2', reason: 'Appendix detail outside the goal.' },
    ],
    created_at: '2026-08-30T12:05:00.000Z',
    end_questions: [
      { criteria: [{ criterion_id: 'criterion-1', description: 'Explains the relation.', source_element_ids: ['element-1'] }], kind: 'explanation', objective_ids: ['objective-1'], prompt: 'Explain it.', question_id: 'question-1' },
      { criteria: [{ criterion_id: 'criterion-2', description: 'Applies the relation.', source_element_ids: ['element-1'] }], kind: 'application', objective_ids: ['objective-1'], prompt: 'Apply it.', question_id: 'question-2' },
      { criteria: [{ criterion_id: 'criterion-3', description: 'Predicts from the relation.', source_element_ids: ['element-1'] }], kind: 'prediction', objective_ids: ['objective-1'], prompt: 'Predict it.', question_id: 'question-3' },
    ],
    estimated_minutes: 12,
    objectives: [{ description: 'Explain the mechanism.', importance: 'essential', objective_id: 'objective-1' }],
    page_end: 2,
    page_start: 1,
    plan_id: 'plan-course',
    plan_version: 1,
    sections: [{
      estimated_minutes: 12,
      objective_ids: ['objective-1'],
      representation_intents: ['source_excerpt', 'generated_diagram'],
      section_id: 'section-1',
      source_element_ids: ['element-1'],
      title: 'The mechanism',
    }],
    source_hash: 'source-hash',
    source_id: sourceId,
    status: 'proposed',
    title: 'Foundations reconstructed',
    updated_at: '2026-08-30T12:05:00.000Z',
    warnings: ['Candidate reading order requires inspection.'],
  }
}

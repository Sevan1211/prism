import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LessonDocument } from './lessonDocumentTypes'
import { getLessonDocumentByPlan } from './lessonDocuments'
import {
  acceptLessonOutcomeProposal,
  getLatestLessonOutcomeProposalForPlan,
  listLatestLessonAnswerAnalysesForPlan,
} from './lessonLearning'
import type { LessonAnswerAnalysis, LessonOutcomeProposal } from './lessonLearningTypes'
import type { LessonPlan } from './lessonPlanTypes'
import { LessonDraftPreview } from './LessonDraftPreview'

vi.mock('./lessonDocuments', () => ({
  getLessonEditProposal: vi.fn(async () => undefined),
  getLessonDocumentByPlan: vi.fn(),
}))
vi.mock('../storage/browserSources', () => ({
  readBrowserSourceBundle: vi.fn(async () => ({ elements: [{ anchor: { element_id: 'source-element-1', pdf_page_index: 1, bbox_normalized: null }, text: 'Original evidence text.' }] })),
}))

vi.mock('./lessonLearning', () => ({
  acceptLessonOutcomeProposal: vi.fn(),
  dismissLessonOutcomeProposal: vi.fn(),
  getLatestLessonOutcomeProposalForPlan: vi.fn(async () => undefined),
  listLatestLessonAnswerAnalysesForPlan: vi.fn(async () => []),
}))

describe('LessonDraftPreview', () => {
  beforeEach(() => {
    vi.mocked(getLessonDocumentByPlan).mockResolvedValue(documentFixture())
    vi.mocked(listLatestLessonAnswerAnalysesForPlan).mockResolvedValue([])
    vi.mocked(getLatestLessonOutcomeProposalForPlan).mockResolvedValue(undefined)
  })

  it('renders technical notation and opens exact source evidence', async () => {
    const onOpenEvidence = vi.fn().mockResolvedValue(undefined)
    const { container } = render(
      <LessonDraftPreview
        onError={vi.fn()}
        onOpenEvidence={onOpenEvidence}
        plan={{ plan_id: 'plan-1' } as LessonPlan}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'A grounded lesson' })).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: 'Evidence 1' })[0])
    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(onOpenEvidence).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Open full page in Reader' }))
    expect(onOpenEvidence).toHaveBeenCalledWith('source-element-1', 'lesson-evidence-prose-1-1')
    await waitFor(() => expect(container.querySelector('.katex')).not.toBeNull())
    expect(screen.getByLabelText('Equation: Relates energy to mass.')).toBeVisible()
  })

  it('makes a learner-selected block and request available without navigating away', async () => {
    const onOpenEvidence = vi.fn()
    render(<LessonDraftPreview onError={vi.fn()} onOpenEvidence={onOpenEvidence} plan={{ plan_id: 'plan-1' } as LessonPlan} />)
    await screen.findByRole('heading', { name: 'A grounded lesson' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Ask about this' })[0])
    fireEvent.change(screen.getByLabelText('What would help you understand it?'), { target: { value: 'Explain the limiting case.' } })
    expect(document.querySelector('[data-focus-block-id]')?.getAttribute('data-focus-block-id')).toBe('prose-1')
    expect(screen.getByLabelText('What would help you understand it?')).toHaveValue('Explain the limiting case.')
    expect(onOpenEvidence).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear selected passage' }))
    expect(screen.queryByLabelText('What would help you understand it?')).toBeNull()
  })

  it('shows evidence analysis and requires the visible learner action for repair', async () => {
    const document = documentFixture()
    document.end_questions = [{
      criteria: [{
        criterion_id: 'criterion-1',
        description: 'Preserves the limiting condition.',
        source_element_ids: ['source-element-1'],
      }],
      kind: 'application',
      objective_ids: ['objective-1'],
      prompt: 'Apply the relation to a boundary case.',
      question_id: 'question-1',
    }]
    const analysis = analysisFixture()
    const outcome = outcomeFixture()
    vi.mocked(getLessonDocumentByPlan).mockResolvedValue(document)
    vi.mocked(listLatestLessonAnswerAnalysesForPlan).mockResolvedValue([analysis])
    vi.mocked(getLatestLessonOutcomeProposalForPlan).mockResolvedValue(outcome)
    vi.mocked(acceptLessonOutcomeProposal).mockResolvedValue({
      proposal: { ...outcome, child_brief_id: 'brief-repair', status: 'accepted' },
      repair_brief: null,
    })

    render(
      <LessonDraftPreview
        onError={vi.fn()}
        onOpenEvidence={vi.fn()}
        plan={{ plan_id: 'plan-1' } as LessonPlan}
      />,
    )

    expect(await screen.findByText('partially demonstrated')).toBeVisible()
    expect(screen.getByText('The limiting condition is missing.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Create Repair Lesson' }))
    await waitFor(() => expect(acceptLessonOutcomeProposal).toHaveBeenCalledWith(
      outcome.proposal_id,
      outcome.updated_at,
    ))
    expect(await screen.findByText(/Repair brief saved under this source/)).toBeVisible()
  })
})

function analysisFixture(): LessonAnswerAnalysis {
  return {
    agent_label: 'Codex',
    analysis_id: 'analysis-1',
    created_at: '2026-08-31T12:10:00.000Z',
    criterion_analyses: [{
      criterion_id: 'criterion-1',
      evidence_element_ids: ['source-element-1'],
      note: 'The relation is present, but the boundary is absent.',
      status: 'partially_met',
    }],
    document_version: 1,
    gaps: ['The limiting condition is missing.'],
    learner_answer: 'The relation always holds.',
    lesson_id: 'lesson-1',
    plan_id: 'plan-1',
    question_id: 'question-1',
    record_version: 1,
    source_id: 'source-1',
    status: 'partially_demonstrated',
    strengths: ['The central relation is identified.'],
    supersedes_analysis_id: null,
    uncertainty: null,
  }
}

function outcomeFixture(): LessonOutcomeProposal {
  return {
    accepted_at: null,
    analysis_ids: ['analysis-1'],
    child_brief_id: null,
    created_at: '2026-08-31T12:11:00.000Z',
    document_version: 1,
    lesson_id: 'lesson-1',
    plan_id: 'plan-1',
    proposal_id: 'outcome-1',
    rationale: 'A short repair should contrast the rule with its limiting case.',
    recommendation: 'repair',
    record_version: 1,
    repair: {
      assignment: 'Repair the unresolved boundary condition.',
      intended_depth: 'standard',
      learner_goal: 'Explain when the relation stops applying.',
      name: 'Repair: boundary condition',
      page_end: 2,
      page_start: 1,
      prior_knowledge: [],
      source_element_ids: ['source-element-1'],
      time_budget_minutes: 12,
    },
    source_id: 'source-1',
    status: 'proposed',
    supersedes_proposal_id: null,
    unresolved_criterion_ids: ['criterion-1'],
    updated_at: '2026-08-31T12:11:00.000Z',
  }
}

function documentFixture(): LessonDocument {
  return {
    approval_hash: 'a'.repeat(64),
    created_at: '2026-08-31T12:00:00.000Z',
    document_version: 1,
    end_questions: [],
    lesson_id: 'lesson-1',
    plan_id: 'plan-1',
    plan_version: 1,
    record_version: 1,
    sections: [{
      blocks: [
        {
          block_id: 'prose-1',
          content: { kind: 'prose', text: 'A source-grounded explanation.' },
          provenance: 'source_grounded',
          source_element_ids: ['source-element-1'],
        },
        {
          block_id: 'equation-1',
          content: { explanation: 'Relates energy to mass.', kind: 'equation', latex: 'E = mc^2' },
          provenance: 'source_grounded',
          source_element_ids: ['source-element-1'],
        },
      ],
      objective_ids: ['objective-1'],
      section_id: 'section-1',
      title: 'Core mechanism',
    }],
    source_hash: 'b'.repeat(64),
    source_id: 'source-1',
    status: 'draft',
    title: 'A grounded lesson',
    updated_at: '2026-08-31T12:00:00.000Z',
    validation: {
      block_count: 2,
      checked_at: '2026-08-31T12:00:00.000Z',
      errors: [],
      section_count: 1,
      valid_for_ready: true,
      warnings: [],
    },
  }
}

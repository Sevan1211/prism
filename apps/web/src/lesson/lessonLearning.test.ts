import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import {
  accessBrowserVault,
  PRISM_VAULT_LESSON_DOCUMENT_STORE,
  PRISM_VAULT_LESSON_PLAN_STORE,
  type BrowserVaultEnvironment,
  type DirectoryHandleLike,
  type FileHandleLike,
  type WritableFileLike,
} from '../storage/browserVault'
import type { LessonDocument } from './lessonDocumentTypes'
import {
  acceptLessonOutcomeProposal,
  getLessonEndCheck,
  listLessonAnswerAnalyses,
  proposeLessonOutcome,
  recordLessonAnswerAnalysis,
} from './lessonLearning'
import { listLessonBriefs } from './lessonPlans'
import type { LessonPlan } from './lessonPlanTypes'

class MemoryFile implements FileHandleLike {
  blob: Blob | null = null
  constructor(readonly name: string) {}
  async createWritable(): Promise<WritableFileLike> {
    return { close: async () => undefined, write: async (data) => { this.blob = data } }
  }
  async getFile(): Promise<File> {
    if (!this.blob) throw new DOMException('Missing file', 'NotFoundError')
    return new File([this.blob], this.name, { type: this.blob.type })
  }
}

class MemoryDirectory implements DirectoryHandleLike {
  readonly directories = new Map<string, MemoryDirectory>()
  readonly files = new Map<string, MemoryFile>()
  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MemoryDirectory> {
    const existing = this.directories.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException('Missing directory', 'NotFoundError')
    const created = new MemoryDirectory()
    this.directories.set(name, created)
    return created
  }
  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MemoryFile> {
    const existing = this.files.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException('Missing file', 'NotFoundError')
    const created = new MemoryFile(name)
    this.files.set(name, created)
    return created
  }
  async removeEntry(name: string): Promise<void> {
    if (this.files.delete(name) || this.directories.delete(name)) return
    throw new DOMException('Missing entry', 'NotFoundError')
  }
}

function environment(): BrowserVaultEnvironment {
  const root = new MemoryDirectory()
  return {
    indexedDB: new IDBFactory(),
    keyRange: IDBKeyRange,
    storage: {
      estimate: vi.fn().mockResolvedValue({ quota: 1024 ** 3, usage: 0 }),
      getDirectory: vi.fn().mockResolvedValue(root),
      persisted: vi.fn().mockResolvedValue(true),
    },
  }
}

describe('lesson answer evidence and repair', () => {
  it('requires current source-grounded criteria and appends inspectable analyses', async () => {
    const env = environment()
    await seedLesson(env)

    const first = await recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: 'criterion-1',
        evidence_element_ids: ['element-1'],
        note: 'The response states the relation but does not explain the boundary case.',
        status: 'partially_met',
      }],
      document_version: 1,
      gaps: ['The boundary condition is missing.'],
      learner_answer: 'The relation applies whenever the first quantity increases.',
      lesson_id: 'lesson-1',
      question_id: 'question-1',
      status: 'partially_demonstrated',
      strengths: ['The governing relation is identified.'],
      uncertainty: null,
    }, {
      environment: env,
      now: () => '2026-08-31T10:00:00.000Z',
      randomUUID: () => 'analysis-1',
    })

    const second = await recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: 'criterion-1',
        evidence_element_ids: ['element-1'],
        note: 'The revised response states the relation and its boundary.',
        status: 'met',
      }],
      document_version: 1,
      gaps: [],
      learner_answer: 'The relation applies only while the stated boundary remains true.',
      lesson_id: 'lesson-1',
      question_id: 'question-1',
      status: 'demonstrated',
      strengths: ['The relation and its limiting condition are both explained.'],
      uncertainty: null,
    }, {
      environment: env,
      now: () => '2026-08-31T10:01:00.000Z',
      randomUUID: () => 'analysis-2',
    })

    expect(second.supersedes_analysis_id).toBe(first.analysis_id)
    await expect(listLessonAnswerAnalyses('lesson-1', env)).resolves.toHaveLength(2)
    await expect(getLessonEndCheck('lesson-1', env)).resolves.toMatchObject({
      analyses: [{ analysis_id: 'analysis_analysis-2', learner_answer: expect.any(String) }],
      ready: true,
    })
  })

  it('rejects unsupported criterion judgments and inconsistent overall labels', async () => {
    const env = environment()
    await seedLesson(env)

    await expect(recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: 'criterion-1',
        evidence_element_ids: ['outside-evidence'],
        note: 'Unsupported judgment.',
        status: 'met',
      }],
      document_version: 1,
      gaps: [],
      learner_answer: 'An answer.',
      lesson_id: 'lesson-1',
      question_id: 'question-1',
      status: 'demonstrated',
      strengths: ['A strength.'],
      uncertainty: null,
    }, { environment: env })).rejects.toThrow('outside its approved answer criterion')

    await expect(recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: 'criterion-1',
        evidence_element_ids: ['element-1'],
        note: 'The answer contradicts the criterion.',
        status: 'not_met',
      }],
      document_version: 1,
      gaps: [],
      learner_answer: 'An answer.',
      lesson_id: 'lesson-1',
      question_id: 'question-1',
      status: 'demonstrated',
      strengths: ['A strength.'],
      uncertainty: null,
    }, { environment: env })).rejects.toThrow('every criterion to be met')
  })

  it('requires a current analysis for every end question before closure', async () => {
    const env = environment()
    await seedLesson(env)

    const analyze = (questionNumber: number) => recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: `criterion-${questionNumber}`,
        evidence_element_ids: ['element-1'],
        note: 'The learner response meets the source-grounded criterion.',
        status: 'met' as const,
      }],
      document_version: 1,
      gaps: [],
      learner_answer: 'The response explains the relation and preserves its boundary.',
      lesson_id: 'lesson-1',
      question_id: `question-${questionNumber}`,
      status: 'demonstrated' as const,
      strengths: ['The relevant relation and boundary are both present.'],
      uncertainty: null,
    }, {
      environment: env,
      now: () => `2026-08-31T10:0${questionNumber}:00.000Z`,
      randomUUID: () => `analysis-close-${questionNumber}`,
    })

    await analyze(1)
    await expect(proposeLessonOutcome({
      document_version: 1,
      lesson_id: 'lesson-1',
      rationale: 'The analyzed response meets its criterion.',
      recommendation: 'close',
      repair: null,
      unresolved_criterion_ids: [],
    }, { environment: env })).rejects.toThrow('Missing: question-2, question-3')

    await analyze(2)
    await analyze(3)
    await expect(proposeLessonOutcome({
      document_version: 1,
      lesson_id: 'lesson-1',
      rationale: 'Every end question is analyzed and every criterion is met.',
      recommendation: 'close',
      repair: null,
      unresolved_criterion_ids: [],
    }, {
      environment: env,
      now: () => '2026-08-31T10:10:00.000Z',
      randomUUID: () => 'outcome-close',
    })).resolves.toMatchObject({
      analysis_ids: [
        'analysis_analysis-close-1',
        'analysis_analysis-close-2',
        'analysis_analysis-close-3',
      ],
      recommendation: 'close',
    })
  })

  it('keeps repair consequential until the learner accepts a named child brief', async () => {
    const env = environment()
    await seedLesson(env)
    const analysis = await recordLessonAnswerAnalysis({
      agent_label: 'Codex',
      criterion_analyses: [{
        criterion_id: 'criterion-1',
        evidence_element_ids: ['element-1'],
        note: 'The boundary condition remains missing.',
        status: 'partially_met',
      }],
      document_version: 1,
      gaps: ['The boundary condition is missing.'],
      learner_answer: 'The relation always holds.',
      lesson_id: 'lesson-1',
      question_id: 'question-1',
      status: 'partially_demonstrated',
      strengths: ['The central relation is recognized.'],
      uncertainty: null,
    }, {
      environment: env,
      now: () => '2026-08-31T11:00:00.000Z',
      randomUUID: () => 'analysis-repair',
    })

    await expect(proposeLessonOutcome({
      document_version: 1,
      lesson_id: 'lesson-1',
      rationale: 'The analyzed criterion is still unresolved.',
      recommendation: 'close',
      repair: null,
      unresolved_criterion_ids: ['criterion-1'],
    }, { environment: env })).rejects.toThrow('cannot be recommended for closure')

    const proposal = await proposeLessonOutcome({
      document_version: 1,
      lesson_id: 'lesson-1',
      rationale: 'A short repair should contrast the rule with its limiting case.',
      recommendation: 'repair',
      repair: {
        assignment: 'Repair the unresolved boundary condition.',
        intended_depth: 'standard',
        learner_goal: 'Explain when the relation stops applying and diagnose one counterexample.',
        name: 'Repair: boundary condition',
        page_end: 2,
        page_start: 1,
        prior_knowledge: ['The central relation'],
        source_element_ids: ['element-1'],
        time_budget_minutes: 12,
      },
      unresolved_criterion_ids: ['criterion-1'],
    }, {
      environment: env,
      now: () => '2026-08-31T11:01:00.000Z',
      randomUUID: () => 'outcome-repair',
    })

    expect(proposal).toMatchObject({
      analysis_ids: [analysis.analysis_id],
      child_brief_id: null,
      status: 'proposed',
    })
    await expect(listLessonBriefs('source-1', env)).resolves.toEqual([])

    const accepted = await acceptLessonOutcomeProposal(
      proposal.proposal_id,
      proposal.updated_at,
      {
        environment: env,
        now: () => '2026-08-31T11:02:00.000Z',
        randomUUID: () => 'brief-repair',
      },
    )

    expect(accepted.proposal).toMatchObject({
      child_brief_id: 'brief_brief-repair',
      status: 'accepted',
    })
    await expect(listLessonBriefs('source-1', env)).resolves.toEqual([
      expect.objectContaining({
        brief_kind: 'repair',
        parent_lesson_id: 'lesson-1',
        repair_for_criterion_ids: ['criterion-1'],
        repair_source_element_ids: ['element-1'],
      }),
    ])
  })
})

async function seedLesson(environment: BrowserVaultEnvironment): Promise<void> {
  const plan = planFixture()
  const document = documentFixture(plan)
  await accessBrowserVault((database) => new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_LESSON_PLAN_STORE, PRISM_VAULT_LESSON_DOCUMENT_STORE],
      'readwrite',
    )
    transaction.objectStore(PRISM_VAULT_LESSON_PLAN_STORE).put(plan)
    transaction.objectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE).put(document)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  }), environment)
}

function planFixture(): LessonPlan {
  const questions = [
    ['question-1', 'criterion-1', 'explanation'],
    ['question-2', 'criterion-2', 'application'],
    ['question-3', 'criterion-3', 'interpretation'],
  ] as const
  return {
    approval_hash: 'approved-hash',
    approved_at: '2026-08-31T09:00:00.000Z',
    brief_id: 'brief-1',
    coverage: [{ disposition: 'core', element_id: 'element-1', reason: null }],
    created_at: '2026-08-31T09:00:00.000Z',
    end_questions: questions.map(([questionId, criterionId, kind]) => ({
      criteria: [{
        criterion_id: criterionId,
        description: 'Use the source-supported relation and preserve its limiting condition.',
        source_element_ids: ['element-1'],
      }],
      kind,
      objective_ids: ['objective-1'],
      prompt: 'Explain or apply the governing relation.',
      question_id: questionId,
    })),
    estimated_minutes: 18,
    objectives: [{
      description: 'Explain and apply the governing relation.',
      importance: 'essential',
      objective_id: 'objective-1',
    }],
    page_end: 2,
    page_start: 1,
    plan_id: 'plan-1',
    plan_version: 1,
    sections: [{
      estimated_minutes: 18,
      objective_ids: ['objective-1'],
      representation_intents: ['worked_example'],
      section_id: 'section-1',
      source_element_ids: ['element-1'],
      title: 'The governing relation',
    }],
    source_hash: 'source-hash',
    source_id: 'source-1',
    status: 'approved',
    title: 'Field-neutral lesson',
    updated_at: '2026-08-31T09:00:00.000Z',
    warnings: [],
  }
}

function documentFixture(plan: LessonPlan): LessonDocument {
  return {
    approval_hash: plan.approval_hash ?? 'missing',
    created_at: '2026-08-31T09:10:00.000Z',
    document_version: 1,
    end_questions: plan.end_questions,
    lesson_id: 'lesson-1',
    plan_id: plan.plan_id,
    plan_version: 1,
    record_version: 1,
    sections: [{
      blocks: [{
        block_id: 'block-1',
        content: { kind: 'prose', text: 'A source-grounded explanation.' },
        provenance: 'source_grounded',
        source_element_ids: ['element-1'],
      }],
      objective_ids: ['objective-1'],
      section_id: 'section-1',
      title: 'The governing relation',
    }],
    source_hash: plan.source_hash,
    source_id: plan.source_id,
    status: 'draft',
    title: plan.title,
    updated_at: '2026-08-31T09:10:00.000Z',
    validation: {
      block_count: 1,
      checked_at: '2026-08-31T09:10:00.000Z',
      errors: [],
      section_count: 1,
      valid_for_ready: true,
      warnings: [],
    },
  }
}

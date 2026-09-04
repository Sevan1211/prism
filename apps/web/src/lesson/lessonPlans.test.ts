import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import type {
  BrowserVaultEnvironment,
  DirectoryHandleLike,
  FileHandleLike,
  WritableFileLike,
} from '../storage/browserVault'
import {
  getBrowserScopeManifest,
  deleteBrowserSource,
  importBrowserSource,
  indexBrowserSource,
  readBrowserSourceBundle,
  pageImageElement,
} from '../storage/browserSources'
import { buildIndexedSourcePage } from '../storage/sourceIntelligence'
import type { IndexedSourcePage, ScopeManifestItem } from '../storage/sourceIndexTypes'
import {
  approveLessonPlan,
  createLessonBrief,
  getLessonBrief,
  getLessonPlan,
  listLessonBriefs,
  listLessonPlans,
  proposeLessonPlan,
  validatePlanProposal,
} from './lessonPlans'
import type { LessonBrief, LessonPlanProposalInput } from './lessonPlanTypes'
import type { ApplyLessonPatchInput } from './lessonDocumentTypes'
import {
  applyLessonPatch,
  getLessonDocument,
  getLessonDocumentByPlan,
  getLessonDocumentRevision,
  listLessonDocumentRevisions,
  restoreLessonRevision,
  validateLesson,
  finalizeLesson,
  proposeLessonRevision,
  resolveLessonRevision,
  getLessonEditProposal,
} from './lessonDocuments'
import { recordScopeReview } from './lessonScope'

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

describe('coverage-aware lesson plans', () => {
  it('plans a 100-page synthesis from saved checkpoints and treats length as a soft target', async () => {
    const env = environment()
    const source = await importBrowserSource(new File(['%PDF-long-fixture'], 'long-source.pdf'), 'open_license', { environment: env, inspectPdf: async () => 100 })
    await indexBrowserSource(source.id, { environment: env, extractor: async (_file, sourceId, _start, options) => {
      for (let start = 1; start <= 100; start += 8) await options.onBatch(Array.from({ length: Math.min(8, 101 - start) }, (_, i) => ({ ...indexedPage(sourceId), page_number: start + i, elements: [], fragments: [], text: '' })))
    } })
    const brief = await createLessonBrief({ ...briefFixture(), source_id: source.id, page_end: 100, output_kind: 'research_brief', target_words: 5000, time_budget_minutes: 10 }, { environment: env })
    const ids: string[] = []
    for (let start = 1; start <= 100; start += 8) {
      const id = pageImageElement({ ...indexedPage(source.id), page_number: start }).element_id
      ids.push(id)
      await recordScopeReview({ brief_id: brief.brief_id, page_start: start, page_end: Math.min(100, start + 7), summary: 'Synthetic checkpoint for the progressive coverage contract, not a document-quality evaluation.', essential_element_ids: [id], visual_review: 'inspected', visual_notes: 'Synthetic image evidence for the storage contract.' }, env)
    }
    const input: LessonPlanProposalInput = { brief_id: brief.brief_id, title: 'A deliberate synthesis', objectives: [{ objective_id: 'understand', description: 'Explain the main arguments and limitations.', importance: 'essential' }], sections: [{ section_id: 'synthesis', title: 'Arguments and evidence', objective_ids: ['understand'], source_element_ids: ids, representation_intents: [], estimated_minutes: 30 }], coverage: ids.map((element_id) => ({ element_id, disposition: 'core', reason: null })), coverage_ranges: [{ page_start: 1, page_end: 100, disposition: 'compressed', reason: 'Preserve arguments and qualifications; compress repetition.' }], end_questions: [], warnings: [] }
    const plan = await proposeLessonPlan(input, { environment: env })
    expect(plan).toMatchObject({ target_words: 5000, output_kind: 'research_brief', page_end: 100, estimated_minutes: 30, end_questions: [] })
    expect(plan.warnings.length).toBeGreaterThan(0)
    expect((await getLessonBrief(brief.brief_id, env))?.scope_reviews).toHaveLength(13)
    await expect(proposeLessonPlan({ ...input, coverage: input.coverage.slice(1) }, { environment: env })).rejects.toThrow(/essential/i)
  })
  it('rejects incomplete coverage, source-only transformation, and permits optional end checks', () => {
    const manifest = [manifestItem('element-1'), manifestItem('element-2', 'source_only')]
    const brief = briefFixture()
    const valid = proposalFixture(manifest)

    expect(() => validatePlanProposal(
      { ...valid, coverage: valid.coverage.slice(0, 1) },
      brief,
      manifest,
    )).toThrow('classify every manifest element')
    expect(() => validatePlanProposal(
      {
        ...valid,
        coverage: valid.coverage.map((entry) => entry.element_id === 'element-2'
          ? { ...entry, disposition: 'core' as const }
          : entry),
      },
      brief,
      manifest,
    )).toThrow('cannot be transformed')
    expect(() => validatePlanProposal(
      {
        ...valid,
        end_questions: valid.end_questions.map((question) => ({ ...question, kind: 'explanation' as const })),
      },
      brief,
      manifest,
    )).not.toThrow()
  })

  it('persists a proposal, reopens it, and freezes learner approval with a fingerprint', async () => {
    const env = environment()
    const source = await importBrowserSource(
      new File(['%PDF-plan'], 'plan.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('f'.repeat(64)),
        environment: env,
        inspectPdf: vi.fn().mockResolvedValue(1),
      },
    )
    await indexBrowserSource(source.id, {
      environment: env,
      extractor: async (_file, sourceId, _startPage, options) => {
        await options.onBatch([indexedPage(sourceId)])
      },
    })
    const brief = await createLessonBrief({
      assignment: 'Read and understand the first section.',
      intended_depth: 'standard',
      learner_goal: 'Explain the mechanism and apply it.',
      name: 'Week one · Foundations',
      page_end: 1,
      page_start: 1,
      prior_knowledge: ['Basic terminology'],
      source_id: source.id,
      time_budget_minutes: 25,
    }, {
      environment: env,
      now: () => '2026-08-29T12:00:00.000Z',
      randomUUID: () => 'brief-id',
    })
    const manifest = await getBrowserScopeManifest(source.id, 1, 1, '0', 16, env)
    const proposed = await proposeLessonPlan({
      ...proposalFixture(manifest.items),
      brief_id: brief.brief_id,
    }, {
      environment: env,
      now: () => '2026-08-29T12:01:00.000Z',
      randomUUID: () => 'plan-id',
    })

    expect(await listLessonPlans(source.id, env)).toEqual([proposed])
    expect(await listLessonBriefs(source.id, env)).toEqual([brief])
    expect(await getLessonPlan(proposed.plan_id, env)).toEqual(proposed)

    await expect(approveLessonPlan(proposed.plan_id, 'stale', { environment: env }))
      .rejects.toThrow('changed before approval')

    const approved = await approveLessonPlan(proposed.plan_id, proposed.updated_at, {
      environment: env,
      now: () => '2026-08-29T12:02:00.000Z',
    })
    expect(approved).toMatchObject({
      approved_at: '2026-08-29T12:02:00.000Z',
      status: 'approved',
      approval_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    await expect(approveLessonPlan(proposed.plan_id, 'stale', { environment: env }))
      .resolves.toEqual(approved)

    await deleteBrowserSource(source.id, env)
    await expect(listLessonPlans(source.id, env)).resolves.toEqual([])
    await expect(getLessonBrief(brief.brief_id, env)).resolves.toBeUndefined()
  })

  it('composes only typed blocks against an approved plan with version and excerpt checks', async () => {
    const env = environment()
    const source = await importBrowserSource(
      new File(['%PDF-compose'], 'compose.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('d'.repeat(64)),
        environment: env,
        inspectPdf: vi.fn().mockResolvedValue(1),
      },
    )
    await indexBrowserSource(source.id, {
      environment: env,
      extractor: async (_file, sourceId, _startPage, options) => {
        await options.onBatch([indexedPage(sourceId)])
      },
    })
    const brief = await createLessonBrief({
      assignment: 'Read and understand the first section.',
      intended_depth: 'standard',
      learner_goal: 'Explain the mechanism and apply it.',
      name: 'Week one · Foundations',
      page_end: 1,
      page_start: 1,
      prior_knowledge: ['Basic terminology'],
      source_id: source.id,
      time_budget_minutes: 25,
    }, {
      environment: env,
      now: () => '2026-08-29T13:00:00.000Z',
      randomUUID: () => 'brief-compose',
    })
    const manifest = await getBrowserScopeManifest(source.id, 1, 1, '0', 16, env)
    const proposal = await proposeLessonPlan({
      ...proposalFixture(manifest.items),
      brief_id: brief.brief_id,
    }, {
      environment: env,
      now: () => '2026-08-29T13:01:00.000Z',
      randomUUID: () => 'plan-compose',
    })

    await expect(applyLessonPatch({
      expected_version: null,
      operations: [],
      plan_id: proposal.plan_id,
    }, { environment: env })).rejects.toThrow('approve this lesson plan')

    const plan = await approveLessonPlan(proposal.plan_id, proposal.updated_at, {
      environment: env,
      now: () => '2026-08-29T13:02:00.000Z',
    })
    const elementId = plan.sections[0]?.source_element_ids[0] ?? 'missing'
    const bundle = await readBrowserSourceBundle(source.id, [elementId], 0, env)
    const exactText = bundle.elements[0]?.text ?? 'missing'
    const initialPatch: ApplyLessonPatchInput = {
      request_id: 'first-section',
      expected_version: null,
      operations: [
        {
          after_block_id: null,
          block: {
            block_id: 'block-excerpt',
            content: { kind: 'source_excerpt', text: exactText },
            provenance: 'source_authored',
            source_element_ids: [elementId],
          },
          operation: 'insert_block',
          section_id: 'section-1',
        },
        {
          after_block_id: 'block-excerpt',
          block: {
            block_id: 'block-diagram',
            content: {
              caption: 'The mechanism as a relation',
              edges: [{ from: 'protocol', label: 'governs', to: 'communication' }],
              kind: 'diagram',
              nodes: [
                { label: 'Protocol', node_id: 'protocol' },
                { label: 'Communication', node_id: 'communication' },
              ],
            },
            provenance: 'source_grounded',
            source_element_ids: [elementId],
          },
          operation: 'insert_block',
          section_id: 'section-1',
        },
      ],
      plan_id: plan.plan_id,
    }
    const document = await applyLessonPatch(initialPatch, {
      environment: env,
      now: () => '2026-08-29T13:03:00.000Z',
      randomUUID: () => 'lesson-compose',
    })

    expect(document).toMatchObject({
      document_version: 1,
      lesson_id: 'lesson_lesson-compose',
      validation: { errors: [], valid_for_ready: true },
    })
    await expect(getLessonDocument(document.lesson_id, env)).resolves.toEqual(document)
    await expect(getLessonDocumentByPlan(plan.plan_id, env)).resolves.toEqual(document)
    await expect(getLessonDocumentRevision(document.lesson_id, 1, env)).resolves.toEqual(document)
    await expect(applyLessonPatch(initialPatch, { environment: env })).resolves.toEqual(document)
    await expect(applyLessonPatch({ ...initialPatch, operations: [] }, { environment: env })).rejects.toThrow('different lesson content')

    await expect(listLessonDocumentRevisions(document.lesson_id, env)).resolves.toEqual([document])
    await expect(validateLesson(document.lesson_id, {
      environment: env,
      now: () => '2026-08-29T13:04:00.000Z',
    })).resolves.toMatchObject({ errors: [], valid_for_ready: true })

    await expect(applyLessonPatch({
      expected_version: null,
      operations: [{ block_id: 'block-diagram', operation: 'remove_block' }],
      plan_id: plan.plan_id,
    }, { environment: env })).rejects.toThrow('changed before the patch')
    await expect(applyLessonPatch({
      expected_version: 1,
      operations: [{
        after_block_id: 'block-diagram',
        block: {
          block_id: 'outside-evidence',
          content: { kind: 'prose', text: 'Unsupported grounding.' },
          provenance: 'source_grounded',
          source_element_ids: ['not-approved'],
        },
        operation: 'insert_block',
        section_id: 'section-1',
      }],
      plan_id: plan.plan_id,
    }, { environment: env })).rejects.toThrow('outside its approved section')

    const revised = await applyLessonPatch({
      expected_version: 1,
      operations: [{
        block: {
          block_id: 'block-diagram',
          content: { kind: 'prose', text: 'A revised, source-grounded explanation.' },
          provenance: 'source_grounded',
          source_element_ids: [elementId],
        },
        block_id: 'block-diagram',
        operation: 'replace_block',
      }],
      plan_id: plan.plan_id,
    }, {
      environment: env,
      now: () => '2026-08-29T13:05:00.000Z',
    })
    expect(revised.document_version).toBe(2)
    await expect(listLessonDocumentRevisions(document.lesson_id, env)).resolves.toEqual([
      document,
      revised,
    ])
    await expect(getLessonDocumentRevision(document.lesson_id, 1, env)).resolves.toEqual(document)

    const restored = await restoreLessonRevision(document.lesson_id, 1, 2, { environment: env })
    expect(restored.document_version).toBe(3)
    expect(restored.sections).toEqual(document.sections)
    await expect(getLessonDocumentRevision(document.lesson_id, 2, env)).resolves.toEqual(revised)
    await expect(restoreLessonRevision(document.lesson_id, 1, 2, { environment: env })).rejects.toThrow('changed before the patch')

    const ready = await finalizeLesson(document.lesson_id, 3, { summary: 'Synthetic fixture reviewed for this transaction test.', reviewer: 'Test agent' }, { environment: env })
    expect(ready.status).toBe('ready')
    const revisionInput = { plan_id: plan.plan_id, expected_version: 4, summary: 'Add a clearer explanation while preserving the original diagram.', operations: [{ operation: 'insert_block' as const, section_id: 'section-1', after_block_id: 'block-diagram', block: { block_id: 'clarification', provenance: 'source_grounded' as const, source_element_ids: [elementId], content: { kind: 'rich_text' as const, markdown: 'A more detailed explanation of the source relation.' } } }] }
    await expect(applyLessonPatch(revisionInput, { environment: env })).rejects.toThrow('propose_lesson_revision')
    const edit = await proposeLessonRevision(revisionInput, { environment: env })
    expect((await getLessonDocument(document.lesson_id, env))?.document_version).toBe(4)
    await expect(proposeLessonRevision(revisionInput, { environment: env })).rejects.toThrow('awaiting review')
    await resolveLessonRevision(document.lesson_id, edit.proposal_id, true, env)
    expect((await getLessonDocument(document.lesson_id, env))?.sections[0].blocks.at(-1)?.block_id).toBe('clarification')
    expect((await getLessonDocumentRevision(document.lesson_id, 4, env))?.sections[0].blocks).toHaveLength(2)
    const stale = await proposeLessonRevision({ ...revisionInput, expected_version: 5, operations: [{ operation: 'remove_block', block_id: 'clarification' }] }, { environment: env })
    await restoreLessonRevision(document.lesson_id, 1, 5, { environment: env })
    await expect(resolveLessonRevision(document.lesson_id, stale.proposal_id, true, env)).rejects.toThrow('lesson changed')
    await resolveLessonRevision(document.lesson_id, stale.proposal_id, false, env)
    expect(await getLessonEditProposal(document.lesson_id, env)).toBeUndefined()
    expect((await getLessonDocument(document.lesson_id, env))?.document_version).toBe(6)

    await deleteBrowserSource(source.id, env)
    await expect(getLessonDocument(document.lesson_id, env)).resolves.toBeUndefined()
  })
})

function indexedPage(sourceId: string): IndexedSourcePage {
  return buildIndexedSourcePage({
    fragments: [
      { bbox_normalized: [0.1, 0.1, 0.8, 0.14], has_eol: true, text: 'FOUNDATIONS' },
      { bbox_normalized: [0.1, 0.2, 0.8, 0.24], has_eol: false, text: 'A protocol defines communication rules.' },
    ],
    height: 792,
    pageNumber: 1,
    rotation: 0,
    sourceId,
    width: 612,
  })
}

function manifestItem(
  elementId: string,
  status: ScopeManifestItem['status'] = 'transform_with_warning',
): ScopeManifestItem {
  return {
    anchor: {
      bbox_normalized: [0.1, 0.1, 0.8, 0.2],
      element_id: elementId,
      end_offset: null,
      id: `anchor:${elementId}`,
      parser_version: 'pdfjs-evidence-v2',
      pdf_page_index: 1,
      printed_page_label: null,
      section_id: null,
      source_hash: 'source-hash',
      start_offset: null,
      text_snapshot_hash: null,
    },
    confidence: 0.9,
    kind: 'paragraph_candidate',
    preview: 'Candidate source text.',
    reasons: [],
    status,
  }
}

function briefFixture(): LessonBrief {
  return {
    assignment: 'Read section one.',
    brief_id: 'brief-1',
    created_at: '2026-08-29T12:00:00.000Z',
    intended_depth: 'standard',
    learner_goal: 'Understand and apply the mechanism.',
    name: 'Foundations',
    page_end: 1,
    page_start: 1,
    prior_knowledge: [],
    record_version: 1,
    source_hash: 'source-hash',
    source_id: 'source-1',
    time_budget_minutes: 25,
    updated_at: '2026-08-29T12:00:00.000Z',
  }
}

function proposalFixture(manifest: ScopeManifestItem[]): LessonPlanProposalInput {
  const usable = manifest.find((item) => item.status !== 'source_only')?.anchor.element_id ?? 'element-1'
  return {
    brief_id: 'brief-1',
    coverage: manifest.map((item) => ({
      disposition: item.status === 'source_only' ? 'source_only' : 'core',
      element_id: item.anchor.element_id ?? 'missing',
      reason: item.status === 'source_only' ? 'Rendered original required.' : null,
    })),
    end_questions: [
      { criteria: [{ criterion_id: 'criterion-1', description: 'States the governing relation.', source_element_ids: [usable] }], kind: 'explanation', objective_ids: ['objective-1'], prompt: 'Explain the mechanism.', question_id: 'question-1' },
      { criteria: [{ criterion_id: 'criterion-2', description: 'Transfers the relation to the new case.', source_element_ids: [usable] }], kind: 'application', objective_ids: ['objective-1'], prompt: 'Apply it to a new case.', question_id: 'question-2' },
      { criteria: [{ criterion_id: 'criterion-3', description: 'Uses the relation to justify a prediction.', source_element_ids: [usable] }], kind: 'prediction', objective_ids: ['objective-1'], prompt: 'Predict the next result.', question_id: 'question-3' },
    ],
    objectives: [{ description: 'Explain and apply the mechanism.', importance: 'essential', objective_id: 'objective-1' }],
    sections: [{
      estimated_minutes: 12,
      objective_ids: ['objective-1'],
      representation_intents: ['source_excerpt', 'generated_diagram'],
      section_id: 'section-1',
      source_element_ids: [usable],
      title: 'The mechanism',
    }],
    title: 'Foundations reconstructed',
    warnings: ['Candidate reading order requires inspection.'],
  }
}

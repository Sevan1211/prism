import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { createTopicSeries, proposeTopicSeries, approveTopicSeries, getTopicSeries, updateTopicRequest } from './topicSeries'
import { recordLessonAnswerAnalysis } from './lessonLearning'
import { getLessonPlan } from './lessonPlans'
import { applyLessonPatch, finalizeLesson, getLessonDocument, proposeLessonRevision, resolveLessonRevision, restoreLessonRevision } from './lessonDocuments'
import { accessBrowserVault, type BrowserVaultEnvironment, type DirectoryHandleLike } from '../storage/browserVault'
import { saveSourceFolder, deleteSourceFolder } from '../storage/sourceFolders'
import { snapshotVaultRecords } from '../storage/vaultTransfer'
import type { TopicLessonProposal } from './topicTypes'

function environment(): BrowserVaultEnvironment {
  const directory: DirectoryHandleLike = { getDirectoryHandle: async () => directory, getFileHandle: async () => { throw new Error('Unexpected file read') }, removeEntry: async () => {} }
  return { indexedDB: new IDBFactory(), keyRange: IDBKeyRange, storage: { getDirectory: async () => directory } }
}
const lesson = (title = 'Interpreting historical evidence'): TopicLessonProposal => ({ title, prerequisites: ['No prior study required.'], exclusions: ['A complete survey of world history.'], objectives: [{ objective_id: 'interpret', importance: 'essential', description: 'Distinguish an observation from an interpretation.' }], sections: [{ section_id: 'evidence', title: 'Evidence and interpretation', objective_ids: ['interpret'], source_element_ids: [], representation_intents: [], estimated_minutes: 20 }], end_questions: [{ question_id: 'reflection', kind: 'interpretation', prompt: 'What could two observers interpret differently?', objective_ids: ['interpret'], criteria: [{ criterion_id: 'perspective', description: 'Distinguishes the evidence from the interpretation.', source_element_ids: [] }] }], references: [] })
const request = { title: 'Synthetic history series', request: 'A local test of topic authoring.', folder_id: null, research_mode: 'knowledge_only' as const, source_role: 'support' as const, source_ids: [] }
const clarification = [{ question: 'What is your goal?', answer: 'Synthetic test: introductory interpretation and optional reflection.' }]

describe('topic lessons and series', () => {
  it('requires clarification, freezes one atomic series approval, and preserves legacy reader/version machinery', async () => {
    const env = environment(), series = await createTopicSeries(request, env)
    await expect(proposeTopicSeries({ series_id: series.id, expected_version: 1, clarifications: [], assumptions: [], exclusions: [], lessons: [lesson()] }, env)).rejects.toThrow('clarification')
    const proposed = await proposeTopicSeries({ series_id: series.id, expected_version: 1, clarifications: clarification, assumptions: [], exclusions: [], lessons: [lesson(), lesson('Comparing explanations')] }, env)
    const block = { block_id: 'explanation', provenance: 'added_explanation' as const, source_element_ids: [], objective_ids: ['interpret'], content: { kind: 'prose' as const, text: 'An observation records what was seen. An interpretation proposes what it means. Different interpretations can fit the same observation; additional evidence can help discriminate them.' } }
    const patch = { plan_id: proposed.plan_ids[0], expected_version: null, operations: [{ operation: 'insert_block' as const, section_id: 'evidence', after_block_id: null, block }] }
    await expect(applyLessonPatch(patch, { environment: env })).rejects.toThrow('approve')
    await expect(approveTopicSeries(series.id, 1, env)).rejects.toThrow('changed')
    await approveTopicSeries(series.id, proposed.version, env)
    for (const id of proposed.plan_ids) expect((await getLessonPlan(id, env))?.status).toBe('approved')
    const draft = await applyLessonPatch({ ...patch, request_id: 'first', coverage_review: [{ concept: 'Interpretation', source_element_ids: [], block_ids: ['explanation'], retained_details: 'Retains the distinction and explains why additional evidence matters.' }] }, { environment: env })
    expect(draft.validation.valid_for_ready).toBe(true)
    const ready = await finalizeLesson(draft.lesson_id, draft.document_version, { summary: 'Synthetic test only; not a teaching-quality acceptance.', reviewer: 'Test agent' }, { environment: env })
    const answer = { agent_label: 'Synthetic test', lesson_id: ready.lesson_id, document_version: ready.document_version, question_id: 'reflection', learner_answer: 'Different contexts may suggest different explanations.', status: 'demonstrated' as const, strengths: ['Names context.'], gaps: [], uncertainty: null, criterion_analyses: [{ criterion_id: 'perspective', status: 'met' as const, evidence_element_ids: [], note: 'Synthetic objective-based judgment.' }] }
    await expect(recordLessonAnswerAnalysis(answer, { environment: env })).rejects.toThrow('uncertainty')
    const analyzed = await recordLessonAnswerAnalysis({ ...answer, uncertainty: 'Agent judgment only; this does not establish retention or transfer.' }, { environment: env })
    expect(analyzed.criterion_analyses[0].evidence_element_ids).toEqual([])
    await expect(applyLessonPatch({ ...patch, expected_version: ready.document_version }, { environment: env })).rejects.toThrow('ready')
    const updated = { ...block, content: { kind: 'prose' as const, text: `${block.content.text} Check the observer’s context before judging their interpretation.` } }
    const review = [{ concept: 'Interpretation', source_element_ids: [], block_ids: ['explanation'], retained_details: 'Preserves the explanation and adds observer context as a qualification.' }]
    const revision = await proposeLessonRevision({ plan_id: patch.plan_id, expected_version: ready.document_version, operations: [{ operation: 'replace_block', block_id: block.block_id, block: updated }], coverage_review: review, summary: 'Adds an important qualification.' }, { environment: env })
    expect((await getLessonDocument(ready.lesson_id, env))?.document_version).toBe(ready.document_version)
    await resolveLessonRevision(ready.lesson_id, revision.proposal_id, true, env)
    const current = await getLessonDocument(ready.lesson_id, env)
    expect(current?.sections[0].blocks[0].content).toEqual(updated.content)
    const restored = await restoreLessonRevision(ready.lesson_id, ready.document_version, current!.document_version, { environment: env })
    expect(restored.sections[0].blocks[0].content).toEqual(block.content)
    await expect(proposeTopicSeries({ series_id: series.id, expected_version: 3, clarifications: clarification, assumptions: [], exclusions: [], lessons: [lesson()] }, env)).rejects.toThrow('approved')
  })

  it('rejects unsupported references and prevents missing objectives or incomplete reviews from becoming ready', async () => {
    const env = environment(), series = await createTopicSeries({ ...request, research_mode: 'knowledge_research' }, env)
    const base = { series_id: series.id, expected_version: 1, clarifications: clarification, assumptions: [], exclusions: [] }
    await expect(proposeTopicSeries({ ...base, lessons: [{ ...lesson(), references: [{ id: 'bad', kind: 'web', title: 'Bad link', url: 'javascript:alert(1)', accessed_at: '2026-09-20', locator: 'Test', support: 'Synthetic data' }] }] }, env)).rejects.toThrow('HTTPS')
    const proposed = await proposeTopicSeries({ ...base, lessons: [{ ...lesson(), references: [{ id: 'ref', kind: 'web', title: 'Synthetic test reference', url: 'https://example.org/evidence', accessed_at: '2026-09-20', locator: 'Test section', support: 'A structural test, not a claim of actual inspection.' }] }] }, env)
    await approveTopicSeries(series.id, proposed.version, env)
    const block = { block_id: 'a', provenance: 'added_explanation' as const, source_element_ids: [], content: { kind: 'prose' as const, text: 'An explanation.' } }
    const patch = { plan_id: proposed.plan_ids[0], expected_version: null, operations: [{ operation: 'insert_block' as const, section_id: 'evidence', after_block_id: null, block }] }
    await expect(applyLessonPatch(patch, { environment: env })).rejects.toThrow('objectives')
    const draft = await applyLessonPatch({ ...patch, operations: [{ ...patch.operations[0], block: { ...block, objective_ids: ['interpret'] } }] }, { environment: env })
    await expect(finalizeLesson(draft.lesson_id, 1, { reviewer: 'Test', summary: 'No review supplied' }, { environment: env })).rejects.toThrow('coverage_review')
  })

  it('retains folder-contained topic data in portable snapshots and after folder removal', async () => {
    const env = environment(), folder = await saveSourceFolder('History', undefined, env)
    const series = await createTopicSeries({ ...request, folder_id: folder.id }, env)
    const records = await accessBrowserVault(db => snapshotVaultRecords(db), env)
    expect(records.some(record => record.store === 'topic_series' && record.key === series.id)).toBe(true)
    const proposed = await proposeTopicSeries({ series_id: series.id, expected_version: 1, clarifications: clarification, assumptions: [], exclusions: [], lessons: [lesson()] }, env)
    await updateTopicRequest(series.id, proposed.version, { ...request, title: 'Revised request' }, env)
    expect(await getLessonPlan(proposed.plan_ids[0], env)).toBeUndefined()
    expect((await getTopicSeries(series.id, env)).status).toBe('clarifying')
    await deleteSourceFolder(folder.id, env)
    expect((await getTopicSeries(series.id, env)).folder_id).toBeNull()
    expect((await getTopicSeries(series.id, env)).request).toBe(request.request)
  })
})

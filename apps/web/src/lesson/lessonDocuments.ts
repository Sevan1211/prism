import {
  accessBrowserVault,
  PRISM_VAULT_CHANGED_EVENT,
  PRISM_VAULT_LESSON_DOCUMENT_STORE,
  PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
  PRISM_VAULT_LESSON_EDIT_STORE,
  type BrowserVaultEnvironment,
} from '../storage/browserVault'
import { readBrowserSourceBundle } from '../storage/browserSources'
import { getLessonPlan } from './lessonPlans'
import type {
  ApplyLessonPatchInput,
  LessonBlockContent,
  LessonContentBlock,
  LessonDocument,
  LessonDocumentSection,
  LessonPatchOperation,
  LessonValidationIssue,
  LessonValidationReport,
  LessonEditProposal,
} from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'
import { normalizeVisual } from './lessonVisuals'
import { getLessonIllustration } from '../storage/lessonIllustrations'

const MAX_PATCH_OPERATIONS = 24
const MAX_BLOCKS_PER_SECTION = 64
const MAX_TOTAL_BLOCKS = 256

export interface LessonDocumentDependencies {
  environment?: BrowserVaultEnvironment
  now?: () => string
  randomUUID?: () => string
}

export async function applyLessonPatch(
  input: ApplyLessonPatchInput,
  dependencies: LessonDocumentDependencies = {},
): Promise<LessonDocument> {
  const current = await getLessonDocumentByPlan(input.plan_id, dependencies.environment)
  let fingerprint: string | undefined
  if (input.request_id !== undefined) {
    identifier(input.request_id, 'request_id')
    const bytes = new TextEncoder().encode(JSON.stringify({ plan_id: input.plan_id, expected_version: input.expected_version, operations: input.operations }))
    fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('')
    const previous = current && current.document_version > (input.expected_version ?? 0)
      ? await getLessonDocumentRevision(current.lesson_id, (input.expected_version ?? 0) + 1, dependencies.environment)
      : undefined
    if (previous?.patch_receipt?.request_id === input.request_id) {
      if (previous.patch_receipt.fingerprint !== fingerprint) throw new Error('This request_id was already used for different lesson content.')
      return previous
    }
  }
  if (current?.status === 'ready') throw new Error('This lesson is ready for reading. Use propose_lesson_revision so the learner can review and accept changes.')
  const candidate = await prepareLessonPatch(input, dependencies)
  candidate.patch_receipt = input.request_id && fingerprint ? { request_id: input.request_id, fingerprint } : undefined
  await saveLessonDocument(candidate, input.expected_version, dependencies.environment)
  notifyVaultChanged()
  return candidate
}

async function prepareLessonPatch(input: ApplyLessonPatchInput, dependencies: LessonDocumentDependencies): Promise<LessonDocument> {
  const plan = await getLessonPlan(input.plan_id, dependencies.environment)
  if (!plan) throw new Error('This lesson plan no longer exists.')
  if (plan.status !== 'approved' || !plan.approval_hash) {
    throw new Error('The learner must approve this lesson plan before composition begins.')
  }
  if (!Array.isArray(input.operations) || input.operations.length < 1) {
    throw new Error('A lesson patch requires at least one typed operation.')
  }
  if (input.operations.length > MAX_PATCH_OPERATIONS) {
    throw new Error(`A lesson patch supports at most ${MAX_PATCH_OPERATIONS} operations.`)
  }

  const current = await getLessonDocumentByPlan(plan.plan_id, dependencies.environment)
  assertExpectedVersion(current, input.expected_version)
  const timestamp = (dependencies.now ?? currentTime)()
  const draft = current
    ? structuredClone(current)
    : newLessonDocument(plan, timestamp, dependencies.randomUUID ?? randomUUID)
  for (const operation of input.operations) applyOperation(draft, operation)
  assertDocumentBounds(draft)
  assertPlanGrounding(draft, plan)

  const nextVersion = (current?.document_version ?? 0) + 1
  const candidate: LessonDocument = {
    ...draft,
    status: 'draft',
    semantic_review: undefined,
    document_version: nextVersion,
    updated_at: timestamp,
    validation: await validateDocument(draft, plan, dependencies.environment, timestamp),
  }
  return candidate
}

export async function finalizeLesson(lessonId: string, expectedVersion: number, review: { summary: string; reviewer: string }, dependencies: LessonDocumentDependencies = {}): Promise<LessonDocument> {
  const current = await getLessonDocument(lessonId, dependencies.environment)
  assertExpectedVersion(current, expectedVersion)
  if (!current) throw new Error('Lesson not found.')
  const validation = await validateLesson(lessonId, dependencies)
  if (!validation.valid_for_ready) throw new Error('Resolve the structural validation errors before finishing the lesson.')
  const timestamp = (dependencies.now ?? currentTime)()
  const candidate: LessonDocument = { ...current, status: 'ready', document_version: expectedVersion + 1, updated_at: timestamp, validation, semantic_review: { summary: requiredText(review.summary, 'semantic review summary', 4000), reviewer: requiredText(review.reviewer, 'reviewer', 120), reviewed_at: timestamp } }
  await saveLessonDocument(candidate, expectedVersion, dependencies.environment)
  notifyVaultChanged()
  return candidate
}

export async function proposeLessonRevision(input: ApplyLessonPatchInput & { summary: string }, dependencies: LessonDocumentDependencies = {}): Promise<LessonEditProposal> {
  const candidate = await prepareLessonPatch(input, dependencies)
  if (input.expected_version === null) throw new Error('Create the initial lesson before proposing a revision.')
  if (!candidate.validation.valid_for_ready) throw new Error('The proposed revision must preserve required evidence, representations, and complete sections.')
  const proposal: LessonEditProposal = { proposal_id: `edit_${(dependencies.randomUUID ?? randomUUID)()}`, lesson_id: candidate.lesson_id, source_id: candidate.source_id, plan_id: candidate.plan_id, base_version: input.expected_version, candidate, summary: requiredText(input.summary, 'revision summary', 2000), created_at: candidate.updated_at }
  await accessBrowserVault((database) => new Promise<void>((resolve, reject) => {
    const tx = database.transaction([PRISM_VAULT_LESSON_EDIT_STORE, PRISM_VAULT_LESSON_DOCUMENT_STORE], 'readwrite')
    const read = tx.objectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE).get(candidate.lesson_id)
    let failure: Error | undefined
    read.onsuccess = () => {
      if (read.result?.document_version !== input.expected_version) { failure = new Error('The lesson changed while the revision was being prepared.'); tx.abort(); return }
      tx.objectStore(PRISM_VAULT_LESSON_EDIT_STORE).add(proposal)
    }
    tx.oncomplete = () => resolve()
    tx.onabort = tx.onerror = () => reject(failure ?? new Error('A revision is already awaiting review, or the save failed. Resolve the current proposal before creating another.'))
  }), dependencies.environment)
  notifyVaultChanged()
  return proposal
}

export function getLessonEditProposal(lessonId: string, environment?: BrowserVaultEnvironment): Promise<LessonEditProposal | undefined> {
  return accessBrowserVault((db) => getRecordByKey(db, PRISM_VAULT_LESSON_EDIT_STORE, lessonId), environment)
}

// Learner-only decision; deliberately not registered as an agent tool.
export async function resolveLessonRevision(lessonId: string, proposalId: string, accept: boolean, environment?: BrowserVaultEnvironment): Promise<void> {
  await accessBrowserVault((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction([PRISM_VAULT_LESSON_EDIT_STORE, PRISM_VAULT_LESSON_DOCUMENT_STORE, PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE], 'readwrite')
    const proposals = tx.objectStore(PRISM_VAULT_LESSON_EDIT_STORE)
    const read = proposals.get(lessonId)
    let failure: Error | undefined
    read.onsuccess = () => {
      const proposal = read.result as LessonEditProposal | undefined
      if (!proposal || proposal.proposal_id !== proposalId) { failure = new Error('This revision proposal is no longer current.'); tx.abort(); return }
      if (!accept) { proposals.delete(lessonId); return }
      const documents = tx.objectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE)
      const current = documents.get(lessonId)
      current.onsuccess = () => {
        if (current.result?.document_version !== proposal.base_version) { failure = new Error('The lesson changed. Dismiss this stale proposal and ask your agent to update it.'); tx.abort(); return }
        const document: LessonDocument = { ...proposal.candidate, status: 'ready', updated_at: currentTime(), semantic_review: { summary: proposal.summary, reviewed_at: proposal.created_at, reviewer: 'External agent revision' } }
        documents.put(document)
        tx.objectStore(PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE).add(document)
        proposals.delete(lessonId)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onabort = tx.onerror = () => reject(failure ?? tx.error ?? new Error('The revision decision could not be saved.'))
  }), environment)
  notifyVaultChanged()
}

export function getLessonDocument(
  lessonId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonDocument | undefined> {
  return accessBrowserVault((database) => getRecordByKey(
    database,
    PRISM_VAULT_LESSON_DOCUMENT_STORE,
    lessonId,
  ), environment)
}

export function getLessonDocumentByPlan(
  planId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonDocument | undefined> {
  return accessBrowserVault((database) => getRecordByIndex(
    database,
    PRISM_VAULT_LESSON_DOCUMENT_STORE,
    'plan_id',
    planId,
  ), environment)
}

export function getLessonDocumentRevision(
  lessonId: string,
  documentVersion: number,
  environment?: BrowserVaultEnvironment,
): Promise<LessonDocument | undefined> {
  return accessBrowserVault((database) => getRecordByKey(
    database,
    PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
    [lessonId, documentVersion],
  ), environment)
}

// Learner-only recovery action: creates a new revision and keeps the complete
// history. Deliberately not registered as an agent tool.
export async function restoreLessonRevision(lessonId: string, version: number, expectedVersion: number, dependencies: LessonDocumentDependencies = {}): Promise<LessonDocument> {
  const [current, previous] = await Promise.all([getLessonDocument(lessonId, dependencies.environment), getLessonDocumentRevision(lessonId, version, dependencies.environment)])
  assertExpectedVersion(current, expectedVersion)
  if (!current || !previous || previous.plan_id !== current.plan_id || previous.approval_hash !== current.approval_hash) throw new Error('This revision does not belong to the current approved lesson.')
  const plan = await getLessonPlan(current.plan_id, dependencies.environment)
  if (!plan || plan.status !== 'approved' || plan.approval_hash !== previous.approval_hash) throw new Error('The approved plan is no longer available.')
  const timestamp = (dependencies.now ?? currentTime)()
  const restored = { ...structuredClone(previous), document_version: expectedVersion + 1, updated_at: timestamp }
  assertPlanGrounding(restored, plan)
  restored.validation = await validateDocument(restored, plan, dependencies.environment, timestamp)
  await saveLessonDocument(restored, expectedVersion, dependencies.environment)
  notifyVaultChanged()
  return restored
}

export function listLessonDocumentRevisions(
  lessonId: string,
  environment?: BrowserVaultEnvironment,
): Promise<LessonDocument[]> {
  return accessBrowserVault((database) => getRecordsByIndex<LessonDocument>(
    database,
    PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
    'lesson_id',
    lessonId,
    environment,
  ).then((documents) => documents.sort(
    (left, right) => left.document_version - right.document_version,
  )), environment)
}

export async function validateLesson(
  lessonId: string,
  dependencies: Pick<LessonDocumentDependencies, 'environment' | 'now'> = {},
): Promise<LessonValidationReport> {
  const document = await getLessonDocument(lessonId, dependencies.environment)
  if (!document) throw new Error('This lesson document no longer exists.')
  const plan = await getLessonPlan(document.plan_id, dependencies.environment)
  if (!plan) throw new Error('The approved lesson plan no longer exists.')
  return validateDocument(
    document,
    plan,
    dependencies.environment,
    (dependencies.now ?? currentTime)(),
  )
}

function newLessonDocument(
  plan: LessonPlan,
  timestamp: string,
  createId: () => string,
): LessonDocument {
  if (!plan.approval_hash) throw new Error('The approved lesson plan is missing its fingerprint.')
  return {
    approval_hash: plan.approval_hash,
    created_at: timestamp,
    document_version: 0,
    end_questions: plan.end_questions,
    lesson_id: `lesson_${createId()}`,
    plan_id: plan.plan_id,
    plan_version: plan.plan_version,
    record_version: 1,
    sections: plan.sections.map((section) => ({
      blocks: [],
      objective_ids: section.objective_ids,
      section_id: section.section_id,
      title: section.title,
    })),
    source_hash: plan.source_hash,
    source_id: plan.source_id,
    status: 'draft',
    title: plan.title,
    updated_at: timestamp,
    validation: emptyValidation(timestamp, plan.sections.length),
  }
}

function applyOperation(document: LessonDocument, raw: LessonPatchOperation): void {
  if (!raw || typeof raw !== 'object') throw new Error('Each lesson operation must be an object.')
  if (raw.operation === 'insert_block') {
    const section = requiredSection(document, raw.section_id)
    const block = normalizeBlock(raw.block)
    if (findBlock(document, block.block_id)) throw new Error(`Block ${block.block_id} already exists.`)
    insertAfter(section.blocks, block, raw.after_block_id)
    return
  }
  if (raw.operation === 'replace_block') {
    const match = findBlock(document, raw.block_id)
    if (!match) throw new Error(`Block ${raw.block_id} does not exist.`)
    const block = normalizeBlock(raw.block)
    if (block.block_id !== raw.block_id) throw new Error('A replacement must preserve block_id.')
    match.section.blocks[match.index] = block
    return
  }
  if (raw.operation === 'remove_block') {
    const match = findBlock(document, raw.block_id)
    if (!match) throw new Error(`Block ${raw.block_id} does not exist.`)
    match.section.blocks.splice(match.index, 1)
    return
  }
  if (raw.operation === 'move_block') {
    const match = findBlock(document, raw.block_id)
    if (!match) throw new Error(`Block ${raw.block_id} does not exist.`)
    const [block] = match.section.blocks.splice(match.index, 1)
    insertAfter(requiredSection(document, raw.section_id).blocks, block, raw.after_block_id)
    return
  }
  throw new Error('The lesson patch contains an unsupported operation.')
}

function insertAfter(
  blocks: LessonContentBlock[],
  block: LessonContentBlock,
  afterBlockId: string | null,
): void {
  if (afterBlockId === null) {
    blocks.push(block)
    return
  }
  const position = blocks.findIndex((candidate) => candidate.block_id === afterBlockId)
  if (position < 0) throw new Error(`after_block_id ${afterBlockId} does not exist in the section.`)
  blocks.splice(position + 1, 0, block)
}

function normalizeBlock(input: unknown): LessonContentBlock {
  const block = objectValue(input, 'block')
  const provenance = requiredText(block.provenance, 'block provenance', 40)
  if (!['source_authored', 'source_grounded', 'added_explanation'].includes(provenance)) {
    throw new Error('Block provenance is invalid.')
  }
  const sourceElementIds = uniqueIdentifiers(block.source_element_ids, 'source_element_ids', 12)
  return {
    block_id: identifier(block.block_id, 'block_id'),
    content: normalizeContent(block.content),
    provenance: provenance as LessonContentBlock['provenance'],
    source_element_ids: sourceElementIds,
  }
}

function normalizeContent(input: unknown): LessonBlockContent {
  const content = objectValue(input, 'block content')
  const kind = requiredText(content.kind, 'content kind', 40)
  if (kind === 'visual_scene' || kind === 'data_plot') return normalizeVisual(content)
  if (kind === 'prose') {
    return { kind, text: requiredText(content.text, 'prose text', 6_000) }
  }
  if (kind === 'rich_text') {
    return { kind, markdown: requiredText(content.markdown, 'Markdown text', 12_000, false) }
  }
  if (kind === 'illustration') return { kind, asset_id: requiredText(content.asset_id, 'illustration asset_id', 240), alt: requiredText(content.alt, 'illustration description', 1200), caption: requiredText(content.caption, 'illustration caption', 600) }
  if (kind === 'source_figure') {
    const bbox = content.bbox
    if (!Array.isArray(bbox) || bbox.length !== 4
      || bbox.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)
      || bbox[2] <= bbox[0] || bbox[3] <= bbox[1]) {
      throw new Error('A source figure requires a nonempty normalized page region.')
    }
    return {
      kind,
      page_number: boundedNumber(content.page_number, 'figure page', 1, 100_000, true),
      bbox: bbox as [number, number, number, number],
      alt: requiredText(content.alt, 'figure description', 1_200),
      caption: requiredText(content.caption, 'figure caption', 600),
    }
  }
  if (kind === 'network_delay') {
    return {
      kind,
      caption: requiredText(content.caption, 'model caption', 600),
      packet_bytes: boundedNumber(content.packet_bytes, 'packet bytes', 1, 1_000_000, true),
      link_mbps: boundedNumber(content.link_mbps, 'link rate', 0.1, 100_000),
      propagation_ms: boundedNumber(content.propagation_ms, 'propagation delay', 0, 10_000),
    }
  }
  if (kind === 'definition') {
    return {
      definition: requiredText(content.definition, 'definition', 3_000),
      kind,
      term: requiredText(content.term, 'definition term', 180),
    }
  }
  if (kind === 'source_excerpt') {
    return { kind, text: requiredText(content.text, 'source excerpt', 4_000) }
  }
  if (kind === 'callout') {
    const tone = requiredText(content.tone, 'callout tone', 20)
    if (!['note', 'warning', 'boundary'].includes(tone)) throw new Error('Callout tone is invalid.')
    return {
      kind,
      text: requiredText(content.text, 'callout text', 3_000),
      tone: tone as 'note' | 'warning' | 'boundary',
    }
  }
  if (kind === 'equation') {
    return {
      explanation: requiredText(content.explanation, 'equation explanation', 3_000),
      kind,
      latex: requiredText(content.latex, 'equation LaTeX', 2_000),
    }
  }
  if (kind === 'code') {
    return {
      code: requiredText(content.code, 'code', 12_000, false),
      explanation: requiredText(content.explanation, 'code explanation', 3_000),
      kind,
      language: requiredText(content.language, 'code language', 40),
    }
  }
  if (kind === 'worked_example') {
    return {
      kind,
      prompt: requiredText(content.prompt, 'worked example prompt', 2_000),
      result: requiredText(content.result, 'worked example result', 2_000),
      steps: textArray(content.steps, 'worked example steps', 24, 1_500, 1),
    }
  }
  if (kind === 'table') {
    const columns = textArray(content.columns, 'table columns', 8, 120, 1)
    if (!Array.isArray(content.rows) || content.rows.length < 1 || content.rows.length > 30) {
      throw new Error('A table requires 1 to 30 rows.')
    }
    const rows = content.rows.map((row, rowIndex) => {
      const cells = textArray(row, `table row ${rowIndex + 1}`, 8, 500, columns.length)
      if (cells.length !== columns.length) throw new Error('Every table row must match the column count.')
      return cells
    })
    return {
      caption: requiredText(content.caption, 'table caption', 300),
      columns,
      kind,
      rows,
    }
  }
  if (kind === 'diagram') {
    if (!Array.isArray(content.nodes) || content.nodes.length < 1 || content.nodes.length > 32) {
      throw new Error('A diagram requires 1 to 32 nodes.')
    }
    const nodes = content.nodes.map((rawNode) => {
      const node = objectValue(rawNode, 'diagram node')
      return {
        label: requiredText(node.label, 'diagram node label', 180),
        node_id: identifier(node.node_id, 'diagram node_id'),
      }
    })
    assertUnique(nodes.map((node) => node.node_id), 'diagram node_id')
    const nodeIds = new Set(nodes.map((node) => node.node_id))
    if (!Array.isArray(content.edges) || content.edges.length > 64) {
      throw new Error('A diagram supports at most 64 edges.')
    }
    const edges = content.edges.map((rawEdge) => {
      const edge = objectValue(rawEdge, 'diagram edge')
      const from = identifier(edge.from, 'diagram edge from')
      const to = identifier(edge.to, 'diagram edge to')
      if (!nodeIds.has(from) || !nodeIds.has(to)) throw new Error('Diagram edges must reference existing nodes.')
      return { from, label: optionalText(edge.label, 'diagram edge label', 120), to }
    })
    return {
      caption: requiredText(content.caption, 'diagram caption', 300),
      edges,
      kind,
      nodes,
    }
  }
  if (kind === 'animation') {
    if (!Array.isArray(content.steps) || content.steps.length < 2 || content.steps.length > 20) {
      throw new Error('An animation requires 2 to 20 declarative steps.')
    }
    const steps = content.steps.map((rawStep) => {
      const step = objectValue(rawStep, 'animation step')
      return {
        description: requiredText(step.description, 'animation step description', 1_000),
        label: requiredText(step.label, 'animation step label', 120),
        step_id: identifier(step.step_id, 'animation step_id'),
      }
    })
    assertUnique(steps.map((step) => step.step_id), 'animation step_id')
    return {
      caption: requiredText(content.caption, 'animation caption', 300),
      kind,
      steps,
    }
  }
  if (kind === 'summary') {
    return { kind, points: textArray(content.points, 'summary points', 12, 700, 1) }
  }
  throw new Error(`Unsupported lesson block kind ${kind}.`)
}

function boundedNumber(value: unknown, label: string, minimum: number, maximum: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum
    || (integer && !Number.isInteger(value))) throw new Error(`${label} must be between ${minimum} and ${maximum}.`)
  return value
}

async function validateDocument(
  document: LessonDocument,
  plan: LessonPlan,
  environment: BrowserVaultEnvironment | undefined,
  checkedAt: string,
): Promise<LessonValidationReport> {
  const errors: LessonValidationIssue[] = []
  const warnings: LessonValidationIssue[] = []
  const planSections = new Map(plan.sections.map((section) => [section.section_id, section]))
  const documentSections = new Map(document.sections.map((section) => [section.section_id, section]))

  if (document.approval_hash !== plan.approval_hash) {
    errors.push(issue('approval_fingerprint_mismatch', 'The lesson no longer matches the learner-approved plan.'))
  }
  for (const section of plan.sections) {
    const draftSection = documentSections.get(section.section_id)
    if (!draftSection) {
      errors.push(issue('missing_section', `Planned section ${section.section_id} is missing.`, section.section_id))
      continue
    }
    if (draftSection.blocks.length === 0) {
      errors.push(issue('empty_section', `Section ${section.section_id} has no lesson blocks.`, section.section_id))
    }
    const cited = new Set(draftSection.blocks.flatMap((block) => block.source_element_ids))
    for (const elementId of section.source_element_ids) {
      if (!cited.has(elementId)) {
        errors.push(issue(
          'planned_evidence_not_used',
          `Section ${section.section_id} does not use planned evidence ${elementId}.`,
          section.section_id,
        ))
      }
    }
    const representedKinds = new Set(draftSection.blocks.map((block) => block.content.kind))
    if (representedKinds.has('rich_text')) representedKinds.add('prose')
    if (representedKinds.has('network_delay')) representedKinds.add('animation')
    if (representedKinds.has('visual_scene')) { representedKinds.add('diagram'); representedKinds.add('animation') }
    if (representedKinds.has('data_plot')) representedKinds.add('table')
    if (!representedKinds.has('prose') && !representedKinds.has('source_excerpt')) {
      warnings.push(issue('explanation_not_present', 'This section has no explanatory prose. Structural checks do not establish teaching quality.', section.section_id))
    }
    for (const intent of section.representation_intents) {
      const expectedKind = representationKind(intent)
      if (expectedKind && !representedKinds.has(expectedKind)) {
        errors.push(issue(
          'planned_representation_missing',
          `Section ${section.section_id} does not yet include its planned ${intent} representation.`,
          section.section_id,
        ))
      }
      if (!expectedKind) {
        errors.push(issue(
          'representation_not_in_composition_slice',
          `${intent} is planned but does not yet have a typed renderer in this composition slice.`,
          section.section_id,
        ))
      }
    }
  }
  for (const section of document.sections) {
    if (!planSections.has(section.section_id)) {
      errors.push(issue('unapproved_section', `Section ${section.section_id} is outside the approved plan.`, section.section_id))
    }
    for (const block of section.blocks) validateBlockProvenance(block, section, errors)
  }

  await validateSourceExcerpts(document, environment, errors)
  const images = document.sections.flatMap(section => section.blocks.filter(block => block.content.kind === 'illustration').map(block => ({ section, block })))
  await Promise.all(images.map(async ({ section, block }) => {
    if (block.content.kind !== 'illustration') return
    const image = await getLessonIllustration(block.content.asset_id, document.source_id, environment)
    if (!image) errors.push(issue('illustration_missing', 'Import this illustration into the same source before using it.', section.section_id, block.block_id))
  }))
  const blockCount = document.sections.reduce((sum, section) => sum + section.blocks.length, 0)
  return {
    block_count: blockCount,
    checked_at: checkedAt,
    errors,
    section_count: document.sections.length,
    valid_for_ready: errors.length === 0,
    warnings,
  }
}

function validateBlockProvenance(
  block: LessonContentBlock,
  section: LessonDocumentSection,
  errors: LessonValidationIssue[],
): void {
  if (block.content.kind === 'source_excerpt' && block.provenance !== 'source_authored') {
    errors.push(issue(
      'excerpt_provenance_invalid',
      'A source excerpt must be labeled source_authored.',
      section.section_id,
      block.block_id,
    ))
  }
  if (!['source_excerpt', 'source_figure'].includes(block.content.kind) && block.provenance === 'source_authored') {
    errors.push(issue(
      'source_authored_kind_invalid',
      'Only an exact source excerpt or original page region can be labeled source_authored.',
      section.section_id,
      block.block_id,
    ))
  }
  if (block.content.kind === 'source_figure' && block.provenance !== 'source_authored') {
    errors.push(issue('figure_provenance_invalid', 'A source figure is an original page region; its description is agent-added.', section.section_id, block.block_id))
  }
  if (block.content.kind === 'network_delay' && block.provenance !== 'added_explanation') {
    errors.push(issue('model_provenance_invalid', 'Interactive models are added teaching explanations, not source-authored experiments.', section.section_id, block.block_id))
  }
  if (block.content.kind === 'illustration' && block.provenance !== 'added_explanation') errors.push(issue('illustration_provenance_invalid', 'AI-generated illustrations must be labeled added_explanation. They are never source evidence.', section.section_id, block.block_id))
  if (block.provenance !== 'added_explanation' && block.source_element_ids.length === 0) {
    errors.push(issue(
      'grounding_required',
      'Source-authored and source-grounded blocks require source element ids.',
      section.section_id,
      block.block_id,
    ))
  }
}

async function validateSourceExcerpts(
  document: LessonDocument,
  environment: BrowserVaultEnvironment | undefined,
  errors: LessonValidationIssue[],
): Promise<void> {
  const excerpts = document.sections.flatMap((section) => section.blocks
    .filter((block) => block.content.kind === 'source_excerpt')
    .map((block) => ({ block, sectionId: section.section_id })))
  const ids = [...new Set(excerpts.flatMap(({ block }) => block.source_element_ids))]
  const sourceText = new Map<string, string>()
  for (let start = 0; start < ids.length; start += 12) {
    const bundle = await readBrowserSourceBundle(
      document.source_id,
      ids.slice(start, start + 12),
      0,
      environment,
    )
    for (const element of bundle.elements) {
      if (element.anchor.element_id) sourceText.set(element.anchor.element_id, element.text)
    }
  }
  for (const { block, sectionId } of excerpts) {
    if (block.content.kind !== 'source_excerpt') continue
    const evidence = block.source_element_ids.map((id) => sourceText.get(id) ?? '').join(' ')
    if (!normalizeForComparison(evidence).includes(normalizeForComparison(block.content.text))) {
      errors.push(issue(
        'source_excerpt_not_verbatim',
        'The source excerpt is not verbatim within its cited elements.',
        sectionId,
        block.block_id,
      ))
    }
  }
}

function assertPlanGrounding(document: LessonDocument, plan: LessonPlan): void {
  const planSections = new Map(plan.sections.map((section) => [section.section_id, section]))
  for (const section of document.sections) {
    const approved = planSections.get(section.section_id)
    if (!approved) throw new Error(`Section ${section.section_id} is outside the approved plan.`)
    const allowed = new Set(approved.source_element_ids)
    for (const block of section.blocks) {
      if (block.content.kind === 'source_figure') {
        const page = block.content.page_number
        if (page < plan.page_start || page > plan.page_end
          || !block.source_element_ids.some((id) => id.includes(`:page:${page}:`))) {
          throw new Error('A source figure must cite evidence on its page inside the approved range.')
        }
      }
      for (const elementId of block.source_element_ids) {
        if (!allowed.has(elementId)) {
          throw new Error(`Block ${block.block_id} cites evidence outside its approved section.`)
        }
      }
    }
  }
}

function assertDocumentBounds(document: LessonDocument): void {
  const blockIds: string[] = []
  let total = 0
  for (const section of document.sections) {
    if (section.blocks.length > MAX_BLOCKS_PER_SECTION) {
      throw new Error(`Section ${section.section_id} exceeds ${MAX_BLOCKS_PER_SECTION} blocks.`)
    }
    total += section.blocks.length
    blockIds.push(...section.blocks.map((block) => block.block_id))
  }
  if (total > MAX_TOTAL_BLOCKS) throw new Error(`A lesson supports at most ${MAX_TOTAL_BLOCKS} blocks.`)
  assertUnique(blockIds, 'block_id')
}

function representationKind(intent: LessonPlan['sections'][number]['representation_intents'][number]): LessonBlockContent['kind'] | null {
  const mapping: Partial<Record<typeof intent, LessonBlockContent['kind']>> = {
    analogy: 'prose',
    animation: 'animation',
    code: 'code',
    equation: 'equation',
    generated_diagram: 'diagram',
    visual_scene: 'visual_scene',
    data_plot: 'data_plot',
    source_excerpt: 'source_excerpt',
    source_figure: 'source_figure',
    table: 'table',
    worked_example: 'worked_example',
  }
  return mapping[intent] ?? null
}

function requiredSection(document: LessonDocument, sectionId: string): LessonDocumentSection {
  const normalized = identifier(sectionId, 'section_id')
  const section = document.sections.find((candidate) => candidate.section_id === normalized)
  if (!section) throw new Error(`Section ${normalized} is outside the approved plan.`)
  return section
}

function findBlock(document: LessonDocument, blockId: string): {
  index: number
  section: LessonDocumentSection
} | null {
  const normalized = identifier(blockId, 'block_id')
  for (const section of document.sections) {
    const index = section.blocks.findIndex((block) => block.block_id === normalized)
    if (index >= 0) return { index, section }
  }
  return null
}

function assertExpectedVersion(current: LessonDocument | undefined, expected: number | null): void {
  if (!current && expected !== null) throw new Error('No lesson document exists at the expected version.')
  if (current && expected !== current.document_version) {
    throw new Error('This lesson changed before the patch was applied. Read the current version first.')
  }
}

function saveLessonDocument(
  document: LessonDocument,
  expectedVersion: number | null,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  return accessBrowserVault((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_LESSON_DOCUMENT_STORE, PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE],
      'readwrite',
    )
    const store = transaction.objectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE)
    const request = store.index('plan_id').get(document.plan_id)
    let failure: Error | null = null
    request.onsuccess = () => {
      const current = request.result as LessonDocument | undefined
      const matches = current
        ? current.document_version === expectedVersion
        : expectedVersion === null
      if (!matches) {
        failure = new Error('This lesson changed before the patch was applied. Read the current version first.')
        transaction.abort()
        return
      }
      store.put(document)
      transaction.objectStore(PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE).add(document)
    }
    request.onerror = () => {
      failure = request.error ?? new Error('The current lesson document could not be read.')
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The lesson document could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The lesson document save was interrupted.'),
    )
  }), environment)
}

function getRecordByKey<T>(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The lesson document could not be read.'))
  })
}

function getRecordByIndex<T>(
  database: IDBDatabase,
  storeName: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(storeName, 'readonly')
      .objectStore(storeName)
      .index(indexName)
      .get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The lesson document could not be read.'))
  })
}

function getRecordsByIndex<T>(
  database: IDBDatabase,
  storeName: string,
  indexName: string,
  key: IDBValidKey,
  environment?: BrowserVaultEnvironment,
): Promise<T[]> {
  const keyRange = environment?.keyRange
    ?? (typeof IDBKeyRange === 'undefined' ? undefined : IDBKeyRange)
  if (!keyRange) return Promise.reject(new Error('IndexedDB key ranges are unavailable.'))
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(storeName, 'readonly')
      .objectStore(storeName)
      .index(indexName)
      .getAll(keyRange.only(key))
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('Lesson revisions could not be read.'))
  })
}

function issue(
  code: string,
  message: string,
  sectionId: string | null = null,
  blockId: string | null = null,
): LessonValidationIssue {
  return { block_id: blockId, code, message, section_id: sectionId }
}

function emptyValidation(checkedAt: string, sectionCount: number): LessonValidationReport {
  return {
    block_count: 0,
    checked_at: checkedAt,
    errors: [],
    section_count: sectionCount,
    valid_for_ready: false,
    warnings: [],
  }
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function textArray(
  value: unknown,
  label: string,
  maximum: number,
  maxLength: number,
  minimum = 0,
): string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${label} must contain ${minimum} to ${maximum} items.`)
  }
  return value.map((item) => requiredText(item, label, maxLength))
}

function uniqueIdentifiers(value: unknown, label: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${label} is invalid.`)
  const identifiers = value.map((item) => identifier(item, label))
  assertUnique(identifiers, label)
  return identifiers
}

function identifier(value: unknown, label: string): string {
  const normalized = requiredText(value, label, 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(normalized)) {
    throw new Error(`${label} contains unsupported characters.`)
  }
  return normalized
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
  collapseWhitespace = true,
): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`)
  const cleaned = Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 && character !== '\n' && character !== '\t' || code === 127 ? ' ' : character
  }).join('')
  const normalized = collapseWhitespace ? cleaned.replace(/\s+/g, ' ').trim() : cleaned.trim()
  if (!normalized) throw new Error(`${label} is required.`)
  if (normalized.length > maxLength) throw new Error(`${label} exceeds ${maxLength} characters.`)
  return normalized
}

function optionalText(value: unknown, label: string, maxLength: number): string {
  if (value === null || value === undefined || value === '') return ''
  return requiredText(value, label, maxLength)
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} values must be unique.`)
}

function normalizeForComparison(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim()
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

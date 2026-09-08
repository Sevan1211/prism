import type { LessonCoverageReview, LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

export const coverageReviewSchema = {
  type: 'array', minItems: 1, maxItems: 256,
  items: {
    type: 'object', additionalProperties: false,
    properties: {
      concept: { type: 'string', minLength: 1, maxLength: 240 },
      source_element_ids: { type: 'array', minItems: 1, maxItems: 128, uniqueItems: true, items: { type: 'string' } },
      block_ids: { type: 'array', minItems: 1, maxItems: 64, uniqueItems: true, items: { type: 'string' } },
      retained_details: { type: 'string', minLength: 20, maxLength: 2000 },
    },
    required: ['concept', 'source_element_ids', 'block_ids', 'retained_details'],
  },
}

export function validateCoverageReview(value: unknown, document: LessonDocument, plan: LessonPlan, complete = true): LessonCoverageReview[] {
  if (!Array.isArray(value) || !value.length || value.length > 256) throw new Error('Provide a coverage_review mapping source concepts to the passages that teach them.')
  const blocks = new Map(document.sections.flatMap(section => section.blocks.map(block => [block.block_id, block] as const)))
  const planned = new Set(plan.sections.flatMap(section => section.source_element_ids))
  const covered = new Set<string>()
  const reviewedBlocks = new Set<string>()
  const text = (input: unknown, name: string, min: number, max: number) => {
    if (typeof input !== 'string' || input.trim().length < min || input.length > max) throw new Error(`Coverage review ${name} must contain ${min}–${max} characters.`)
    return input.trim()
  }
  const ids = (input: unknown, max: number): string[] => {
    if (!Array.isArray(input) || !input.length || input.length > max || input.some(id => typeof id !== 'string') || new Set(input).size !== input.length) throw new Error('Coverage review needs bounded, unique source and block identifiers.')
    return input
  }
  const review = value.map((entry: Partial<LessonCoverageReview> | null) => {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid coverage review entry.')
    const sourceIds = ids(entry.source_element_ids, 128)
    const blockIds = ids(entry.block_ids, 64)
    for (const id of blockIds) {
      const block = blocks.get(id)
      if (!block || !sourceIds.some(sourceId => block.source_element_ids.includes(sourceId))) throw new Error(`Coverage review block ${id} must exist and cite its mapped evidence.`)
      reviewedBlocks.add(id)
    }
    for (const id of sourceIds) {
      if (!planned.has(id) || !blockIds.some(blockId => blocks.get(blockId)?.source_element_ids.includes(id))) throw new Error(`Coverage review evidence ${id} must be planned and cited by a mapped passage.`)
      covered.add(id)
    }
    return { concept: text(entry.concept, 'concept', 1, 240), source_element_ids: sourceIds, block_ids: blockIds, retained_details: text(entry.retained_details, 'retained details', 20, 2000) }
  })
  if (complete) {
    for (const id of planned) if (!covered.has(id)) throw new Error(`Coverage review is missing planned evidence ${id}.`)
    for (const id of blocks.keys()) if (!reviewedBlocks.has(id)) throw new Error(`Coverage review is missing lesson block ${id}. Review every explanation, example and visual.`)
  }
  return review
}

export function mergeCoverageReview(previous: LessonDocument | undefined, next: LessonDocument, plan: LessonPlan, incoming?: unknown): LessonCoverageReview[] {
  const retained = unchangedCoverageReview(previous, next)
  if (incoming === undefined) return retained
  const additions = validateCoverageReview(incoming, next, plan, false)
  const replaced = new Set(additions.flatMap(entry => entry.block_ids))
  const merged = [...retained.filter(entry => !entry.block_ids.some(id => replaced.has(id))), ...additions]
  return validateCoverageReview(merged, next, plan, false)
}

export function coverageReviewProgress(document: LessonDocument, plan?: LessonPlan) {
  const entries = document.coverage_review ?? []
  const reviewed = new Set(entries.flatMap(entry => entry.block_ids))
  const evidence = new Set(entries.flatMap(entry => entry.source_element_ids))
  const pending = document.sections.flatMap(section => section.blocks.filter(block => !reviewed.has(block.block_id)).map(block => ({ section_id: section.section_id, block_id: block.block_id })))
  return {
    reviewed_blocks: document.sections.flatMap(section => section.blocks).filter(block => reviewed.has(block.block_id)).length,
    unreviewed_block_count: pending.length,
    unreviewed_blocks: pending.slice(0, 24),
    unmapped_evidence_count: plan ? new Set(plan.sections.flatMap(section => section.source_element_ids).filter(id => !evidence.has(id))).size : undefined,
    note: 'Saved agent review checkpoints; rendered inspection and final semantic review are still required.',
  }
}

export function unchangedCoverageReview(previous: LessonDocument | undefined, next: LessonDocument): LessonCoverageReview[] {
  const before = new Map(previous?.sections.flatMap(section => section.blocks.map((block, index) => [block.block_id, JSON.stringify([section.section_id, section.title, index, block])] as const)) ?? [])
  const after = new Map(next.sections.flatMap(section => section.blocks.map((block, index) => [block.block_id, JSON.stringify([section.section_id, section.title, index, block])] as const)))
  return (previous?.coverage_review ?? []).filter(entry => entry.block_ids.every(id => before.get(id) === after.get(id) && after.has(id)))
}

export function coverageReviewPage(document: LessonDocument, cursor: number) {
  const entries = document.coverage_review ?? []
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > entries.length) throw new Error('Invalid coverage review cursor.')
  const page: LessonCoverageReview[] = []
  let size = 0
  for (const entry of entries.slice(cursor)) {
    const characters = JSON.stringify(entry).length
    if (page.length && size + characters > 8000) break
    page.push(entry)
    size += characters
  }
  return { entries: page, next_review_cursor: cursor + page.length < entries.length ? cursor + page.length : null }
}

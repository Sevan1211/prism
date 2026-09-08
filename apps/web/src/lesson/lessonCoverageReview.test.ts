import { describe, expect, it } from 'vitest'
import { coverageReviewPage, unchangedCoverageReview, validateCoverageReview } from './lessonCoverageReview'
import type { LessonCoverageReview, LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

const review: LessonCoverageReview[] = [{ concept: 'Boundary condition', source_element_ids: ['e1'], block_ids: ['b1'], retained_details: 'The explanation retains the condition and its counterexample.' }]
const document = { sections: [{ blocks: [{ block_id: 'b1', source_element_ids: ['e1'], content: { kind: 'prose', text: 'Only when the condition holds.' } }] }], coverage_review: review } as LessonDocument
const plan = { sections: [{ source_element_ids: ['e1'] }] } as LessonPlan

describe('source-to-passage review', () => {
  it('paginates long reviews without losing entries and rejects invalid cursors', () => {
    const long = { ...document, coverage_review: Array.from({ length: 12 }, (_, index) => ({ ...review[0], concept: `Concept ${index}`, retained_details: 'x'.repeat(2000) })) }
    const entries = []
    let cursor: number | null = 0
    while (cursor !== null) {
      const page = coverageReviewPage(long, cursor)
      expect(page.entries.length).toBeGreaterThan(0)
      entries.push(...page.entries)
      cursor = page.next_review_cursor
    }
    expect(entries).toEqual(long.coverage_review)
    expect(() => coverageReviewPage(long, -1)).toThrow('cursor')
    expect(() => coverageReviewPage(long, 13)).toThrow('cursor')
    expect(coverageReviewPage({ ...document, coverage_review: undefined }, 0)).toEqual({ entries: [], next_review_cursor: null })
  })
  it('requires mappings and rejects wrong source anchors and nonexistent passages', () => {
    expect(() => validateCoverageReview(undefined, document, plan)).toThrow('coverage_review')
    expect(validateCoverageReview(review, document, plan)).toEqual(review)
    expect(() => validateCoverageReview([{ ...review[0], source_element_ids: ['invented'] }], document, plan)).toThrow('mapped evidence')
    expect(() => validateCoverageReview([{ ...review[0], block_ids: ['missing'] }], document, plan)).toThrow('must exist')
    expect(() => validateCoverageReview(review, document, { sections: [{ source_element_ids: ['e1', 'e2'] }] } as LessonPlan)).toThrow('missing planned evidence e2')
  })
  it('invalidates reviews when a mapped passage changes and rejects unreviewed additions', () => {
    const changed = structuredClone(document)
    changed.sections[0].blocks[0].content = { kind: 'prose', text: 'Always holds.' }
    expect(unchangedCoverageReview(document, changed)).toEqual([])
    expect(unchangedCoverageReview(document, structuredClone(document))).toEqual(review)
    const added = structuredClone(document)
    added.sections[0].blocks.push({ block_id: 'b2', source_element_ids: ['e1'], provenance: 'added_explanation', content: { kind: 'prose', text: 'An analogy.' } })
    expect(() => validateCoverageReview(review, added, plan)).toThrow('missing lesson block b2')
  })
})

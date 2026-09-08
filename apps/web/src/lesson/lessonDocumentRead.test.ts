import { describe, expect, it } from 'vitest'
import type { LessonContentBlock, LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'
import { mergeCoverageReview, validateCoverageReview } from './lessonCoverageReview'
import { readLessonBlocks } from './lessonDocumentRead'

describe('bounded lesson review reads', () => {
  it('preserves every block across pages and targets invalidated reviews', () => {
    const blocks: LessonContentBlock[] = Array.from({ length: 7 }, (_, i) => ({ block_id: `b${i}`, provenance: 'source_grounded', source_element_ids: ['e1'], content: { kind: 'rich_text', markdown: `${i}: ${'Evidence and reasoning. '.repeat(300)}` } }))
    blocks.push({ block_id: 'visual', provenance: 'source_grounded', source_element_ids: ['e1'], content: { kind: 'equation', latex: 'x=1', explanation: 'Under the stated condition.' } })
    const section = { section_id: 's1', title: 'Reasoning', objective_ids: [], blocks }
    const document = { sections: [section], coverage_review: blocks.slice(0, 7).map(block => ({ concept: block.block_id, block_ids: [block.block_id], source_element_ids: ['e1'], retained_details: 'The evidence, reasoning, example and condition have been compared.' })) } as unknown as LessonDocument
    let cursor: number | null = 0
    const received = []
    while (cursor !== null) {
      const page = readLessonBlocks(document, section, 'all', cursor)
      received.push(...page.blocks)
      cursor = page.next_cursor
    }
    expect(received).toEqual(blocks)
    expect(readLessonBlocks(document, section, 'unreviewed').blocks).toEqual([blocks.at(-1)])
    expect(readLessonBlocks(document, section, 'visuals').blocks).toEqual([blocks.at(-1)])
    expect(() => readLessonBlocks(document, section, 'invalid')).toThrow('content_filter')
    expect(() => readLessonBlocks(document, section, 'all', 99)).toThrow('cursor')
    const changed = structuredClone(document)
    changed.sections[0].blocks[2].content = { kind: 'rich_text', markdown: 'A materially changed claim.' }
    changed.coverage_review = mergeCoverageReview(document, changed, { sections: [{ source_element_ids: ['e1'] }] } as LessonPlan)
    expect(readLessonBlocks(changed, changed.sections[0], 'unreviewed').blocks.map(b => b.block_id)).toEqual(['b2', 'visual'])
  })

  it('measures a fixed 13-section review transport workload without reducing content', () => {
    const sections = Array.from({ length: 13 }, (_, s) => ({
      section_id: `s${s}`, title: `Section ${s}`, objective_ids: [],
      blocks: Array.from({ length: 8 }, (_, b): LessonContentBlock => ({
        block_id: `s${s}b${b}`, provenance: 'source_grounded', source_element_ids: [`e${s}`],
        content: { kind: 'rich_text', markdown: 'A definition with reasoning, a worked example, and its qualifying condition. '.repeat(35) },
      })),
    }))
    const plan = { sections: sections.map(s => ({ ...s, source_element_ids: [`e${s.section_id.slice(1)}`] })) } as unknown as LessonPlan
    const document = { sections } as unknown as LessonDocument
    let previous: LessonDocument | undefined
    const start = performance.now()
    for (let i = 0; i < sections.length; i++) {
      const next = { ...document, sections: sections.slice(0, i + 1) }
      next.coverage_review = mergeCoverageReview(previous, next, plan, sections[i].blocks.map(block => ({ concept: block.block_id, block_ids: [block.block_id], source_element_ids: block.source_element_ids, retained_details: 'Retains the definition, intermediate reasoning, worked example, and explicit qualifying condition.' })))
      previous = next
    }
    const checkpointMs = performance.now() - start
    expect(validateCoverageReview(previous!.coverage_review, previous!, plan)).toHaveLength(104)
    expect(previous!.sections).toEqual(document.sections)
    let baselineCalls = 0, currentCalls = 0, characters = 0
    for (const section of sections) {
      let size = 0
      for (const block of section.blocks) {
        const n = JSON.stringify(block).length
        if (size && size + n > 11_000) { baselineCalls++; size = 0 }
        size += n; characters += n
      }
      if (size) baselineCalls++
      let cursor: number | null = 0
      while (cursor !== null) { const page = readLessonBlocks(document, section, 'all', cursor); currentCalls++; cursor = page.next_cursor }
      expect(readLessonBlocks(previous!, section, 'unreviewed').blocks).toEqual([])
    }
    expect(baselineCalls).toBe(39)
    expect(currentCalls).toBe(13)
    console.info(JSON.stringify({ benchmark: '13-section review transport; not model or end-to-end authoring', blocks: 104, unchanged_content_characters: characters, full_review_reads_before: baselineCalls, full_review_reads_after: currentCalls, redundant_prose_reads_after_complete_checkpoints: 0, checkpoint_processing_ms: Math.round(checkpointMs * 100) / 100 }))
  })
})

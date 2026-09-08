import { describe, expect, it } from 'vitest'
import type { LessonContentBlock, LessonDocument } from './lessonDocumentTypes'
import { lessonRevisionDiff } from './lessonRevisionDiff'

const block = (id: string): LessonContentBlock => ({ block_id: id, content: { kind: 'prose', text: id }, provenance: 'source_grounded', source_element_ids: ['evidence'] })
const document = (blocks: LessonContentBlock[]): Pick<LessonDocument, 'sections'> => ({ sections: [{ section_id: 'section', title: 'Section', objective_ids: [], blocks }] })

describe('reviewable lesson changes', () => {
  it('shows an insertion without falsely marking retained paragraphs as moved', () => {
    expect(lessonRevisionDiff(document([block('a'), block('b')]), document([block('a'), block('new'), block('b')])).map((change) => change.id)).toEqual(['new'])
  })
  it('shows reordered content and source-reference changes even when prose is identical', () => {
    const before = document([block('a'), block('b')])
    const after = document([block('b'), { ...block('a'), source_element_ids: ['different-evidence'] }])
    const changes = lessonRevisionDiff(before, after)
    expect(changes).toHaveLength(2)
    expect(changes.find((change) => change.id === 'a')).toMatchObject({ moved: true, changed: true })
    expect(changes.find((change) => change.id === 'b')).toMatchObject({ moved: true, changed: false })
  })
})

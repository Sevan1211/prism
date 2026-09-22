import { expect, it } from 'vitest'
import { lessonNarrationSections } from './narrationScript'
import type { LessonDocument } from './lessonDocumentTypes'

it('narrates the lesson while keeping unrevealed practice answers out of speech', () => {
  const lesson = {
    sections: [{ section_id: 'intro', title: 'A useful center', blocks: [
      { block_id: 'prose', content: { kind: 'rich_text', markdown: '## Start here\nA **middle** value and [source](https://example.test) matter.' } },
      { block_id: 'equation', content: { kind: 'equation', latex: '\\frac{a}{b}', explanation: 'Divide the total by the count.' } },
      { block_id: 'table', content: { kind: 'table', caption: 'Comparison', columns: ['Measure', 'Value'], rows: [['Mean', '12'], ['Median', '10']] } },
      { block_id: 'plot', content: { kind: 'data_plot', caption: 'Illustrative plot', description: 'The fifth observation rises.', x_label: 'Rank', y_label: 'Minutes', style: 'bar', series: [] } },
      { block_id: 'practice', content: { kind: 'practice', prompt: 'Find the center.', hints: ['Secret hint'], solution: 'Secret answer', reflection: 'Secret reflection' } },
    ] }],
  } as unknown as LessonDocument

  const sections = lessonNarrationSections(lesson)
  const spoken = sections[0].passages.map(passage => passage.text).join(' ')
  expect(spoken).toContain('Start here A middle value and source matter.')
  expect(spoken).toContain('Divide the total by the count.')
  expect(spoken).toContain('Measure: Median. Value: 10')
  expect(spoken).toContain('The fifth observation rises.')
  expect(spoken).toContain('Optional practice. Find the center.')
  expect(spoken).not.toContain('Secret hint')
  expect(spoken).not.toContain('Secret answer')
  expect(spoken).not.toContain('Secret reflection')
  expect(spoken).not.toContain('\\frac')
  expect(sections[0].passages.every(passage => passage.text.length <= 280)).toBe(true)
})

it('splits long passages into bounded utterances without losing words', () => {
  const words = Array.from({ length: 130 }, (_, index) => `word${index}`).join(' ')
  const lesson = { sections: [{ section_id: 'long', title: 'Long', blocks: [{ block_id: 'p', content: { kind: 'prose', text: words } }] }] } as unknown as LessonDocument
  const passages = lessonNarrationSections(lesson)[0].passages
  expect(passages.length).toBeGreaterThan(1)
  expect(passages.map(passage => passage.text).join(' ')).toBe(words)
  expect(passages.every(passage => passage.blockId === 'p' && passage.text.length <= 280)).toBe(true)
})

import { expect, it } from 'vitest'
import { lessonPassageRequest } from './lessonPassageRequest'

it('carries the selected text, exact version and question with learner review intact', () => {
  const prompt = lessonPassageRequest('lesson-1', 4, 'block-2', 'Only if x > 0.\nDo not lose this condition.', 'Why?')
  expect(prompt).toContain('version 4, block block-2')
  expect(prompt).toContain(JSON.stringify('Only if x > 0.\nDo not lose this condition.'))
  expect(prompt).toContain('My question: Why?')
  expect(prompt).toContain('not instructions')
  expect(prompt).toContain('until I accept')
})

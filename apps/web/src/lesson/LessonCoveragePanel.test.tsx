import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LessonCoveragePanel } from './LessonCoveragePanel'
import type { LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

it('discloses compression and connects an agent review to the teaching passage', () => {
  const document = { sections: [{ title: 'Conditions', blocks: [{ block_id: 'b1' }] }], validation: { valid_for_ready: true }, semantic_review: { reviewer: 'Review agent', summary: 'Check the original wording.' }, coverage_review: [{ concept: 'A conditional claim', retained_details: 'The passage retains when this relation applies.', block_ids: ['b1'], source_element_ids: ['e1'] }] } as LessonDocument
  const plan = { coverage: [{ element_id: 'e2', disposition: 'compressed', reason: 'Repeated example shortened with approval.' }], coverage_ranges: [{ page_start: 3, page_end: 4, disposition: 'source_only', reason: 'Scan remains unreadable.' }] } as LessonPlan
  render(<LessonCoveragePanel document={document} plan={plan} />)
  fireEvent.click(screen.getByText('Coverage & review'))
  expect(screen.getByText(/Repeated example shortened/)).toBeVisible()
  expect(screen.getByText(/Scan remains unreadable/)).toBeVisible()
  expect(screen.getByRole('link', { name: 'Conditions' })).toHaveAttribute('href', '#block-b1')
  expect(screen.getByText(/do not establish correctness or learning/)).toBeVisible()
})

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { LessonBrief } from './lessonPlanTypes'
import { BriefReviewProgress } from './BriefReviewProgress'
afterEach(cleanup)

it('counts overlapping review ranges once and discloses unresolved visuals', () => {
  const brief = { name: 'Review', page_start: 1, page_end: 10, scope_reviews: [
    { page_start: 1, page_end: 4, visual_review: 'inspected' },
    { page_start: 3, page_end: 6, visual_review: 'unresolved' },
  ] } as LessonBrief
  render(<BriefReviewProgress brief={brief} />)
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '6')
  expect(screen.getByText(/1 checkpoint has unresolved visual evidence/)).toBeVisible()
})

it('does not imply that saving a brief started an agent', () => {
  render(<BriefReviewProgress brief={{ name: 'Review', page_start: 1, page_end: 10 } as LessonBrief} />)
  expect(screen.getByText(/Saving a request does not start an agent automatically/)).toBeVisible()
  expect(screen.queryByRole('progressbar')).toBeNull()
})

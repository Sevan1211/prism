import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LessonPlanPanel } from './LessonPlanPanel'
import { listLessonBriefs, listLessonPlans } from './lessonPlans'
import type { LibrarySource } from '../storage/browserSources'

vi.mock('./lessonPlans', () => ({ listLessonBriefs: vi.fn(), listLessonPlans: vi.fn(), approveLessonPlan: vi.fn() }))
vi.mock('./LessonBriefComposer', () => ({ LessonBriefComposer: () => <div>Request form</div> }))
vi.mock('./LessonDraftPreview', () => ({ LessonDraftPreview: () => <div>Lesson</div> }))
const source = { id: 'test-source', storage_location: 'browser_vault', browser_index: { state: 'ready' } } as LibrarySource
afterEach(() => { cleanup(); vi.resetAllMocks() })

it('shows loading and retry rather than an empty list after a storage failure', async () => {
  vi.mocked(listLessonBriefs).mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValue([])
  vi.mocked(listLessonPlans).mockResolvedValue([])
  render(<LessonPlanPanel source={source} activePlanId={null} onActivePlanChange={vi.fn()} onError={vi.fn()} onOpenEvidence={vi.fn()} />)
  expect(screen.getByText('Opening your lessons')).toBeVisible()
  expect(screen.queryByText('No coverage plan yet')).toBeNull()
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Request form')).toBeVisible()
})

it('offers a route back when the requested plan is missing from an empty list', async () => {
  vi.mocked(listLessonBriefs).mockResolvedValue([])
  vi.mocked(listLessonPlans).mockResolvedValue([])
  render(<LessonPlanPanel source={source} activePlanId="missing-plan" onActivePlanChange={vi.fn()} onError={vi.fn()} onOpenEvidence={vi.fn()} />)
  expect(await screen.findByRole('link', { name: 'View all lessons' })).toHaveAttribute('href', '/sources/test-source/lessons')
})

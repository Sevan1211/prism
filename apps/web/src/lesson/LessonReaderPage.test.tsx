import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { LessonReaderPage } from './LessonReaderPage'
import { getLessonDocument } from './lessonDocuments'
import { getLessonPlan } from './lessonPlans'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import type { LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

vi.mock('./lessonDocuments', () => ({ getLessonDocument: vi.fn() }))
vi.mock('./lessonPlans', () => ({ getLessonPlan: vi.fn() }))
vi.mock('../workspace/SourceWorkspace', () => ({ AppHeader: () => <header>PRISM</header> }))
vi.mock('./LessonDraftPreview', () => ({ LessonDraftPreview: () => <section id="section-first">Saved section</section> }))

afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); vi.restoreAllMocks() })

it('clears the previous lesson immediately when navigating to another lesson', async () => {
  vi.mocked(getLessonDocument).mockResolvedValue({ lesson_id: 'l1', plan_id: 'p1', title: 'First', sections: [] } as unknown as LessonDocument)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  const props = { onError: vi.fn(), onOpenEvidence: vi.fn(), returnTargetId: null, onReturnComplete: vi.fn() }
  const { rerender } = render(<LessonReaderPage lessonId="l1" {...props} />)
  await screen.findByText('Saved section')
  vi.mocked(getLessonDocument).mockReturnValue(new Promise(() => {}))
  rerender(<LessonReaderPage lessonId="l2" {...props} />)
  expect(screen.queryByText('Saved section')).not.toBeInTheDocument()
  expect(screen.getByText('Opening your lesson')).toBeVisible()
})

it('distinguishes a failed load from a missing lesson and lets the reader retry', async () => {
  vi.mocked(getLessonDocument).mockRejectedValueOnce(new Error('Storage temporarily unavailable'))
  const user = userEvent.setup()
  render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await screen.findByRole('button', { name: 'Try again' })
  expect(screen.queryByText('This lesson is not in your current library.')).not.toBeInTheDocument()
  vi.mocked(getLessonDocument).mockResolvedValue({ lesson_id: 'l1', plan_id: 'p1', sections: [] } as unknown as LessonDocument)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Saved section')).toBeVisible()
})

it('restores a deep link once without pulling the reader back on each background save', async () => {
  window.history.replaceState(null, '', '/lessons/l1#section-first')
  const scroll = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
  const document = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(document)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await screen.findByText('Saved section')
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
  vi.mocked(getLessonDocument).mockResolvedValue({ ...document, document_version: 2 })
  await act(async () => { window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT)) })
  expect(scroll).toHaveBeenCalledTimes(1)
})

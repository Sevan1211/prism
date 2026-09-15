import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { LessonReaderPage } from './LessonReaderPage'
import { getLessonDocument } from './lessonDocuments'
import { getLessonPlan } from './lessonPlans'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import type { LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

const sync = vi.hoisted(() => ({ restoring: false }))
vi.mock('../storage/useSyncStatus', () => ({ useSyncStatus: () => sync }))
vi.mock('./lessonDocuments', () => ({ getLessonDocument: vi.fn() }))
vi.mock('./lessonPlans', () => ({ getLessonPlan: vi.fn() }))
vi.mock('../workspace/SourceWorkspace', () => ({ AppHeader: () => <header>PRISM</header> }))
const preview = vi.hoisted(() => ({ ready: true, returnTargetId: null as string | null }))
vi.mock('./LessonDraftPreview', () => ({ LessonDraftPreview: () => preview.ready ? <article data-lesson-id="l1"><section id="section-first">Saved section</section>{preview.returnTargetId ? <button id={preview.returnTargetId}>Return target</button> : null}</article> : null }))

beforeEach(() => { preview.ready = true; preview.returnTargetId = null; sessionStorage.clear() })
afterEach(() => { sync.restoring = false; cleanup(); window.history.replaceState(null, '', '/'); vi.useRealTimers(); vi.restoreAllMocks() })

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

it('restores a remembered numeric position after lesson content mounts', async () => {
  sessionStorage.setItem('prism:lesson-scroll:v1:l1', '720')
  const scrollTo = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
  const documentRecord = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(documentRecord)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await screen.findByText('Saved section')
  expect(scrollTo).toHaveBeenCalledWith({ top: 720, left: 0, behavior: 'instant' })
})

it('does not restore a remembered position after the learner interacts while content is pending', async () => {
  sessionStorage.setItem('prism:lesson-scroll:v1:l1', '720')
  const scrollTo = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
  const document = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(document)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  preview.ready = false
  const view = render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  window.dispatchEvent(new Event('wheel'))
  preview.ready = true
  view.rerender(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await act(async () => { await Promise.resolve() })
  expect(scrollTo).not.toHaveBeenCalled()
})

it('debounces scroll saves and flushes the latest position on pagehide', async () => {
  const scrollTo = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
  let scrollY = 0
  const document = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(document)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await screen.findByText('Saved section')
  const readingPage = globalThis.document.querySelector<HTMLElement>('.lesson-reading-page') as HTMLElement
  Object.defineProperty(readingPage, 'scrollTop', { configurable: true, get: () => scrollY })
  vi.useFakeTimers()
  scrollY = 340
  readingPage.dispatchEvent(new Event('scroll'))
  scrollY = 510
  readingPage.dispatchEvent(new Event('scroll'))
  expect(sessionStorage.getItem('prism:lesson-scroll:v1:l1')).toBeNull()
  act(() => { vi.advanceTimersByTime(160) })
  expect(sessionStorage.getItem('prism:lesson-scroll:v1:l1')).toBe('510')
  scrollY = 905
  window.dispatchEvent(new Event('pagehide'))
  expect(sessionStorage.getItem('prism:lesson-scroll:v1:l1')).toBe('905')
  expect(scrollTo).not.toHaveBeenCalled()
})

it('keeps return targets ahead of hashes and remembered positions', async () => {
  window.history.replaceState(null, '', '/lessons/l1#section-first')
  sessionStorage.setItem('prism:lesson-scroll:v1:l1', '720')
  const scroll = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
  preview.returnTargetId = 'return-button'
  const documentRecord = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(documentRecord)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId="return-button" onReturnComplete={vi.fn()} />)
  await screen.findByText('Saved section')
  await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'instant' }))
})

it('does not restore remembered position after a return target is consumed', async () => {
  sessionStorage.setItem('prism:lesson-scroll:v1:l1', '720')
  preview.returnTargetId = 'return-button'
  const scroll = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll })
  const scrollTo = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
  const documentRecord = { lesson_id: 'l1', plan_id: 'p1', title: 'Reference lesson', document_version: 1, sections: [] } as unknown as LessonDocument
  vi.mocked(getLessonDocument).mockResolvedValue(documentRecord)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  function Harness() {
    const [returnTargetId, setReturnTargetId] = useState<string | null>('return-button')
    return <LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={returnTargetId} onReturnComplete={() => setReturnTargetId(null)} />
  }
  render(<Harness />)
  await screen.findByText('Saved section')
  await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'instant' }))
  expect(scrollTo).not.toHaveBeenCalled()
})


it('waits for account restoration before declaring a cloud lesson missing', async () => {
  sync.restoring = true
  vi.mocked(getLessonDocument).mockResolvedValue(undefined)
  const props = { lessonId: 'cloud-lesson', onError: vi.fn(), onOpenEvidence: vi.fn(), returnTargetId: null, onReturnComplete: vi.fn() }
  const view = render(<LessonReaderPage {...props} />)
  await waitFor(() => expect(getLessonDocument).toHaveBeenCalled())
  expect(screen.getByText('Opening your lesson')).toBeVisible()
  expect(screen.queryByText('This lesson is not in your current library.')).not.toBeInTheDocument()
  sync.restoring = false
  view.rerender(<LessonReaderPage {...props} />)
  expect(await screen.findByText('This lesson is not in your current library.')).toBeVisible()
})


it('flushes the last panel position when DOM removal resets scrollTop', async () => {
  vi.mocked(getLessonDocument).mockResolvedValue({ lesson_id: 'l1', plan_id: 'p1', sections: [] } as unknown as LessonDocument)
  vi.mocked(getLessonPlan).mockResolvedValue({ source_id: 's1' } as LessonPlan)
  const view = render(<LessonReaderPage lessonId="l1" onError={vi.fn()} onOpenEvidence={vi.fn()} returnTargetId={null} onReturnComplete={vi.fn()} />)
  await screen.findByText('Saved section')
  const panel = globalThis.document.querySelector<HTMLElement>('.lesson-reading-page')!
  Object.defineProperty(panel, 'scrollTop', { configurable: true, get: () => panel.isConnected ? 1250 : 0 })
  panel.dispatchEvent(new Event('scroll'))
  view.unmount()
  expect(sessionStorage.getItem('prism:lesson-scroll:v1:l1')).toBe('1250')
})

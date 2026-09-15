import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { navigatePrism, readPrismNavigationState } from './navigation'
import { readBrowserSourceBundle } from './storage/browserSources'
import type { ReaderProps } from './Reader'

vi.mock('./LibraryStorage', () => ({ LibraryStorageHost: () => null }))
vi.mock('./library/sourceLibrary', () => ({ loadLibrarySources: vi.fn(async () => [{ id: 's1', original_name: 'Synthetic.pdf' }]) }))
vi.mock('./webmcp/usePrismLibraryTools', () => ({ usePrismLibraryTools: () => {} }))
vi.mock('./lesson/lessonDocuments', () => ({ getLessonDocumentByPlan: vi.fn(async () => undefined) }))
vi.mock('./storage/browserSources', () => ({
  readBrowserSourceBundle: vi.fn(), deleteBrowserSource: vi.fn(), importBrowserSource: vi.fn(),
  indexBrowserSource: vi.fn(), setBrowserAgentContentAccess: vi.fn(),
}))
vi.mock('./lesson/LessonReaderPage', () => ({ LessonReaderPage: (props: {
  lessonId: string; returnTargetId: string | null; onReturnComplete: () => void;
  onOpenEvidence: (source: string, element: string, target: string) => Promise<void>
}) => <div>
  <h1>{props.lessonId}</h1><output data-testid="return">{props.returnTargetId}</output>
  <button onClick={() => void props.onOpenEvidence('s1', 'e1', 'block-one')}>Citation one</button>
  <button onClick={() => void props.onOpenEvidence('s1', 'e2', 'block-two')}>Citation two</button>
  <button onClick={props.onReturnComplete}>Complete return</button>
  <button onClick={() => navigatePrism('/sources')}>Library</button>
</div> }))
vi.mock('./workspace/SourceWorkspace', () => ({ SourceWorkspace: () => <h1>Library</h1> }))
vi.mock('./reader/SourceReader', () => ({ SourceReader: (props: ReaderProps) => <div>
  <h1>Reader page {props.initialPage}</h1><output data-testid="highlight">{props.initialHighlight?.element_id}</output>
  <output data-testid="request">{props.navigationRequestId}</output>
  <button onClick={() => props.onNavigatePage?.(3, false)}>Page three</button>
  <button onClick={props.onExit}>Exit reader</button>
</div> }))

const bundle = (id = 'e1', page = 2) => ({ elements: [{ anchor: { element_id: id, pdf_page_index: page, bbox_normalized: [0.1, 0.2, 0.8, 0.4] }, text: 'Private passage never belongs in history', status: 'source_only' }] })
const deferred = () => { let resolve!: (value: unknown) => void; const promise = new Promise(resolveValue => { resolve = resolveValue }); return { promise, resolve } }
beforeEach(() => {
  window.history.replaceState({}, '', '/lessons/l1')
  vi.mocked(readBrowserSourceBundle).mockResolvedValue(bundle() as never)
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('retains citation context through Reader page changes and a remount, then consumes return focus once', async () => {
  let view = render(<App />)
  fireEvent.click(screen.getByText('Citation one'))
  await screen.findByRole('heading', { name: 'Reader page 2' })
  const request = screen.getByTestId('request').textContent
  expect(JSON.stringify(window.history.state)).not.toContain('Private passage')
  fireEvent.click(screen.getByText('Page three'))
  await screen.findByRole('heading', { name: 'Reader page 3' })
  expect(screen.getByTestId('request')).toHaveTextContent(request!)
  view.unmount(); view = render(<App />)
  await screen.findByRole('heading', { name: 'Reader page 3' })
  expect(screen.getByTestId('highlight')).toHaveTextContent('e1')
  fireEvent.click(screen.getByText('Exit reader'))
  expect(window.location.pathname).toBe('/lessons/l1')
  expect(screen.getByTestId('return')).toHaveTextContent('block-one')
  fireEvent.click(screen.getByText('Complete return'))
  expect(screen.getByTestId('return')).toBeEmptyDOMElement()
  expect(readPrismNavigationState()?.returnTargetId).toBe('block-one')
  view.unmount(); render(<App />)
  expect(screen.getByTestId('return')).toHaveTextContent('block-one')
})

it('restores citation context on browser Back and Forward', async () => {
  render(<App />)
  fireEvent.click(screen.getByText('Citation one'))
  await screen.findByRole('heading', { name: 'Reader page 2' })
  await act(async () => { window.history.back() })
  await waitFor(() => expect(screen.getByTestId('return')).toHaveTextContent('block-one'))
  fireEvent.click(screen.getByText('Complete return'))
  await act(async () => { window.history.forward() })
  await screen.findByRole('heading', { name: 'Reader page 2' })
  expect(screen.getByTestId('highlight')).toHaveTextContent('e1')
  await act(async () => { window.history.back() })
  await waitFor(() => expect(screen.getByTestId('return')).toHaveTextContent('block-one'))
})

it('ignores an older citation when a later request resolves first', async () => {
  const first = deferred()
  vi.mocked(readBrowserSourceBundle).mockReturnValueOnce(first.promise as never).mockResolvedValueOnce(bundle('e2', 4) as never)
  render(<App />)
  fireEvent.click(screen.getByText('Citation one')); fireEvent.click(screen.getByText('Citation two'))
  await screen.findByRole('heading', { name: 'Reader page 4' })
  await act(async () => { first.resolve(bundle()) })
  expect(screen.getByTestId('highlight')).toHaveTextContent('e2')
  expect(readPrismNavigationState()?.reader?.targetId).toBe('block-two')
})

it('ignores pending citation navigation after leaving and returning to the same URL', async () => {
  const pending = deferred()
  vi.mocked(readBrowserSourceBundle).mockReturnValueOnce(pending.promise as never)
  render(<App />)
  fireEvent.click(screen.getByText('Citation one')); fireEvent.click(screen.getByText('Library'))
  act(() => navigatePrism('/lessons/l1'))
  await act(async () => { pending.resolve(bundle()) })
  expect(window.location.pathname).toBe('/lessons/l1')
  expect(readPrismNavigationState()?.returnTargetId).toBeUndefined()
})

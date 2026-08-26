import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SourceStructure, SourceSummary } from './types'

vi.mock('pdfjs-dist', () => {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render: () => ({ promise: Promise.resolve(), cancel: () => undefined }),
  }
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({ numPages: 40, getPage: async () => page }),
      destroy: () => undefined,
    })),
  }
})
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/worker.mjs' }))

const searchSource = vi.fn()
vi.mock('./api', () => ({
  searchSource: (...args: unknown[]) => searchSource(...args),
  readingState: vi.fn(async (sourceId: string) => ({
    source_id: sourceId,
    last_page: 6,
    furthest_page: 12,
    last_scroll_ratio: 0,
    updated_at: null,
  })),
  updateReadingState: vi.fn(async () => ({
    source_id: 'src_reader',
    last_page: 6,
    furthest_page: 12,
    last_scroll_ratio: 0,
    updated_at: null,
  })),
  sourcePdfUrl: vi.fn((sourceId: string) => `/pdf/${sourceId}`),
}))

import { Reader } from './Reader'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const source: SourceSummary = {
  id: 'src_reader',
  content_hash: 'hash',
  original_name: 'algorithms.pdf',
  size_bytes: 1024,
  page_count: 40,
  status: 'structure_ready',
  rights_status: 'open_license',
  cloud_policy: 'local_only',
  created_at: '2026-08-26T00:00:00Z',
}

const structure: SourceStructure = {
  source_id: 'src_reader',
  origin: 'outline',
  sections: [
    {
      id: 'sec_0000_0001',
      parent_id: null,
      title: 'Chapter 1 Recursion',
      level: 1,
      page_start: 1,
      page_end: 20,
      origin: 'outline',
      confidence: 0.9,
    },
    {
      id: 'sec_0001_0021',
      parent_id: null,
      title: 'Chapter 2 Backtracking',
      level: 1,
      page_start: 21,
      page_end: 40,
      origin: 'outline',
      confidence: 0.9,
    },
  ],
}

describe('Reader', () => {
  it('shows the structure rail, restores position, and navigates by section', async () => {
    const user = userEvent.setup()
    render(<Reader source={source} structure={structure} onExit={() => undefined} />)

    expect(screen.getByRole('button', { name: /chapter 1 recursion/i })).toBeInTheDocument()

    // Continue-reading restoration lands on the stored last page.
    await waitFor(() => {
      expect(screen.getByText(/page 6 of 40/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/reached 12/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /chapter 2 backtracking/i }))
    expect(screen.getByText(/page 21 of 40/i)).toBeInTheDocument()
  })

  it('searches the source and highlights the chosen span region', async () => {
    searchSource.mockResolvedValue({
      source_id: 'src_reader',
      query: 'recursion fairy',
      hits: [
        {
          element_id: 'el_1',
          page_number: 9,
          kind: 'paragraph',
          document_region: 'body',
          status: 'trusted_for_transform',
          bbox_normalized: [0.1, 0.2, 0.9, 0.3],
          snippet: 'delegate to the [recursion] [fairy]',
        },
      ],
    })
    const user = userEvent.setup()
    const { container } = render(
      <Reader source={source} structure={structure} onExit={() => undefined} />,
    )

    await user.type(screen.getByRole('searchbox'), 'recursion fairy')
    await user.keyboard('{Enter}')

    expect(searchSource).toHaveBeenCalledWith('src_reader', 'recursion fairy')
    const hit = await screen.findByRole('button', { name: /p\.9 · paragraph/i })
    await user.click(hit)

    expect(screen.getByText(/page 9 of 40/i)).toBeInTheDocument()
    const highlight = container.querySelector('.reader-highlight') as HTMLElement
    expect(highlight).not.toBeNull()
    expect(highlight.style.left).toBe('10%')
    expect(highlight.style.width).toBe('80%')
  })

  it('falls back to page groups when a source has no recoverable structure', () => {
    render(
      <Reader
        source={source}
        structure={{ source_id: 'src_reader', origin: 'none', sections: [] }}
        onExit={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: /pages 1–20/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pages 21–40/i })).toBeInTheDocument()
  })
})

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SourceStructure, SourceSummary } from './types'

const pdfFixture = vi.hoisted(() => ({
  metadata: { info: {} as Record<string, unknown>, metadata: {} },
  outline: [] as Array<{
    dest: unknown[] | null
    items: unknown[]
    title: string
  }>,
  pageLabels: null as string[] | null,
}))

vi.mock('pdfjs-dist', () => {
  const page = {
    cleanup: () => undefined,
    getTextContent: async () => ({ items: [{ str: 'Selectable source text' }], styles: {}, lang: null }),
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render: () => ({ promise: Promise.resolve(), cancel: () => undefined }),
  }
  class TextLayer {
    private readonly container: HTMLElement

    constructor({ container }: { container: HTMLElement }) {
      this.container = container
    }

    cancel() {
      return undefined
    }

    async render() {
      const span = document.createElement('span')
      span.textContent = 'Selectable source text'
      this.container.append(span)
    }
  }
  return {
    version: '6.2.108',
    GlobalWorkerOptions: { workerSrc: '' },
    TextLayer,
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({
        getDestination: async () => null,
        getMetadata: async () => pdfFixture.metadata,
        getOutline: async () => pdfFixture.outline,
        getPage: async () => page,
        getPageIndex: async () => 0,
        getPageLabels: async () => pdfFixture.pageLabels,
        numPages: 40,
      }),
      destroy: () => undefined,
    })),
  }
})
const searchSource = vi.fn()
const access = {
  loadReadingState: vi.fn(async () => ({
    source_id: 'src_reader',
    last_page: 6,
    furthest_page: 12,
    last_scroll_ratio: 0,
    updated_at: null,
  })),
  pdfUrl: '/pdf/src_reader',
  saveReadingState: vi.fn(async () => ({
    source_id: 'src_reader',
    last_page: 6,
    furthest_page: 12,
    last_scroll_ratio: 0,
    updated_at: null,
  })),
  search: (...args: [string]) => searchSource(...args),
  storageLabel: 'test vault',
}

import { Reader } from './Reader'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  pdfFixture.metadata = { info: {}, metadata: {} }
  pdfFixture.outline = []
  pdfFixture.pageLabels = null
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
  it('uses the application return callback from the Reader back link', async () => {
    const user = userEvent.setup()
    const onExit = vi.fn()
    render(<Reader access={access} source={source} structure={structure} onExit={onExit} />)

    await user.click(screen.getByRole('link', { name: 'Return to source workspace' }))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('shows the structure rail, restores position, and navigates by section', async () => {
    const user = userEvent.setup()
    render(<Reader access={access} source={source} structure={structure} onExit={() => undefined} />)

    expect(screen.getByRole('button', { name: /chapter 1 recursion/i })).toBeInTheDocument()

    // Continue-reading restoration lands on the stored last page.
    await waitFor(() => {
      expect(screen.getByText(/page 6 of 40/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/reached 12/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /chapter 2 backtracking/i }))
    expect(screen.getByText(/page 21 of 40/i)).toBeInTheDocument()
  })

  it('responds to a new agent navigation request while already open', async () => {
    const { rerender } = render(
      <Reader
        access={access}
        initialPage={1}
        navigationRequestId={1}
        source={source}
        structure={structure}
        onExit={() => undefined}
      />,
    )
    await waitFor(() => expect(screen.getByText(/page 1 of 40/i)).toBeInTheDocument())

    rerender(
      <Reader
        access={access}
        initialPage={21}
        navigationRequestId={2}
        source={source}
        structure={structure}
        onExit={() => undefined}
      />,
    )

    await waitFor(() => expect(screen.getByText(/page 21 of 40/i)).toBeInTheDocument())
  })

  it('follows a routed page change from browser history', async () => {
    const { rerender } = render(
      <Reader
        access={access}
        initialPage={21}
        source={source}
        structure={structure}
        onExit={() => undefined}
      />,
    )
    await waitFor(() => expect(screen.getByText(/page 21 of 40/i)).toBeInTheDocument())

    rerender(
      <Reader
        access={access}
        initialPage={9}
        source={source}
        structure={structure}
        onExit={() => undefined}
      />,
    )

    await waitFor(() => expect(screen.getByText(/page 9 of 40/i)).toBeInTheDocument())
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
      <Reader access={access} source={source} structure={structure} onExit={() => undefined} />,
    )

    await user.click(screen.getByRole('button', { name: 'Search this source' }))
    await user.type(screen.getByRole('searchbox'), 'recursion fairy')
    await user.keyboard('{Enter}')

    expect(searchSource).toHaveBeenCalledWith('recursion fairy')
    expect(await screen.findByText('1 result')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /p\.9 \/ paragraph/i })).toHaveLength(1)
    const hit = await screen.findByRole('button', { name: /p\.9 \/ paragraph/i })
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
        access={access}
        source={source}
        structure={{ source_id: 'src_reader', origin: 'none', sections: [] }}
        onExit={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: /pages 1-20/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pages 21-40/i })).toBeInTheDocument()
    expect(screen.getByText(/no recoverable contents found/i)).toBeInTheDocument()
  })

  it('uses the embedded PDF contents, hierarchy, page labels, and metadata', async () => {
    pdfFixture.outline = [
      {
        dest: [0],
        title: 'Foundation',
        items: [
          { dest: [9], title: 'Architecture', items: [] },
          { dest: [14], title: 'Performance', items: [] },
        ],
      },
      { dest: [20], title: 'Direct Links', items: [] },
    ]
    pdfFixture.metadata = {
      info: {
        Author: 'Larry Peterson and Bruce Davie',
        PDFFormatVersion: '1.7',
        Subject: 'Computer networks',
        Title: 'Computer Networks: A Systems Approach',
      },
      metadata: {},
    }
    pdfFixture.pageLabels = Array.from({ length: 40 }, (_, index) => (
      index < 4 ? ['i', 'ii', 'iii', 'iv'][index] : String(index - 3)
    ))
    const user = userEvent.setup()
    render(
      <Reader
        access={access}
        source={source}
        structure={{ source_id: 'src_reader', origin: 'none', sections: [] }}
        onExit={() => undefined}
      />,
    )

    expect(await screen.findByRole('button', { name: /architecture/i })).toBeInTheDocument()
    expect(screen.getByText(/4 document bookmarks/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show document details' }))
    expect(screen.getByText('Larry Peterson and Bruce Davie')).toBeInTheDocument()
    expect(screen.getByText('Computer Networks: A Systems Approach')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /architecture/i }))
    expect(screen.getByText(/PDF page 10 of 40/i)).toBeInTheDocument()
    expect(screen.getByText(/printed page 6/i)).toBeInTheDocument()
  })

  it('mounts selectable PDF.js text only for viewport-adjacent pages', async () => {
    const { container } = render(
      <Reader access={access} source={source} structure={structure} onExit={() => undefined} />,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Selectable source text').length).toBeGreaterThan(0)
    })
    expect(container.querySelectorAll('.textLayer').length).toBeLessThan(40)
  })

  it('provides an explicit accessible source-search action', async () => {
    const user = userEvent.setup()
    searchSource.mockResolvedValue({ hits: [], query: 'packet', source_id: source.id })
    render(<Reader access={access} source={source} structure={structure} onExit={() => undefined} />)

    await user.click(screen.getByRole('button', { name: 'Search this source' }))
    const find = screen.getByRole('button', { name: 'Find in source' })
    expect(find).toBeDisabled()
    await user.type(screen.getByRole('searchbox', { name: 'Search this source' }), 'packet')
    expect(find).toBeEnabled()
    await user.click(find)

    await waitFor(() => expect(searchSource).toHaveBeenCalledWith('packet'))
  })

  it('provides page, zoom, fit, and panel controls', async () => {
    const user = userEvent.setup()
    render(<Reader access={access} source={source} structure={structure} onExit={() => undefined} />)

    expect(screen.getByRole('combobox', { name: 'Page fit' })).toHaveValue('width')
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText('110%')).toBeInTheDocument()

    await user.clear(screen.getByRole('textbox', { name: 'PDF page' }))
    await user.type(screen.getByRole('textbox', { name: 'PDF page' }), '21{Enter}')
    expect(await screen.findByText(/PDF page 21 of 40/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide contents' }))
    expect(screen.queryByRole('navigation', { name: 'Document structure' })).not.toBeInTheDocument()
  })
})

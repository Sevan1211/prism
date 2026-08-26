import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { compileLesson, listSources, sourceReadiness } from './api'
import { installFakeModelContext } from './test/fakeModelContext'
import type { SectionReadiness, SourceReadiness, SourceSummary } from './types'

vi.mock('./api', () => ({
  compileLesson: vi.fn(),
  listSources: vi.fn(),
  resumeImport: vi.fn(),
  sourceFileUrl: vi.fn((sourceId: string, pageNumber: number) => `/source/${sourceId}#${pageNumber}`),
  sourceReadiness: vi.fn(),
  uploadSource: vi.fn(),
}))

const source: SourceSummary = {
  id: 'src_networks',
  content_hash: 'source-hash',
  original_name: 'computer-networks.pdf',
  size_bytes: 2048,
  page_count: 489,
  status: 'structure_ready',
  rights_status: 'private_authorized',
  cloud_policy: 'local_only',
  created_at: '2026-08-23T00:00:00Z',
}

function section(
  pageStart: number,
  pageEnd: number,
  canCompile: boolean,
): SectionReadiness {
  return {
    page_start: pageStart,
    page_end: pageEnd,
    status: canCompile ? 'ready' : 'source_only',
    can_compile: canCompile,
    trusted_text_characters: canCompile ? 812 : 0,
    warning_text_characters: 0,
    source_only_text_characters: 0,
    body_pages: canCompile ? 3 : 0,
    excluded_non_body_elements: canCompile ? 2 : 9,
    message: canCompile
      ? 'This range contains trusted body text and is ready for a draft semantic stream.'
      : 'This range has no trusted body text for transformation. Front and back matter remain available in the original PDF.',
  }
}

function readiness(pageStart?: number, pageEnd?: number): SourceReadiness {
  const selected = pageStart && pageEnd ? section(pageStart, pageEnd, pageStart >= 24) : null
  return {
    source_id: source.id,
    source_status: 'structure_ready',
    phase: 'ready',
    parser_current: true,
    latest_job: {
      id: 'job_networks',
      source_id: source.id,
      state: 'succeeded',
      progress_current: 489,
      progress_total: 489,
      error_class: null,
      error_message: null,
      parser_version: 'native-pdfium-v9-soft-hyphen-line-joins',
      created_at: '2026-08-23T00:00:00Z',
      updated_at: '2026-08-23T00:00:00Z',
    },
    trusted_body_pages: 460,
    source_only_body_pages: 0,
    recommended_range: section(24, 26, true),
    selected_range: selected,
    capability_notes: ['PRISM currently transforms only trusted, embedded body text.'],
  }
}

describe('App source readiness', () => {
  beforeEach(() => {
    vi.mocked(listSources).mockResolvedValue([source])
    vi.mocked(sourceReadiness).mockImplementation(async (_sourceId, pageStart, pageEnd) => (
      readiness(pageStart, pageEnd)
    ))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('recommends verified body pages instead of silently defaulting to pages one through three', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByLabelText('Start page')).toHaveValue(24)
      expect(screen.getByLabelText('End page')).toHaveValue(26)
    })

    expect(screen.getByText('Local index ready')).toBeInTheDocument()
    expect(screen.getByText('Selected range verified')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter semantic stream' })).toBeEnabled()
    expect(screen.getByRole('link', { name: /open original pdf/i })).toHaveAttribute(
      'href',
      '/source/src_networks#24',
    )
  })

  it('submits a verified section only once while compilation is in flight', async () => {
    vi.mocked(compileLesson).mockImplementation(() => new Promise(() => {}))
    render(<App />)

    const button = await screen.findByRole('button', { name: 'Enter semantic stream' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(compileLesson).toHaveBeenCalledTimes(1)
    expect(compileLesson).toHaveBeenCalledWith(
      'src_networks',
      24,
      26,
      'computer-networks.pdf · pages 24–26',
    )
  })

  it('exposes library tools to browser agents with the rights gate visible', async () => {
    const fake = installFakeModelContext()
    try {
      render(<App />)
      await screen.findByRole('button', { name: 'Enter semantic stream' })

      expect(fake.tools.has('list_sources')).toBe(true)
      expect(fake.tools.has('get_source_readiness')).toBe(true)
      expect(fake.tools.has('prepare_stream')).toBe(true)
      expect(fake.tools.has('open_source_page')).toBe(true)

      let listed: unknown
      await act(async () => {
        listed = await fake.execute('list_sources')
      })
      expect(listed).toMatchObject([
        {
          source_id: 'src_networks',
          rights_status: 'private_authorized',
          agent_content_allowed: false,
        },
      ])
    } finally {
      fake.uninstall()
    }
  })
})

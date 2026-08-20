import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LessonPackage, SemanticFrame } from './types'

vi.mock('./api', () => ({
  recordEvent: vi.fn().mockResolvedValue(undefined),
  sourceFileUrl: (sourceId: string, page: number) => `/sources/${sourceId}#page=${page}`,
  sourceVisualUrl: (sourceId: string, visualId: string) => `/sources/${sourceId}/${visualId}.webp`,
}))

import { SemanticPlayer } from './SemanticPlayer'

function frame(id: string, content: string, page: number): SemanticFrame {
  return {
    id,
    claim_ids: [`claim_${id}`],
    type: 'proposition',
    prerequisite_frame_ids: [],
    representation: {
      id: `representation_${id}`,
      type: 'text',
      content,
      persistent_terms: ['TCP'],
      accessible_text: content,
    },
    active_visual_id: id === 'frame_two' ? 'visual_tcp' : null,
    section_title: 'TCP Slow Start',
    source_spans: [
      {
        element_id: `element_${id}`,
        page_number: page,
        bbox_normalized: [0.1, 0.2, 0.9, 0.4],
        start_offset: 0,
        end_offset: content.length,
        extracted_text: content,
      },
    ],
    pacing_features: {
      lexical_difficulty: 0.4,
      proposition_count: 1,
      novelty: 0.6,
      integration_distance: 0,
      technical_term_count: 1,
    },
    minimum_dwell_ms: 1800,
    initial_dwell_ms: 4000,
    auto_advance_allowed: true,
    verification_status: 'draft',
  }
}

const lesson: LessonPackage = {
  schema_version: 2,
  id: 'lesson_tcp_fixture',
  package_hash: 'fixture-hash',
  title: 'TCP slow start',
  source: {
    id: 'source_tcp_fixture',
    content_hash: 'source-hash',
    original_name: 'tcp.pdf',
    size_bytes: 1024,
    page_count: 2,
    status: 'structure_ready',
    rights_status: 'open_license',
    cloud_policy: 'local_only',
    created_at: '2026-08-19T00:00:00Z',
  },
  page_start: 1,
  page_end: 2,
  compiler_version: 'fixture',
  verification_status: 'draft',
  capability_notes: [],
  claims: [],
  visuals: [
    {
      id: 'visual_tcp',
      element_id: 'element_visual_tcp',
      page_number: 2,
      kind: 'figure',
      bbox_normalized: [0.1, 0.1, 0.9, 0.7],
      caption: 'Figure 1. TCP congestion window growth.',
      accessible_text: 'A line chart showing TCP congestion window growth.',
      provenance: 'source_region',
      extraction_confidence: 0.95,
    },
  ],
  frames: [
    frame('frame_one', 'TCP begins with a small congestion window.', 1),
    frame('frame_two', 'Acknowledgements permit the congestion window to grow.', 2),
  ],
  created_at: '2026-08-19T00:00:00Z',
}

describe('SemanticPlayer', () => {
  it('keeps navigation reversible and exposes the exact source context', async () => {
    const user = userEvent.setup()
    render(<SemanticPlayer lesson={lesson} onExit={() => undefined} />)

    expect(screen.getByRole('article')).toHaveTextContent(
      'TCP begins with a small congestion window.',
    )
    expect(screen.getByRole('button', { name: 'Previous frame' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next frame' }))
    expect(screen.getByRole('article')).toHaveTextContent(
      'Acknowledgements permit the congestion window to grow.',
    )
    expect(screen.getByLabelText('Previous semantic frame')).toHaveTextContent(
      'TCP begins with a small congestion window.',
    )
    expect(screen.getByRole('figure', { name: 'Most recent source visual' })).toHaveTextContent(
      'Figure 1. TCP congestion window growth.',
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/sources/source_tcp_fixture/visual_tcp.webp',
    )

    await user.click(screen.getByRole('button', { name: /show source/i }))
    expect(screen.getByRole('complementary', { name: 'Original source context' })).toHaveTextContent(
      'Region 0.10 · 0.20 · 0.90 · 0.40',
    )
    expect(screen.getByRole('button', { name: /close source/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})

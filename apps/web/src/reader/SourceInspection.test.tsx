import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SourceInspectionHost } from './SourceInspection'
import { inspectSourcePage, inspectSourcePages } from './sourceInspectionBridge'

vi.mock('./SourcePageCanvas', () => ({ SourcePageCanvas: ({ page, onReady }: { page: number; onReady?: (result: { error: string } | { width: number; height: number }) => void }) => <><button onClick={() => onReady?.({ error: 'Worker unavailable' })}>Fail rendering</button><button onClick={() => onReady?.({ width: 900, height: 700 })}>Render page {page}</button></> }))
afterEach(cleanup)

describe('original page inspection', () => {
  it('renders all selected views together and settles only after every view reports', async () => {
    render(<SourceInspectionHost />)
    let result!: Promise<object>
    let settled = false
    act(() => { result = inspectSourcePages('source', [{ page_number: 2, bbox: [0, 0, 1, 1] }, { page_number: 5, bbox: [0, .2, 1, .6] }]); void result.then(() => { settled = true }) })
    expect(screen.getByRole('heading', { name: '2 source views' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Render page 2' }))
    await Promise.resolve()
    expect(settled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Render page 5' }))
    await expect(result).resolves.toMatchObject({ visible_state: 'original_source_contact_sheet', views: [{ page_number: 2, width: 900 }, { page_number: 5, bbox_normalized: [0, .2, 1, .6] }] })
    fireEvent.click(screen.getByRole('button', { name: 'Zoom view 2, page 5' }))
    expect(screen.getByRole('button', { name: 'Back to all views' })).toBeVisible()
  })

  it('reports partial failures without claiming the entire contact sheet is available', async () => {
    render(<SourceInspectionHost />)
    let result!: Promise<object>
    act(() => { result = inspectSourcePages('source', [{ page_number: 1, bbox: [0, 0, 1, 1] }, { page_number: 2, bbox: [0, 0, 1, 1] }]) })
    fireEvent.click(screen.getByRole('button', { name: 'Render page 1' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Fail rendering' })[1])
    await expect(result).resolves.toMatchObject({ error: expect.stringContaining('Some views failed'), visible_state: 'some_source_images_unavailable', views: [{ width: 900 }, { error: 'Worker unavailable' }] })
  })

  it('does not label a failed render as visible original pixels', async () => {
    render(<SourceInspectionHost />)
    let result!: Promise<object>
    act(() => { result = inspectSourcePage('source', 2, [0, 0, 1, 1]) })
    fireEvent.click(screen.getByRole('button', { name: 'Fail rendering' }))
    await expect(result).resolves.toMatchObject({ error: 'Worker unavailable', visible_state: 'source_image_unavailable' })
  })

  it('settles a pending tool call when the reader closes inspection', async () => {
    render(<SourceInspectionHost />)
    let result!: Promise<object>
    act(() => { result = inspectSourcePage('source', 2, [0, 0, 1, 1]) })
    fireEvent.click(screen.getByRole('button', { name: 'Close page inspection' }))
    await expect(result).resolves.toMatchObject({ visible_state: 'source_inspection_closed' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

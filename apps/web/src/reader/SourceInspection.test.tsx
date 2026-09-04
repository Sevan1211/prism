import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SourceInspectionHost } from './SourceInspection'
import { inspectSourcePage } from './sourceInspectionBridge'

vi.mock('./SourcePageCanvas', () => ({ SourcePageCanvas: ({ onReady }: { onReady: (result: { error: string }) => void }) => <button onClick={() => onReady({ error: 'Worker unavailable' })}>Fail rendering</button> }))
afterEach(cleanup)

describe('original page inspection', () => {
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

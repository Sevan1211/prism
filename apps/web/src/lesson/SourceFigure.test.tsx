import { useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { SourceFigure } from './SourceFigure'

vi.mock('../reader/SourcePageCanvas', () => ({ SourcePageCanvas: ({ bbox, alt, onReady }: { bbox: number[]; alt: string; onReady?: (size: { width: number; height: number }) => void }) => {
  useEffect(() => { onReady?.({ width: 400, height: 800 }) }, [onReady])
  return <canvas aria-label={alt} data-bbox={bbox.join(',')} />
} }))

it('preserves the saved crop while allowing the full page and fitting tall originals into the enlarged viewer', async () => {
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) { this.open = true })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false } })
  const { container } = render(<SourceFigure sourceId="source" content={{ kind: 'source_figure', page_number: 1, bbox: [.2, .3, .8, .7], alt: 'Original diagram', caption: 'An original diagram.' }} />)
  expect(container.querySelector('canvas')).toHaveAttribute('data-bbox', '0.2,0.3,0.8,0.7')
  fireEvent.click(screen.getByRole('button', { name: 'Show full page' }))
  expect(container.querySelector('canvas')).toHaveAttribute('data-bbox', '0,0,1,1')
  fireEvent.click(screen.getByRole('button', { name: 'Enlarge figure' }))
  expect(screen.getByRole('button', { name: 'Fit page' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(container.querySelector('.figure-zoom-surface')).toHaveStyle({ width: '296px' }))
  fireEvent.click(screen.getByRole('button', { name: 'Fit width' }))
  expect(container.querySelector('.figure-zoom-surface')).toHaveStyle({ width: '900px' })
  fireEvent.click(screen.getByRole('button', { name: 'Close enlarged figure' }))
  expect(screen.getByRole('button', { name: 'Enlarge figure' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Show figure crop' }))
  expect(container.querySelector('canvas')).toHaveAttribute('data-bbox', '0.2,0.3,0.8,0.7')
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

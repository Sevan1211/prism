import { expect, it } from 'vitest'
import { pdfRenderSize } from './pdfRenderSize'

it('renders additional source pixels when the reader zooms, within memory and side limits', () => {
  const inline = pdfRenderSize(500, 250, 800, 2)
  const zoom = pdfRenderSize(500, 250, 1600, 2, true)
  expect(zoom.width).toBeGreaterThan(inline.width)
  expect(zoom.width).toBe(3200)
  const large = pdfRenderSize(600, 800, 12000, 3, true)
  expect(large.width * large.height).toBeLessThan(16_020_000)
  expect(Math.max(large.width, large.height)).toBeLessThanOrEqual(8192)
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LessonVisual } from './LessonVisual'
import type { DataPlot, VisualScene } from './lessonVisuals'

describe('accessible visual reading controls', () => {
  it('starts paused, supports stepping and reset, and retains the full explanation', () => {
    const content: VisualScene = { kind: 'visual_scene', caption: 'A process', description: 'An illustrative two-stage process.', nodes: [{ id: 'a', label: 'Input', detail: 'Material before processing.', x: 20, y: 20, width: 200, height: 80, tone: 'neutral', shape: 'box' }], edges: [], steps: [{ label: 'Inspect', description: 'Examine the initial material.', focus: ['a'], positions: [] }, { label: 'Interpret', description: 'Explain what the material means.', focus: ['a'], positions: [] }] }
    render(<LessonVisual content={content} />)
    expect(screen.getByRole('button', { name: 'Play explanation' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByRole('slider', { name: 'Explanation step' })).toHaveValue('1')
    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Input' }))
    expect(screen.getByRole('status')).toHaveTextContent('Material before processing.')
    fireEvent.click(screen.getByRole('button', { name: 'Reset explanation' }))
    expect(screen.getByRole('slider')).toHaveValue('0')
    expect(screen.getByText('Read the full visual explanation')).toBeVisible()
  })
  it('keeps exact underlying values available when filtering a chart and does not give zero a positive bar', () => {
    const content: DataPlot = { kind: 'data_plot', caption: 'Measured quantities', description: 'A synthetic test comparison, not research data.', x_label: 'Trial', y_label: 'Quantity', style: 'bar', series: [{ label: 'A', points: [{ x: 0, y: 0, label: 'First' }, { x: 1, y: 8, label: 'Second' }] }, { label: 'B', points: [{ x: 0, y: 4, label: 'First' }, { x: 1, y: 2, label: 'Second' }] }] }
    const { container } = render(<LessonVisual content={content} />)
    expect(container.querySelector('.plot-series rect')).toHaveAttribute('height', '0')
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(container.querySelectorAll('.plot-series')).toHaveLength(1)
    fireEvent.click(screen.getByText('Inspect the underlying values'))
    expect(screen.getByRole('table')).toHaveTextContent('8')
    fireEvent.click(screen.getByRole('button', { name: 'Compare all' }))
    expect(container.querySelectorAll('.plot-series')).toHaveLength(2)
  })
})

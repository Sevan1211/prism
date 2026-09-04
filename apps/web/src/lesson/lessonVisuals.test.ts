import { describe, expect, it } from 'vitest'
import { normalizeVisual, type VisualScene } from './lessonVisuals'

const scene: VisualScene = { kind: 'visual_scene', caption: 'Two connected ideas', description: 'An editable spatial explanation.', nodes: [{ id: 'a', x: 100, y: 100, width: 200, height: 100, label: 'Cause', detail: 'The initial condition.', shape: 'box', tone: 'neutral' }, { id: 'b', x: 650, y: 100, width: 200, height: 100, label: 'Effect', detail: 'The resulting change.', shape: 'ellipse', tone: 'accent' }], edges: [{ from: 'a', to: 'b', label: 'influences' }], steps: [{ label: 'Inspect the cause', description: 'Start with the initial condition.', focus: ['a'], positions: [] }] }

describe('declarative visual contract', () => {
  it('accepts subject-independent data and rejects executable extensions or broken geometry', () => {
    expect(normalizeVisual(scene)).toEqual(scene)
    expect(() => normalizeVisual({ ...scene, script: 'alert(1)' })).toThrow('unknown properties')
    expect(() => normalizeVisual({ ...scene, edges: [{ from: 'a', to: 'missing', label: 'x' }] })).toThrow('existing nodes')
    expect(() => normalizeVisual({ ...scene, steps: [{ ...scene.steps[0], positions: [{ id: 'a', x: 950, y: 100 }] }] })).toThrow('fit inside')
    expect(() => normalizeVisual({ ...scene, nodes: [scene.nodes[0], scene.nodes[0]] })).toThrow('unique')
  })
  it('sorts quantitative points without mutating inputs and refuses ambiguous or nonfinite values', () => {
    const plot = { kind: 'data_plot', caption: 'Measured values', description: 'An explicit data series.', x_label: 'Time', y_label: 'Value', style: 'line', series: [{ label: 'A', points: [{ x: 2, y: 4, label: '' }, { x: 1, y: 3, label: '' }] }] }
    const normalized = normalizeVisual(plot)
    expect(normalized.kind === 'data_plot' && normalized.series[0].points[0].x).toBe(1)
    expect(plot.series[0].points[0].x).toBe(2)
    expect(() => normalizeVisual({ ...plot, series: [{ label: 'A', points: [{ x: 1, y: Infinity, label: '' }] }] })).toThrow('invalid number')
    expect(() => normalizeVisual({ ...plot, series: [{ label: 'A', points: [{ x: 1, y: 4, label: '' }, { x: 1, y: 3, label: '' }] }] })).toThrow('unique')
    expect(normalizeVisual({ ...plot, style: 'scatter', series: [{ label: 'Samples', points: [{ x: 1, y: 4, label: 'First' }, { x: 1, y: 3, label: 'Second' }] }] })).toMatchObject({ style: 'scatter' })
    expect(normalizeVisual({ ...plot, style: 'area' })).toMatchObject({ style: 'area' })
    expect(() => normalizeVisual({ ...plot, series: [plot.series[0], plot.series[0]] })).toThrow('labels must be unique')
  })
})

export interface SceneNode { id: string; x: number; y: number; width: number; height: number; label: string; detail: string; shape: 'box' | 'ellipse'; tone: 'neutral' | 'accent' | 'muted' }
export interface SceneEdge { from: string; to: string; label: string }
export interface SceneStep { label: string; description: string; focus: string[]; positions: Array<{ id: string; x: number; y: number }> }
export interface VisualScene { kind: 'visual_scene'; caption: string; description: string; nodes: SceneNode[]; edges: SceneEdge[]; steps: SceneStep[] }
export interface DataPlot { kind: 'data_plot'; caption: string; description: string; x_label: string; y_label: string; style: 'line' | 'bar' | 'scatter' | 'area'; series: Array<{ label: string; points: Array<{ x: number; y: number; label: string }> }> }

const id = { type: 'string', minLength: 1, maxLength: 60, pattern: '^[A-Za-z0-9_-]+$' }
const text = (maxLength: number) => ({ type: 'string', maxLength })
const number = (minimum: number, maximum: number) => ({ type: 'number', minimum, maximum })
const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
export const visualSceneSchema = object({ kind: { const: 'visual_scene' }, caption: text(600), description: text(2000), nodes: { type: 'array', minItems: 1, maxItems: 24, items: object({ id, x: number(0, 1000), y: number(0, 600), width: number(40, 700), height: number(30, 400), label: text(100), detail: text(1200), shape: { enum: ['box', 'ellipse'] }, tone: { enum: ['neutral', 'accent', 'muted'] } }) }, edges: { type: 'array', maxItems: 40, items: object({ from: id, to: id, label: text(80) }) }, steps: { type: 'array', maxItems: 16, items: object({ label: text(120), description: text(1600), focus: { type: 'array', maxItems: 24, items: id }, positions: { type: 'array', maxItems: 24, items: object({ id, x: number(0, 1000), y: number(0, 600) }) } }) } })
export const dataPlotSchema = object({ kind: { const: 'data_plot' }, caption: text(600), description: text(2000), x_label: text(100), y_label: text(100), style: { enum: ['line', 'bar', 'scatter', 'area'] }, series: { type: 'array', minItems: 1, maxItems: 4, items: object({ label: text(100), points: { type: 'array', minItems: 1, maxItems: 100, items: object({ x: number(-1e12, 1e12), y: number(-1e12, 1e12), label: text(100) }) } }) } })

// Validate the same small JSON grammar used by tools. No HTML, CSS, paths,
// expressions, callbacks, URLs, or executable code are accepted in visual data.
function check(value: unknown, raw: unknown, path = 'visual'): void {
  const schema = raw as Record<string, unknown>
  if ('const' in schema && value !== schema.const) throw new Error(`${path}: invalid kind.`)
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) throw new Error(`${path}: unsupported value.`)
  if (schema.type === 'string') {
    if (typeof value !== 'string' || value.length > Number(schema.maxLength) || value.length < Number(schema.minLength ?? 0) || (schema.pattern && !new RegExp(String(schema.pattern)).test(value))) throw new Error(`${path}: invalid text.`)
  } else if (schema.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < Number(schema.minimum) || value > Number(schema.maximum)) throw new Error(`${path}: invalid number.`)
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < Number(schema.minItems ?? 0) || value.length > Number(schema.maxItems)) throw new Error(`${path}: invalid array length.`)
    value.forEach((entry, i) => check(entry, schema.items, `${path}[${i}]`))
  } else if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected an object.`)
    const properties = schema.properties as Record<string, unknown>
    const record = value as Record<string, unknown>
    if (Object.keys(record).some((key) => !(key in properties))) throw new Error(`${path}: unknown properties are not allowed.`)
    for (const [key, child] of Object.entries(properties)) check(record[key], child, `${path}.${key}`)
  }
}

export function normalizeVisual(value: unknown): VisualScene | DataPlot {
  if (!value || typeof value !== 'object') throw new Error('Invalid visual.')
  const kind = (value as { kind: string }).kind
  check(value, kind === 'visual_scene' ? visualSceneSchema : dataPlotSchema)
  const visual = structuredClone(value) as VisualScene | DataPlot
  if (visual.kind === 'visual_scene') {
    const nodes = new Map(visual.nodes.map((node) => [node.id, node]))
    if (nodes.size !== visual.nodes.length) throw new Error('Visual node ids must be unique.')
    for (const node of visual.nodes) if (node.x + node.width > 1000 || node.y + node.height > 600) throw new Error('Visual nodes must fit inside the 1000 × 600 canvas.')
    for (const edge of visual.edges) if (!nodes.has(edge.from) || !nodes.has(edge.to)) throw new Error('Visual edges must reference existing nodes.')
    for (const step of visual.steps) {
      if (new Set(step.positions.map((position) => position.id)).size !== step.positions.length) throw new Error('A step cannot position the same node twice.')
      for (const id of step.focus) if (!nodes.has(id)) throw new Error('A step focuses an unknown node.')
      for (const position of step.positions) {
        const node = nodes.get(position.id)
        if (!node || position.x + node.width > 1000 || position.y + node.height > 600) throw new Error('Step positions must fit inside the canvas.')
      }
    }
  } else {
    if (new Set(visual.series.map(series => series.label)).size !== visual.series.length) throw new Error('Chart series labels must be unique.')
    for (const series of visual.series) {
      if (visual.style !== 'scatter' && new Set(series.points.map((point) => point.x)).size !== series.points.length) throw new Error('Plot x values must be unique within each series.')
      series.points.sort((a, b) => a.x - b.x)
    }
  }
  return visual
}

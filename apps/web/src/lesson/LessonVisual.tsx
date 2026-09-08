import { useEffect, useId, useState } from 'react'
import { ArrowCounterClockwise, CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react'
import type { DataPlot, SceneNode, VisualScene } from './lessonVisuals'
import './lessonVisual.css'

export function LessonVisual({ content }: { content: VisualScene | DataPlot }) {
  return content.kind === 'visual_scene' ? <Scene key={JSON.stringify(content)} content={content} /> : <Plot key={JSON.stringify(content)} content={content} />
}

function Scene({ content }: { content: VisualScene }) {
  const marker = useId().replace(/:/g, '')
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const step = content.steps[stepIndex]
  const nodes = content.nodes.map((node) => ({ ...node, ...step?.positions.find((position) => position.id === node.id) }))
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const chosen = selected ? byId.get(selected) : null
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (stepIndex < content.steps.length - 1) setStepIndex(stepIndex + 1)
      if (stepIndex >= content.steps.length - 2) setPlaying(false)
    }, 3500)
    return () => window.clearTimeout(timer)
  }, [content.steps.length, playing, stepIndex])
  const go = (index: number) => { setPlaying(false); setStepIndex(index); setSelected(null) }
  return <figure className="lesson-visual">
    <figcaption>{content.caption}</figcaption>
    <div className="visual-scene-scroll" tabIndex={0} aria-label="Diagram. Scroll horizontally on small screens.">
      <svg viewBox="0 0 1000 600" className="visual-scene" role="img" aria-label={`${content.description}${step ? ` Current step: ${step.label}. ${step.description}` : ''}`}>
        <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        {content.edges.map((edge, i) => {
          const from = byId.get(edge.from)!
          const to = byId.get(edge.to)!
          const [x1, y1] = connection(from, to)
          const [x2, y2] = connection(to, from)
          return <g key={`${edge.from}-${edge.to}-${i}`} className="scene-edge"><line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={`url(#${marker})`} /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 12} textAnchor="middle">{edge.label}</text></g>
        })}
        {nodes.map((node) => <g key={node.id} className="scene-node" data-tone={node.tone} data-emphasized={step?.focus.includes(node.id) || selected === node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)` }}>
          {node.shape === 'ellipse' ? <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2 - 2} ry={node.height / 2 - 2} /> : <rect x={2} y={2} width={node.width - 4} height={node.height - 4} rx={12} />}
          <foreignObject x={12} y={8} width={node.width - 24} height={node.height - 16}><div className="scene-node-label">{node.label}</div></foreignObject>
        </g>)}
      </svg>
    </div>
    {content.steps.length > 1 ? <div className="visual-player">
      <button type="button" className="icon-button" aria-label={playing ? 'Pause explanation' : 'Play explanation'} onClick={() => { if (stepIndex === content.steps.length - 1) setStepIndex(0); setPlaying(!playing) }}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />}</button>
      <input type="range" min={0} max={content.steps.length - 1} value={stepIndex} aria-label="Explanation step" aria-valuetext={`${stepIndex + 1}: ${step.label}`} onChange={(event) => go(Number(event.target.value))} />
      <span>{stepIndex + 1} / {content.steps.length}</span>
      <button type="button" className="icon-button" aria-label="Previous step" disabled={stepIndex === 0} onClick={() => go(stepIndex - 1)}><CaretLeft /></button>
      <button type="button" className="icon-button" aria-label="Next step" disabled={stepIndex === content.steps.length - 1} onClick={() => go(stepIndex + 1)}><CaretRight /></button>
      <button type="button" className="icon-button" aria-label="Reset explanation" onClick={() => go(0)}><ArrowCounterClockwise /></button>
    </div> : null}
    <div className="visual-explanation" aria-live={playing ? 'off' : 'polite'}><strong>{step?.label ?? 'How to read this visual'}</strong><p>{step?.description ?? content.description}</p></div>
    <div className="visual-node-controls" aria-label="Explore the concepts">{nodes.map((node) => <button type="button" key={node.id} aria-pressed={selected === node.id} onClick={() => { setPlaying(false); setSelected(selected === node.id ? null : node.id) }}>{node.label}</button>)}</div>
    {chosen ? <div className="visual-node-detail" role="status"><strong>{chosen.label}</strong><p>{chosen.detail}</p></div> : null}
    <details className="visual-transcript"><summary>Read the full visual explanation</summary><p>{content.description}</p><dl>{content.nodes.map((node) => <div key={node.id}><dt>{node.label}</dt><dd>{node.detail}</dd></div>)}</dl><ul>{content.edges.map((edge, i) => <li key={i}>{byId.get(edge.from)?.label} — {edge.label || 'connects to'} → {byId.get(edge.to)?.label}</li>)}</ul>{content.steps.length ? <ol>{content.steps.map((item, i) => <li key={i}><strong>{item.label}.</strong> {item.description}</li>)}</ol> : null}</details>
  </figure>
}

function connection(from: SceneNode, to: SceneNode): [number, number] {
  const dx = to.x + to.width / 2 - from.x - from.width / 2
  const dy = to.y + to.height / 2 - from.y - from.height / 2
  const factor = 1 / Math.max(Math.abs(dx) / (from.width / 2), Math.abs(dy) / (from.height / 2), 1)
  return [from.x + from.width / 2 + dx * factor, from.y + from.height / 2 + dy * factor]
}

function Plot({ content }: { content: DataPlot }) {
  const [selected, setSelected] = useState<number | null>(null)
  const series = selected === null ? content.series : [content.series[selected]]
  const points = content.series.flatMap((item) => item.points)
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(0, ...points.map((point) => point.y))
  const rawMaxY = Math.max(0, ...points.map((point) => point.y))
  const maxY = rawMaxY === minY ? minY + 1 : rawMaxY
  const x = (value: number) => (content.style === 'bar' ? 140 : 90) + (value - minX) / (maxX - minX || 1) * (content.style === 'bar' ? 620 : 720)
  const y = (value: number) => 380 - (value - minY) / (maxY - minY || 1) * 320
  const xValues = [...new Set(points.map((point) => point.x))].sort((a, b) => a - b)
  const pointSpacing = xValues.length > 1 ? Math.min(...xValues.slice(1).map((value, i) => x(value) - x(xValues[i]))) : 100
  const barWidth = Math.max(1, Math.min(26, pointSpacing * .65 / content.series.length))
  return <figure className="lesson-visual data-plot">
    <figcaption>{content.caption}</figcaption>
    <div className="visual-node-controls" aria-label="Chart series"><button type="button" aria-pressed={selected === null} onClick={() => setSelected(null)}>Compare all</button>{content.series.map((item, i) => <button type="button" aria-pressed={selected === i} key={item.label} onClick={() => setSelected(i)}><span className="plot-legend-swatch" data-series={i} aria-hidden="true" />{item.label}</button>)}</div>
    <div className="visual-scene-scroll" tabIndex={0} aria-label="Chart. Exact values are available in the data table."><svg viewBox="0 0 880 470" className="plot-svg" role="img" aria-label={content.description}>
      {Array.from({ length: 5 }, (_, i) => minY + (maxY - minY) * i / 4).map((value, i) => <g key={i} className="plot-grid"><line x1={85} x2={820} y1={y(value)} y2={y(value)} /><text x={72} y={y(value) + 5} textAnchor="end">{formatNumber(value)}</text></g>)}
      <line className="plot-axis" x1={85} x2={820} y1={y(0)} y2={y(0)} />
      {series.map((item) => {
        const index = content.series.indexOf(item)
        return <g key={item.label} className="plot-series" data-series={index}>
          {content.style === 'area' ? <polygon fill="currentColor" fillOpacity={.12} points={`${x(item.points[0].x)},${y(0)} ${item.points.map(point => `${x(point.x)},${y(point.y)}`).join(' ')} ${x(item.points.at(-1)!.x)},${y(0)}`} /> : null}
          {content.style === 'line' || content.style === 'area' ? <polyline fill="none" points={item.points.map((point) => `${x(point.x)},${y(point.y)}`).join(' ')} strokeDasharray={index ? `${10 + index * 3} ${4 + index * 2}` : undefined} /> : null}
          {item.points.map((point, pointIndex) => content.style === 'bar' ? <rect key={point.x} x={x(point.x) + (index - content.series.length / 2) * barWidth} y={Math.min(y(point.y), y(0))} width={Math.max(1, barWidth - 2)} height={Math.abs(y(point.y) - y(0))}><title>{item.label}: {point.label || point.x}, {point.y}</title></rect> : <circle key={pointIndex} cx={x(point.x)} cy={y(point.y)} r={4}><title>{item.label}: {point.label || point.x}, {point.y}</title></circle>)}
        </g>
      })}
      {Array.from(new Map(points.map((point) => [point.x, point])).values()).filter((_, i, all) => all.length <= 8 || i % Math.ceil(all.length / 6) === 0).map((point) => <text className="plot-tick" key={point.x} x={x(point.x)} y={410} textAnchor="middle">{content.style === 'scatter' ? formatNumber(point.x) : point.label || formatNumber(point.x)}</text>)}
      <text className="plot-label" x={450} y={452} textAnchor="middle">{content.x_label}</text><text className="plot-label" transform="translate(20,220) rotate(-90)" textAnchor="middle">{content.y_label}</text>
    </svg></div>
    <p className="visual-explanation">{content.description}</p>
    <details className="visual-transcript"><summary>Inspect the underlying values</summary><div className="plot-data"><table><thead><tr><th scope="col">Series</th><th scope="col">{content.x_label}</th><th scope="col">{content.y_label}</th></tr></thead><tbody>{content.series.flatMap((item) => item.points.map((point, pointIndex) => <tr key={`${item.label}-${pointIndex}`}><th scope="row">{item.label}</th><td>{point.label ? `${point.label} (${point.x})` : point.x}</td><td>{point.y}</td></tr>))}</tbody></table></div></details>
  </figure>
}

function formatNumber(value: number): string { return new Intl.NumberFormat('en', { maximumSignificantDigits: 4 }).format(value) }

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, ArrowsHorizontal, FileText } from '@phosphor-icons/react'
import { SourcePageCanvas } from './SourcePageCanvas'

export function SourceVisualViewer({ sourceId, page, bbox, alt, onReady, initialContext = false }: {
  sourceId: string; page: number; bbox: [number, number, number, number]; alt: string
  onReady?: (result: { width: number; height: number } | { error: string }) => void
  initialContext?: boolean
}) {
  const [zoom, setZoom] = useState(1)
  const [context, setContext] = useState(initialContext)
  const [fitPage, setFitPage] = useState(true)
  const [aspect, setAspect] = useState<number | null>(null)
  const [bounds, setBounds] = useState({ width: 900, height: 600 })
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  useEffect(() => {
    if (!viewport.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  const width = Math.floor(fitPage && aspect ? Math.min(bounds.width, Math.max(1, bounds.height - 8) * aspect) : bounds.width)
  return <div className="source-visual-viewer">
    <div className="figure-toolbar" role="group" aria-label="Original figure view">
      <button type="button" aria-label="Zoom out" disabled={zoom <= .5} onClick={() => setZoom(value => Math.max(.5, value - .25))}><Minus /></button>
      <output aria-label="Figure zoom">{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label="Zoom in" disabled={zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .25))}><Plus /></button>
      <button type="button" aria-pressed={fitPage} onClick={() => { setFitPage(true); setZoom(1); viewport.current?.scrollTo?.(0, 0) }}><FileText /> Fit page</button>
      <button type="button" aria-pressed={!fitPage} onClick={() => { setFitPage(false); setZoom(1); viewport.current?.scrollTo?.(0, 0) }}><ArrowsHorizontal /> Fit width</button>
      <button type="button" aria-pressed={context} onClick={() => { setContext(value => !value); setAspect(null); setZoom(1); viewport.current?.scrollTo?.(0, 0) }}><FileText /> {context ? 'Show figure crop' : 'Full page context'}</button>
    </div>
    <div ref={viewport} className="figure-viewport" tabIndex={0} aria-label="Original figure. Zoom for detail; scroll or drag to pan."
      onPointerDown={event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || !(event.target instanceof HTMLCanvasElement)) return
        const target = event.currentTarget
        drag.current = { x: event.clientX, y: event.clientY, left: target.scrollLeft, top: target.scrollTop }
        target.setPointerCapture(event.pointerId)
      }}
      onPointerMove={event => {
        const origin = drag.current
        if (!origin) return
        event.currentTarget.scrollLeft = origin.left - event.clientX + origin.x
        event.currentTarget.scrollTop = origin.top - event.clientY + origin.y
      }}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}>
      <div className="figure-zoom-surface" style={{ width: `${width * zoom}px`, marginInline: 'auto' }}>
        <SourcePageCanvas sourceId={sourceId} page={page} bbox={context ? [0, 0, 1, 1] : bbox} alt={context ? `Full original page ${page}. ${alt}` : alt} onReady={result => {
          if ('width' in result && result.height > 0) {
            const next = result.width / result.height
            setAspect(previous => previous !== null && Math.abs(previous - next) < .005 ? previous : next)
          }
          onReady?.(result)
        }} eager detail />
      </div>
    </div>
    <p className="figure-view-hint">Original PDF · zoom renders additional detail where available. Full page context includes anything outside the crop.</p>
  </div>
}

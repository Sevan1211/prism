import { useEffect, useRef, useState } from 'react'
import { acquireSourcePdf } from '../storage/sourcePdfDocument'
import { pdfRenderSize } from './pdfRenderSize'

export function SourcePageCanvas({ sourceId, page, bbox, alt, onReady, eager = false, detail = false }: {
  sourceId: string; page: number; bbox: [number, number, number, number]; alt: string; eager?: boolean
  onReady?: (result: { width: number; height: number } | { error: string }) => void
  detail?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [displayWidth, setDisplayWidth] = useState(900)
  const readyRef = useRef(onReady)
  useEffect(() => { readyRef.current = onReady }, [onReady])
  useEffect(() => {
    const element = wrapper.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      if (width > 0) setDisplayWidth(width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const [left, top, right, bottom] = bbox
  useEffect(() => {
    let cancelled = false
    let cancelRender: (() => void) | undefined
    let release: (() => void) | undefined
    const canvas = canvasRef.current
    if (!canvas || !wrapper.current) return
    const render = async () => {
      setStatus('loading')
      try {
        const lease = await acquireSourcePdf(sourceId)
        release = lease.release
        if (cancelled) return
        const pdfPage = await lease.document.getPage(page)
        if (cancelled) return
        const original = pdfPage.getViewport({ scale: 1 })
        const cropWidth = original.width * (right - left)
        const cropHeight = original.height * (bottom - top)
        const size = pdfRenderSize(cropWidth, cropHeight, displayWidth, window.devicePixelRatio || 1, detail)
        const scale = size.scale
        const viewport = pdfPage.getViewport({ scale })
        canvas.width = size.width
        canvas.height = size.height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas unavailable in this browser.')
        const task = pdfPage.render({ canvas, canvasContext: context, viewport, transform: [1, 0, 0, 1, -left * viewport.width, -top * viewport.height] })
        cancelRender = () => task.cancel()
        await task.promise
        if (!cancelled) { setStatus('ready'); readyRef.current?.({ width: canvas.width, height: canvas.height }) }
      } catch (cause) {
        if (!cancelled) { setStatus('error'); readyRef.current?.({ error: cause instanceof Error ? cause.message : 'Page rendering failed.' }) }
      } finally { release?.() }
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      void render()
    }, { rootMargin: '400px' })
    if (eager) void render()
    else observer.observe(wrapper.current)
    return () => { cancelled = true; observer.disconnect(); cancelRender?.(); release?.() }
  }, [sourceId, page, left, top, right, bottom, attempt, eager, displayWidth, detail])
  return <div ref={wrapper} className="source-page-canvas" data-render-status={status}>
    <canvas ref={canvasRef} role="img" aria-label={alt || `Original PDF page ${page}`} hidden={status !== 'ready'} />
    {status === 'loading' ? <p className="page-image-loading" role="status">Opening original page…</p> : null}
    {status === 'error' ? <div role="alert"><p>The original page could not be rendered.</p><button type="button" className="button-secondary" onClick={() => setAttempt((value) => value + 1)}>Retry page</button></div> : null}
  </div>
}

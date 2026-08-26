import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  searchSource,
  readingState as fetchReadingState,
  sourcePdfUrl,
  updateReadingState,
} from './api'
import { ThemeToggle } from './ThemeToggle'
import type { ReadingState, SearchHit, SourceSection, SourceStructure, SourceSummary } from './types'

// pdfjs-dist is loaded on demand: it needs browser globals jsdom lacks, and the
// library shell should not pay its weight until a book is actually opened.
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  return pdfjs
}

const PAGE_GAP = 18
const RENDER_WINDOW = 2

interface ReaderProps {
  source: SourceSummary
  structure: SourceStructure | null
  onExit: () => void
}

interface PageGeometry {
  width: number
  height: number
}

export function Reader({ source, structure, onExit }: ReaderProps) {
  const pageCount = source.page_count ?? 1
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [geometry, setGeometry] = useState<PageGeometry | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [furthestPage, setFurthestPage] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [highlight, setHighlight] = useState<SearchHit | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)
  const saveTimer = useRef<number | null>(null)

  const sections = useMemo(() => structure?.sections ?? [], [structure])
  const pageGroups = useMemo<SourceSection[]>(() => {
    if (sections.length > 0) return []
    const groups: SourceSection[] = []
    for (let start = 1; start <= pageCount; start += 20) {
      const end = Math.min(pageCount, start + 19)
      groups.push({
        id: `pages-${start}`,
        parent_id: null,
        title: `Pages ${start}–${end}`,
        level: 1,
        page_start: start,
        page_end: end,
        origin: 'computed',
        confidence: 0,
      })
    }
    return groups
  }, [pageCount, sections.length])
  const railSections = sections.length > 0 ? sections : pageGroups

  useEffect(() => {
    let cancelled = false
    let destroyTask: (() => void) | null = null
    void loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null
        const task = pdfjs.getDocument({ url: sourcePdfUrl(source.id) })
        destroyTask = () => void task.destroy()
        return task.promise
      })
      .then(async (loaded) => {
        if (!loaded || cancelled) return
        const first = await loaded.getPage(1)
        const viewport = first.getViewport({ scale: 1 })
        if (cancelled) return
        setGeometry({ width: viewport.width, height: viewport.height })
        setDoc(loaded)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoadError(cause instanceof Error ? cause.message : 'The PDF could not be loaded.')
        }
      })
    return () => {
      cancelled = true
      destroyTask?.()
    }
  }, [source.id])

  const pageHeightFor = useCallback(
    (containerWidth: number) => {
      if (!geometry) return 900
      const width = Math.min(760, containerWidth - 32)
      return (geometry.height / geometry.width) * width
    },
    [geometry],
  )

  const jumpToPage = useCallback(
    (page: number, ratio = 0) => {
      const container = scrollRef.current
      if (!container) return
      const pageHeight = pageHeightFor(container.clientWidth)
      // +2px keeps the boundary landing inside the target page after rounding.
      const top = (page - 1) * (pageHeight + PAGE_GAP) + ratio * pageHeight + 2
      container.scrollTop = top
      setCurrentPage(page)
    },
    [pageHeightFor],
  )

  const hasGeometry = geometry !== null
  useEffect(() => {
    let cancelled = false
    fetchReadingState(source.id)
      .then((state: ReadingState) => {
        if (cancelled) return
        setFurthestPage(state.furthest_page)
        if (!restoredRef.current && hasGeometry) {
          restoredRef.current = true
          jumpToPage(state.last_page, state.last_scroll_ratio)
          setCurrentPage(state.last_page)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [source.id, hasGeometry, jumpToPage])

  const persistPosition = useCallback(
    (page: number, ratio: number) => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void updateReadingState(source.id, page, ratio)
          .then((state) => setFurthestPage(state.furthest_page))
          .catch(() => undefined)
      }, 700)
    },
    [source.id],
  )

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const pageHeight = pageHeightFor(container.clientWidth) + PAGE_GAP
    const rawIndex = container.scrollTop / pageHeight
    const page = Math.min(pageCount, Math.max(1, Math.floor(rawIndex) + 1))
    const ratio = Math.min(1, Math.max(0, rawIndex - Math.floor(rawIndex)))
    setCurrentPage(page)
    persistPosition(page, ratio)
  }, [pageCount, pageHeightFor, persistPosition])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, select, textarea')) return
      if (event.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  async function runSearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
      setHits(null)
      return
    }
    try {
      const response = await searchSource(source.id, trimmed)
      setHits(response.hits)
    } catch {
      setHits([])
    }
  }

  const activeSection = railSections.find(
    (section) => section.page_start <= currentPage && currentPage <= section.page_end
      && section.level === 1,
  ) ?? railSections.find(
    (section) => section.page_start <= currentPage && currentPage <= section.page_end,
  )

  return (
    <div className="reader-shell">
      <header className="reader-header">
        <button className="wordmark compact" type="button" onClick={onExit} aria-label="Return to library">
          <span className="prism-mark" aria-hidden="true" />
          <span>PRISM</span>
        </button>
        <div className="reader-identity">
          <strong>{source.original_name}</strong>
          <span>
            page {currentPage} of {pageCount} · reached {Math.max(furthestPage, currentPage)} · exposure, not learning
          </span>
        </div>
        <div className="reader-tools">
          <form
            className="reader-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              void runSearch(searchInput)
            }}
          >
            <input
              type="search"
              value={searchInput}
              placeholder="Search this source…"
              aria-label="Search this source"
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {hits !== null ? (
              <div className="search-panel" role="region" aria-label="Search results">
                <div className="search-panel-head">
                  <span>{hits.length} result{hits.length === 1 ? '' : 's'}</span>
                  <button type="button" onClick={() => setHits(null)}>Close</button>
                </div>
                <ul className="search-results">
                  {hits.slice(0, 12).map((hit) => (
                    <li key={hit.element_id}>
                      <button
                        type="button"
                        onClick={() => {
                          jumpToPage(hit.page_number)
                          setHighlight(hit)
                          setHits(null)
                        }}
                      >
                        <span className="hit-meta">
                          p.{hit.page_number} · {hit.kind} · {hit.status.replaceAll('_', ' ')}
                        </span>
                        <span>{renderSnippet(hit.snippet)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </form>
          <ThemeToggle />
        </div>
      </header>

      <div className="reader-grid">
        <nav className="reader-rail" aria-label="Document structure">
          <div className="reader-rail-head">
            <p className="eyebrow">
              {structure?.origin === 'outline'
                ? 'Contents'
                : structure?.origin === 'computed'
                  ? 'Detected structure'
                  : 'Pages'}
            </p>
          </div>
          <div className="reader-rail-list">
            {railSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={[
                  'rail-section',
                  `level-${Math.min(4, section.level)}`,
                  activeSection?.id === section.id ? 'is-active' : '',
                  furthestPage >= section.page_start ? 'is-reached' : '',
                ].join(' ').trim()}
                onClick={() => jumpToPage(section.page_start)}
              >
                <span className="rail-title">{section.title}</span>
                <span className="rail-page">{section.page_start}</span>
              </button>
            ))}
          </div>
        </nav>

        <div
          className="reader-pages"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Document pages"
        >
          {loadError ? (
            <p className="error-message" role="alert">{loadError}</p>
          ) : (
            Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <ReaderPage
                key={page}
                doc={doc}
                page={page}
                geometry={geometry}
                visible={Math.abs(page - currentPage) <= RENDER_WINDOW}
                highlight={highlight?.page_number === page ? highlight : null}
              />
            ))
          )}
        </div>

        <aside className="reader-context" aria-label="Reading context">
          <div className="context-block">
            <p className="eyebrow">Position</p>
            <h3>{activeSection?.title ?? 'Untitled region'}</h3>
            <p className="evidence">
              page {currentPage} / {pageCount}
              <br />rights: {source.rights_status}
              <br />local only
            </p>
          </div>
          <p className="reader-progress-note">
            Progress here is exposure — pages reached, never demonstrated learning.
          </p>
        </aside>
      </div>
    </div>
  )
}

function ReaderPage({
  doc,
  page,
  geometry,
  visible,
  highlight,
}: {
  doc: PDFDocumentProxy | null
  page: number
  geometry: PageGeometry | null
  visible: boolean
  highlight: SearchHit | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!doc || !visible || !geometry) return
    let cancelled = false
    let cancelRender: (() => void) | null = null
    void doc.getPage(page).then((pdfPage) => {
      if (cancelled) return
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return
      const scale = Math.min(2, (760 * (window.devicePixelRatio || 1)) / geometry.width)
      const viewport = pdfPage.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = pdfPage.render({ canvasContext: context, viewport, canvas })
      cancelRender = () => task.cancel()
      task.promise.then(
        () => {
          if (!cancelled) setRendered(true)
        },
        () => undefined,
      )
    })
    return () => {
      cancelled = true
      cancelRender?.()
    }
  }, [doc, geometry, page, visible])

  const aspect = geometry ? `${geometry.width} / ${geometry.height}` : '3 / 4'
  return (
    <div className="reader-page" style={{ aspectRatio: aspect }} data-page={page}>
      {visible ? (
        <canvas ref={canvasRef} aria-label={`Page ${page}`} />
      ) : null}
      {!rendered || !visible ? (
        <div className="page-placeholder" style={{ position: 'absolute', inset: 0 }}>
          {page}
        </div>
      ) : null}
      <span className="page-label" aria-hidden="true">{page}</span>
      {highlight ? (
        <span
          className="reader-highlight"
          style={{
            left: `${highlight.bbox_normalized[0] * 100}%`,
            top: `${highlight.bbox_normalized[1] * 100}%`,
            width: `${(highlight.bbox_normalized[2] - highlight.bbox_normalized[0]) * 100}%`,
            height: `${(highlight.bbox_normalized[3] - highlight.bbox_normalized[1]) * 100}%`,
          }}
        />
      ) : null}
    </div>
  )
}

function renderSnippet(snippet: string) {
  const parts = snippet.split(/\[([^\]]+)\]/g)
  return parts.map((part, index) =>
    index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  )
}

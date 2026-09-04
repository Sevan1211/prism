import { completeContents } from './reader/contentsTree'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  Info,
  List,
  MagnifyingGlass,
  Minus,
  Plus,
  X,
} from '@phosphor-icons/react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { sourcePath } from './navigation'
import { PrismLink } from './PrismLink'
import { loadPdfjs } from './pdfjs'
import { pdfDocumentOptions } from './pdfResources'
import {
  inspectPdfDocument,
  type PdfDocumentDetails,
} from './reader/pdfDocumentStructure'
import { ReaderContents } from './reader/ReaderContents'
import { LibraryStorage } from './LibraryStorage'
import { PrismHelp } from './PrismHelp'
import { ThemeToggle } from './ThemeToggle'
import { LoadingState } from './LoadingState'
import type {
  ReadingState,
  SearchHit,
  SearchResponse,
  SourceSection,
  SourceStructure,
  SourceSummary,
} from './types'

const RENDER_WINDOW = 2
const EMPTY_SECTIONS: SourceSection[] = []
const EMPTY_DOCUMENT_DETAILS: PdfDocumentDetails = {
  author: null,
  creator: null,
  format: null,
  keywords: null,
  producer: null,
  subject: null,
  title: null,
}

export interface ReaderProps {
  access: ReaderAccess
  initialHighlight?: SearchHit | null
  initialPage?: number
  navigationRequestId?: number
  onExit: () => void
  onReload?: () => void
  onNavigatePage?: (page: number, replace: boolean) => void
  source: SourceSummary
  structure: SourceStructure | null
}

export interface ReaderAccess {
  loadReadingState: () => Promise<ReadingState>
  pdfUrl: string
  saveReadingState: (lastPage: number, lastScrollRatio: number) => Promise<ReadingState>
  search: (query: string) => Promise<SearchResponse>
  storageLabel: string
}

interface PageGeometry {
  width: number
  height: number
}

type FitMode = 'page' | 'width'
type NavigationHistory = 'push' | 'replace' | 'silent'

export function Reader({
  access,
  initialHighlight,
  initialPage,
  navigationRequestId,
  onExit,
  onReload,
  onNavigatePage,
  source,
  structure,
}: ReaderProps) {
  const pageCount = source.page_count ?? 1
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [geometry, setGeometry] = useState<PageGeometry | null>(null)
  const [pdfSections, setPdfSections] = useState<SourceSection[]>([])
  const [pageLabels, setPageLabels] = useState<string[] | null>(null)
  const [documentDetails, setDocumentDetails] = useState<PdfDocumentDetails>(EMPTY_DOCUMENT_DETAILS)
  const [currentPage, setCurrentPage] = useState(1)
  const [furthestPage, setFurthestPage] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchBusy, setSearchBusy] = useState(false)
  const searchRequest = useRef(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlight, setHighlight] = useState<SearchHit | null>(initialHighlight ?? null)
  const [contentsOpen, setContentsOpen] = useState(() => window.innerWidth > 700)
  const [detailsOpen, setDetailsOpen] = useState(() => window.innerWidth > 1180)
  const [contentsFilter, setContentsFilter] = useState('')
  const [fitMode, setFitMode] = useState<FitMode>('width')
  const [zoom, setZoom] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const restoredRef = useRef(false)
  const navigationRequestRef = useRef<number | undefined>(undefined)
  const saveTimer = useRef<number | null>(null)
  const scrollFrame = useRef<number | null>(null)
  const currentPageRef = useRef(1)

  const sections = useMemo(() => structure?.sections ?? [], [structure])
  const pageGroups = useMemo<SourceSection[]>(() => {
    if (sections.length > 0) return []
    const groups: SourceSection[] = []
    for (let start = 1; start <= pageCount; start += 20) {
      const end = Math.min(pageCount, start + 19)
      groups.push({
        id: `pages-${start}`,
        parent_id: null,
        title: `Pages ${start}-${end}`,
        level: 1,
        page_start: start,
        page_end: end,
        origin: 'computed',
        confidence: 0,
      })
    }
    return groups
  }, [pageCount, sections.length])
  const authoredSections = pdfSections.length ? pdfSections : structure?.origin === 'outline' ? sections : EMPTY_SECTIONS
  const computedSections = structure?.origin === 'computed' ? sections : EMPTY_SECTIONS
  const railSections = useMemo(() => authoredSections.length || computedSections.length
    ? completeContents(authoredSections, computedSections) : pageGroups, [authoredSections, computedSections, pageGroups])
  const railOrigin = authoredSections.length > 0
    ? 'outline'
    : computedSections.length > 0
      ? 'computed'
      : 'none'
  const uniqueHits = useMemo(() => {
    if (hits === null) return null

    const seen = new Set<string>()
    return hits.filter((hit) => {
      if (seen.has(hit.element_id)) return false
      seen.add(hit.element_id)
      return true
    })
  }, [hits])

  useEffect(() => {
    let cancelled = false
    let destroyTask: (() => void) | null = null
    void loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null
        const task = pdfjs.getDocument({ url: access.pdfUrl, ...pdfDocumentOptions(pdfjs.version) })
        destroyTask = () => { void Promise.resolve(task.destroy()).catch(() => undefined) }
        return task.promise
      })
      .then(async (loaded) => {
        if (!loaded || cancelled) return
        const first = await loaded.getPage(1)
        const viewport = first.getViewport({ scale: 1 })
        if (cancelled) return
        setGeometry({ width: viewport.width, height: viewport.height })
        setDoc(loaded)
        const inspection = await inspectPdfDocument(loaded, loaded.numPages).catch(() => null)
        if (cancelled || !inspection) return
        setPdfSections(inspection.sections)
        setPageLabels(inspection.pageLabels)
        setDocumentDetails(inspection.details)
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
  }, [access.pdfUrl])

  const setPage = useCallback((page: number) => {
    currentPageRef.current = page
    setCurrentPage(page)
    setPageInput(String(page))
  }, [])

  const jumpToPage = useCallback((
    requestedPage: number,
    ratio = 0,
    history: NavigationHistory = 'push',
  ) => {
    const page = Math.min(pageCount, Math.max(1, Math.round(requestedPage)))
    const container = scrollRef.current
    const target = container?.querySelector<HTMLElement>(`[data-page="${page}"]`)
    if (container && target) {
      const paddingTop = Number.parseFloat(getComputedStyle(container).paddingTop) || 0
      container.scrollTop = target.offsetTop - paddingTop + ratio * target.clientHeight
    }
    setPage(page)
    if (history !== 'silent') onNavigatePage?.(page, history === 'replace')
  }, [onNavigatePage, pageCount, setPage])

  const hasGeometry = geometry !== null
  useEffect(() => {
    let cancelled = false
    access.loadReadingState()
      .then((state: ReadingState) => {
        if (cancelled) return
        setFurthestPage(state.furthest_page)
        if (!restoredRef.current && hasGeometry) {
          restoredRef.current = true
          const restorePage = initialPage ?? state.last_page
          jumpToPage(
            restorePage,
            initialPage ? 0 : state.last_scroll_ratio,
            initialPage ? 'silent' : 'replace',
          )
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [access, hasGeometry, initialPage, jumpToPage])

  useEffect(() => {
    if (!hasGeometry || !initialPage || initialPage === currentPageRef.current) return
    restoredRef.current = true
    jumpToPage(initialPage, 0, 'silent')
  }, [hasGeometry, initialPage, jumpToPage])

  useEffect(() => {
    if (!hasGeometry || !initialPage || navigationRequestId === undefined) return
    if (navigationRequestRef.current === navigationRequestId) return
    navigationRequestRef.current = navigationRequestId
    restoredRef.current = true
    jumpToPage(initialPage, 0, 'silent')
    setHighlight(initialHighlight ?? null)
  }, [hasGeometry, initialHighlight, initialPage, jumpToPage, navigationRequestId])

  const persistPosition = useCallback((page: number, ratio: number) => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void access.saveReadingState(page, ratio)
        .then((state) => setFurthestPage(state.furthest_page))
        .catch(() => undefined)
    }, 700)
  }, [access])

  const updateScrollPosition = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const paddingTop = Number.parseFloat(getComputedStyle(container).paddingTop) || 0
    const readingLine = container.scrollTop + paddingTop + 1
    const bounds = container.getBoundingClientRect()
    const selected = typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(bounds.left + bounds.width / 2, bounds.top + paddingTop + 1)
        .map((element) => element.closest<HTMLElement>('.reader-page'))
        .find((element): element is HTMLElement => element !== null)
      : container.querySelector<HTMLElement>(`[data-page="${currentPageRef.current}"]`)
    if (!selected) return
    const height = Math.max(1, selected.clientHeight)
    const page = Math.min(pageCount, Math.max(1, Number(selected.dataset.page) || 1))
    const ratio = Math.min(1, Math.max(0, (readingLine - selected.offsetTop) / height))
    if (page !== currentPageRef.current) {
      setPage(page)
      onNavigatePage?.(page, true)
    }
    persistPosition(page, ratio)
  }, [onNavigatePage, pageCount, persistPosition, setPage])

  const handleScroll = useCallback(() => {
    if (scrollFrame.current !== null) return
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null
      updateScrollPosition()
    })
  }, [updateScrollPosition])

  useEffect(() => () => {
    if (scrollFrame.current !== null) {
      window.cancelAnimationFrame(scrollFrame.current)
      scrollFrame.current = null
    }
  }, [])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isInput = target?.matches('input, select, textarea, [contenteditable="true"]')
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'f') {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
        return
      }
      if (event.key === 'Escape') {
        if (searchOpen || hits !== null) {
          setSearchOpen(false)
          setHits(null)
        } else {
          onExit()
        }
        return
      }
      if (isInput || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === '[') setContentsOpen((current) => !current)
      if (event.key === ']') setDetailsOpen((current) => !current)
      if (event.key === '+' || event.key === '=') setZoom((current) => Math.min(2, current + 0.1))
      if (event.key === '-') setZoom((current) => Math.max(0.6, current - 0.1))
      if (event.key === '0') {
        setFitMode('width')
        setZoom(1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hits, onExit, searchOpen])

  async function runSearch(query: string) {
    const request = ++searchRequest.current
    const trimmed = query.trim()
    if (!trimmed) {
      setHits(null)
      setSearchError(null)
      setSearchBusy(false)
      return
    }
    setSearchBusy(true)
    setSearchError(null)
    try {
      const response = await access.search(trimmed)
      if (request === searchRequest.current) setHits(response.hits)
    } catch (cause) {
      if (request === searchRequest.current) {
        setHits(null)
        setSearchError(cause instanceof Error ? cause.message : 'This source could not be searched.')
      }
    } finally {
      if (request === searchRequest.current) setSearchBusy(false)
    }
  }

  const activeSection = railSections
    .filter((section) => section.page_start <= currentPage && currentPage <= section.page_end)
    .sort((left, right) => right.level - left.level || right.page_start - left.page_start)[0]
  const printedPage = pageLabels?.[currentPage - 1]
  const documentTitle = documentDetails.title && documentDetails.title !== source.original_name
    ? documentDetails.title
    : cleanTitle(source.original_name)
  const pageStyle = {
    '--reader-zoom': zoom,
    '--page-ratio': geometry ? geometry.width / geometry.height : 0.77,
  } as CSSProperties

  return (
    <div className="reader-shell" style={pageStyle}>
      <a className="skip-link" href="#reader-pages">Skip to document</a>
      <header className="reader-header">
        <div className="reader-title-group">
          <PrismLink
            className="reader-back"
            href={sourcePath(source.id)}
            aria-label="Return to source workspace"
            onClick={(event) => {
              if (
                event.button === 0
                && !event.metaKey
                && !event.ctrlKey
                && !event.shiftKey
                && !event.altKey
              ) {
                event.preventDefault()
                onExit()
              }
            }}
          >
            <ArrowLeft aria-hidden="true" weight="bold" />
          </PrismLink>
          <div className="reader-identity">
            <strong title={documentTitle}>{documentTitle}</strong>
            <span>{activeSection?.title ?? 'Original PDF'}</span>
          </div>
        </div>

        <div className="reader-toolbar" aria-label="Reader controls">
          <button
            className={contentsOpen ? 'is-active' : ''}
            type="button"
            aria-label={contentsOpen ? 'Hide contents' : 'Show contents'}
            aria-pressed={contentsOpen}
            title="Contents ["
            onClick={() => setContentsOpen((current) => !current)}
          >
            <List aria-hidden="true" />
          </button>
          <span className="toolbar-separator" />
          <button
            type="button"
            aria-label="Previous page"
            title="Previous page"
            disabled={currentPage <= 1}
            onClick={() => jumpToPage(currentPage - 1)}
          >
            <CaretLeft aria-hidden="true" weight="bold" />
          </button>
          <form className="page-jump" onSubmit={(event) => {
            event.preventDefault()
            const requested = Number(pageInput)
            if (Number.isFinite(requested)) jumpToPage(requested)
            else setPageInput(String(currentPage))
          }}>
            <label className="sr-only" htmlFor="reader-page-input">PDF page</label>
            <input
              id="reader-page-input"
              inputMode="numeric"
              value={pageInput}
              onChange={(event) => setPageInput(event.currentTarget.value)}
              onBlur={() => setPageInput(String(currentPage))}
            />
            <span>of {pageCount}</span>
          </form>
          <button
            type="button"
            aria-label="Next page"
            title="Next page"
            disabled={currentPage >= pageCount}
            onClick={() => jumpToPage(currentPage + 1)}
          >
            <CaretRight aria-hidden="true" weight="bold" />
          </button>
          <span className="toolbar-separator" />
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={zoom <= 0.6}
            onClick={() => setZoom((current) => Math.max(0.6, current - 0.1))}
          >
            <Minus aria-hidden="true" weight="bold" />
          </button>
          <span className="zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={zoom >= 2}
            onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
          >
            <Plus aria-hidden="true" weight="bold" />
          </button>
          <select
            className="fit-select"
            aria-label="Page fit"
            value={fitMode}
            onChange={(event) => setFitMode(event.currentTarget.value as FitMode)}
          >
            <option value="width">Fit width</option>
            <option value="page">Fit page</option>
          </select>
        </div>

        <div className="reader-header-actions">
          <button
            className={searchOpen ? 'is-active' : ''}
            type="button"
            aria-label="Search this source"
            aria-pressed={searchOpen}
            title="Search this source (Ctrl+F)"
            onClick={() => {
              setSearchOpen((current) => !current)
              window.setTimeout(() => searchInputRef.current?.focus(), 0)
            }}
          >
            <MagnifyingGlass aria-hidden="true" />
          </button>
          <button
            className={detailsOpen ? 'is-active' : ''}
            type="button"
            aria-label={detailsOpen ? 'Hide document details' : 'Show document details'}
            aria-pressed={detailsOpen}
            title="Document details ]"
            onClick={() => setDetailsOpen((current) => !current)}
          >
            <Info aria-hidden="true" />
          </button>
          <PrismHelp compact />
          <LibraryStorage compact />
          <ThemeToggle />
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        PDF page {currentPage} of {pageCount}
        {printedPage && printedPage !== String(currentPage) ? `, printed page ${printedPage}` : ''}.
        Reached {Math.max(furthestPage, currentPage)}.
      </p>

      {searchOpen ? (
        <section className="reader-search-panel" aria-label="Search this source">
          <form role="search" aria-busy={searchBusy} onSubmit={(event) => {
            event.preventDefault()
            void runSearch(searchInput)
          }}>
            <MagnifyingGlass aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchInput}
              placeholder="Search words, formulas, or concepts"
              aria-label="Search this source"
              onChange={(event) => setSearchInput(event.currentTarget.value)}
            />
            <button className="button-primary" type="submit" disabled={searchBusy || !searchInput.trim()}>
              {searchBusy ? 'Searching…' : 'Find in source'}
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false)
                setHits(null)
              }}
            >
              <X aria-hidden="true" weight="bold" />
            </button>
          </form>
          {searchError ? <p className="search-error" role="alert">{searchError}</p> : null}
          {uniqueHits !== null ? (
            <div className="search-results-panel">
              <p>{uniqueHits.length} result{uniqueHits.length === 1 ? '' : 's'}</p>
              <ul className="search-results">
                {uniqueHits.slice(0, 20).map((hit) => (
                  <li key={hit.element_id}>
                    <button type="button" onClick={() => {
                      jumpToPage(hit.page_number)
                      setHighlight(hit)
                      setSearchOpen(false)
                      setHits(null)
                    }}>
                      <span className="hit-meta">p.{hit.page_number} / {hit.kind} / {hit.status.replaceAll('_', ' ')}</span>
                      <span>{renderSnippet(hit.snippet)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="reader-grid" data-contents={contentsOpen} data-details={detailsOpen}>
        {contentsOpen ? (
          <nav className="reader-rail" aria-label="Document structure">
            <header className="reader-panel-heading">
              <div>
                <strong>{railOrigin === 'none' ? 'Page index' : 'Contents'}</strong>
                <span>
                  {railOrigin === 'outline'
                    ? `${railSections.length} document ${railSections.some(section => section.origin === 'computed') ? 'headings & bookmarks' : 'bookmarks'}`
                    : railOrigin === 'computed'
                      ? `${railSections.length} detected headings`
                      : 'No recoverable contents found'}
                </span>
              </div>
            </header>
            {railSections.length > 14 ? (
              <label className="contents-filter">
                <MagnifyingGlass aria-hidden="true" />
                <span className="sr-only">Filter document contents</span>
                <input
                  type="search"
                  placeholder="Filter contents"
                  value={contentsFilter}
                  onChange={(event) => setContentsFilter(event.currentTarget.value)}
                />
              </label>
            ) : null}
            <ReaderContents sections={railSections} query={contentsFilter} activeId={activeSection?.id}
              pageLabels={pageLabels} onNavigate={jumpToPage} />
          </nav>
        ) : null}

        <div
          className="reader-pages"
          data-fit={fitMode}
          id="reader-pages"
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Document pages"
        >
          {loadError || !doc || !geometry ? (
            <LoadingState compact title="Preparing the pages" detail="Rendering the original document. Text selection and the contents outline will be ready shortly." error={loadError} onRetry={onReload ?? (() => window.location.reload())} />
          ) : (
            Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <ReaderPage
                key={page}
                doc={doc}
                fitMode={fitMode}
                geometry={geometry}
                highlight={highlight?.page_number === page ? highlight : null}
                page={page}
                visible={Math.abs(page - currentPage) <= RENDER_WINDOW}
                zoom={zoom}
              />
            ))
          )}
        </div>

        {detailsOpen ? (
          <aside className="reader-context" aria-label="Document details">
            <header className="reader-panel-heading">
              <div>
                <strong>Document</strong>
                <span>Original source details</span>
              </div>
            </header>
            <div className="context-block">
              <p className="page-kicker">Current section</p>
              <h2>{activeSection?.title ?? 'Untitled region'}</h2>
              <dl className="document-details">
                <Detail label="PDF page" value={`${currentPage} of ${pageCount}`} />
                {printedPage && printedPage !== String(currentPage)
                  ? <Detail label="Printed page" value={printedPage} />
                  : null}
                <Detail label="Author" value={documentDetails.author} />
                <Detail label="Subject" value={documentDetails.subject} />
                <Detail label="PDF format" value={documentDetails.format} />
                <Detail label="Contents" value={railOrigin === 'none' ? 'Unavailable' : `${railSections.length} entries`} />
                <Detail label="Rights" value={source.rights_status.replaceAll('_', ' ')} />
                <Detail label="Storage" value={access.storageLabel} />
              </dl>
            </div>
            <p className="reader-progress-note">
              Reached page {Math.max(furthestPage, currentPage)}. This records exposure, not demonstrated learning.
            </p>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ReaderPage({
  doc,
  fitMode,
  geometry,
  highlight,
  page,
  visible,
  zoom,
}: {
  doc: PDFDocumentProxy | null
  fitMode: FitMode
  geometry: PageGeometry | null
  highlight: SearchHit | null
  page: number
  visible: boolean
  zoom: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [renderWidth, setRenderWidth] = useState(0)
  const [pageGeometry, setPageGeometry] = useState<PageGeometry | null>(null)
  const [renderError, setRenderError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!visible) return undefined
    const element = pageRef.current
    if (!element) return undefined
    const update = () => setRenderWidth(Math.max(1, Math.round(element.clientWidth || 760)))
    update()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [fitMode, visible, zoom])

  useEffect(() => {
    if (!doc || !visible || !geometry || renderWidth <= 0) return undefined
    const canvas = canvasRef.current
    const textContainer = textLayerRef.current
    if (!canvas || !textContainer) return undefined
    let cancelled = false
    let canvasRendered = false
    let cancelRender: (() => void) | null = null
    let cancelTextLayer: (() => void) | null = null
    setRendered(false)
    setRenderError(false)
    void Promise.all([doc.getPage(page), loadPdfjs()]).then(async ([pdfPage, pdfjs]) => {
      if (cancelled) return
      const context = canvas.getContext('2d')
      const actual = pdfPage.getViewport({ scale: 1 })
      setPageGeometry((previous) => previous?.width === actual.width && previous.height === actual.height ? previous : { width: actual.width, height: actual.height })
      const cssScale = Math.max(0.01, renderWidth / actual.width)
      const outputScale = Math.min(2, window.devicePixelRatio || 1)
      let canvasRender: Promise<unknown> = Promise.resolve()
      if (context) {
        const viewport = pdfPage.getViewport({ scale: cssScale * outputScale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const task = pdfPage.render({ canvasContext: context, viewport, canvas })
        cancelRender = () => task.cancel()
        canvasRender = task.promise
          .then(() => {
            canvasRendered = true
          })
          .catch((cause: unknown) => {
            if (!isPdfRenderCancellation(cause)) throw cause
          })
      }
      const textViewport = pdfPage.getViewport({ scale: cssScale })
      const textRender = (async () => {
        const textContent = await pdfPage.getTextContent({ includeMarkedContent: false })
        if (cancelled) return
        textContainer.replaceChildren()
        const textLayer = new pdfjs.TextLayer({ container: textContainer, textContentSource: textContent, viewport: textViewport })
        cancelTextLayer = () => textLayer.cancel()
        await textLayer.render()
      })()
      const results = await Promise.allSettled([canvasRender, textRender])
      if (results[0].status === 'rejected') throw results[0].reason
      if (!cancelled && canvasRendered) setRendered(true)
      else if (!cancelled) setRenderError(true)
    }).catch(() => { if (!cancelled) setRenderError(true) })
    return () => {
      cancelled = true
      cancelRender?.()
      cancelTextLayer?.()
      textContainer.replaceChildren()
    }
  }, [doc, geometry, page, renderWidth, retry, visible])

  const dimensions = pageGeometry ?? geometry
  const aspect = dimensions ? `${dimensions.width} / ${dimensions.height}` : '3 / 4'
  const width = fitMode === 'page'
    ? `min(calc(100% - 48px), calc((100vh - 152px) * ${dimensions ? dimensions.width / dimensions.height : 0.77} * ${zoom}))`
    : `min(calc(100% - 48px), calc(816px * ${zoom}))`
  return (
    <div
      ref={pageRef}
      className="reader-page"
      style={{ aspectRatio: aspect, width }}
      data-page={page}
    >
      {visible ? <canvas ref={canvasRef} aria-label={`Page ${page}`} /> : null}
      {visible ? <div ref={textLayerRef} className="textLayer" aria-label={`Selectable text for page ${page}`} /> : null}
      {renderError && visible ? <div className="page-render-error" role="status"><p>Page {page} could not be rendered.</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry this page</button></div> : !rendered || !visible ? (
        <div className="page-placeholder" aria-hidden="true"><span>{page}</span></div>
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

function isPdfRenderCancellation(cause: unknown): boolean {
  return typeof cause === 'object'
    && cause !== null
    && 'name' in cause
    && cause.name === 'RenderingCancelledException'
}

function cleanTitle(value: string): string {
  return value.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function renderSnippet(snippet: string) {
  const parts = snippet.split(/\[([^\]]+)\]/g)
  return parts.map((part, index) => (
    index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part
  ))
}

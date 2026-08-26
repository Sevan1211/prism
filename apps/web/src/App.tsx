import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  compileLesson,
  listSources,
  resumeImport,
  sourceFileUrl,
  sourceReadiness,
  uploadSource,
} from './api'
import { SemanticPlayer } from './SemanticPlayer'
import type {
  ImportJob,
  LessonPackage,
  RightsStatus,
  SectionReadiness,
  SourceReadiness,
  SourceSummary,
} from './types'

const statusLabels: Record<SourceSummary['status'], string> = {
  source_ready: 'Queued for indexing',
  indexing: 'Building local index',
  structure_ready: 'Local index ready',
  needs_review: 'Needs attention',
  failed: 'Import failed',
}

const activeImportStates = new Set<ImportJob['state']>(['queued', 'running'])

export function App() {
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<SourceReadiness | null>(null)
  const [lesson, setLesson] = useState<LessonPackage | null>(null)
  const [pageStart, setPageStart] = useState(1)
  const [pageEnd, setPageEnd] = useState(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const compileInFlight = useRef(false)

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? null,
    [selectedSourceId, sources],
  )
  const visibleReadiness = readiness?.source_id === selectedSourceId ? readiness : null
  const selectedRange = currentRange(visibleReadiness, pageStart, pageEnd)
  const activeJob = visibleReadiness?.latest_job ?? null

  const refreshSources = useCallback(async (preferredId?: string) => {
    const nextSources = await listSources()
    setSources(nextSources)
    setSelectedSourceId((current) => {
      if (preferredId) return preferredId
      if (current && nextSources.some((source) => source.id === current)) return current
      return nextSources.length > 0 ? nextSources[0].id : null
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    void listSources()
      .then((nextSources) => {
        if (cancelled) return
        setSources(nextSources)
        setSelectedSourceId(nextSources.length > 0 ? nextSources[0].id : null)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : 'Could not connect to the local PRISM API.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSourceId) {
      return
    }
    let cancelled = false
    void sourceReadiness(selectedSourceId)
      .then((nextReadiness) => {
        if (cancelled) return
        setReadiness(nextReadiness)
        const recommended = nextReadiness.recommended_range
        if (recommended) {
          setPageStart(recommended.page_start)
          setPageEnd(recommended.page_end)
        } else {
          setPageStart(1)
          setPageEnd(Math.min(3, selectedSource?.page_count ?? 3))
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Source readiness could not be read.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedSource?.page_count, selectedSourceId])

  useEffect(() => {
    if (!selectedSourceId || readiness?.source_id !== selectedSourceId) return
    const timer = window.setTimeout(() => {
      void sourceReadiness(selectedSourceId, pageStart, pageEnd)
        .then((nextReadiness) => setReadiness(nextReadiness))
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Section readiness could not be read.')
        })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [pageEnd, pageStart, readiness?.source_id, selectedSourceId])

  useEffect(() => {
    if (!selectedSourceId || !activeJob || !activeImportStates.has(activeJob.state)) return
    const timer = window.setInterval(() => {
      void sourceReadiness(selectedSourceId, pageStart, pageEnd)
        .then((nextReadiness) => {
          setReadiness(nextReadiness)
          if (nextReadiness.latest_job?.state === 'succeeded') {
            void refreshSources(selectedSourceId)
          }
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Import status could not be read.')
        })
    }, 650)
    return () => window.clearInterval(timer)
  }, [activeJob, pageEnd, pageStart, refreshSources, selectedSourceId])

  if (lesson) {
    return (
      <SemanticPlayer
        lesson={lesson}
        onExit={() => {
          window.scrollTo(0, 0)
          setLesson(null)
        }}
      />
    )
  }

  async function handleUpload(file: File, rightsStatus: RightsStatus) {
    setBusy(true)
    setError(null)
    try {
      const response = await uploadSource(file, rightsStatus)
      await refreshSources(response.source.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be imported.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCompile(event: FormEvent) {
    event.preventDefault()
    if (!selectedSource || compileInFlight.current) return
    if (!selectedRange?.can_compile) {
      setError(selectedRange?.message ?? 'Checking this page range before preparing a stream.')
      return
    }
    compileInFlight.current = true
    setBusy(true)
    setError(null)
    try {
      const compiled = await compileLesson(
        selectedSource.id,
        pageStart,
        pageEnd,
        `${selectedSource.original_name} · pages ${pageStart}–${pageEnd}`,
      )
      window.scrollTo(0, 0)
      setLesson(compiled)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This section could not be compiled.')
    } finally {
      compileInFlight.current = false
      setBusy(false)
    }
  }

  async function handleResume() {
    if (!activeJob || !selectedSourceId) return
    setError(null)
    try {
      const nextJob = await resumeImport(activeJob.id)
      setReadiness((current) => current
        ? { ...current, latest_job: nextJob, phase: 'indexing' }
        : current)
      const nextReadiness = await sourceReadiness(selectedSourceId, pageStart, pageEnd)
      setReadiness(nextReadiness)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The local index could not be restarted.')
    }
  }

  return (
    <main className="library-shell">
      <header className="wordmark-row">
        <div className="wordmark" aria-label="PRISM">
          <span className="prism-mark" aria-hidden="true" />
          <span>PRISM</span>
        </div>
        <p>Personalized Representation &amp; Information Streaming for Meaning</p>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Local research instrument · v0.1</p>
        <h1 id="hero-title">Build the mental model.<br />Keep the source in sight.</h1>
        <p className="hero-copy">
          Import a technical PDF, choose a verified body section, and move through it as a calm
          sequence of meaning-bearing frames. When a page cannot be trusted for transformation,
          PRISM keeps the original source available instead of guessing.
        </p>
      </section>

      <div className="library-grid">
        <section className="source-library" aria-labelledby="library-title">
          <div className="section-heading">
            <p className="eyebrow">01 · Source</p>
            <h2 id="library-title">Your local library</h2>
          </div>
          {sources.length === 0 ? (
            <p className="empty-copy">No PDFs yet. Your source stays on this computer by default.</p>
          ) : (
            <div className="source-list" role="list">
              {sources.map((source, sourceIndex) => (
                <button
                  className={`source-row ${selectedSourceId === source.id ? 'is-selected' : ''}`}
                  key={source.id}
                  onClick={() => {
                    setSelectedSourceId(source.id)
                    setLesson(null)
                  }}
                  type="button"
                  role="listitem"
                >
                  <span className="source-index">{String(sourceIndex + 1).padStart(2, '0')}</span>
                  <span className="source-name">{source.original_name}</span>
                  <span className={`status status-${source.status}`}>{statusLabels[source.status]}</span>
                  <span className="source-pages">
                    {source.page_count ? `${source.page_count} pages` : 'Inspecting pages'}
                  </span>
                </button>
              ))}
            </div>
          )}
          <UploadPanel busy={busy} onUpload={handleUpload} />
        </section>

        <aside className="compile-panel" aria-labelledby="compile-title">
          <div className="section-heading">
            <p className="eyebrow">02 · Section</p>
            <h2 id="compile-title">Prepare a stream</h2>
          </div>
          {selectedSource ? (
            <form onSubmit={handleCompile}>
              <div className="selection-heading">
                <p className="selection-name">{selectedSource.original_name}</p>
                <a
                  className="source-link"
                  href={sourceFileUrl(selectedSource.id, pageStart)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original PDF ↗
                </a>
              </div>
              <p className="privacy-line">
                <span className="privacy-dot" />
                Local-only transformation
              </p>
              <div className="page-fields">
                <label>
                  Start page
                  <input
                    type="number"
                    min={1}
                    max={selectedSource.page_count ?? undefined}
                    value={pageStart}
                    onChange={(event) => setPageStart(numberFromInput(event.currentTarget.value, pageStart))}
                  />
                </label>
                <span aria-hidden="true">→</span>
                <label>
                  End page
                  <input
                    type="number"
                    min={pageStart}
                    max={selectedSource.page_count ?? undefined}
                    value={pageEnd}
                    onChange={(event) => setPageEnd(numberFromInput(event.currentTarget.value, pageEnd))}
                  />
                </label>
              </div>
              <ReadinessPanel
                readiness={visibleReadiness}
                range={selectedRange}
                onResume={handleResume}
              />
              <div className="draft-note" role="note">
                <span>Draft compiler</span>
                <p>
                  PRISM creates source-verbatim draft frames only from trusted body text. Front and
                  back matter, uncertain extraction, and unsupported page structures remain in Source.
                </p>
              </div>
              <button
                className="primary-action"
                type="submit"
                disabled={busy || !selectedRange?.can_compile}
              >
                {compileLabel(busy, visibleReadiness, selectedRange)}
              </button>
            </form>
          ) : (
            <p className="empty-copy">Choose or import a source to define the first learning unit.</p>
          )}

          {error ? <p className="error-message" role="alert">{error}</p> : null}
        </aside>
      </div>

      <footer className="research-footer">
        <span>Durable learning &gt; nominal display speed</span>
        <span>Every frame traces back to its source</span>
      </footer>
    </main>
  )
}

function currentRange(
  readiness: SourceReadiness | null,
  pageStart: number,
  pageEnd: number,
): SectionReadiness | null {
  if (!readiness) return null
  if (
    readiness.selected_range
    && readiness.selected_range.page_start === pageStart
    && readiness.selected_range.page_end === pageEnd
  ) {
    return readiness.selected_range
  }
  if (
    readiness.recommended_range
    && readiness.recommended_range.page_start === pageStart
    && readiness.recommended_range.page_end === pageEnd
  ) {
    return readiness.recommended_range
  }
  return null
}

function numberFromInput(value: string, fallback: number): number {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : fallback
}

function compileLabel(
  busy: boolean,
  readiness: SourceReadiness | null,
  range: SectionReadiness | null,
): string {
  if (busy) return 'Preparing stream…'
  if (!range) return 'Checking selected pages…'
  if (range.can_compile) return 'Enter semantic stream'
  if (readiness?.phase === 'indexing') return 'Indexing local source…'
  if (readiness?.phase === 'needs_attention') return 'Repair local index to continue'
  return 'Choose a trusted body section'
}

function ReadinessPanel({
  readiness,
  range,
  onResume,
}: {
  readiness: SourceReadiness | null
  range: SectionReadiness | null
  onResume: () => Promise<void>
}) {
  const job = readiness?.latest_job
  const isIndexing = readiness?.phase === 'indexing'
  const rangeMessage = range?.message
    ?? (isIndexing ? 'Checking local index progress…' : 'Checking selected pages…')
  const status = range?.status ?? (isIndexing ? 'indexing' : readiness?.phase ?? 'indexing')

  return (
    <section className={`readiness-panel status-${status}`} aria-live="polite" aria-label="Source readiness">
      <div className="readiness-header">
        <span>{readinessLabel(status)}</span>
        {range ? <strong>{range.page_start}–{range.page_end}</strong> : null}
      </div>
      <p>{rangeMessage}</p>
      {range ? (
        <dl className="range-evidence">
          <div>
            <dt>Trusted text</dt>
            <dd>{range.trusted_text_characters.toLocaleString()} chars</dd>
          </div>
          <div>
            <dt>Body pages</dt>
            <dd>{range.body_pages}</dd>
          </div>
          <div>
            <dt>Excluded</dt>
            <dd>{range.excluded_non_body_elements} items</dd>
          </div>
        </dl>
      ) : null}
      {job ? <ImportProgress job={job} onResume={onResume} /> : null}
      {(readiness?.capability_notes ?? []).length > 0 ? (
        <ul className="capability-notes">
          {(readiness?.capability_notes ?? []).map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}
      {readiness?.phase === 'source_only' ? (
        <p className="source-only-note">This source is still usable through the original PDF above.</p>
      ) : null}
    </section>
  )
}

function readinessLabel(status: string): string {
  const labels: Record<string, string> = {
    ready: 'Selected range verified',
    indexing: 'Building local index',
    needs_attention: 'Recovery required',
    source_only: 'Source-only range',
    invalid_range: 'Choose a valid range',
  }
  return labels[status] ?? 'Checking source'
}

function UploadPanel({
  busy,
  onUpload,
}: {
  busy: boolean
  onUpload: (file: File, rightsStatus: RightsStatus) => Promise<void>
}) {
  const [file, setFile] = useState<File | null>(null)
  const [rightsStatus, setRightsStatus] = useState<RightsStatus>('private_authorized')

  return (
    <form
      className="upload-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (file) void onUpload(file, rightsStatus)
      }}
    >
      <label className="file-drop" data-has-file={file ? 'true' : 'false'}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <span className="file-plus" aria-hidden="true">+</span>
        <span>{file ? file.name : 'Choose a PDF to inspect locally'}</span>
        <small>Up to 512 MB in this prototype</small>
      </label>
      <div className="upload-policy">
        <label>
          Rights for this source
          <select
            value={rightsStatus}
            onChange={(event) => setRightsStatus(event.target.value as RightsStatus)}
          >
            <option value="private_authorized">My private, authorized copy</option>
            <option value="open_license">Open license</option>
            <option value="public_domain">Public domain</option>
            <option value="unknown">Unknown — local inspection only</option>
          </select>
        </label>
        <p className="local-policy-note" role="note">
          Local-only by default. PRISM tells you whether a section is safe to transform instead of
          treating every PDF page as clean text.
        </p>
      </div>
      <button className="secondary-action" type="submit" disabled={!file || busy}>
        {busy ? 'Preserving source…' : 'Import locally'}
      </button>
    </form>
  )
}

function ImportProgress({ job, onResume }: { job: ImportJob; onResume: () => Promise<void> }) {
  const progress = job.progress_total
    ? Math.round((job.progress_current / job.progress_total) * 100)
    : 0
  const canResume = job.state === 'retryable_failure' || job.state === 'needs_review'
  return (
    <div className="import-progress">
      <div>
        <span>{job.state.replaceAll('_', ' ')}</span>
        <strong>{job.progress_total ? `${job.progress_current} / ${job.progress_total} pages` : 'Queued'}</strong>
      </div>
      <progress max={100} value={progress}>{progress}%</progress>
      {job.error_message ? <p>{job.error_message}</p> : null}
      {canResume ? (
        <button type="button" className="text-action" onClick={() => void onResume()}>
          {job.parser_version ? `Resume from page ${job.progress_current + 1}` : 'Rebuild with current parser'}
        </button>
      ) : null}
    </div>
  )
}

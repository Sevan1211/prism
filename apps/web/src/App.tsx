import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  compileLesson,
  importStatus,
  listSources,
  resumeImport,
  uploadSource,
} from './api'
import { SemanticPlayer } from './SemanticPlayer'
import type { ImportJob, LessonPackage, RightsStatus, SourceSummary } from './types'

const statusLabels: Record<SourceSummary['status'], string> = {
  source_ready: 'Source ready',
  indexing: 'Building local index',
  structure_ready: 'Ready to stream',
  needs_review: 'Needs review',
  failed: 'Import failed',
}

export function App() {
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [job, setJob] = useState<ImportJob | null>(null)
  const [lesson, setLesson] = useState<LessonPackage | null>(null)
  const [pageStart, setPageStart] = useState(1)
  const [pageEnd, setPageEnd] = useState(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? null,
    [selectedSourceId, sources],
  )
  const activeJobId = job?.id
  const activeJobState = job?.state

  const refreshSources = useCallback(async (preferredId?: string) => {
    const nextSources = await listSources()
    setSources(nextSources)
    setSelectedSourceId((current) =>
      preferredId ?? current ?? (nextSources.length > 0 ? nextSources[0].id : null),
    )
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
    if (!activeJobId || !activeJobState || !['queued', 'running'].includes(activeJobState)) {
      return
    }
    const timer = window.setInterval(() => {
      void importStatus(activeJobId)
        .then((nextJob) => {
          setJob(nextJob)
          if (nextJob.state === 'succeeded') {
            void refreshSources(nextJob.source_id)
          }
        })
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Import status could not be read.')
        })
    }, 600)
    return () => window.clearInterval(timer)
  }, [activeJobId, activeJobState, refreshSources])

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

  async function handleUpload(
    file: File,
    rightsStatus: RightsStatus,
  ) {
    setBusy(true)
    setError(null)
    try {
      const response = await uploadSource(file, rightsStatus)
      setJob(response.job)
      await refreshSources(response.source.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be imported.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCompile(event: FormEvent) {
    event.preventDefault()
    if (!selectedSource) return
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
      setBusy(false)
    }
  }

  async function handleResume() {
    if (!job) return
    setError(null)
    try {
      setJob(await resumeImport(job.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The import could not be resumed.')
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
          Import a clean technical PDF, choose a bounded section, and move through it as a calm
          sequence of meaning-bearing frames. Speed is adjustable; comprehension stays in charge.
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
                    setPageStart(1)
                    setPageEnd(Math.min(3, source.page_count ?? 3))
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
              <p className="selection-name">{selectedSource.original_name}</p>
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
                    onChange={(event) => setPageStart(Number(event.target.value))}
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
                    onChange={(event) => setPageEnd(Number(event.target.value))}
                  />
                </label>
              </div>
              <div className="draft-note" role="note">
                <span>Draft compiler</span>
                <p>Body text plus source figures and tables. Front and back matter stay searchable but are skipped in playback.</p>
              </div>
              <button
                className="primary-action"
                type="submit"
                disabled={busy || selectedSource.status !== 'structure_ready'}
              >
                {selectedSource.status === 'structure_ready' ? 'Enter semantic stream' : 'Indexing source…'}
              </button>
            </form>
          ) : (
            <p className="empty-copy">Choose or import a source to define the first learning unit.</p>
          )}

          {job ? <ImportProgress job={job} onResume={handleResume} /> : null}
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
        <span>{file ? file.name : 'Choose a clean text-based PDF'}</span>
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
          Local-only by default. Cloud use will require a separate preview and approval for this
          source when that capability is introduced.
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
    <div className="import-progress" aria-live="polite">
      <div>
        <span>{job.state.replaceAll('_', ' ')}</span>
        <strong>{job.progress_total ? `${job.progress_current} / ${job.progress_total} pages` : 'Queued'}</strong>
      </div>
      <progress max={100} value={progress}>{progress}%</progress>
      {canResume ? (
        <button type="button" className="text-action" onClick={() => void onResume()}>
          Resume from page {job.progress_current + 1}
        </button>
      ) : null}
    </div>
  )
}

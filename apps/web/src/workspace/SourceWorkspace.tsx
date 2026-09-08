import { AgentRequestCard } from './AgentRequestCard'
import { AGENT_STARTUP_PROMPT } from '../webmcp/authoringGuide'
import { SourceLibrary } from './SourceLibrary'
import { ConfirmationDialog } from './ConfirmationDialog'
import { cleanTitle, sourceStatus, statusTone } from './sourcePresentation'
import { moveSourceToFolder } from '../storage/sourceFolders'
import { LoadingState } from '../LoadingState'
import { useSyncStatus } from '../storage/useSyncStatus'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LockKey,
  ArrowRight,
  BookOpenText,
  CheckCircle,
  PlugsConnected,
  Trash,
  X,
} from '@phosphor-icons/react'
import { BrowserVaultStatus } from '../BrowserVaultStatus'
import { LessonPlanPanel } from '../lesson/LessonPlanPanel'
import {
  libraryPath,
  navigatePrism,
  readerPath,
  sourcePath,
  type PrismRoute,
  type SourceView,
} from '../navigation'
import { PrismLink } from '../PrismLink'
import type { LibrarySource } from '../storage/browserSources'
import { downloadPublicPdf } from '../storage/publicPdfImport'
import type { RightsStatus } from '../types'
import { AgentActivityPanel } from './AgentActivityPanel'

interface SourceWorkspaceProps {
  activeIndexIds: Set<string>
  busy: boolean
  evidenceReturnTargetId: string | null
  error: string | null
  importRequest: { requestId: number; rightsStatus: RightsStatus } | null
  onAgentAccessChange: (source: LibrarySource, granted: boolean) => void
  onDelete: (source: LibrarySource) => Promise<void>
  onError: (message: string) => void
  onEvidenceReturnComplete: () => void
  onIndex: (sourceId: string) => void
  onOpenEvidence: (sourceId: string, elementId: string, returnTargetId?: string) => Promise<void>
  onUpload: (file: File, rightsStatus: RightsStatus) => Promise<LibrarySource>
  routeKind: PrismRoute['kind']
  selectedSource: LibrarySource | null
  sourcePlanId: string | null
  sourceView: SourceView | null
  sources: LibrarySource[]
  sourcesReady: boolean
}

export function SourceWorkspace({
  activeIndexIds,
  busy,
  evidenceReturnTargetId,
  error,
  importRequest,
  onAgentAccessChange,
  onDelete,
  onError,
  onEvidenceReturnComplete,
  onIndex,
  onOpenEvidence,
  onUpload,
  routeKind,
  selectedSource,
  sourcePlanId,
  sourceView,
  sources,
  sourcesReady,
}: SourceWorkspaceProps) {
  const [pendingDelete, setPendingDelete] = useState<LibrarySource | null>(null)
  const synced = useSyncStatus()
  const [importFolder, setImportFolder] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(importRequest !== null)
  const [importRights, setImportRights] = useState<RightsStatus>(
    importRequest?.rightsStatus ?? 'private_authorized',
  )

  const closeImport = useCallback(() => { setImportOpen(false); setImportFolder(null) }, [])

  useEffect(() => {
    if (!evidenceReturnTargetId) return undefined
    let frame = 0
    let settleTimer = 0
    let observer: MutationObserver | null = null
    const scheduleFocus = () => {
      const target = document.getElementById(evidenceReturnTargetId)
      if (!(target instanceof HTMLElement)) return false
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        frame = window.requestAnimationFrame(() => {
          const settledTarget = document.getElementById(evidenceReturnTargetId)
          if (!(settledTarget instanceof HTMLElement)) return
          settledTarget.scrollIntoView({ block: 'center' })
          settledTarget.focus({ preventScroll: true })
          observer?.disconnect()
          onEvidenceReturnComplete()
        })
      }, 150)
      return true
    }

    observer = new MutationObserver(scheduleFocus)
    observer.observe(document.body, { childList: true, subtree: true })
    scheduleFocus()
    return () => {
      observer?.disconnect()
      window.clearTimeout(settleTimer)
      window.cancelAnimationFrame(frame)
    }
  }, [evidenceReturnTargetId, onEvidenceReturnComplete])

  function openImport(rightsStatus: RightsStatus = 'private_authorized') {
    setImportRights(rightsStatus)
    setImportOpen(true)
  }

  const missingSource = sourcesReady && routeKind === 'source' && !selectedSource

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-main" aria-hidden={importOpen} inert={importOpen}>Skip to content</a>
      <div className="workspace-surface" aria-hidden={importOpen} inert={importOpen}>
        <SourceLibrary
          onImport={(folderId) => { setImportFolder(folderId); openImport() }}
          sources={sources}
          sourcesReady={sourcesReady}
          selectedSource={selectedSource}
        >
        {routeKind === 'library' ? null : <>
        {routeKind === 'source' && !sourcesReady && !selectedSource ? <LoadingState title="Opening your library" detail="Checking your saved sources and library connection." /> : null}
        {routeKind === 'source' && selectedSource ? (
          <SourceViewPage
            activeIndex={activeIndexIds.has(selectedSource.id)}
            onAgentAccessChange={(granted) => onAgentAccessChange(selectedSource, granted)}
            onDelete={selectedSource.storage_location === 'browser_vault'
              ? () => setPendingDelete(selectedSource)
              : undefined}
            onError={onError}
            onIndex={() => onIndex(selectedSource.id)}
            onOpenEvidence={(elementId, returnTargetId) => (
              onOpenEvidence(selectedSource.id, elementId, returnTargetId)
            )}
            planId={sourcePlanId}
            source={selectedSource}
            view={sourceView ?? 'overview'}
          />
        ) : null}

        {missingSource || routeKind === 'not_found' ? <NotFoundView /> : null}
        </>}
        </SourceLibrary>
        {error ? <p className="workspace-error" role="alert">{error}</p> : null}
      </div>

      {pendingDelete ? <ConfirmationDialog
        title="Remove this source?" itemName={cleanTitle(pendingDelete.original_name)} kind="source" confirmLabel="Remove source"
        onConfirm={() => onDelete(pendingDelete)} onClose={() => setPendingDelete(null)}
        focusAfterSuccess={() => document.getElementById('workspace-main')}>
        <p>This removes the PDF, its lessons, and its reading history from your library.</p>
        <p className="confirmation-note">{synced.connected ? 'This removal also syncs to your connected browsers. ' : ''}This cannot be undone. Your original file outside PRISM is unaffected.</p>
      </ConfirmationDialog> : null}

      {importOpen ? (
        <ImportDialog
          busy={busy}
          initialRights={importRights}
          onClose={closeImport}
          onUpload={async (file, rights) => {
            const source = await onUpload(file, rights)
            if (importFolder) {
              try { await moveSourceToFolder(source.id, importFolder) }
              catch { onError('Your PDF was imported, but could not be added to the folder. You can move it from Library.') }
            }
            closeImport()
          }}
        />
      ) : null}
    </div>
  )
}

function SourceViewPage({
  activeIndex,
  onAgentAccessChange,
  onDelete,
  onError,
  onIndex,
  onOpenEvidence,
  planId,
  source,
  view,
}: {
  activeIndex: boolean
  onAgentAccessChange: (granted: boolean) => void
  onDelete?: () => void
  onError: (message: string) => void
  onIndex: () => void
  onOpenEvidence: (elementId: string, returnTargetId?: string) => Promise<void>
  planId: string | null
  source: LibrarySource
  view: SourceView
}) {
  return (
    <article className="source-view" data-view={view}>
      <header className="source-page-heading">
        <div className="source-heading-copy">
          <PrismLink className="back-link" href={libraryPath()}>← Back to library</PrismLink>
          <h1>{cleanTitle(source.original_name)}</h1>
          <div className="source-meta">
            <span className="source-readiness" data-tone={statusTone(source)}>{sourceStatus(source)}</span>
            <span>{source.page_count?.toLocaleString() ?? 'Unknown'} {source.page_count === 1 ? 'page' : 'pages'}</span>
            <span>{rightsLabel(source.rights_status)}</span>
          </div>
        </div>
        <div className="source-heading-actions">
          <PrismLink className="button-primary" href={readerPath(source.id)}>
            <BookOpenText aria-hidden="true" weight="bold" />
            Open Reader
          </PrismLink>
          {onDelete ? (
            <button className="button-quiet button-danger" type="button" onClick={onDelete}>
              <Trash aria-hidden="true" />
              Remove source
            </button>
          ) : null}
        </div>
      </header>

      <nav className="source-tabs" aria-label="Source navigation">
        <PrismLink href={sourcePath(source.id)} aria-current={view === 'overview' ? 'page' : undefined}>
          Overview
        </PrismLink>
        <PrismLink href={sourcePath(source.id, 'lessons')} aria-current={view === 'lessons' ? 'page' : undefined}>
          Lessons
        </PrismLink>
        <PrismLink href={readerPath(source.id)}>Reader</PrismLink>
      </nav>

      {view === 'overview' ? (
        <SourceOverview
          activeIndex={activeIndex}
          onAgentAccessChange={onAgentAccessChange}
          onIndex={onIndex}
          source={source}
        />
      ) : (
        <section className="lesson-workspace" aria-labelledby="lesson-workspace-title">
          <header className="sr-only">
            <div>
              <p className="page-kicker">Source-owned work</p>
              <h2 id="lesson-workspace-title">Lessons</h2>
            </div>
            <p>Plans remain attached to this source and require your approval before composition.</p>
          </header>
          <LessonPlanPanel
            key={source.id}
            source={source}
            onError={onError}
            onOpenEvidence={onOpenEvidence}
            activePlanId={planId}
            onActivePlanChange={(nextPlanId) => {
              navigatePrism(sourcePath(source.id, 'lessons', nextPlanId))
            }}
          />
        </section>
      )}
    </article>
  )
}

function SourceOverview({
  activeIndex,
  onAgentAccessChange,
  onIndex,
  source,
}: {
  activeIndex: boolean
  onAgentAccessChange: (granted: boolean) => void
  onIndex: () => void
  source: LibrarySource
}) {
  const synced = useSyncStatus()
  const indexed = source.storage_location === 'local_companion'
    || source.browser_index?.state === 'ready'
  const agentAccess = source.rights_status === 'open_license'
    || source.rights_status === 'public_domain'
    || source.agent_content_granted === true
  return (
    <div className="source-overview">
      <div className="source-primary-column">
        <section className="continue-section" aria-labelledby="continue-title">
          <div>
            <h2 id="continue-title">Continue reading</h2>
            <p>Open the original at your saved place, or explore its lessons.</p>
          </div>
          <div className="continue-actions">
            <PrismLink className="button-primary" href={readerPath(source.id)}>
              Open Reader <ArrowRight aria-hidden="true" weight="bold" />
            </PrismLink>
            <PrismLink className="button-secondary" href={sourcePath(source.id, 'lessons')}>
              View lessons
            </PrismLink>
          </div>
        </section>

        <details className="source-information" open={!indexed}>
          <summary>Source information <span>Evidence, storage, and rights</span></summary>
          <dl>
            <InfoRow label="Evidence map" value={indexed ? 'Ready' : 'Not ready'} tone={indexed ? 'good' : 'warn'} />
            <InfoRow label="Pages" value={(source.page_count ?? 0).toLocaleString()} />
            <InfoRow label="Stored in" value={source.storage_location === 'browser_vault' ? (synced.connected ? 'Encrypted synced library' : 'This browser only') : 'Local companion'} />
            <InfoRow label="Rights" value={rightsLabel(source.rights_status)} />
            <InfoRow label="Fingerprint" value={source.content_hash.slice(0, 16)} mono />
          </dl>
          {!indexed && source.storage_location === 'browser_vault' ? (
            <button className="text-button" type="button" disabled={activeIndex} onClick={onIndex}>
              {activeIndex ? 'Building evidence map…' : 'Build evidence map'}
            </button>
          ) : null}
        </details>

        <AgentActivityPanel sourceId={source.id} />
      </div>

      <aside className="source-secondary-column">
        <section className="agent-connection" aria-labelledby="agent-connection-title">
          <header>
            <span className="connection-icon"><PlugsConnected aria-hidden="true" weight="bold" /></span>
            <div>
              <p className="page-kicker">Agent connection</p>
              <h2 id="agent-connection-title">Build with PRISM tools</h2>
            </div>
          </header>
          <p>
            {synced.connected ? 'Your cloud library is protected in transit and at rest; PRISM’s service can read stored files. ' : 'Original PDFs stay in your local library. '}When access is on, bounded text or region evidence
            returned by PRISM tools may be sent to your chosen agent provider under its data controls.
          </p>
          <AgentPrompt source={source} />
          {source.storage_location === 'browser_vault'
            && !['open_license', 'public_domain'].includes(source.rights_status)
            ? (
              <div className="agent-permission">
                <span>
                  <strong>{agentAccess ? 'Selected source access is on' : 'Agent source access is off'}</strong>
                  <small>
                    {agentAccess
                      ? 'Your agent can read selected text and inspect page images. Its provider processes what you share. Revoke access here at any time.'
                      : 'Allow your agent to read selected text and inspect page images. The agent provider processes this material under its data controls.'}
                  </small>
                </span>
                <button
                  className={agentAccess ? 'button-quiet' : 'button-secondary'}
                  type="button"
                  aria-pressed={agentAccess}
                  onClick={() => onAgentAccessChange(!agentAccess)}
                >
                  {agentAccess ? 'Revoke' : 'Allow access'}
                </button>
              </div>
            )
            : (
              <p className="permission-ready"><CheckCircle aria-hidden="true" weight="fill" /> Source tools are ready.</p>
            )}
        </section>
        <BrowserVaultStatus />
      </aside>
    </div>
  )
}

function InfoRow({
  label,
  mono = false,
  tone,
  value,
}: {
  label: string
  mono?: boolean
  tone?: 'good' | 'warn'
  value: string
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? 'is-mono' : ''} data-tone={tone}>{value}</dd>
    </div>
  )
}

function AgentPrompt({ source }: { source: LibrarySource }) {
  const request = `Build a detailed lesson from the selected source. Resume my saved request or approved plan; ask only for missing scope or goals. Preserve substantive definitions, reasoning, examples, qualifications and relevant figures. Propose a plan if I have not approved one.`
  const prompt = `${AGENT_STARTUP_PROMPT}\n\n${request}\nSource: ${source.id}.`
  return <AgentRequestCard title="Build a lesson" description="Choose a chapter and goal with your agent, then review its plan here." prompt={prompt} />
}

function ImportDialog({
  busy,
  initialRights,
  onClose,
  onUpload,
}: {
  busy: boolean
  initialRights: RightsStatus
  onClose: () => void
  onUpload: (file: File, rights: RightsStatus) => Promise<void>
}) {
  const synced = useSyncStatus()
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadBytes, setDownloadBytes] = useState(0)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const downloadRef = useRef<AbortController | null>(null)
  const [rights, setRights] = useState<RightsStatus>(initialRights)
  const publicSource = ['open_license', 'public_domain'].includes(rights)
  const dialogRef = useRef<HTMLElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const busyRef = useRef(busy)

  useEffect(() => {
    busyRef.current = busy
  }, [busy])
  useEffect(() => () => downloadRef.current?.abort(), [])

  async function importSelection() {
    if (file) {
      try { await onUpload(file, rights) }
      catch (cause) { setDownloadError(cause instanceof Error ? cause.message : 'The PDF could not be imported.') }
      return
    }
    const controller = new AbortController()
    downloadRef.current = controller
    setDownloading(true); setDownloadBytes(0); setDownloadError(null)
    try {
      const downloaded = await downloadPublicPdf(url, AbortSignal.any([controller.signal, AbortSignal.timeout(90_000)]), setDownloadBytes)
      if (!controller.signal.aborted) await onUpload(downloaded, rights)
    } catch (cause) {
      if (!controller.signal.aborted) setDownloadError(cause instanceof Error ? cause.message : 'The download failed. Choose a local PDF instead.')
    } finally { setDownloading(false); downloadRef.current = null }
  }

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const frame = window.requestAnimationFrame(() => fileInputRef.current?.focus())
    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [])].filter((element) => !element.hasAttribute('hidden'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1) as HTMLElement
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', keepFocusInside)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keepFocusInside)
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section ref={dialogRef} className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header>
          <div>
            <p className="page-kicker">Add to your library</p>
            <h2 id="import-title">Add a source</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close import" disabled={busy} onClick={onClose}>
            <X aria-hidden="true" weight="bold" />
          </button>
        </header>
        <label className="import-drop" data-selected={file !== null}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy || downloading}
            aria-label="Choose a PDF"
            onChange={(event) => { setFile(event.currentTarget.files?.[0] ?? null); setUrl(''); setDownloadError(null) }}
          />
          <BookOpenText aria-hidden="true" weight="light" />
          <strong>{file?.name ?? 'Choose a textbook, paper, or technical PDF'}</strong>
          <small>{file ? formatBytes(file.size) : 'PDF, up to 128 MB, saved to your selected library'}</small>
        </label>
        <label className="import-rights">
          <span>Or paste a public PDF link</span>
          <input type="url" placeholder="https://…/paper.pdf" value={url} disabled={busy || downloading}
            onChange={event => { setUrl(event.target.value); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; setDownloadError(null) }} />
        </label>
        <label className="import-rights">
          <span>Rights for this source</span>
          <select value={rights} disabled={busy || downloading} onChange={(event) => { setRights(event.currentTarget.value as RightsStatus) }}>
            <option value="private_authorized">My private, authorized copy</option>
            <option value="open_license">Open license</option>
            <option value="public_domain">Public domain</option>
            <option value="unknown">Unknown / unverified</option>
          </select>
        </label>
        <div className="privacy-receipt">
          <LockKey aria-hidden="true" weight="bold" />
          <p>{synced.connected ? 'This PDF will sync to your private cloud library, protected in transit and at rest. PRISM’s service can read stored files. ' : 'The file stays in this browser. '}Adding it enables your connected agent to read selected text and page images under its provider’s data controls.{!publicSource ? ' You can revoke access in the source overview.' : ''} Lesson plans and revisions still need your approval.</p>
        </div>
        {downloadError ? <p role="alert" className="import-feedback">{downloadError}</p> : null}
        {downloading ? <p role="status" className="import-feedback">Downloading · {formatBytes(downloadBytes)}</p> : null}
        <footer>
          <button className="button-quiet" type="button" disabled={busy} onClick={() => downloading ? downloadRef.current?.abort() : onClose()}>{downloading ? 'Cancel download' : 'Cancel'}</button>
          <button
            className="button-primary"
            type="button"
            disabled={(!file && !url.trim()) || busy || downloading}
            onClick={() => void importSelection()}
          >
            {busy ? 'Adding source…' : downloading ? 'Downloading…' : 'Add to library'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function NotFoundView() {
  return (
    <section className="not-found-view">
      <p className="page-kicker">Not found</p>
      <h1>This PRISM page does not exist.</h1>
      <p>The source may have been removed from this browser.</p>
      <PrismLink className="button-primary" href={libraryPath()}>Return to library</PrismLink>
    </section>
  )
}

function rightsLabel(rights: RightsStatus): string {
  const labels: Record<RightsStatus, string> = {
    open_license: 'Open license',
    private_authorized: 'Private authorized copy',
    public_domain: 'Public domain',
    unknown: 'Rights unverified',
  }
  return labels[rights]
}

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

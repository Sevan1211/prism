import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadLibrarySources } from './library/sourceLibrary'
import { LoadingState } from './LoadingState'
import {
  libraryPath,
  lessonPath,
  navigatePrism,
  readerPath,
  sourcePath,
  usePrismRoute,
} from './navigation'
import { SourceReader } from './reader/SourceReader'
import {
  deleteBrowserSource,
  importBrowserSource,
  indexBrowserSource,
  readBrowserSourceBundle,
  setBrowserAgentContentAccess,
  type LibrarySource,
} from './storage/browserSources'
import type { BrowserIndexStatus } from './storage/sourceIndexTypes'
import type { RightsStatus, SearchHit } from './types'
import { usePrismLibraryTools } from './webmcp/usePrismLibraryTools'
import { SourceWorkspace } from './workspace/SourceWorkspace'
import { LessonReaderPage } from './lesson/LessonReaderPage'
import { getLessonDocumentByPlan } from './lesson/lessonDocuments'
import { PRISM_VAULT_CHANGED_EVENT } from './storage/browserVault'
import { subscribeSourcesChanged } from './storage/sourceLibraryEvents'

export function App() {
  const route = usePrismRoute()
  const [sources, setSources] = useState<LibrarySource[]>([])
  const [sourcesReady, setSourcesReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readerInitialHighlight, setReaderInitialHighlight] = useState<SearchHit | null>(null)
  const [readerNavigationRequestId, setReaderNavigationRequestId] = useState(0)
  const [readerReturnTargetId, setReaderReturnTargetId] = useState<string | null>(null)
  const [readerReturnPlanId, setReaderReturnPlanId] = useState<string | null>(null)
  const [readerReturnLessonId, setReaderReturnLessonId] = useState<string | null>(null)
  const [activeIndexIds, setActiveIndexIds] = useState<Set<string>>(() => new Set())
  const [sourceImportRequest, setSourceImportRequest] = useState<{
    requestId: number
    rightsStatus: RightsStatus
  } | null>(null)
  const indexInFlight = useRef(new Set<string>())
  const importRequestSequence = useRef(0)
  const readerNavigationSequence = useRef(0)

  const routeSourceId = route.kind === 'source' || route.kind === 'reader'
    ? route.sourceId
    : null
  const selectedSource = useMemo(
    () => routeSourceId
      ? sources.find((source) => source.id === routeSourceId) ?? null
      : null,
    [routeSourceId, sources],
  )
  const readerSource = route.kind === 'reader' ? selectedSource : null

  const refreshSources = useCallback(async () => {
    const nextSources = await loadLibrarySources()
    setSources(nextSources)
    return nextSources
  }, [])

  useEffect(() => {
    const refresh = () => { void refreshSources().catch(() => undefined) }
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
  }, [refreshSources])

  useEffect(() => subscribeSourcesChanged(() => {
    void refreshSources().catch(() => undefined)
  }), [refreshSources])

  useEffect(() => {
    if (window.location.pathname === '/') navigatePrism(libraryPath(), { replace: true })
  }, [])

  const routedPlan = route.kind === 'source' && route.view === 'lessons' ? route.planId : null
  useEffect(() => {
    if (!routedPlan) return
    let cancelled = false
    const resolve = () => { void getLessonDocumentByPlan(routedPlan).then(document => {
      if (document && !cancelled) navigatePrism(`${lessonPath(document.lesson_id)}${window.location.hash}`, { replace: true })
    }).catch(() => undefined) }
    resolve()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, resolve)
    return () => { cancelled = true; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, resolve) }
  }, [routedPlan])

  useEffect(() => {
    let cancelled = false
    void loadLibrarySources()
      .then((nextSources) => {
        if (cancelled) return
        setSources(nextSources)
        setSourcesReady(true)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setSourcesReady(true)
        setError(cause instanceof Error ? cause.message : 'The PRISM workspace could not open.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const startLocalIndex = useCallback(async (sourceId: string) => {
    if (indexInFlight.current.has(sourceId)) return
    indexInFlight.current.add(sourceId)
    setActiveIndexIds((current) => new Set(current).add(sourceId))
    setError(null)
    const updateStatus = (status: BrowserIndexStatus) => {
      setSources((current) => current.map((source) => (
        source.id === sourceId ? { ...source, browser_index: status } : source
      )))
    }
    try {
      await indexBrowserSource(sourceId, { onStatus: updateStatus })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The local evidence index stopped.')
    } finally {
      indexInFlight.current.delete(sourceId)
      setActiveIndexIds((current) => {
        const next = new Set(current)
        next.delete(sourceId)
        return next
      })
      await refreshSources().catch(() => undefined)
    }
  }, [refreshSources])

  const openReader = useCallback(async (
    sourceId: string,
    initialPage?: number,
    initialHighlight: SearchHit | null = null,
  ) => {
    let source = sources.find((candidate) => candidate.id === sourceId)
    if (!source) {
      const refreshed = await refreshSources()
      source = refreshed.find((candidate) => candidate.id === sourceId)
    }
    if (!source) throw new Error('This source is no longer in the workspace.')

    if (route.kind === 'source' && route.view === 'lessons') setReaderReturnPlanId(route.planId)
    if (route.kind === 'lesson') setReaderReturnLessonId(route.lessonId)

    setReaderInitialHighlight(initialHighlight)
    readerNavigationSequence.current += 1
    setReaderNavigationRequestId(readerNavigationSequence.current)
    navigatePrism(readerPath(sourceId, initialPage))
  }, [refreshSources, route, sources])

  const prepareSourceImport = useCallback((rightsStatus: RightsStatus) => {
    navigatePrism(libraryPath())
    importRequestSequence.current += 1
    setSourceImportRequest({ requestId: importRequestSequence.current, rightsStatus })
  }, [])

  const openSourceEvidence = useCallback(async (
    sourceId: string,
    elementId: string,
    returnTargetId?: string,
  ) => {
    const bundle = await readBrowserSourceBundle(sourceId, [elementId], 0)
    const evidence = bundle.elements.find(
      (candidate) => candidate.anchor.element_id === elementId,
    )
    if (!evidence) throw new Error('This lesson citation no longer matches the local evidence map.')
    setReaderReturnTargetId(returnTargetId ?? null)
    const bounds = evidence.anchor.bbox_normalized
    await openReader(sourceId, evidence.anchor.pdf_page_index, bounds ? {
      bbox_normalized: bounds,
      document_region: 'body',
      element_id: elementId,
      kind: 'paragraph',
      page_number: evidence.anchor.pdf_page_index,
      snippet: evidence.text.slice(0, 240),
      status: evidence.status,
    } : null)
  }, [openReader])

  usePrismLibraryTools({ activeRoute: route, openReader, prepareSourceImport, importSource: handleUpload })

  async function handleUpload(file: File, rightsStatus: RightsStatus) {
    setBusy(true)
    setError(null)
    try {
      const source = await importBrowserSource(file, rightsStatus)
      await refreshSources()
      navigatePrism(sourcePath(source.id))
      if (source.browser_index?.state !== 'ready') void startLocalIndex(source.id)
      return source
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The PDF could not be imported.')
      throw cause
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(source: LibrarySource) {
    if (source.storage_location !== 'browser_vault') return
    const confirmed = window.confirm(
      `Remove “${source.original_name}” and its lessons and reading history from this library? If encrypted sync is connected, this removal also syncs to your other browsers.`,
    )
    if (!confirmed) return
    setError(null)
    try {
      await deleteBrowserSource(source.id)
      await refreshSources()
      navigatePrism(libraryPath(), { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The source could not be removed.')
    }
  }

  async function handleAgentAccessChange(source: LibrarySource, granted: boolean) {
    if (source.storage_location !== 'browser_vault') return
    setError(null)
    try {
      await setBrowserAgentContentAccess(source.id, granted)
      await refreshSources()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Agent source access could not be changed.')
    }
  }

  if (route.kind === 'reader' && readerSource) {
    return (
      <SourceReader
        key={readerSource.id}
        initialHighlight={readerInitialHighlight}
        initialPage={route.page ?? undefined}
        navigationRequestId={readerNavigationRequestId}
        onExit={() => {
          const returnView = readerInitialHighlight ? 'lessons' : 'overview'
          setReaderInitialHighlight(null)
          navigatePrism(readerReturnLessonId ? lessonPath(readerReturnLessonId) : sourcePath(readerSource.id, returnView, readerReturnPlanId))
          setReaderReturnPlanId(null)
          setReaderReturnLessonId(null)
        }}
        onNavigatePage={(page, replace) => {
          navigatePrism(readerPath(readerSource.id, page), { replace })
        }}
        source={readerSource}
      />
    )
  }

  if (route.kind === 'reader' && (!sourcesReady || readerSource)) {
    return <LoadingState title="Opening your library" detail="Finding this source and checking your saved library connection." error={error} onRetry={() => window.location.reload()} onBack={() => navigatePrism(libraryPath())} />
  }

  if (route.kind === 'lesson') return <><LessonReaderPage key={route.lessonId} lessonId={route.lessonId} onError={setError} onOpenEvidence={openSourceEvidence} returnTargetId={readerReturnTargetId} onReturnComplete={() => setReaderReturnTargetId(null)} />{error ? <p className="workspace-error" role="alert">{error}</p> : null}</>

  return (
    <SourceWorkspace
      key={`workspace-${sourceImportRequest?.requestId ?? 0}`}
      activeIndexIds={activeIndexIds}
      busy={busy}
      evidenceReturnTargetId={readerReturnTargetId}
      error={error}
      importRequest={sourceImportRequest}
      onAgentAccessChange={(source, granted) => void handleAgentAccessChange(source, granted)}
      onDelete={(source) => void handleDelete(source)}
      onError={setError}
      onEvidenceReturnComplete={() => setReaderReturnTargetId(null)}
      onIndex={(sourceId) => void startLocalIndex(sourceId)}
      onOpenEvidence={openSourceEvidence}
      onUpload={async (file, rights) => { await handleUpload(file, rights) }}
      routeKind={route.kind}
      selectedSource={selectedSource}
      sourcePlanId={route.kind === 'source' && route.view === 'lessons' ? route.planId : null}
      sourceView={route.kind === 'source' ? route.view : null}
      sources={sources}
      sourcesReady={sourcesReady}
    />
  )
}

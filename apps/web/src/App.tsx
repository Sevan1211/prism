import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadLibrarySources } from './library/sourceLibrary'
import { LoadingState } from './LoadingState'
import { LandingPage } from './landing/LandingPage'
import {
  libraryPath,
  lessonPath,
  navigatePrism,
  readerPath,
  sourcePath,
  usePrismRoute,
  usePrismNavigationState,
  navigationToken,
  readPrismNavigationState,
  rememberReturnTarget,
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
import { LibraryStorageHost } from './LibraryStorage'

export function App() {
  return <><LibraryStorageHost /><ReadingWorkspace /></>
}

function ReadingWorkspace() {
  const route = usePrismRoute()
  const [sources, setSources] = useState<LibrarySource[]>([])
  const [sourcesReady, setSourcesReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigation = usePrismNavigationState()
  const [completedReturn, setCompletedReturn] = useState<string | null>(null)
  const returnToken = `${navigation.state?.key}:${navigation.revision}`
  const returnTargetId = completedReturn === returnToken ? null : navigation.state?.returnTargetId ?? null
  const completeReturn = useCallback(() => setCompletedReturn(returnToken), [returnToken])
  const readerContext = navigation.state?.reader
  const readerInitialHighlight: SearchHit | null = readerContext?.highlight ? {
    bbox_normalized: readerContext.highlight.bounds,
    element_id: readerContext.highlight.elementId,
    page_number: readerContext.highlight.page,
    document_region: 'body', kind: 'paragraph', snippet: '', status: 'source_only',
  } : null
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

  const routedPlan = route.kind === 'source' && route.view === 'lessons' ? route.planId : null
  useEffect(() => {
    if (!routedPlan) return
    let cancelled = false
    const resolve = () => {
      const origin = navigationToken()
      void getLessonDocumentByPlan(routedPlan).then(document => {
        if (document && !cancelled && origin === navigationToken()) navigatePrism(`${lessonPath(document.lesson_id)}${window.location.hash}`, {
          replace: true, state: { returnTargetId: readPrismNavigationState()?.returnTargetId },
        })
      }).catch(() => undefined)
    }
    resolve()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, resolve)
    return () => { cancelled = true; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, resolve) }
  }, [routedPlan, navigation.revision])

  useEffect(() => {
    if (route.kind === 'landing') return
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
  }, [route.kind])

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

  const beginReaderRequest = useCallback(() => ({
    sequence: ++readerNavigationSequence.current,
    origin: navigationToken(),
    href: `${window.location.pathname}${window.location.search}${window.location.hash}`,
  }), [])
  const requestIsCurrent = useCallback((request: ReturnType<typeof beginReaderRequest>) =>
    request.sequence === readerNavigationSequence.current && request.origin === navigationToken(), [])

  const finishOpenReader = useCallback(async (
    request: ReturnType<typeof beginReaderRequest>, sourceId: string, initialPage?: number,
    initialHighlight: SearchHit | null = null, targetId?: string,
  ) => {
    let source = sources.find((candidate) => candidate.id === sourceId)
    if (!source) {
      const refreshed = await refreshSources().catch(cause => {
        if (requestIsCurrent(request)) throw cause
        return []
      })
      source = refreshed.find((candidate) => candidate.id === sourceId)
    }
    if (!requestIsCurrent(request)) return
    if (!source) throw new Error('This source is no longer in the workspace.')
    const previous = readPrismNavigationState()?.reader
    const returnHref = route.kind === 'lesson' || route.kind === 'source' ? request.href
      : previous?.sourceId === sourceId ? previous.returnHref : sourcePath(sourceId)
    const returnTarget = targetId ?? (route.kind === 'reader' && previous?.sourceId === sourceId ? previous.targetId : null)
    if (route.kind !== 'reader') rememberReturnTarget(targetId)
    navigatePrism(readerPath(sourceId, initialPage), { state: { reader: {
      sourceId, requestKey: crypto.randomUUID(), returnHref, targetId: returnTarget,
      highlight: initialHighlight?.bbox_normalized ? {
        bounds: initialHighlight.bbox_normalized as [number, number, number, number], elementId: initialHighlight.element_id,
        page: initialHighlight.page_number,
      } : null,
    } } })
  }, [refreshSources, requestIsCurrent, route, sources])

  const openReader = useCallback(async (sourceId: string, initialPage?: number, initialHighlight: SearchHit | null = null) => {
    await finishOpenReader(beginReaderRequest(), sourceId, initialPage, initialHighlight)
  }, [beginReaderRequest, finishOpenReader])

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
    const request = beginReaderRequest()
    const bundle = await readBrowserSourceBundle(sourceId, [elementId], 0).catch(cause => {
      if (requestIsCurrent(request)) throw cause
      return null
    })
    if (!bundle || !requestIsCurrent(request)) return
    const evidence = bundle.elements.find(
      (candidate) => candidate.anchor.element_id === elementId,
    )
    if (!evidence) throw new Error('This lesson citation no longer matches the local evidence map.')
    const bounds = evidence.anchor.bbox_normalized
    await finishOpenReader(request, sourceId, evidence.anchor.pdf_page_index, bounds ? {
      bbox_normalized: bounds,
      document_region: 'body',
      element_id: elementId,
      kind: 'paragraph',
      page_number: evidence.anchor.pdf_page_index,
      snippet: evidence.text.slice(0, 240),
      status: evidence.status,
    } : null, returnTargetId)
  }, [beginReaderRequest, finishOpenReader, requestIsCurrent])

  usePrismLibraryTools({ activeRoute: route, openReader, prepareSourceImport, importSource: handleUpload })

  async function handleUpload(file: File, rightsStatus: RightsStatus) {
    setBusy(true)
    setError(null)
    try {
      const source = await importBrowserSource(file, rightsStatus)
      if (!['open_license', 'public_domain'].includes(source.rights_status)) {
        try { await setBrowserAgentContentAccess(source.id, true) }
        catch { setError('Your PDF was added, but agent access could not be saved. Check access in the source overview before asking your agent to read it.') }
      }
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
    setError(null)
    await deleteBrowserSource(source.id)
    await refreshSources()
    navigatePrism(libraryPath(), { replace: true })
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

  if (route.kind === 'landing') return <LandingPage />

  if (route.kind === 'reader' && readerSource) {
    return (
      <SourceReader
        key={readerSource.id}
        initialHighlight={readerInitialHighlight}
        initialPage={route.page ?? undefined}
        navigationRequestId={readerContext?.requestKey}
        onExit={() => {
          navigatePrism(readerContext?.returnHref ?? sourcePath(readerSource.id), {
            replace: true, state: { returnTargetId: readerContext?.targetId ?? undefined },
          })
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

  if (route.kind === 'lesson') return <><LessonReaderPage key={route.lessonId} lessonId={route.lessonId} onError={setError} onOpenEvidence={openSourceEvidence} returnTargetId={returnTargetId} onReturnComplete={completeReturn} />{error ? <p className="workspace-error" role="alert">{error}</p> : null}</>

  return (
    <SourceWorkspace
      key={`workspace-${sourceImportRequest?.requestId ?? 0}`}
      activeIndexIds={activeIndexIds}
      busy={busy}
      evidenceReturnTargetId={returnTargetId}
      error={error}
      importRequest={sourceImportRequest}
      onAgentAccessChange={(source, granted) => void handleAgentAccessChange(source, granted)}
      onDelete={handleDelete}
      onError={setError}
      onEvidenceReturnComplete={completeReturn}
      onIndex={(sourceId) => void startLocalIndex(sourceId)}
      onOpenEvidence={openSourceEvidence}
      onUpload={handleUpload}
      routeKind={route.kind}
      selectedSource={selectedSource}
      sourcePlanId={route.kind === 'source' && route.view === 'lessons' ? route.planId : null}
      sourceView={route.kind === 'source' ? route.view : null}
      sources={sources}
      sourcesReady={sourcesReady}
    />
  )
}

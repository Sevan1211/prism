import { useEffect, useRef, useState } from 'react'
import { List } from '@phosphor-icons/react'
import { getLessonDocument } from './lessonDocuments'
import { getLessonPlan } from './lessonPlans'
import type { LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'
import { LessonDraftPreview } from './LessonDraftPreview'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import { libraryPath, sourcePath } from '../navigation'
import { PrismLink } from '../PrismLink'
import { AppHeader } from '../workspace/AppHeader'
import { LoadingState } from '../LoadingState'
import { useSyncStatus } from '../storage/useSyncStatus'

const LESSON_SCROLL_STORAGE_PREFIX = 'prism:lesson-scroll:v1:'
const LESSON_SCROLL_SAVE_DEBOUNCE_MS = 160
const LESSON_RESTORE_TIMEOUT_MS = 5000

interface LessonReaderPageProps {
  lessonId: string; onError: (message: string) => void
  onOpenEvidence: (sourceId: string, elementId: string, returnTargetId?: string) => Promise<void>
  returnTargetId: string | null; onReturnComplete: () => void
}

export function LessonReaderPage(props: LessonReaderPageProps) {
  return <LessonReaderSession key={props.lessonId} {...props} />
}

function LessonReaderSession({ lessonId, onError, onOpenEvidence, returnTargetId, onReturnComplete }: LessonReaderPageProps) {
  const sync = useSyncStatus()
  const [record, setRecord] = useState<{ document: LessonDocument; plan: LessonPlan } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [contents, setContents] = useState(() => window.innerWidth > 1000)
  const savedLessonId = record?.document.lesson_id
  const savedTitle = record?.document.title
  const readingPageRef = useRef<HTMLDivElement | null>(null)
  const lessonContentMounted = useRef(false)
  const scrollCaptureEnabled = useRef(false)
  const userInteracted = useRef(false)
  const restorationContext = useRef<{ lessonId: string; hash: string; returnTargetId: string | null } | null>(null)
  const locationHash = readLessonLocationHash()
  useEffect(() => {
    let cancelled = false
    let request = 0
    const load = async () => {
      const current = ++request
      try {
        const document = await getLessonDocument(lessonId)
        const plan = document ? await getLessonPlan(document.plan_id) : null
        if (!cancelled && current === request) { setRecord(document && plan ? { document, plan } : null); setLoadError(null); setLoaded(true) }
      } catch (cause) { if (!cancelled && current === request) { setLoaded(true); setLoadError(cause instanceof Error ? cause.message : 'This lesson could not be opened.') } }
    }
    void load()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, load)
    return () => { cancelled = true; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, load) }
  }, [lessonId, retry, sync.restoring])
  useEffect(() => {
    const previous = globalThis.document.title
    if (savedTitle) globalThis.document.title = `${savedTitle} | PRISM`
    return () => { globalThis.document.title = previous }
  }, [savedTitle])
  useEffect(() => {
    if (!savedLessonId) return
    const hash = locationHash
    const rememberedPosition = readLessonScrollPosition(lessonId)
    const previousContext = restorationContext.current
    const context = { lessonId, hash, returnTargetId }
    const sameLocation = previousContext?.lessonId === lessonId && previousContext?.hash === hash
    const alreadyHandled = sameLocation && (
      previousContext?.returnTargetId === returnTargetId
      || (previousContext?.returnTargetId !== null && previousContext?.returnTargetId !== undefined && returnTargetId === null)
    )
    if (alreadyHandled) {
      scrollCaptureEnabled.current = true
      return
    }
    const scrollContainer = readingPageRef.current
    const main = globalThis.document.getElementById('workspace-main')
    if (!main || !scrollContainer) return
    let observer: MutationObserver | null = null
    const restoreTimer: { id?: number } = {}
    let settled = false
    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', markInteracted)
      window.removeEventListener('keydown', markInteracted)
      scrollContainer.removeEventListener('scroll', markInteracted)
      window.removeEventListener('wheel', markInteracted)
      window.removeEventListener('touchstart', markInteracted)
    }

    const cleanup = () => {
      if (settled) return
      settled = true
      restorationContext.current = context
      if (restoreTimer.id !== undefined) window.clearTimeout(restoreTimer.id)
      observer?.disconnect()
      observer = null
      scrollCaptureEnabled.current = true
      removeInteractionListeners()
    }
    const lessonRoot = () => Array.from(main.querySelectorAll<HTMLElement>('[data-lesson-id]'))
      .find((candidate) => candidate.dataset.lessonId === savedLessonId) ?? null
    const targetFor = (targetId: string) => {
      const target = globalThis.document.getElementById(targetId)
      const root = lessonRoot()
      return target && root?.contains(target) ? target : null
    }
    const restore = () => {
      const root = lessonRoot()
      if (root) lessonContentMounted.current = true
      if (userInteracted.current) {
        cleanup()
        return true
      }
      if (!root) return false
      if (returnTargetId) {
        const target = targetFor(returnTargetId)
        if (target) {
          scrollToLessonElement(target, 'center')
          target.focus({ preventScroll: true })
          cleanup()
          onReturnComplete()
          return true
        }
      }
      if (hash) {
        const target = targetFor(hash)
        if (target) {
          scrollToLessonElement(target, 'start')
          cleanup()
          return true
        }
      }
      if (rememberedPosition !== null) {
        scrollToLessonPosition(scrollContainer, rememberedPosition)
        cleanup()
        return true
      }
      cleanup()
      return true
    }
    const markInteracted = () => {
      userInteracted.current = true
      scrollCaptureEnabled.current = true
    }
    window.addEventListener('pointerdown', markInteracted)
    window.addEventListener('keydown', markInteracted)
    scrollContainer.addEventListener('scroll', markInteracted, { passive: true })
    window.addEventListener('wheel', markInteracted, { passive: true })
    window.addEventListener('touchstart', markInteracted, { passive: true })
    restoreTimer.id = window.setTimeout(cleanup, LESSON_RESTORE_TIMEOUT_MS)
    if (restore()) return
    observer = new MutationObserver(() => { restore() })
    observer.observe(main, { childList: true, subtree: true })
    return () => {
      cleanup()
    }
  }, [lessonId, savedLessonId, returnTargetId, onReturnComplete, locationHash])
  useEffect(() => {
    if (!savedLessonId) return
    const scrollContainer = readingPageRef.current
    if (!scrollContainer) return
    let timeoutId: number | undefined
    let lastPosition = scrollContainer.scrollTop
    const save = () => {
      timeoutId = undefined
      if (lessonContentMounted.current && scrollCaptureEnabled.current) saveLessonScrollPosition(lessonId, scrollContainer.isConnected ? scrollContainer.scrollTop : lastPosition)
    }
    const scheduleSave = () => {
      lastPosition = scrollContainer.scrollTop
      if (!scrollCaptureEnabled.current || timeoutId !== undefined) return
      timeoutId = window.setTimeout(save, LESSON_SCROLL_SAVE_DEBOUNCE_MS)
    }
    const flush = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      timeoutId = undefined
      if (lessonContentMounted.current && scrollCaptureEnabled.current) saveLessonScrollPosition(lessonId, scrollContainer.isConnected ? scrollContainer.scrollTop : lastPosition)
    }
    scrollContainer.addEventListener('scroll', scheduleSave, { passive: true })
    window.addEventListener('pagehide', flush)
    return () => {
      scrollContainer.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [lessonId, savedLessonId])
  return <div ref={readingPageRef} className="lesson-reading-page">
    <a className="skip-link" href="#workspace-main">Skip to lesson</a><AppHeader />
    {!loaded || loadError || (!record && sync.restoring) ? <main id="workspace-main" tabIndex={-1}><LoadingState title="Opening your lesson" detail={sync.restoring ? 'Opening your account library and checking for saved lessons…' : 'Loading the saved explanation, citations and visuals.'} error={loadError} onRetry={() => setRetry(value => value + 1)} /></main> : !record ? <main id="workspace-main" tabIndex={-1} className="not-found-view"><h1>This lesson is not in your current library.</h1><p>It may have been removed or saved in another library. If you created it elsewhere, open the browser or library where you saved it.</p><PrismLink href={libraryPath()} className="button-primary">Open your library</PrismLink></main> : <>
      <div className="reading-toolbar">
        <nav aria-label="Breadcrumb"><PrismLink href={libraryPath()}>Library</PrismLink><span>/</span><PrismLink href={sourcePath(record.plan.source_id, 'lessons')}>Source lessons</PrismLink><span>/</span><span aria-current="page">Reading</span></nav>
        <div><button type="button" aria-pressed={contents} onClick={() => setContents(value => !value)}><List /> Contents</button></div>
      </div>
      <div className="reading-layout" data-contents={contents}>
        {contents ? <aside className="reading-contents"><span>IN THIS LESSON</span><nav aria-label="Lesson sections"><ol>{record.document.sections.map((section, index) => <li key={section.section_id}><a href={`#section-${section.section_id.replace(/[^a-zA-Z0-9_-]/g, '-')}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}</ol></nav><small>Pages {record.plan.page_start}–{record.plan.page_end} · {record.document.sections.filter(section => section.blocks.length).length}/{record.document.sections.length} sections saved</small></aside> : null}
        <main id="workspace-main" tabIndex={-1}><LessonDraftPreview key={lessonId} plan={record.plan} onError={onError} onOpenEvidence={(id, target) => onOpenEvidence(record.plan.source_id, id, target)} /></main>
      </div>
    </>}
  </div>
}

function lessonScrollStorageKey(lessonId: string): string {
  return `${LESSON_SCROLL_STORAGE_PREFIX}${lessonId}`
}

function readLessonLocationHash(): string {
  let hash = window.location.hash.slice(1)
  try { hash = decodeURIComponent(hash) } catch { /* A malformed URL must not prevent reading. */ }
  return hash
}

function readLessonScrollPosition(lessonId: string): number | null {
  try {
    const raw = window.sessionStorage.getItem(lessonScrollStorageKey(lessonId))
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

function saveLessonScrollPosition(lessonId: string, position: number): void {
  try {
    if (Number.isFinite(position) && position >= 0) {
      window.sessionStorage.setItem(lessonScrollStorageKey(lessonId), String(position))
    }
  } catch {
    // Storage may be unavailable in privacy-restricted contexts.
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollToLessonElement(target: HTMLElement, block: ScrollLogicalPosition): void {
  target.scrollIntoView({ block, behavior: prefersReducedMotion() ? 'auto' : 'instant' })
}

function scrollToLessonPosition(scrollContainer: HTMLElement, position: number): void {
  scrollContainer.scrollTo({ top: position, left: 0, behavior: prefersReducedMotion() ? 'auto' : 'instant' })
}

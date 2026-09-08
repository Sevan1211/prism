import { useEffect, useState } from 'react'
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
    let hash = window.location.hash.slice(1)
    try { hash = decodeURIComponent(hash) } catch { /* A malformed URL must not prevent reading. */ }
    const targetId = returnTargetId || hash
    if (!targetId) return
    const restore = () => {
      const target = globalThis.document.getElementById(targetId)
      if (!target) return false
      target.scrollIntoView({ block: returnTargetId ? 'center' : 'start' })
      if (returnTargetId) { target.focus({ preventScroll: true }); onReturnComplete() }
      return true
    }
    if (restore()) return
    const observer = new MutationObserver(() => { if (restore()) observer.disconnect() })
    observer.observe(globalThis.document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [savedLessonId, returnTargetId, onReturnComplete])
  return <div className="lesson-reading-page">
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

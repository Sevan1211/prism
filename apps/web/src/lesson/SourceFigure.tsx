import { useRef, useState } from 'react'
import { ArrowsOut, FileText, X } from '@phosphor-icons/react'
import { SourcePageCanvas } from '../reader/SourcePageCanvas'
import { SourceVisualViewer } from '../reader/SourceVisualViewer'
import type { LessonBlockContent } from './lessonDocumentTypes'

export function SourceFigure({ content, sourceId }: { content: Extract<LessonBlockContent, { kind: 'source_figure' }>; sourceId: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [fullPage, setFullPage] = useState(false)
  const close = () => { dialog.current?.close(); setExpanded(false); trigger.current?.focus({ preventScroll: true }) }
  return <figure className="source-figure">
    <SourcePageCanvas sourceId={sourceId} page={content.page_number} bbox={fullPage ? [0, 0, 1, 1] : content.bbox} alt={fullPage ? `Full original page ${content.page_number}. ${content.alt}` : content.alt} />
    <div className="source-figure-actions"><button type="button" className="button-quiet" aria-pressed={fullPage} onClick={() => setFullPage(value => !value)}><FileText aria-hidden="true" />{fullPage ? 'Show figure crop' : 'Show full page'}</button>
      <button ref={trigger} type="button" className="figure-expand button-quiet" onClick={() => { setExpanded(true); dialog.current?.showModal() }}><ArrowsOut aria-hidden="true" /> Enlarge figure</button></div>
    <figcaption><strong>Original · page {content.page_number}.</strong> {content.caption}<span>Caption and description added for this lesson.</span></figcaption>
    <dialog ref={dialog} className="figure-dialog" aria-label={`Original figure, page ${content.page_number}`} onCancel={close}>
      <header><strong>Original · page {content.page_number}</strong><button type="button" className="icon-button" aria-label="Close enlarged figure" onClick={close}><X /></button></header>
      {expanded ? <SourceVisualViewer sourceId={sourceId} page={content.page_number} bbox={content.bbox} initialContext={fullPage} alt={content.alt} /> : null}
      <p>{content.caption}</p>
    </dialog>
  </figure>
}

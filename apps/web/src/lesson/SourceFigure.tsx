import { useRef, useState } from 'react'
import { ArrowsOut, X } from '@phosphor-icons/react'
import { SourcePageCanvas } from '../reader/SourcePageCanvas'
import { SourceVisualViewer } from '../reader/SourceVisualViewer'
import type { LessonBlockContent } from './lessonDocumentTypes'

export function SourceFigure({ content, sourceId }: { content: Extract<LessonBlockContent, { kind: 'source_figure' }>; sourceId: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState(false)
  const close = () => { dialog.current?.close(); setExpanded(false); trigger.current?.focus({ preventScroll: true }) }
  return <figure className="source-figure">
    <SourcePageCanvas sourceId={sourceId} page={content.page_number} bbox={content.bbox} alt={content.alt} />
    <button ref={trigger} type="button" className="figure-expand button-quiet" onClick={() => { setExpanded(true); dialog.current?.showModal() }}><ArrowsOut aria-hidden="true" /> Enlarge figure</button>
    <figcaption><strong>Original · page {content.page_number}.</strong> {content.caption}<span>Caption and description added for this lesson.</span></figcaption>
    <dialog ref={dialog} className="figure-dialog" aria-label={`Original figure, page ${content.page_number}`} onCancel={close}>
      <header><strong>Original · page {content.page_number}</strong><button type="button" className="icon-button" aria-label="Close enlarged figure" onClick={close}><X /></button></header>
      {expanded ? <SourceVisualViewer sourceId={sourceId} page={content.page_number} bbox={content.bbox} alt={content.alt} /> : null}
      <p>{content.caption}</p>
    </dialog>
  </figure>
}

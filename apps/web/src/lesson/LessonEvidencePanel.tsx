import { useEffect, useRef, useState } from 'react'
import { readBrowserSourceBundle } from '../storage/browserSources'
import type { SourceEvidenceItem } from '../storage/sourceIndexTypes'
import { SourceFigure } from './SourceFigure'

export function LessonEvidencePanel({ elementId, onClose, onOpenReader, referenceIds, returnTargetId, sourceId }: {
  elementId: string; onClose: () => void; onOpenReader: (elementId: string) => void; referenceIds: string[]; returnTargetId: string; sourceId: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [evidence, setEvidence] = useState<SourceEvidenceItem | null>(null)
  const [failed, setFailed] = useState(false)
  const [references, setReferences] = useState<SourceEvidenceItem[]>([])
  useEffect(() => {
    dialog.current?.showModal()
    return () => { document.getElementById(returnTargetId)?.focus({ preventScroll: true }) }
  }, [returnTargetId])
  useEffect(() => {
    let cancelled = false
    void readBrowserSourceBundle(sourceId, [...new Set([elementId, ...referenceIds])].slice(0, 12), 0).then((bundle) => {
      const match = bundle.elements.find((item) => item.anchor.element_id === elementId)
      if (!cancelled) { setEvidence(match ?? null); setReferences(bundle.elements); setFailed(!match) }
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [elementId, referenceIds, sourceId])
  const bbox = evidence?.anchor.bbox_normalized
  return <dialog ref={dialog} className="lesson-evidence-panel" aria-labelledby="evidence-panel-title" onCancel={onClose}>
    <header><div><span>Check the source</span><h2 id="evidence-panel-title">{evidence ? `Original · page ${evidence.anchor.pdf_page_index}` : 'Source reference'}</h2></div><button type="button" autoFocus aria-label="Close source reference" onClick={onClose}>×</button></header>
    {references.length > 1 ? <label className="evidence-picker">Cited passages in this explanation<select value={evidence?.anchor.element_id ?? elementId} onChange={(event) => setEvidence(references.find((item) => item.anchor.element_id === event.target.value) ?? null)}>{references.map((item, index) => <option key={item.anchor.element_id} value={item.anchor.element_id ?? ''}>p. {item.anchor.pdf_page_index} · {index + 1}. {item.text.replace(/\s+/g, ' ').slice(0, 80)}…</option>)}</select></label> : null}
    {evidence && bbox ? <SourceFigure sourceId={sourceId} content={{ kind: 'source_figure', page_number: evidence.anchor.pdf_page_index, bbox: [Math.max(0, bbox[0] - .015), Math.max(0, bbox[1] - .015), Math.min(1, bbox[2] + .015), Math.min(1, bbox[3] + .015)], alt: evidence.text.slice(0, 1200), caption: 'Exact page region from your PDF. Expand to the full page for surrounding context.' }} /> : null}
    {evidence ? <details><summary>Extracted text & limitations</summary><blockquote>{evidence.text}</blockquote><p>Embedded text is a candidate extraction. Reading order, equations, and page structure may need checking against the original.</p></details> : <p role="status">{failed ? 'The extracted reference could not be opened. You can still try the original Reader.' : 'Opening the cited page region…'}</p>}
    <footer><button className="button-secondary" type="button" onClick={() => onOpenReader(evidence?.anchor.element_id ?? elementId)}>Open full page in Reader</button><button className="button-primary" type="button" onClick={onClose}>Return to lesson</button></footer>
  </dialog>
}

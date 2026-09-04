import { lazy, Suspense, useEffect, useState } from 'react'
import { Check, X } from '@phosphor-icons/react'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import { getLessonEditProposal, resolveLessonRevision } from './lessonDocuments'
import type { LessonBlockContent, LessonDocument, LessonEditProposal } from './lessonDocumentTypes'
import { SourceFigure } from './SourceFigure'
import { LessonEvidencePanel } from './LessonEvidencePanel'
import { lessonRevisionDiff } from './lessonRevisionDiff'

const LessonRichText = lazy(() => import('./LessonRichText'))
const LessonVisual = lazy(() => import('./LessonVisual').then((module) => ({ default: module.LessonVisual })))

export function LessonRevisionProposal({ document, onError, onOpenEvidence }: { document: LessonDocument; onError: (message: string) => void; onOpenEvidence: (elementId: string, returnTargetId?: string) => Promise<void> }) {
  const [proposal, setProposal] = useState<LessonEditProposal | null>(null)
  const [busy, setBusy] = useState(false)
  const [evidence, setEvidence] = useState<{ elementId: string; referenceIds: string[]; returnTargetId: string } | null>(null)
  useEffect(() => {
    let active = true
    const load = () => { void getLessonEditProposal(document.lesson_id).then((value) => { if (active) setProposal(value ?? null) }).catch(() => { if (active) onError('The proposed revision could not be loaded.') }) }
    load(); window.addEventListener(PRISM_VAULT_CHANGED_EVENT, load)
    return () => { active = false; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, load) }
  }, [document.lesson_id, onError])
  if (!proposal) return null
  const changes = lessonRevisionDiff(document, proposal.candidate)
  const resolve = async (accept: boolean) => {
    setBusy(true)
    try { await resolveLessonRevision(document.lesson_id, proposal.proposal_id, accept); setProposal(null) }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'The revision could not be saved.') }
    finally { setBusy(false) }
  }
  const stale = proposal.base_version !== document.document_version
  return <section className="lesson-edit-proposal" aria-label="Proposed lesson revision">
    <header><span>From your agent</span><h3>A clearer explanation, ready to review.</h3><p>{proposal.summary}</p></header>
    <p className="revision-note">Your current lesson stays in place until you accept. {changes.length} content block{changes.length === 1 ? '' : 's'} changed.</p>
    {stale ? <p role="alert">The lesson changed after this proposal. Dismiss it and ask your agent to revise the latest version.</p> : null}
    {changes.map(({ id, previous, proposed, moved, changed }, index) => {
      const old = previous?.block
      const next = proposed?.block
      const label = next?.content.kind === 'rich_text' ? next.content.markdown.match(/^#{1,6}\s+(.+)$/m)?.[1] : undefined
      return <details className="revision-change" key={id} open={changes.length === 1}><summary>{label ?? `Change ${index + 1}`} · {old ? next ? changed ? 'Revised' : 'Moved' : 'Removed' : 'Added'}</summary>
        {moved ? <p className="revision-note">Moved from {previous?.section}, position {(previous?.order ?? 0) + 1}, to {proposed?.section}, position {(proposed?.order ?? 0) + 1}.</p> : null}
        <div className="revision-comparison">{[{ label: 'Current', block: old }, { label: 'Proposed', block: next }].map(({ label: side, block }) => <div key={side}><strong>{side}</strong><RevisionContent content={block?.content} sourceId={document.source_id} />{block ? <><p className="revision-note">{block.provenance.replaceAll('_', ' ')}</p><div className="revision-evidence">{block.source_element_ids.map((elementId, i) => { const target = `revision-evidence-${index}-${side}-${i}`; return <button type="button" className="quiet-button" id={target} key={elementId} onClick={() => setEvidence({ elementId, referenceIds: block.source_element_ids, returnTargetId: target })}>Evidence {i + 1}</button> })}</div></> : null}</div>)}</div>
        {JSON.stringify(old?.source_element_ids) !== JSON.stringify(next?.source_element_ids) ? <p className="revision-note">Source references changed. Inspect either version’s evidence before accepting.</p> : null}
      </details>
    })}
    {evidence ? <LessonEvidencePanel sourceId={document.source_id} {...evidence} onClose={() => setEvidence(null)} onOpenReader={(id) => { void onOpenEvidence(id, evidence.returnTargetId).catch(() => onError('The cited page could not be opened.')) }} /> : null}
    <footer><button className="button-secondary" type="button" disabled={busy} onClick={() => { void resolve(false) }}><X aria-hidden="true" /> Keep current lesson</button><button className="button-primary" type="button" disabled={busy || stale} onClick={() => { void resolve(true) }}><Check aria-hidden="true" /> {busy ? 'Saving…' : 'Accept revision'}</button></footer>
  </section>
}

function RevisionContent({ content, sourceId }: { content?: LessonBlockContent; sourceId: string }) {
  if (!content) return <p className="revision-note">No content.</p>
  if (content.kind === 'rich_text') return <Suspense fallback={<p>Loading formatted text…</p>}><LessonRichText markdown={content.markdown} /></Suspense>
  if (content.kind === 'visual_scene' || content.kind === 'data_plot') return <Suspense fallback={<p>{content.description}</p>}><LessonVisual content={content} /></Suspense>
  if (content.kind === 'source_figure') return <SourceFigure content={content} sourceId={sourceId} />
  const flatten = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : Array.isArray(value) ? value.map(flatten).join('\n') : value && typeof value === 'object' ? Object.entries(value).filter(([key]) => !['kind', 'step_id', 'node_id'].includes(key)).map(([, value]) => flatten(value)).join('\n\n') : ''
  return <p className="revision-plain">{flatten(content)}</p>
}

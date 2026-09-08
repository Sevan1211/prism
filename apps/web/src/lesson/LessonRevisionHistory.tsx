import { lazy, Suspense, useState } from 'react'
import type { LessonBlockContent, LessonDocument } from './lessonDocumentTypes'
import { getLessonDocumentRevision, restoreLessonRevision } from './lessonDocuments'

const LessonRichText = lazy(() => import('./LessonRichText'))

export function LessonRevisionHistory({ document, onError }: { document: LessonDocument; onError: (message: string) => void }) {
  const [previous, setPrevious] = useState<LessonDocument | null>(null)
  const [busy, setBusy] = useState(false)
  const priorVersion = document.document_version - 1
  const load = async () => {
    try { setPrevious(await getLessonDocumentRevision(document.lesson_id, priorVersion) ?? null) }
    catch { onError('The previous revision could not be opened.') }
  }
  const restore = async () => {
    setBusy(true)
    try { await restoreLessonRevision(document.lesson_id, priorVersion, document.document_version) }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'The previous revision could not be restored.') }
    finally { setBusy(false) }
  }
  if (priorVersion < 1) return <p className="lesson-version">Version 1 · Changes will be saved in your lesson history.</p>
  const oldBlocks = previous?.sections.flatMap((section) => section.blocks) ?? []
  const newBlocks = document.sections.flatMap((section) => section.blocks)
  const position = (lesson: LessonDocument | null, id: string) => lesson?.sections.flatMap((section) => section.blocks.map((block, index) => ({ id: block.block_id, section: section.section_id, index }))).find((block) => block.id === id)
  const changed = [...new Set([...oldBlocks, ...newBlocks].map((block) => block.block_id))].filter((id) => JSON.stringify(oldBlocks.find((block) => block.block_id === id)) !== JSON.stringify(newBlocks.find((block) => block.block_id === id)) || JSON.stringify(position(previous, id)) !== JSON.stringify(position(document, id)))
  return <details className="lesson-revisions" onToggle={(event) => { if (event.currentTarget.open) void load() }}>
    <summary>Version {document.document_version} · Review the latest changes</summary>
    {previous?.document_version === priorVersion ? <>
      <p>{changed.length} changed block{changed.length === 1 ? '' : 's'} since version {priorVersion}. Your previous version remains saved.</p>
      {changed.map((id) => {
        const before = oldBlocks.find((block) => block.block_id === id)
        const after = newBlocks.find((block) => block.block_id === id)
        const delta = changedParagraphs(readableContent(before?.content), readableContent(after?.content))
        const label = readableContent(after?.content ?? before?.content).match(/^#{1,6}\s+(.+)$/m)?.[1] ?? id.replaceAll('-', ' ')
        return <details key={id} className="revision-change"><summary>{label}</summary>
          {delta.unchanged ? <p className="revision-note">Unchanged paragraphs are omitted below.</p> : null}
          {delta.before || delta.after ? <div className="revision-comparison"><RevisionText label="Before" text={delta.before} rich={before?.content.kind === 'rich_text'} /><RevisionText label="Now" text={delta.after} rich={after?.content.kind === 'rich_text'} /></div> : <p>The wording is unchanged; its placement or source references changed.</p>}
          {JSON.stringify(before?.source_element_ids) !== JSON.stringify(after?.source_element_ids) || before?.provenance !== after?.provenance ? <p>Source references or attribution changed. Inspect the references in the current lesson.</p> : null}
        </details>
      })}
      <button className="quiet-button" type="button" disabled={busy} onClick={() => { void restore() }}>{busy ? 'Restoring…' : `Restore version ${priorVersion}`}</button>
      <p className="lesson-version">Restoring creates a new version. It preserves the history and checks for conflicting edits.</p>
    </> : <p>Loading the previous version…</p>}
  </details>
}

function readableContent(content: LessonBlockContent | undefined): string {
  if (!content) return ''
  if (content.kind === 'rich_text') return content.markdown
  if ('text' in content) return content.text
  if (content.kind === 'network_delay') return `${content.caption}\nPacket: ${content.packet_bytes} bytes\nLink: ${content.link_mbps} Mb/s\nPropagation: ${content.propagation_ms} ms`
  const flatten = (value: unknown): string => {
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (Array.isArray(value)) return value.map(flatten).join('\n')
    if (value && typeof value === 'object') return Object.entries(value).filter(([key]) => !['kind', 'step_id', 'node_id'].includes(key)).map(([, item]) => flatten(item)).join('\n\n')
    return ''
  }
  return flatten(content)
}

function RevisionText({ label, rich, text }: { label: string; rich: boolean; text: string }) {
  return <div><strong>{label}</strong>{text ? rich ? <Suspense fallback={<pre>{text}</pre>}><LessonRichText markdown={text} /></Suspense> : <pre>{text}</pre> : <p>No text {label === 'Before' ? 'removed' : 'added'}.</p>}</div>
}

function changedParagraphs(before: string, after: string) {
  const left = before ? before.split(/\n\s*\n/) : []
  const right = after ? after.split(/\n\s*\n/) : []
  let start = 0
  while (start < left.length && start < right.length && left[start] === right[start]) start++
  let end = 0
  while (end < left.length - start && end < right.length - start && left[left.length - end - 1] === right[right.length - end - 1]) end++
  return { before: left.slice(start, left.length - end).join('\n\n'), after: right.slice(start, right.length - end).join('\n\n'), unchanged: start + end > 0 }
}

import { useId } from 'react'
import type { TopicReference } from './topicTypes'
import { PrismLink } from '../PrismLink'

export function TopicReferences({ references, ids, onOpenEvidence, onError }: {
  references: TopicReference[]; ids: string[]
  onOpenEvidence?: (sourceId: string, elementId: string, returnTargetId?: string) => Promise<void>
  onError: (message: string) => void
}) {
  const scope = useId().replace(/:/g, '')
  if (!ids.length) return <p className="revision-note">Agent explanation · no checked reference attached.</p>
  return <details className="topic-references"><summary>{ids.length} supporting {ids.length === 1 ? 'reference' : 'references'}</summary>
    <ul>{references.filter(reference => ids.includes(reference.id)).map(reference => <li key={reference.id}>
      {reference.kind === 'web' ? <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title}</a> : <PrismLink href={`/sources/${reference.source_id}`}>{reference.title}</PrismLink>}
      <small>{reference.locator} · {reference.support}{reference.accessed_at ? ` · Agent inspected ${reference.accessed_at}` : ''}</small>
      {reference.kind === 'source' && onOpenEvidence ? <div className="revision-evidence">{reference.element_ids?.map((id, index) => <button key={id} id={`${scope}-${reference.id}-${index}`} className="button-quiet" onClick={event => { void onOpenEvidence(reference.source_id!, id, event.currentTarget.id).catch(cause => onError(cause instanceof Error ? cause.message : 'This reference could not be opened.')) }}>Inspect source passage {index + 1}</button>)}</div> : null}
    </li>)}</ul><p>References and their relevance are recorded by the authoring agent. They are not independent verification.</p>
  </details>
}

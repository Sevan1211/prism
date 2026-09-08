import type { LessonDocument } from './lessonDocumentTypes'
import type { LessonPlan } from './lessonPlanTypes'

export function LessonCoveragePanel({ document, plan }: { document: LessonDocument; plan: LessonPlan }) {
  const exceptions = (plan.coverage ?? []).filter(entry => ['compressed', 'omitted', 'deferred', 'source_only'].includes(entry.disposition))
  const ranges = (plan.coverage_ranges ?? []).filter(entry => ['compressed', 'omitted', 'deferred', 'source_only'].includes(entry.disposition))
  const blocks = new Map(document.sections.flatMap(section => section.blocks.map(block => [block.block_id, section.title] as const)))
  const savedSections = document.sections.filter(section => section.blocks.length > 0).length
  return <details className="lesson-coverage-panel">
    <summary>Coverage & review <span>{savedSections} of {document.sections.length} sections saved</span></summary>
    <p>Structure checks: {document.validation.valid_for_ready ? 'passed' : 'incomplete'}. Content review: {document.semantic_review ? `recorded by ${document.semantic_review.reviewer}` : 'not finished'}. These checks do not establish correctness or learning.</p>
    <h3>What was shortened or left out</h3>
    {!exceptions.length && !ranges.length ? <p>No compression or omissions are declared in the approved plan.</p> : <ul>
      {ranges.map(range => <li key={`${range.page_start}-${range.page_end}`}>Pages {range.page_start}–{range.page_end} · {range.disposition.replaceAll('_', ' ')}: {range.reason}</li>)}
      {exceptions.map(entry => <li key={entry.element_id}><code>{entry.element_id}</code> · {entry.disposition.replaceAll('_', ' ')}: {entry.reason || 'No reason recorded; ask your agent to clarify the scope.'}</li>)}
    </ul>}
    <h3>Where the source is taught</h3>
    {document.coverage_review?.length ? <ol className="coverage-concepts">{document.coverage_review.map((entry, index) => <li key={index}>
      <strong>{entry.concept}</strong><p>{entry.retained_details}</p>
      <div>{entry.block_ids.map((id, blockIndex) => <a key={id} href={`#${encodeURIComponent(`block-${id}`)}`}>{blocks.get(id) ?? 'Passage'}{entry.block_ids.length > 1 ? ` · ${blockIndex + 1}` : ''}</a>)}</div>
      <small>Evidence: {entry.source_element_ids.join(', ')}</small>
    </li>)}</ol> : <p>No passage-level content review is saved yet. Existing lessons remain readable; ask your agent to review the evidence when revising.</p>}
    {document.semantic_review ? <p><strong>Agent review:</strong> {document.semantic_review.summary}</p> : null}
    <p>Your judgment of the lesson remains separate from this agent-authored review.</p>
  </details>
}

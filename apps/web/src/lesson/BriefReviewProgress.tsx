import type { LessonBrief } from './lessonPlanTypes'

export function BriefReviewProgress({ brief }: { brief: LessonBrief }) {
  const reviews = brief.scope_reviews ?? []
  const ranges = reviews.filter(review => Number.isInteger(review.page_start) && Number.isInteger(review.page_end))
    .map(review => [Math.max(brief.page_start, review.page_start), Math.min(brief.page_end, review.page_end)])
    .sort((a, b) => a[0] - b[0])
  let end = brief.page_start - 1
  let reviewed = 0
  for (const [start, last] of ranges) {
    reviewed += Math.max(0, last - Math.max(start, end + 1) + 1)
    end = Math.max(end, last)
  }
  const total = brief.page_end - brief.page_start + 1
  const unresolved = reviews.filter(review => review.visual_review === 'unresolved').length
  return <div className="brief-review-progress" role="status">
    <strong>{reviews.length ? `${reviewed} of ${total} pages have saved review checkpoints` : 'Request saved · waiting for an agent plan'}</strong>
    {reviews.length ? <><progress aria-label={`Saved source-review pages for ${brief.name}`} value={reviewed} max={total} /><p>{unresolved ? `${unresolved} checkpoint${unresolved === 1 ? ' has' : 's have'} unresolved visual evidence. ` : ''}These are saved agent reviews, not a finished lesson or a fidelity guarantee. Copy the request to resume from saved work.</p></> : <p>Saving a request does not start an agent automatically. Copy it into your connected agent conversation.</p>}
  </div>
}

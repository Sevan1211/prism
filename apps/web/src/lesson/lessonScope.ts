import { accessBrowserVault, PRISM_VAULT_CHANGED_EVENT, PRISM_VAULT_LESSON_BRIEF_STORE, type BrowserVaultEnvironment } from '../storage/browserVault'
import { getBrowserSourcePages, readBrowserSourceBundle } from '../storage/browserSources'
import type { LessonBrief, LessonCoverageRange, ScopeReview } from './lessonPlanTypes'

export interface ScopeReviewInput extends Omit<ScopeReview, 'updated_at'> { brief_id: string }

// Reviews are bounded, independently replaceable checkpoints in the brief. They
// retain an agent's interpretation, not a claim of independently verified fidelity.
export async function recordScopeReview(input: ScopeReviewInput, environment?: BrowserVaultEnvironment): Promise<ScopeReview> {
  const brief = await accessBrowserVault((db) => new Promise<LessonBrief>((resolve, reject) => {
    const request = db.transaction(PRISM_VAULT_LESSON_BRIEF_STORE).objectStore(PRISM_VAULT_LESSON_BRIEF_STORE).get(input.brief_id)
    request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error('Unknown lesson brief.'))
    request.onerror = () => reject(request.error)
  }), environment)
  if (!Number.isInteger(input.page_start) || !Number.isInteger(input.page_end) || input.page_start < brief.page_start || input.page_end > brief.page_end || input.page_end < input.page_start || input.page_end - input.page_start >= 8) throw new Error('Review 1–8 pages inside the brief at a time.')
  if (typeof input.summary !== 'string' || input.summary.trim().length < 20 || input.summary.length > 6000) throw new Error('A review needs a substantive summary of at most 6,000 characters, preserving methods, claims, qualifications, and examples.')
  if (!['inspected', 'not_needed', 'unresolved'].includes(input.visual_review)) throw new Error('Record whether the original visuals were inspected, unnecessary, or unresolved.')
  if (typeof input.visual_notes !== 'string' || input.visual_notes.trim().length < 5 || input.visual_notes.length > 2000) throw new Error('Explain the visual review, including unreadable regions or why inspection was unnecessary.')
  if (!Array.isArray(input.essential_element_ids) || input.essential_element_ids.length > 64 || new Set(input.essential_element_ids).size !== input.essential_element_ids.length) throw new Error('Select up to 64 unique essential evidence anchors.')
  for (let start = 0; start < input.essential_element_ids.length; start += 4) {
    const bundle = await readBrowserSourceBundle(brief.source_id, input.essential_element_ids.slice(start, start + 4), 0, environment)
    if (!bundle.bundle_complete || bundle.elements.some((item) => item.anchor.pdf_page_index < input.page_start || item.anchor.pdf_page_index > input.page_end)) throw new Error('Essential anchors must resolve within the reviewed pages.')
  }
  const pages = await getBrowserSourcePages(brief.source_id, input.page_start, input.page_end, environment)
  if (input.visual_review === 'not_needed' && pages.some((page) => page.profile.layout_state !== 'linear_candidate')) throw new Error('These pages contain uncertain text or layout. Inspect the original page images, or mark their visuals unresolved.')
  const review: ScopeReview = { page_start: input.page_start, page_end: input.page_end, summary: input.summary.trim(), essential_element_ids: input.essential_element_ids, visual_review: input.visual_review, visual_notes: input.visual_notes.trim(), updated_at: new Date().toISOString() }
  await accessBrowserVault((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PRISM_VAULT_LESSON_BRIEF_STORE, 'readwrite')
    const store = tx.objectStore(PRISM_VAULT_LESSON_BRIEF_STORE)
    const request = store.get(brief.brief_id)
    let failure: Error | null = null
    request.onsuccess = () => {
      const current = request.result as LessonBrief | undefined
      if (!current || current.source_hash !== brief.source_hash) { failure = new Error('The brief changed or was removed.'); tx.abort(); return }
      const reviews = current.scope_reviews ?? []
      const overlap = reviews.some((other) => other.page_start <= review.page_end && other.page_end >= review.page_start && !(other.page_start === review.page_start && other.page_end === review.page_end))
      if (overlap) { failure = new Error('Review ranges may not overlap. Replace an existing review using its exact page range.'); tx.abort(); return }
      const next = reviews.filter((other) => other.page_start !== review.page_start)
      next.push(review)
      store.put({ ...current, scope_reviews: next.sort((a, b) => a.page_start - b.page_start), updated_at: review.updated_at })
    }
    tx.oncomplete = () => resolve()
    tx.onabort = tx.onerror = () => reject(failure ?? tx.error ?? new Error('The source review could not be saved.'))
  }), environment)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
  return review
}

export function validateCoverageRanges(ranges: LessonCoverageRange[], brief: LessonBrief): LessonCoverageRange[] {
  if (!Array.isArray(ranges) || !ranges.length || ranges.length > 128) throw new Error('Use 1–128 coverage ranges.')
  const ordered = [...ranges].sort((a, b) => a.page_start - b.page_start)
  let expected = brief.page_start
  for (const range of ordered) {
    if (!Number.isInteger(range.page_start) || !Number.isInteger(range.page_end) || range.page_start !== expected || range.page_end < range.page_start || range.page_end > brief.page_end) throw new Error('Coverage ranges must classify every page exactly once, without gaps or overlaps.')
    if (!['core', 'supporting', 'compressed', 'prerequisite', 'omitted', 'deferred', 'source_only'].includes(range.disposition)) throw new Error('Invalid range disposition.')
    if (typeof range.reason !== 'string' || range.reason.trim().length < 5 || range.reason.length > 800) throw new Error('Each range needs a concrete coverage or compression rationale.')
    for (let page = range.page_start; page <= range.page_end; page++) {
      const review = brief.scope_reviews?.find((item) => item.page_start <= page && item.page_end >= page)
      if (!review) throw new Error(`Page ${page} has no saved scope review. Read the source and record_scope_review before proposing a synthesis.`)
      if (review.visual_review === 'unresolved' && !['omitted', 'deferred', 'source_only'].includes(range.disposition)) throw new Error(`Page ${page} has unresolved visual evidence. Resolve it or disclose its exclusion.`)
    }
    expected = range.page_end + 1
  }
  if (expected !== brief.page_end + 1) throw new Error('Coverage ranges do not reach the end of the brief.')
  return ordered.map((range) => ({ ...range, reason: range.reason.trim() }))
}

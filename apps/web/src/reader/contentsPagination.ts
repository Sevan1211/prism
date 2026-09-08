import type { SourceSection } from '../types'

/** Bound navigation output independently of the source's size or heading count. */
export function paginateContents(sections: SourceSection[], cursor = '0', limit = 24) {
  if (!/^\d+$/.test(cursor)) throw new Error('Invalid contents cursor.')
  const offset = Number(cursor)
  if (!Number.isSafeInteger(offset) || offset > sections.length) throw new Error('Contents cursor is out of range.')
  if (!Number.isFinite(limit) || limit < 1 || !Number.isInteger(limit)) throw new Error('Invalid contents limit.')
  const outline = sections.slice(offset, offset + Math.min(limit, 40))
  const next = offset + outline.length
  return { outline, total_sections: sections.length, next_cursor: next < sections.length ? String(next) : null }
}

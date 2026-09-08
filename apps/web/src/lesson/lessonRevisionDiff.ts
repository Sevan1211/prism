import type { LessonContentBlock, LessonDocument } from './lessonDocumentTypes'

export interface RevisionBlockLocation { block: LessonContentBlock; section: string; sectionId: string; order: number }
type RevisionDocument = Pick<LessonDocument, 'sections'>

export function lessonRevisionDiff(before: RevisionDocument, after: RevisionDocument) {
  const locations = (document: RevisionDocument) => new Map<string, RevisionBlockLocation>(document.sections.flatMap((section) => section.blocks.map((block, order) => [block.block_id, { block, section: section.title, sectionId: section.section_id, order }] as const)))
  const old = locations(before), next = locations(after)
  const shared = new Set([...old.keys()].filter((id) => next.has(id)))
  // Compare order only among retained blocks, so adding one explanation does not
  // label every following paragraph as a move.
  const order = (document: RevisionDocument, sectionId: string, id: string) => document.sections.find((section) => section.section_id === sectionId)?.blocks.filter((block) => shared.has(block.block_id)).findIndex((block) => block.block_id === id)
  return [...new Set([...old.keys(), ...next.keys()])].flatMap((id) => {
    const previous = old.get(id), proposed = next.get(id)
    const moved = Boolean(previous && proposed && (previous.sectionId !== proposed.sectionId || order(before, previous.sectionId, id) !== order(after, proposed.sectionId, id)))
    const changed = JSON.stringify(previous?.block) !== JSON.stringify(proposed?.block)
    return changed || moved ? [{ id, previous, proposed, moved, changed }] : []
  })
}

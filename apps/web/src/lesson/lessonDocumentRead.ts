import type { LessonDocument, LessonDocumentSection } from './lessonDocumentTypes'

const visualKinds = new Set(['visual_scene', 'data_plot', 'source_figure', 'illustration', 'network_delay', 'diagram', 'animation', 'table', 'equation'])

export function readLessonBlocks(document: LessonDocument, section: LessonDocumentSection | null | undefined, filter: unknown = 'all', cursor = 0, blockId?: unknown) {
  if (!['all', 'unreviewed', 'visuals'].includes(String(filter))) throw new Error('Unknown content_filter.')
  const reviewed = new Set(document.coverage_review?.flatMap(entry => entry.block_ids) ?? [])
  const blocks = section?.blocks.filter(block => (!blockId || block.block_id === blockId)
    && (filter !== 'unreviewed' || !reviewed.has(block.block_id))
    && (filter !== 'visuals' || visualKinds.has(block.content.kind))) ?? []
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > blocks.length) throw new Error('Invalid content cursor.')
  const page = []
  let characters = 0
  for (const block of blocks.slice(cursor)) {
    const size = JSON.stringify(block).length
    if (page.length && characters + size > 24_000) break
    page.push(block)
    characters += size
  }
  return { blocks: page, next_cursor: cursor + page.length < blocks.length ? cursor + page.length : null }
}

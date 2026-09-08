import type { SourceSection } from '../types'

export interface ContentsNode {
  section: SourceSection
  number: string
  title: string
  children: ContentsNode[]
}

export function sectionAtPosition(sections: SourceSection[], page: number, ratio: number): SourceSection | undefined {
  return sections.filter(section => section.page_start <= page && section.page_end >= page
    && (section.page_start < page || (section.page_y ?? 0) <= ratio + .005))
    .sort((a, b) => b.page_start - a.page_start || (b.page_y ?? 0) - (a.page_y ?? 0) || b.level - a.level)[0]
}

/** Retain authored parents; recover missing parents from the ordered heading levels. */
export function buildContentsTree(sections: SourceSection[]): ContentsNode[] {
  const roots: ContentsNode[] = []
  const byId = new Map<string, ContentsNode>()
  const ancestors: ContentsNode[] = []
  for (const section of sections) {
    while (ancestors.length && ancestors.at(-1)!.section.level >= section.level) ancestors.pop()
    const parent = (section.parent_id ? byId.get(section.parent_id) : undefined) ?? ancestors.at(-1)
    const siblings = parent ? parent.children : roots
    const printed = /^(?:(?:chapter|section|part)\s+)?(\d+(?:\.\d+)*|[A-Z](?:\.\d+)+)[.):]?\s+(.+)$/i.exec(section.title)
    const number = printed?.[1] ?? ''
    const node: ContentsNode = { section, number, title: printed?.[2] ?? section.title, children: [] }
    siblings.push(node)
    byId.set(section.id, node)
    ancestors.push(node)
  }
  return roots
}

/** Search includes the ancestry needed to understand each match. */
export function filterContentsTree(nodes: ContentsNode[], query: string): ContentsNode[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return nodes
  return nodes.flatMap(node => {
    if (`${node.number} ${node.title}`.toLocaleLowerCase().includes(normalized)) return [node]
    const children = filterContentsTree(node.children, normalized)
    return children.length ? [{ ...node, children }] : []
  })
}

/** Supplement bookmarks only with numbered headings inside a matching authored branch. */
export function completeContents(authored: SourceSection[], detected: SourceSection[]): SourceSection[] {
  if (!authored.length) return detected
  const plain = (title: string) => title.replace(/^(?:(?:chapter|section)\s+)?\d+(?:\.\d+)*[.):]?\s+/i, '').toLocaleLowerCase().trim()
  const number = (title: string) => /^(?:(?:chapter|section)\s+)?(\d+(?:\.\d+)*)[.):]?\s+/i.exec(title)?.[1]
  const sameHeading = (a: SourceSection, b: SourceSection) => {
    if (a.page_start !== b.page_start) return false
    const left = plain(a.title), right = plain(b.title)
    return left === right || (Math.min(left.length, right.length) >= 20 && (left.startsWith(right) || right.startsWith(left)))
  }
  const result = authored.map(section => {
    const matches = detected.filter(item => sameHeading(item, section))
    const match = matches.length === 1 ? matches[0] : undefined
    return match && number(match.title) && !number(section.title)
      ? { ...section, title: `${number(match.title)} ${section.title}` } : section
  })
  for (const section of detected) {
    const sectionNumber = number(section.title)
    if (!sectionNumber?.includes('.') || section.confidence < .75 || result.some(item => sameHeading(item, section))) continue
    const parentNumber = sectionNumber.slice(0, sectionNumber.lastIndexOf('.'))
    const parent = result.find(item => number(item.title) === parentNumber && item.page_start <= section.page_start && item.page_end >= section.page_start)
    if (!parent) continue
    // Numbers can restart in another part; suppress repeats within this branch.
    if (result.some(item => number(item.title) === sectionNumber
      && (item.parent_id === parent.id || (item.page_start >= parent.page_start && item.page_start <= parent.page_end)))) continue
    result.push({ ...section, level: parent.level + 1, parent_id: parent.id })
  }
  // Preserve native same-page reading order; newly found children join their branch.
  const tree = buildContentsTree(result)
  const flatten = (nodes: ContentsNode[]): SourceSection[] => [...nodes]
    .sort((a, b) => a.section.page_start - b.section.page_start)
    .flatMap(node => [node.section, ...flatten(node.children)])
  return flatten(tree)
}

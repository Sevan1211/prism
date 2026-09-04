import type { SourceSection } from '../types'

export interface ContentsNode {
  section: SourceSection
  number: string
  title: string
  children: ContentsNode[]
}

/** Retain authored parents; recover missing parents from the ordered heading levels. */
export function buildContentsTree(sections: SourceSection[]): ContentsNode[] {
  const roots: ContentsNode[] = []
  const byId = new Map<string, ContentsNode>()
  const ancestors: ContentsNode[] = []
  const hasNumberedRoots = sections.some(section => section.level === 1 && /^(?:(?:chapter|section|part)\s+)?\d+[.):]?\s+/i.test(section.title))
  for (const section of sections) {
    while (ancestors.length && ancestors.at(-1)!.section.level >= section.level) ancestors.pop()
    const parent = (section.parent_id ? byId.get(section.parent_id) : undefined) ?? ancestors.at(-1)
    const siblings = parent ? parent.children : roots
    const printed = /^(?:(?:chapter|section|part)\s+)?(\d+(?:\.\d+)*|[A-Z](?:\.\d+)+)[.):]?\s+(.+)$/i.exec(section.title)
    const number = printed?.[1] ?? (!parent && hasNumberedRoots ? '' : `${parent?.number ? `${parent.number}.` : ''}${siblings.length + 1}`)
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
    if (!sectionNumber?.includes('.') || result.some(item => sameHeading(item, section))) continue
    const parentNumber = sectionNumber.slice(0, sectionNumber.lastIndexOf('.'))
    const parent = result.find(item => number(item.title) === parentNumber && item.page_start <= section.page_start && item.page_end >= section.page_start)
    if (!parent) continue
    result.push({ ...section, level: parent.level + 1, parent_id: parent.id })
  }
  return result.sort((a, b) => a.page_start - b.page_start || a.level - b.level)
}

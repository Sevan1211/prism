import { useMemo, useState } from 'react'
import { CaretRight } from '@phosphor-icons/react'
import type { SourceSection } from '../types'
import { buildContentsTree, filterContentsTree, type ContentsNode } from './contentsTree'

export function ReaderContents({ sections, query, activeId, onNavigate, pageLabels }: {
  sections: SourceSection[]; query: string; activeId?: string
  onNavigate: (page: number) => void; pageLabels: string[] | null
}) {
  const tree = useMemo(() => buildContentsTree(sections), [sections])
  const visible = useMemo(() => filterContentsTree(tree, query), [tree, query])
  // Explicit user toggles win; otherwise the current reading path opens automatically.
  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const hasActive = (node: ContentsNode): boolean => node.section.id === activeId || node.children.some(hasActive)
  const render = (nodes: ContentsNode[]) => <ol className="contents-branch">{nodes.map(node => {
    const id = node.section.id
    const open = Boolean(query.trim()) || (toggles[id] ?? (node.section.level === 1 || hasActive(node)))
    return <li key={id}>
      <div className={`contents-row${id === activeId ? ' is-active' : ''}`}>
        {node.children.length ? <button type="button" className="contents-toggle"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${node.title}`} aria-expanded={open}
          aria-controls={`contents-${id}`} onClick={() => setToggles(value => ({ ...value, [id]: !open }))}>
          <CaretRight aria-hidden="true" />
        </button> : <span className="contents-leaf" />}
        <button type="button" className="contents-destination" aria-label={`${node.section.title}, page ${node.section.page_start}`} aria-current={id === activeId ? 'location' : undefined}
          onClick={() => onNavigate(node.section.page_start)} title={`${node.number} ${node.title} · PDF page ${node.section.page_start}`}>
          <span className="contents-number">{node.number}</span><span className="contents-title">{node.title}</span>
          <span className="rail-page">{pageLabels?.[node.section.page_start - 1] ?? node.section.page_start}</span>
        </button>
      </div>
      {node.children.length && open ? <div id={`contents-${id}`}>{render(node.children)}</div> : null}
    </li>
  })}</ol>
  const allIds = (nodes: ContentsNode[]): string[] => nodes.flatMap(node => [node.section.id, ...allIds(node.children)])
  return <>
    <div className="contents-actions">
      <button type="button" onClick={() => setToggles(Object.fromEntries(allIds(tree).map(id => [id, true])))}>Expand all</button>
      <button type="button" onClick={() => setToggles(Object.fromEntries(allIds(tree).map(id => [id, false])))}>Collapse all</button>
    </div>
    <div className="reader-rail-list">{visible.length ? render(visible) : <p className="contents-empty">No matching sections.</p>}</div>
    <p className="contents-note">Numbers follow the source where available; otherwise they show outline order.</p>
  </>
}

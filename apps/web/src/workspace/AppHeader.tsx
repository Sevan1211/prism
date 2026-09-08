import { useEffect, useRef, useState } from 'react'
import { Plus, SlidersHorizontal } from '@phosphor-icons/react'
import { LibraryStorage } from '../LibraryStorage'
import { PrismHelp } from '../PrismHelp'
import { PrismWordmark } from '../PrismWordmark'
import { PrismLink } from '../PrismLink'
import { libraryPath } from '../navigation'
import { ThemeToggle } from '../ThemeToggle'
import { WebMcpStatus } from '../webmcp/WebMcpStatus'
import './appHeader.css'

export function AppHeader({ libraryActive = false, count, onImport }: {
  libraryActive?: boolean
  count?: number
  onImport?: () => void
}) {
  const [toolsOpen, setToolsOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const Heading = libraryActive ? 'h1' : 'div'

  useEffect(() => {
    if (!toolsOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolsRef.current?.contains(event.target)) setToolsOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [toolsOpen])

  return (
    <header className="app-header">
      <div className="app-identity">
        <PrismLink className="app-brand" href={libraryPath()} aria-label="PRISM library">
          <span className="brand-wordmark"><PrismWordmark /></span>
        </PrismLink>
        <Heading className="app-location">
          <PrismLink href={libraryPath()} aria-current={libraryActive ? 'page' : undefined}>Library</PrismLink>
          {count !== undefined ? <span className="library-count" aria-hidden="true">{count}</span> : null}
        </Heading>
      </div>
      <div className="app-header-actions">
        <div className="workspace-tools" ref={toolsRef} data-expanded={toolsOpen}
          onKeyDown={event => {
            // Let an open dialog handle Escape and return focus to its own trigger.
            if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('dialog'))) return
            if (event.key === 'Escape') { setToolsOpen(false); toggleRef.current?.focus() }
          }}
          onBlur={event => {
            if (event.currentTarget.querySelector('dialog[open]')) return
            if (!event.currentTarget.contains(event.relatedTarget)) setToolsOpen(false)
          }}>
          <button ref={toggleRef} className="workspace-tools-toggle" type="button" aria-label="Workspace controls"
            aria-expanded={toolsOpen} aria-controls="workspace-controls" onClick={() => setToolsOpen(open => !open)}>
            <SlidersHorizontal aria-hidden="true" />
          </button>
          <div className="app-header-status" id="workspace-controls" aria-label="Workspace controls">
            <WebMcpStatus />
            <PrismHelp />
            <LibraryStorage />
            <ThemeToggle />
          </div>
        </div>
        {onImport ? <button className="button-primary header-import" type="button" onClick={onImport}><Plus weight="bold" aria-hidden="true" /><span>Add PDF</span></button> : null}
      </div>
    </header>
  )
}

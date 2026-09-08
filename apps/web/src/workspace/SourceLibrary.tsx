import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, BookBookmark, Books, FolderSimple, FolderPlus, MagnifyingGlass, PencilSimple, Plus, Stack, Trash, Tray } from '@phosphor-icons/react'
import { PrismLink } from '../PrismLink'
import { libraryPath, navigatePrism, sourcePath } from '../navigation'
import type { LibrarySource } from '../storage/browserSources'
import { deleteSourceFolder, loadSourceFolders, moveSourceToFolder, saveSourceFolder, type FolderLibrary } from '../storage/sourceFolders'
import { subscribeSourcesChanged } from '../storage/sourceLibraryEvents'
import { cleanTitle, sourceStatus, statusTone } from './sourcePresentation'
import { AppHeader } from './AppHeader'
import { ConfirmationDialog } from './ConfirmationDialog'
import { useSyncStatus } from '../storage/useSyncStatus'
import './sourceLibrary.css'

export function SourceLibrary({ sources, sourcesReady, onImport, children, selectedSource }: {
  children?: ReactNode
  selectedSource?: LibrarySource | null
  sources: LibrarySource[]
  sourcesReady: boolean
  onImport: (folderId: string | null) => void
}) {
  const [library, setLibrary] = useState<FolderLibrary>({ folders: [], memberships: [] })
  const [foldersReady, setFoldersReady] = useState(false)
  const [selected, setSelected] = useState('all')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const synced = useSyncStatus()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const refreshRef = useRef<() => Promise<void>>(async () => {})
  const createRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let active = true, sequence = 0
    async function refresh() {
      const request = ++sequence
      try {
        const next = await loadSourceFolders()
        if (active && request === sequence) { setLibrary(next); setFoldersReady(true) }
      } catch (cause) {
        if (active && request === sequence) setError(cause instanceof Error ? cause.message : 'Folders could not be loaded.')
      }
    }
    refreshRef.current = refresh
    void refresh()
    const unsubscribe = subscribeSourcesChanged(() => { void refresh() })
    return () => { active = false; unsubscribe() }
  }, [])

  const folderIds = new Set(library.folders.map(folder => folder.id))
  const assignments = new Map(library.memberships.filter(item => folderIds.has(item.folder_id)).map(item => [item.source_id, item.folder_id]))
  const activeFolder = selectedSource ? assignments.get(selectedSource.id) ?? 'unfiled' : selected
  const folder = library.folders.find(item => item.id === activeFolder)
  const selection = activeFolder === 'unfiled' ? 'unfiled' : folder?.id ?? 'all'
  const countIn = (id: string) => sources.filter(source => (assignments.get(source.id) ?? 'unfiled') === id).length
  const title = folder?.name ?? (selection === 'unfiled' ? 'Unfiled' : 'All sources')
  const filtered = sources.filter(source => (selection === 'all' || (assignments.get(source.id) ?? 'unfiled') === selection)
    && cleanTitle(source.original_name).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => sort === 'title' ? cleanTitle(a.original_name).localeCompare(cleanTitle(b.original_name)) : b.created_at.localeCompare(a.created_at))

  function chooseFolder(id: string) { setSelected(id); setQuery(''); setEditing(null); setNotice(''); if (children) navigatePrism(libraryPath()) }
  function editFolder(id: string) { setName(id === 'new' ? '' : folder?.name ?? ''); setEditing(id); setError('') }
  async function perform(work: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
    try { await work(); await refreshRef.current() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your library could not be updated.') }
    finally { setBusy(false) }
  }

  return (
    <div className="source-library">
      {pendingDelete ? <ConfirmationDialog
        title="Remove this folder?" itemName={pendingDelete.name} kind="folder" confirmLabel="Remove folder"
        onConfirm={async () => { await deleteSourceFolder(pendingDelete.id); await refreshRef.current(); chooseFolder('unfiled'); setNotice('Folder removed. Your sources are still in Library.') }}
        onClose={() => setPendingDelete(null)} focusAfterSuccess={() => headingRef.current}>
        <p>{countIn(pendingDelete.id) ? `${countIn(pendingDelete.id)} ${countIn(pendingDelete.id) === 1 ? 'source moves' : 'sources move'} to Unfiled.` : 'This folder is empty.'} Your PDFs, lessons, and reading history are kept.</p>
        {synced.connected ? <p className="confirmation-note">The folder removal also syncs to your connected browsers.</p> : null}
      </ConfirmationDialog> : null}
      <AppHeader libraryActive={!children} count={sources.length} onImport={() => onImport(folder?.id ?? null)} />
      <div className="library-layout">
        <aside className="folder-sidebar" aria-label="Library folders">
          <nav aria-label="Browse library"><button type="button" aria-current={selection === 'all' ? 'page' : undefined} onClick={() => chooseFolder('all')}><Stack aria-hidden="true" /><span>All sources</span><small>{sources.length}</small></button><button type="button" aria-current={selection === 'unfiled' ? 'page' : undefined} onClick={() => chooseFolder('unfiled')}><Tray aria-hidden="true" /><span>Unfiled</span><small>{countIn('unfiled')}</small></button></nav>
          <div className="folder-section-heading"><span>Folders</span><button ref={createRef} type="button" disabled={!foldersReady || busy} onClick={() => editFolder('new')} aria-label="New folder"><FolderPlus aria-hidden="true" /><span>New</span></button></div>
          <nav className="folder-list" aria-label="Your folders">{library.folders.map(item => <button key={item.id} type="button" aria-current={selection === item.id ? 'page' : undefined} onClick={() => chooseFolder(item.id)}><FolderSimple weight={selection === item.id ? 'fill' : 'regular'} aria-hidden="true" /><span>{item.name}</span><small>{countIn(item.id)}</small></button>)}</nav>
          {editing !== null ? <form className="folder-editor" onSubmit={event => { event.preventDefault(); void perform(async () => { const saved = await saveSourceFolder(name, editing === 'new' ? undefined : editing); chooseFolder(saved.id); setNotice(`Folder “${saved.name}” saved.`); requestAnimationFrame(() => headingRef.current?.focus()) }) }}><label htmlFor="folder-name">{editing === 'new' ? 'New folder name' : 'Rename folder'}</label><input id="folder-name" autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="e.g. Physics" disabled={busy} onKeyDown={event => { if (event.key === 'Escape') { setEditing(null); createRef.current?.focus() } }} /><div><button className="button-primary" disabled={busy || !name.trim()} type="submit">{busy ? 'Saving…' : 'Save'}</button><button className="button-secondary" disabled={busy} type="button" onClick={() => { setEditing(null); createRef.current?.focus() }}>Cancel</button></div></form> : null}
          {foldersReady && library.folders.length === 0 && editing === null ? <p className="folder-hint">Give a subject its own space.<button type="button" onClick={() => editFolder('new')}>Create your first folder</button></p> : null}
          {!foldersReady ? <p className="folder-hint">{error ? 'Folders are unavailable.' : 'Loading folders…'}{error ? <button type="button" onClick={() => { setError(''); void refreshRef.current() }}>Try again</button> : null}</p> : null}
        </aside>
        <main className="library-content" id="workspace-main" tabIndex={-1}>
          {error ? <p className="folder-error" role="alert">{error}</p> : null}
          <p className="folder-notice" role="status">{notice}</p>
          {children ?? <>
          <div className="library-section-heading"><div><h2 ref={headingRef} tabIndex={-1}>{title}</h2><span>{filtered.length} {filtered.length === 1 ? 'source' : 'sources'}</span></div>{folder ? <div className="folder-actions"><button type="button" disabled={busy} onClick={() => editFolder(folder.id)} title="Rename folder" aria-label={`Rename ${folder.name}`}><PencilSimple aria-hidden="true" /></button><button type="button" disabled={busy} onClick={() => setPendingDelete({ id: folder.id, name: folder.name })} title="Remove folder" aria-label={`Remove folder ${folder.name}; keep its sources`}><Trash aria-hidden="true" /></button></div> : null}</div>
          <div className="source-library-toolbar"><label className="library-search"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Search your library</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={folder ? 'Search this folder…' : 'Search your sources…'} /></label><label className="library-sort"><span className="sr-only">Sort sources</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently added</option><option value="title">Title A–Z</option></select></label></div>
          {!sourcesReady ? <p className="library-loading">Loading your local library…</p> : null}
          {sourcesReady && filtered.length > 0 ? <div className="library-entries" role="list" aria-label={title}><div className="library-entry-labels" aria-hidden="true"><span>Title</span><span>Status</span><span>Folder</span></div>{filtered.map(source => <div className="library-entry" key={source.id} role="listitem"><PrismLink href={sourcePath(source.id)} className="library-entry-link"><span className="library-book" aria-hidden="true"><BookBookmark weight="duotone" /></span><span className="library-entry-title"><strong title={cleanTitle(source.original_name)}>{cleanTitle(source.original_name)}</strong><small>{source.page_count?.toLocaleString() ?? 'Unknown'} {source.page_count === 1 ? 'page' : 'pages'} <span>·</span> PDF {source.storage_location === 'local_companion' ? '· Local companion' : ''}</small></span><ArrowRight className="library-open-arrow" aria-hidden="true" /></PrismLink><span className="source-readiness" data-tone={statusTone(source)}>{sourceStatus(source)}</span><label className="source-folder-select"><span className="sr-only">Folder for {cleanTitle(source.original_name)}</span><select value={assignments.get(source.id) ?? ''} disabled={busy || !foldersReady} onChange={event => { const next = event.target.value; void perform(async () => { await moveSourceToFolder(source.id, next || null); setNotice(`Moved “${cleanTitle(source.original_name)}” to ${library.folders.find(item => item.id === next)?.name ?? 'Unfiled'}.`) }) }}><option value="">Unfiled</option>{library.folders.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>)}</div> : null}
          {sourcesReady && filtered.length === 0 ? <div className="library-blank"><Books weight="duotone" aria-hidden="true" /><h3>{query ? 'No matching sources' : folder ? 'Make room for a new subject.' : selection === 'unfiled' && sources.length ? 'Everything has a place.' : 'Your next idea starts here.'}</h3><p>{query ? 'Try a different title, or clear your search.' : folder ? 'Add a PDF here, or move a source into this folder from All sources.' : selection === 'unfiled' && sources.length ? 'All your sources are organized into folders.' : 'Bring a paper, a chapter, or a textbook. Your original and its lessons will live together here.'}</p>{query ? <button className="button-secondary" type="button" onClick={() => setQuery('')}>Clear search</button> : <button className="button-secondary" type="button" onClick={() => onImport(folder?.id ?? null)}><Plus aria-hidden="true" />Choose your PDF</button>}</div> : null}
          <div className="library-bottom-note"><BookBookmark aria-hidden="true" /><span>Read the original. Build a lesson. Keep them together.</span></div>
          </>}
        </main>
      </div>
    </div>
  )
}

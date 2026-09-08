import { loadLibrarySources } from '../library/sourceLibrary'
import { loadSourceFolders } from '../storage/sourceFolders'
import { syncStatus } from '../storage/syncedLibrary'
import { agentContentAllowed } from './context'
import { paginateToolItems } from './toolPagination'

export async function listSourcesForAgent(args: Record<string, unknown>) {
  if (args.query !== undefined && (typeof args.query !== 'string' || args.query.length > 200)) throw new Error('query must be text of at most 200 characters.')
  if (args.folder_id !== undefined && args.folder_id !== null && (typeof args.folder_id !== 'string' || !args.folder_id)) throw new Error('Use a folder ID or null for unfiled sources.')
  const current = await loadLibrarySources()
  const folders = current.some(source => source.storage_location === 'browser_vault') ? await loadSourceFolders() : { folders: [], memberships: [] }
  if (typeof args.folder_id === 'string' && !folders.folders.some(folder => folder.id === args.folder_id)) throw new Error('Folder not found. Discover folder IDs in source results.')
  const memberships = new Map(folders.memberships.map(item => [item.source_id, item.folder_id]))
  const names = new Map(folders.folders.map(folder => [folder.id, folder.name]))
  const query = typeof args.query === 'string' ? args.query.trim().toLocaleLowerCase() : ''
  const state = syncStatus()
  const sources = current.filter(source => (!query || source.original_name.toLocaleLowerCase().includes(query))
    && (args.folder_id === undefined || (memberships.get(source.id) ?? null) === args.folder_id))
    .sort((a, b) => a.id.localeCompare(b.id)).map(source => ({
      source_id: source.id, name: source.original_name, pages: source.page_count,
      agent_content_allowed: agentContentAllowed(source), rights_status: source.rights_status,
      search_ready: source.storage_location === 'local_companion' || source.browser_index?.state === 'ready',
      status: source.status, storage_location: source.storage_location,
      folder_id: memberships.get(source.id) ?? null, folder_name: names.get(memberships.get(source.id) ?? '') ?? null,
    }))
  const { items, ...page } = paginateToolItems(sources, 'list_sources', args)
  return { sources: items, ...page, library_storage: state.connected ? 'encrypted_cloud_with_device_cache' : 'local', sync_state: state.state }
}

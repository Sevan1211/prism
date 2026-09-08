import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadLibrarySources } from '../library/sourceLibrary'
import { loadSourceFolders } from '../storage/sourceFolders'
import { listSourcesForAgent } from './libraryDiscovery'

vi.mock('../library/sourceLibrary', () => ({ loadLibrarySources: vi.fn() }))
vi.mock('../storage/sourceFolders', () => ({ loadSourceFolders: vi.fn() }))
vi.mock('../storage/syncedLibrary', () => ({ syncStatus: () => ({ connected: false, state: 'local' }) }))

beforeEach(() => {
  vi.mocked(loadLibrarySources).mockResolvedValue(Array.from({ length: 125 }, (_, id) => ({ id: `source-${String(id).padStart(3, '0')}`, original_name: `Book ${id}`, rights_status: 'private_authorized', storage_location: 'browser_vault', status: 'structure_ready', page_count: 8, cloud_policy: 'local_only', content_hash: 'hash', created_at: 'today', size_bytes: 100 })) as Awaited<ReturnType<typeof loadLibrarySources>>)
  vi.mocked(loadSourceFolders).mockResolvedValue({ folders: [{ id: 'folder', name: 'Optics', created_at: 'today' }], memberships: [{ source_id: 'source-002', folder_id: 'folder' }] })
})

describe('agent library discovery', () => {
  it('paginates every source with no private text and no permission changes', async () => {
    let args: Record<string, unknown> = {}
    const ids: string[] = []
    for (;;) {
      const result = await listSourcesForAgent(args)
      expect(JSON.stringify(result).length).toBeLessThan(16_000)
      expect(result.sources.every(source => !source.agent_content_allowed)).toBe(true)
      ids.push(...result.sources.map(source => source.source_id))
      if (!result.next_call) break
      args = result.next_call.arguments
    }
    expect(new Set(ids).size).toBe(125)
  })
  it('filters by folder and name, supports unfiled and discloses empty results', async () => {
    expect(await listSourcesForAgent({ folder_id: 'folder' })).toMatchObject({ total: 1, sources: [{ source_id: 'source-002', folder_name: 'Optics' }], next_call: null })
    expect(await listSourcesForAgent({ folder_id: null })).toMatchObject({ total: 124 })
    expect(await listSourcesForAgent({ query: 'book 124' })).toMatchObject({ total: 1 })
    expect(await listSourcesForAgent({ query: 'missing' })).toMatchObject({ total: 0, sources: [], next_call: null })
    await expect(listSourcesForAgent({ folder_id: 'missing' })).rejects.toThrow('Folder')
    await expect(listSourcesForAgent({ query: 12 })).rejects.toThrow('query')
  })
})

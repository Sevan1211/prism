import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import {
  accessBrowserVault,
  PRISM_VAULT_SOURCE_PAGE_STORE,
  PRISM_VAULT_SOURCE_STORE,
  type BrowserVaultEnvironment,
  type DirectoryHandleLike,
  type FileHandleLike,
  type WritableFileLike,
} from './browserVault'
import {
  deleteBrowserSource,
  getBrowserReadingState,
  getBrowserScopeManifest,
  getBrowserSourceMap,
  getBrowserSourceStructure,
  importBrowserSource,
  indexBrowserSource,
  listBrowserSources,
  readBrowserSourceBundle,
  searchBrowserSource,
  setBrowserAgentContentAccess,
  updateBrowserReadingState,
} from './browserSources'
import type { IndexedSourcePage } from './sourceIndexTypes'
import { buildIndexedSourcePage } from './sourceIntelligence'
import { listAgentActivity, recordWebMcpActivity } from './agentActivity'
import { textResult } from '../webmcp/context'

class MemoryFile implements FileHandleLike {
  blob: Blob | null = null

  constructor(readonly name: string) {}

  async createWritable(): Promise<WritableFileLike> {
    return {
      close: async () => undefined,
      write: async (data) => {
        this.blob = data
      },
    }
  }

  async getFile(): Promise<File> {
    if (!this.blob) throw new DOMException('Missing file', 'NotFoundError')
    return new File([this.blob], this.name, { type: this.blob.type })
  }
}

class MemoryDirectory implements DirectoryHandleLike {
  readonly directories = new Map<string, MemoryDirectory>()
  readonly files = new Map<string, MemoryFile>()

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MemoryDirectory> {
    const existing = this.directories.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException('Missing directory', 'NotFoundError')
    const created = new MemoryDirectory()
    this.directories.set(name, created)
    return created
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MemoryFile> {
    const existing = this.files.get(name)
    if (existing) return existing
    if (!options?.create) throw new DOMException('Missing file', 'NotFoundError')
    const created = new MemoryFile(name)
    this.files.set(name, created)
    return created
  }

  async removeEntry(name: string): Promise<void> {
    if (this.files.delete(name) || this.directories.delete(name)) return
    throw new DOMException('Missing entry', 'NotFoundError')
  }
}

function testEnvironment(options?: { quota?: number; usage?: number }) {
  const root = new MemoryDirectory()
  const environment: BrowserVaultEnvironment = {
    indexedDB: new IDBFactory(),
    keyRange: IDBKeyRange,
    now: () => '2026-08-29T12:00:00.000Z',
    storage: {
      estimate: vi.fn().mockResolvedValue({
        quota: options?.quota ?? 1024 * 1024 * 1024,
        usage: options?.usage ?? 0,
      }),
      getDirectory: vi.fn().mockResolvedValue(root),
      persisted: vi.fn().mockResolvedValue(true),
    },
  }
  return { environment, root }
}

const importDependencies = {
  digest: vi.fn().mockResolvedValue('a'.repeat(64)),
  inspectPdf: vi.fn().mockResolvedValue(42),
}

describe('browser-local sources', () => {
  it('copies a PDF into OPFS, records it in IndexedDB, and reopens the library without fetch', async () => {
    const { environment, root } = testEnvironment()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const file = new File(['%PDF-1.7\nfixture'], 'networks.pdf', { type: 'application/pdf' })

    try {
      const imported = await importBrowserSource(file, 'private_authorized', {
        ...importDependencies,
        environment,
      })
      const reopened = await listBrowserSources(environment)

      expect(imported).toMatchObject({
        original_name: 'networks.pdf',
        page_count: 42,
        rights_status: 'private_authorized',
        storage_location: 'browser_vault',
      })
      expect(reopened).toEqual([{ ...imported, agent_content_granted: false, agent_visual_granted: false }])
      expect(fetchSpy).not.toHaveBeenCalled()
      const vault = root.directories.get('prism-browser-vault')
      expect(vault?.directories.get('sources')?.files.size).toBe(1)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('deduplicates immutable source bytes by full SHA-256 fingerprint', async () => {
    const { environment, root } = testEnvironment()
    const file = new File(['%PDF-one'], 'first.pdf', { type: 'application/pdf' })

    const first = await importBrowserSource(file, 'open_license', {
      ...importDependencies,
      environment,
    })
    const duplicate = await importBrowserSource(
      new File(['%PDF-one'], 'renamed.pdf', { type: 'application/pdf' }),
      'open_license',
      { ...importDependencies, environment },
    )

    expect(duplicate).toEqual(first)
    expect(root.directories.get('prism-browser-vault')?.directories.get('sources')?.files.size).toBe(1)
  })

  it('keeps private agent access explicit, fingerprint-bound, and revocable', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-private'], 'private.pdf', { type: 'application/pdf' }),
      'private_authorized',
      { ...importDependencies, environment },
    )

    expect((await listBrowserSources(environment))[0]?.agent_content_granted).toBe(false)
    await setBrowserAgentContentAccess(source.id, true, environment)
    expect((await listBrowserSources(environment))[0]?.agent_content_granted).toBe(true)
    await setBrowserAgentContentAccess(source.id, false, environment)
    expect((await listBrowserSources(environment))[0]?.agent_content_granted).toBe(false)
  })

  it('persists exposure-only Reader position and cascades it when the source is removed', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-state'], 'state.pdf', { type: 'application/pdf' }),
      'unknown',
      { ...importDependencies, environment },
    )

    await updateBrowserReadingState(source.id, 8, 0.4, environment)
    await updateBrowserReadingState(source.id, 3, 0.1, environment)
    await recordWebMcpActivity(
      'get_source_map',
      { source_id: source.id },
      textResult({ source_id: source.id }),
      undefined,
      environment,
    )
    expect(await getBrowserReadingState(source.id, environment)).toMatchObject({
      furthest_page: 8,
      last_page: 3,
      last_scroll_ratio: 0.1,
    })

    await deleteBrowserSource(source.id, environment)
    expect(await listBrowserSources(environment)).toEqual([])
    expect(await getBrowserReadingState(source.id, environment)).toMatchObject({
      furthest_page: 1,
      last_page: 1,
    })
    expect(await listAgentActivity(source.id, 12, environment)).toEqual([])
  })

  it('indexes exact local text and returns a source-region highlight without fetch', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-index'], 'index.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('b'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(2),
      },
    )
    const extractor = vi.fn(async (_file, sourceId, startPage, options) => {
      expect(startPage).toBe(1)
      await options.onBatch([
        indexedPage(sourceId, 1, [
          fragment('TCP slow', [0.1, 0.2, 0.3, 0.24]),
          fragment('start increases the congestion window.', [0.31, 0.2, 0.8, 0.24]),
        ]),
        indexedPage(sourceId, 2, [fragment('Acknowledgements return to the sender.', [0.1, 0.3, 0.7, 0.34])]),
      ])
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    try {
      const status = await indexBrowserSource(source.id, { environment, extractor })
      const result = await searchBrowserSource(source.id, 'SLOW START', 20, environment)

      expect(status).toMatchObject({ pages_indexed: 2, state: 'ready', total_pages: 2 })
      expect(result.hits).toHaveLength(1)
      expect(result.hits[0]).toMatchObject({
        bbox_normalized: [0.1, 0.2, 0.8, 0.24],
        page_number: 1,
        snippet: 'tcp [slow start] increases the congestion window.',
        status: 'transform_with_warning',
      })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('recovers chapter and subsection navigation from the local evidence index', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-structure'], 'systems.pdf', { type: 'application/pdf' }),
      'private_authorized',
      {
        digest: vi.fn().mockResolvedValue('f'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(3),
      },
    )
    await indexBrowserSource(source.id, {
      environment,
      extractor: async (_file, sourceId, _startPage, options) => {
        await options.onBatch([
          indexedPage(sourceId, 1, [fragment('CHAPTER 1 FOUNDATIONS', [0.1, 0.08, 0.7, 0.12])]),
          indexedPage(sourceId, 2, [fragment('1.1 ARCHITECTURE', [0.1, 0.08, 0.6, 0.12])]),
          indexedPage(sourceId, 3, [fragment('CHAPTER 2 DIRECT LINKS', [0.1, 0.08, 0.7, 0.12])]),
        ])
      },
    })

    const structure = await getBrowserSourceStructure(source.id, environment)

    expect(structure.origin).toBe('computed')
    expect(structure.sections.map((section) => section.title)).toEqual([
      'CHAPTER 1 FOUNDATIONS',
      '1.1 ARCHITECTURE',
      'CHAPTER 2 DIRECT LINKS',
    ])
    expect(structure.sections[1].parent_id).toBe(structure.sections[0].id)
    expect(structure.sections[0].page_end).toBe(2)
  })

  it('pages a complete scope inventory and returns only requested bounded evidence', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-manifest'], 'manifest.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('e'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(1),
      },
    )
    await indexBrowserSource(source.id, {
      environment,
      extractor: async (_file, sourceId, _startPage, options) => {
        await options.onBatch([indexedPage(sourceId, 1, [
          fragment('CHAPTER 1', [0.1, 0.08, 0.4, 0.12]),
          fragment('Packets carry data through layered systems.', [0.1, 0.2, 0.8, 0.22]),
          fragment('Figure 1.1 A packet path', [0.1, 0.4, 0.62, 0.42]),
        ])])
      },
    })

    const map = await getBrowserSourceMap(source.id, environment)
    const first = await getBrowserScopeManifest(source.id, 1, 1, '0', 1, environment)
    const second = await getBrowserScopeManifest(
      source.id,
      1,
      1,
      first.next_cursor ?? '0',
      10,
      environment,
    )
    const selectedId = second.items[0].anchor.element_id
    expect(selectedId).not.toBeNull()
    const bundle = await readBrowserSourceBundle(
      source.id,
      [selectedId ?? 'missing'],
      0,
      environment,
    )

    expect(map).toMatchObject({
      capabilities: { lesson_compilation: false, scope_manifest: true },
      parser_version: 'pdfjs-evidence-v7',
    })
    expect(first).toMatchObject({ complete_for_range: false, cursor: '0', next_cursor: '1' })
    expect(second.complete_for_range).toBe(true)
    expect(first.inventory.element_counts).toMatchObject({
      caption_candidate: 1,
      heading_candidate: 1,
      paragraph_candidate: 1,
    })
    expect(first.omissions).toContain('visual_objects_not_indexed')
    expect(bundle).toMatchObject({ bundle_complete: true, omitted_element_ids: [] })
    expect(bundle.elements[0].text).toContain('Packets carry data')
    expect(bundle.elements[0].anchor.source_hash).toBe('e'.repeat(64))
  })

  it('resumes after an interrupted page batch without discarding verified pages', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-resume'], 'resume.pdf', { type: 'application/pdf' }),
      'private_authorized',
      {
        digest: vi.fn().mockResolvedValue('c'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(3),
      },
    )
    const interrupted = vi.fn(async (_file, sourceId, startPage, options) => {
      expect(startPage).toBe(1)
      await options.onBatch([indexedPage(sourceId, 1, [fragment('persisted first page', [0.1, 0.1, 0.7, 0.14])])])
      throw new Error('worker interrupted')
    })

    await expect(indexBrowserSource(source.id, { environment, extractor: interrupted }))
      .rejects.toThrow('worker interrupted')
    await expect(searchBrowserSource(source.id, 'persisted', 20, environment))
      .rejects.toThrow('Local search is not ready')
    expect((await listBrowserSources(environment))[0].browser_index).toMatchObject({
      pages_indexed: 1,
      state: 'failed',
    })

    const resumed = vi.fn(async (_file, sourceId, startPage, options) => {
      expect(startPage).toBe(2)
      await options.onBatch([
        indexedPage(sourceId, 2, [fragment('second page', [0.1, 0.1, 0.4, 0.14])]),
        indexedPage(sourceId, 3, [fragment('third page', [0.1, 0.1, 0.4, 0.14])]),
      ])
    })
    await indexBrowserSource(source.id, { environment, extractor: resumed })

    expect((await searchBrowserSource(source.id, 'persisted', 20, environment)).hits[0].page_number)
      .toBe(1)
    expect((await listBrowserSources(environment))[0].browser_index).toMatchObject({
      pages_indexed: 3,
      state: 'ready',
    })
  })

  it('reports a requested passage as omitted when only its smaller context fits the evidence budget', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(new File(['%PDF-budget'], 'budget.pdf'), 'open_license', { ...importDependencies, environment, inspectPdf: async () => 1 })
    let requestedId = ''
    await indexBrowserSource(source.id, { environment, extractor: async (_file, sourceId, _startPage, options) => {
      const page = indexedPage(sourceId, 1, [fragment('Context before the requested long passage.', [.1, .1, .8, .12]), fragment('Large passage with many repeated words.', [.1, .4, .8, .42])])
      page.elements[1].text = 'requested passage '.repeat(1000)
      requestedId = page.elements[1].element_id
      await options.onBatch([page])
    } })
    const bundle = await readBrowserSourceBundle(source.id, [requestedId], 1, environment)
    expect(bundle.elements).toHaveLength(1)
    expect(bundle.bundle_complete).toBe(false)
    expect(bundle.omitted_element_ids).toEqual([requestedId])
  })

  it('keeps a completed supported index immutable so existing lesson anchors survive parser upgrades', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(new File(['%PDF-pinned'], 'pinned.pdf'), 'open_license', { ...importDependencies, environment, inspectPdf: async () => 1 })
    await indexBrowserSource(source.id, { environment, extractor: async (_file, sourceId, _startPage, options) => {
      await options.onBatch([indexedPage(sourceId, 1, [fragment('Existing evidence remains available for approved lessons.', [.1, .2, .8, .22])])])
    } })
    await accessBrowserVault((database) => new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(PRISM_VAULT_SOURCE_STORE, 'readwrite')
      const sourceStore = transaction.objectStore(PRISM_VAULT_SOURCE_STORE)
      const request = sourceStore.get(source.id)
      request.onsuccess = () => sourceStore.put({ ...request.result, browser_index: { ...request.result.browser_index, parser_version: 'pdfjs-evidence-v2' } })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }), environment)
    const extractor = vi.fn()
    const status = await indexBrowserSource(source.id, { environment, extractor })
    expect(extractor).not.toHaveBeenCalled()
    expect(status.parser_version).toBe('pdfjs-evidence-v2')
    expect((await searchBrowserSource(source.id, 'Existing evidence', 20, environment)).hits).toHaveLength(1)
  })

  it('does not mark an incomplete extractor result as searchable', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-partial'], 'partial.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('d'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(2),
      },
    )
    const extractor = vi.fn(async (_file, sourceId, _startPage, options) => {
      await options.onBatch([
        indexedPage(sourceId, 1, [fragment('only the first page', [0.1, 0.1, 0.6, 0.14])]),
      ])
    })

    await expect(indexBrowserSource(source.id, { environment, extractor }))
      .rejects.toThrow('Local indexing stopped after page 1 of 2')
    expect((await listBrowserSources(environment))[0].browser_index).toMatchObject({
      pages_indexed: 1,
      state: 'failed',
    })
    await expect(searchBrowserSource(source.id, 'first page', 20, environment))
      .rejects.toThrow('Local search is not ready')
  })

  it('invalidates stale parser records and rebuilds from page one', async () => {
    const { environment } = testEnvironment()
    const source = await importBrowserSource(
      new File(['%PDF-stale'], 'stale.pdf', { type: 'application/pdf' }),
      'open_license',
      {
        digest: vi.fn().mockResolvedValue('f'.repeat(64)),
        environment,
        inspectPdf: vi.fn().mockResolvedValue(2),
      },
    )
    await accessBrowserVault((database) => new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        [PRISM_VAULT_SOURCE_STORE, PRISM_VAULT_SOURCE_PAGE_STORE],
        'readwrite',
      )
      const sourceStore = transaction.objectStore(PRISM_VAULT_SOURCE_STORE)
      const request = sourceStore.get(source.id)
      request.onsuccess = () => {
        sourceStore.put({
          ...request.result,
          browser_index: {
            error: null,
            pages_indexed: 1,
            parser_version: 'pdfjs-text-v1',
            state: 'ready',
            total_pages: 2,
          },
        })
        transaction.objectStore(PRISM_VAULT_SOURCE_PAGE_STORE).put({
          fragments: [],
          index_version: 'pdfjs-text-v1',
          page_number: 1,
          source_id: source.id,
          text: 'stale text',
        })
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    }), environment)

    expect((await listBrowserSources(environment))[0].browser_index).toMatchObject({
      pages_indexed: 0,
      parser_version: 'pdfjs-evidence-v7',
      state: 'pending',
    })
    const extractor = vi.fn(async (_file, sourceId, startPage, options) => {
      expect(startPage).toBe(1)
      await options.onBatch([
        indexedPage(sourceId, 1, [fragment('rebuilt first page', [0.1, 0.1, 0.6, 0.14])]),
        indexedPage(sourceId, 2, [fragment('rebuilt second page', [0.1, 0.1, 0.6, 0.14])]),
      ])
    })
    await indexBrowserSource(source.id, { environment, extractor })

    expect((await searchBrowserSource(source.id, 'stale text', 20, environment)).hits).toEqual([])
    expect((await searchBrowserSource(source.id, 'rebuilt second', 20, environment)).hits[0].page_number)
      .toBe(2)
  })

  it('stops before parsing or writing when quota headroom is insufficient', async () => {
    const { environment, root } = testEnvironment({ quota: 20 * 1024 * 1024, usage: 19 * 1024 * 1024 })
    const inspectPdf = vi.fn().mockResolvedValue(1)

    await expect(importBrowserSource(
      new File(['%PDF-quota'], 'quota.pdf', { type: 'application/pdf' }),
      'private_authorized',
      { ...importDependencies, environment, inspectPdf },
    )).rejects.toThrow('Not enough browser-local storage')

    expect(inspectPdf).not.toHaveBeenCalled()
    expect(root.directories.size).toBe(0)
  })
})

function indexedPage(
  sourceId: string,
  pageNumber: number,
  fragments: IndexedSourcePage['fragments'],
): IndexedSourcePage {
  return buildIndexedSourcePage({
    fragments,
    height: 792,
    pageNumber,
    rotation: 0,
    sourceId,
    width: 612,
  })
}

function fragment(
  text: string,
  bbox: [number, number, number, number],
): IndexedSourcePage['fragments'][number] {
  return { bbox_normalized: bbox, has_eol: false, text }
}

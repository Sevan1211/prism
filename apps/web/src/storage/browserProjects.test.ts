import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import {
  accessBrowserVault,
  PRISM_VAULT_DATABASE,
  PRISM_VAULT_PROJECT_ROUTE_STORE,
  PRISM_VAULT_PROJECT_SOURCE_STORE,
  PRISM_VAULT_PROJECT_STORE,
  PRISM_VAULT_SCHEMA_VERSION,
  PRISM_VAULT_SOURCE_STORE,
  type BrowserVaultEnvironment,
  type DirectoryHandleLike,
  type FileHandleLike,
  type WritableFileLike,
} from './browserVault'
import {
  addBrowserProjectSource,
  approveBrowserProjectRoute,
  createBrowserProject,
  createBrowserProjectRoute,
  getBrowserProjectRoute,
  listBrowserProjectRoutes,
  listBrowserProjectSources,
  listBrowserProjects,
  restoreBrowserProjectRoute,
} from './browserProjects'
import { deleteBrowserSource, importBrowserSource } from './browserSources'

class MemoryFile implements FileHandleLike {
  blob: Blob | null = null

  constructor(readonly name: string) {}

  async createWritable(): Promise<WritableFileLike> {
    return {
      close: async () => undefined,
      write: async (data) => { this.blob = data },
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

function environment(factory = new IDBFactory()): BrowserVaultEnvironment {
  return {
    indexedDB: factory,
    keyRange: IDBKeyRange,
    storage: {
      estimate: vi.fn().mockResolvedValue({ quota: 1024 ** 3, usage: 0 }),
      getDirectory: vi.fn().mockResolvedValue(new MemoryDirectory()),
      persisted: vi.fn().mockResolvedValue(true),
    },
  }
}

async function sourceFixture(env: BrowserVaultEnvironment) {
  return importBrowserSource(
    new File(['%PDF-project-route'], 'distributed-systems.pdf', { type: 'application/pdf' }),
    'open_license',
    {
      digest: vi.fn().mockResolvedValue('a'.repeat(64)),
      environment: env,
      inspectPdf: vi.fn().mockResolvedValue(12),
    },
  )
}

const routeInput = (projectId: string, sourceId: string) => ({
  coverage_summary: 'Covers the protocol state transition and its failure condition.',
  estimated_minutes: 20,
  objective: 'Explain and apply the state transition.',
  page_end: 4,
  page_start: 2,
  prerequisite_assumptions: ['Understands the protocol roles.'],
  project_id: projectId,
  source_id: sourceId,
  step_order: 1,
  title: 'Protocol state transitions',
  uncertainty_notes: ['Figure labels should be checked in Source Reader.'],
})

describe('browser-local project learning routes', () => {
  it('persists a project, source membership, and learner-approved source-bound route step', async () => {
    const env = environment()
    const source = await sourceFixture(env)
    const project = await createBrowserProject({
      intended_depth: 'standard',
      learner_goal: 'Understand the system well enough to evaluate its design.',
      name: 'Distributed systems paper set',
      time_budget_minutes: 90,
    }, {
      environment: env,
      now: () => '2026-08-31T12:00:00.000Z',
      randomUUID: () => 'project-id',
    })
    const membership = await addBrowserProjectSource(project.project_id, source.id, {
      environment: env,
      now: () => '2026-08-31T12:01:00.000Z',
    })
    const route = await createBrowserProjectRoute(routeInput(project.project_id, source.id), {
      environment: env,
      now: () => '2026-08-31T12:02:00.000Z',
      randomUUID: () => 'route-id',
    })
    const approved = await approveBrowserProjectRoute(route.route_id, route.updated_at, {
      environment: env,
      now: () => '2026-08-31T12:03:00.000Z',
    })

    expect(project).toMatchObject({ project_id: 'project_project-id', record_version: 1 })
    expect(membership).toMatchObject({
      page_count: 12,
      source_hash: 'a'.repeat(64),
      source_name: 'distributed-systems.pdf',
      status: 'available',
    })
    expect(approved).toMatchObject({
      route_id: 'route_route-id',
      source_id: source.id,
      source_hash: 'a'.repeat(64),
      status: 'approved',
      approved_at: '2026-08-31T12:03:00.000Z',
    })
    await expect(listBrowserProjects(env)).resolves.toEqual([
      { ...project, updated_at: '2026-08-31T12:03:00.000Z' },
    ])
    await expect(listBrowserProjectSources(project.project_id, env)).resolves.toEqual([membership])
    await expect(listBrowserProjectRoutes(project.project_id, env)).resolves.toEqual([approved])
    await expect(getBrowserProjectRoute(route.route_id, env)).resolves.toEqual(approved)
  })

  it('visibly detaches route history when a source is removed and permits explicit recovery', async () => {
    const env = environment()
    const source = await sourceFixture(env)
    const project = await createBrowserProject({
      intended_depth: 'deep',
      learner_goal: 'Understand the recovery condition.',
      name: 'Recovery study',
      time_budget_minutes: 45,
    }, {
      environment: env,
      now: () => '2026-08-31T13:00:00.000Z',
      randomUUID: () => 'recover-project',
    })
    await addBrowserProjectSource(project.project_id, source.id, {
      environment: env,
      now: () => '2026-08-31T13:01:00.000Z',
    })
    const proposed = await createBrowserProjectRoute(routeInput(project.project_id, source.id), {
      environment: env,
      now: () => '2026-08-31T13:02:00.000Z',
      randomUUID: () => 'recover-route',
    })
    await approveBrowserProjectRoute(proposed.route_id, proposed.updated_at, {
      environment: env,
      now: () => '2026-08-31T13:03:00.000Z',
    })

    await deleteBrowserSource(source.id, env)

    const detachedMembership = (await listBrowserProjectSources(project.project_id, env))[0]
    const detachedRoute = (await listBrowserProjectRoutes(project.project_id, env))[0]
    expect(detachedMembership).toMatchObject({
      detached_at: expect.any(String),
      source_hash: 'a'.repeat(64),
      source_name: 'distributed-systems.pdf',
      status: 'detached',
    })
    expect(detachedRoute).toMatchObject({
      detached_at: expect.any(String),
      source_hash: 'a'.repeat(64),
      source_name: 'distributed-systems.pdf',
      status: 'detached',
      status_before_detach: 'approved',
    })

    const restoredSource = await sourceFixture(env)
    await addBrowserProjectSource(project.project_id, restoredSource.id, {
      environment: env,
      now: () => '2026-08-31T13:05:00.000Z',
    })
    const restored = await restoreBrowserProjectRoute(
      detachedRoute?.route_id ?? 'missing',
      detachedRoute?.updated_at ?? 'missing',
      { environment: env, now: () => '2026-08-31T13:06:00.000Z' },
    )
    expect(restored).toMatchObject({
      detached_at: null,
      status: 'approved',
      status_before_detach: null,
    })
  })

  it('migrates an existing vault without losing its source store or records', async () => {
    const factory = new IDBFactory()
    const env = environment(factory)
    const initial = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(PRISM_VAULT_DATABASE, 7)
      request.onupgradeneeded = () => {
        const database = request.result
        const metadata = database.createObjectStore('vault_meta', { keyPath: 'key' })
        metadata.add({
          initialized_at: '2026-08-30T00:00:00.000Z',
          key: 'schema',
          schema_version: 7,
        })
        const sources = database.createObjectStore(PRISM_VAULT_SOURCE_STORE, { keyPath: 'id' })
        sources.add({ id: 'local_old', content_hash: 'old-hash', original_name: 'old.pdf', page_count: 1 })
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
    initial.close()

    await accessBrowserVault((database) => new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(PRISM_VAULT_SOURCE_STORE, 'readonly')
      const request = transaction.objectStore(PRISM_VAULT_SOURCE_STORE).get('local_old')
      request.onsuccess = () => {
        expect(request.result).toMatchObject({ original_name: 'old.pdf' })
        resolve()
      }
      request.onerror = () => reject(request.error)
    }), env)

    await accessBrowserVault((database) => new Promise<void>((resolve) => {
      expect(database.version).toBe(PRISM_VAULT_SCHEMA_VERSION)
      expect(database.objectStoreNames.contains(PRISM_VAULT_PROJECT_STORE)).toBe(true)
      expect(database.objectStoreNames.contains(PRISM_VAULT_PROJECT_SOURCE_STORE)).toBe(true)
      expect(database.objectStoreNames.contains(PRISM_VAULT_PROJECT_ROUTE_STORE)).toBe(true)
      resolve()
    }), env)
  })
})

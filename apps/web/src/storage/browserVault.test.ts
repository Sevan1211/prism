import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import {
  inspectBrowserVault,
  PRISM_VAULT_AGENT_ACTIVITY_STORE,
  PRISM_VAULT_AGENT_GRANT_STORE,
  PRISM_VAULT_DATABASE,
  PRISM_VAULT_DIRECTORY,
  PRISM_VAULT_LESSON_BRIEF_STORE,
  PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
  PRISM_VAULT_LESSON_DOCUMENT_STORE,
  PRISM_VAULT_LESSON_OUTCOME_STORE,
  PRISM_VAULT_LESSON_PLAN_STORE,
  PRISM_VAULT_READING_STATE_STORE,
  PRISM_VAULT_SCHEMA_VERSION,
  PRISM_VAULT_SOURCE_PAGE_STORE,
  PRISM_VAULT_SOURCE_STORE,
  requestBrowserPersistence,
  type BrowserVaultEnvironment,
} from './browserVault'

function environment(options?: {
  estimate?: { quota?: number; usage?: number }
  persisted?: boolean
}): { env: BrowserVaultEnvironment; getDirectoryHandle: ReturnType<typeof vi.fn> } {
  const getDirectoryHandle = vi.fn().mockResolvedValue({})
  return {
    env: {
      indexedDB: new IDBFactory(),
      now: () => '2026-08-29T12:00:00.000Z',
      storage: {
        estimate: vi.fn().mockResolvedValue(options?.estimate ?? {
          quota: 1024 * 1024,
          usage: 256 * 1024,
        }),
        getDirectory: vi.fn().mockResolvedValue({ getDirectoryHandle }),
        persist: vi.fn().mockResolvedValue(true),
        persisted: vi.fn().mockResolvedValue(options?.persisted ?? false),
      },
    },
    getDirectoryHandle,
  }
}

describe('browser vault', () => {
  it('migrates a new origin to the current schema and verifies the OPFS boundary', async () => {
    const { env, getDirectoryHandle } = environment()

    const status = await inspectBrowserVault(env)

    expect(status).toMatchObject({
      initializedAt: '2026-08-29T12:00:00.000Z',
      metadataRecovered: false,
      persistence: 'not_granted',
      quotaWarning: false,
      schemaVersion: PRISM_VAULT_SCHEMA_VERSION,
      state: 'at_risk',
    })
    expect(getDirectoryHandle).toHaveBeenCalledWith(PRISM_VAULT_DIRECTORY, { create: true })
  })

  it('upgrades a version-one origin without losing its initialization timestamp', async () => {
    const { env } = environment({ persisted: true })
    await createVersionOneVault(env.indexedDB as IDBFactory)

    const status = await inspectBrowserVault(env)
    const database = await openDatabase(env.indexedDB as IDBFactory)

    expect(status).toMatchObject({
      initializedAt: '2026-08-28T10:00:00.000Z',
      schemaVersion: PRISM_VAULT_SCHEMA_VERSION,
      state: 'ready',
    })
    expect(database.objectStoreNames.contains(PRISM_VAULT_SOURCE_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_READING_STATE_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_SOURCE_PAGE_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_LESSON_BRIEF_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_LESSON_PLAN_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_LESSON_DOCUMENT_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_LESSON_OUTCOME_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_AGENT_GRANT_STORE)).toBe(true)
    expect(database.objectStoreNames.contains(PRISM_VAULT_AGENT_ACTIVITY_STORE)).toBe(true)
    database.close()
  })

  it('reports protected storage when persistence is already granted', async () => {
    const { env } = environment({ persisted: true })

    await expect(inspectBrowserVault(env)).resolves.toMatchObject({
      persistence: 'granted',
      state: 'ready',
    })
  })

  it('warns before quota pressure is hidden by a successful initialization', async () => {
    const { env } = environment({
      estimate: { quota: 1_000, usage: 900 },
      persisted: true,
    })

    await expect(inspectBrowserVault(env)).resolves.toMatchObject({
      quotaWarning: true,
      state: 'at_risk',
    })
  })

  it('repairs a missing schema record without deleting the vault database', async () => {
    const { env } = environment({ persisted: true })
    await inspectBrowserVault(env)
    await deleteSchemaRecord(env.indexedDB as IDBFactory)

    const recovered = await inspectBrowserVault({
      ...env,
      now: () => '2026-08-29T13:00:00.000Z',
    })

    expect(recovered).toMatchObject({
      initializedAt: '2026-08-29T13:00:00.000Z',
      metadataRecovered: true,
      schemaVersion: PRISM_VAULT_SCHEMA_VERSION,
      state: 'ready',
    })
  })

  it('requests persistence only through an explicit call and then refreshes health', async () => {
    const { env } = environment()
    const persist = vi.mocked(env.storage?.persist as () => Promise<boolean>)
    const persisted = vi.mocked(env.storage?.persisted as () => Promise<boolean>)
    persisted.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const initial = await inspectBrowserVault(env)
    const protectedStatus = await requestBrowserPersistence(env)

    expect(initial.persistence).toBe('not_granted')
    expect(persist).toHaveBeenCalledOnce()
    expect(protectedStatus).toMatchObject({ persistence: 'granted', state: 'ready' })
  })

  it('fails closed when either browser-local storage primitive is missing', async () => {
    await expect(inspectBrowserVault({ indexedDB: new IDBFactory() })).resolves.toMatchObject({
      schemaVersion: null,
      state: 'unavailable',
    })
  })

  it('surfaces OPFS initialization failures without claiming the vault is ready', async () => {
    const { env } = environment()
    if (env.storage) {
      env.storage.getDirectory = vi.fn().mockRejectedValue(new Error('OPFS denied'))
    }

    await expect(inspectBrowserVault(env)).resolves.toMatchObject({
      detail: 'OPFS denied',
      schemaVersion: null,
      state: 'error',
    })
  })
})

function deleteSchemaRecord(factory: IDBFactory): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(PRISM_VAULT_DATABASE, PRISM_VAULT_SCHEMA_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('vault_meta', 'readwrite')
      transaction.objectStore('vault_meta').delete('schema')
      transaction.oncomplete = () => {
        database.close()
        resolve()
      }
      transaction.onerror = () => reject(transaction.error)
    }
  })
}

function createVersionOneVault(factory: IDBFactory): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(PRISM_VAULT_DATABASE, 1)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('vault_meta', { keyPath: 'key' })
      store.add({
        initialized_at: '2026-08-28T10:00:00.000Z',
        key: 'schema',
        schema_version: 1,
      })
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      request.result.close()
      resolve()
    }
  })
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(PRISM_VAULT_DATABASE, PRISM_VAULT_SCHEMA_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

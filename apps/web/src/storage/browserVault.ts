import { withSyncedLibrary } from './syncedLibrary'
import { SYNC_STORES } from './syncDatabase'
export const PRISM_VAULT_DATABASE = 'prism-browser-vault'
export const PRISM_VAULT_DIRECTORY = 'prism-browser-vault'
export const PRISM_VAULT_SCHEMA_VERSION = 12
export const PRISM_VAULT_ILLUSTRATION_STORE = 'lesson_illustrations'
export const PRISM_VAULT_LESSON_EDIT_STORE = 'lesson_edit_proposals'
export const PRISM_VAULT_SOURCE_STORE = 'sources'
export const PRISM_VAULT_READING_STATE_STORE = 'reading_state'
export const PRISM_VAULT_SOURCE_PAGE_STORE = 'source_pages'
export const PRISM_VAULT_LESSON_BRIEF_STORE = 'lesson_briefs'
export const PRISM_VAULT_LESSON_PLAN_STORE = 'lesson_plans'
export const PRISM_VAULT_LESSON_DOCUMENT_STORE = 'lesson_documents'
export const PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE = 'lesson_document_revisions'
export const PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE = 'lesson_answer_analyses'
export const PRISM_VAULT_LESSON_OUTCOME_STORE = 'lesson_outcomes'
export const PRISM_VAULT_AGENT_GRANT_STORE = 'source_agent_grants'
export const PRISM_VAULT_AGENT_ACTIVITY_STORE = 'agent_activity'
export const PRISM_VAULT_PROJECT_STORE = 'projects'
export const PRISM_VAULT_PROJECT_SOURCE_STORE = 'project_sources'
export const PRISM_VAULT_PROJECT_ROUTE_STORE = 'project_routes'
export const PRISM_VAULT_CHANGED_EVENT = 'prism:vault-changed'

const META_STORE = 'vault_meta'
const SCHEMA_RECORD_KEY = 'schema'
const QUOTA_WARNING_RATIO = 0.85

type VaultState = 'ready' | 'at_risk' | 'unavailable' | 'error'
type PersistenceState = 'granted' | 'not_granted' | 'unsupported' | 'unknown'

export interface WritableFileLike {
  abort?: () => Promise<void>
  close: () => Promise<void>
  write: (data: Blob) => Promise<void>
}

export interface FileHandleLike {
  createWritable: () => Promise<WritableFileLike>
  getFile: () => Promise<File>
}

export interface DirectoryHandleLike {
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<DirectoryHandleLike>
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>
  removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>
}

export interface StorageManagerLike {
  estimate?: () => Promise<{ quota?: number; usage?: number }>
  getDirectory?: () => Promise<DirectoryHandleLike>
  persist?: () => Promise<boolean>
  persisted?: () => Promise<boolean>
}

export interface BrowserVaultEnvironment {
  indexedDB?: IDBFactory
  keyRange?: { only: (value: IDBValidKey) => IDBKeyRange }
  now?: () => string
  storage?: StorageManagerLike
}

export interface BrowserVaultStatus {
  detail: string
  initializedAt: string | null
  metadataRecovered: boolean
  persistence: PersistenceState
  quotaBytes: number | null
  quotaWarning: boolean
  schemaVersion: number | null
  state: VaultState
  usageBytes: number | null
}

interface VaultMetadata {
  initialized_at: string
  key: typeof SCHEMA_RECORD_KEY
  schema_version: number
}

export async function inspectBrowserVault(
  environment: BrowserVaultEnvironment = browserEnvironment(),
): Promise<BrowserVaultStatus> {
  const factory = environment.indexedDB
  const storage = environment.storage
  if (!factory || !storage?.getDirectory) {
    return unavailableStatus(
      'This browser does not expose both IndexedDB and origin-private file storage.',
    )
  }

  let database: IDBDatabase | null = null
  try {
    const databasePromise = openVaultDatabase(factory, environment.now ?? currentTime)
    const directoryPromise = storage
      .getDirectory()
      .then((root) => root.getDirectoryHandle(PRISM_VAULT_DIRECTORY, { create: true }))
    const persistencePromise: Promise<PersistenceState> = storage.persisted
      ? storage.persisted().then((granted) => granted ? 'granted' : 'not_granted')
      : Promise.resolve('unsupported')
    const estimatePromise = storage.estimate
      ? storage.estimate()
      : Promise.resolve({ quota: undefined, usage: undefined })

    const [openedDatabase, , persistence, estimate] = await Promise.all([
      databasePromise,
      directoryPromise,
      persistencePromise,
      estimatePromise,
    ])
    database = openedDatabase
    const metadata = await ensureVaultMetadata(database, environment.now ?? currentTime)
    const usageBytes = finiteNumber(estimate.usage)
    const quotaBytes = finiteNumber(estimate.quota)
    const quotaWarning = Boolean(
      usageBytes !== null
      && quotaBytes !== null
      && quotaBytes > 0
      && usageBytes / quotaBytes >= QUOTA_WARNING_RATIO,
    )

    return {
      detail: statusDetail(persistence, quotaWarning),
      initializedAt: metadata.value.initialized_at,
      metadataRecovered: metadata.recovered,
      persistence,
      quotaBytes,
      quotaWarning,
      schemaVersion: metadata.value.schema_version,
      state: persistence === 'granted' && !quotaWarning ? 'ready' : 'at_risk',
      usageBytes,
    }
  } catch (cause) {
    return {
      detail: cause instanceof Error ? cause.message : 'The browser vault could not be opened.',
      initializedAt: null,
      metadataRecovered: false,
      persistence: 'unknown',
      quotaBytes: null,
      quotaWarning: false,
      schemaVersion: null,
      state: 'error',
      usageBytes: null,
    }
  } finally {
    database?.close()
  }
}

export async function requestBrowserPersistence(
  environment: BrowserVaultEnvironment = browserEnvironment(),
): Promise<BrowserVaultStatus> {
  const persist = environment.storage?.persist
  if (!persist) return inspectBrowserVault(environment)

  try {
    await persist.call(environment.storage)
    return inspectBrowserVault(environment)
  } catch (cause) {
    const current = await inspectBrowserVault(environment)
    return {
      ...current,
      detail: cause instanceof Error
        ? `Persistent storage was not granted: ${cause.message}`
        : 'Persistent storage was not granted by this browser.',
      persistence: 'not_granted',
      state: current.state === 'unavailable' ? current.state : 'at_risk',
    }
  }
}

export async function accessBrowserVault<T>(
  work: (database: IDBDatabase, directory: DirectoryHandleLike) => Promise<T>,
  environment?: BrowserVaultEnvironment,
): Promise<T> {
  if (!environment && typeof window !== 'undefined') {
    const synced = await withSyncedLibrary(work)
    if (synced) return synced.value
  }
  environment ??= browserEnvironment()
  const factory = environment.indexedDB
  const getDirectory = environment.storage?.getDirectory
  if (!factory || !getDirectory) {
    throw new Error('IndexedDB and origin-private file storage are required for local sources.')
  }

  const [database, root] = await Promise.all([
    openVaultDatabase(factory, environment.now ?? currentTime),
    getDirectory.call(environment.storage),
  ])
  try {
    await ensureVaultMetadata(database, environment.now ?? currentTime)
    const directory = await root.getDirectoryHandle(PRISM_VAULT_DIRECTORY, { create: true })
    return await work(database, directory)
  } finally {
    database.close()
  }
}

export function formatStorageBytes(value: number | null): string {
  if (value === null) return 'Unknown'
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let amount = value
  let unit = -1
  do {
    amount /= 1024
    unit += 1
  } while (amount >= 1024 && unit < units.length - 1)
  return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[unit]}`
}

function browserEnvironment(): BrowserVaultEnvironment {
  return {
    indexedDB: typeof window === 'undefined' ? undefined : window.indexedDB,
    keyRange: typeof IDBKeyRange === 'undefined' ? undefined : IDBKeyRange,
    storage: typeof navigator === 'undefined'
      ? undefined
      : navigator.storage as StorageManagerLike | undefined,
  }
}

function currentTime(): string {
  return new Date().toISOString()
}

function finiteNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function unavailableStatus(detail: string): BrowserVaultStatus {
  return {
    detail,
    initializedAt: null,
    metadataRecovered: false,
    persistence: 'unsupported',
    quotaBytes: null,
    quotaWarning: false,
    schemaVersion: null,
    state: 'unavailable',
    usageBytes: null,
  }
}

function statusDetail(persistence: PersistenceState, quotaWarning: boolean): string {
  if (quotaWarning) {
    return 'This origin is using at least 85% of its reported browser storage quota.'
  }
  if (persistence === 'granted') {
    return 'The browser has marked this origin for persistent local storage.'
  }
  if (persistence === 'unsupported') {
    return 'Local storage is available, but this browser cannot report or request persistence.'
  }
  return 'Local storage is available, but the browser may evict it under storage pressure.'
}

export function openVaultDatabase(
  factory: IDBFactory,
  now: () => string,
  name = PRISM_VAULT_DATABASE,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, PRISM_VAULT_SCHEMA_VERSION)
    let rejected = false

    request.onupgradeneeded = () => {
      const database = request.result
      const transaction = request.transaction
      if (!transaction) {
        throw new Error('The browser vault migration did not start a transaction.')
      }
      for (const name of SYNC_STORES) if (!database.objectStoreNames.contains(name)) database.createObjectStore(name)

      let metadataStore: IDBObjectStore
      if (database.objectStoreNames.contains(META_STORE)) {
        metadataStore = transaction.objectStore(META_STORE)
        const metadataRequest = metadataStore.get(SCHEMA_RECORD_KEY)
        metadataRequest.onsuccess = () => {
          const existing = metadataRequest.result as VaultMetadata | undefined
          metadataStore.put({
            initialized_at: existing?.initialized_at ?? now(),
            key: SCHEMA_RECORD_KEY,
            schema_version: PRISM_VAULT_SCHEMA_VERSION,
          } satisfies VaultMetadata)
        }
      } else {
        metadataStore = database.createObjectStore(META_STORE, { keyPath: 'key' })
        metadataStore.add(newVaultMetadata(now))
      }

      if (!database.objectStoreNames.contains(PRISM_VAULT_SOURCE_STORE)) {
        const sources = database.createObjectStore(PRISM_VAULT_SOURCE_STORE, { keyPath: 'id' })
        sources.createIndex('content_hash', 'content_hash', { unique: true })
        sources.createIndex('created_at', 'created_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_READING_STATE_STORE)) {
        database.createObjectStore(PRISM_VAULT_READING_STATE_STORE, { keyPath: 'source_id' })
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_SOURCE_PAGE_STORE)) {
        const pages = database.createObjectStore(PRISM_VAULT_SOURCE_PAGE_STORE, {
          keyPath: ['source_id', 'page_number'],
        })
        pages.createIndex('source_id', 'source_id')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_BRIEF_STORE)) {
        const briefs = database.createObjectStore(PRISM_VAULT_LESSON_BRIEF_STORE, {
          keyPath: 'brief_id',
        })
        briefs.createIndex('source_id', 'source_id')
        briefs.createIndex('updated_at', 'updated_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_PLAN_STORE)) {
        const plans = database.createObjectStore(PRISM_VAULT_LESSON_PLAN_STORE, {
          keyPath: 'plan_id',
        })
        plans.createIndex('source_id', 'source_id')
        plans.createIndex('brief_id', 'brief_id')
        plans.createIndex('updated_at', 'updated_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_DOCUMENT_STORE)) {
        const documents = database.createObjectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE, {
          keyPath: 'lesson_id',
        })
        documents.createIndex('source_id', 'source_id')
        documents.createIndex('plan_id', 'plan_id', { unique: true })
        documents.createIndex('updated_at', 'updated_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_EDIT_STORE)) {
        const edits = database.createObjectStore(PRISM_VAULT_LESSON_EDIT_STORE, { keyPath: 'lesson_id' })
        edits.createIndex('source_id', 'source_id')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_ILLUSTRATION_STORE)) {
        const images = database.createObjectStore(PRISM_VAULT_ILLUSTRATION_STORE, { keyPath: 'asset_id' })
        images.createIndex('source_id', 'source_id')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE)) {
        const revisions = database.createObjectStore(
          PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
          { keyPath: ['lesson_id', 'document_version'] },
        )
        revisions.createIndex('lesson_id', 'lesson_id')
        revisions.createIndex('plan_id', 'plan_id')
        revisions.createIndex('source_id', 'source_id')
        revisions.createIndex('updated_at', 'updated_at')

        if (database.objectStoreNames.contains(PRISM_VAULT_LESSON_DOCUMENT_STORE)) {
          const existingDocuments = transaction.objectStore(PRISM_VAULT_LESSON_DOCUMENT_STORE)
          existingDocuments.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (!cursor) return
            revisions.put(cursor.value)
            cursor.continue()
          }
        }
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE)) {
        const analyses = database.createObjectStore(
          PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
          { keyPath: 'analysis_id' },
        )
        analyses.createIndex('source_id', 'source_id')
        analyses.createIndex('lesson_id', 'lesson_id')
        analyses.createIndex('plan_id', 'plan_id')
        analyses.createIndex('created_at', 'created_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_LESSON_OUTCOME_STORE)) {
        const outcomes = database.createObjectStore(PRISM_VAULT_LESSON_OUTCOME_STORE, {
          keyPath: 'proposal_id',
        })
        outcomes.createIndex('source_id', 'source_id')
        outcomes.createIndex('lesson_id', 'lesson_id')
        outcomes.createIndex('plan_id', 'plan_id')
        outcomes.createIndex('updated_at', 'updated_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_AGENT_GRANT_STORE)) {
        database.createObjectStore(PRISM_VAULT_AGENT_GRANT_STORE, { keyPath: 'source_id' })
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_AGENT_ACTIVITY_STORE)) {
        const activity = database.createObjectStore(PRISM_VAULT_AGENT_ACTIVITY_STORE, {
          keyPath: 'activity_id',
        })
        activity.createIndex('source_id', 'source_id')
        activity.createIndex('occurred_at', 'occurred_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_PROJECT_STORE)) {
        const projects = database.createObjectStore(PRISM_VAULT_PROJECT_STORE, {
          keyPath: 'project_id',
        })
        projects.createIndex('updated_at', 'updated_at')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_PROJECT_SOURCE_STORE)) {
        const projectSources = database.createObjectStore(PRISM_VAULT_PROJECT_SOURCE_STORE, {
          keyPath: ['project_id', 'source_id'],
        })
        projectSources.createIndex('project_id', 'project_id')
        projectSources.createIndex('source_id', 'source_id')
      }
      if (!database.objectStoreNames.contains(PRISM_VAULT_PROJECT_ROUTE_STORE)) {
        const routes = database.createObjectStore(PRISM_VAULT_PROJECT_ROUTE_STORE, {
          keyPath: 'route_id',
        })
        routes.createIndex('project_id', 'project_id')
        routes.createIndex('source_id', 'source_id')
        routes.createIndex('project_step', ['project_id', 'step_order'], { unique: true })
        routes.createIndex('updated_at', 'updated_at')
      }
    }
    request.onerror = () => {
      rejected = true
      reject(request.error ?? new Error('The browser vault database could not be opened.'))
    }
    request.onblocked = () => {
      rejected = true
      reject(new Error('The browser vault upgrade is blocked by another open PRISM tab.'))
    }
    request.onsuccess = () => {
      if (rejected) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}

async function ensureVaultMetadata(
  database: IDBDatabase,
  now: () => string,
): Promise<{ recovered: boolean; value: VaultMetadata }> {
  const existing = await readMetadata(database)
  if (existing) {
    if (existing.schema_version !== PRISM_VAULT_SCHEMA_VERSION) {
      throw new Error('The browser vault metadata does not match the database schema version.')
    }
    return { recovered: false, value: existing }
  }

  const recovered = newVaultMetadata(now)
  await writeMetadata(database, recovered)
  return { recovered: true, value: recovered }
}

function newVaultMetadata(now: () => string): VaultMetadata {
  return {
    initialized_at: now(),
    key: SCHEMA_RECORD_KEY,
    schema_version: PRISM_VAULT_SCHEMA_VERSION,
  }
}

function readMetadata(database: IDBDatabase): Promise<VaultMetadata | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(META_STORE, 'readonly')
    const request = transaction.objectStore(META_STORE).get(SCHEMA_RECORD_KEY)
    request.onsuccess = () => resolve(request.result as VaultMetadata | undefined)
    request.onerror = () => reject(request.error ?? new Error('Vault metadata could not be read.'))
    transaction.onabort = () => reject(
      transaction.error ?? new Error('The vault metadata read was interrupted.'),
    )
  })
}

function writeMetadata(database: IDBDatabase, metadata: VaultMetadata): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(META_STORE, 'readwrite')
    transaction.objectStore(META_STORE).put(metadata)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      transaction.error ?? new Error('Vault metadata could not be restored.'),
    )
    transaction.onabort = () => reject(
      transaction.error ?? new Error('The vault metadata restore was interrupted.'),
    )
  })
}

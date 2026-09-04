import {
  accessBrowserVault,
  PRISM_VAULT_CHANGED_EVENT,
  PRISM_VAULT_PROJECT_ROUTE_STORE,
  PRISM_VAULT_PROJECT_SOURCE_STORE,
  PRISM_VAULT_PROJECT_STORE,
  PRISM_VAULT_SOURCE_STORE,
  type BrowserVaultEnvironment,
} from './browserVault'

const MAX_PROJECT_SOURCES = 64

export type ProjectDepth = 'overview' | 'standard' | 'deep'
export type ProjectSourceStatus = 'available' | 'detached'
export type ProjectRouteStatus = 'proposed' | 'approved' | 'detached'
type ActiveProjectRouteStatus = Exclude<ProjectRouteStatus, 'detached'>

export interface BrowserProject {
  created_at: string
  intended_depth: ProjectDepth
  learner_goal: string
  name: string
  project_id: string
  record_version: 1
  time_budget_minutes: number
  updated_at: string
}

export interface ProjectSourceMembership {
  added_at: string
  detached_at: string | null
  page_count: number
  project_id: string
  record_version: 1
  source_hash: string
  source_id: string
  source_name: string
  status: ProjectSourceStatus
}

export interface ProjectRouteRecord {
  approved_at: string | null
  coverage_summary: string
  created_at: string
  detached_at: string | null
  estimated_minutes: number
  objective: string
  page_end: number
  page_start: number
  prerequisite_assumptions: string[]
  project_id: string
  record_version: 1
  route_id: string
  source_hash: string
  source_id: string
  source_name: string
  status: ProjectRouteStatus
  status_before_detach: ActiveProjectRouteStatus | null
  step_order: number
  title: string
  uncertainty_notes: string[]
  updated_at: string
}

export interface CreateBrowserProjectInput {
  intended_depth: ProjectDepth
  learner_goal: string
  name: string
  time_budget_minutes: number
}

export interface CreateProjectRouteInput {
  coverage_summary: string
  estimated_minutes: number
  objective: string
  page_end: number
  page_start: number
  prerequisite_assumptions: string[]
  project_id: string
  source_id: string
  step_order: number
  title: string
  uncertainty_notes: string[]
}

export interface BrowserProjectDependencies {
  environment?: BrowserVaultEnvironment
  now?: () => string
  randomUUID?: () => string
}

interface VaultSourceReference {
  content_hash: string
  id: string
  original_name: string
  page_count: number
}

export async function createBrowserProject(
  input: CreateBrowserProjectInput,
  dependencies: BrowserProjectDependencies = {},
): Promise<BrowserProject> {
  const normalized = normalizeProjectInput(input)
  const timestamp = (dependencies.now ?? currentTime)()
  const project: BrowserProject = {
    ...normalized,
    created_at: timestamp,
    project_id: `project_${(dependencies.randomUUID ?? randomUUID)()}`,
    record_version: 1,
    updated_at: timestamp,
  }
  await accessBrowserVault(
    (database) => putRecord(database, PRISM_VAULT_PROJECT_STORE, project),
    dependencies.environment,
  )
  notifyVaultChanged()
  return project
}

export function getBrowserProject(
  projectId: string,
  environment?: BrowserVaultEnvironment,
): Promise<BrowserProject | undefined> {
  return accessBrowserVault(
    (database) => getRecord<BrowserProject>(
      database,
      PRISM_VAULT_PROJECT_STORE,
      requiredIdentifier(projectId, 'project_id'),
    ),
    environment,
  )
}

export function listBrowserProjects(
  environment?: BrowserVaultEnvironment,
): Promise<BrowserProject[]> {
  return accessBrowserVault(
    (database) => allRecords<BrowserProject>(database, PRISM_VAULT_PROJECT_STORE)
      .then((projects) => projects.sort((left, right) => right.updated_at.localeCompare(left.updated_at))),
    environment,
  )
}

export function addBrowserProjectSource(
  projectId: string,
  sourceId: string,
  dependencies: BrowserProjectDependencies = {},
): Promise<ProjectSourceMembership> {
  const normalizedProjectId = requiredIdentifier(projectId, 'project_id')
  const normalizedSourceId = requiredIdentifier(sourceId, 'source_id')
  const timestamp = (dependencies.now ?? currentTime)()
  return accessBrowserVault(
    (database) => addProjectSourceRecord(
      database,
      normalizedProjectId,
      normalizedSourceId,
      timestamp,
    ),
    dependencies.environment,
  ).then((membership) => {
    notifyVaultChanged()
    return membership
  })
}

export function listBrowserProjectSources(
  projectId: string,
  environment?: BrowserVaultEnvironment,
): Promise<ProjectSourceMembership[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<ProjectSourceMembership>(
      database,
      PRISM_VAULT_PROJECT_SOURCE_STORE,
      'project_id',
      requiredIdentifier(projectId, 'project_id'),
    ).then((records) => records.sort((left, right) => left.added_at.localeCompare(right.added_at))),
    environment,
  )
}

export function createBrowserProjectRoute(
  input: CreateProjectRouteInput,
  dependencies: BrowserProjectDependencies = {},
): Promise<ProjectRouteRecord> {
  const normalized = normalizeRouteInput(input)
  const timestamp = (dependencies.now ?? currentTime)()
  return accessBrowserVault(
    (database) => addProjectRouteRecord(
      database,
      normalized,
      timestamp,
      dependencies.randomUUID ?? randomUUID,
    ),
    dependencies.environment,
  ).then((route) => {
    notifyVaultChanged()
    return route
  })
}

export function getBrowserProjectRoute(
  routeId: string,
  environment?: BrowserVaultEnvironment,
): Promise<ProjectRouteRecord | undefined> {
  return accessBrowserVault(
    (database) => getRecord<ProjectRouteRecord>(
      database,
      PRISM_VAULT_PROJECT_ROUTE_STORE,
      requiredIdentifier(routeId, 'route_id'),
    ),
    environment,
  )
}

export function listBrowserProjectRoutes(
  projectId: string,
  environment?: BrowserVaultEnvironment,
): Promise<ProjectRouteRecord[]> {
  return accessBrowserVault(
    (database) => recordsByIndex<ProjectRouteRecord>(
      database,
      PRISM_VAULT_PROJECT_ROUTE_STORE,
      'project_id',
      requiredIdentifier(projectId, 'project_id'),
    ).then((records) => records.sort((left, right) => left.step_order - right.step_order)),
    environment,
  )
}

export function approveBrowserProjectRoute(
  routeId: string,
  expectedUpdatedAt: string,
  dependencies: BrowserProjectDependencies = {},
): Promise<ProjectRouteRecord> {
  const normalizedRouteId = requiredIdentifier(routeId, 'route_id')
  const expected = requiredTimestamp(expectedUpdatedAt, 'expected_updated_at')
  const timestamp = (dependencies.now ?? currentTime)()
  return accessBrowserVault(
    (database) => approveProjectRouteRecord(database, normalizedRouteId, expected, timestamp),
    dependencies.environment,
  ).then((route) => {
    notifyVaultChanged()
    return route
  })
}

export function restoreBrowserProjectRoute(
  routeId: string,
  expectedUpdatedAt: string,
  dependencies: BrowserProjectDependencies = {},
): Promise<ProjectRouteRecord> {
  const normalizedRouteId = requiredIdentifier(routeId, 'route_id')
  const expected = requiredTimestamp(expectedUpdatedAt, 'expected_updated_at')
  const timestamp = (dependencies.now ?? currentTime)()
  return accessBrowserVault(
    (database) => restoreProjectRouteRecord(database, normalizedRouteId, expected, timestamp),
    dependencies.environment,
  ).then((route) => {
    notifyVaultChanged()
    return route
  })
}

export function deleteBrowserProject(
  projectId: string,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  const normalizedProjectId = requiredIdentifier(projectId, 'project_id')
  return accessBrowserVault(
    (database) => deleteProjectRecord(database, normalizedProjectId),
    environment,
  ).then(() => notifyVaultChanged())
}

export function detachProjectSourceInTransaction(
  transaction: IDBTransaction,
  sourceRange: IDBKeyRange,
  detachedAt: string,
): void {
  detachBySourceInTransaction<ProjectSourceMembership>(
    transaction,
    PRISM_VAULT_PROJECT_SOURCE_STORE,
    sourceRange,
    (membership) => ({
      ...membership,
      detached_at: detachedAt,
      status: 'detached',
    }),
  )
  detachBySourceInTransaction<ProjectRouteRecord>(
    transaction,
    PRISM_VAULT_PROJECT_ROUTE_STORE,
    sourceRange,
    (route) => ({
      ...route,
      detached_at: detachedAt,
      status: 'detached',
      status_before_detach: route.status === 'detached'
        ? route.status_before_detach
        : route.status,
      updated_at: detachedAt,
    }),
  )
}

function addProjectSourceRecord(
  database: IDBDatabase,
  projectId: string,
  sourceId: string,
  timestamp: string,
): Promise<ProjectSourceMembership> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_PROJECT_STORE, PRISM_VAULT_SOURCE_STORE, PRISM_VAULT_PROJECT_SOURCE_STORE],
      'readwrite',
    )
    let failure: Error | null = null
    let membership: ProjectSourceMembership | null = null
    const projectRequest = transaction.objectStore(PRISM_VAULT_PROJECT_STORE).get(projectId)
    projectRequest.onsuccess = () => {
      const project = projectRequest.result as BrowserProject | undefined
      if (!project) {
        failure = new Error('This project no longer exists.')
        transaction.abort()
        return
      }
      const sourceRequest = transaction.objectStore(PRISM_VAULT_SOURCE_STORE).get(sourceId)
      sourceRequest.onsuccess = () => {
        const source = sourceRequest.result as VaultSourceReference | undefined
        if (!isVaultSourceReference(source)) {
          failure = new Error('This browser-local source no longer exists.')
          transaction.abort()
          return
        }
        const membershipStore = transaction.objectStore(PRISM_VAULT_PROJECT_SOURCE_STORE)
        const existingRequest = membershipStore.get([projectId, sourceId])
        existingRequest.onsuccess = () => {
          const existing = existingRequest.result as ProjectSourceMembership | undefined
          const countRequest = membershipStore.index('project_id').count(projectId)
          countRequest.onsuccess = () => {
            if (!existing && countRequest.result >= MAX_PROJECT_SOURCES) {
              failure = new Error(`A project supports at most ${MAX_PROJECT_SOURCES} sources.`)
              transaction.abort()
              return
            }
            membership = {
              added_at: existing?.added_at ?? timestamp,
              detached_at: null,
              page_count: source.page_count,
              project_id: projectId,
              record_version: 1,
              source_hash: source.content_hash,
              source_id: source.id,
              source_name: source.original_name,
              status: 'available',
            }
            membershipStore.put(membership)
            transaction.objectStore(PRISM_VAULT_PROJECT_STORE).put({ ...project, updated_at: timestamp })
          }
          countRequest.onerror = () => {
            failure = countRequest.error ?? new Error('The project source count could not be read.')
          }
        }
        existingRequest.onerror = () => {
          failure = existingRequest.error ?? new Error('The project source membership could not be read.')
        }
      }
      sourceRequest.onerror = () => {
        failure = sourceRequest.error ?? new Error('The browser-local source could not be read.')
      }
    }
    projectRequest.onerror = () => {
      failure = projectRequest.error ?? new Error('The project could not be read.')
    }
    transaction.oncomplete = () => membership
      ? resolve(membership)
      : reject(failure ?? new Error('The project source membership was not saved.'))
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The project source membership could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The project source membership save was interrupted.'),
    )
  })
}

function addProjectRouteRecord(
  database: IDBDatabase,
  input: CreateProjectRouteInput,
  timestamp: string,
  createId: () => string,
): Promise<ProjectRouteRecord> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_PROJECT_STORE, PRISM_VAULT_PROJECT_SOURCE_STORE, PRISM_VAULT_PROJECT_ROUTE_STORE],
      'readwrite',
    )
    let failure: Error | null = null
    let route: ProjectRouteRecord | null = null
    const projectRequest = transaction.objectStore(PRISM_VAULT_PROJECT_STORE).get(input.project_id)
    projectRequest.onsuccess = () => {
      const project = projectRequest.result as BrowserProject | undefined
      if (!project) {
        failure = new Error('This project no longer exists.')
        transaction.abort()
        return
      }
      const membershipRequest = transaction.objectStore(PRISM_VAULT_PROJECT_SOURCE_STORE)
        .get([input.project_id, input.source_id])
      membershipRequest.onsuccess = () => {
        const membership = membershipRequest.result as ProjectSourceMembership | undefined
        if (!membership || membership.status !== 'available') {
          failure = new Error('Add an available browser-local source to this project before creating a route step.')
          transaction.abort()
          return
        }
        if (input.page_end > membership.page_count) {
          failure = new Error(`This source has ${membership.page_count} pages.`)
          transaction.abort()
          return
        }
        route = {
          ...input,
          approved_at: null,
          created_at: timestamp,
          detached_at: null,
          record_version: 1,
          route_id: `route_${createId()}`,
          source_hash: membership.source_hash,
          source_name: membership.source_name,
          status: 'proposed',
          status_before_detach: null,
          updated_at: timestamp,
        }
        transaction.objectStore(PRISM_VAULT_PROJECT_ROUTE_STORE).add(route)
        transaction.objectStore(PRISM_VAULT_PROJECT_STORE).put({ ...project, updated_at: timestamp })
      }
      membershipRequest.onerror = () => {
        failure = membershipRequest.error ?? new Error('The project source membership could not be read.')
      }
    }
    projectRequest.onerror = () => {
      failure = projectRequest.error ?? new Error('The project could not be read.')
    }
    transaction.oncomplete = () => route
      ? resolve(route)
      : reject(failure ?? new Error('The project route was not saved.'))
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The project route could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The project route save was interrupted.'),
    )
  })
}

function approveProjectRouteRecord(
  database: IDBDatabase,
  routeId: string,
  expectedUpdatedAt: string,
  timestamp: string,
): Promise<ProjectRouteRecord> {
  return changeProjectRouteRecord(database, routeId, expectedUpdatedAt, timestamp, (route, membership) => {
    if (route.status === 'approved') return route
    if (route.status !== 'proposed' || membership.status !== 'available') {
      throw new Error('This route step is no longer available for approval.')
    }
    return {
      ...route,
      approved_at: timestamp,
      status: 'approved',
      updated_at: timestamp,
    }
  })
}

function restoreProjectRouteRecord(
  database: IDBDatabase,
  routeId: string,
  expectedUpdatedAt: string,
  timestamp: string,
): Promise<ProjectRouteRecord> {
  return changeProjectRouteRecord(database, routeId, expectedUpdatedAt, timestamp, (route, membership) => {
    if (route.status !== 'detached' || membership.status !== 'available') {
      throw new Error('This route step is not ready to restore.')
    }
    if (membership.source_hash !== route.source_hash) {
      throw new Error('The available source does not match the source recorded for this route step.')
    }
    return {
      ...route,
      detached_at: null,
      status: route.status_before_detach ?? 'proposed',
      status_before_detach: null,
      updated_at: timestamp,
    }
  })
}

function changeProjectRouteRecord(
  database: IDBDatabase,
  routeId: string,
  expectedUpdatedAt: string,
  timestamp: string,
  change: (route: ProjectRouteRecord, membership: ProjectSourceMembership) => ProjectRouteRecord,
): Promise<ProjectRouteRecord> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_PROJECT_STORE, PRISM_VAULT_PROJECT_SOURCE_STORE, PRISM_VAULT_PROJECT_ROUTE_STORE],
      'readwrite',
    )
    let failure: Error | null = null
    let next: ProjectRouteRecord | null = null
    const routeStore = transaction.objectStore(PRISM_VAULT_PROJECT_ROUTE_STORE)
    const routeRequest = routeStore.get(routeId)
    routeRequest.onsuccess = () => {
      const route = routeRequest.result as ProjectRouteRecord | undefined
      if (!route || route.updated_at !== expectedUpdatedAt) {
        failure = new Error('This route step changed before the learner decision was saved.')
        transaction.abort()
        return
      }
      const membershipRequest = transaction.objectStore(PRISM_VAULT_PROJECT_SOURCE_STORE)
        .get([route.project_id, route.source_id])
      membershipRequest.onsuccess = () => {
        const membership = membershipRequest.result as ProjectSourceMembership | undefined
        if (!membership) {
          failure = new Error('This route step no longer has a project source record.')
          transaction.abort()
          return
        }
        try {
          next = change(route, membership)
        } catch (cause) {
          failure = cause instanceof Error ? cause : new Error('The route step could not be updated.')
          transaction.abort()
          return
        }
        routeStore.put(next)
        const projectRequest = transaction.objectStore(PRISM_VAULT_PROJECT_STORE).get(route.project_id)
        projectRequest.onsuccess = () => {
          const project = projectRequest.result as BrowserProject | undefined
          if (!project) {
            failure = new Error('This project no longer exists.')
            transaction.abort()
            return
          }
          transaction.objectStore(PRISM_VAULT_PROJECT_STORE).put({ ...project, updated_at: timestamp })
        }
        projectRequest.onerror = () => {
          failure = projectRequest.error ?? new Error('The project could not be read.')
        }
      }
      membershipRequest.onerror = () => {
        failure = membershipRequest.error ?? new Error('The project source membership could not be read.')
      }
    }
    routeRequest.onerror = () => {
      failure = routeRequest.error ?? new Error('The route step could not be read.')
    }
    transaction.oncomplete = () => next
      ? resolve(next)
      : reject(failure ?? new Error('The route step was not saved.'))
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The route step could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The route step save was interrupted.'),
    )
  })
}

function deleteProjectRecord(database: IDBDatabase, projectId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_PROJECT_STORE, PRISM_VAULT_PROJECT_SOURCE_STORE, PRISM_VAULT_PROJECT_ROUTE_STORE],
      'readwrite',
    )
    transaction.objectStore(PRISM_VAULT_PROJECT_STORE).delete(projectId)
    deleteByProjectInTransaction(transaction, PRISM_VAULT_PROJECT_SOURCE_STORE, projectId)
    deleteByProjectInTransaction(transaction, PRISM_VAULT_PROJECT_ROUTE_STORE, projectId)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('The project could not be removed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('The project removal was interrupted.'))
  })
}

function detachBySourceInTransaction<T extends { source_id: string }>(
  transaction: IDBTransaction,
  storeName: string,
  sourceRange: IDBKeyRange,
  detached: (record: T) => T,
): void {
  const request = transaction.objectStore(storeName).index('source_id').openCursor(sourceRange)
  request.onsuccess = () => {
    const cursor = request.result
    if (!cursor) return
    transaction.objectStore(storeName).put(detached(cursor.value as T))
    cursor.continue()
  }
}

function deleteByProjectInTransaction(
  transaction: IDBTransaction,
  storeName: string,
  projectId: string,
): void {
  const request = transaction.objectStore(storeName).index('project_id').openCursor(projectId)
  request.onsuccess = () => {
    const cursor = request.result
    if (!cursor) return
    transaction.objectStore(storeName).delete(cursor.primaryKey)
    cursor.continue()
  }
}

function normalizeProjectInput(input: CreateBrowserProjectInput): CreateBrowserProjectInput {
  const intendedDepth = requiredEnum(input.intended_depth, ['overview', 'standard', 'deep'], 'intended_depth')
  return {
    intended_depth: intendedDepth,
    learner_goal: requiredText(input.learner_goal, 'learner_goal', 400),
    name: requiredText(input.name, 'name', 140),
    time_budget_minutes: positiveInteger(input.time_budget_minutes, 'time_budget_minutes', 4_800),
  }
}

function normalizeRouteInput(input: CreateProjectRouteInput): CreateProjectRouteInput {
  const pageStart = positiveInteger(input.page_start, 'page_start', 100_000)
  const pageEnd = positiveInteger(input.page_end, 'page_end', 100_000)
  if (pageEnd < pageStart) throw new Error('page_end must be on or after page_start.')
  return {
    coverage_summary: requiredText(input.coverage_summary, 'coverage_summary', 500),
    estimated_minutes: positiveInteger(input.estimated_minutes, 'estimated_minutes', 240),
    objective: requiredText(input.objective, 'objective', 300),
    page_end: pageEnd,
    page_start: pageStart,
    prerequisite_assumptions: uniqueText(
      input.prerequisite_assumptions,
      'prerequisite_assumptions',
      12,
      240,
    ),
    project_id: requiredIdentifier(input.project_id, 'project_id'),
    source_id: requiredIdentifier(input.source_id, 'source_id'),
    step_order: positiveInteger(input.step_order, 'step_order', 64),
    title: requiredText(input.title, 'title', 140),
    uncertainty_notes: uniqueText(input.uncertainty_notes, 'uncertainty_notes', 12, 240),
  }
}

function isVaultSourceReference(value: unknown): value is VaultSourceReference {
  return typeof value === 'object'
    && value !== null
    && typeof (value as VaultSourceReference).id === 'string'
    && typeof (value as VaultSourceReference).content_hash === 'string'
    && typeof (value as VaultSourceReference).original_name === 'string'
    && Number.isInteger((value as VaultSourceReference).page_count)
    && (value as VaultSourceReference).page_count > 0
}

function requiredEnum<T extends string>(value: unknown, values: T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} is invalid.`)
  }
  return value as T
}

function requiredIdentifier(value: unknown, label: string): string {
  const normalized = requiredText(value, label, 200)
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(normalized)) {
    throw new Error(`${label} contains unsupported characters.`)
  }
  return normalized
}

function requiredTimestamp(value: unknown, label: string): string {
  const timestamp = requiredText(value, label, 64)
  if (Number.isNaN(Date.parse(timestamp))) throw new Error(`${label} is invalid.`)
  return timestamp
}

function requiredText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`)
  const normalized = normalizeText(value)
  if (!normalized) throw new Error(`${label} is required.`)
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`)
  return normalized
}

function uniqueText(value: unknown, label: string, maximum: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${label} is invalid.`)
  return [...new Set(value.map((item) => requiredText(item, label, maxLength)))]
}

function positiveInteger(value: unknown, label: string, maximum: number): number {
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new Error(`${label} must be an integer from 1 to ${maximum}.`)
  }
  return Number(value)
}

function normalizeText(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 ? ' ' : character
  }).join('').replace(/\s+/g, ' ').trim()
}

function getRecord<T>(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The browser-local project record could not be read.'))
  })
}

function allRecords<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('The browser-local project records could not be listed.'))
  })
}

function recordsByIndex<T>(
  database: IDBDatabase,
  storeName: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).index(indexName).getAll(key)
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('The browser-local project records could not be read.'))
  })
}

function putRecord(database: IDBDatabase, storeName: string, value: unknown): Promise<void> {
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(value)
  return transactionComplete(transaction)
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      transaction.error ?? new Error('The browser-local project transaction failed.'),
    )
    transaction.onabort = () => reject(
      transaction.error ?? new Error('The browser-local project transaction was interrupted.'),
    )
  })
}

function currentTime(): string {
  return new Date().toISOString()
}

function randomUUID(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure local identifiers are unavailable.')
  return globalThis.crypto.randomUUID()
}

function notifyVaultChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
}

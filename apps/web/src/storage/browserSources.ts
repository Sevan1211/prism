import { loadPdfjs } from '../pdfjs'
import { pdfDocumentOptions } from '../pdfResources'
import { notifySourcesChanged } from './sourceLibraryEvents'
import type {
  ReadingState,
  RightsStatus,
  SearchResponse,
  SourceSection,
  SourceStructure,
  SourceSummary,
} from '../types'
import {
  accessBrowserVault,
  PRISM_VAULT_AGENT_GRANT_STORE,
  PRISM_VAULT_AGENT_ACTIVITY_STORE,
  PRISM_VAULT_CHANGED_EVENT,
  PRISM_VAULT_LESSON_BRIEF_STORE,
  PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
  PRISM_VAULT_LESSON_DOCUMENT_STORE,
  PRISM_VAULT_LESSON_EDIT_STORE,
  PRISM_VAULT_ILLUSTRATION_STORE,
  PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
  PRISM_VAULT_LESSON_OUTCOME_STORE,
  PRISM_VAULT_LESSON_PLAN_STORE,
  PRISM_VAULT_PROJECT_ROUTE_STORE,
  PRISM_VAULT_PROJECT_SOURCE_STORE,
  PRISM_VAULT_READING_STATE_STORE,
  PRISM_VAULT_SOURCE_PAGE_STORE,
  PRISM_VAULT_SOURCE_STORE,
  type BrowserVaultEnvironment,
} from './browserVault'
import { detachProjectSourceInTransaction } from './browserProjects'
import { extractSourcePagesInWorker, type SourcePageExtractor } from './sourceIndexWorker'
import {
  BROWSER_TEXT_INDEX_VERSION,
  isSupportedEvidenceVersion,
  type BrowserEvidenceBundle,
  type BrowserIndexStatus,
  type BrowserScopeManifest,
  type BrowserSourceMap,
  type IndexedSourcePage,
  type IndexedTextFragment,
  type ScopeManifestItem,
  type SourceAnchor,
  type SourceElementKind,
  type SourceEvidenceItem,
} from './sourceIndexTypes'

const SOURCE_DIRECTORY = 'sources'
const MAX_BROWSER_SOURCE_BYTES = 128 * 1024 * 1024
const MINIMUM_QUOTA_HEADROOM = 10 * 1024 * 1024
const DEFAULT_MANIFEST_LIMIT = 12
const MAX_MANIFEST_LIMIT = 16
const MAX_EVIDENCE_ELEMENTS = 12
const MAX_EVIDENCE_CHARACTERS = 12_000

export type SourceLocation = 'browser_vault' | 'local_companion'
export type LibrarySource = SourceSummary & {
  agent_content_granted?: boolean
  agent_visual_granted?: boolean
  browser_index?: BrowserIndexStatus
  storage_location: SourceLocation
}

interface SourceAgentGrant {
  granted_at: string
  payload_classes: Array<'derived_structure' | 'text_spans' | 'page_images'>
  source_hash: string
  source_id: string
}

interface BrowserSourceRecord extends LibrarySource {
  file_name: string
  record_version: 1 | 2
}

export interface BrowserSourceDependencies {
  digest?: (file: File) => Promise<string>
  environment?: BrowserVaultEnvironment
  inspectPdf?: (file: File) => Promise<number>
}

export interface BrowserSourceIndexOptions {
  environment?: BrowserVaultEnvironment
  extractor?: SourcePageExtractor
  onStatus?: (status: BrowserIndexStatus) => void
}

export function companionSource(source: SourceSummary): LibrarySource {
  return { ...source, storage_location: 'local_companion' }
}

export async function importBrowserSource(
  file: File,
  rightsStatus: RightsStatus,
  dependencies: BrowserSourceDependencies = {},
): Promise<LibrarySource> {
  validatePdfSelection(file)
  const environment = dependencies.environment
  await assertQuota(file.size, environment)
  const digest = await (dependencies.digest ?? sha256)(file)

  return accessBrowserVault(async (database, directory) => {
    const duplicate = await sourceByHash(database, digest)
    if (duplicate) return duplicate

    const pageCount = await (dependencies.inspectPdf ?? inspectPdf)(file)
    const id = `local_${digest}`
    const fileName = `${digest}.pdf`
    const createdAt = new Date().toISOString()
    const record: BrowserSourceRecord = {
      browser_index: pendingIndex(pageCount),
      cloud_policy: 'local_only',
      content_hash: digest,
      created_at: createdAt,
      file_name: fileName,
      id,
      original_name: file.name,
      page_count: pageCount,
      record_version: 2,
      rights_status: rightsStatus,
      size_bytes: file.size,
      status: 'source_ready',
      storage_location: 'browser_vault',
    }

    const sourceDirectory = await directory.getDirectoryHandle(SOURCE_DIRECTORY, { create: true })
    const fileHandle = await sourceDirectory.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()
    try {
      await writable.write(file)
      await writable.close()
    } catch (cause) {
      await writable.abort?.().catch(() => undefined)
      await sourceDirectory.removeEntry(fileName).catch(() => undefined)
      throw cause
    }

    try {
      await addRecord(database, PRISM_VAULT_SOURCE_STORE, record)
    } catch (cause) {
      const concurrentDuplicate = await sourceByHash(database, digest)
      if (concurrentDuplicate) return concurrentDuplicate
      await sourceDirectory.removeEntry(fileName).catch(() => undefined)
      throw cause
    }
    notifyVaultChanged()
    return record
  }, environment)
}

export function listBrowserSources(
  environment?: BrowserVaultEnvironment,
): Promise<LibrarySource[]> {
  return accessBrowserVault(async (database) => {
    const [records, grants] = await Promise.all([
      allRecords<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE),
      allRecords<SourceAgentGrant>(database, PRISM_VAULT_AGENT_GRANT_STORE),
    ])
    const grantBySource = new Map(grants.map((grant) => [grant.source_id, grant]))
    return records
      .map((record) => {
        const grant = grantBySource.get(record.id)
        return {
          ...record,
          agent_content_granted: grant?.source_hash === record.content_hash,
          agent_visual_granted: grant?.source_hash === record.content_hash && grant.payload_classes.includes('page_images'),
          browser_index: currentIndexStatus(record),
        }
      })
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
  }, environment)
}

export function setBrowserAgentContentAccess(
  sourceId: string,
  granted: boolean,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    const transaction = database.transaction(PRISM_VAULT_AGENT_GRANT_STORE, 'readwrite')
    const store = transaction.objectStore(PRISM_VAULT_AGENT_GRANT_STORE)
    if (granted) {
      store.put({
        granted_at: new Date().toISOString(),
        payload_classes: ['derived_structure', 'text_spans', 'page_images'],
        source_hash: source.content_hash,
        source_id: source.id,
      } satisfies SourceAgentGrant)
    } else {
      store.delete(source.id)
    }
    await transactionComplete(transaction)
    notifyVaultChanged()
  }, environment)
}

export async function indexBrowserSource(
  sourceId: string,
  options: BrowserSourceIndexOptions = {},
): Promise<BrowserIndexStatus> {
  const environment = options.environment
  const source = await getBrowserSourceRecord(sourceId, environment)
  if (!source) throw new Error('This browser-local source no longer exists.')
  const file = await getBrowserSourceFile(sourceId, environment)
  const previous = source.browser_index ?? pendingIndex(source.page_count ?? 0)
  // Completed indexes are immutable evidence for existing lessons. Retain a
  // supported older version instead of silently replacing its anchor IDs.
  if (previous.state === 'ready' && isSupportedEvidenceVersion(previous.parser_version)) return previous
  const resetRequired = previous.parser_version !== BROWSER_TEXT_INDEX_VERSION
  if (resetRequired) await clearSourcePages(sourceId, environment)

  let persistedPages = resetRequired ? 0 : Math.min(previous.pages_indexed, source.page_count ?? 0)
  let status: BrowserIndexStatus = {
    error: null,
    pages_indexed: persistedPages,
    parser_version: BROWSER_TEXT_INDEX_VERSION,
    state: 'indexing',
    total_pages: source.page_count ?? previous.total_pages,
  }
  await storeIndexStatus(sourceId, status, environment)
  options.onStatus?.(status)

  try {
    if (persistedPages < status.total_pages) {
      await (options.extractor ?? extractSourcePagesInWorker)(
        file,
        sourceId,
        persistedPages + 1,
        {
          onBatch: async (pages) => {
            const lastPage = pages.at(-1)?.page_number ?? persistedPages
            const nextStatus = { ...status, pages_indexed: Math.max(persistedPages, lastPage) }
            await storePageBatch(sourceId, pages, nextStatus, environment)
            persistedPages = nextStatus.pages_indexed
            status = nextStatus
            options.onStatus?.(status)
          },
        },
      )
    }
    if (persistedPages !== status.total_pages) {
      throw new Error(
        `Local indexing stopped after page ${persistedPages} of ${status.total_pages}. Resume the index to finish.`,
      )
    }
    status = { ...status, error: null, pages_indexed: persistedPages, state: 'ready' }
    await storeIndexStatus(sourceId, status, environment)
    options.onStatus?.(status)
    notifyVaultChanged()
    return status
  } catch (cause) {
    status = {
      ...status,
      error: safeIndexError(cause),
      pages_indexed: persistedPages,
      state: 'failed',
    }
    await storeIndexStatus(sourceId, status, environment).catch(() => undefined)
    options.onStatus?.(status)
    notifyVaultChanged()
    throw cause
  }
}

export function searchBrowserSource(
  sourceId: string,
  query: string,
  limit = 40,
  environment?: BrowserVaultEnvironment,
): Promise<SearchResponse> {
  const trimmed = query.trim().slice(0, 200)
  if (!trimmed) return Promise.resolve({ hits: [], query: trimmed, source_id: sourceId })
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    if (
      source.browser_index?.state !== 'ready'
      || !isSupportedEvidenceVersion(source.browser_index.parser_version)
    ) {
      throw new Error('Local search is not ready. Build or resume the source index first.')
    }
    const pages = await pageRecordsBySource(database, sourceId, environment)
    return {
      hits: searchIndexedPages(pages, trimmed, limit),
      query: trimmed,
      source_id: sourceId,
    }
  }, environment)
}

export function getBrowserSourceStructure(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<SourceStructure> {
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    const status = currentIndexStatus(source)
    if (status.state !== 'ready') {
      return { origin: 'none', sections: [], source_id: sourceId }
    }
    const pages = await pageRecordsBySource(database, sourceId, environment)
    const sections = computedBrowserSections(
      pages.flatMap((page) => page.elements ?? []),
      source.page_count ?? 0,
    )
    return {
      origin: sections.length > 0 ? 'computed' : 'none',
      sections,
      source_id: sourceId,
    }
  }, environment)
}

function computedBrowserSections(
  elements: IndexedSourcePage['elements'],
  pageCount: number,
): SourceSection[] {
  const candidates: Array<{ level: number; page: number; title: string }> = []
  const seen = new Set<string>()
  for (const element of elements) {
    if (element.kind !== 'heading_candidate') continue
    const title = element.text.trim().replace(/\s+/g, ' ').slice(0, 200)
    const sectionNumber = /^(\d+(?:\.\d+)*)\.?\s+\S/.exec(title)
    const isChapter = /^chapter\s+(?:\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i
      .test(title)
    if (!isChapter && !sectionNumber) continue
    const key = `${element.page_number}:${title.toLocaleLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    candidates.push({
      level: isChapter ? 1 : (sectionNumber?.[1].match(/\./g)?.length ?? 0) + 1,
      page: element.page_number,
      title,
    })
  }
  candidates.sort((left, right) => left.page - right.page || left.level - right.level)

  const parents = new Map<number, string>()
  return candidates.map((candidate, index) => {
    const nextBoundary = candidates.slice(index + 1).find((later) => (
      later.level <= candidate.level && later.page >= candidate.page
    ))
    const id = `detected-${index}-${candidate.page}`
    const section: SourceSection = {
      confidence: 0.6,
      id,
      level: candidate.level,
      origin: 'computed',
      page_end: nextBoundary ? Math.max(candidate.page, nextBoundary.page - 1) : pageCount,
      page_start: candidate.page,
      parent_id: parents.get(candidate.level - 1) ?? null,
      title: candidate.title,
    }
    parents.set(candidate.level, id)
    for (const depth of [...parents.keys()]) {
      if (depth > candidate.level) parents.delete(depth)
    }
    return section
  })
}

/** A bounded page read for visual inspection and resumable source review. */
export function getBrowserSourcePages(sourceId: string, pageStart: number, pageEnd: number, environment?: BrowserVaultEnvironment): Promise<IndexedSourcePage[]> {
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    assertCurrentEvidenceIndex(source)
    const range = validPageRange(pageStart, pageEnd, source.page_count ?? 0)
    if (range.end - range.start >= 8) throw new Error('Read at most 8 pages per request.')
    const pages = await pageRecordsByNumber(database, sourceId, Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i))
    if (pages.length !== range.end - range.start + 1) throw new Error('Requested pages are missing. Resume indexing first.')
    return pages.sort((a, b) => a.page_number - b.page_number)
  }, environment)
}

// Page evidence exists independently of text extraction, including scanned pages.
// This anchor identifies pixels; it does not claim OCR or visual understanding.
export function pageImageElement(page: IndexedSourcePage): IndexedSourcePage['elements'][number] {
  return { bbox_normalized: [0, 0, 1, 1], confidence: 0, element_id: `${page.source_id}:page:${page.page_number}:image:${page.index_version}`, kind: 'page_image', order: -1, page_number: page.page_number, reasons: ['original_page_image', 'requires_visual_inspection'], status: 'transform_with_warning', text: '' }
}

export function getBrowserSourceMap(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<BrowserSourceMap> {
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    const indexStatus = currentIndexStatus(source)
    const indexReady = indexStatus.state === 'ready'
    const warnings = [
      'candidate_structure_only',
      'reading_order_unverified',
      'visual_inventory_not_indexed',
      'semantic_candidates_not_inferred',
    ]
    if (!indexReady) warnings.unshift('source_index_not_ready')
    return {
      capabilities: {
        exact_search: indexReady,
        lesson_compilation: false,
        render_original: true,
        scope_manifest: indexReady,
        structural_detection: 'candidate_only',
        visual_detection: 'not_available',
      },
      content_hash: source.content_hash,
      index_status: indexStatus,
      name: source.original_name,
      outline: indexReady ? computedBrowserSections((await pageRecordsBySource(database, sourceId, environment)).flatMap((page) => page.elements ?? []), source.page_count ?? 0) : [],
      page_count: source.page_count ?? 0,
      page_labels: 'pdf_page_index_only',
      parser_version: indexStatus.parser_version,
      source_id: source.id,
      warnings,
    }
  }, environment)
}

export function getBrowserScopeManifest(
  sourceId: string,
  pageStart: number,
  pageEnd: number,
  cursor = '0',
  limit = DEFAULT_MANIFEST_LIMIT,
  environment?: BrowserVaultEnvironment,
): Promise<BrowserScopeManifest> {
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    assertCurrentEvidenceIndex(source)
    const range = validPageRange(pageStart, pageEnd, source.page_count ?? 0)
    const offset = manifestOffset(cursor)
    if (range.end - range.start >= 32) throw new Error('For scopes over 32 pages, use read_source_page and record_scope_review, then propose coverage_ranges.')
    const pageLimit = Math.min(MAX_MANIFEST_LIMIT, Math.max(1, Math.trunc(limit)))
    const pages = (await pageRecordsByNumber(database, sourceId, Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start + index)))
      .sort((left, right) => left.page_number - right.page_number)
    if (pages.length !== range.end - range.start + 1) {
      throw new Error('The requested range is missing indexed pages. Resume the local index first.')
    }
    const allElements = pages.flatMap((page) => page.elements ?? [])
    if (offset > allElements.length) throw new Error('The scope-manifest cursor is out of range.')
    const items = allElements.slice(offset, offset + pageLimit).map((element) => (
      manifestItem(source, element)
    ))
    const nextOffset = offset + items.length
    const elementCounts: Partial<Record<SourceElementKind, number>> = {}
    for (const element of allElements) {
      elementCounts[element.kind] = (elementCounts[element.kind] ?? 0) + 1
    }
    const warnings = uniqueStrings([
      'candidate_structure_only',
      ...pages.flatMap((page) => page.profile?.warnings ?? ['legacy_page_record']),
    ])
    return {
      complete_for_range: nextOffset >= allElements.length,
      cursor: String(offset),
      inventory: {
        element_counts: elementCounts,
        pages_source_only: pages.filter((page) => page.profile?.layout_state !== 'linear_candidate').length,
        pages_with_embedded_text: pages.filter(
          (page) => (page.profile?.embedded_text_characters ?? 0) > 0,
        ).length,
      },
      items,
      next_cursor: nextOffset < allElements.length ? String(nextOffset) : null,
      omissions: [
        'visual_objects_not_indexed',
        'semantic_definition_and_claim_candidates_not_inferred',
        'cross_references_not_resolved',
        'section_hierarchy_not_verified',
      ],
      page_end: range.end,
      page_start: range.start,
      parser_version: currentIndexStatus(source).parser_version,
      source_id: sourceId,
      warnings,
    }
  }, environment)
}

export function readBrowserSourceBundle(
  sourceId: string,
  elementIds: string[],
  contextRadius = 1,
  environment?: BrowserVaultEnvironment,
): Promise<BrowserEvidenceBundle> {
  const requestedIds = [...new Set(elementIds)].slice(0, MAX_EVIDENCE_ELEMENTS)
  if (requestedIds.length === 0) {
    return Promise.reject(new Error('At least one source element id is required.'))
  }
  const radius = Math.min(2, Math.max(0, Math.trunc(contextRadius)))
  return accessBrowserVault(async (database) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    assertCurrentEvidenceIndex(source)
    const prefix = `${sourceId}:page:`
    const requestedPages = [...new Set(requestedIds.filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(prefix.length).split(':')[0])))].filter((page) => Number.isInteger(page) && page >= 1 && page <= (source.page_count ?? 0))
    const pages = (await pageRecordsByNumber(database, sourceId, requestedPages))
      .sort((left, right) => left.page_number - right.page_number)
    const byId = new Map(pages.flatMap((page) => (
      [...(page.elements ?? []), pageImageElement(page)].map((element) => [element.element_id, { element, page }] as const)
    )))
    const included = new Map<string, { contextFor: Set<string>; element: IndexedSourcePage['elements'][number] }>()
    for (const requestedId of requestedIds) {
      const match = byId.get(requestedId)
      if (!match) continue
      const pageElements = match.element.kind === 'page_image' ? [match.element] : match.page.elements ?? []
      const position = pageElements.findIndex((element) => element.element_id === requestedId)
      const start = Math.max(0, position - radius)
      const end = Math.min(pageElements.length, position + radius + 1)
      for (const element of pageElements.slice(start, end)) {
        const existing = included.get(element.element_id)
        if (existing) existing.contextFor.add(requestedId)
        else included.set(element.element_id, { contextFor: new Set([requestedId]), element })
      }
    }

    let characterCount = 0
    const elements: SourceEvidenceItem[] = []
    const includedRequested = new Set<string>()
    // Requested passages take priority over nearby context. Context cannot make
    // a missing requested passage look complete when the character budget fills.
    const orderedEntries = [...included.values()].sort((left, right) => Number(requestedIds.includes(right.element.element_id)) - Number(requestedIds.includes(left.element.element_id)))
    for (const entry of orderedEntries) {
      if (characterCount + entry.element.text.length > MAX_EVIDENCE_CHARACTERS) continue
      characterCount += entry.element.text.length
      if (requestedIds.includes(entry.element.element_id)) includedRequested.add(entry.element.element_id)
      elements.push({
        anchor: sourceAnchor(source, entry.element),
        confidence: entry.element.confidence,
        context_for: [...entry.contextFor],
        kind: entry.element.kind,
        reasons: entry.element.reasons,
        status: entry.element.status,
        text: entry.element.text,
      })
    }
    const omitted = requestedIds.filter((id) => !includedRequested.has(id))
    return {
      bundle_complete: omitted.length === 0,
      elements,
      omitted_element_ids: omitted,
      parser_version: currentIndexStatus(source).parser_version,
      source_id: sourceId,
      warnings: [
        'source_verbatim_extraction_with_unverified_reading_order',
        'rendered_page_remains_authoritative',
      ],
    }
  }, environment)
}

export function searchIndexedPages(
  pages: IndexedSourcePage[],
  query: string,
  limit = 40,
): SearchResponse['hits'] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []
  const hits: SearchResponse['hits'] = []
  const orderedPages = [...pages].sort((left, right) => left.page_number - right.page_number)

  for (const page of orderedPages) {
    const mapped = searchablePage(page.fragments)
    let offset = 0
    while (hits.length < limit) {
      const matchStart = mapped.text.indexOf(normalizedQuery, offset)
      if (matchStart < 0) break
      const matchEnd = matchStart + normalizedQuery.length
      const matchingFragments = mapped.fragments.filter(
        (fragment) => fragment.end > matchStart && fragment.start < matchEnd,
      )
      const matchBounds = unionBounds(matchingFragments.map((fragment) => fragment.bounds))
      const sourceElement = page.elements?.find((element) => (
        normalizeSearchText(element.text).includes(normalizedQuery)
        && boundsOverlap(element.bbox_normalized, matchBounds)
      ))
      hits.push({
        bbox_normalized: matchBounds,
        document_region: 'body',
        element_id: sourceElement?.element_id
          ?? `${page.source_id}:page:${page.page_number}:match:${matchStart}`,
        kind: sourceElement ? searchHitKind(sourceElement.kind) : 'paragraph',
        page_number: page.page_number,
        snippet: searchSnippet(mapped.text, matchStart, matchEnd),
        status: 'transform_with_warning',
      })
      offset = Math.max(matchEnd, matchStart + 1)
    }
    if (hits.length >= limit) break
  }
  return hits
}

export async function createBrowserSourceObjectUrl(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<{ revoke: () => void; url: string }> {
  const file = await getBrowserSourceFile(sourceId, environment)
  const url = URL.createObjectURL(file)
  return { url, revoke: () => URL.revokeObjectURL(url) }
}

export function getBrowserReadingState(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<ReadingState> {
  return accessBrowserVault(async (database) => {
    const existing = await getRecord<ReadingState>(
      database,
      PRISM_VAULT_READING_STATE_STORE,
      sourceId,
    )
    return existing ?? emptyReadingState(sourceId)
  }, environment)
}

export function updateBrowserReadingState(
  sourceId: string,
  lastPage: number,
  lastScrollRatio: number,
  environment?: BrowserVaultEnvironment,
): Promise<ReadingState> {
  return accessBrowserVault(async (database) => {
    const current = await getRecord<ReadingState>(
      database,
      PRISM_VAULT_READING_STATE_STORE,
      sourceId,
    )
    const next: ReadingState = {
      furthest_page: Math.max(current?.furthest_page ?? 1, lastPage),
      last_page: lastPage,
      last_scroll_ratio: lastScrollRatio,
      source_id: sourceId,
      updated_at: new Date().toISOString(),
    }
    await putRecord(database, PRISM_VAULT_READING_STATE_STORE, next)
    return next
  }, environment)
}

export function deleteBrowserSource(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  return accessBrowserVault(async (database, directory) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) return

    const transaction = database.transaction(
      [
        PRISM_VAULT_SOURCE_STORE,
        PRISM_VAULT_READING_STATE_STORE,
        PRISM_VAULT_SOURCE_PAGE_STORE,
        PRISM_VAULT_LESSON_BRIEF_STORE,
        PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
        PRISM_VAULT_LESSON_PLAN_STORE,
        PRISM_VAULT_LESSON_DOCUMENT_STORE,
        PRISM_VAULT_LESSON_EDIT_STORE,
        PRISM_VAULT_ILLUSTRATION_STORE,
        PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
        PRISM_VAULT_LESSON_OUTCOME_STORE,
        PRISM_VAULT_PROJECT_SOURCE_STORE,
        PRISM_VAULT_PROJECT_ROUTE_STORE,
        PRISM_VAULT_AGENT_GRANT_STORE,
        PRISM_VAULT_AGENT_ACTIVITY_STORE,
      ],
      'readwrite',
    )
    transaction.objectStore(PRISM_VAULT_SOURCE_STORE).delete(sourceId)
    transaction.objectStore(PRISM_VAULT_READING_STATE_STORE).delete(sourceId)
    transaction.objectStore(PRISM_VAULT_AGENT_GRANT_STORE).delete(sourceId)
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_AGENT_ACTIVITY_STORE,
      keyRange(environment).only(sourceId),
    )
    deletePagesInTransaction(transaction, keyRange(environment).only(sourceId))
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_BRIEF_STORE,
      keyRange(environment).only(sourceId),
    )
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_PLAN_STORE,
      keyRange(environment).only(sourceId),
    )
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_DOCUMENT_STORE,
      keyRange(environment).only(sourceId),
    )
    deleteBySourceInTransaction(transaction, PRISM_VAULT_LESSON_EDIT_STORE, keyRange(environment).only(sourceId))
    deleteBySourceInTransaction(transaction, PRISM_VAULT_ILLUSTRATION_STORE, keyRange(environment).only(sourceId))
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_DOCUMENT_REVISION_STORE,
      keyRange(environment).only(sourceId),
    )
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_ANSWER_ANALYSIS_STORE,
      keyRange(environment).only(sourceId),
    )
    deleteBySourceInTransaction(
      transaction,
      PRISM_VAULT_LESSON_OUTCOME_STORE,
      keyRange(environment).only(sourceId),
    )
    detachProjectSourceInTransaction(
      transaction,
      keyRange(environment).only(sourceId),
      new Date().toISOString(),
    )
    await transactionComplete(transaction)

    const sourceDirectory = await directory.getDirectoryHandle(SOURCE_DIRECTORY, { create: true })
    await sourceDirectory.removeEntry(source.file_name).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'NotFoundError')) throw cause
    })
    notifyVaultChanged()
  }, environment)
}

async function getBrowserSourceFile(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<File> {
  return accessBrowserVault(async (database, directory) => {
    const source = await getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId)
    if (!source) throw new Error('This browser-local source no longer exists.')
    const sourceDirectory = await directory.getDirectoryHandle(SOURCE_DIRECTORY, { create: false })
    const fileHandle = await sourceDirectory.getFileHandle(source.file_name)
    return fileHandle.getFile()
  }, environment)
}

function validatePdfSelection(file: File): void {
  if (file.size === 0) throw new Error('Choose a non-empty PDF.')
  if (file.size > MAX_BROWSER_SOURCE_BYTES) {
    throw new Error('This browser-local importer currently supports PDFs up to 128 MB.')
  }
  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.')
  }
}

async function assertQuota(
  fileSize: number,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  const storage = environment?.storage
    ?? (typeof navigator === 'undefined' ? undefined : navigator.storage)
  if (!storage?.estimate) {
    throw new Error('Browser storage quota could not be checked; the source was not copied.')
  }
  const estimate = await storage.estimate()
  const quota = estimate.quota
  const usage = estimate.usage
  if (typeof quota !== 'number' || typeof usage !== 'number') {
    throw new Error('Browser storage quota could not be checked; the source was not copied.')
  }
  const required = fileSize + Math.max(MINIMUM_QUOTA_HEADROOM, fileSize * 0.1)
  if (quota - usage < required) {
    throw new Error('Not enough browser-local storage is available for this PDF and its indexes.')
  }
}

async function sha256(file: File): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('Secure source fingerprinting is unavailable in this browser.')
  const digest = await subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function inspectPdf(file: File): Promise<number> {
  const pdfjs = await loadPdfjs()
  const url = URL.createObjectURL(file)
  let task: ReturnType<typeof pdfjs.getDocument> | undefined
  try {
    task = pdfjs.getDocument({ url, ...pdfDocumentOptions(pdfjs.version) })
    const document = await task.promise
    if (document.numPages < 1) throw new Error('The selected PDF has no readable pages.')
    return document.numPages
  } catch (cause) {
    throw new Error(
      cause instanceof Error ? `The selected PDF could not be opened: ${cause.message}` : 'The selected PDF could not be opened.',
      { cause },
    )
  } finally {
    try { await task?.destroy() } finally { URL.revokeObjectURL(url) }
  }
}

function emptyReadingState(sourceId: string): ReadingState {
  return {
    furthest_page: 1,
    last_page: 1,
    last_scroll_ratio: 0,
    source_id: sourceId,
    updated_at: null,
  }
}

function pendingIndex(totalPages: number): BrowserIndexStatus {
  return {
    error: null,
    pages_indexed: 0,
    parser_version: BROWSER_TEXT_INDEX_VERSION,
    state: 'pending',
    total_pages: totalPages,
  }
}

function currentIndexStatus(source: BrowserSourceRecord): BrowserIndexStatus {
  const status = source.browser_index
  if (!status || !isSupportedEvidenceVersion(status.parser_version)) {
    return pendingIndex(source.page_count ?? 0)
  }
  return status
}

function assertCurrentEvidenceIndex(source: BrowserSourceRecord): void {
  const status = currentIndexStatus(source)
  if (status.state !== 'ready') {
    throw new Error('Local source evidence is not ready. Build or resume the source index first.')
  }
}

function validPageRange(
  pageStart: number,
  pageEnd: number,
  pageCount: number,
): { end: number; start: number } {
  const start = Math.trunc(pageStart)
  const end = Math.trunc(pageEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
    throw new Error('Choose a valid inclusive page range.')
  }
  if (end > pageCount) throw new Error(`This source has ${pageCount} pages.`)
  return { end, start }
}

function manifestOffset(cursor: string): number {
  if (!/^\d+$/.test(cursor)) throw new Error('The scope-manifest cursor is invalid.')
  const offset = Number(cursor)
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error('The scope-manifest cursor is invalid.')
  }
  return offset
}

function manifestItem(
  source: BrowserSourceRecord,
  element: IndexedSourcePage['elements'][number],
): ScopeManifestItem {
  const compact = element.text.replace(/\s+/g, ' ').trim()
  return {
    anchor: sourceAnchor(source, element),
    confidence: element.confidence,
    kind: element.kind,
    preview: compact.length > 180 ? `${compact.slice(0, 179)}…` : compact,
    reasons: element.reasons,
    status: element.status,
  }
}

function sourceAnchor(
  source: BrowserSourceRecord,
  element: IndexedSourcePage['elements'][number],
): SourceAnchor {
  return {
    bbox_normalized: element.bbox_normalized,
    element_id: element.element_id,
    end_offset: null,
    id: `${element.element_id}:anchor`,
    parser_version: currentIndexStatus(source).parser_version,
    pdf_page_index: element.page_number,
    printed_page_label: null,
    section_id: null,
    source_hash: source.content_hash,
    start_offset: null,
    text_snapshot_hash: null,
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function getBrowserSourceRecord(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<BrowserSourceRecord | undefined> {
  return accessBrowserVault(
    (database) => getRecord<BrowserSourceRecord>(database, PRISM_VAULT_SOURCE_STORE, sourceId),
    environment,
  )
}

function storeIndexStatus(
  sourceId: string,
  status: BrowserIndexStatus,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  return accessBrowserVault(
    (database) => updateSourceIndexInDatabase(database, sourceId, status),
    environment,
  )
}

function storePageBatch(
  sourceId: string,
  pages: IndexedSourcePage[],
  status: BrowserIndexStatus,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  if (pages.length === 0) return Promise.resolve()
  return accessBrowserVault((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [PRISM_VAULT_SOURCE_STORE, PRISM_VAULT_SOURCE_PAGE_STORE],
      'readwrite',
    )
    let failure: Error | null = null
    const sources = transaction.objectStore(PRISM_VAULT_SOURCE_STORE)
    const sourceRequest = sources.get(sourceId)
    sourceRequest.onsuccess = () => {
      const source = sourceRequest.result as BrowserSourceRecord | undefined
      if (!source) {
        failure = new Error('The browser-local source was removed while indexing.')
        transaction.abort()
        return
      }
      const pageStore = transaction.objectStore(PRISM_VAULT_SOURCE_PAGE_STORE)
      for (const page of pages) pageStore.put(page)
      sources.put({ ...source, browser_index: status, record_version: 2 })
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The local page-index transaction failed.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The local page-index transaction was interrupted.'),
    )
  }), environment)
}

function updateSourceIndexInDatabase(
  database: IDBDatabase,
  sourceId: string,
  status: BrowserIndexStatus,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PRISM_VAULT_SOURCE_STORE, 'readwrite')
    let failure: Error | null = null
    const store = transaction.objectStore(PRISM_VAULT_SOURCE_STORE)
    const request = store.get(sourceId)
    request.onsuccess = () => {
      const source = request.result as BrowserSourceRecord | undefined
      if (!source) {
        failure = new Error('This browser-local source no longer exists.')
        transaction.abort()
        return
      }
      store.put({ ...source, browser_index: status, record_version: 2 })
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(
      failure ?? transaction.error ?? new Error('The local index status could not be saved.'),
    )
    transaction.onabort = () => reject(
      failure ?? transaction.error ?? new Error('The local index status update was interrupted.'),
    )
  })
}

function clearSourcePages(
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<void> {
  return accessBrowserVault((database) => {
    const transaction = database.transaction(PRISM_VAULT_SOURCE_PAGE_STORE, 'readwrite')
    deletePagesInTransaction(transaction, keyRange(environment).only(sourceId))
    return transactionComplete(transaction)
  }, environment)
}

function deletePagesInTransaction(
  transaction: IDBTransaction,
  sourceRange: IDBKeyRange,
): void {
  const index = transaction.objectStore(PRISM_VAULT_SOURCE_PAGE_STORE).index('source_id')
  const request = index.openCursor(sourceRange)
  request.onsuccess = () => {
    const cursor = request.result
    if (!cursor) return
    transaction.objectStore(PRISM_VAULT_SOURCE_PAGE_STORE).delete(cursor.primaryKey)
    cursor.continue()
  }
}

function deleteBySourceInTransaction(
  transaction: IDBTransaction,
  storeName: string,
  sourceRange: IDBKeyRange,
): void {
  const request = transaction.objectStore(storeName).index('source_id').openCursor(sourceRange)
  request.onsuccess = () => {
    const cursor = request.result
    if (!cursor) return
    transaction.objectStore(storeName).delete(cursor.primaryKey)
    cursor.continue()
  }
}

function pageRecordsByNumber(database: IDBDatabase, sourceId: string, pageNumbers: number[]): Promise<IndexedSourcePage[]> {
  if (pageNumbers.length === 0) return Promise.resolve([])
  const store = database.transaction(PRISM_VAULT_SOURCE_PAGE_STORE, 'readonly').objectStore(PRISM_VAULT_SOURCE_PAGE_STORE)
  return Promise.all(pageNumbers.map((pageNumber) => new Promise<IndexedSourcePage | undefined>((resolve, reject) => {
    const request = store.get([sourceId, pageNumber])
    request.onsuccess = () => resolve(request.result as IndexedSourcePage | undefined)
    request.onerror = () => reject(request.error ?? new Error('An indexed page could not be read.'))
  }))).then((pages) => pages.filter((page): page is IndexedSourcePage => Boolean(page)))
}

function pageRecordsBySource(
  database: IDBDatabase,
  sourceId: string,
  environment?: BrowserVaultEnvironment,
): Promise<IndexedSourcePage[]> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(PRISM_VAULT_SOURCE_PAGE_STORE, 'readonly')
      .objectStore(PRISM_VAULT_SOURCE_PAGE_STORE)
      .index('source_id')
      .getAll(keyRange(environment).only(sourceId))
    request.onsuccess = () => resolve(request.result as IndexedSourcePage[])
    request.onerror = () => reject(request.error ?? new Error('The local page index could not be read.'))
  })
}

function keyRange(environment?: BrowserVaultEnvironment): { only: (value: IDBValidKey) => IDBKeyRange } {
  const range = environment?.keyRange
    ?? (typeof IDBKeyRange === 'undefined' ? undefined : IDBKeyRange)
  if (!range) throw new Error('IndexedDB key ranges are unavailable in this browser.')
  return range
}

function searchablePage(fragments: IndexedTextFragment[]): {
  fragments: Array<{
    bounds: IndexedTextFragment['bbox_normalized']
    end: number
    start: number
  }>
  text: string
} {
  let text = ''
  const mapped: Array<{
    bounds: IndexedTextFragment['bbox_normalized']
    end: number
    start: number
  }> = []
  for (const fragment of fragments) {
    const normalized = normalizeSearchText(fragment.text)
    if (!normalized) continue
    if (text.length > 0) text += ' '
    const start = text.length
    text += normalized
    mapped.push({ bounds: fragment.bbox_normalized, end: text.length, start })
  }
  return { fragments: mapped, text }
}

function searchHitKind(kind: SourceElementKind): SearchResponse['hits'][number]['kind'] {
  if (kind === 'heading_candidate') return 'heading'
  if (kind === 'caption_candidate') return 'caption'
  if (kind === 'code_candidate') return 'code'
  return 'paragraph'
}

function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function unionBounds(
  bounds: Array<IndexedTextFragment['bbox_normalized']>,
): [number, number, number, number] {
  if (bounds.length === 0) return [0, 0, 0, 0]
  let left = 1
  let top = 1
  let right = 0
  let bottom = 0
  for (const [nextLeft, nextTop, nextRight, nextBottom] of bounds) {
    left = Math.min(left, nextLeft)
    top = Math.min(top, nextTop)
    right = Math.max(right, nextRight)
    bottom = Math.max(bottom, nextBottom)
  }
  return [left, top, right, bottom]
}

function boundsOverlap(
  left: [number, number, number, number],
  right: number[],
): boolean {
  return left[0] < right[2]
    && left[2] > right[0]
    && left[1] < right[3]
    && left[3] > right[1]
}

function searchSnippet(text: string, start: number, end: number): string {
  const contextStart = Math.max(0, start - 72)
  const contextEnd = Math.min(text.length, end + 72)
  const prefix = contextStart > 0 ? '…' : ''
  const suffix = contextEnd < text.length ? '…' : ''
  return `${prefix}${text.slice(contextStart, start)}[${text.slice(start, end)}]${text.slice(end, contextEnd)}${suffix}`
}

function safeIndexError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : 'The local evidence index stopped.'
  return message.replace(/[\r\n\t]+/g, ' ').slice(0, 240)
}

function notifyVaultChanged(): void {
  notifySourcesChanged()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PRISM_VAULT_CHANGED_EVENT))
  }
}

function sourceByHash(
  database: IDBDatabase,
  digest: string,
): Promise<BrowserSourceRecord | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PRISM_VAULT_SOURCE_STORE, 'readonly')
    const request = transaction.objectStore(PRISM_VAULT_SOURCE_STORE).index('content_hash').get(digest)
    request.onsuccess = () => resolve(request.result as BrowserSourceRecord | undefined)
    request.onerror = () => reject(request.error ?? new Error('Local source lookup failed.'))
  })
}

function allRecords<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('Local records could not be listed.'))
  })
}

function getRecord<T>(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error ?? new Error('The local record could not be read.'))
  })
}

function addRecord(database: IDBDatabase, storeName: string, value: unknown): Promise<void> {
  const transaction = database.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).add(value)
  return transactionComplete(transaction)
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
      transaction.error ?? new Error('The browser-local transaction failed.'),
    )
    transaction.onabort = () => reject(
      transaction.error ?? new Error('The browser-local transaction was interrupted.'),
    )
  })
}

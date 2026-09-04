import type { ModelContextToolResult } from '../webmcp/types'
import {
  accessBrowserVault,
  PRISM_VAULT_AGENT_ACTIVITY_STORE,
  type BrowserVaultEnvironment,
} from './browserVault'

const MAX_ACTIVITY_RECORDS = 300
export const PRISM_ACTIVITY_CHANGED_EVENT = 'prism:activity-changed'

export type AgentActivityKind = 'import' | 'navigation' | 'read' | 'write'
export type AgentActivityOutcome = 'error' | 'refused' | 'success'
export type AgentPayloadClass =
  | 'learner_answer'
  | 'lesson_contract'
  | 'lesson_document'
  | 'local_import'
  | 'navigation'
  | 'source_metadata'
  | 'source_structure'
  | 'source_text'

export interface AgentActivityRecord {
  elapsed_ms?: number
  activity_id: string
  kind: AgentActivityKind
  occurred_at: string
  outcome: AgentActivityOutcome
  payload_classes: AgentPayloadClass[]
  source_id: string | null
  summary: string
  tool_name: string
}

interface ActivityPolicy {
  kind: AgentActivityKind
  payloadClasses: AgentPayloadClass[]
  summary: string
}

const ACTIVITY_POLICIES: Record<string, ActivityPolicy> = {
  import_public_pdf: { kind: 'import', payloadClasses: ['local_import'], summary: 'Imported a requested public PDF into this browser' },
  import_generated_illustration: { kind: 'write', payloadClasses: ['lesson_document'], summary: 'Attached a labeled AI-generated illustration' },
  read_source_packet: { kind: 'read', payloadClasses: ['source_text'], summary: 'Read a bounded multi-page evidence packet' },
  read_source_page: { kind: 'read', payloadClasses: ['source_text'], summary: 'Read an original page’s extracted evidence' },
  open_source_visual: { kind: 'navigation', payloadClasses: ['navigation'], summary: 'Opened original source pixels for inspection' },
  open_lesson: { kind: 'navigation', payloadClasses: ['navigation'], summary: 'Opened an exact lesson' },
  record_scope_review: { kind: 'write', payloadClasses: ['lesson_contract'], summary: 'Saved source coverage review' },
  finalize_lesson: { kind: 'write', payloadClasses: ['lesson_document'], summary: 'Saved a reviewed lesson for reading' },
  propose_lesson_revision: { kind: 'write', payloadClasses: ['lesson_document'], summary: 'Proposed a lesson revision for learner review' },
  apply_lesson_patch: {
    kind: 'write',
    payloadClasses: ['lesson_document'],
    summary: 'Revised the typed lesson draft',
  },
  create_lesson_brief: {
    kind: 'write',
    payloadClasses: ['lesson_contract'],
    summary: 'Saved a learner lesson brief',
  },
  get_lesson_brief: {
    kind: 'read',
    payloadClasses: ['lesson_contract'],
    summary: 'Read a saved learner assignment',
  },
  get_active_lesson_context: {
    kind: 'read',
    payloadClasses: ['lesson_contract'],
    summary: 'Read the active learning surface',
  },
  get_lesson_document: {
    kind: 'read',
    payloadClasses: ['lesson_document'],
    summary: 'Read a bounded lesson draft section',
  },
  get_lesson_end_check: {
    kind: 'read',
    payloadClasses: ['lesson_contract'],
    summary: 'Read lesson questions and evaluation criteria',
  },
  get_lesson_plan: {
    kind: 'read',
    payloadClasses: ['lesson_contract'],
    summary: 'Read a saved lesson plan',
  },
  get_scope_manifest: {
    kind: 'read',
    payloadClasses: ['source_structure'],
    summary: 'Inspected the source scope manifest',
  },
  get_source_map: {
    kind: 'read',
    payloadClasses: ['source_metadata', 'source_structure'],
    summary: 'Inspected the source map',
  },
  list_sources: {
    kind: 'read',
    payloadClasses: ['source_metadata'],
    summary: 'Listed workspace source metadata',
  },
  open_source_location: {
    kind: 'navigation',
    payloadClasses: ['navigation'],
    summary: 'Opened an exact source location',
  },
  prepare_source_import: {
    kind: 'import',
    payloadClasses: ['local_import'],
    summary: 'Opened the visible local import flow',
  },
  propose_lesson_plan: {
    kind: 'write',
    payloadClasses: ['lesson_contract'],
    summary: 'Proposed a coverage-aware lesson plan',
  },
  propose_lesson_outcome: {
    kind: 'write',
    payloadClasses: ['lesson_contract'],
    summary: 'Proposed a learner-controlled lesson outcome',
  },
  read_source_bundle: {
    kind: 'read',
    payloadClasses: ['source_text'],
    summary: 'Read a bounded source evidence bundle',
  },
  search_source: {
    kind: 'read',
    payloadClasses: ['source_text'],
    summary: 'Searched the local source index',
  },
  record_answer_analysis: {
    kind: 'write',
    payloadClasses: ['learner_answer', 'lesson_contract'],
    summary: 'Saved a local evidence-linked answer analysis',
  },
  validate_lesson: {
    kind: 'read',
    payloadClasses: ['lesson_contract', 'lesson_document'],
    summary: 'Validated lesson grounding and coverage',
  },
}

export async function recordWebMcpActivity(
  toolName: string,
  args: Record<string, unknown>,
  result?: ModelContextToolResult,
  cause?: unknown,
  environment?: BrowserVaultEnvironment,
  elapsedMs?: number,
): Promise<void> {
  const policy = ACTIVITY_POLICIES[toolName]
  if (!policy) return

  const responsePayload = parseResult(result)
  const record: AgentActivityRecord = {
    activity_id: createActivityId(),
    kind: policy.kind,
    occurred_at: new Date().toISOString(),
    outcome: cause ? 'error' : hasRefusal(responsePayload) ? 'refused' : 'success',
    payload_classes: policy.payloadClasses,
    source_id: sourceIdFrom(args, responsePayload),
    summary: summaryFor(policy.summary, args),
    tool_name: toolName,
    ...(elapsedMs !== undefined ? { elapsed_ms: Math.max(0, Math.round(elapsedMs)) } : {}),
  }

  await accessBrowserVault((database) => writeActivity(database, record), environment)
  notifyVaultChanged()
}

export function listAgentActivity(
  sourceId: string,
  limit = 12,
  environment?: BrowserVaultEnvironment,
): Promise<AgentActivityRecord[]> {
  return accessBrowserVault((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(PRISM_VAULT_AGENT_ACTIVITY_STORE, 'readonly')
    const request = transaction
      .objectStore(PRISM_VAULT_AGENT_ACTIVITY_STORE)
      .index('source_id')
      .getAll(sourceId)
    request.onsuccess = () => {
      const records = request.result as AgentActivityRecord[]
      resolve(records.sort((left, right) => right.occurred_at.localeCompare(left.occurred_at)).slice(0, limit))
    }
    request.onerror = () => reject(request.error ?? new Error('Agent activity could not be read.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Agent activity read was interrupted.'))
  }), environment)
}

function writeActivity(database: IDBDatabase, record: AgentActivityRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PRISM_VAULT_AGENT_ACTIVITY_STORE, 'readwrite')
    const store = transaction.objectStore(PRISM_VAULT_AGENT_ACTIVITY_STORE)
    store.add(record)
    const count = store.count()
    count.onsuccess = () => {
      let remaining = Math.max(0, count.result - MAX_ACTIVITY_RECORDS)
      if (remaining === 0) return
      const cursor = store.index('occurred_at').openCursor()
      cursor.onsuccess = () => {
        const current = cursor.result
        if (!current || remaining === 0) return
        store.delete(current.primaryKey)
        remaining -= 1
        current.continue()
      }
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Agent activity could not be saved.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Agent activity write was interrupted.'))
  })
}

function parseResult(result?: ModelContextToolResult): unknown {
  const text = result?.content[0]?.text
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function hasRefusal(payload: unknown): boolean {
  return isRecord(payload) && typeof payload.error === 'string'
}

function sourceIdFrom(args: Record<string, unknown>, payload: unknown): string | null {
  if (typeof args.source_id === 'string') return args.source_id
  return findSourceId(payload)
}

function findSourceId(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSourceId(item)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  if (typeof value.source_id === 'string') return value.source_id
  for (const nested of Object.values(value)) {
    const found = findSourceId(nested)
    if (found) return found
  }
  return null
}

function summaryFor(summary: string, args: Record<string, unknown>): string {
  if (Number.isInteger(args.page_start) && Number.isInteger(args.page_end)) {
    const start = Number(args.page_start)
    const end = Number(args.page_end)
    return `${summary} · ${start === end ? `page ${start}` : `pages ${start}-${end}`}`
  }
  if (Array.isArray(args.element_ids)) {
    return `${summary} · ${args.element_ids.length} selected element${args.element_ids.length === 1 ? '' : 's'}`
  }
  if (Number.isInteger(args.page_number)) return `${summary} · page ${String(args.page_number)}`
  return summary
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createActivityId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `activity_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function notifyVaultChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRISM_ACTIVITY_CHANGED_EVENT))
}

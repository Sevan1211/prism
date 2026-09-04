import type { ReadingState } from '../types'
import { recordKey, transactionDone, type PendingCommit, type SyncChange } from './syncDatabase'

function readingState(value: unknown): value is ReadingState {
  if (!value || typeof value !== 'object') return false
  const v = value as ReadingState
  return typeof v.source_id === 'string' && Number.isSafeInteger(v.last_page) && v.last_page > 0
    && Number.isSafeInteger(v.furthest_page) && v.furthest_page >= v.last_page
    && Number.isFinite(v.last_scroll_ratio) && v.last_scroll_ratio >= 0 && v.last_scroll_ratio <= 1
    && (v.updated_at === null || (typeof v.updated_at === 'string' && Number.isFinite(Date.parse(v.updated_at))))
}

// Reading position is a preference, not authored content. Keep the latest dated
// position and the furthest progress from either browser; never merge deletions.
export async function mergeReadingProgress(db: IDBDatabase, pending: PendingCommit[], identity: string, remote: { revision: string; change: SyncChange } | undefined): Promise<boolean> {
  if (!remote || remote.change.store !== 'reading_state' || !readingState(remote.change.value)) return false
  const affected = pending.filter(entry => entry.changes.some(change => recordKey(change.store, change.key) === identity))
  if (!affected.length) return false
  let state = remote.change.value, base = remote.revision
  for (const entry of affected) {
    const change = entry.changes.find(change => recordKey(change.store, change.key) === identity)!
    if (change.store !== 'reading_state' || !readingState(change.value) || change.value.source_id !== state.source_id) return false
  }
  for (const entry of affected) {
    const change = entry.changes.find(change => recordKey(change.store, change.key) === identity)!
    const local = change.value as ReadingState
    const latest = Date.parse(local.updated_at ?? '') >= Date.parse(state.updated_at ?? '') || state.updated_at === null ? local : state
    state = { ...latest, furthest_page: Math.max(state.furthest_page, local.furthest_page) }
    change.value = state; change.base = base; base = entry.id
  }
  const tx = db.transaction(['reading_state', 'sync_outbox', 'sync_meta'], 'readwrite')
  for (const entry of affected) tx.objectStore('sync_outbox').put(entry, entry.id)
  tx.objectStore('reading_state').put(state)
  const cursor = tx.objectStore('sync_meta').openCursor()
  cursor.onsuccess = () => { if (cursor.result) { if (/^(upload:commit:|batch:)/.test(String(cursor.result.key))) cursor.result.delete(); cursor.result.continue() } }
  await transactionDone(tx)
  return true
}

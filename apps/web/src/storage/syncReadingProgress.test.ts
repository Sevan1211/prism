// @vitest-environment node
import { IDBFactory } from 'fake-indexeddb'
import { expect, it } from 'vitest'
import { mergeReadingProgress } from './syncReadingProgress'
import { getRecord, recordKey, putRecord, type PendingCommit } from './syncDatabase'
it('merges simultaneous reading positions across a pending chain without losing the furthest page', async () => {
  const db = await new Promise<IDBDatabase>(resolve => {
    const request = new IDBFactory().open('progress')
    request.onupgradeneeded = () => { request.result.createObjectStore('reading_state', { keyPath: 'source_id' }); request.result.createObjectStore('sync_outbox'); request.result.createObjectStore('sync_meta') }
    request.onsuccess = () => resolve(request.result)
  })
  const state = (last_page: number, furthest_page: number, time: string) => ({ source_id: 'source', last_page, furthest_page, last_scroll_ratio: 0.4, updated_at: `2026-09-04T${time}:00.000Z` })
  const remote = { revision: 'remote', change: { store: 'reading_state', key: 'source', base: null, value: state(8, 237, '04:00') } }
  const pending: PendingCommit[] = [
    { id: 'first', created: 1, changes: [{ store: 'reading_state', key: 'source', base: 'old', value: state(2, 2, '03:00') }] },
    { id: 'second', created: 2, changes: [{ store: 'reading_state', key: 'source', base: 'first', value: state(15, 15, '05:00') }] },
  ]
  await putRecord(db, 'sync_meta', 'upload:commit:first:1', { stale: true })
  expect(await mergeReadingProgress(db, pending, recordKey('reading_state', 'source'), remote)).toBe(true)
  expect(await getRecord(db, 'reading_state', 'source')).toEqual(state(15, 237, '05:00'))
  expect((await getRecord<PendingCommit>(db, 'sync_outbox', 'first'))?.changes[0]).toMatchObject({ base: 'remote', value: state(8, 237, '04:00') })
  expect((await getRecord<PendingCommit>(db, 'sync_outbox', 'second'))?.changes[0].base).toBe('first')
  expect(await getRecord(db, 'sync_meta', 'upload:commit:first:1')).toBeUndefined()
  pending[0].changes[0].value = undefined
  expect(await mergeReadingProgress(db, pending, recordKey('reading_state', 'source'), remote)).toBe(false)
  expect(await mergeReadingProgress(db, pending, recordKey('reading_state', 'source'), { ...remote, change: { ...remote.change, store: 'lesson_documents' } })).toBe(false)
  db.close()
})

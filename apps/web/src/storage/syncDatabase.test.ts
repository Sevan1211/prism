// @vitest-environment node
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, it } from 'vitest'
import { allRecords, getRecord, recordKey, SYNC_STORES, trackSyncWrites, transactionDone, type PendingCommit } from './syncDatabase'
let db: IDBDatabase
beforeEach(async () => {
  db = await new Promise((resolve, reject) => {
    const request = new IDBFactory().open('test')
    request.onupgradeneeded = () => { for (const name of SYNC_STORES) request.result.createObjectStore(name); request.result.createObjectStore('lessons', { keyPath: 'id' }); request.result.createObjectStore('source_agent_grants', { keyPath: 'id' }) }
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
  })
})
it('commits content and its durable outbox atomically, including multiple writes to one item', async () => {
  const tracked = trackSyncWrites(db, () => undefined)
  const tx = tracked.transaction('lessons', 'readwrite')
  tx.objectStore('lessons').put({ id: 'one', text: 'draft' })
  tx.objectStore('lessons').put({ id: 'one', text: 'final' })
  await transactionDone(tx)
  const first = await allRecords<PendingCommit>(db, 'sync_outbox')
  expect(first).toHaveLength(1)
  expect(first[0].changes).toEqual([{ store: 'lessons', key: 'one', value: { id: 'one', text: 'final' }, base: null }])
  const next = tracked.transaction('lessons', 'readwrite')
  next.objectStore('lessons').put({ id: 'one', text: 'revision' })
  await transactionDone(next)
  const pending = (await allRecords<PendingCommit>(db, 'sync_outbox')).sort((a, b) => a.created - b.created)
  expect(pending[1].changes[0].base).toBe(pending[0].id)
  expect(pending[1].created).toBeGreaterThan(pending[0].created)
})
it('does not leave a phantom pending save after a transaction aborts', async () => {
  const tx = trackSyncWrites(db, () => undefined).transaction('lessons', 'readwrite')
  tx.objectStore('lessons').put({ id: 'one' })
  const completed = transactionDone(tx)
  tx.abort()
  await expect(completed).rejects.toThrow()
  expect(await allRecords(db, 'sync_outbox')).toEqual([])
  expect(await getRecord(db, 'lessons', 'one')).toBeUndefined()
})
it('keeps source-agent permission local and journals tombstones', async () => {
  const tracked = trackSyncWrites(db, () => undefined)
  const grant = tracked.transaction('source_agent_grants', 'readwrite')
  grant.objectStore('source_agent_grants').put({ id: 'one', allowed: true })
  await transactionDone(grant)
  expect(await allRecords(db, 'sync_outbox')).toEqual([])
  const tx = tracked.transaction('lessons', 'readwrite')
  tx.objectStore('lessons').delete('one')
  await transactionDone(tx)
  const pending = await allRecords<PendingCommit>(db, 'sync_outbox')
  expect(pending[0].changes[0]).toEqual({ store: 'lessons', key: 'one', base: null })
  expect(await getRecord(db, 'sync_versions', recordKey('lessons', 'one'))).toBe(pending[0].id)
})

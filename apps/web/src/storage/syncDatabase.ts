export const SYNC_STORES = ['sync_meta', 'sync_outbox', 'sync_versions', 'sync_committed', 'sync_files', 'sync_conflicts']
const local = new Set(['vault_meta', 'source_agent_grants', 'agent_activity', ...SYNC_STORES])
export const isPortable = (store: string) => !local.has(store)
export const recordKey = (store: string, key: IDBValidKey) => JSON.stringify([store, key])
export interface SyncChange { store: string; key: IDBValidKey; value?: unknown; base: string | null }
export interface PendingCommit { id: string; changes: SyncChange[]; created: number }
export const requestValue = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
export const transactionDone = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.addEventListener('complete', () => resolve()); tx.addEventListener('abort', () => reject(tx.error ?? new Error('The library transaction was interrupted.'))) })
export async function getRecord<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> { return requestValue(db.transaction(store).objectStore(store).get(key)) }
export async function allRecords<T>(db: IDBDatabase, store: string): Promise<T[]> { return requestValue(db.transaction(store).objectStore(store).getAll()) }
export async function putRecord(db: IDBDatabase, store: string, key: IDBValidKey, value: unknown) {
  const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(value, key); await transactionDone(tx)
}
function bound(target: object, key: PropertyKey) { const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value }

/** Put the durable outbox entry in the SAME native transaction as its source write. */
export function trackSyncWrites(database: IDBDatabase, onWrite: () => void) {
  return new Proxy(database, { get(target, property) {
    if (property !== 'transaction') return bound(target, property)
    return (names: string | string[], mode?: IDBTransactionMode, options?: IDBTransactionOptions) => {
      const stores = typeof names === 'string' ? [names] : Array.from(names)
      if (mode !== 'readwrite' || !stores.some(isPortable)) return target.transaction(names, mode, options)
      const tx = target.transaction(Array.from(new Set([...stores, 'sync_outbox', 'sync_versions', 'sync_meta'])), mode, options)
      const pending: PendingCommit = { id: crypto.randomUUID(), changes: [], created: Date.now() }
      const order = tx.objectStore('sync_meta').get('localSequence')
      order.addEventListener('success', () => { pending.created = (order.result ?? 0) + 1; tx.objectStore('sync_meta').put(pending.created, 'localSequence') })
      tx.addEventListener('complete', () => { if (pending.changes.length) onWrite() })
      return new Proxy(tx, { get(transaction, property) {
        if (property !== 'objectStore') return bound(transaction, property)
        return (name: string) => {
          const store = transaction.objectStore(name)
          if (!isPortable(name)) return store
          return new Proxy(store, { get(objectStore, action) {
            if (!['put', 'add', 'delete', 'clear'].includes(String(action))) return bound(objectStore, action)
            if (action === 'clear') throw new Error('Synced stores require explicit record deletion.')
            return (...args: unknown[]) => {
              const savedValue = action === 'delete' ? undefined : structuredClone(args[0])
              const request: IDBRequest = bound(objectStore, action)(...args)
              request.addEventListener('success', () => {
                const key = (action === 'delete' ? args[0] : request.result) as IDBValidKey
                const identity = recordKey(name, key)
                const revisions = tx.objectStore('sync_versions')
                const before = revisions.get(identity)
                before.addEventListener('success', () => {
                  const previous = pending.changes.find(change => recordKey(change.store, change.key) === identity)
                  if (previous) { if (savedValue === undefined) delete previous.value; else previous.value = savedValue }
                  else pending.changes.push({ store: name, key, base: before.result ?? null, ...(savedValue === undefined ? {} : { value: savedValue }) })
                  revisions.put(pending.id, identity)
                  tx.objectStore('sync_outbox').put(pending, pending.id)
                })
              })
              return request
            }
          } })
        }
      }, set(transaction, key, value) { return Reflect.set(transaction, key, value, transaction) } })
    }
  } })
}

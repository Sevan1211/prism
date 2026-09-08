import type { DirectoryHandleLike } from './browserVault'
import { isPortable, requestValue, transactionDone } from './syncDatabase'

export async function writeVaultFile(directory: DirectoryHandleLike, name: string, blob: Blob) {
  const handle = await directory.getFileHandle(name, { create: true })
  const writer = await handle.createWritable()
  try { await writer.write(blob); await writer.close() }
  catch (error) { await writer.abort?.().catch(() => undefined); throw error }
}

export async function snapshotVaultRecords(database: IDBDatabase) {
  const names = Array.from(database.objectStoreNames).filter(isPortable)
  const tx = database.transaction(names, 'readonly')
  const done = transactionDone(tx)
  const records = await Promise.all(names.map(async name => {
    const store = tx.objectStore(name)
    const [keys, values] = await Promise.all([requestValue(store.getAllKeys()), requestValue(store.getAll())])
    return values.map((value: unknown, index) => ({ store: name, key: keys[index], value }))
  }))
  await done
  return records.flat()
}

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { accessBrowserVault, PRISM_VAULT_DATABASE, PRISM_VAULT_FOLDER_STORE, PRISM_VAULT_SOURCE_FOLDER_STORE, type BrowserVaultEnvironment, type DirectoryHandleLike } from './browserVault'
import { deleteSourceFolder, loadSourceFolders, moveSourceToFolder, saveSourceFolder } from './sourceFolders'
import { deleteBrowserSource } from './browserSources'
import { requestValue, transactionDone, trackSyncWrites, type PendingCommit } from './syncDatabase'
import { snapshotVaultRecords } from './vaultTransfer'

function environment(): BrowserVaultEnvironment {
  const directory: DirectoryHandleLike = { getDirectoryHandle: async () => directory, getFileHandle: async () => { throw new Error('Unexpected file read') }, removeEntry: async () => {} }
  return { indexedDB: new IDBFactory(), keyRange: IDBKeyRange, storage: { getDirectory: async () => directory } }
}

describe('source folders', () => {
  it('persists folder creation, rename, movement and safe folder removal across database reopen', async () => {
    const env = environment()
    const physics = await saveSourceFolder('  Physics  ', undefined, env)
    const math = await saveSourceFolder('Mathematics', undefined, env)
    await moveSourceToFolder('source-one', physics.id, env)
    await moveSourceToFolder('source-two', physics.id, env)
    await moveSourceToFolder('source-one', math.id, env)
    await saveSourceFolder('Optics', physics.id, env)
    expect((await loadSourceFolders(env)).folders.map(folder => folder.name)).toEqual(['Mathematics', 'Optics'])
    await deleteSourceFolder(physics.id, env)
    expect((await loadSourceFolders(env)).memberships).toEqual([{ source_id: 'source-one', folder_id: math.id }])
    await moveSourceToFolder('source-one', null, env)
    expect((await loadSourceFolders(env)).memberships).toEqual([])
  })

  it('rejects blank, duplicate and stale destinations without changing existing membership', async () => {
    const env = environment(), folder = await saveSourceFolder('Physics', undefined, env)
    await moveSourceToFolder('source-one', folder.id, env)
    await expect(saveSourceFolder(' ', undefined, env)).rejects.toThrow('folder name')
    await expect(saveSourceFolder('physics', undefined, env)).rejects.toThrow('already exists')
    await expect(moveSourceToFolder('source-one', 'missing-folder', env)).rejects.toThrow('no longer exists')
    expect((await loadSourceFolders(env)).memberships[0].folder_id).toBe(folder.id)
  })

  it('upgrades version 12 without changing sources and carries folder records in portable snapshots and the sync outbox', async () => {
    const env = environment()
    const open = env.indexedDB!.open(PRISM_VAULT_DATABASE, 12)
    open.onupgradeneeded = () => open.result.createObjectStore('sources', { keyPath: 'id' }).put({ id: 'retained', original_name: 'original.pdf', file_name: 'original.pdf' })
    const previous = await requestValue(open); previous.close()
    const folder = await saveSourceFolder('Physics', undefined, env)
    await moveSourceToFolder('retained', folder.id, env)
    await accessBrowserVault(async database => {
      expect(await requestValue(database.transaction('sources').objectStore('sources').get('retained'))).toMatchObject({ original_name: 'original.pdf' })
      const snapshot = await snapshotVaultRecords(database)
      expect(snapshot.some(record => record.store === PRISM_VAULT_FOLDER_STORE)).toBe(true)
      expect(snapshot.some(record => record.store === PRISM_VAULT_SOURCE_FOLDER_STORE)).toBe(true)
      const tracked = trackSyncWrites(database, () => {})
      const tx = tracked.transaction(PRISM_VAULT_FOLDER_STORE, 'readwrite')
      tx.objectStore(PRISM_VAULT_FOLDER_STORE).put({ ...folder, name: 'Optics' })
      await transactionDone(tx)
      const outbox = await requestValue<PendingCommit[]>(database.transaction('sync_outbox').objectStore('sync_outbox').getAll())
      expect(outbox[0].changes[0]).toMatchObject({ store: PRISM_VAULT_FOLDER_STORE, key: folder.id, value: { name: 'Optics' } })
    }, env)
    await deleteSourceFolder(folder.id, env)
    await accessBrowserVault(async database => {
      expect(await requestValue(database.transaction('sources').objectStore('sources').get('retained'))).toBeDefined()
    }, env)
  })

  it('removes membership when a source is deleted while keeping its folder', async () => {
    const env = environment(), folder = await saveSourceFolder('Physics', undefined, env)
    await accessBrowserVault(async database => {
      const tx = database.transaction('sources', 'readwrite')
      tx.objectStore('sources').put({ id: 'source-one', file_name: 'sample.pdf', content_hash: 'test' })
      await transactionDone(tx)
    }, env)
    await moveSourceToFolder('source-one', folder.id, env)
    await deleteBrowserSource('source-one', env)
    expect(await loadSourceFolders(env)).toEqual({ folders: [folder], memberships: [] })
  })
})

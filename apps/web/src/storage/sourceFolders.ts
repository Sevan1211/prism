import { accessBrowserVault, PRISM_VAULT_FOLDER_STORE as FOLDERS, PRISM_VAULT_SOURCE_FOLDER_STORE as MEMBERSHIPS, type BrowserVaultEnvironment } from './browserVault'
import { requestValue, transactionDone } from './syncDatabase'
import { notifySourcesChanged } from './sourceLibraryEvents'

export interface SourceFolder { id: string; name: string; created_at: string }
export interface SourceFolderMembership { source_id: string; folder_id: string }
export interface FolderLibrary { folders: SourceFolder[]; memberships: SourceFolderMembership[] }

export async function loadSourceFolders(environment?: BrowserVaultEnvironment): Promise<FolderLibrary> {
  return accessBrowserVault(async database => {
    const tx = database.transaction([FOLDERS, MEMBERSHIPS])
    const done = transactionDone(tx)
    const [folders, memberships] = await Promise.all([
      requestValue<SourceFolder[]>(tx.objectStore(FOLDERS).getAll()),
      requestValue<SourceFolderMembership[]>(tx.objectStore(MEMBERSHIPS).getAll()),
    ])
    await done
    return { folders: folders.sort((a, b) => a.name.localeCompare(b.name)), memberships }
  }, environment)
}

export async function saveSourceFolder(name: string, id?: string, environment?: BrowserVaultEnvironment): Promise<SourceFolder> {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean || clean.length > 80) throw new Error('Use a folder name between 1 and 80 characters.')
  const result = await accessBrowserVault(async database => {
    const tx = database.transaction(FOLDERS, 'readwrite')
    const done = transactionDone(tx)
    const store = tx.objectStore(FOLDERS)
    const folders = await requestValue<SourceFolder[]>(store.getAll())
    if (folders.some(folder => folder.id !== id && folder.name.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
      throw new Error('A folder with that name already exists.')
    }
    const existing = folders.find(folder => folder.id === id)
    if (id && !existing) throw new Error('This folder no longer exists. Choose another folder.')
    const folder = { id: id ?? crypto.randomUUID(), name: clean, created_at: existing?.created_at ?? new Date().toISOString() }
    store.put(folder)
    await done
    return folder
  }, environment)
  notifySourcesChanged()
  return result
}

export async function moveSourceToFolder(sourceId: string, folderId: string | null, environment?: BrowserVaultEnvironment): Promise<void> {
  if (!sourceId.trim()) throw new Error('Choose a source to move.')
  await accessBrowserVault(async database => {
    const tx = database.transaction([FOLDERS, MEMBERSHIPS], 'readwrite')
    const done = transactionDone(tx)
    if (folderId && !await requestValue(tx.objectStore(FOLDERS).get(folderId))) throw new Error('This folder no longer exists. Choose another folder.')
    const memberships = tx.objectStore(MEMBERSHIPS)
    if (folderId) memberships.put({ source_id: sourceId, folder_id: folderId } satisfies SourceFolderMembership)
    else memberships.delete(sourceId)
    await done
  }, environment)
  notifySourcesChanged()
}

/** Removing a folder never deletes its PDFs, lessons, or reading history. */
export async function deleteSourceFolder(id: string, environment?: BrowserVaultEnvironment): Promise<void> {
  await accessBrowserVault(async database => {
    const tx = database.transaction([FOLDERS, MEMBERSHIPS], 'readwrite')
    const done = transactionDone(tx)
    const store = tx.objectStore(MEMBERSHIPS)
    const memberships = await requestValue<SourceFolderMembership[]>(store.index('folder_id').getAll(id))
    memberships.forEach(membership => store.delete(membership.source_id))
    tx.objectStore(FOLDERS).delete(id)
    await done
  }, environment)
  notifySourcesChanged()
}

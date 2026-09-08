import { loadLibrarySources } from '../library/sourceLibrary'
import type { LibrarySource } from '../storage/browserSources'
import { agentContentAllowed, AGENT_ACCESS_REFUSAL } from './context'

/** Recheck at disclosure after asynchronous reads, including removal or revocation mid-call. */
export async function withCurrentSourceAccess<T>(source: LibrarySource, value: T): Promise<T> {
  const current = (await loadLibrarySources()).find(item => item.id === source.id)
  if (!current || !agentContentAllowed(current) || current.content_hash !== source.content_hash) throw new Error(AGENT_ACCESS_REFUSAL)
  return value
}

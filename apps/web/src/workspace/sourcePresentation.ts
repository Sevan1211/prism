import type { LibrarySource } from '../storage/browserSources'

export function sourceStatus(source: LibrarySource): string {
  if (source.storage_location === 'browser_vault') {
    if (source.browser_index?.state === 'ready') return 'Evidence ready'
    if (source.browser_index?.state === 'indexing') return 'Indexing'
    if (source.browser_index?.state === 'failed') return 'Needs attention'
    return 'Reader ready'
  }
  if (source.status === 'structure_ready') return 'Evidence ready'
  if (source.status === 'needs_review' || source.status === 'failed') return 'Needs attention'
  return 'Preparing'
}

export function statusTone(source: LibrarySource): 'good' | 'warn' | 'active' {
  const status = sourceStatus(source)
  if (status === 'Evidence ready') return 'good'
  if (status === 'Needs attention') return 'warn'
  return 'active'
}

export function cleanTitle(value: string): string {
  return value.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

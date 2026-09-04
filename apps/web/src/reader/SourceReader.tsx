import { useEffect, useMemo, useState } from 'react'
import { readingState, searchSource, sourcePdfUrl, sourceStructure, updateReadingState } from '../api'
import { Reader, type ReaderAccess, type ReaderProps } from '../Reader'
import { LoadingState } from '../LoadingState'
import { createBrowserSourceObjectUrl, getBrowserReadingState, getBrowserSourceStructure, searchBrowserSource, updateBrowserReadingState, type LibrarySource } from '../storage/browserSources'
import { useSyncStatus } from '../storage/useSyncStatus'
import type { SourceStructure } from '../types'

type Props = Omit<ReaderProps, 'access' | 'structure' | 'onReload' | 'source'> & { source: LibrarySource }

export function SourceReader(props: Props) {
  const [attempt, setAttempt] = useState(0)
  return <ReaderSession key={attempt} {...props} onReload={() => setAttempt(value => value + 1)} />
}

// The PDF URL belongs to this mounted session. A later visit starts with a fresh
// resource instead of briefly passing a revoked URL to PDF.js.
function ReaderSession({ source, ...props }: Props & { onReload: () => void }) {
  const synced = useSyncStatus()
  const [resource, setResource] = useState<{ url: string; structure: SourceStructure | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const id = source.id, storage = source.storage_location
  useEffect(() => {
    let cancelled = false
    let release: (() => void) | undefined
    void (async () => {
      try {
        if (storage === 'browser_vault') {
          const file = await createBrowserSourceObjectUrl(id)
          release = file.revoke
          if (cancelled) { release(); return }
          // Outline failure must not prevent reading the original PDF.
          const structure = await getBrowserSourceStructure(id).catch(() => null)
          if (!cancelled) setResource({ url: file.url, structure })
        } else {
          const structure = await sourceStructure(id).catch(() => null)
          if (!cancelled) setResource({ url: sourcePdfUrl(id), structure })
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'The source is unavailable.') }
    })()
    return () => { cancelled = true; release?.() }
  }, [id, storage])
  const access = useMemo<ReaderAccess | null>(() => resource ? {
    pdfUrl: resource.url,
    loadReadingState: () => storage === 'browser_vault' ? getBrowserReadingState(id) : readingState(id),
    saveReadingState: (page, ratio) => storage === 'browser_vault' ? updateBrowserReadingState(id, page, ratio) : updateReadingState(id, page, ratio),
    search: query => storage === 'browser_vault' ? searchBrowserSource(id, query) : searchSource(id, query),
    storageLabel: storage !== 'browser_vault' ? 'Local companion' : synced.connected ? 'Encrypted synced library' : 'This browser only',
  } : null, [id, resource, storage, synced.connected])
  if (!access) return <LoadingState title="Opening your source" detail={synced.connected ? 'Retrieving and unlocking the PDF. Large files can take longer on the first visit to this browser.' : 'Preparing the original PDF and its contents. You can return to your source at any time.'} error={error} onRetry={props.onReload} onBack={props.onExit} />
  return <Reader {...props} source={source} access={access} structure={resource?.structure ?? null} />
}

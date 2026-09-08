import { useCallback, useEffect, useState } from 'react'
import {
  formatStorageBytes,
  inspectBrowserVault,
  PRISM_VAULT_CHANGED_EVENT,
  requestBrowserPersistence,
  type BrowserVaultStatus as VaultStatus,
} from './storage/browserVault'

export function BrowserVaultStatus() {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      void inspectBrowserVault().then((nextStatus) => {
        if (!cancelled) setStatus(nextStatus)
      })
    }
    refresh()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
    return () => {
      cancelled = true
      window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
    }
  }, [])

  const requestPersistence = useCallback(async () => {
    setRequesting(true)
    try {
      setStatus(await requestBrowserPersistence())
    } finally {
      setRequesting(false)
    }
  }, [])

  const label = statusLabel(status)
  return (
    <section
      className={`vault-status vault-status-${status?.state ?? 'checking'}`}
      aria-label="Browser vault status"
      aria-live="polite"
    >
      <span className="vault-status-mark" aria-hidden="true" />
      <div className="vault-status-copy">
        <strong>{label}</strong>
        <p>{status?.detail ?? 'Checking IndexedDB, origin-private files, and storage quota…'}</p>
      </div>
      {status ? (
        <dl className="vault-status-facts">
          <div>
            <dt>Schema</dt>
            <dd>{status.schemaVersion ? `v${status.schemaVersion}` : 'Not available'}</dd>
          </div>
          <div>
            <dt>Origin use</dt>
            <dd>{formatStorageBytes(status.usageBytes)}</dd>
          </div>
          <div>
            <dt>Origin quota</dt>
            <dd>{formatStorageBytes(status.quotaBytes)}</dd>
          </div>
        </dl>
      ) : null}
      {status?.persistence === 'not_granted' ? (
        <button
          className="text-action vault-protect-action"
          type="button"
          disabled={requesting}
          onClick={() => void requestPersistence()}
        >
          {requesting ? 'Requesting…' : 'Protect local storage'}
        </button>
      ) : null}
    </section>
  )
}

function statusLabel(status: VaultStatus | null): string {
  if (!status) return 'Preparing browser vault'
  if (status.state === 'ready') return 'Browser vault protected'
  if (status.state === 'at_risk') return status.quotaWarning
    ? 'Browser vault storage is nearly full'
    : 'Browser vault ready; persistence not granted'
  if (status.state === 'unavailable') return 'Browser vault unavailable'
  return 'Browser vault needs attention'
}

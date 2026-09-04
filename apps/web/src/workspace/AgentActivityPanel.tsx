import { useEffect, useState } from 'react'
import {
  listAgentActivity,
  PRISM_ACTIVITY_CHANGED_EVENT,
  type AgentActivityRecord,
} from '../storage/agentActivity'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'

export function AgentActivityPanel({ sourceId }: { sourceId: string }) {
  const [records, setRecords] = useState<AgentActivityRecord[]>([])
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void listAgentActivity(sourceId)
        .then((next) => {
          if (cancelled) return
          setRecords(next)
          setAvailable(true)
        })
        .catch(() => {
          if (!cancelled) setAvailable(false)
        })
    }
    load()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, load)
    window.addEventListener(PRISM_ACTIVITY_CHANGED_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, load)
      window.removeEventListener(PRISM_ACTIVITY_CHANGED_EVENT, load)
    }
  }, [sourceId])

  return (
    <section className="agent-activity" aria-labelledby="agent-activity-title">
      <header>
        <div>
          <span>Local audit trail</span>
          <h2 id="agent-activity-title">Agent activity</h2>
        </div>
        <small>Receipts only · no prompts or source text stored</small>
      </header>

      {!available ? (
        <p className="agent-activity-empty">Activity receipts are unavailable in this browser.</p>
      ) : records.length === 0 ? (
        <p className="agent-activity-empty">
          No source actions recorded yet. WebMCP reads, navigation, and lesson edits will appear here.
        </p>
      ) : (
        <ol>
          {records.map((record) => (
            <li key={record.activity_id} data-outcome={record.outcome}>
              <span className="activity-mark" aria-hidden="true" />
              <div>
                <strong>{record.summary}</strong>
                <small>
                  {activityLabel(record)} · {formatTime(record.occurred_at)}
                  {record.elapsed_ms !== undefined ? ` · ${(record.elapsed_ms / 1000).toFixed(2)}s` : ''}
                </small>
              </div>
              <code>{record.tool_name}</code>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function activityLabel(record: AgentActivityRecord): string {
  if (record.outcome === 'refused') return 'Refused by policy'
  if (record.outcome === 'error') return 'Stopped with an error'
  const labels: Record<AgentActivityRecord['kind'], string> = {
    import: 'Import handoff',
    navigation: 'Reader navigation',
    read: 'Read-only',
    write: 'Browser-local change',
  }
  return labels[record.kind]
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return 'Unknown time'
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

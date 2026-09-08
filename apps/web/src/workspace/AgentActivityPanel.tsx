import { useEffect, useState } from 'react'
import {
  listAgentActivity,
  PRISM_ACTIVITY_CHANGED_EVENT,
  type AgentActivityRecord,
} from '../storage/agentActivity'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import { authoringTimings } from '../storage/authoringTimings'

export function AgentActivityPanel({ sourceId }: { sourceId: string }) {
  const [records, setRecords] = useState<AgentActivityRecord[]>([])
  const [available, setAvailable] = useState(true)
  const exportTimings = () => {
    const report = { format: 'prism-authoring-timings-v1', exported_at: new Date().toISOString(), limitation: 'Local tool durations only; model thinking, host delays, approval waits and reading time are excluded. At most 300 receipts across lessons. Source text and prompts are not included.', stages: authoringTimings(records), calls: records.map(({ tool_name, occurred_at, elapsed_ms, outcome }) => ({ tool_name, occurred_at, elapsed_ms, outcome })) }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'prism-authoring-timings.json'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void listAgentActivity(sourceId, 300)
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
      {records.length > 0 ? <details className="authoring-timings"><summary>Where local tool time went</summary>
        <p>Up to 300 receipts for this source, across lessons ({records.length} available). Durations cover local tool execution only; model thinking, host delays, indexing after import, approval waits, and reading time are excluded. Overlapping calls are summed. The activity list below shows the latest 12.</p>
        <dl>{authoringTimings(records).map(stage => <div key={stage.stage}><dt>{stage.stage}</dt><dd>{stage.measuredCalls ? `${(stage.elapsedMs / 1000).toFixed(2)}s measured` : 'Not measured'} · {stage.measuredCalls}/{stage.calls} timed calls · {stage.failures} stopped</dd></div>)}</dl>
        <button type="button" className="button-secondary" onClick={exportTimings}>Export timings</button>
      </details> : null}

      {!available ? (
        <p className="agent-activity-empty">Activity receipts are unavailable in this browser.</p>
      ) : records.length === 0 ? (
        <p className="agent-activity-empty">
          No source actions recorded yet. WebMCP reads, navigation, and lesson edits will appear here.
        </p>
      ) : (
        <ol>
          {records.slice(0, 12).map((record) => (
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

import { useId, useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'
import './agentRequestCard.css'

export function AgentRequestCard({ title = 'Continue with your agent', description, prompt }: {
  title?: string; description?: string; prompt: string
}) {
  const id = useId()
  const [copied, setCopied] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setCopied(prompt); setFailed(false) }
    catch { setFailed(true); setExpanded(true) }
  }
  return <section className="agent-request-card" aria-labelledby={`${id}-title`}>
    <div className="agent-request-card-heading"><div><strong id={`${id}-title`}>{title}</strong>{description && <p>{description}</p>}</div>
      <button className="button-secondary" type="button" onClick={() => void copy()}>{copied === prompt ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied === prompt ? 'Copied' : 'Copy request'}</button>
    </div>
    <p className="agent-request-card-status" role="status">{failed ? 'Copy is unavailable. Select the request below and copy it manually.' : copied === prompt ? 'Ready to paste into your agent conversation.' : 'Paste this request into your agent conversation.'}</p>
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary>Preview request</summary>
      <label className="sr-only" htmlFor={`${id}-prompt`}>Full request for your agent</label>
      <textarea id={`${id}-prompt`} readOnly rows={6} value={prompt} onFocus={event => event.currentTarget.select()} />
    </details>
  </section>
}

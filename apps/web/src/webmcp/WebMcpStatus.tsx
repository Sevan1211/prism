import { useRef, useSyncExternalStore } from 'react'
import { ArrowClockwise, ArrowUpRight, PlugsConnected, X } from '@phosphor-icons/react'
import { getRegistrationStatus, retryRegistrations, subscribeRegistration } from './registration'
import { containDialogFocus } from '../workspace/dialogKeyboard'

export function WebMcpStatus() {
  const status = useSyncExternalStore(subscribeRegistration, getRegistrationStatus)
  const dialog = useRef<HTMLDialogElement>(null)
  const label = status.failures.length ? 'Agent tools need attention' : status.supported ? 'Agent tools available' : 'Agent tools unavailable in this browser; local reading is ready'
  return <>
    <button className="button-quiet agent-tools-button" onClick={() => dialog.current?.showModal()} aria-label="Agent tools status" title={label} data-attention={status.failures.length > 0}>
      <PlugsConnected aria-hidden="true" /><span>Agent tools</span>
    </button>
    <dialog ref={dialog} className="storage-dialog prism-help agent-tools-dialog" tabIndex={-1} onKeyDown={containDialogFocus} aria-labelledby="agent-tools-title">
      <header><div><p className="page-kicker">Work with your agent</p><h2 id="agent-tools-title">Agent tools</h2></div><button className="icon-button" aria-label="Close agent tools" onClick={() => dialog.current?.close()}><X /></button></header>
      <div className="dialog-body" tabIndex={0}>
      <div aria-live="polite">
        <p><strong>Browser interface:</strong> {status.supported ? 'WebMCP is available.' : 'WebMCP is not available in this page yet.'}</p>
        <p><strong>Registration:</strong> {status.offered} tools offered{status.pending ? `; ${status.pending} waiting for the browser` : ''}.</p>
        {status.failures.length > 0 && <p role="alert">Registration failed for: {status.failures.join(', ')}. Retry below; if it persists, reload PRISM.</p>}
        <p><strong>Last tool call on this page:</strong> {status.lastCall ? `${status.lastCall.name} — ${status.lastCall.succeeded ? 'completed' : 'returned an error'}.` : 'No calls yet.'}</p>
      </div>
      <p>Registration lets a compatible agent discover these tools. It does not confirm that your chat has discovered or used them.</p>
      <ol className="help-steps">
        <li>In ChatGPT, enable site tools in Browser permissions and use a model that supports WebMCP. Check the address bar’s Site tools menu for available tools.</li>
        <li>Ask your agent: “Use PRISM’s WebMCP tools. Start with get_active_lesson_context, then get_authoring_guide. Read indexed evidence with read_source_packet. Inspect original visuals where needed.”</li>
        <li>If tools are missing, retry here, then ask the agent to rediscover this tab’s tools. Report missing tools before attempting a page-by-page Reader scan.</li>
      </ol>
      <footer className="agent-tools-footer">
        <p>You can allow source access when adding a PDF. You still review and approve lesson plans and revisions.</p>
        <div className="agent-tools-actions">
          <button className="button-secondary" type="button" onClick={retryRegistrations}><ArrowClockwise aria-hidden="true" />Retry connection</button>
          <a className="button-secondary" href="/agent-guide.md" target="_blank" rel="noreferrer">Agent guide<ArrowUpRight aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          <a className="button-secondary" href="https://learn.chatgpt.com/docs/webmcp" target="_blank" rel="noreferrer">ChatGPT setup<ArrowUpRight aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </footer>
      </div>
    </dialog>
  </>
}

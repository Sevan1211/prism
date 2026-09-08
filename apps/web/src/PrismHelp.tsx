import { useRef } from 'react'
import { Question, X } from '@phosphor-icons/react'
import { containDialogFocus } from './workspace/dialogKeyboard'

export function PrismHelp({ compact = false }: { compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <>
    <button className={compact ? 'icon-button' : 'button-quiet help-button'} aria-label="How PRISM works" title="How PRISM works" onClick={() => dialog.current?.showModal()}><Question aria-hidden="true" />{!compact && <span>Help</span>}</button>
    <dialog ref={dialog} className="storage-dialog prism-help" tabIndex={-1} onKeyDown={containDialogFocus} aria-labelledby="prism-help-title">
      <header><div><p className="page-kicker">A guide to your library</p><h2 id="prism-help-title">Read. Understand. Refine.</h2></div><button className="icon-button" aria-label="Close guide" onClick={() => dialog.current?.close()}><X /></button></header>
      <div className="dialog-body" tabIndex={0}>
      <ol className="help-steps">
        <li><h3>Add a source</h3><p>Upload a PDF or import a permitted URL. PRISM indexes its pages on your device. Open Reader to browse the original, search its text and follow the contents outline.</p></li>
        <li><h3>Give your agent a request</h3><p>Open Lessons → New lesson. Choose a concept, chapter or the whole source. Save your request and copy it into your agent chat. Or ask the agent directly while PRISM is open.</p><p>Open Agent tools in the header to check browser support, tool registration and the last tool call. In ChatGPT, enable site tools in Browser permissions and use a supported model. PRISM does not include its own AI chat. Local reading and library organization work even when agent tools are unavailable.</p></li>
        <li><h3>Review the plan, then let it build</h3><p>New uploads enable agent access automatically. Review and approve the agent’s proposed plan. It saves a formatted lesson with citations and useful visuals. You can open the cited page to check any explanation.</p></li>
        <li><h3>Keep improving the same lesson</h3><p>Tell your agent what is unclear: “Expand this explanation,” “Add a worked example,” or “Explain the figure.” Review proposed revisions in the lesson. Earlier versions remain in its history.</p></li>
      </ol>
      <aside className="help-sync"><h3>Your account, your library</h3><p>Open <strong>Storage</strong> to sign in and choose a cloud library. Copying an existing browser library is optional. New PDFs, lessons and edits inside the cloud library sync automatically; the original browser library stays separate.</p><p>On another device, sign in to the same account and open your cloud library. Wait for <strong>Up to date</strong> before switching. If Storage shows a local test label, that library works only on the computer running the development service.</p><p>Cloud data is protected in transit and at rest, with 1 GB per account including saved versions. PRISM’s service can read stored data. Uploads enable agent source access on this browser; you can revoke it in the source overview. These grants do not transfer to another browser.</p><p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Beta terms</a></p></aside>
      </div>
    </dialog>
  </>
}

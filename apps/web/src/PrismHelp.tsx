import { useRef } from 'react'
import { Question, X } from '@phosphor-icons/react'

export function PrismHelp({ compact = false }: { compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return <>
    <button className={compact ? 'icon-button' : 'button-quiet help-button'} aria-label="How PRISM works" title="How PRISM works" onClick={() => dialog.current?.showModal()}><Question aria-hidden="true" />{!compact && <span>How it works</span>}</button>
    <dialog ref={dialog} className="storage-dialog prism-help" aria-labelledby="prism-help-title">
      <header><div><p className="page-kicker">A guide to your library</p><h2 id="prism-help-title">Read. Understand. Refine.</h2></div><button className="icon-button" aria-label="Close guide" onClick={() => dialog.current?.close()}><X /></button></header>
      <ol className="help-steps">
        <li><h3>Add a source</h3><p>Upload a PDF or import a permitted URL. PRISM indexes its pages on your device. Open Reader to browse the original, search its text and follow the contents outline.</p></li>
        <li><h3>Give your agent a request</h3><p>Open Lessons → New lesson. Choose a concept, chapter or the whole source. Save your request and copy it into your agent chat. Or ask the agent directly while PRISM is open.</p><p>The “WebMCP ready” badge means your browser exposes PRISM’s tools to compatible agents. PRISM does not include its own AI chat. In a browser showing “Reading mode,” you can still read and manage your library.</p></li>
        <li><h3>Review the plan, then let it build</h3><p>Allow access to the source when needed and approve the agent’s proposed plan. It saves a formatted lesson with citations and useful visuals. You can open the cited page to check any explanation.</p></li>
        <li><h3>Keep improving the same lesson</h3><p>Tell your agent what is unclear: “Expand this explanation,” “Add a worked example,” or “Explain the figure.” Review proposed revisions in the lesson. Earlier versions remain in its history.</p></li>
      </ol>
      <aside className="help-sync"><h3>The same library in every browser</h3><p>In Library storage, enable encrypted sync once and save your recovery key. In each other browser, choose <strong>Connect existing library</strong> and enter that same key. The browser remembers your connection until its data is cleared or access is revoked.</p><p>Wait for <strong>Synced</strong> before switching. A PDF’s first download can take longer; downloaded files remain available offline. Source access for an agent is a separate, visible permission in each browser.</p><p>Without sync, files stay in this browser’s device storage. With sync, PRISM also uploads encrypted copies. Your recovery key is private; PRISM cannot recover a lost key.</p></aside>
    </dialog>
  </>
}

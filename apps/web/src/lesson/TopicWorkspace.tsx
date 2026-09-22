import { loadLibrarySources } from '../library/sourceLibrary'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenText, Sparkle, CheckCircle, Plus, ArrowLeft } from '@phosphor-icons/react'
import { createTopicSeries, getTopicSeries, listTopicSeries, approveTopicSeries, updateTopicRequest, moveTopicSeries } from './topicSeries'
import type { TopicSeries, ResearchMode } from './topicTypes'
import type { LessonPlan } from './lessonPlanTypes'
import type { LessonDocument } from './lessonDocumentTypes'
import { getLessonPlan } from './lessonPlans'
import { getLessonDocumentByPlan } from './lessonDocuments'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import { loadSourceFolders, type SourceFolder } from '../storage/sourceFolders'
import type { LibrarySource } from '../storage/browserSources'
import { PrismLink } from '../PrismLink'
import { navigatePrism, lessonPath } from '../navigation'
import { AppHeader } from '../workspace/AppHeader'
import { AgentRequestCard } from '../workspace/AgentRequestCard'
import { LoadingState } from '../LoadingState'
import { useSyncStatus } from '../storage/useSyncStatus'
import './topicWorkspace.css'

const researchLabels: Record<ResearchMode, string> = { knowledge_research: 'Knowledge + research', knowledge_only: 'Knowledge only', selected_sources: 'Selected sources only' }

export function TopicLibrary({ folderId, query, sources }: { folderId: string | null | 'all'; query: string; sources: LibrarySource[] }) {
  const [series, setSeries] = useState<TopicSeries[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const refresh = () => { void Promise.all([listTopicSeries(), loadSourceFolders()]).then(([items, library]) => {
      const folderIds = new Set(library.folders.map(folder => folder.id))
      if (active) setSeries(items.map(item => ({ ...item, folder_id: item.folder_id && folderIds.has(item.folder_id) ? item.folder_id : null })))
    }).catch(cause => { if (active) setError(String(cause)) }) }
    refresh(); window.addEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
    return () => { active = false; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, refresh) }
  }, [folderId])
  const visible = series.filter(item => (folderId === 'all' || item.folder_id === folderId) && item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => b.updated_at.localeCompare(a.updated_at))
  return <section className="topic-library" aria-label="Lessons and series">
    <header className="topic-library-heading"><div><span className="page-kicker">YOUR LEARNING SPACE</span><h3>Start with a question.</h3><p>Explore a topic, follow your sources, or bring both together.</p></div><button className="button-primary" onClick={() => setCreating(value => !value)} aria-expanded={creating}><Plus /> Create lesson</button></header>
    {error ? <p role="alert">{error}</p> : null}
    {creating ? <TopicComposer sources={sources} folderId={folderId === 'all' ? null : folderId} onClose={() => setCreating(false)} /> : null}
    {visible.length ? <div className="topic-card-grid">{visible.map(item => <PrismLink className="topic-card" key={item.id} href={`/series/${item.id}`}><span className="topic-card-top"><BookOpenText /><span>{item.plan_ids.length > 1 ? `${item.plan_ids.length} lessons` : 'Lesson'} · {item.status === 'clarifying' ? 'Clarify with agent' : item.status === 'proposed' ? 'Plan ready to review' : 'Approved plan'}</span></span><h4>{item.title}</h4><p>{item.request}</p><span className="topic-card-bottom">{researchLabels[item.research_mode]}<ArrowRight /></span></PrismLink>)}</div> : query ? <p className="topic-empty">No matching lessons or series.</p> : <p className="topic-empty"><Sparkle /> A single lesson or a whole series. No upload needed.</p>}
  </section>
}

function TopicComposer({ folderId, sources, onClose, initial }: { folderId: string | null; sources: LibrarySource[]; onClose: () => void; initial?: TopicSeries }) {
  const [title, setTitle] = useState(initial?.title ?? ''), [request, setRequest] = useState(initial?.request ?? '')
  const [mode, setMode] = useState<ResearchMode>(initial?.research_mode ?? 'knowledge_research')
  const [selected, setSelected] = useState<string[]>(initial?.source_ids ?? [])
  const [role, setRole] = useState<'follow' | 'support'>(initial?.source_role ?? 'support')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  return <form className="topic-composer" onSubmit={event => {
    event.preventDefault(); setBusy(true); setError('')
    const input = { title, request, folder_id: folderId, research_mode: mode, source_role: role, source_ids: mode === 'knowledge_only' ? [] : selected }
    void (initial ? updateTopicRequest(initial.id, initial.version, input) : createTopicSeries(input)).then(series => { onClose(); navigatePrism(`/series/${series.id}`) }).catch(cause => setError((cause as Error).message)).finally(() => setBusy(false))
  }}>
    <div className="topic-composer-title"><div><span className="page-kicker">LEARN A TOPIC</span><h4>What would you like to understand?</h4></div><button type="button" className="button-quiet" onClick={onClose}>Cancel</button></div>
    <label>Name<input autoFocus required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} placeholder="Give your lesson or series a name" /></label>
    <label>Your learning request<textarea required maxLength={6000} rows={4} value={request} onChange={event => setRequest(event.target.value)} placeholder="Describe your goal. You can include your starting knowledge, preferred depth, or how many lessons you have in mind." /></label>
    <fieldset className="research-choices"><legend>Build from</legend>{Object.entries(researchLabels).map(([value, label]) => <label key={value} data-selected={mode === value}><input type="radio" name="research-mode" value={value} checked={mode === value} onChange={() => setMode(value as ResearchMode)} /><strong>{label}</strong><small>{value === 'knowledge_research' ? 'Agent explanations supported by checked references.' : value === 'knowledge_only' ? 'Agent knowledge, with its limitations made clear.' : 'Keep the lesson within sources you choose.'}</small></label>)}</fieldset>
    {mode !== 'knowledge_only' ? <details className="topic-source-picker" open={mode === 'selected_sources'}><summary>{selected.length ? `${selected.length} sources selected` : 'Add your sources'} <span>{mode === 'selected_sources' ? 'Required' : 'Optional'}</span></summary><p>Only selected sources inform this request. Folder membership does not grant agent access.</p>{sources.length ? sources.map(source => <label key={source.id}><input type="checkbox" checked={selected.includes(source.id)} onChange={event => setSelected(event.target.checked ? [...selected, source.id] : selected.filter(id => id !== source.id))} />{source.original_name.replace(/\.pdf$/i, '')}</label>) : <p>Add a PDF to your library to select it here.</p>}<label>How should these sources be used?<select value={role} onChange={event => setRole(event.target.value as 'follow' | 'support')}><option value="support">Use as supporting references</option><option value="follow">Follow these sources for required coverage</option></select></label></details> : null}
    <p className="topic-guidance">Your agent will ask clarifying questions first. You review the complete plan before any lesson is written. Optional practice can be included in every subject.</p>
    {error ? <p role="alert" className="folder-error">{error}</p> : null}
    <button className="button-primary" disabled={busy || !title.trim() || !request.trim() || (mode === 'selected_sources' && !selected.length)}>{busy ? 'Saving…' : 'Save request'}<ArrowRight /></button>
  </form>
}

export function TopicSeriesPage({ seriesId }: { seriesId: string }) {
  const sync = useSyncStatus()
  const [record, setRecord] = useState<{ series: TopicSeries; lessons: Array<{ plan: LessonPlan; document?: LessonDocument }> } | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true, sequence = 0
    const refresh = async () => {
      const ticket = ++sequence
      try {
        const series = await getTopicSeries(seriesId)
        const lessons = await Promise.all(series.plan_ids.map(async id => { const plan = await getLessonPlan(id); if (!plan) throw new Error('A planned lesson is unavailable.'); return { plan, document: await getLessonDocumentByPlan(id) } }))
        if (active && ticket === sequence) { setRecord({ series, lessons }); setError('') }
      } catch (cause) { if (active && ticket === sequence) setError((cause as Error).message) }
    }
    void refresh(); window.addEventListener(PRISM_VAULT_CHANGED_EVENT, refresh)
    return () => { active = false; window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, refresh) }
  }, [seriesId, retry, sync.restoring])
  const [editing, setEditing] = useState(false)
  const [sources, setSources] = useState<LibrarySource[]>([])
  const [folders, setFolders] = useState<SourceFolder[]>([])
  useEffect(() => { let active = true; void Promise.all([loadLibrarySources(), loadSourceFolders()]).then(([sources, library]) => { if (active) { setSources(sources); setFolders(library.folders) } }).catch(cause => { if (active) setError((cause as Error).message) }); return () => { active = false } }, [])
  const series = record?.series
  return <div className="topic-page"><a className="skip-link" href="#workspace-main">Skip to lesson series</a><AppHeader /><main id="workspace-main" className="topic-series" tabIndex={-1}><PrismLink href="/sources" className="back-link"><ArrowLeft /> Back to library</PrismLink>
    {!record ? <LoadingState detail="Loading the saved scope, approvals and lesson progress." title="Opening your learning request" error={sync.restoring ? null : error || null} onRetry={() => setRetry(value => value + 1)} /> : <>
      <header className="topic-series-heading"><span className="page-kicker">{record.lessons.length > 1 ? 'LESSON SERIES' : 'YOUR LEARNING REQUEST'}</span><h1>{series!.title}</h1><p>{series!.request}</p><div className="topic-meta"><span>{researchLabels[series!.research_mode]}</span><span>{series!.source_ids.length} selected sources · {series!.source_role === 'follow' ? 'Required coverage' : 'Supporting references'}</span></div><div className="topic-request-actions"><label>Folder <select aria-label="Folder for this lesson series" disabled={busy} value={folders.some(folder => folder.id === series!.folder_id) ? series!.folder_id! : ''} onChange={event => { setBusy(true); void moveTopicSeries(series!.id, event.target.value || null, series!.version).catch(cause => setError((cause as Error).message)).finally(() => setBusy(false)) }}><option value="">Unfiled</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>{series!.status !== 'approved' ? <button className="button-secondary" onClick={() => setEditing(value => !value)}>Revise request</button> : null}</div></header>
      {editing ? <TopicComposer folderId={series!.folder_id} sources={sources} initial={series!} onClose={() => setEditing(false)} /> : null}
      <ol className="topic-stage-list" aria-label="Creation progress">{['Clarify the goal', 'Review the plan', 'Read and explore'].map((label, index) => <li key={label} aria-current={index === (series!.status === 'clarifying' ? 0 : series!.status === 'proposed' ? 1 : 2) ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
      {series!.status === 'clarifying' ? <section className="topic-next"><Sparkle /><div><h2>A good lesson starts with alignment.</h2><p>Share this saved request with your connected agent. It will ask about your goal, starting knowledge, and desired scope before proposing the lesson or series.</p><AgentRequestCard title="Continue with your agent" description="Your request is saved. Clarifying questions come next." prompt={`Use PRISM get_topic_workspace with series_id ${series!.id}. Ask me clarifying questions and wait for my answers before planning. Build a discipline-appropriate lesson or series with substantive explanations, purposeful visuals and optional practice. Do not approve plans for me.`} /></div></section> : <>
        <details className="topic-alignment" open={series!.status === 'proposed'}><summary>Agreed direction <span>{series!.clarifications.length} clarifications</span></summary><dl>{series!.clarifications.map((item, index) => <div key={index}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>{series!.assumptions.length ? <><h3>Assumptions</h3><ul>{series!.assumptions.map(item => <li key={item}>{item}</li>)}</ul></> : null}{series!.exclusions.length ? <><h3>Outside this series</h3><ul>{series!.exclusions.map(item => <li key={item}>{item}</li>)}</ul></> : null}</details>
        <div className="topic-plan-heading"><h2>{series!.status === 'proposed' ? 'Your proposed learning path' : 'Your lessons'}</h2><span>{record.lessons.length} {record.lessons.length === 1 ? 'lesson' : 'lessons'} · {record.lessons.reduce((sum, item) => sum + item.plan.estimated_minutes, 0)} min estimated</span></div>
        <ol className="topic-lesson-list">{record.lessons.map(({ plan, document }, index) => <li key={plan.plan_id}><span className="topic-lesson-number">{String(index + 1).padStart(2, '0')}</span><div className="topic-lesson-copy"><div className="topic-lesson-title"><h3>{plan.title}</h3><span>{document?.status === 'ready' ? 'Ready to read' : document ? `${document.sections.filter(section => section.blocks.length).length}/${plan.sections.length} sections saved` : plan.status === 'approved' ? 'Ready for your agent' : `${plan.estimated_minutes} min`}</span></div><ul className="topic-objectives">{plan.objectives.map(objective => <li key={objective.objective_id}>{objective.description}</li>)}</ul><details><summary>Scope, references & practice</summary>{plan.topic?.prerequisites.length ? <p><strong>Before you begin:</strong> {plan.topic.prerequisites.join(' · ')}</p> : null}<ol>{plan.sections.map(section => <li key={section.section_id}><strong>{section.title}</strong> · {section.estimated_minutes} min{section.representation_intents.length ? <small>{section.representation_intents.map(value => value.replaceAll('_', ' ')).join(' · ')}</small> : null}</li>)}</ol>{plan.topic?.exclusions.length ? <p><strong>Outside this lesson:</strong> {plan.topic.exclusions.join('; ')}</p> : null}<h4>References</h4>{plan.topic?.references.length ? <ul>{plan.topic.references.map(ref => <li key={ref.id}>{ref.kind === 'web' ? <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.title}</a> : <PrismLink href={`/sources/${ref.source_id}`}>{ref.title}</PrismLink>}<small>{ref.locator} · {ref.support}{ref.accessed_at ? ` · Agent inspected ${ref.accessed_at}` : ''}</small></li>)}</ul> : <p>Agent knowledge. No independently checked references are attached.</p>}<h4>Optional practice</h4>{plan.end_questions.length ? <ul>{plan.end_questions.map(question => <li key={question.question_id}>{question.prompt}</li>)}</ul> : <p>No practice proposed for this lesson.</p>}</details>{document ? <PrismLink className="button-secondary" href={lessonPath(document.lesson_id)}>{document.status === 'ready' ? 'Read lesson' : 'Read saved sections'}<ArrowRight /></PrismLink> : null}</div></li>)}</ol>
        {series!.status === 'proposed' ? <section className="topic-approval"><div><h3>Does this match what you want to learn?</h3><p>Approve once to authorize {record.lessons.length === 1 ? 'this planned lesson' : `all ${record.lessons.length} planned lessons`}. Material scope changes and later revisions come back to you for review. If anything is off, ask your agent to revise this proposal first.</p></div><button className="button-primary" disabled={busy} onClick={() => { setBusy(true); void approveTopicSeries(series!.id, series!.version).catch(cause => setError((cause as Error).message)).finally(() => setBusy(false)) }}><CheckCircle />{busy ? 'Approving…' : 'Approve complete plan'}</button></section> : <AgentRequestCard title="Build or continue these lessons" description="Your approved scope is saved. Your agent can resume from the latest section." prompt={`Resume PRISM series ${series!.id} with get_topic_workspace. Read the approved plans and continue composing via apply_lesson_patch. Preserve the agreed scope. Inspect every authored visual and review all explanations before finalizing. Use proposed revisions for finished lessons.`} />}
      </>}{error ? <p role="alert" className="folder-error">{error}</p> : null}
    </>}
  </main></div>
}

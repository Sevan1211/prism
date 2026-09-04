import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle, Copy, Plus, X } from '@phosphor-icons/react'
import type { LibrarySource } from '../storage/browserSources'
import { createLessonBrief } from './lessonPlans'
import type { LessonBrief, LessonDepth, LessonPlan, LessonOutputKind } from './lessonPlanTypes'

interface LessonBriefComposerProps {
  briefs: LessonBrief[]
  onError: (message: string) => void
  plans: LessonPlan[]
  source: LibrarySource
}

export function LessonBriefComposer({ briefs, onError, plans, source }: LessonBriefComposerProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copiedBriefId, setCopiedBriefId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [assignment, setAssignment] = useState('')
  const [goal, setGoal] = useState('')
  const [outputKind, setOutputKind] = useState<LessonOutputKind>('lesson')
  const [targetWords, setTargetWords] = useState<number | null>(null)
  const [includeQuestions, setIncludeQuestions] = useState(false)
  const [pageStart, setPageStart] = useState(1)
  const [pageEnd, setPageEnd] = useState(source.page_count ?? 1)
  const [timeBudget, setTimeBudget] = useState(30)
  const [depth, setDepth] = useState<LessonDepth>('standard')
  const [priorKnowledge, setPriorKnowledge] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (formError) errorRef.current?.focus()
  }, [formError])

  const plannedBriefIds = useMemo(
    () => new Set(plans.map((plan) => plan.brief_id)),
    [plans],
  )
  const awaitingAgent = briefs.filter((brief) => !plannedBriefIds.has(brief.brief_id))

  async function submitBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!Number.isFinite(pageStart) || !Number.isFinite(pageEnd) || pageEnd < pageStart) {
      setFormError('The last PDF page must be on or after the first PDF page.')
      return
    }
    if (pageStart < 1 || pageEnd > (source.page_count ?? Number.POSITIVE_INFINITY)) {
      setFormError(`Choose pages within this ${source.page_count?.toLocaleString() ?? 'available'}-page source.`)
      return
    }
    setFormError(null)
    setBusy(true)
    try {
      await createLessonBrief({
        output_kind: outputKind,
        target_words: targetWords,
        include_questions: includeQuestions,
        assignment,
        intended_depth: depth,
        learner_goal: goal.trim() || assignment.trim().slice(0, 400),
        name,
        page_end: pageEnd,
        page_start: pageStart,
        prior_knowledge: priorKnowledge
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean),
        source_id: source.id,
        time_budget_minutes: timeBudget,
      })
      setOpen(false)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The lesson assignment could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  async function copyAgentRequest(brief: LessonBrief) {
    const prompt = agentRequest(brief)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedBriefId(brief.brief_id)
      window.setTimeout(() => setCopiedBriefId(null), 1800)
    } catch {
      onError('PRISM could not copy the agent request. Select the request text and copy it manually.')
    }
  }

  return (
    <section className="lesson-launch" aria-labelledby="lesson-launch-title">
      <header>
        <div>
          <span>Create with your agent</span>
          <h4 id="lesson-launch-title">What would you like to understand?</h4>
          <p>
            A single concept, a chapter, or a detailed synthesis of the whole source.
            Save a request, ask your connected agent to build it, then review its plan.
            You can keep refining the same lesson as you read.
          </p>
        </div>
        <button
          className={open ? 'icon-button' : 'button-secondary'}
          type="button"
          aria-expanded={open}
          aria-controls="lesson-brief-form"
          aria-label={open ? 'Close lesson assignment form' : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" weight="bold" /> : <><Plus aria-hidden="true" weight="bold" /> New lesson</>}
        </button>
      </header>

      {open ? (
        <form id="lesson-brief-form" className="lesson-brief-form" onSubmit={submitBrief}>
          <label className="lesson-field lesson-field-wide">
            Lesson name
            <input
              autoComplete="off"
              name="lesson_name"
              maxLength={140}
              value={name}
              placeholder="Chapter 1 foundations…"
              onChange={(event) => setName(event.currentTarget.value)}
              required
            />
          </label>
          <label className="lesson-field lesson-field-wide">
            What should your agent create?
            <textarea
              autoComplete="off"
              name="assignment"
              maxLength={600}
              value={assignment}
              placeholder="Turn these 100 pages into a detailed, roughly 10-page reading guide. Preserve methods, evidence, limitations, and the important figures…"
              onChange={(event) => setAssignment(event.currentTarget.value)}
              required
              rows={3}
            />
          </label>
          <fieldset className="lesson-scope lesson-field-wide">
          <legend>Source pages</legend>
          <p>Use PDF page numbers. Start with the whole source or choose a smaller section.</p>
          <div className="lesson-scope-fields">
          <label className="lesson-field">
            First PDF page
            <input
              inputMode="numeric"
              aria-describedby={formError ? 'lesson-brief-error' : undefined}
              max={source.page_count ?? undefined}
              min={1}
              name="page_start"
              type="number"
              value={pageStart}
              onChange={(event) => setPageStart(event.currentTarget.valueAsNumber)}
              required
            />
          </label>
          <label className="lesson-field">
            Last PDF page
            <input
              inputMode="numeric"
              aria-describedby={formError ? 'lesson-brief-error' : undefined}
              max={source.page_count ?? undefined}
              min={1}
              name="page_end"
              type="number"
              value={pageEnd}
              onChange={(event) => setPageEnd(event.currentTarget.valueAsNumber)}
              required
            />
          </label>
          <button type="button" className="button-quiet" onClick={() => { setPageStart(1); setPageEnd(source.page_count ?? 1) }}>All {source.page_count?.toLocaleString() ?? ''} pages</button>
          </div>
          </fieldset>
          <details className="lesson-options lesson-field-wide">
          <summary>Customize depth, length and prior knowledge</summary>
          <div className="lesson-options-grid">
          <label className="lesson-field">Reading experience<select value={outputKind} onChange={(event) => setOutputKind(event.target.value as LessonOutputKind)}><option value="lesson">Lesson · teach me the ideas</option><option value="research_brief">Research brief · synthesize the source</option></select></label>
          <label className="lesson-field">Approximate length · optional<input type="number" min={1} max={100000} value={targetWords ?? ''} placeholder="Target words, e.g. 4000" onChange={(event) => setTargetWords(event.target.value === '' ? null : event.target.valueAsNumber)} /><small>A soft target. Essential detail comes first.</small></label>
          <label className="lesson-field">
            Approximate reading minutes
            <input
              inputMode="numeric"
              max={1440}
              min={1}
              name="time_budget_minutes"
              type="number"
              value={timeBudget}
              onChange={(event) => setTimeBudget(event.currentTarget.valueAsNumber)}
              required
            />
          </label>
          <label className="lesson-field">
            Depth
            <select
              name="intended_depth"
              value={depth}
              onChange={(event) => setDepth(event.currentTarget.value as LessonDepth)}
            >
              <option value="overview">Overview</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </label>
          <label className="lesson-field lesson-field-wide">
            What should you be able to do afterward? Optional
            <textarea autoComplete="off" name="learner_goal" maxLength={400} value={goal} placeholder="Explain the central argument and apply it to a new case…" onChange={event => setGoal(event.currentTarget.value)} rows={2} />
          </label>
          <label className="lesson-field lesson-field-wide">
            What do you already know? Optional
            <textarea
              autoComplete="off"
              name="prior_knowledge"
              value={priorKnowledge}
              placeholder="One item per line, for example: introductory statistics…"
              onChange={(event) => setPriorKnowledge(event.currentTarget.value)}
              rows={3}
            />
          </label>
          <label className="lesson-field-wide lesson-check-option"><input type="checkbox" checked={includeQuestions} onChange={(event) => setIncludeQuestions(event.target.checked)} /> Include a few optional understanding questions</label>
          </div>
          </details>
          {formError ? (
            <p
              ref={errorRef}
              className="lesson-form-error lesson-field-wide"
              id="lesson-brief-error"
              role="alert"
              tabIndex={-1}
            >
              {formError}
            </p>
          ) : null}
          <div className="lesson-brief-actions lesson-field-wide">
            <p>
              Your agent creates the lesson after you approve its plan. Source access stays under your control.
            </p>
            <button className="primary-action" type="submit" disabled={busy}>
              {busy ? 'Saving request…' : 'Save lesson request'}
              {!busy ? <ArrowRight aria-hidden="true" weight="bold" /> : null}
            </button>
          </div>
        </form>
      ) : null}

      {awaitingAgent.length > 0 ? (
        <div className="brief-handoffs" aria-label="Assignments awaiting an agent plan">
          {awaitingAgent.map((brief) => (
            <article className="brief-handoff" key={brief.brief_id}>
              <CheckCircle aria-hidden="true" weight="fill" />
              <div>
                <span>{brief.brief_kind === 'repair' ? 'Repair lesson ready' : 'Ready for an agent'}</span>
                <h5>{brief.name}</h5>
                <p>PDF pages {brief.page_start}-{brief.page_end}, {brief.time_budget_minutes} minutes, {brief.intended_depth} depth</p>
                {brief.brief_kind === 'repair' ? (
                  <p>
                    Child of lesson {brief.parent_lesson_id?.slice(0, 18)}. Focused on
                    {' '}{brief.repair_for_criterion_ids?.length ?? 0} unresolved criterion
                    {(brief.repair_for_criterion_ids?.length ?? 0) === 1 ? '' : 's'}.
                  </p>
                ) : null}
                <p>Ask your connected agent to use this request. Copy it into the agent chat to get started.</p>
                <details className="brief-request"><summary>View agent request</summary><code>{agentRequest(brief)}</code></details>
              </div>
              <button className="button-quiet" type="button" onClick={() => copyAgentRequest(brief)}>
                <Copy aria-hidden="true" />
                {copiedBriefId === brief.brief_id ? 'Copied' : 'Copy agent request'}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function agentRequest(brief: LessonBrief): string {
  const repairContext = brief.brief_kind === 'repair'
    ? ' This is a learner-approved repair brief tied to unresolved answer criteria.'
    : ''
  return `Create my PRISM ${brief.output_kind === 'research_brief' ? 'research brief' : 'lesson'} ${brief.brief_id}.${repairContext} Read get_lesson_brief and get_authoring_guide. Inspect the requested source, including relevant page images with browser vision. For a long scope, save record_scope_review checkpoints and propose coverage_ranges. Length is a soft target; preserve essential reasoning and qualifications. Open the plan for my approval, then compose rich text and useful source-linked visuals. After I read it, help me improve the same saved lesson.`
}

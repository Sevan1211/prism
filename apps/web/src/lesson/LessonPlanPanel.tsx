import { useEffect, useState } from 'react'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import type { LibrarySource } from '../storage/browserSources'
import { approveLessonPlan, listLessonBriefs, listLessonPlans } from './lessonPlans'
import type { CoverageDisposition, LessonBrief, LessonPlan } from './lessonPlanTypes'
import { LessonBriefComposer } from './LessonBriefComposer'
import { LessonDraftPreview } from './LessonDraftPreview'
import { PrismLink } from '../PrismLink'
import { sourcePath } from '../navigation'

interface LessonPlanPanelProps {
  activePlanId: string | null
  onActivePlanChange: (planId: string) => void
  onError: (message: string) => void
  onOpenEvidence: (elementId: string, returnTargetId?: string) => Promise<void>
  source: LibrarySource
}

const coverageOrder: CoverageDisposition[] = [
  'core', 'supporting', 'compressed', 'prerequisite', 'omitted', 'deferred', 'source_only',
]

export function LessonPlanPanel({
  activePlanId,
  onActivePlanChange,
  onError,
  onOpenEvidence,
  source,
}: LessonPlanPanelProps) {
  const [briefs, setBriefs] = useState<LessonBrief[]>([])
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [busy, setBusy] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const eligible = source.storage_location === 'browser_vault'
    && source.browser_index?.state === 'ready'

  useEffect(() => {
    if (!eligible) return
    let cancelled = false
    const loadPlans = () => {
      void Promise.all([listLessonBriefs(source.id), listLessonPlans(source.id)])
        .then(([nextBriefs, nextPlans]) => {
          if (!cancelled) {
            setBriefs(nextBriefs)
            setPlans(nextPlans)
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            onError(cause instanceof Error ? cause.message : 'Saved lesson plans could not be opened.')
          }
        })
    }
    loadPlans()
    const handleVaultChange = () => loadPlans()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, handleVaultChange)
    return () => {
      cancelled = true
      window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, handleVaultChange)
    }
  }, [eligible, onError, source.id])

  const plan = activePlanId ? plans.find((candidate) => candidate.plan_id === activePlanId) ?? null : null
  const Proof = plan?.status === 'approved' ? 'details' : 'div'

  async function approve() {
    if (!plan || plan.status !== 'proposed' || busy) return
    setBusy(true)
    try {
      const approved = await approveLessonPlan(plan.plan_id, plan.updated_at)
      setPlans((current) => current.map((candidate) => (
        candidate.plan_id === approved.plan_id ? approved : candidate
      )))
      setAnnouncement('Lesson plan approved. Its source range, coverage, and sequence are frozen.')
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The lesson plan could not be approved.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="lesson-plan-panel" aria-labelledby="lesson-plan-title">
      {!plan || plan.status !== 'approved' ? <div className="lesson-plan-kicker">
        <span>Lesson plan</span>
        {plan ? <strong data-status={plan.status}>{plan.status}</strong> : null}
      </div> : null}
      <h3 id="lesson-plan-title" className={plan?.status === 'approved' ? 'sr-only' : undefined}>{plan?.status === 'approved' ? 'Your lesson' : 'Shape your lesson'}</h3>
      {!activePlanId && plans.length > 0 ? <nav className="saved-lessons-list" aria-label="Saved lessons">{plans.map(candidate => <PrismLink key={candidate.plan_id} href={sourcePath(source.id, 'lessons', candidate.plan_id)}><div><strong>{candidate.title}</strong><span>Pages {candidate.page_start}–{candidate.page_end} · {candidate.estimated_minutes} min</span></div><span>{candidate.status === 'approved' ? 'Open lesson →' : 'Review plan →'}</span></PrismLink>)}</nav> : null}
      {activePlanId && plans.length > 0 && !plan ? <p role="status">This exact lesson plan was not found. Return to the source’s lesson list to choose another.</p> : null}
      {eligible && !plan ? (
        <LessonBriefComposer briefs={briefs} onError={onError} plans={plans} source={source} />
      ) : null}
      {!eligible ? (
        <p className="lesson-plan-empty">
          {source.storage_location === 'browser_vault'
            ? 'Finish the local evidence index before an agent can propose a coverage-checked plan.'
            : 'Manifest-backed planning currently requires a PDF imported into this browser vault.'}
        </p>
      ) : !plan ? (
        !plans.length && !activePlanId ? <div className="lesson-plan-guidance">
          <strong>No coverage plan yet</strong>
          <p>
            Save your goal above or ask your agent to create one. For a long source, the agent
            saves section reviews before proposing the synthesis and disclosing compression.
          </p>
        </div> : null
      ) : (
        <article className="plan-proof">
          {plans.length > 1 ? (
            <label className="saved-plan-picker">
              Saved lesson plan
              <select
                value={plan.plan_id}
                onChange={(event) => onActivePlanChange(event.currentTarget.value)}
              >
                {plans.map((candidate) => (
                  <option key={candidate.plan_id} value={candidate.plan_id}>
                    {candidate.title} · pages {candidate.page_start}-{candidate.page_end}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {plan.status === 'approved' ? <LessonDraftPreview onError={onError} onOpenEvidence={onOpenEvidence} plan={plan} /> : null}
          <Proof className="lesson-plan-details">
          {plan.status === 'approved' ? <summary>Plan, coverage & scope <span>Pages {plan.page_start}–{plan.page_end}</span></summary> : null}
          <header>
            <div>
              <p>Pages {plan.page_start}-{plan.page_end} · {plan.estimated_minutes} min</p>
              <h4>{plan.title}</h4>
            </div>
            <span>{plan.objectives.length} objectives</span>
          </header>

          <dl className="coverage-ledger" aria-label="Coverage ledger summary">
            {coverageOrder.map((disposition) => {
              const count = plan.coverage.filter((entry) => entry.disposition === disposition).length
              return count > 0 ? (
                <div key={disposition}>
                  <dt>{disposition.replace('_', ' ')}</dt>
                  <dd>{count}</dd>
                </div>
              ) : null
            })}
          </dl>
          {plan.coverage_ranges?.length ? <details className="coverage-disclosure" open={plan.status === 'proposed'}><summary>How the source becomes this reading document</summary><ul className="coverage-range-list">{plan.coverage_ranges.map((range) => <li key={range.page_start}><strong>Pages {range.page_start}–{range.page_end} · {range.disposition.replaceAll('_', ' ')}</strong><p>{range.reason}</p></li>)}</ul></details> : null}
          {plan.target_words ? <p className="revision-note">About {plan.target_words.toLocaleString()} words. Length is a soft target; essential detail takes priority.</p> : null}
          {plan.warnings.length ? <ul className="revision-note">{plan.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}

          <ol className="plan-sequence" aria-label="Proposed lesson sequence">
            {plan.sections.map((section) => (
              <li key={section.section_id}>
                <span>{section.estimated_minutes} min</span>
                <strong>{section.title}</strong>
                <small>{section.representation_intents.map((intent) => intent.replace('_', ' ')).join(' · ') || 'text-led'}</small>
              </li>
            ))}
          </ol>

          {plan.coverage.some((entry) => ['compressed', 'omitted', 'deferred', 'source_only'].includes(entry.disposition)) ? (
            <details className="coverage-disclosure">
              <summary>Review compressed boundaries and omissions</summary>
              <ul>
                {plan.coverage
                  .filter((entry) => ['compressed', 'omitted', 'deferred', 'source_only'].includes(entry.disposition))
                  .map((entry) => (
                    <li key={entry.element_id}>
                      <strong>{entry.disposition.replace('_', ' ')}</strong>
                      <span>{entry.element_id}</span>
                      {entry.reason ? <p>{entry.reason}</p> : null}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}

          {plan.end_questions.length ? <div className="plan-questions">
            <span>End-of-lesson check</span>
            <p>{plan.end_questions.length} explanation and application questions tied to the objectives.</p>
          </div> : null}

          {plan.status === 'proposed' ? (
            <>
              <p className="approval-note">
                Approval freezes this scope and sequence. It does not claim the lesson is correct or
                learned, and it does not yet compose lesson content.
              </p>
              <button className="primary-action" type="button" disabled={busy} onClick={approve}>
                {busy ? 'Freezing plan…' : 'Approve plan & authorize composition'}
              </button>
            </>
          ) : (
            <>
              <p className="plan-approved">
                Approved locally · fingerprint {plan.approval_hash?.slice(0, 12)}…
              </p>
            </>
          )}
          </Proof>
        </article>
      )}
      {eligible && plan ? <details className="lesson-new-details"><summary>Create another lesson</summary><LessonBriefComposer briefs={briefs} onError={onError} plans={plans} source={source} /></details> : null}
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </section>
  )
}

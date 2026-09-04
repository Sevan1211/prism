import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowSquareOut, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { PRISM_VAULT_CHANGED_EVENT } from '../storage/browserVault'
import type { LessonContentBlock, LessonDocument } from './lessonDocumentTypes'
import { getLessonDocumentByPlan } from './lessonDocuments'
import {
  acceptLessonOutcomeProposal,
  dismissLessonOutcomeProposal,
  getLatestLessonOutcomeProposalForPlan,
  listLatestLessonAnswerAnalysesForPlan,
} from './lessonLearning'
import type {
  LessonAnswerAnalysis,
  LessonOutcomeProposal,
} from './lessonLearningTypes'
import type { LessonPlan } from './lessonPlanTypes'
import { NetworkDelayModel } from './NetworkDelayModel'
import { SourceFigure } from './SourceFigure'
import { GeneratedIllustration } from './GeneratedIllustration'
import './lessonReading.css'
import { LessonRevisionHistory } from './LessonRevisionHistory'
import { LessonRevisionProposal } from './LessonRevisionProposal'
import { LessonEvidencePanel } from './LessonEvidencePanel'

const LessonRichText = lazy(() => import('./LessonRichText'))
const LessonVisual = lazy(() => import('./LessonVisual').then((module) => ({ default: module.LessonVisual })))

interface LessonDraftPreviewProps {
  onError: (message: string) => void
  onOpenEvidence: (elementId: string, returnTargetId?: string) => Promise<void>
  plan: LessonPlan
}

export function LessonDraftPreview({ onError, onOpenEvidence, plan }: LessonDraftPreviewProps) {
  const [document, setDocument] = useState<LessonDocument | null>(null)
  const [analyses, setAnalyses] = useState<LessonAnswerAnalysis[]>([])
  const [outcome, setOutcome] = useState<LessonOutcomeProposal | null>(null)
  const [decisionPending, setDecisionPending] = useState(false)
  const [focus, setFocus] = useState<{ blockId: string; text: string; version: number } | null>(null)
  const [question, setQuestion] = useState('Explain this more deeply, preserving the source’s qualifications. Add a worked example if it helps.')
  const [copied, setCopied] = useState(false)
  const [evidencePreview, setEvidencePreview] = useState<{ elementId: string; referenceIds: string[]; returnTargetId: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      void Promise.all([
        getLessonDocumentByPlan(plan.plan_id),
        listLatestLessonAnswerAnalysesForPlan(plan.plan_id),
        getLatestLessonOutcomeProposalForPlan(plan.plan_id),
      ])
        .then(([nextDocument, nextAnalyses, nextOutcome]) => {
          if (!cancelled) {
            setDocument(nextDocument ?? null)
            setAnalyses(nextAnalyses)
            setOutcome(nextOutcome ?? null)
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            onError(cause instanceof Error ? cause.message : 'The lesson draft could not be opened.')
          }
        })
    }
    load()
    window.addEventListener(PRISM_VAULT_CHANGED_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(PRISM_VAULT_CHANGED_EVENT, load)
    }
  }, [onError, plan.plan_id])

  if (!document) {
    return (
      <section className="lesson-draft-empty" aria-label="Lesson composition status">
        <span>Composition authorized</span>
        <h4>The approved structure is ready for your agent.</h4>
        <p>
          Ask your connected agent to write this lesson. Each section appears here as it is
          saved, with source references you can inspect while you read.
        </p>
      </section>
    )
  }

  const currentAnalyses = analyses.filter(
    (analysis) => analysis.document_version === document.document_version,
  )
  const analysisByQuestion = new Map(
    currentAnalyses.map((analysis) => [analysis.question_id, analysis]),
  )
  const currentOutcome = outcome?.document_version === document.document_version
    ? outcome
    : null

  const resolveOutcome = async (action: 'accept' | 'dismiss') => {
    if (!currentOutcome || decisionPending) return
    setDecisionPending(true)
    try {
      if (action === 'accept') {
        const result = await acceptLessonOutcomeProposal(
          currentOutcome.proposal_id,
          currentOutcome.updated_at,
        )
        setOutcome(result.proposal)
      } else {
        setOutcome(await dismissLessonOutcomeProposal(
          currentOutcome.proposal_id,
          currentOutcome.updated_at,
        ))
      }
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The lesson decision could not be saved.')
    } finally {
      setDecisionPending(false)
    }
  }

  const activeFocus = focus?.version === document.document_version ? focus : null
  const captureSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()
    if (!text || !selection?.anchorNode || !selection.focusNode) return
    const start = selection.anchorNode.parentElement?.closest<HTMLElement>('[data-block-id]')
    const end = selection.focusNode.parentElement?.closest<HTMLElement>('[data-block-id]')
    if (start && start === end && start.closest('[data-lesson-id]')?.getAttribute('data-lesson-id') === document.lesson_id) {
      setFocus({ blockId: start.dataset.blockId!, text: text.slice(0, 1600), version: document.document_version })
    }
  }
  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(`In PRISM, use get_active_lesson_context to read my selected passage in lesson ${document.lesson_id}, version ${document.document_version}, block ${activeFocus?.blockId}. ${question} Inspect its cited source with read_source_bundle before changing anything. Keep the approved scope and preserve substantive details. Use propose_lesson_revision with rich_text and purposeful typed visuals, preserving the approved scope. Summarize the change and open the lesson for my review. Keep the current lesson intact until I accept.`)
      setCopied(true)
    } catch { onError('Clipboard access was unavailable. You can select and copy the request text below.') }
  }

  return (
    <article className="lesson-draft" aria-labelledby={`lesson-draft-${document.lesson_id}`} data-lesson-id={document.lesson_id} data-document-version={document.document_version} data-focus-block-id={activeFocus?.blockId} onPointerUp={captureSelection} onKeyUp={captureSelection}>
      <header className="lesson-draft-header">
        <div>
          <span>Read & understand · pages {plan.page_start}–{plan.page_end}</span>
          <h2 id={`lesson-draft-${document.lesson_id}`}>{document.title}</h2>
          <p className="lesson-deck">{plan.objectives?.[0]?.description}</p>
        </div>
        <strong data-ready={document.validation.valid_for_ready}>
          {document.status === 'ready' ? 'Saved for reading' : document.validation.valid_for_ready ? 'Draft · structure checked' : `${document.validation.errors.length} checks open`}
        </strong>
      </header>
      <LessonRevisionHistory key={`${document.lesson_id}-${document.document_version}`} document={document} onError={onError} />
      <LessonRevisionProposal document={document} onError={onError} onOpenEvidence={onOpenEvidence} />
      {document.semantic_review ? <details className="lesson-semantic-review"><summary>Agent review & limitations</summary><p>{document.semantic_review.summary}</p><small>Agent-authored review. This is separate from automated structure checks and your own assessment.</small></details> : null}
      {activeFocus ? <aside className="lesson-agent-request" aria-label="Selected passage for your agent">
        <div><strong>Bring this passage to your agent</strong><button type="button" onClick={() => { setFocus(null); setCopied(false) }} aria-label="Clear selected passage">×</button></div>
        {activeFocus.text ? <blockquote data-selected-excerpt>{activeFocus.text}</blockquote> : <p>This block is selected. Your agent can inspect its text and source references.</p>}
        <label htmlFor="lesson-agent-question">What would help you understand it?</label>
        <textarea id="lesson-agent-question" data-learner-request value={question} maxLength={800} onChange={(event) => { setQuestion(event.target.value); setCopied(false) }} />
        <p>Copy this request into your connected agent conversation. The selection stays available while you remain in this lesson.</p>
        <button className="quiet-button" type="button" onClick={() => { void copyRequest() }}>{copied ? 'Request copied' : 'Copy request for agent'}</button>
      </aside> : null}

      {document.validation.errors.length > 0 || document.validation.warnings.length > 0 ? (
        <details className="lesson-validation">
          <summary>Inspect composition checks</summary>
          <ul>
            {[...document.validation.errors, ...document.validation.warnings].map((issue, index) => (
              <li key={`${issue.code}-${issue.block_id ?? issue.section_id ?? index}`}>
                <strong>{issue.code.replaceAll('_', ' ')}</strong>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <nav className="lesson-contents" aria-label="In this lesson">
        <span>In this lesson</span>
        <ol>{document.sections.map((section) => <li key={section.section_id}><a href={`#section-${domId(section.section_id)}`}>{section.title}</a></li>)}</ol>
      </nav>
      <div className="lesson-manuscript">
        {document.sections.map((section, sectionIndex) => (
          <section key={section.section_id} id={`section-${domId(section.section_id)}`} className="lesson-section">
            <header>
              <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
              <div>
                <h3>{section.title}</h3>
              </div>
            </header>
            {section.blocks.length === 0 ? (
              <p className="lesson-section-empty">This approved section has not been composed yet.</p>
            ) : (
              section.blocks.map((block) => (
                <LessonBlock
                  key={block.block_id}
                  block={block}
                  sourceId={plan.source_id}
                  onAsk={() => { setFocus((current) => ({ blockId: block.block_id, text: current?.blockId === block.block_id ? current.text : '', version: document.document_version })); setCopied(false) }}
                  onOpenEvidence={(elementId, returnTargetId) => setEvidencePreview({ elementId, referenceIds: block.source_element_ids, returnTargetId })}
                />
              ))
            )}
          </section>
        ))}
      </div>

      {evidencePreview ? <LessonEvidencePanel key={evidencePreview.elementId} sourceId={plan.source_id} {...evidencePreview} onClose={() => setEvidencePreview(null)} onOpenReader={(elementId) => {
        void onOpenEvidence(elementId, evidencePreview.returnTargetId).catch((cause: unknown) => onError(cause instanceof Error ? cause.message : 'The cited page could not be opened.'))
      }} /> : null}
      {document.end_questions.length ? <section className="lesson-end-questions" aria-labelledby={`questions-${document.lesson_id}`}>
        <span>Pause and explain</span>
        <h3 id={`questions-${document.lesson_id}`}>Questions to answer with your agent</h3>
        <p className="lesson-end-guidance">
          Answer in your agent conversation. PRISM saves the agent's source-linked analysis here,
          without turning the lesson into a score or claiming mastery.
        </p>
        <ol>
          {document.end_questions.map((question) => (
            <li key={question.question_id} data-analysis={analysisByQuestion.get(question.question_id)?.status ?? 'pending'}>
              <strong>{question.kind}</strong>
              <p>{question.prompt}</p>
              {analysisByQuestion.has(question.question_id) ? (
                <AnswerAnalysisSummary analysis={analysisByQuestion.get(question.question_id) as LessonAnswerAnalysis} />
              ) : (
                <small>Awaiting discussion</small>
              )}
            </li>
          ))}
        </ol>
        <p className="lesson-answer-privacy">
          Learner answer text stays in this browser vault. The visible record shows observed
          strengths, gaps, uncertainty, and source evidence only.
        </p>
      </section> : null}

      {currentOutcome ? (
        <LessonOutcomePanel
          analyses={currentAnalyses}
          decisionPending={decisionPending}
          onAccept={() => { void resolveOutcome('accept') }}
          onDismiss={() => { void resolveOutcome('dismiss') }}
          outcome={currentOutcome}
          questionCount={document.end_questions.length}
        />
      ) : (
        <section className="lesson-outcome-empty" aria-label="Lesson next action">
          <strong>Next action stays open</strong>
          <p>
            After reviewing a response, your agent can propose closing, continuing the
            discussion, or creating a focused repair lesson. You make the final decision here.
          </p>
        </section>
      )}
    </article>
  )
}

function AnswerAnalysisSummary({ analysis }: { analysis: LessonAnswerAnalysis }) {
  const evidenceLinkCount = new Set(
    analysis.criterion_analyses.flatMap((criterion) => criterion.evidence_element_ids),
  ).size

  return (
    <section className="lesson-answer-analysis" aria-label="Agent answer analysis">
      <header>
        <strong>{analysis.status.replaceAll('_', ' ')}</strong>
        <span>{analysis.criterion_analyses.length} criterion result{analysis.criterion_analyses.length === 1 ? '' : 's'}</span>
      </header>
      {analysis.strengths.length > 0 ? (
        <div>
          <h4>Observed strengths</h4>
          <ul>{analysis.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
        </div>
      ) : null}
      {analysis.gaps.length > 0 ? (
        <div>
          <h4>Open gaps</h4>
          <ul>{analysis.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
        </div>
      ) : null}
      {analysis.uncertainty ? <p><strong>Uncertainty</strong> {analysis.uncertainty}</p> : null}
      <footer>
        <span>{analysis.agent_label}</span>
        <span>{evidenceLinkCount} evidence link{evidenceLinkCount === 1 ? '' : 's'}</span>
      </footer>
    </section>
  )
}

function LessonOutcomePanel({
  analyses,
  decisionPending,
  onAccept,
  onDismiss,
  outcome,
  questionCount,
}: {
  analyses: LessonAnswerAnalysis[]
  decisionPending: boolean
  onAccept: () => void
  onDismiss: () => void
  outcome: LessonOutcomeProposal
  questionCount: number
}) {
  const actionLabel = outcome.recommendation === 'repair'
    ? 'Create Repair Lesson'
    : outcome.recommendation === 'close'
      ? 'Close Lesson'
      : 'Continue Discussion'
  const recommendation = outcome.recommendation.replaceAll('_', ' ')
  return (
    <section className="lesson-outcome" data-status={outcome.status} aria-live="polite">
      <header>
        <div>
          <span>Agent recommendation</span>
          <h3>{recommendation}</h3>
        </div>
        <strong>{outcome.status}</strong>
      </header>
      <p>{outcome.rationale}</p>
      <dl>
        <div><dt>Responses reviewed</dt><dd>{analyses.length} of {questionCount}</dd></div>
        <div><dt>Open criteria</dt><dd>{outcome.unresolved_criterion_ids.length}</dd></div>
        <div><dt>Learning claim</dt><dd>None</dd></div>
      </dl>
      {outcome.repair ? (
        <div className="lesson-repair-brief">
          <strong>{outcome.repair.name}</strong>
          <p>{outcome.repair.learner_goal}</p>
          <span>PDF pages {outcome.repair.page_start}-{outcome.repair.page_end}, {outcome.repair.time_budget_minutes} minutes</span>
        </div>
      ) : null}
      {outcome.status === 'proposed' ? (
        <div className="lesson-outcome-actions">
          <button type="button" onClick={onDismiss} disabled={decisionPending}>
            Not Yet
          </button>
          <button className="primary-action" type="button" onClick={onAccept} disabled={decisionPending}>
            {decisionPending ? 'Saving…' : actionLabel}
          </button>
        </div>
      ) : (
        <p className="lesson-outcome-receipt">
          {outcome.status === 'accepted'
            ? outcome.child_brief_id
              ? 'Repair brief saved under this source. It still requires its own coverage plan and learner approval.'
              : 'Decision saved locally as an evidence receipt. This is not a durable-learning or mastery claim.'
            : 'Recommendation dismissed. The lesson remains open for discussion.'}
        </p>
      )}
    </section>
  )
}

function LessonBlock({
  block,
  onOpenEvidence,
  sourceId,
  onAsk,
}: {
  block: LessonContentBlock
  onOpenEvidence: (elementId: string, returnTargetId: string) => void
  sourceId: string
  onAsk: () => void
}) {
  return (
    <section className={`lesson-block lesson-block-${block.content.kind}`} data-provenance={block.provenance} data-block-id={block.block_id}>
      <LessonBlockBody block={block} sourceId={sourceId} />
      <div className="lesson-block-proof">
        <span>{block.provenance === 'source_authored' ? 'Original source' : block.provenance === 'added_explanation' ? 'Added explanation' : 'Source references'}</span>
        {block.source_element_ids.length > 0 ? (
          <div className="lesson-evidence-links" aria-label="Source evidence">
            {block.source_element_ids.filter((id, index, all) => all.findIndex((other) => referencePage(other) === referencePage(id)) === index).map((elementId, index) => (
              <button
                id={`lesson-evidence-${domId(block.block_id)}-${index + 1}`}
                key={elementId}
                title={elementId}
                type="button"
                onClick={(event) => onOpenEvidence(elementId, event.currentTarget.id)}
              >
                {elementId.match(/:page:(\d+):/) ? `p. ${elementId.match(/:page:(\d+):/)?.[1]}` : `Evidence ${index + 1}`}
                <ArrowSquareOut aria-hidden="true" weight="bold" />
              </button>
            ))}
          </div>
        ) : <small>Agent-added explanation</small>}
        <button type="button" className="lesson-ask" onClick={onAsk}>Ask about this</button>
      </div>
    </section>
  )
}

function domId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-')
}

function referencePage(elementId: string): string { return elementId.match(/:page:(\d+):/)?.[1] ?? elementId }

function LessonBlockBody({ block, sourceId }: { block: LessonContentBlock; sourceId: string }) {
  const content = block.content
  if (content.kind === 'visual_scene' || content.kind === 'data_plot') return <Suspense fallback={<p>{content.description}</p>}><LessonVisual content={content} /></Suspense>
  if (content.kind === 'rich_text') return <Suspense fallback={<p className="markdown-loading">{content.markdown}</p>}><LessonRichText markdown={content.markdown} /></Suspense>
  if (content.kind === 'network_delay') return <NetworkDelayModel content={content} />
  if (content.kind === 'source_figure') return <SourceFigure content={content} sourceId={sourceId} />
  if (content.kind === 'illustration') return <GeneratedIllustration key={content.asset_id} sourceId={sourceId} assetId={content.asset_id} alt={content.alt} caption={content.caption} />
  if (content.kind === 'prose') return <p>{content.text}</p>
  if (content.kind === 'definition') {
    return <dl><dt>{content.term}</dt><dd>{content.definition}</dd></dl>
  }
  if (content.kind === 'source_excerpt') return <blockquote>{content.text}</blockquote>
  if (content.kind === 'callout') {
    return <aside data-tone={content.tone}><strong>{content.tone}</strong><p>{content.text}</p></aside>
  }
  if (content.kind === 'equation') {
    return <LessonEquation explanation={content.explanation} latex={content.latex} />
  }
  if (content.kind === 'code') {
    return <figure><pre><code data-language={content.language}>{content.code}</code></pre><figcaption>{content.explanation}</figcaption></figure>
  }
  if (content.kind === 'worked_example') {
    return <div className="worked-example"><h4>{content.prompt}</h4><ol>{content.steps.map((step) => <li key={step}>{step}</li>)}</ol><p><strong>Result</strong> {content.result}</p></div>
  }
  if (content.kind === 'table') {
    return <figure className="lesson-table"><table><caption>{content.caption}</caption><thead><tr>{content.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{content.rows.map((row, rowIndex) => <tr key={`${block.block_id}-row-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${block.block_id}-${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></figure>
  }
  if (content.kind === 'diagram') {
    return <LessonDiagram blockId={block.block_id} content={content} />
  }
  if (content.kind === 'animation') return <LessonAnimation blockId={block.block_id} content={content} />
  return <ul className="lesson-summary">{content.points.map((point) => <li key={point}>{point}</li>)}</ul>
}

function LessonDiagram({
  blockId,
  content,
}: {
  blockId: string
  content: Extract<LessonContentBlock['content'], { kind: 'diagram' }>
}) {
  const labels = new Map(content.nodes.map((node) => [node.node_id, node.label]))
  return (
    <figure className="lesson-diagram" aria-labelledby={`${domId(blockId)}-diagram-caption`}>
      <figcaption id={`${domId(blockId)}-diagram-caption`}>{content.caption}</figcaption>
      <div className="diagram-node-bank" aria-label="Diagram concepts">
        {content.nodes.map((node, index) => (
          <span key={node.node_id}>
            <small>{String(index + 1).padStart(2, '0')}</small>
            <strong>{node.label}</strong>
          </span>
        ))}
      </div>
      {content.edges.length > 0 ? (
        <ol className="diagram-relations" aria-label="Diagram relationships">
          {content.edges.map((edge, index) => {
            const from = labels.get(edge.from) ?? edge.from
            const to = labels.get(edge.to) ?? edge.to
            const relation = edge.label || 'connects to'
            return (
              <li key={`${edge.from}-${edge.to}-${index}`}>
                <strong>{from}</strong>
                <span className="diagram-connector" aria-label={`${from} ${relation} ${to}`}>
                  <i aria-hidden="true" />
                  <em>{relation}</em>
                  <b aria-hidden="true">›</b>
                </span>
                <strong>{to}</strong>
              </li>
            )
          })}
        </ol>
      ) : null}
    </figure>
  )
}

function LessonEquation({ explanation, latex }: { explanation: string; latex: string }) {
  const [rendered, setRendered] = useState<{ html: string; latex: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([module]) => {
      if (cancelled) return
      setRendered({
        html: module.default.renderToString(latex, {
          displayMode: true,
          output: 'htmlAndMathml',
          strict: 'warn',
          throwOnError: false,
          trust: false,
        }),
        latex,
      })
    }).catch(() => {
      if (!cancelled) setRendered({ html: '', latex })
    })
    return () => {
      cancelled = true
    }
  }, [latex])

  return (
    <figure>
      <div className="lesson-equation" aria-label={`Equation: ${explanation}`}>
        {rendered?.latex === latex && rendered.html
          ? <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
          : <code className="lesson-equation-fallback">{latex}</code>}
      </div>
      <figcaption>{explanation}</figcaption>
    </figure>
  )
}

function LessonAnimation({
  blockId,
  content,
}: {
  blockId: string
  content: Extract<LessonContentBlock['content'], { kind: 'animation' }>
}) {
  const [activeStep, setActiveStep] = useState(0)
  const step = content.steps[activeStep]
  return (
    <figure className="lesson-animation">
      <figcaption>{content.caption}</figcaption>
      <div className="animation-stage" aria-live="polite">
        <span>{activeStep + 1} / {content.steps.length}</span>
        <strong>{step.label}</strong>
        <p>{step.description}</p>
      </div>
      <div className="animation-transport">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
        >
          <CaretLeft aria-hidden="true" weight="bold" /> Previous
        </button>
        <span aria-live="polite">Step {activeStep + 1} of {content.steps.length}</span>
        <button
          type="button"
          disabled={activeStep === content.steps.length - 1}
          onClick={() => setActiveStep((current) => Math.min(content.steps.length - 1, current + 1))}
        >
          Next <CaretRight aria-hidden="true" weight="bold" />
        </button>
      </div>
      <div className="animation-controls" aria-label={`${content.caption} steps`}>
        {content.steps.map((candidate, index) => (
          <button
            aria-current={index === activeStep ? 'step' : undefined}
            key={`${blockId}-${candidate.step_id}`}
            onClick={() => setActiveStep(index)}
            type="button"
          >
            {candidate.label}
          </button>
        ))}
      </div>
      <details className="animation-transcript">
        <summary>Read the complete static sequence</summary>
        <ol>
          {content.steps.map((candidate) => (
            <li key={`${blockId}-transcript-${candidate.step_id}`}>
              <strong>{candidate.label}</strong>
              <span>{candidate.description}</span>
            </li>
          ))}
        </ol>
      </details>
    </figure>
  )
}

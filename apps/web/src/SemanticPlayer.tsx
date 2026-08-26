import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordEvent, sourceFileUrl, sourceVisualUrl } from './api'
import { agentContentAllowed, AGENT_ACCESS_REFUSAL, refusalResult, textResult } from './webmcp/context'
import { useModelContextTool } from './webmcp/useModelContextTool'
import type { LessonPackage, ResearchEvent, SemanticFrame, SourceVisual } from './types'

const TERM_PUNCTUATION = /[^A-Za-z0-9_()]/g

type PlayerMode = 'reader' | 'preview' | 'understand' | 'study'
type LearningBundle = 'faster' | 'auto' | 'deeper'

interface SemanticPlayerProps {
  lesson: LessonPackage
  onExit: () => void
}

const MODES: ReadonlyArray<{ id: PlayerMode; label: string }> = [
  { id: 'reader', label: 'Reader' },
  { id: 'preview', label: 'Preview' },
  { id: 'understand', label: 'Understand' },
  { id: 'study', label: 'Study' },
]

const BUNDLES: Record<LearningBundle, { multiplier: number; receipt: string }> = {
  faster: {
    multiplier: 0.78,
    receipt: 'Faster · required frames stay intact · shorter optional transitions',
  },
  auto: {
    multiplier: 1,
    receipt: 'Auto · learner-stepped · full source context available',
  },
  deeper: {
    multiplier: 1.32,
    receipt: 'Deeper · longer context dwell · persistent terms remain visible',
  },
}

export function SemanticPlayer({ lesson, onExit }: SemanticPlayerProps) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PlayerMode>('understand')
  const [playing, setPlaying] = useState(false)
  const [bundle, setBundle] = useState<LearningBundle>('auto')
  const [sourceEvidenceOpen, setSourceEvidenceOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [sessionId] = useState(() => crypto.randomUUID())
  const frame = lesson.frames[index]
  const previousFrame = index > 0 ? lesson.frames[index - 1] : null
  const nextFrame = index < lesson.frames.length - 1 ? lesson.frames[index + 1] : null
  const frameIdRef = useRef<string | undefined>(frame?.id)
  const sourceTriggerRef = useRef<HTMLButtonElement>(null)
  const visualById = useMemo(
    () => new Map(lesson.visuals.map((visual) => [visual.id, visual])),
    [lesson.visuals],
  )
  const activeVisual = frame?.active_visual_id
    ? visualById.get(frame.active_visual_id) ?? null
    : null
  const nextVisual = useMemo(() => {
    for (let candidateIndex = index + 1; candidateIndex < lesson.frames.length; candidateIndex += 1) {
      const visualId = lesson.frames[candidateIndex].active_visual_id
      if (visualId && visualId !== frame?.active_visual_id) return visualById.get(visualId) ?? null
    }
    return null
  }, [frame?.active_visual_id, index, lesson.frames, visualById])

  useEffect(() => {
    frameIdRef.current = frame?.id
  }, [frame?.id])

  useEffect(() => {
    if (!nextVisual) return
    const preload = new Image()
    preload.decoding = 'async'
    preload.src = sourceVisualUrl(lesson.source.id, nextVisual.id)
  }, [lesson.source.id, nextVisual])

  const emit = useCallback(
    (eventType: ResearchEvent['event_type'], payload?: ResearchEvent['payload']) => {
      const event: ResearchEvent = {
        session_id: sessionId,
        lesson_id: lesson.id,
        event_type: eventType,
        frame_id: frameIdRef.current,
        occurred_at: new Date().toISOString(),
        payload,
      }
      void recordEvent(event).catch(() => undefined)
    },
    [lesson.id, sessionId],
  )

  const move = useCallback(
    (direction: -1 | 1, eventType: 'step_back' | 'step_forward') => {
      setIndex((current) => Math.max(0, Math.min(lesson.frames.length - 1, current + direction)))
      setPlaying(false)
      setSourceEvidenceOpen(false)
      emit(eventType)
    },
    [emit, lesson.frames.length],
  )

  const changeMode = useCallback(
    (nextMode: PlayerMode) => {
      setPlaying(false)
      setSourceEvidenceOpen(false)
      if (mode !== 'reader' && nextMode === 'reader') emit('source_opened')
      if (mode === 'reader' && nextMode !== 'reader') emit('source_closed')
      setMode(nextMode)
    },
    [emit, mode],
  )

  const toggleSourceEvidence = useCallback(() => {
    setSourceEvidenceOpen((current) => {
      emit(current ? 'source_closed' : 'source_opened')
      return !current
    })
    setPlaying(false)
  }, [emit])

  const sessionStartedRef = useRef(false)
  const sessionEndedRef = useRef(false)
  const endSession = useCallback(() => {
    if (sessionEndedRef.current) return
    sessionEndedRef.current = true
    emit('session_ended')
  }, [emit])

  useEffect(() => {
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true
      emit('session_started', { frame_count: lesson.frames.length })
    }
  }, [emit, lesson.frames.length])

  useEffect(() => {
    // pagehide is the last reliable moment on tab close; recordEvent uses
    // keepalive so the final event survives the navigation.
    const handlePageHide = () => endSession()
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [endSession])

  useEffect(() => {
    emit('frame_shown', {
      frame_index: index,
      active_visual_id: frame?.active_visual_id ?? null,
    })
  }, [emit, frame?.active_visual_id, index])

  useEffect(() => {
    if (mode !== 'understand' || !playing || sourceEvidenceOpen || !frame || !nextFrame) return
    if (!frame.auto_advance_allowed) return
    const dwell = Math.max(
      frame.minimum_dwell_ms,
      frame.initial_dwell_ms * BUNDLES[bundle].multiplier,
    )
    const timer = window.setTimeout(() => {
      const following = index + 1
      setIndex(following)
      if (following === lesson.frames.length - 1) setPlaying(false)
    }, dwell)
    return () => window.clearTimeout(timer)
  }, [bundle, frame, index, lesson.frames.length, mode, nextFrame, playing, sourceEvidenceOpen])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setPlaying(false)
        emit('focus_paused')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [emit])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, select, textarea, button')) return
      if (event.key === ' ' && mode === 'understand' && frame?.auto_advance_allowed && nextFrame) {
        event.preventDefault()
        setPlaying((current) => !current)
      } else if (event.key === 'ArrowLeft') {
        move(-1, 'step_back')
      } else if (event.key === 'ArrowRight') {
        move(1, 'step_forward')
      } else if (event.key.toLowerCase() === 's') {
        changeMode('reader')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [changeMode, frame?.auto_advance_allowed, mode, move, nextFrame])

  const applyBundle = useCallback(
    (nextBundle: LearningBundle) => {
      setBundle(nextBundle)
      emit('pace_changed', {
        bundle: nextBundle,
        pace_multiplier: BUNDLES[nextBundle].multiplier,
      })
    },
    [emit],
  )

  const contentAllowed = agentContentAllowed(lesson.source.rights_status)
  const frameSummary = useCallback(
    (target: SemanticFrame, frameNumber: number) => ({
      frame_number: frameNumber,
      of_frames: lesson.frames.length,
      type: target.type,
      verification_status: target.verification_status,
      auto_advance_allowed: target.auto_advance_allowed,
      source_page: target.source_spans[0]?.page_number ?? null,
      ...(contentAllowed
        ? {
            section_title: target.section_title,
            content: target.representation.content,
            source_spans: target.source_spans.map((span) => ({
              page_number: span.page_number,
              start_offset: span.start_offset,
              end_offset: span.end_offset,
              extracted_text: span.extracted_text,
            })),
          }
        : { content_withheld: AGENT_ACCESS_REFUSAL }),
    }),
    [contentAllowed, lesson.frames.length],
  )

  // WebMCP Ring 1 — player tools; registered only while a lesson is open.
  useModelContextTool({
    name: 'get_player_state',
    description:
      'Current player state: mode, frame position, pace bundle, and whether optional '
      + 'playback is running. Frame content appears only for openly licensed sources.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    execute: async () => {
      const current = lesson.frames[index]
      return textResult({
        lesson_id: lesson.id,
        title: lesson.title,
        mode,
        playing,
        bundle,
        rights_status: lesson.source.rights_status,
        ...(current ? { frame: frameSummary(current, index + 1) } : {}),
      })
    },
  })

  useModelContextTool({
    name: 'goto_frame',
    description:
      'Move the player the learner is watching to a specific frame (1-based). '
      + 'Stops optional playback so the learner stays in control.',
    inputSchema: {
      type: 'object',
      properties: {
        frame_number: { type: 'integer', minimum: 1 },
      },
      required: ['frame_number'],
      additionalProperties: false,
    },
    execute: async (args) => {
      const requested = typeof args.frame_number === 'number' ? Math.trunc(args.frame_number) : null
      if (!requested || requested < 1 || requested > lesson.frames.length) {
        return refusalResult(`frame_number must be between 1 and ${lesson.frames.length}`)
      }
      setIndex(requested - 1)
      setPlaying(false)
      setSourceEvidenceOpen(false)
      return textResult(frameSummary(lesson.frames[requested - 1], requested))
    },
  })

  useModelContextTool({
    name: 'set_mode',
    description:
      'Switch the player surface: reader (original PDF), preview (section path), '
      + 'understand (semantic stream), or study (free-recall explanation).',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['reader', 'preview', 'understand', 'study'] },
      },
      required: ['mode'],
      additionalProperties: false,
    },
    execute: async (args) => {
      const requested = args.mode
      if (
        requested !== 'reader'
        && requested !== 'preview'
        && requested !== 'understand'
        && requested !== 'study'
      ) {
        return refusalResult('mode must be reader, preview, understand, or study')
      }
      changeMode(requested)
      return textResult({ mode: requested })
    },
  })

  useModelContextTool({
    name: 'set_pace',
    description:
      'Set the learning-path bundle: faster, auto, or deeper. The player shows the '
      + 'learner an itemized receipt of what the bundle changes.',
    inputSchema: {
      type: 'object',
      properties: {
        bundle: { type: 'string', enum: ['faster', 'auto', 'deeper'] },
      },
      required: ['bundle'],
      additionalProperties: false,
    },
    execute: async (args) => {
      const requested = args.bundle
      if (requested !== 'faster' && requested !== 'auto' && requested !== 'deeper') {
        return refusalResult('bundle must be faster, auto, or deeper')
      }
      applyBundle(requested)
      return textResult({ bundle: requested, receipt: BUNDLES[requested].receipt })
    },
  })

  useModelContextTool({
    name: 'set_playback',
    description:
      'Start or stop optional auto-advance in Understand mode. Refused on frames that '
      + 'require inspection; the learner can always pause manually.',
    inputSchema: {
      type: 'object',
      properties: {
        playing: { type: 'boolean' },
      },
      required: ['playing'],
      additionalProperties: false,
    },
    execute: async (args) => {
      if (typeof args.playing !== 'boolean') {
        return refusalResult('playing must be true or false')
      }
      if (args.playing) {
        const current = lesson.frames[index]
        if (mode !== 'understand') return refusalResult('playback runs only in understand mode')
        if (!current?.auto_advance_allowed) {
          return refusalResult('this frame requires inspection and cannot auto-advance')
        }
        if (index >= lesson.frames.length - 1) {
          return refusalResult('already at the final frame')
        }
      }
      setPlaying(args.playing)
      emit(args.playing ? 'play' : 'pause')
      return textResult({ playing: args.playing })
    },
  })

  useModelContextTool({
    name: 'get_frame_evidence',
    description:
      'The exact source spans backing the current frame: page numbers, character '
      + 'offsets, and verbatim extracted text. Openly licensed sources only.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    execute: async () => {
      if (!contentAllowed) return refusalResult(AGENT_ACCESS_REFUSAL)
      const current = lesson.frames[index]
      if (!current) return refusalResult('no active frame')
      return textResult(frameSummary(current, index + 1))
    },
  })

  if (!frame) {
    return (
      <main className="flow-player empty-player">
        <p>This lesson contains no playable frames.</p>
        <button type="button" onClick={onExit}>Return to library</button>
      </main>
    )
  }

  const progress = Math.round(((index + 1) / lesson.frames.length) * 100)

  return (
    <main className={`flow-player ${reducedMotion ? 'reduce-motion' : ''}`}>
      <header className="flow-player-header">
        <button
          className="wordmark compact flow-wordmark"
          type="button"
          onClick={() => {
            endSession()
            onExit()
          }}
          aria-label="Return to library"
        >
          <span className="prism-mark" aria-hidden="true" />
          <span>PRISM</span>
        </button>
        <div className="flow-document-identity">
          <strong>{lesson.title}</strong>
          <span>{lesson.source.original_name} · {frame.section_title ?? `pages ${lesson.page_start}–${lesson.page_end}`}</span>
        </div>
        <div className="flow-local-state"><span aria-hidden="true" />Local source</div>
      </header>

      <nav className="flow-mode-nav" aria-label="Learning mode">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={mode === item.id}
            onClick={() => changeMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div
        className="flow-section-progress"
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      {mode === 'reader' ? (
        <SourceReader
          lesson={lesson}
          frame={frame}
          onReturn={() => {
            changeMode('understand')
            window.requestAnimationFrame(() => sourceTriggerRef.current?.focus())
          }}
        />
      ) : null}
      {mode === 'preview' ? <LessonPreview lesson={lesson} currentIndex={index} /> : null}
      {mode === 'understand' ? (
        <UnderstandFlow
          lesson={lesson}
          frame={frame}
          previousFrame={previousFrame}
          nextFrame={nextFrame}
          index={index}
          activeVisual={activeVisual}
          bundle={bundle}
          playing={playing}
          reducedMotion={reducedMotion}
          sourceEvidenceOpen={sourceEvidenceOpen}
          sourceTriggerRef={sourceTriggerRef}
          onBack={() => move(-1, 'step_back')}
          onForward={() => move(1, 'step_forward')}
          onPlayPause={() => {
            setPlaying((current) => !current)
            emit(playing ? 'pause' : 'play')
          }}
          onBundle={applyBundle}
          onReducedMotion={setReducedMotion}
          onSourceToggle={toggleSourceEvidence}
          onOpenReader={() => changeMode('reader')}
        />
      ) : null}
      {mode === 'study' ? (
        <StudyView
          key={frame.id}
          frame={frame}
          onShowSource={() => changeMode('reader')}
          onSubmit={(answer) =>
            emit('study_submitted', {
              answer: answer.slice(0, 2000),
              answer_characters: answer.length,
            })
          }
        />
      ) : null}
    </main>
  )
}

function UnderstandFlow({
  lesson,
  frame,
  previousFrame,
  nextFrame,
  index,
  activeVisual,
  bundle,
  playing,
  reducedMotion,
  sourceEvidenceOpen,
  sourceTriggerRef,
  onBack,
  onForward,
  onPlayPause,
  onBundle,
  onReducedMotion,
  onSourceToggle,
  onOpenReader,
}: {
  lesson: LessonPackage
  frame: SemanticFrame
  previousFrame: SemanticFrame | null
  nextFrame: SemanticFrame | null
  index: number
  activeVisual: SourceVisual | null
  bundle: LearningBundle
  playing: boolean
  reducedMotion: boolean
  sourceEvidenceOpen: boolean
  sourceTriggerRef: React.RefObject<HTMLButtonElement | null>
  onBack: () => void
  onForward: () => void
  onPlayPause: () => void
  onBundle: (bundle: LearningBundle) => void
  onReducedMotion: (value: boolean) => void
  onSourceToggle: () => void
  onOpenReader: () => void
}) {
  const span = frame.source_spans[0]
  const claimLength = frame.representation.content.length
  const claimLengthClass = claimLength > 180 ? 'is-very-long' : claimLength > 92 ? 'is-long' : ''
  return (
    <section className="flow-understand" aria-label="Traceable Semantic Relay">
      <div className="flow-frame-meta">
        <span>{frame.section_title ?? 'Current section'} · {frame.type}</span>
        <span>Frame {index + 1} of {lesson.frames.length}</span>
      </div>

      <div className="flow-carry-forward" aria-label="Previous semantic frame">
        <span>Carry forward</span>
        <p>{previousFrame?.representation.content ?? 'Beginning of this learning unit.'}</p>
      </div>

      <header className={`flow-active-claim ${claimLengthClass}`}>
        <p>{frame.type} · source page {span?.page_number ?? '—'}</p>
        <h1>{renderWithTerms(frame)}</h1>
      </header>

      <article className="flow-representation" aria-label="Active representation">
        {activeVisual ? (
          <SourceVisualField
            visual={activeVisual}
            sourceId={lesson.source.id}
            frameContent={frame.representation.content}
          />
        ) : (
          <FrameSequence
            previousFrame={previousFrame}
            frame={frame}
            nextFrame={nextFrame}
          />
        )}
        <footer>
          <span>One coherent frame at a time.</span>
          <strong>{activeVisual ? `Source ${activeVisual.kind} · page ${activeVisual.page_number}` : 'Meaning path · learner stepped'}</strong>
        </footer>
      </article>

      <div className="flow-explanation-row">
        <div>
          <span>Frame status · {frame.verification_status}</span>
          <h2>This representation stays anchored to its exact source.</h2>
          <p>
            Draft source-linked frame. PRISM preserves the exact originating span so the
            transformation remains inspectable while this lesson awaits review.
          </p>
        </div>
        <button
          ref={sourceTriggerRef}
          className="flow-source-action"
          type="button"
          aria-expanded={sourceEvidenceOpen}
          aria-controls="flow-source-evidence"
          onClick={onSourceToggle}
        >
          <span>{frame.source_spans.length}</span>
          {sourceEvidenceOpen ? 'Hide exact source' : 'See exact source'}
        </button>
      </div>

      {sourceEvidenceOpen ? (
        <SourceEvidence
          id="flow-source-evidence"
          frame={frame}
          verificationStatus={frame.verification_status}
          onOpenReader={onOpenReader}
        />
      ) : null}

      <footer className="flow-player-controls">
        <button type="button" className="flow-step-control" onClick={onBack} disabled={!previousFrame}>
          ← Previous idea
        </button>
        <div className="flow-bundle-control">
          <span>Learning path</span>
          <div aria-label="Learning path depth">
            {(Object.keys(BUNDLES) as LearningBundle[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={bundle === item}
                onClick={() => onBundle(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <p aria-live="polite">{BUNDLES[bundle].receipt}</p>
        </div>
        <button type="button" className="flow-step-control next" onClick={onForward} disabled={!nextFrame}>
          Continue the flow →
        </button>
        <div className="flow-session-options">
          <button type="button" onClick={onPlayPause} disabled={!frame.auto_advance_allowed || !nextFrame}>
            {playing ? 'Pause optional playback' : 'Play optional playback'} <kbd>Space</kbd>
          </button>
          <label>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => onReducedMotion(event.target.checked)}
            />
            Static transitions
          </label>
        </div>
      </footer>
    </section>
  )
}

function FrameSequence({
  previousFrame,
  frame,
  nextFrame,
}: {
  previousFrame: SemanticFrame | null
  frame: SemanticFrame
  nextFrame: SemanticFrame | null
}) {
  const items = [previousFrame, frame, nextFrame]
  return (
    <div className="flow-sequence" role="img" aria-label="Previous, current, and next semantic frames">
      <svg viewBox="0 0 900 230" aria-hidden="true" focusable="false">
        <path className="flow-sequence-path" d="M 105 112 C 278 28, 520 198, 795 112" />
        <path className="flow-sequence-return" d="M 795 146 C 598 216, 342 213, 105 151" />
      </svg>
      <div className="flow-sequence-nodes">
        {items.map((item, itemIndex) => (
          <div
            className={`flow-sequence-node ${itemIndex === 1 ? 'is-current' : ''}`}
            key={item?.id ?? `empty-${itemIndex}`}
          >
            <span>{String(itemIndex + 1).padStart(2, '0')}</span>
            <strong>{itemIndex === 0 ? 'Previous' : itemIndex === 1 ? 'Now' : 'Next'}</strong>
            <p>{item?.representation.content ?? (itemIndex === 0 ? 'Start of section' : 'Section complete')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceVisualField({
  visual,
  sourceId,
  frameContent,
}: {
  visual: SourceVisual
  sourceId: string
  frameContent: string
}) {
  const distinctCaption = visual.caption?.trim() !== frameContent.trim()
  return (
    <figure
      className={`flow-source-visual ${distinctCaption ? 'has-caption' : ''}`}
      aria-label="Source visual"
    >
      <img
        src={sourceVisualUrl(sourceId, visual.id)}
        alt={visual.accessible_text}
        decoding="async"
      />
      {distinctCaption ? (
        <figcaption>{visual.caption ?? 'Source visual without a detected caption.'}</figcaption>
      ) : null}
    </figure>
  )
}

function SourceEvidence({
  id,
  frame,
  verificationStatus,
  onOpenReader,
}: {
  id: string
  frame: SemanticFrame
  verificationStatus: SemanticFrame['verification_status']
  onOpenReader: () => void
}) {
  return (
    <aside id={id} className="flow-source-evidence" aria-label="Exact source evidence">
      <div>
        <span>Source trace</span>
        <strong>{verificationStatus}</strong>
        <span>{frame.source_spans.length} immutable {frame.source_spans.length === 1 ? 'span' : 'spans'}</span>
      </div>
      <blockquote>
        {frame.source_spans.map((span) => (
          <p key={`${span.element_id}-${span.start_offset}-${span.end_offset}`}>
            <mark>{span.extracted_text}</mark>
            <small>Page {span.page_number} · offsets {span.start_offset}–{span.end_offset}</small>
          </p>
        ))}
      </blockquote>
      <button type="button" onClick={onOpenReader}>Open full Reader</button>
    </aside>
  )
}

function SourceReader({
  lesson,
  frame,
  onReturn,
}: {
  lesson: LessonPackage
  frame: SemanticFrame
  onReturn: () => void
}) {
  const span = frame.source_spans[0]
  return (
    <section className="flow-source-reader" aria-labelledby="source-reader-title">
      <header>
        <div>
          <p>Source Reader · exact context</p>
          <h1 id="source-reader-title">{frame.section_title ?? 'Original source context'}</h1>
        </div>
        <button type="button" onClick={onReturn}>Return to frame →</button>
      </header>
      <div className="flow-source-reader-grid">
        <object
          data={sourceFileUrl(lesson.source.id, span.page_number)}
          type="application/pdf"
          aria-label={`${lesson.source.original_name}, page ${span.page_number}`}
        >
          <a href={sourceFileUrl(lesson.source.id, span.page_number)}>Open the source PDF</a>
        </object>
        <aside>
          <p>Current trace</p>
          <strong>Page {span.page_number}</strong>
          <span>Region {span.bbox_normalized.map((value) => value.toFixed(2)).join(' · ')}</span>
          <blockquote>{span.extracted_text}</blockquote>
          <small>Source-authored text · draft extraction · no generated paraphrase</small>
        </aside>
      </div>
    </section>
  )
}

function LessonPreview({ lesson, currentIndex }: { lesson: LessonPackage; currentIndex: number }) {
  const windowStart = Math.max(0, Math.min(currentIndex - 3, lesson.frames.length - 7))
  const previewFrames = lesson.frames.slice(windowStart, windowStart + 7)
  const terms = Array.from(
    new Set(lesson.frames.flatMap((frame) => frame.representation.persistent_terms)),
  ).slice(0, 7)
  return (
    <section className="flow-preview" aria-labelledby="preview-title">
      <p>Preview · section path</p>
      <h1 id="preview-title">See the structure before the details arrive.</h1>
      <ol className="flow-concept-path">
        {previewFrames.map((frame, frameIndex) => (
          <li key={frame.id} className={windowStart + frameIndex === currentIndex ? 'is-current' : ''}>
            <span>{String(windowStart + frameIndex + 1).padStart(2, '0')}</span>
            <strong>{frame.section_title ?? frame.type}</strong>
            <p>{frame.representation.content}</p>
          </li>
        ))}
      </ol>
      <div className="flow-preview-question">
        <span>Terms carried through this unit</span>
        <p>{terms.length > 0 ? terms.join(' · ') : 'No persistent terms were identified in this draft package.'}</p>
      </div>
    </section>
  )
}

function StudyView({
  frame,
  onShowSource,
  onSubmit,
}: {
  frame: SemanticFrame
  onShowSource: () => void
  onSubmit: (answer: string) => void
}) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  return (
    <section className="flow-study" aria-labelledby="study-title">
      <p>Study · integrate the current claim</p>
      <h1 id="study-title">Explain the governing idea in your own words.</h1>
      <article>
        <p>
          State what this frame means and what would have to be true for it to apply. This draft
          lesson has no reviewed scoring rubric yet, so PRISM will compare—not grade—your answer.
        </p>
        <label htmlFor="study-explanation">Your explanation</label>
        <textarea
          id="study-explanation"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Explain the relation, qualification, or process shown in the current frame."
        />
        <div>
          <button type="button" onClick={onShowSource}>Not ready · show source</button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              const trimmed = answer.trim()
              if (trimmed) onSubmit(trimmed)
              setFeedback(
                trimmed
                  ? `Compare your explanation with the exact source: “${frame.source_spans[0].extracted_text}”`
                  : 'Write one sentence first, or open the source without recording an incorrect response.',
              )
            }}
          >
            Compare with source
          </button>
        </div>
        {feedback ? <p className="flow-study-feedback" aria-live="polite">{feedback}</p> : null}
      </article>
    </section>
  )
}

function renderWithTerms(frame: SemanticFrame) {
  const terms = new Set(frame.representation.persistent_terms.map((term) => term.toLowerCase()))
  const tokens = frame.representation.content.split(/(\s+)/)
  return tokens.map((token, tokenIndex) => {
    const normalized = token.replace(TERM_PUNCTUATION, '').toLowerCase()
    return terms.has(normalized)
      ? <mark key={`${token}-${tokenIndex}`}>{token}</mark>
      : token
  })
}

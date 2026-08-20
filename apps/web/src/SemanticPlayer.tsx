import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordEvent, sourceFileUrl, sourceVisualUrl } from './api'
import type { LessonPackage, ResearchEvent, SemanticFrame, SourceVisual } from './types'

const TERM_PUNCTUATION = /[^A-Za-z0-9_()]/g

interface SemanticPlayerProps {
  lesson: LessonPackage
  onExit: () => void
}

export function SemanticPlayer({ lesson, onExit }: SemanticPlayerProps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [pace, setPace] = useState(1)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [sessionId] = useState(() => crypto.randomUUID())
  const frame = lesson.frames[index]
  const previousFrame = index > 0 ? lesson.frames[index - 1] : null
  const nextFrame = index < lesson.frames.length - 1 ? lesson.frames[index + 1] : null
  const frameIdRef = useRef<string | undefined>(frame?.id)
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
      emit(eventType)
    },
    [emit, lesson.frames.length],
  )

  const toggleSource = useCallback(() => {
    setSourceOpen((current) => {
      emit(current ? 'source_closed' : 'source_opened')
      return !current
    })
    setPlaying(false)
  }, [emit])

  useEffect(() => {
    emit('session_started', { frame_count: lesson.frames.length })
    return () => emit('session_ended')
  }, [emit, lesson.frames.length])

  useEffect(() => {
    emit('frame_shown', {
      frame_index: index,
      active_visual_id: frame?.active_visual_id ?? null,
    })
  }, [emit, frame?.active_visual_id, index])

  useEffect(() => {
    if (!playing || sourceOpen || !frame || !nextFrame) return
    const dwell = Math.max(frame.minimum_dwell_ms, frame.initial_dwell_ms * pace)
    const timer = window.setTimeout(() => {
      const following = index + 1
      setIndex(following)
      if (following === lesson.frames.length - 1) setPlaying(false)
    }, dwell)
    return () => window.clearTimeout(timer)
  }, [frame, index, lesson.frames.length, nextFrame, pace, playing, sourceOpen])

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
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((current) => !current)
      } else if (event.key === 'ArrowLeft') {
        move(-1, 'step_back')
      } else if (event.key === 'ArrowRight') {
        move(1, 'step_forward')
      } else if (event.key.toLowerCase() === 's') {
        toggleSource()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [move, toggleSource])

  const paceLabel = pace < 0.9 ? 'Faster' : pace > 1.1 ? 'Deeper' : 'Auto'

  if (!frame) {
    return <main className="player-shell"><p>This lesson contains no playable frames.</p></main>
  }

  return (
    <main className={`player-shell ${reducedMotion ? 'reduce-motion' : ''}`}>
      <header className="player-header">
        <button className="wordmark compact" type="button" onClick={onExit} aria-label="Return to library">
          <span className="prism-mark" aria-hidden="true" />
          <span>PRISM</span>
        </button>
        <div className="lesson-identity">
          <span>{lesson.title}</span>
          <small>{frame.section_title ?? 'Source-grounded stream'}</small>
        </div>
        <button
          className="source-toggle"
          type="button"
          onClick={toggleSource}
          aria-expanded={sourceOpen}
          aria-controls="source-context"
        >
          {sourceOpen ? 'Close source' : 'Show source'} <kbd>S</kbd>
        </button>
      </header>

      <div className={`player-workspace ${sourceOpen ? 'with-source' : ''}`}>
        <section className="semantic-stage" aria-label="Semantic stream">
          <div className="frame-counter">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${((index + 1) / lesson.frames.length) * 100}%` }} />
            </div>
            <span>{String(lesson.frames.length).padStart(2, '0')}</span>
          </div>

          <div className="learning-canvas">
            <VisualRail
              visual={activeVisual}
              sourceId={lesson.source.id}
              sectionTitle={frame.section_title}
            />

            <div className="stream-column">
              <article
                className="active-frame"
                key={reducedMotion ? 'static-frame' : frame.id}
                tabIndex={-1}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="frame-meta">
                  <span>{frame.type}</span>
                  <span>Page {frame.source_spans[0]?.page_number}</span>
                </div>
                <p>{renderWithTerms(frame)}</p>
                {frame.representation.persistent_terms.length > 0 ? (
                  <div className="term-rail" aria-label="Persistent technical terms">
                    {frame.representation.persistent_terms.map((term) => <span key={term}>{term}</span>)}
                  </div>
                ) : null}
              </article>

              <div className="flow-memory" aria-label="Previous semantic frame">
                <span>Just passed</span>
                <p>{previousFrame?.representation.content ?? 'Beginning of section'}</p>
              </div>
            </div>
          </div>

          <PlayerControls
            playing={playing}
            canGoBack={index > 0}
            canGoForward={index < lesson.frames.length - 1}
            pace={pace}
            paceLabel={paceLabel}
            reducedMotion={reducedMotion}
            onBack={() => move(-1, 'step_back')}
            onForward={() => move(1, 'step_forward')}
            onPlayPause={() => {
              setPlaying((current) => !current)
              emit(playing ? 'pause' : 'play')
            }}
            onPace={(value) => {
              setPace(value)
              emit('pace_changed', { pace_multiplier: value })
            }}
            onReducedMotion={setReducedMotion}
          />
        </section>

        {sourceOpen ? <SourcePanel lesson={lesson} frame={frame} /> : null}
      </div>
    </main>
  )
}

function VisualRail({
  visual,
  sourceId,
  sectionTitle,
}: {
  visual: SourceVisual | null
  sourceId: string
  sectionTitle?: string | null
}) {
  if (!visual) {
    return (
      <aside className="visual-rail visual-placeholder" aria-label="Current section">
        <span className="visual-kicker">Section field</span>
        <div className="section-glyph" aria-hidden="true"><i /><i /><i /></div>
        <p>{sectionTitle ?? 'The source has not introduced a visual in this section yet.'}</p>
      </aside>
    )
  }

  return (
    <figure className="visual-rail" aria-label="Most recent source visual">
      <div className="visual-heading">
        <span className="visual-kicker">Source {visual.kind}</span>
        <span>p. {visual.page_number}</span>
      </div>
      <div className="visual-image-field">
        <img
          key={visual.id}
          src={sourceVisualUrl(sourceId, visual.id)}
          alt={visual.accessible_text}
          decoding="async"
        />
      </div>
      <figcaption>{visual.caption ?? 'Uncaptioned source visual · inspect the original page for context.'}</figcaption>
    </figure>
  )
}

function renderWithTerms(frame: SemanticFrame) {
  const terms = new Set(frame.representation.persistent_terms.map((term) => term.toLowerCase()))
  const tokens = frame.representation.content.split(/(\s+)/)
  return tokens.map((token, index) => {
    const normalized = token.replace(TERM_PUNCTUATION, '').toLowerCase()
    return terms.has(normalized) ? <mark key={`${token}-${index}`}>{token}</mark> : token
  })
}

function PlayerControls({
  playing,
  canGoBack,
  canGoForward,
  pace,
  paceLabel,
  reducedMotion,
  onBack,
  onForward,
  onPlayPause,
  onPace,
  onReducedMotion,
}: {
  playing: boolean
  canGoBack: boolean
  canGoForward: boolean
  pace: number
  paceLabel: string
  reducedMotion: boolean
  onBack: () => void
  onForward: () => void
  onPlayPause: () => void
  onPace: (value: number) => void
  onReducedMotion: (value: boolean) => void
}) {
  return (
    <div className="player-controls">
      <div className="transport-controls">
        <button type="button" onClick={onBack} disabled={!canGoBack} aria-label="Previous frame">←</button>
        <button className="play-control" type="button" onClick={onPlayPause} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? 'Pause' : 'Play'} <kbd>Space</kbd>
        </button>
        <button type="button" onClick={onForward} disabled={!canGoForward} aria-label="Next frame">→</button>
      </div>
      <label className="pace-control">
        <span>Faster</span>
        <input
          type="range"
          min="0.72"
          max="1.45"
          step="0.01"
          value={pace}
          onChange={(event) => onPace(Number(event.target.value))}
          aria-valuetext={paceLabel}
        />
        <span>Deeper</span>
        <strong>{paceLabel}</strong>
      </label>
      <label className="motion-control">
        <input type="checkbox" checked={reducedMotion} onChange={(event) => onReducedMotion(event.target.checked)} />
        Static transitions
      </label>
    </div>
  )
}

function SourcePanel({ lesson, frame }: { lesson: LessonPackage; frame: SemanticFrame }) {
  const span = frame.source_spans[0]
  return (
    <aside id="source-context" className="source-panel" aria-label="Original source context">
      <header>
        <p className="eyebrow">Original source</p>
        <h2>Page {span.page_number}</h2>
        <span>Region {span.bbox_normalized.map((value) => value.toFixed(2)).join(' · ')}</span>
      </header>
      <object
        className="pdf-viewer"
        data={sourceFileUrl(lesson.source.id, span.page_number)}
        type="application/pdf"
        aria-label={`${lesson.source.original_name}, page ${span.page_number}`}
      >
        <a href={sourceFileUrl(lesson.source.id, span.page_number)}>Open the source PDF</a>
      </object>
      <blockquote>{span.extracted_text}</blockquote>
      <p className="provenance-note">Explicit source material · draft extraction · no generated paraphrase</p>
    </aside>
  )
}

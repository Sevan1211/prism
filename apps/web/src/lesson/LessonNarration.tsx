import { useEffect, useMemo, useRef, useState } from 'react'
import { SpeakerHigh } from '@phosphor-icons/react'
import type { LessonDocument } from './lessonDocumentTypes'
import { lessonNarrationSections, type NarrationPassage } from './narrationScript'

interface Playback {
  generation: number
  passages: NarrationPassage[]
  index: number
  voice: SpeechSynthesisVoice
  rate: number
}

function localVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  // A missing localService flag is not evidence that a voice stays on device.
  return synth.getVoices().filter(voice => voice.localService === true)
}

function voiceId(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}|${voice.lang}|${voice.name}`
}

export function LessonNarration({ lesson }: { lesson: LessonDocument }) {
  const sections = useMemo(() => lessonNarrationSections(lesson), [lesson])
  const [open, setOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState(sections[0]?.sectionId ?? '')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [requestedVoice, setRequestedVoice] = useState('')
  const [rate, setRate] = useState(1)
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused' | 'finished' | 'error'>('idle')
  const [error, setError] = useState('')
  const [active, setActive] = useState<{ blockId: string; index: number; count: number } | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const generation = useRef(0)
  const synth = useMemo(() => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
    ? window.speechSynthesis : null, [])
  const preferredVoice = voices.find(voice => voiceId(voice) === requestedVoice)
    ?? voices.find(voice => voice.lang.toLowerCase().startsWith('en')) ?? voices[0]
  const chosenSection = sections.find(section => section.sectionId === selectedSection) ?? sections[0]
  const compact = status === 'playing' || status === 'paused'

  useEffect(() => {
    if (!synth) return
    const update = () => setVoices(localVoices(synth))
    update()
    synth.addEventListener('voiceschanged', update)
    return () => {
      synth.removeEventListener('voiceschanged', update)
      generation.current += 1
      synth.cancel()
    }
  }, [synth])

  function stop() {
    generation.current += 1
    synth?.cancel()
    setStatus('idle')
    setError('')
    setActive(null)
  }

  function finish() {
    setStatus('finished')
    setActive(null)
  }

  function speakNext(run: Playback) {
    if (!synth || run.generation !== generation.current) return
    const passage = run.passages[run.index]
    if (!passage) { finish(); return }
    const utterance = new SpeechSynthesisUtterance(passage.text)
    utterance.voice = run.voice
    utterance.lang = run.voice.lang
    utterance.rate = run.rate
    utterance.onstart = () => {
      if (run.generation === generation.current) setActive({ blockId: passage.blockId, index: run.index, count: run.passages.length })
    }
    utterance.onend = () => {
      if (run.generation !== generation.current) return
      run.index += 1
      speakNext(run)
    }
    utterance.onerror = event => {
      if (run.generation !== generation.current) return
      setStatus('error')
      setActive(null)
      setError(`Speech stopped (${event.error}). Try playing the section again.`)
    }
    try { synth.speak(utterance) }
    catch {
      setStatus('error')
      setActive(null)
      setError('This browser could not start the selected local voice.')
    }
  }

  function play() {
    if (!synth || !preferredVoice || !chosenSection?.passages.length) return
    stop()
    synth.resume()
    const run: Playback = { generation: generation.current, passages: chosenSection.passages, index: 0, voice: preferredVoice, rate }
    setStatus('playing')
    speakNext(run)
  }

  function close() {
    stop()
    setOpen(false)
    toggleRef.current?.focus()
  }

  function showPassage(blockId: string) {
    const block = document.getElementById(`block-${blockId}`)
    block?.focus({ preventScroll: true })
    block?.scrollIntoView({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return <>
    <button ref={toggleRef} type="button" aria-pressed={open} aria-controls="lesson-narration-panel" onClick={() => open ? close() : setOpen(true)}><SpeakerHigh aria-hidden="true" /> Listen</button>
    {open ? <aside id="lesson-narration-panel" className="lesson-narration-panel" aria-label="Lesson narration">
      <div className="lesson-narration-heading"><div><span>LOCAL AUDIO</span><strong>Listen to this lesson</strong></div><button type="button" onClick={close} aria-label="Close narration">×</button></div>
      {compact ? <p className="lesson-narration-playing">{chosenSection?.title} · {rate}×</p> : <>
        <p className="lesson-narration-note">Uses voices your browser identifies as local. Practice answers stay behind their reveal controls; inspect equations and visuals on screen for exact notation.</p>
        <label className="lesson-narration-section">Section <select value={chosenSection?.sectionId ?? ''} onChange={event => { stop(); setSelectedSection(event.target.value) }} disabled={!sections.length}>{sections.map(section => <option key={section.sectionId} value={section.sectionId}>{section.title}</option>)}</select></label>
        <details className="lesson-narration-settings"><summary>Voice and speed · {preferredVoice?.name ?? 'No local voice'}</summary><div>
          <label>Local voice <select value={preferredVoice ? voiceId(preferredVoice) : ''} onChange={event => { stop(); setRequestedVoice(event.target.value) }} disabled={!voices.length}>{voices.length ? voices.map(voice => <option key={voiceId(voice)} value={voiceId(voice)}>{voice.name} ({voice.lang})</option>) : <option value="">No verified local voice</option>}</select></label>
          <label>Speed <select value={rate} onChange={event => { stop(); setRate(Number(event.target.value)) }}><option value={0.8}>0.8×</option><option value={1}>1×</option><option value={1.2}>1.2×</option><option value={1.5}>1.5×</option></select></label>
        </div></details>
      </>}
      <div className="lesson-narration-actions">
        {status === 'paused' ? <button type="button" onClick={() => { synth?.resume(); setStatus('playing') }}>Resume</button>
          : status === 'playing' ? <button type="button" onClick={() => { synth?.pause(); setStatus('paused') }}>Pause</button>
            : <button type="button" onClick={play} disabled={!synth || !preferredVoice || !chosenSection?.passages.length}>Play section</button>}
        <button type="button" onClick={stop} disabled={status === 'idle'}>Stop</button>
        {active ? <button type="button" onClick={() => showPassage(active.blockId)}>Show passage</button> : null}
      </div>
      <p className="lesson-narration-status" role="status">{!synth ? 'Speech playback is unavailable in this browser.' : !voices.length ? 'No verified local voice is available. Install or enable a device voice, then refresh the list.' : error || (status === 'finished' ? 'Section finished.' : status === 'paused' ? 'Paused.' : status === 'playing' ? 'Playing this section.' : 'Ready to play this section.')}</p>
      {active ? <p className="lesson-narration-progress">Passage part {active.index + 1} of {active.count} · <span>{chosenSection?.title}</span></p> : null}
      {synth && !voices.length ? <button type="button" className="lesson-narration-refresh" onClick={() => setVoices(localVoices(synth))}>Refresh voices</button> : null}
    </aside> : null}
  </>
}

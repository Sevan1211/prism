import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { LessonNarration } from './LessonNarration'
import type { LessonDocument } from './lessonDocumentTypes'

class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null
  lang = ''
  rate = 1
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly text: string) {}
}

const lesson = { sections: [{ section_id: 'one', title: 'First section', blocks: [
  { block_id: 'p1', content: { kind: 'prose', text: 'The middle value is ten.' } },
  { block_id: 'practice', content: { kind: 'practice', prompt: 'Try this.', hints: ['Hidden hint'], solution: 'Hidden answer', reflection: 'Hidden reflection' } },
] }] } as unknown as LessonDocument

function setupVoices(local: boolean) {
  const voices = [
    { name: 'Remote voice', voiceURI: 'remote', lang: 'en-US', localService: false },
    ...(local ? [{ name: 'Device voice', voiceURI: 'device', lang: 'en-US', localService: true }] : []),
  ] as SpeechSynthesisVoice[]
  const synth = {
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    speak: vi.fn(), pause: vi.fn(), resume: vi.fn(), cancel: vi.fn(),
  }
  vi.stubGlobal('speechSynthesis', synth)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  return synth
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('offers only verified local voices, starts on request, and supports pause, resume and stop', async () => {
  const synth = setupVoices(true)
  const user = userEvent.setup()
  render(<LessonNarration lesson={lesson} />)
  await user.click(screen.getByRole('button', { name: 'Listen' }))
  expect(synth.speak).not.toHaveBeenCalled()
  await user.click(screen.getByText(/Voice and speed/))
  expect(screen.getByRole('option', { name: 'Device voice (en-US)' })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /Remote voice/ })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Play section' }))
  expect(synth.speak).toHaveBeenCalledTimes(1)
  const first = synth.speak.mock.calls[0][0] as FakeUtterance
  expect(first.voice?.voiceURI).toBe('device')
  expect(first.text).toBe('The middle value is ten.')
  await user.click(screen.getByRole('button', { name: 'Pause' }))
  expect(synth.pause).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Resume' }))
  expect(synth.resume).toHaveBeenCalled()
  act(() => first.onend?.())
  const second = synth.speak.mock.calls[1][0] as FakeUtterance
  expect(second.text).toContain('Try this.')
  expect(second.text).not.toContain('Hidden answer')
  await user.click(screen.getByRole('button', { name: 'Stop' }))
  expect(synth.cancel).toHaveBeenCalled()
  act(() => second.onend?.())
  expect(synth.speak).toHaveBeenCalledTimes(2)
})

it('does not speak when the browser only reports remote voices', async () => {
  const synth = setupVoices(false)
  const user = userEvent.setup()
  render(<LessonNarration lesson={lesson} />)
  await user.click(screen.getByRole('button', { name: 'Listen' }))
  expect(screen.getByRole('button', { name: 'Play section' })).toBeDisabled()
  expect(screen.getByText(/No verified local voice is available/)).toBeVisible()
  expect(synth.speak).not.toHaveBeenCalled()
})

it('cancels speech and ignores late completion when the reader closes', async () => {
  const synth = setupVoices(true)
  const user = userEvent.setup()
  const view = render(<LessonNarration lesson={lesson} />)
  await user.click(screen.getByRole('button', { name: 'Listen' }))
  await user.click(screen.getByRole('button', { name: 'Play section' }))
  const first = synth.speak.mock.calls[0][0] as FakeUtterance

  view.unmount()
  expect(synth.cancel).toHaveBeenCalled()
  act(() => first.onend?.())
  expect(synth.speak).toHaveBeenCalledTimes(1)
})

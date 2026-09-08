import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { containDialogFocus } from './dialogKeyboard'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('wraps focus around visible controls and excludes inactive panels and disabled actions', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  render(<dialog open onKeyDown={containDialogFocus}>
    <button>Close</button><div tabIndex={0}>Scrollable instructions</div><a href="#guide">Guide</a>
    <button disabled>Save</button><div hidden><button>Hidden profile action</button></div>
  </dialog>)
  const first = screen.getByRole('button', { name: 'Close' }), last = screen.getByRole('link')
  first.focus(); fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(first).toHaveFocus()
  const scroll = screen.getByText('Scrollable instructions')
  scroll.focus()
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
  scroll.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
})

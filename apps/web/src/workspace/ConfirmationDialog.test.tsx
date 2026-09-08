import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmationDialog } from './ConfirmationDialog'

afterEach(cleanup)

const content = { title: 'Remove this source?', itemName: 'A private textbook', kind: 'source' as const, confirmLabel: 'Remove source', children: <p>The PDF and its lessons are removed.</p> }

describe('removal confirmation', () => {
  it('starts on Cancel and does no work when cancelled', () => {
    const onConfirm = vi.fn(), onClose = vi.fn()
    render(<ConfirmationDialog {...content} onConfirm={onConfirm} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('prevents duplicate removal and Escape dismissal while work is pending', async () => {
    let finish!: () => void
    const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve })), onClose = vi.fn()
    render(<ConfirmationDialog {...content} onConfirm={onConfirm} onClose={onClose} />)
    const remove = screen.getByRole('button', { name: 'Remove source' })
    fireEvent.click(remove)
    fireEvent.click(remove)
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => finish())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps errors in the dialog and permits a deliberate retry', async () => {
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValueOnce(undefined)
    const onClose = vi.fn()
    render(<ConfirmationDialog {...content} onConfirm={onConfirm} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove source' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable')
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove source' }))
    await act(async () => {})
    expect(onConfirm).toHaveBeenCalledTimes(2)
    expect(onClose).toHaveBeenCalledOnce()
  })
})

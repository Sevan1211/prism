import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BookBookmark, FolderSimple, Trash, X } from '@phosphor-icons/react'
import './confirmationDialog.css'

export function ConfirmationDialog({ title, itemName, kind, children, confirmLabel, onConfirm, onClose, focusAfterSuccess }: {
  title: string
  itemName: string
  kind: 'source' | 'folder'
  children: ReactNode
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
  focusAfterSuccess?: () => HTMLElement | null
}) {
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const pendingRef = useRef(false)
  const completedRef = useRef(false)
  const successFocusRef = useRef(focusAfterSuccess)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const Icon = kind === 'folder' ? FolderSimple : BookBookmark

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusCompleted = successFocusRef.current
    dialog?.showModal()
    cancelRef.current?.focus()
    return () => {
      dialog?.close?.()
      // The removed item's trigger disappears. Return to the remaining library.
      requestAnimationFrame(() => {
        const target = completedRef.current ? focusCompleted?.() : previous
        if (target?.isConnected) target.focus()
      })
    }
  }, [])

  async function confirm() {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setError('')
    try {
      await onConfirm()
      completedRef.current = true
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The item could not be removed. Please try again.')
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="confirmation-dialog" tabIndex={-1} aria-labelledby={id + '-title'} aria-describedby={`${id}-item ${id}-description`}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
        const first = controls[0], last = controls.at(-1)
        if (!first) { event.preventDefault(); return }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}
      onCancel={event => { event.preventDefault(); if (!pendingRef.current) onClose() }}>
      <header><h2 id={id + '-title'}>{title}</h2>
        <button className="icon-button" type="button" aria-label="Close confirmation" disabled={pending} onClick={onClose}><X aria-hidden="true" /></button>
      </header>
      <div className="confirmation-item" id={id + '-item'}><Icon aria-hidden="true" weight="duotone" /><strong>{itemName}</strong></div>
      <div className="confirmation-description" id={id + '-description'}>{children}</div>
      {error ? <p className="confirmation-error" role="alert">{error}</p> : null}
      <footer>
        <button ref={cancelRef} className="button-secondary" type="button" disabled={pending} onClick={onClose}>Cancel</button>
        <button className="button-primary" type="button" disabled={pending} onClick={() => void confirm()}><Trash aria-hidden="true" /><span aria-live="polite">{pending ? 'Removing…' : confirmLabel}</span></button>
      </footer>
    </dialog>
  )
}

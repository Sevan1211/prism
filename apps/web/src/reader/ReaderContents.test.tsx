import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { SourceSection } from '../types'
import { ReaderContents } from './ReaderContents'

afterEach(cleanup)
const sections: SourceSection[] = [
  { id: 'first', title: '1 Foundations', level: 1, parent_id: null, page_start: 3, page_end: 20, origin: 'computed', confidence: .9 },
  { id: 'child', title: '1.1 Energy', level: 2, parent_id: 'first', page_start: 5, page_end: 20, origin: 'computed', confidence: .9 },
  { id: 'second', title: '2 Motion', level: 1, parent_id: null, page_start: 21, page_end: 40, origin: 'computed', confidence: .9 },
]

it('starts compact, retains source section numbers, and omits injected page labels', () => {
  const onNavigate = vi.fn()
  const { container } = render(<ReaderContents sections={sections} query="" onNavigate={onNavigate} />)
  expect(screen.getByRole('button', { name: '1 Foundations' })).toBeVisible()
  expect(screen.queryByRole('button', { name: '1.1 Energy' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Expand Foundations' }))
  fireEvent.click(screen.getByRole('button', { name: '1.1 Energy' }))
  expect(onNavigate).toHaveBeenCalledWith(sections[1])
  expect(container.querySelector('.rail-page')).toBeNull()
  expect(screen.queryByTitle(/PDF page/)).not.toBeInTheDocument()
})

it('reveals the active path and matching descendants without expanding every chapter', () => {
  const { rerender } = render(<ReaderContents sections={sections} query="" activeId="child" onNavigate={vi.fn()} />)
  expect(screen.getByRole('button', { name: '1.1 Energy' })).toBeVisible()
  rerender(<ReaderContents sections={sections} query="Energy" onNavigate={vi.fn()} />)
  expect(screen.getByRole('button', { name: '1.1 Energy' })).toBeVisible()
  expect(screen.queryByRole('button', { name: '2 Motion' })).not.toBeInTheDocument()
})

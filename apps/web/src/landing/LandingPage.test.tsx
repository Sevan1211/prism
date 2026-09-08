import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

beforeEach(() => {
  localStorage.removeItem('prism-theme')
  delete document.documentElement.dataset.theme
})
afterEach(() => {
  cleanup()
  localStorage.removeItem('prism-theme')
  delete document.documentElement.dataset.theme
})

describe('landing optical studio', () => {
  it('updates the wavelength study, supports reset, and preserves source access', () => {
    render(<LandingPage />)
    const slider = screen.getByRole('slider', { name: 'Try a different wavelength' })
    expect(slider).toHaveValue('550')
    fireEvent.change(slider, { target: { value: '380' } })
    expect(screen.getByRole('img', { name: /enlarged wave at 380 nanometers/ })).toBeInTheDocument()
    expect(screen.getByText('Shorter wavelength · closer peaks')).toBeVisible()
    fireEvent.change(slider, { target: { value: '700' } })
    expect(screen.getByRole('img', { name: /enlarged wave at 700 nanometers/ })).toBeInTheDocument()
    expect(screen.getByText('Longer wavelength · wider peaks')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(slider).toHaveValue('550')
    expect(screen.getByRole('link', { name: /Read NASA’s Visible Light/ })).toHaveAttribute('href', 'https://science.nasa.gov/ems/09_visiblelight/')
    expect(screen.getByRole('link', { name: 'Open your library' })).toHaveAttribute('href', '/sources')
    expect(screen.getByRole('link', { name: 'Bring your own source' })).toHaveAttribute('href', '/sources')
  })

  it('connects each explanation to its passage and returns keyboard focus to the source', () => {
    render(<LandingPage />)
    fireEvent.click(screen.getByRole('button', { name: 'The visible spectrum' }))
    expect(screen.getByRole('heading', { name: 'A small window into light.' })).toBeVisible()
    const passage = screen.getByText(/^Visible light is the portion/)
    passage.scrollIntoView = vi.fn()
    expect(passage).toHaveClass('is-connected')
    fireEvent.click(screen.getByRole('button', { name: 'Find this in the passage' }))
    expect(passage).toHaveFocus()
    expect(passage.scrollIntoView).toHaveBeenCalled()
    fireEvent.change(screen.getByRole('slider'), { target: { value: '650' } })
    expect(screen.getByRole('button', { name: 'Wavelength & color' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/^Within this range/)).toHaveClass('is-connected')
    expect(passage).not.toHaveClass('is-connected')
  })

  it('retains the original SVG underneath the decorative flow without a canvas or camera controls', () => {
    const { container } = render(<LandingPage />)
    const image = screen.getByRole('img', { name: /White light enters a black prism/ })
    expect(image).toHaveAttribute('src', expect.stringContaining('prism-hero.svg'))
    expect(image).toHaveAttribute('width', '1600')
    expect(image).toHaveAttribute('height', '850')
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.queryByRole('button', { name: /Pause rainbow|Resume rainbow/ })).not.toBeInTheDocument()
  })

  it('uses the shared persisted light, dark, and automatic theme choice', () => {
    render(<LandingPage />)
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    fireEvent.click(screen.getByRole('button', { name: /Theme: System/ }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('prism-theme')).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: /Theme: Light/ }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('prism-theme')).toBe('dark')
    expect(screen.getByRole('link', { name: 'Open your library' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Theme: Night/ }))
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem('prism-theme')).toBeNull()
  })
})

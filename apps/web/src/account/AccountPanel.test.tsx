import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AccountPanel } from './AccountPanel'

vi.mock('./ClerkAccount', () => ({ default: () => <div>Provider account controls</div> }))
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

it('keeps unconfigured accounts truthful and does not mount the identity provider', () => {
  vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', '')
  render(<AccountPanel />)
  expect(screen.getByText('Accounts are being connected.')).toBeVisible()
  expect(screen.getByText(/1 GB of cloud storage/)).toBeVisible()
  expect(screen.getByText(/Signing in won’t upload/)).toBeVisible()
  expect(screen.queryByText('Provider account controls')).not.toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

it('loads account controls only when the public application key is configured', async () => {
  vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_example')
  render(<AccountPanel />)
  expect(await screen.findByText('Provider account controls')).toBeVisible()
  expect(screen.queryByText('Accounts are being connected.')).not.toBeInTheDocument()
})

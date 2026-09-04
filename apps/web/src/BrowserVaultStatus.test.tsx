import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { BrowserVaultStatus } from './BrowserVaultStatus'
import { inspectBrowserVault, requestBrowserPersistence } from './storage/browserVault'

vi.mock('./storage/browserVault', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storage/browserVault')>()
  return {
    ...actual,
    inspectBrowserVault: vi.fn(),
    requestBrowserPersistence: vi.fn(),
  }
})

const atRisk = {
  detail: 'Local storage is available, but the browser may evict it under storage pressure.',
  initializedAt: '2026-08-29T12:00:00.000Z',
  metadataRecovered: false,
  persistence: 'not_granted' as const,
  quotaBytes: 2 * 1024 * 1024 * 1024,
  quotaWarning: false,
  schemaVersion: 3,
  state: 'at_risk' as const,
  usageBytes: 128 * 1024 * 1024,
}

beforeEach(() => {
  vi.mocked(inspectBrowserVault).mockResolvedValue(atRisk)
  vi.mocked(requestBrowserPersistence).mockResolvedValue({
    ...atRisk,
    detail: 'The browser has marked this origin for persistent local storage.',
    persistence: 'granted',
    state: 'ready',
  })
})

it('shows truthful capacity and requests persistence only after the learner acts', async () => {
  render(<BrowserVaultStatus />)

  expect(await screen.findByText('Browser vault ready; persistence not granted')).toBeVisible()
  expect(screen.getByText('128 MB')).toBeVisible()
  expect(screen.getByText('2.0 GB')).toBeVisible()
  expect(requestBrowserPersistence).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Protect local storage' }))

  await waitFor(() => expect(requestBrowserPersistence).toHaveBeenCalledOnce())
  expect(await screen.findByText('Browser vault protected')).toBeVisible()
})

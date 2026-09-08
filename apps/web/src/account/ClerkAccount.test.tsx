import { useState, type ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import ClerkAccount from './ClerkAccount'
import { bindCloudIdentity, startSyncWatching } from '../storage/syncedLibrary'

const session = vi.hoisted(() => ({ signedIn: true, owner: 'user_test', getToken: vi.fn(async () => 'token'), unbind: vi.fn(), stop: vi.fn() }))
vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useUser: () => ({ isLoaded: true, isSignedIn: session.signedIn, user: { id: session.owner, username: 'reader' } }),
  useAuth: () => ({ getToken: session.getToken }),
  useClerk: () => ({ signOut: vi.fn() }),
  SignIn: ({ forceRedirectUrl, signUpForceRedirectUrl }: { forceRedirectUrl: string; signUpForceRedirectUrl: string }) => <div aria-label="Sign-in form" data-return={forceRedirectUrl} data-signup-return={signUpForceRedirectUrl} />,
  SignUp: ({ forceRedirectUrl, signInForceRedirectUrl, signInUrl }: { forceRedirectUrl: string; signInForceRedirectUrl: string; signInUrl: string }) => <div aria-label="Sign-up form" data-return={forceRedirectUrl} data-signin-return={signInForceRedirectUrl} data-signin-url={signInUrl} />,
  UserProfile: () => { const [value, setValue] = useState(''); return <input aria-label="Profile draft" value={value} onChange={e => setValue(e.target.value)} /> },
}))
vi.mock('../storage/syncedLibrary', () => ({ bindCloudIdentity: vi.fn(() => session.unbind), startSyncWatching: vi.fn(() => session.stop), settleCloudAccount: vi.fn() }))
vi.mock('./CloudStoragePanel', () => ({ CloudStoragePanel: () => { const [copy, setCopy] = useState(false); return <label><input type="checkbox" checked={copy} onChange={e => setCopy(e.target.checked)} />Copy choice</label> } }))
afterEach(() => { cleanup(); vi.clearAllMocks(); session.owner = 'user_test'; session.signedIn = true; window.history.replaceState(null, '', '/') })

it('offers explicit account creation and keeps both authentication flows in the library', () => {
  session.signedIn = false
  window.history.replaceState(null, '', '/sources?query=physics#/create')
  render(<ClerkAccount publishableKey="test" />)
  const destination = '/sources?query=physics&prism_account=1'
  expect(screen.getByLabelText('Sign-in form')).toHaveAttribute('data-return', destination)
  expect(screen.getByLabelText('Sign-in form')).toHaveAttribute('data-signup-return', destination)
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  expect(window.location.hash).toBe('')
  expect(screen.getByLabelText('Sign-up form')).toHaveAttribute('data-return', destination)
  expect(screen.getByLabelText('Sign-up form')).toHaveAttribute('data-signin-return', destination)
  expect(screen.getByLabelText('Sign-up form')).toHaveAttribute('data-signin-url', destination)
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(screen.getByLabelText('Sign-in form')).toBeInTheDocument()
})

it('preserves storage choices and profile drafts across tab switches without reconnecting sync', () => {
  render(<ClerkAccount publishableKey="test" />)
  fireEvent.click(screen.getByRole('checkbox', { name: 'Copy choice' }))
  fireEvent.click(screen.getByRole('tab', { name: 'Account & security' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Profile draft' }), { target: { value: 'Unsaved change' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Storage' }))
  expect(screen.getByRole('checkbox')).toBeChecked()
  expect(screen.queryByRole('textbox')).toBeNull()
  fireEvent.click(screen.getByRole('tab', { name: 'Account & security' }))
  expect(screen.getByRole('textbox')).toHaveValue('Unsaved change')
  expect(bindCloudIdentity).toHaveBeenCalledTimes(1)
  expect(startSyncWatching).toHaveBeenCalledTimes(1)
})

it('supports arrow navigation and resets panel drafts when the account changes', () => {
  const view = render(<ClerkAccount publishableKey="test" />)
  const storage = screen.getByRole('tab', { name: 'Storage' })
  storage.focus()
  fireEvent.keyDown(storage, { key: 'ArrowRight' })
  expect(screen.getByRole('tab', { name: 'Account & security' })).toHaveFocus()
  expect(screen.getByRole('tab', { name: 'Account & security' })).toHaveAttribute('aria-selected', 'true')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'First owner draft' } })
  session.owner = 'user_other'
  view.rerender(<ClerkAccount publishableKey="test" />)
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(session.unbind).toHaveBeenCalledTimes(1)
  expect(bindCloudIdentity).toHaveBeenLastCalledWith('user_other', expect.any(Function))
})

it('uses refreshed token getters without disconnecting the current library', async () => {
  const view = render(<ClerkAccount publishableKey="test" />)
  session.getToken = vi.fn(async () => 'refreshed')
  view.rerender(<ClerkAccount publishableKey="test" />)
  expect(bindCloudIdentity).toHaveBeenCalledTimes(1)
  const getter = vi.mocked(bindCloudIdentity).mock.calls[0][1]
  expect(await getter()).toBe('refreshed')
})

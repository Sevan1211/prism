import { ClerkProvider, SignIn, SignUp, UserProfile, useAuth, useClerk, useUser } from '@clerk/react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { SignOut } from '@phosphor-icons/react'
import { accountReturnPath } from './accountReturn'
import { CloudStoragePanel } from './CloudStoragePanel'
import { bindCloudIdentity, startSyncWatching, settleCloudAccount } from '../storage/syncedLibrary'

function AccountControls() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const clerk = useClerk()
  const [view, setView] = useState<'storage' | 'profile'>('storage')
  const [profileVisited, setProfileVisited] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const tabsId = useId()
  const tokenGetter = useRef(getToken)
  useLayoutEffect(() => { tokenGetter.current = getToken }, [getToken])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const owner = user?.id
  useLayoutEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !owner) { settleCloudAccount(); return }
    const unbind = bindCloudIdentity(owner, () => tokenGetter.current()), stop = startSyncWatching()
    return () => { unbind(); stop() }
  }, [isLoaded, isSignedIn, owner])
  function selectView(next: 'storage' | 'profile') { setView(next); if (next === 'profile') setProfileVisited(true) }
  if (!isLoaded) return <p role="status">Connecting to your account… Your local library remains available.</p>
  if (isSignedIn) return <div className="account-session">
    <div className="account-identity"><div><span className="account-avatar" aria-hidden="true">{(user.username || 'P').slice(0, 1).toUpperCase()}</span><div><strong>{user.username || user.primaryEmailAddress?.emailAddress || 'Your PRISM account'}</strong><p>Personal account</p></div></div><button className="button-quiet" type="button" disabled={busy} onClick={async () => {
      setError(''); setBusy(true)
      try { await clerk.signOut(); setView('storage') } catch { setError('Sign-out couldn’t finish. Please try again.') }
      finally { setBusy(false) }
    }}><SignOut />{busy ? 'Signing out…' : 'Sign out'}</button></div>
    <div className="account-tabs" role="tablist" aria-label="Account sections" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const next = event.key === 'Home' ? 'storage' : event.key === 'End' ? 'profile' : view === 'storage' ? 'profile' : 'storage'
      selectView(next)
      event.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus()
    }}>
      {(['storage', 'profile'] as const).map(name => <button key={name} type="button" role="tab" data-view={name} id={`${tabsId}-${name}-tab`} aria-controls={`${tabsId}-${name}-panel`} aria-selected={view === name} tabIndex={view === name ? 0 : -1} onClick={() => selectView(name)}>{name === 'storage' ? 'Storage' : 'Account & security'}</button>)}
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="account-views" key={user.id}>
      <div className="account-view" role="tabpanel" tabIndex={0} id={`${tabsId}-storage-panel`} aria-labelledby={`${tabsId}-storage-tab`} hidden={view !== 'storage'}><CloudStoragePanel /></div>
      <div className="account-view account-profile" role="tabpanel" tabIndex={0} id={`${tabsId}-profile-panel`} aria-labelledby={`${tabsId}-profile-tab`} hidden={view !== 'profile'}>{profileVisited && <UserProfile routing="hash" />}</div>
    </div>
  </div>
  const returnTo = accountReturnPath(window.location.pathname, window.location.search)
  return <div className="account-auth"><p className="account-auth-caption">Your library, wherever you read.</p>
    <div className="account-auth-options" role="group" aria-label="Sign in or create an account">
      {([false, true] as const).map(create => <button type="button" key={String(create)} aria-pressed={creatingAccount === create} onClick={() => {
        if (creatingAccount === create) return
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
        setCreatingAccount(create)
      }}>{create ? 'Create account' : 'Sign in'}</button>)}
    </div>
    {creatingAccount
      ? <SignUp routing="hash" signInUrl={returnTo} forceRedirectUrl={returnTo} signInForceRedirectUrl={returnTo} appearance={{ elements: { footerAction: { display: 'none' } } }} />
      : <SignIn routing="hash" withSignUp signInUrl={returnTo} signUpUrl={returnTo} forceRedirectUrl={returnTo} signUpForceRedirectUrl={returnTo} appearance={{ elements: { footerAction: { display: 'none' } } }} />}
    <p className="account-privacy">Signing in won’t upload your files or give an agent access to them.</p>
  </div>
}

export default function ClerkAccount({ publishableKey }: { publishableKey: string }) {
  return <ClerkProvider publishableKey={publishableKey} appearance={{
    variables: { colorPrimary: 'var(--prism-account-primary)', colorPrimaryForeground: 'var(--prism-account-on-primary)', colorBackground: 'var(--prism-account-surface)', colorForeground: 'var(--prism-account-ink)', colorMutedForeground: 'var(--prism-account-muted)', colorInput: 'var(--prism-account-input)', colorInputForeground: 'var(--prism-account-ink)', borderRadius: '0.5rem', fontFamily: 'var(--prism-account-font)' },
    elements: { rootBox: { width: '100%', minWidth: 0 }, cardBox: { width: '100%', minWidth: 0, boxShadow: 'none', background: 'transparent' }, card: { boxShadow: 'none', background: 'transparent' }, footer: { background: 'transparent', backgroundImage: 'none' }, formButtonPrimary: { background: 'var(--prism-account-primary)', backgroundImage: 'none', color: 'var(--prism-account-on-primary)', boxShadow: 'none' } },
  }}><AccountControls /></ClerkProvider>
}

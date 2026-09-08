import { Component, lazy, Suspense, type ReactNode } from 'react'
import { Cloud, ShieldCheck } from '@phosphor-icons/react'
import { CLOUD_POLICY } from '../../../../shared/cloudPolicy'
import './account.css'

const ClerkAccount = lazy(() => import('./ClerkAccount'))

class AccountBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div role="alert"><p>Account sign-in couldn’t load. Your local library is still available.</p><button type="button" onClick={() => window.location.reload()}>Reload account connection</button></div>
      : this.props.children
  }
}

export function AccountPanel() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()
  return <section className="account-panel" aria-label="PRISM account">
    {!publishableKey && <><div className="account-intro"><Cloud aria-hidden="true" /><div>
      <h3>Your library, wherever you read.</h3>
      <p>{CLOUD_POLICY.quotaLabel} of cloud storage per account is planned for the beta. PDFs, lessons and saved versions share this allowance.</p>
    </div></div>
    <p className="account-privacy"><ShieldCheck aria-hidden="true" />Signing in won’t upload your files or give an agent access to them.</p></>}
    {publishableKey
      ? <AccountBoundary><Suspense fallback={<p role="status">Loading account sign-in…</p>}>
        <ClerkAccount publishableKey={publishableKey} />
      </Suspense></AccountBoundary>
      : <div className="account-notice" role="status"><strong>Accounts are being connected.</strong>
        <p>Username and password sign-in, Google sign-in and account recovery will be available here after setup. Keep reading and saving on this browser in the meantime.</p>
      </div>}
  </section>
}

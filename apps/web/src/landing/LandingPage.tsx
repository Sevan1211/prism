import { ArrowRight } from '@phosphor-icons/react'
import { PrismLink } from '../PrismLink'
import { ThemeToggle } from '../ThemeToggle'
import { PrismWordmark } from '../PrismWordmark'
import { libraryPath } from '../navigation'
import { PrismIllustration } from './PrismIllustration'
import { SpectrumStudy } from './SpectrumStudy'
import './landing.css'

export function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#landing-content">Skip to content</a>
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-identity"><PrismLink className="landing-brand" href="/" aria-label="PRISM home"><PrismWordmark /></PrismLink><span className="landing-brand-note">A source-grounded reading workspace</span></div>
          <nav className="landing-nav" aria-label="PRISM overview">
            <a href="#studio">Explore</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="landing-content" tabIndex={-1}>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-inner">
            <div className="landing-hero-content">
              <h1 id="landing-title">Make sense of <br /><em>what you read.</em></h1>
              <div className="landing-hero-copy">
                <p>Your sources, opened up. Detailed explanations, connected ideas, and the original always within reach.</p>
                <PrismLink className="landing-primary-action" href={libraryPath()}>Open your library <span className="landing-action-icon"><ArrowRight weight="bold" aria-hidden="true" /></span></PrismLink>
                <p className="landing-entry-note">Read locally without an account. Create lessons with a compatible AI agent.</p>
              </div>
            </div>
          </div>
          <PrismIllustration />
        </section>
        <section className="landing-studio" id="studio" aria-labelledby="studio-title">
          <div className="studio-intro">
            <h2 id="studio-title">Read it.<br /><em>See it.</em></h2>
            <p>A passage becomes an explanation you can explore. See how PRISM connects the words to the idea.</p>
          </div>
          <SpectrumStudy />
          <div className="studio-afterword">
            <p>Your source stays in view.<br />Your understanding has room to grow.</p>
            <span>Read the explanation. Try the visual. Follow it back.</span>
          </div>
        </section>
        <section className="landing-invitation" aria-labelledby="invitation-title">
          <div><h2 id="invitation-title">What are you<br /><em>reading?</em></h2></div>
          <div className="invitation-copy"><p>A paper. A textbook. The chapter you keep coming back to.</p><p>Bring your PDF, read the original, and work with your AI agent on a lesson worth keeping.</p><PrismLink className="invitation-action" href={libraryPath()}>Bring your own source <ArrowRight aria-hidden="true" /></PrismLink></div>
        </section>
      </main>
      <footer className="landing-footer">
        <div><PrismLink className="landing-brand" href="/" aria-label="PRISM home"><PrismWordmark /></PrismLink><p>Personalized Representation and Information Streaming for Meaning</p></div>
        <div><p>Local-first. No account needed to begin.</p><p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Beta terms</a> · <a href="https://github.com/Sevan1211/prism/issues">Feedback</a></p></div>
      </footer>
    </div>
  )
}

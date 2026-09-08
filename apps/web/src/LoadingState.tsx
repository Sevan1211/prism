import { ArrowLeft } from '@phosphor-icons/react'

export function LoadingState({ title, detail, onBack, error, onRetry, compact = false }: {
  title: string; detail: string; onBack?: () => void; error?: string | null; onRetry?: () => void; compact?: boolean
}) {
  return <section className={`loading-state${compact ? ' loading-state-inline' : ''}`} aria-busy={!error}>
    {onBack && <button className="button-quiet loading-back" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back to source</button>}
    <div className="loading-content">
      {!error && <div className="loading-paper" aria-hidden="true"><span /><span /><span /><span /><span /></div>}
      <div role={error ? 'alert' : 'status'}><h2>{error ? 'The document could not open' : title}</h2><p>{error ? 'Your source is still saved. Try opening it again.' : detail}</p></div>
      {error && <><button className="button-primary" onClick={onRetry}>Try again</button><details className="loading-diagnostic"><summary>Technical details</summary><p>{error}</p></details></>}
    </div>
  </section>
}

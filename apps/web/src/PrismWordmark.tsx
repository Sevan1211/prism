import wordmark from './assets/prism-wordmark.svg'
import './wordmark.css'

/** Decorative wordmark: its parent supplies the accessible product name. */
export function PrismWordmark() {
  return (
    <svg className="prism-wordmark" viewBox="350 135 1110 565" aria-hidden="true" focusable="false">
      <use href={`${wordmark}#wordmark`} />
    </svg>
  )
}

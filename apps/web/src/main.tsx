import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './ErrorBoundary'
import { SourceInspectionHost } from './reader/SourceInspection'
import './tokens.css'
import './styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('PRISM root element is missing')
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <SourceInspectionHost />
    </ErrorBoundary>
  </StrictMode>,
)

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PRISM interface error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }
    return (
      <main className="library-shell" role="alert">
        <h1>PRISM hit an interface error</h1>
        <p className="error-message">{this.state.error.message}</p>
        <p>
          Your sources and lessons are unaffected; this is a display failure only. Reload to
          return to the library.
        </p>
        <button
          className="primary-action"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reload PRISM
        </button>
      </main>
    )
  }
}

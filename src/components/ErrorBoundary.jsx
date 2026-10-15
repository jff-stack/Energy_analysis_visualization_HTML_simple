import { Component } from 'react'

/**
 * ErrorBoundary — contains a render error to one part of the page.
 *
 * Without it, an exception anywhere in the tree unmounts the whole app and
 * leaves a blank screen. With it, the failing section shows a short notice
 * and the rest of the page keeps working.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // Surface it for debugging without interrupting the visitor.
    console.error('Section failed to render:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="border-t border-orange-900/50 px-5 py-12 sm:px-8" role="alert">
        <p className="mx-auto max-w-[1500px] text-sm text-mute">
          {this.props.label ?? 'This section'} could not be displayed.{' '}
          <button className="underline hover:text-ink" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </p>
      </section>
    )
  }
}

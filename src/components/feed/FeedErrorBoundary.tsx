import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[FeedErrorBoundary] Card render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 10,
          padding: '20px 16px',
          textAlign: 'center',
          color: 'var(--text-3)',
          fontSize: 13,
        }}>
          Something went wrong rendering this post.
        </div>
      )
    }
    return this.props.children
  }
}

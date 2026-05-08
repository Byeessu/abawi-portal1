import { Component } from 'react'
import { trackError } from '../lib/observability'

/**
 * Error Boundary - Gestion robuste des erreurs React
 * Capture les erreurs dans les composants enfants et affiche une UI de fallback
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    
    // Tracker l'erreur
    trackError(error, { 
      component: this.props.componentName || 'unknown',
      errorInfo: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    })

    // Log en développement uniquement
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback personnalisée ou par défaut
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div style={{
          padding: '40px 20px',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            ⚠️
          </div>
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '12px',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            Une erreur est survenue
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Nous sommes désolés, mais quelque chose s'est mal passé. 
            Notre équipe a été notifiée et travaille sur le problème.
          </p>
          
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', color: '#ff6b6b', fontWeight: '600' }}>
                Détails de l'erreur (développement)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                color: '#ff9999'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--accent-hover, #16a085)'
                e.target.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--accent)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              🔄 Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.color = 'var(--accent)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.color = 'var(--text-secondary)'
              }}
            >
              🏠 Accueil
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

/**
 * Hook HOC pour wrapper facilement les composants avec ErrorBoundary
 */
export function withErrorBoundary(Component, options = {}) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

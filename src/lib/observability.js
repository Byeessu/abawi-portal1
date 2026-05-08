// Observability bootstrap: Sentry (errors + replay + tracing) + Plausible (analytics) + Web Vitals.
// All providers are no-op when their env vars are missing — safe to call unconditionally.
//
// Required env vars (Vite — must be prefixed VITE_ to reach the browser):
//   VITE_SENTRY_DSN          — Sentry project DSN. Empty = Sentry disabled.
//   VITE_SENTRY_ENVIRONMENT  — "production" | "staging" | "development". Default: import.meta.env.MODE.
//   VITE_RELEASE             — release identifier (commit SHA recommended). Default: "dev".
//   VITE_PLAUSIBLE_DOMAIN    — domain registered in Plausible (e.g. "abawi.sn"). Empty = Plausible disabled.
//   VITE_PLAUSIBLE_HOST      — Plausible API host. Default: "https://plausible.io".

import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

const env = import.meta.env

const SENTRY_DSN = env.VITE_SENTRY_DSN || ''
const SENTRY_ENV = env.VITE_SENTRY_ENVIRONMENT || env.MODE || 'production'
const RELEASE = env.VITE_RELEASE || 'dev'

const PLAUSIBLE_DOMAIN = env.VITE_PLAUSIBLE_DOMAIN || ''
const PLAUSIBLE_HOST = env.VITE_PLAUSIBLE_HOST || 'https://plausible.io'

const IGNORED_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /Non-Error promise rejection captured/i,
  /Load failed/i, // generic Safari network error
]

let initialized = false

export function initObservability() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  initSentry()
  initPlausible()
  reportWebVitals()
}

function initSentry() {
  if (!SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: RELEASE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: SENTRY_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: SENTRY_ENV === 'production' ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: IGNORED_ERROR_PATTERNS,
    beforeSend(event) {
      // Drop events from local development unless explicitly enabled
      if (event.environment === 'development' && !env.VITE_SENTRY_ALLOW_DEV) return null
      return event
    },
  })
}

function initPlausible() {
  if (!PLAUSIBLE_DOMAIN) return
  if (document.querySelector('script[data-plausible-injected]')) return

  // Manual mode: we drive pageviews ourselves via React Router (SPA).
  const script = document.createElement('script')
  script.defer = true
  script.dataset.plausibleInjected = 'true'
  script.dataset.domain = PLAUSIBLE_DOMAIN
  script.src = `${PLAUSIBLE_HOST}/js/script.manual.outbound-links.js`
  document.head.appendChild(script)

  // Queue events fired before the script loads.
  window.plausible = window.plausible || function () {
    ;(window.plausible.q = window.plausible.q || []).push(arguments)
  }
}

function reportWebVitals() {
  const send = (metric) => {
    const value = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)

    if (SENTRY_DSN) {
      Sentry.setMeasurement(
        metric.name,
        metric.value,
        metric.name === 'CLS' ? '' : 'millisecond',
      )
    }

    trackEvent('web-vitals', {
      metric: metric.name,
      value,
      rating: metric.rating,
      id: metric.id,
    })

    if (env.DEV) {
       
      console.log(`[vitals] ${metric.name}=${value} (${metric.rating})`)
    }
  }

  onCLS(send)
  onFCP(send)
  onINP(send)
  onLCP(send)
  onTTFB(send)
}

export function trackEvent(name, props) {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  try {
    window.plausible(name, props ? { props } : undefined)
  } catch {
    // Ignore — analytics must never break the UI.
  }
}

export function trackPageview(url) {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  try {
    window.plausible('pageview', { u: window.location.origin + url })
  } catch {
    // ignore
  }
}

export function captureError(error, context) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, context ? { extra: context } : undefined)
    return
  }
  if (env.DEV) {
     
    console.error('[error]', error, context)
  }
}

export function trackError(error, context) {
  // Alias pour compatibilité - utilise captureError
  captureError(error, context)
}

export function setUser(user) {
  if (!SENTRY_DSN) return
  Sentry.setUser(user ? { id: user.id, email: user.email } : null)
}

// Null-render component: emits a Plausible pageview on every route change.
// Mount once near the top of <App />.
export function RouteAnalytics() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    trackPageview(pathname + search)
  }, [pathname, search])
  return null
}

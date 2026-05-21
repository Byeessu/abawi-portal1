// Observability bootstrap: Sentry (errors + replay + tracing) + Plausible (analytics) + Web Vitals.
// All providers are no-op when their env vars are missing — safe to call unconditionally.
//
// Required env vars (Vite — must be prefixed VITE_ to reach the browser):
//   VITE_SENTRY_DSN          — Sentry project DSN. Empty = Sentry disabled.
//   VITE_SENTRY_ENVIRONMENT  — "production" | "staging" | "development". Default: import.meta.env.MODE.
//   VITE_RELEASE             — release identifier (commit SHA recommended). Default: "dev".
//   VITE_PLAUSIBLE_DOMAIN    — domain registered in Plausible (e.g. "abawi.sn"). Empty = Plausible disabled.
//   VITE_PLAUSIBLE_HOST      — Plausible API host. Default: "https://plausible.io".

// NOTE: @sentry/react is intentionally NOT imported at the top level.
// A static import runs its module-init code synchronously, which patches React internals
// and causes "Cannot read properties of null (reading 'useContext')" in React 19 + Vite HMR.
// We load it lazily via dynamic import only when VITE_SENTRY_DSN is actually configured.

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
  /Load failed/i,
]

// Lazy reference — populated only after dynamic import resolves
let Sentry = null
let initialized = false

export async function initObservability() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  await initSentry()
  initPlausible()
  reportWebVitals()
}

async function initSentry() {
  if (!SENTRY_DSN) return
  try {
    Sentry = await import('@sentry/react')
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
        if (event.environment === 'development' && !env.VITE_SENTRY_ALLOW_DEV) return null
        return event
      },
    })
  } catch (e) {
    if (env.DEV) console.warn('[observability] Sentry load failed', e)
  }
}

function initPlausible() {
  if (!PLAUSIBLE_DOMAIN) return
  if (document.querySelector('script[data-plausible-injected]')) return

  const script = document.createElement('script')
  script.defer = true
  script.dataset.plausibleInjected = 'true'
  script.dataset.domain = PLAUSIBLE_DOMAIN
  script.src = `${PLAUSIBLE_HOST}/js/script.manual.outbound-links.js`
  document.head.appendChild(script)

  window.plausible = window.plausible || function () {
    ;(window.plausible.q = window.plausible.q || []).push(arguments)
  }
}

function reportWebVitals() {
  const send = (metric) => {
    const value = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)

    if (Sentry) {
      Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond')
    }

    trackEvent('web-vitals', { metric: metric.name, value, rating: metric.rating, id: metric.id })

    if (env.DEV) console.log(`[vitals] ${metric.name}=${value} (${metric.rating})`)
  }

  onCLS(send); onFCP(send); onINP(send); onLCP(send); onTTFB(send)
}

export function trackEvent(name, props) {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  try {
    window.plausible(name, props ? { props } : undefined)
  } catch { /* analytics must never break the UI */ }
}

export function trackPageview(url) {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
  try {
    window.plausible('pageview', { u: window.location.origin + url })
  } catch { /* ignore */ }
}

export function captureError(error, context) {
  if (Sentry) {
    Sentry.captureException(error, context ? { extra: context } : undefined)
    return
  }
  if (env.DEV) console.error('[error]', error, context)
}

export function trackError(error, context) {
  captureError(error, context)
}

export function setUser(user) {
  if (!Sentry) return
  Sentry.setUser(user ? { id: user.id, email: user.email } : null)
}

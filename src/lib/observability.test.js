import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock web-vitals so the module's reportWebVitals() does not register real
// PerformanceObservers in jsdom (where they are partially unimplemented).
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  setMeasurement: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}))

const { trackEvent, trackPageview, captureError, setUser, initObservability } =
  await import('./observability')

afterEach(() => {
  delete window.plausible
})

describe('trackEvent', () => {
  it('is a no-op when window.plausible is undefined', () => {
    expect(() => trackEvent('foo', { bar: 1 })).not.toThrow()
  })

  it('forwards the event name and props to window.plausible', () => {
    const spy = vi.fn()
    window.plausible = spy
    trackEvent('checkout_start', { method: 'wave', amount: 5000 })
    expect(spy).toHaveBeenCalledWith('checkout_start', {
      props: { method: 'wave', amount: 5000 },
    })
  })

  it('omits the props wrapper when no props are provided', () => {
    const spy = vi.fn()
    window.plausible = spy
    trackEvent('auth_logout')
    expect(spy).toHaveBeenCalledWith('auth_logout', undefined)
  })

  it('swallows errors thrown by plausible — analytics must not break the UI', () => {
    window.plausible = () => {
      throw new Error('analytics down')
    }
    expect(() => trackEvent('boom')).not.toThrow()
  })
})

describe('trackPageview', () => {
  it('sends an absolute URL built from window.location.origin', () => {
    const spy = vi.fn()
    window.plausible = spy
    trackPageview('/digital/pack/abawi-plus')
    expect(spy).toHaveBeenCalledWith('pageview', {
      u: window.location.origin + '/digital/pack/abawi-plus',
    })
  })

  it('is a no-op when plausible is not loaded', () => {
    expect(() => trackPageview('/foo')).not.toThrow()
  })
})

describe('captureError / setUser without DSN', () => {
  it('captureError does not throw when Sentry DSN is empty', () => {
    expect(() => captureError(new Error('ignored'))).not.toThrow()
  })

  it('setUser does not throw when Sentry DSN is empty', () => {
    expect(() => setUser({ id: 'u1', email: 'a@b.com' })).not.toThrow()
    expect(() => setUser(null)).not.toThrow()
  })
})

describe('initObservability', () => {
  it('runs once even when called repeatedly', () => {
    expect(() => {
      initObservability()
      initObservability()
      initObservability()
    }).not.toThrow()
  })
})

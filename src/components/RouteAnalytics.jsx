import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../lib/observability'

// Null-render component: emits a Plausible pageview on every route change.
// Lives in a .jsx file so Vite's React Fast Refresh plugin covers it properly.
export default function RouteAnalytics() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    trackPageview(pathname + search)
  }, [pathname, search])
  return null
}

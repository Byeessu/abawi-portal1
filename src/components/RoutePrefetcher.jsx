import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Injecte <link rel="prefetch"> pour les routes fréquentes
 * après le chargement initial de la page.
 */
export default function RoutePrefetcher() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Ne prefetch que sur la home ou les pages d'entrée
    const isEntry = pathname === '/' || pathname === '/outils' || pathname === '/digital'
    if (!isEntry) return

    const routes = [
      '/digital',
      '/outils',
      '/academy',
      '/podcasts',
      '/plans',
      '/store',
    ]

    let timeout
    function inject() {
      routes.forEach(route => {
        if (document.querySelector(`link[rel="prefetch"][href="${route}"]`)) return
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = route
        link.as = 'document'
        document.head.appendChild(link)
      })
    }

    // Délai pour ne pas concurrencer le chargement initial
    timeout = setTimeout(inject, 3000)
    return () => clearTimeout(timeout)
  }, [pathname])

  return null
}

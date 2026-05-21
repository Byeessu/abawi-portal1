import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://abawi.app'

/**
 * SEO dynamique par page. Met à jour <title>, meta description, Open Graph,
 * Twitter Cards et canonical sans dépendance externe (pas de react-helmet).
 * Pas de fallback image par défaut — chaque outil/produit doit fournir sa propre image.
 *
 * Usage :
 *   <SEO
 *     title="Business Plan Ultra-Élite"
 *     description="Business plan exhaustif..."
 *     keywords="business plan, Sénégal, OHADA"
 *     image="/screenshots/bp.jpg"
 *     type="article"
 *   />
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  type = 'website',
  author = 'ABAWI SN',
  noindex = false,
  structuredData = null,
}) {
  const { pathname } = useLocation()
  const url = `${SITE_URL}${pathname}`
  const fullTitle = title ? `${title} — ABAWI` : 'ABAWI — Guides Premium, Outils IA et Académie Business'
  const DEFAULT_OG = `${SITE_URL}/abawi-og-banner.jpg`
  const finalImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image}`)
    : DEFAULT_OG

  useEffect(() => {
    document.title = fullTitle
    setMeta('description', description || '')
    if (keywords) setMeta('keywords', keywords)
    setMeta('author', author)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')

    // Open Graph
    setMetaProp('og:site_name', 'ABAWI')
    setMetaProp('og:title', fullTitle)
    setMetaProp('og:description', description || '')
    setMetaProp('og:url', url)
    setMetaProp('og:type', type)
    setMetaProp('og:locale', 'fr_SN')
    setMetaProp('og:image', finalImage)
    setMetaProp('og:image:alt', title || 'ABAWI — Portail premium africain')
    setMetaProp('og:image:width', '1200')
    setMetaProp('og:image:height', '630')

    // Twitter
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:site', '@abawi_sn')
    setMeta('twitter:creator', '@abawi_sn')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description || '')
    setMeta('twitter:image', finalImage)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    // Structured data (JSON-LD) — retiré au démontage pour ne pas cumuler
    let jsonLdEl = null
    if (structuredData) {
      jsonLdEl = document.createElement('script')
      jsonLdEl.type = 'application/ld+json'
      jsonLdEl.dataset.seo = 'page'
      jsonLdEl.textContent = JSON.stringify(structuredData)
      document.head.appendChild(jsonLdEl)
    }

    return () => {
      if (jsonLdEl && jsonLdEl.parentNode) jsonLdEl.parentNode.removeChild(jsonLdEl)
    }
  }, [fullTitle, description, keywords, author, noindex, url, finalImage, type, structuredData])

  return null
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function removeMeta(name) {
  const el = document.querySelector(`meta[name="${name}"]`)
  if (el && el.parentNode) el.parentNode.removeChild(el)
}

function setMetaProp(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

function removeMetaProp(property) {
  const el = document.querySelector(`meta[property="${property}"]`)
  if (el && el.parentNode) el.parentNode.removeChild(el)
}

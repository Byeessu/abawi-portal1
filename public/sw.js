// ABAWI Portal — Service Worker v9
// Stratégies : Cache-First assets hachés, Stale-While-Revalidate pages, Network-First API
// NOTE: si tu changes la version, mets à jour EXPECTED_VERSION dans sw-loader.js

const CACHE_NAME   = 'abawi-abavie-v9'
const ASSETS_CACHE = 'abawi-assets-v9'   // immutable (noms de fichiers content-hachés)
const IMAGE_CACHE  = 'abawi-images-v9'   // TTL long (30 jours)
const PAGE_CACHE   = 'abawi-pages-v9'    // stale-while-revalidate

const IMAGE_CACHE_MAX = 80   // max images en cache
const PAGE_CACHE_MAX  = 25   // max pages en cache

// Pages à pré-cacher à l'install
const PRECACHE_PAGES = ['/', '/outils', '/news', '/digital', '/academy', '/manifest.json']

// Patterns à ne jamais cacher (APIs, auth, services externes)
const BYPASS = [
  '/.netlify/', '/rest/v1/', '/auth/', '/storage/v1/',
  'supabase.co', 'groq.com', 'anthropic.com', 'plausible.io', 'sentry.io',
  'googleapis.com', 'gstatic.com',
]

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(PAGE_CACHE).then(c =>
      Promise.allSettled(PRECACHE_PAGES.map(u => c.add(u).catch(() => {})))
    )
  )
  self.skipWaiting()
})

// ── Activate — nettoyer les anciens caches ────────────────────────────────────
self.addEventListener('activate', (e) => {
  const current = new Set([CACHE_NAME, ASSETS_CACHE, IMAGE_CACHE, PAGE_CACHE])
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('abawi-') && !current.has(k)).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — stratégie intelligente par type ───────────────────────────────────
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Bypasser les requêtes aux services tiers critiques
  if (BYPASS.some(p => req.url.includes(p))) return

  // Images Supabase (stockage externe) → cache image
  if (url.origin !== self.location.origin) {
    if (/\.(jpg|jpeg|png|webp|avif|gif|svg)(\?.*)?$/i.test(url.pathname)) {
      e.respondWith(imageCacheFirst(req))
    }
    return
  }

  const p = url.pathname

  // ── /assets/* — Cache-First absolu (hachage contenu = immuable) ──────────
  if (p.startsWith('/assets/')) {
    e.respondWith(assetCacheFirst(req))
    return
  }

  // ── Images & polices locales ──────────────────────────────────────────────
  if (/\.(jpg|jpeg|png|webp|avif|gif|svg|ico|woff2|woff|ttf|otf)(\?.*)?$/i.test(p)) {
    e.respondWith(imageCacheFirst(req))
    return
  }

  // ── JS/CSS hors /assets/ — Stale-While-Revalidate ────────────────────────
  if (/\.(js|css|mjs)(\?.*)?$/i.test(p)) {
    e.respondWith(staleWhileRevalidate(req, ASSETS_CACHE))
    return
  }

  // ── Fichiers JSON statiques (/data/*.json) ────────────────────────────────
  if (p.startsWith('/data/') && p.endsWith('.json')) {
    e.respondWith(networkFirst(req, PAGE_CACHE, 3500))
    return
  }

  // ── Navigation HTML — Stale-While-Revalidate ─────────────────────────────
  if (req.mode === 'navigate' || req.headers.get('Accept')?.includes('text/html')) {
    e.respondWith(staleWhileRevalidate(req, PAGE_CACHE, PAGE_CACHE_MAX))
    return
  }
})

// ── Messages (vérification de version depuis sw-loader) ──────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'ABAVIE_GET_VERSION') e.ports[0]?.postMessage({ version: CACHE_NAME })
  if (e.data?.type === 'ABAVIE_SKIP_WAITING') self.skipWaiting()
})

// ═════════════════════════════════════════════════════════════════════════════
// Helpers de stratégie
// ═════════════════════════════════════════════════════════════════════════════

// Cache-First strict — pour les assets immuables (content-hash)
async function assetCacheFirst(req) {
  const cache  = await caches.open(ASSETS_CACHE)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const resp = await fetch(req)
    if (resp.ok) cache.put(req, resp.clone()).catch(() => {})
    return resp
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' })
  }
}

// Cache-First pour images avec éviction LRU
async function imageCacheFirst(req) {
  const cache  = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const resp = await fetch(req)
    if (resp.ok && resp.status === 200 && resp.type !== 'opaque') {
      await limitCache(IMAGE_CACHE, IMAGE_CACHE_MAX)
      cache.put(req, resp.clone()).catch(() => {})
    }
    return resp
  } catch {
    return cached || new Response('', { status: 503 })
  }
}

// Stale-While-Revalidate — sert immédiatement depuis le cache, met à jour en fond
async function staleWhileRevalidate(req, cacheName, maxEntries) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(req)

  const fetchPromise = fetch(req)
    .then(resp => {
      if (resp.ok) {
        if (maxEntries) limitCache(cacheName, maxEntries).catch(() => {})
        cache.put(req, resp.clone()).catch(() => {})
      }
      return resp
    })
    .catch(() => null)

  // Si on a un cache, servir immédiatement + revalider en fond
  if (cached) {
    fetchPromise.catch(() => {})
    return cached
  }
  // Sinon attendre le réseau
  return (await fetchPromise) || new Response('', { status: 503 })
}

// Network-First avec timeout → fallback cache (pour données dynamiques)
async function networkFirst(req, cacheName, timeoutMs = 3500) {
  const cache = await caches.open(cacheName)
  try {
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const resp  = await fetch(req, { signal: ctrl.signal })
    clearTimeout(timer)
    if (resp.ok) cache.put(req, resp.clone()).catch(() => {})
    return resp
  } catch {
    const cached = await cache.match(req)
    return cached || new Response('{"error":"offline"}', {
      status: 503, headers: { 'Content-Type': 'application/json' },
    })
  }
}

// LRU — conserve seulement les N dernières entrées dans un cache
async function limitCache(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys  = await cache.keys()
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)))
  }
}

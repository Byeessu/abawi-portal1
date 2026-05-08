/**
 * ABAWI Portal - Service Worker
 * Stratégie: Network First avec fallback cache
 * Version: 1.0.0
 */

const CACHE_NAME = 'abawi-portal-v1'
const STATIC_CACHE = 'abawi-static-v1'
const DYNAMIC_CACHE = 'abawi-dynamic-v1'
const IMAGE_CACHE = 'abawi-images-v1'

// Assets critiques à pré-cacher
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Routes API à ne jamais cacher
const API_ROUTES = [
  '/api/',
  '/.netlify/functions/',
  '/auth/',
  '/rest/v1/'
]

// Installer - Précache les assets critiques
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Pre-cache failed:', err))
  )
})

// Activate - Nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('abawi-') && 
                name !== STATIC_CACHE && 
                name !== DYNAMIC_CACHE &&
                name !== IMAGE_CACHE
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch - Stratégie de cache intelligente
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return
  
  // Ignorer les requêtes API
  if (API_ROUTES.some(route => url.pathname.includes(route))) {
    return
  }
  
  // Ignorer les requêtes chrome-extension
  if (url.protocol === 'chrome-extension:') return

  // Stratégie pour les images
  if (request.destination === 'image') {
    event.respondWith(imageStrategy(request))
    return
  }
  
  // Stratégie pour les fonts
  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // Stratégie pour les assets statiques (JS, CSS)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }
  
  // Stratégie par défaut: Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

/**
 * Network First - Essaie le réseau, fallback sur cache
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    const cached = await caches.match(request)
    if (cached) return cached
    
    // Si c'est une page HTML, retourner offline.html
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html')
      if (offlinePage) return offlinePage
    }
    
    throw error
  }
}

/**
 * Cache First - Priorité au cache
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    throw error
  }
}

/**
 * Stale While Revalidate - Cache rapide + revalidation background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then(c => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  }).catch(() => cached)
  
  return cached || fetchPromise
}

/**
 * Stratégie spéciale pour les images
 */
async function imageStrategy(request) {
  const cached = await caches.match(request, { cacheName: IMAGE_CACHE })
  if (cached) return cached
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Retourner une image placeholder offline
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect fill="#2d3748" width="200" height="200"/>
        <text fill="#718096" x="50%" y="50%" text-anchor="middle" font-size="14">
          Image indisponible hors ligne
        </text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

// Messages du client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
  
  if (event.data === 'clearCache') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name))
    })
  }
})

// Sync background (pour les requêtes en attente)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Récupérer les requêtes en attente de IndexedDB et les envoyer
  console.log('[SW] Background sync executed')
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data,
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

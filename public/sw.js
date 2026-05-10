const CACHE_NAME = 'abawi-abavie-v7'
// NOTE: si tu changes cette version, mets à jour aussi EXPECTED_VERSION dans index.html
const STATIC_ASSETS = [
  '/', '/digital', '/academy', '/podcasts', '/outils', '/news',
  '/manifest.json', '/abavie',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => {})))
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // NE PAS intercepter les appels aux fonctions Netlify, API externes, ni requêtes non-GET
  if (
    url.pathname.startsWith('/.netlify/') ||
    url.origin !== self.location.origin ||
    e.request.method !== 'GET'
  ) {
    return // laisse le navigateur gérer directement
  }

  // Cache media files (MP3, PDF, images)
  if (url.pathname.includes('/files/') || url.pathname.includes('/storage/') || url.pathname.includes('supabase.co/storage')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(e.request)
        if (cached) return cached
        try {
          const response = await fetch(e.request)
          // Cache.put ne supporte pas les réponses partielles (206) ni opaques.
          // On ne met en cache que les réponses basiques 200 complètes.
          if (response.ok && response.status === 200 && response.type === 'basic') {
            cache.put(e.request, response.clone()).catch(() => {})
          }
          return response
        } catch {
          return cached || new Response('Offline', { status: 503 })
        }
      })
    )
    return
  }

  // Network first for everything else
  e.respondWith(
    fetch(e.request).then(response => {
      // Ne pas mettre en cache les erreurs
      if (!response || response.status >= 400) {
        return caches.match(e.request).then(cached => cached || response)
      }
      return response
    }).catch(async () => {
      const cached = await caches.match(e.request)
      return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
    })
  )
})

/* ================================================================
   PUSH NOTIFICATIONS — Telegram/WhatsApp level
   ================================================================ */

self.addEventListener('push', (e) => {
  if (!e.data) return
  const data = e.data.json()
  const title = data.title || 'Nouveau message Abavie'
  const options = {
    body: data.body || 'Vous avez un nouveau message',
    icon: '/logo-icon.svg',
    badge: '/logo-icon.svg',
    tag: data.tag || `abavie-${Date.now()}`,
    requireInteraction: false,
    renotify: true,
    data: {
      url: data.url || '/abavie',
      conversationId: data.conversationId,
      sender: data.sender,
    },
    actions: data.actions || [
      { action: 'reply', title: 'Répondre', icon: '/logo-icon.svg' },
      { action: 'mark-read', title: 'Lu', icon: '/logo-icon.svg' },
    ],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/abavie'
  const convId = e.notification.data?.conversationId

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab
      for (const client of clients) {
        if (client.url.includes('abavie') && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'ABAVIE_NOTIFICATION_CLICK', conversationId: convId, action: e.action })
          return
        }
      }
      // Open new tab
      if (self.clients.openWindow) {
        self.clients.openWindow(convId ? `/abavie?conv=${convId}` : url)
      }
    })
  )
})

/* ================================================================
   BACKGROUND SYNC — Queue messages when offline
   ================================================================ */

const SYNC_TAG = 'abavie-messages'

self.addEventListener('sync', (e) => {
  if (e.tag === SYNC_TAG) {
    e.waitUntil(syncPendingMessages())
  }
})

async function syncPendingMessages() {
  // Notify client to flush IndexedDB queue
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  clients.forEach(client => {
    client.postMessage({ type: 'ABAVIE_SYNC_MESSAGES' })
  })
}

/* ================================================================
   MESSAGE CHANNEL — Communication with client
   ================================================================ */

self.addEventListener('message', (e) => {
  if (e.data?.type === 'ABAVIE_SKIP_WAITING') {
    self.skipWaiting()
  }
  if (e.data?.type === 'ABAVIE_GET_VERSION') {
    e.ports[0]?.postMessage({ version: CACHE_NAME })
  }
})


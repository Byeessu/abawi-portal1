/* ================================================================
   ABAVIE — Web Push client
   Subscribe / unsubscribe / send via Netlify functions
   ================================================================ */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isPushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

export function isPushConfigured() {
  return !!VAPID_PUBLIC_KEY
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function subscribePush(membreId) {
  if (!isPushSupported()) throw new Error('Push notifications non supportées par ce navigateur')
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID public key non configurée (VITE_VAPID_PUBLIC_KEY)')
  if (!membreId) throw new Error('Membre ID requis')

  // Request permission first
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission refusée')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // Save on backend
  const res = await fetch('/.netlify/functions/push-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ membreId, subscription: sub.toJSON() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Échec enregistrement abonnement')
  }

  localStorage.setItem('abavie_push_endpoint', sub.endpoint)
  return sub
}

export async function unsubscribePush(membreId) {
  const sub = await getPushSubscription()
  if (sub) {
    await fetch('/.netlify/functions/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membreId, subscription: sub.toJSON(), action: 'unsubscribe' }),
    }).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  localStorage.removeItem('abavie_push_endpoint')
}

/**
 * Send a push notification to a recipient (called from sender's client
 * after a message is sent).
 */
export async function sendPushNotification({ membreId, title, body, url, tag, data }) {
  if (!membreId || !title) return null
  try {
    const res = await fetch('/.netlify/functions/push-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membreId, title, body, url, tag, data }),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function isPushEnabled() {
  if (!isPushSupported()) return false
  if (Notification.permission !== 'granted') return false
  const sub = await getPushSubscription()
  return !!sub
}

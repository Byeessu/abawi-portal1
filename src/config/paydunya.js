const WA_NUMBER = '221775185050'

let _cachedConfigured = null
let _cachedAt = 0
const CACHE_TTL = 60000 // 60s

async function fetchConfigured() {
  const now = Date.now()
  if (_cachedConfigured !== null && (now - _cachedAt) < CACHE_TTL) {
    return _cachedConfigured
  }
  try {
    const res = await fetch('/.netlify/functions/paydunya-configured')
    const data = await res.json()
    _cachedConfigured = data.configured || false
    _cachedAt = now
    return _cachedConfigured
  } catch {
    _cachedConfigured = false
    _cachedAt = now
    return false
  }
}

export async function isPaydunyaConfigured() {
  return fetchConfigured()
}

export function waLink(titre, prix) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Bonjour ABAWI 👋\nJe souhaite commander :\n📦 ${titre}\n💰 Prix : ${prix ? prix.toLocaleString('fr-FR') + ' FCFA' : 'À confirmer'}\nMerci !`
  )}`
}

export async function testPaydunyaConnection() {
  const configured = await fetchConfigured()
  if (!configured) {
    return { ok: false, error: 'Clés API non configurées côté serveur' }
  }
  try {
    const res = await fetch('/.netlify/functions/paydunya-configured')
    const data = await res.json()
    return { ok: true, mode: data.mode || 'live', status: 200 }
  } catch (e) {
    return { ok: false, error: e.message || 'Erreur inconnue' }
  }
}

export async function createInvoice({
  title, amount, method, productId, productType,
  billingType, returnUrl, cancelUrl, customerEmail, customerPhone
}) {
  const res = await fetch('/.netlify/functions/paydunya-create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      amount,
      method,
      productId,
      productType,
      billingType,
      returnUrl,
      cancelUrl,
      customerEmail,
      customerPhone,
    }),
  })

  const data = await res.json()

  if (data.error === 'PAYDUNYA_NOT_CONFIGURED') {
    throw new Error('PAYDUNYA_NOT_CONFIGURED')
  }
  if (!res.ok) {
    throw new Error(data.error || `Erreur création facture (HTTP ${res.status})`)
  }

  return { url: data.url, token: data.token }
}

/**
 * AbawiPay Payment Service
 * Routes transactions to the correct provider based on available API keys.
 * Falls back to simulation when no keys are configured.
 */

function getKeys() {
  let stored = {}
  // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
  try { stored = JSON.parse(localStorage.getItem('abawi_api_keys_v2') || '{}') } catch {}
  return {
    paydunya_master: import.meta.env.VITE_PAYDUNYA_MASTER_KEY || stored.paydunya?.key_value || '',
    paydunya_private: import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY || stored.paydunya?.key_alias_value || '',
    wave: import.meta.env.VITE_WAVE_API_KEY || stored.wave?.key_value || '',
    om: import.meta.env.VITE_OM_API_KEY || stored.orange_money_api?.key_value || '',
    fyatu: import.meta.env.VITE_FYATU_API_KEY || stored.fyatu?.key_value || '',
    onafriq: import.meta.env.VITE_ONAFRIQ_API_KEY || stored.onafriq?.key_value || '',
    paymentology: import.meta.env.VITE_PAYMENTOLOGY_API_KEY || stored.paymentology?.key_value || '',
  }
}

/* ── Provider detection ─────────────────────────────────────────────────── */
export function getAvailableProviders() {
  const k = getKeys()
  return {
    paydunya: !!k.paydunya_master,
    wave: !!k.wave,
    orange_money: !!k.om,
    fyatu: !!k.fyatu,
    onafriq: !!k.onafriq,
    paymentology: !!k.paymentology,
    hasAny: !!(k.paydunya_master || k.wave || k.om || k.fyatu),
  }
}

/* ── PayDunya — initiate payment ─────────────────────────────────────────── */
async function payWithPaydunya({ amount, phone, network, description, returnUrl }) {
  const res = await fetch('/.netlify/functions/paydunya-initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, phone, network, description, return_url: returnUrl }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayDunya ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

/* ── Wave — initiate checkout ─────────────────────────────────────────────── */
async function payWithWave({ amount, currency = 'XOF', clientRef, successUrl, errorUrl }) {
  const keys = getKeys()
  if (!keys.wave) throw new Error('Clé Wave non configurée')
  const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${keys.wave}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(amount),
      currency,
      client_reference: clientRef || `ABW-${Date.now()}`,
      success_url: successUrl || window.location.origin + '/abawi-pay?success=1',
      error_url: errorUrl || window.location.origin + '/abawi-pay?error=1',
    }),
  })
  if (!res.ok) throw new Error(`Wave API ${res.status}`)
  return res.json()
}

/* ── Fyatu — cross-border transfer ───────────────────────────────────────── */
async function transferWithFyatu({ amount, fromCurrency, toCurrency, recipientPhone, recipientName }) {
  const keys = getKeys()
  if (!keys.fyatu) throw new Error('Clé Fyatu non configurée')
  const res = await fetch('/.netlify/functions/fyatu-transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, from_currency: fromCurrency, to_currency: toCurrency, recipient_phone: recipientPhone, recipient_name: recipientName, api_key: keys.fyatu }),
  })
  if (!res.ok) throw new Error(`Fyatu ${res.status}`)
  return res.json()
}

/* ── Paymentology — card issuance ────────────────────────────────────────── */
async function issueVirtualCard({ holderName, currency = 'XOF' }) {
  const keys = getKeys()
  if (!keys.paymentology) throw new Error('Clé Paymentology non configurée — carte virtuelle non disponible')
  const res = await fetch('/.netlify/functions/paymentology-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holder_name: holderName, currency, api_key: keys.paymentology }),
  })
  if (!res.ok) throw new Error(`Paymentology ${res.status}`)
  return res.json()
}

/* ── Simulated fallback ──────────────────────────────────────────────────── */
function simulatePayment({ amount, network, phone }) {
  return new Promise(resolve => setTimeout(() => resolve({
    simulated: true,
    status: 'pending',
    reference: `SIM-${Date.now()}`,
    message: `Simulation — ${network} · ${phone} · ${Number(amount).toLocaleString('fr-FR')} XOF`,
  }), 1200))
}

/* ── Main send function ──────────────────────────────────────────────────── */
export async function sendPayment({ amount, phone, network, description, recipientName }) {
  const providers = getAvailableProviders()

  // Wave direct if key available and network is Wave
  if (network === 'Wave' && providers.wave) {
    return payWithWave({ amount, currency: 'XOF', clientRef: `ABW-${Date.now()}` })
  }

  // PayDunya handles most mobile money networks
  if (providers.paydunya) {
    return payWithPaydunya({ amount, phone, network, description })
  }

  // Simulation fallback
  return simulatePayment({ amount, network, phone })
}

/* ── International transfer ─────────────────────────────────────────────── */
export async function sendInternational({ amount, fromCurrency, toCurrency, recipientPhone, recipientName }) {
  const providers = getAvailableProviders()
  if (providers.fyatu) {
    return transferWithFyatu({ amount, fromCurrency, toCurrency, recipientPhone, recipientName })
  }
  if (providers.onafriq) {
    // Onafriq routable via Netlify function
    return fetch('/.netlify/functions/onafriq-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, from_currency: fromCurrency, to_currency: toCurrency, recipient_phone: recipientPhone }),
    }).then(r => { if (!r.ok) throw new Error(`Onafriq ${r.status}`); return r.json() })
  }
  return simulatePayment({ amount, network: 'International', phone: recipientPhone })
}

/* ── Card issuance ──────────────────────────────────────────────────────── */
export async function orderVirtualCard({ holderName }) {
  const providers = getAvailableProviders()
  if (providers.paymentology) return issueVirtualCard({ holderName })
  return { simulated: true, message: 'Carte virtuelle disponible dès que Paymentology est configuré', holder: holderName }
}

/* ── QR code payment receive ─────────────────────────────────────────────── */
export async function createReceiveQR({ amount, userId, expiresIn = 300 }) {
  const providers = getAvailableProviders()
  const token = Math.random().toString(36).slice(2, 8).toUpperCase()
  const payload = `ABW:${userId || 'GUEST'}:${token}:${amount || 'FREE'}:${Date.now() + expiresIn * 1000}`

  if (providers.paydunya && amount) {
    try {
      const result = await payWithPaydunya({ amount, description: `QR Pay ABAWI — ${token}` })
      return { ...result, qr_payload: payload, token }
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
  }
  return { simulated: true, qr_payload: payload, token, expires_at: Date.now() + expiresIn * 1000 }
}

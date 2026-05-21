/**
 * AbawiPay Payment Service
 * Routes transactions to the correct provider based on server-side configuration.
 * Falls back to simulation when no providers are configured.
 * Toutes les cles API sont gérées cote serveur (Netlify Functions).
 */
import { createInvoice, isPaydunyaConfigured } from '../config/paydunya'
import { supabase } from './supabase'

/* ── Cache config serveur (mobile money) ────────────────────────────────── */
let mmConfigCache = null
let mmConfigCacheTime = 0
const MM_CACHE_TTL = 30000

async function fetchMobileMoneyConfig() {
  const now = Date.now()
  if (mmConfigCache && now - mmConfigCacheTime < MM_CACHE_TTL) return mmConfigCache
  try {
    const res = await fetch('/.netlify/functions/mobile-money-configured')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    mmConfigCache = await res.json()
    mmConfigCacheTime = now
    return mmConfigCache
  } catch {
    mmConfigCache = { wave: false, om: false, fyatu: false, onafriq: false, paymentology: false }
    mmConfigCacheTime = now
    return mmConfigCache
  }
}

/* ── Provider detection ─────────────────────────────────────────────────── */
export async function getAvailableProviders() {
  const [paydunya, mm] = await Promise.all([
    isPaydunyaConfigured(),
    fetchMobileMoneyConfig(),
  ])
  return {
    paydunya,
    wave: mm.wave,
    orange_money: mm.om,
    fyatu: mm.fyatu,
    onafriq: mm.onafriq,
    paymentology: mm.paymentology,
    hasAny: !!(paydunya || mm.wave || mm.om || mm.fyatu || mm.onafriq || mm.paymentology),
  }
}

/* ── PayDunya — initiate payment via checkout invoice ──────────────────── */
async function payWithPaydunya({ amount, phone, network, description, returnUrl }) {
  const methodMap = {
    'Wave': 'wave', 'Orange Money': 'orange', 'Free Money': 'free',
    'Abawi Pay': 'wave', 'Virement bancaire': 'card',
  }
  const result = await createInvoice({
    title: description || 'Paiement Abawi Pay',
    amount,
    method: methodMap[network] || 'wave',
    customerPhone: phone,
    returnUrl: returnUrl || window.location.origin + '/abawi-pay?success=1',
  })
  return { checkout_url: result.url, token: result.token, reference: result.token }
}

/* ── Wave — initiate checkout via Netlify Function ──────────────────────── */
async function payWithWave({ amount, currency = 'XOF', clientRef, successUrl, errorUrl }) {
  const res = await fetch('/.netlify/functions/wave-create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: String(amount),
      currency,
      client_reference: clientRef || `ABW-${Date.now()}`,
      success_url: successUrl || window.location.origin + '/abawi-pay?success=1',
      error_url: errorUrl || window.location.origin + '/abawi-pay?error=1',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Wave API ${res.status}`)
  }
  return res.json()
}

/* ── Fyatu — cross-border transfer via Netlify Function ────────────────── */
async function transferWithFyatu({ amount, fromCurrency, toCurrency, recipientPhone, recipientName }) {
  const res = await fetch('/.netlify/functions/fyatu-transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, from_currency: fromCurrency, to_currency: toCurrency, recipient_phone: recipientPhone, recipient_name: recipientName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Fyatu ${res.status}`)
  }
  return res.json()
}

/* ── Paymentology — card issuance via Netlify Function ──────────────────── */
async function issueVirtualCard({ holderName, currency = 'XOF' }) {
  const res = await fetch('/.netlify/functions/paymentology-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holder_name: holderName, currency }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Paymentology ${res.status}`)
  }
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
  const providers = await getAvailableProviders()

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
  const providers = await getAvailableProviders()
  if (providers.fyatu) {
    return transferWithFyatu({ amount, fromCurrency, toCurrency, recipientPhone, recipientName })
  }
  if (providers.onafriq) {
    const res = await fetch('/.netlify/functions/onafriq-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, from_currency: fromCurrency, to_currency: toCurrency, recipient_phone: recipientPhone }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Onafriq ${res.status}`)
    }
    return res.json()
  }
  return simulatePayment({ amount, network: 'International', phone: recipientPhone })
}

/* ── Card issuance ──────────────────────────────────────────────────────── */
export async function orderVirtualCard({ holderName }) {
  const providers = await getAvailableProviders()
  if (providers.paymentology) return issueVirtualCard({ holderName })
  return { simulated: true, message: 'Carte virtuelle disponible dès que Paymentology est configuré', holder: holderName }
}

/* ── QR code payment receive ─────────────────────────────────────────────── */
export async function createReceiveQR({ amount, userId, expiresIn = 300 }) {
  const providers = await getAvailableProviders()
  const token = Math.random().toString(36).slice(2, 8).toUpperCase()
  const payload = `ABW:${userId || 'GUEST'}:${token}:${amount || 'FREE'}:${Date.now() + expiresIn * 1000}`

  if (providers.paydunya && amount) {
    try {
      const result = await payWithPaydunya({ amount, description: `QR Pay ABAWI — ${token}` })
      return { ...result, qr_payload: payload, token }
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch { /* ignore */ }
  }
  return { simulated: true, qr_payload: payload, token, expires_at: Date.now() + expiresIn * 1000 }
}

/* ── Supabase Wallet & Transactions ────────────────────────────────────── */

export async function getOrCreateWallet(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[Wallet] Fetch error:', error.message)
    return null
  }
  if (data) return data
  // Create wallet
  const { data: created, error: insErr } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0, currency: 'XOF', status: 'active' })
    .select()
    .single()
  if (insErr) {
    console.error('[Wallet] Create error:', insErr.message)
    return null
  }
  return created
}

export async function getBalance(userId) {
  const wallet = await getOrCreateWallet(userId)
  return wallet?.balance || 0
}

export async function recordTransaction({
  userId, type, amount, fee = 0, currency = 'XOF',
  status = 'pending', description = '', reference = '',
  recipientPhone = '', recipientName = '', network = '', metadata = {}
}) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      fee,
      currency,
      status,
      description,
      reference: reference || `ABW-${Date.now().toString(36).toUpperCase()}`,
      recipient_phone: recipientPhone,
      recipient_name: recipientName,
      network,
      metadata,
    })
    .select()
    .single()
  if (error) {
    console.error('[Transaction] Insert error:', error.message)
    return null
  }
  return data
}

export async function getTransactions(userId, options = {}) {
  if (!userId) return []
  let q = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (options.type) q = q.eq('type', options.type)
  if (options.limit) q = q.limit(options.limit)
  const { data, error } = await q
  if (error) {
    console.error('[Transactions] Fetch error:', error.message)
    return []
  }
  return data || []
}

export async function updateTransactionStatus(reference, status, extra = {}) {
  const { error } = await supabase
    .from('transactions')
    .update({ status, ...extra })
    .eq('reference', reference)
  if (error) console.error('[Transaction] Update error:', error.message)
  return !error
}

/* ── Savings (Épargne) ─────────────────────────────────────────────────── */

export async function getSavingsGoal(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) { console.error('[Savings] Fetch error:', error.message); return null }
  return data
}

export async function createSavingsGoal({ userId, name, targetAmount, mode, lockPeriod }) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: userId,
      name: name || 'Mon épargne',
      target_amount: targetAmount || 100000,
      current_amount: 0,
      mode: mode || 'round_500',
      lock_period: lockPeriod || 'none',
      status: 'active',
    })
    .select()
    .single()
  if (error) { console.error('[Savings] Create error:', error.message); return null }
  return data
}

export async function updateSavingsGoal(goalId, updates) {
  const { error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', goalId)
  if (error) { console.error('[Savings] Update error:', error.message); return false }
  return true
}

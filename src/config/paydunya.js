const MASTER_KEY = import.meta.env.VITE_PAYDUNYA_MASTER_KEY || ''
const PRIVATE_KEY = import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY || ''
const TOKEN = import.meta.env.VITE_PAYDUNYA_TOKEN || ''
const MODE = import.meta.env.VITE_PAYDUNYA_MODE || 'live'

console.log('[PayDunya] Master Key présente:', !!MASTER_KEY)
console.log('[PayDunya] Master Key longueur:', MASTER_KEY.length)
console.log('[PayDunya] Master Key 4 premiers chars:', MASTER_KEY.substring(0, 4))
console.log('[PayDunya] Master Key est placeholder (*****):', /^\*+$/.test(MASTER_KEY))
console.log('[PayDunya] Mode:', MODE)
const BASE_URL = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

const WA_NUMBER = '221775185050'

export function isPaydunyaConfigured() {
  return !!(
    MASTER_KEY && MASTER_KEY.length > 10 &&
    PRIVATE_KEY && PRIVATE_KEY.length > 10 &&
    TOKEN && TOKEN.length > 10
  )
}

export function waLink(titre, prix) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Bonjour ABAWI 👋\nJe souhaite commander :\n📦 ${titre}\n💰 Prix : ${prix ? prix.toLocaleString('fr-FR') + ' FCFA' : 'À confirmer'}\nMerci !`
  )}`
}

export async function testPaydunyaConnection() {
  if (!isPaydunyaConfigured()) {
    return { ok: false, error: 'Clés API non configurées dans .env.local' }
  }
  try {
    const res = await fetch(`${BASE_URL}/checkout-invoice/confirm/PING_TEST_TOKEN`, {
      method: 'GET',
      headers: {
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
    })
    // Even a 4xx means the server is reachable and keys are accepted
    const data = await res.json()
    if (res.status === 401 || (data?.response_code && data.response_code === '914')) {
      return { ok: false, error: `Clés invalides — code ${data.response_code || res.status}` }
    }
    // 404 = token not found = keys are valid, server is reachable
    return { ok: true, mode: MODE, status: res.status }
  } catch (e) {
    if (e.message?.includes('fetch') || e.name === 'TypeError') {
      return { ok: false, error: 'Serveur PayDunya injoignable. Vérifiez votre connexion.' }
    }
    return { ok: false, error: e.message || 'Erreur inconnue' }
  }
}

export async function createInvoice({
  title, amount, method, productId, productType,
  billingType, returnUrl, cancelUrl, customerEmail, customerPhone
}) {
  if (!isPaydunyaConfigured()) {
    console.warn('[PayDunya] Clés non configurées → fallback WhatsApp')
    throw new Error('PAYDUNYA_NOT_CONFIGURED')
  }

  const methodMap = {
    'abawi-pay':    'wave_senegal',
    'wave':         'wave_senegal',
    'orange':       'orange_money_senegal',
    'orange-money': 'orange_money_senegal',
    'free':         'free_money_senegal',
    'free-money':   'free_money_senegal',
    'card':         'card',
  }

  const payload = {
    invoice: {
      items: {
        item_0: {
          name: (title || '').substring(0, 100),
          quantity: 1,
          unit_price: String(amount),
          total_price: String(amount),
          description: (title || '').substring(0, 200),
        }
      },
      total_amount: amount,
      description: (title || '').substring(0, 200),
    },
    store: {
      name: 'ABAWI',
      tagline: 'Excellence africaine à portée de main',
      postal_address: 'Dakar, Sénégal',
      phone: '+221775185050',
      logo_url: `${window.location.origin}/logo.png`,
    },
    actions: {
      cancel_url: cancelUrl || window.location.href,
      return_url: returnUrl || `${window.location.origin}/merci`,
      callback_url: `${window.location.origin.replace(/localhost:\d+/, 'abawi.netlify.app')}/.netlify/functions/paydunya-ipn`,
    },
    custom_data: {
      product_id: String(productId || ''),
      product_type: productType || 'guide',
      billing_type: billingType || null,
      payment_method: methodMap[method] || method,
    },
  }

  if (customerEmail) payload.customer = { ...(payload.customer || {}), email: customerEmail }
  if (customerPhone) payload.customer = { ...(payload.customer || {}), phone: customerPhone }

  console.log('[PayDunya] Création facture:', { title, amount, method, mode: MODE })

  let res
  try {
    res = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    throw new Error('Connexion PayDunya impossible. Vérifiez votre connexion internet.')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Réponse invalide du serveur PayDunya (HTTP ${res.status})`)
  }

  console.log('[PayDunya] Réponse:', data)

  if (data.response_code === '00') {
    return { url: data.response_text, token: data.token }
  }

  // Exhaustive error codes
  const codeMessages = {
    '901': 'Clé MASTER invalide. Vérifiez VITE_PAYDUNYA_MASTER_KEY.',
    '902': 'Clé PRIVATE invalide. Vérifiez VITE_PAYDUNYA_PRIVATE_KEY.',
    '903': 'Token invalide. Vérifiez VITE_PAYDUNYA_TOKEN.',
    '904': 'Compte PayDunya suspendu. Contactez le support.',
    '905': 'Mode sandbox/live incorrect. Vérifiez VITE_PAYDUNYA_MODE.',
    '906': 'Montant invalide (minimum 1 FCFA).',
    '907': 'Description trop longue (max 200 caractères).',
    '909': 'Store non configuré correctement.',
    '914': 'Clés API non autorisées pour cette opération.',
  }

  const apiText = String(data.response_text || '')
  const invalidMaster = /invalid masterkey specified/i.test(apiText)
  const friendlyMsg = (invalidMaster ? 'Invalid Masterkey Specified: clé MASTER PayDunya invalide.' : null)
    || codeMessages[data.response_code]
    || apiText
    || `Erreur PayDunya code ${data.response_code}`

  throw new Error(friendlyMsg)
}

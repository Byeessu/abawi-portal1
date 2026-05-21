/**
 * PayDunya — Création de facture checkout (SERVER-SIDE)
 * Les clés API PayDunya ne sont JAMAIS exposées au client.
 * Variables d'environnement requises :
 *   PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN, PAYDUNYA_MODE (live|sandbox)
 */

const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || ''
const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || ''
const TOKEN = process.env.PAYDUNYA_TOKEN || ''
const MODE = process.env.PAYDUNYA_MODE || 'live'

const BASE_URL = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

function isConfigured() {
  return MASTER_KEY.length > 10 && PRIVATE_KEY.length > 10 && TOKEN.length > 10
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (!isConfigured()) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'PAYDUNYA_NOT_CONFIGURED', detail: 'Clés PayDunya non configurées côté serveur' }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const {
    title, amount, method, productId, productType,
    billingType, returnUrl, cancelUrl, customerEmail, customerPhone,
  } = body

  const methodMap = {
    'abawi-pay':    'wave_senegal',
    'wave':         'wave_senegal',
    'orange':       'orange_money_senegal',
    'orange-money': 'orange_money_senegal',
    'free':         'free_money_senegal',
    'free-money':   'free_money_senegal',
    'card':         'card',
  }

  const origin = event.headers?.origin || event.headers?.referer || 'https://abawi.app'
  const cleanOrigin = origin.replace(/\/+$/, '')

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
      logo_url: `${cleanOrigin}/logo.svg`,
    },
    actions: {
      cancel_url: cancelUrl || cleanOrigin,
      return_url: returnUrl || `${cleanOrigin}/merci`,
      callback_url: `${cleanOrigin}/.netlify/functions/paydunya-ipn`,
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

  try {
    const res = await fetch(`${BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data.response_code === '00') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: data.response_text, token: data.token }),
      }
    }

    const codeMessages = {
      '901': 'Clé MASTER invalide.',
      '902': 'Clé PRIVATE invalide.',
      '903': 'Token invalide.',
      '904': 'Compte PayDunya suspendu.',
      '905': 'Mode sandbox/live incorrect.',
      '906': 'Montant invalide (minimum 1 FCFA).',
      '907': 'Description trop longue.',
      '909': 'Store non configuré correctement.',
      '914': 'Clés API non autorisées.',
    }

    const apiText = String(data.response_text || '')
    const invalidMaster = /invalid masterkey specified/i.test(apiText)
    const friendlyMsg = (invalidMaster ? 'Clé MASTER PayDunya invalide.' : null)
      || codeMessages[data.response_code]
      || apiText
      || `Erreur PayDunya code ${data.response_code}`

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: friendlyMsg, code: data.response_code }),
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: 'Connexion PayDunya impossible.', detail: e.message }),
    }
  }
}

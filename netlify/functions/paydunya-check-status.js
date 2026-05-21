/**
 * PayDunya — Vérification du statut d'une facture (SERVER-SIDE)
 */

const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || ''
const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || ''
const TOKEN = process.env.PAYDUNYA_TOKEN || ''
const MODE = process.env.PAYDUNYA_MODE || 'live'

const BASE_URL = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const token = event.queryStringParameters?.token
  if (!token) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token manquant' }) }
  }

  try {
    const res = await fetch(`${BASE_URL}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: {
        'PAYDUNYA-MASTER-KEY': MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PRIVATE_KEY,
        'PAYDUNYA-TOKEN': TOKEN,
      },
    })

    const data = await res.json()
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: data.status, data }),
    }
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: 'Impossible de contacter PayDunya', detail: e.message }),
    }
  }
}

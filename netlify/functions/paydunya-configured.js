/**
 * PayDunya — Indique si les clés sont configurées côté serveur (SERVER-SIDE)
 * Le client n'a jamais besoin de voir les clés, seulement de savoir si PayDunya est prêt.
 */

const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || ''
const PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY || ''
const TOKEN = process.env.PAYDUNYA_TOKEN || ''
const MODE = process.env.PAYDUNYA_MODE || 'live'

function isConfigured() {
  return MASTER_KEY.length > 10 && PRIVATE_KEY.length > 10 && TOKEN.length > 10
}

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

  const configured = isConfigured()
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ configured, mode: MODE }),
  }
}

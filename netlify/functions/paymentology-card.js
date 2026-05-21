/**
 * ABAWI — Paymentology Virtual Card (serveur-securise)
 * La cle Paymentology API est lue cote serveur (PAYMENTOLOGY_API_KEY).
 * Le frontend ne voit jamais la cle.
 */
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.PAYMENTOLOGY_API_KEY
  if (!apiKey || apiKey.length < 10) {
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify({ error: 'PAYMENTOLOGY_NOT_CONFIGURED' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { holder_name, currency } = payload

  if (!holder_name) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'holder_name required' }) }
  }

  try {
    // Adapter l'URL reelle de l'API Paymentology si differente
    const res = await fetch('https://api.paymentology.com/v1/cards/virtual', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        holder_name,
        currency: currency || 'XOF',
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[Paymentology] API error:', res.status, data)
      return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Paymentology API error', status: res.status, details: data }) }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
  } catch (err) {
    console.error('[Paymentology] Exception:', err.message)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}

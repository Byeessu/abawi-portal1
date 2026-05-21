/**
 * ABAWI — Onafriq Transfer (serveur-securise)
 * La cle Onafriq API est lue cote serveur (ONAFRIQ_API_KEY).
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

  const apiKey = process.env.ONAFRIQ_API_KEY
  if (!apiKey || apiKey.length < 10) {
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify({ error: 'ONAFRIQ_NOT_CONFIGURED' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { amount, from_currency, to_currency, recipient_phone } = payload

  if (!amount || !from_currency || !to_currency || !recipient_phone) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  try {
    // Adapter l'URL reelle de l'API Onafriq si differente
    const res = await fetch('https://api.onafriq.com/v1/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        from_currency,
        to_currency,
        recipient_phone,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[Onafriq] API error:', res.status, data)
      return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Onafriq API error', status: res.status, details: data }) }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
  } catch (err) {
    console.error('[Onafriq] Exception:', err.message)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}

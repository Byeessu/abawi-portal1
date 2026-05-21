/**
 * ABAWI — Fyatu Transfer (serveur-securise)
 * La cle Fyatu API est lue cote serveur (FYATU_API_KEY).
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

  const apiKey = process.env.FYATU_API_KEY
  if (!apiKey || apiKey.length < 10) {
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify({ error: 'FYATU_NOT_CONFIGURED' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { amount, from_currency, to_currency, recipient_phone, recipient_name } = payload

  if (!amount || !from_currency || !to_currency || !recipient_phone) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  try {
    // Adapter l'URL reelle de l'API Fyatu si differente
    const res = await fetch('https://api.fyatu.com/v1/transfer', {
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
        recipient_name,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[Fyatu] API error:', res.status, data)
      return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Fyatu API error', status: res.status, details: data }) }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
  } catch (err) {
    console.error('[Fyatu] Exception:', err.message)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}

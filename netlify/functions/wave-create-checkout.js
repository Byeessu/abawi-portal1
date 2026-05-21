/**
 * ABAWI — Wave Checkout Session (serveur-securise)
 * La cle Wave API est lue cote serveur (WAVE_API_KEY).
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

  const apiKey = process.env.WAVE_API_KEY
  if (!apiKey || apiKey.length < 10) {
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify({ error: 'WAVE_NOT_CONFIGURED' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { amount, currency, client_reference, success_url, error_url } = payload

  if (!amount || !currency) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'amount and currency required' }) }
  }

  try {
    const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(amount),
        currency,
        client_reference: client_reference || `ABW-${Date.now()}`,
        success_url: success_url || 'https://abawi.app/abawi-pay?success=1',
        error_url: error_url || 'https://abawi.app/abawi-pay?error=1',
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[Wave] API error:', res.status, data)
      return { statusCode: 502, headers: HEADERS, body: JSON.stringify({ error: 'Wave API error', status: res.status, details: data }) }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) }
  } catch (err) {
    console.error('[Wave] Exception:', err.message)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal error', message: err.message }) }
  }
}

/**
 * ABAWI — Mobile Money Configuration Status (serveur-securise)
 * Verifie si les cles des fournisseurs de paiement mobile sont configures cote serveur.
 * Le frontend ne voit jamais les cles.
 */
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS }
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const wave = !!(process.env.WAVE_API_KEY && process.env.WAVE_API_KEY.length > 10)
  const om = !!(process.env.OM_API_KEY && process.env.OM_API_KEY.length > 10)
  const fyatu = !!(process.env.FYATU_API_KEY && process.env.FYATU_API_KEY.length > 10)
  const onafriq = !!(process.env.ONAFRIQ_API_KEY && process.env.ONAFRIQ_API_KEY.length > 10)
  const paymentology = !!(process.env.PAYMENTOLOGY_API_KEY && process.env.PAYMENTOLOGY_API_KEY.length > 10)

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ wave, om, fyatu, onafriq, paymentology }),
  }
}

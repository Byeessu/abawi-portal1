/**
 * job-webhook.js
 * Endpoint appelé par un webhook Supabase (Database Webhook) sur INSERT dans rm_offres.
 * Déclenche immédiatement job-notify-scheduled pour diffuser les nouvelles offres.
 *
 * Configuration Supabase Dashboard :
 *   Database → Webhooks → New Webhook
 *     Table : rm_offres · Events : INSERT
 *     URL : https://VOTRE_SITE.netlify.app/.netlify/functions/job-webhook
 *     Method : POST
 *     Headers : { "x-webhook-secret": "<WEBHOOK_SECRET>" }
 *
 * Variable d'environnement Netlify à ajouter :
 *   WEBHOOK_SECRET = votre_secret_aléatoire
 */

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  // Vérification du secret
  const secret = process.env.WEBHOOK_SECRET
  const incomingSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret']
  if (secret && incomingSecret !== secret) {
    console.warn('[job-webhook] Secret invalide')
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  console.log('[job-webhook] Nouvelle offre reçue:', payload?.record?.titre || payload?.record?.id || '?')

  // Déclencher le notifier immédiatement
  try {
    const notifyHandler = require('./job-notify-scheduled').handler
    const result = await notifyHandler({})
    const stats = JSON.parse(result.body || '{}')
    console.log('[job-webhook] Notification envoyée:', stats)
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, ...stats }),
    }
  } catch (e) {
    console.error('[job-webhook] Erreur notifier:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}

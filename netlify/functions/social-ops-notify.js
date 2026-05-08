exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const title = body.title || 'Alerte Social Ops'
    const level = body.level || 'warning'
    const details = body.details || ''
    const context = body.context || {}
    const message = buildMessage({ title, level, details, context })

    const results = []
    results.push(await notifyTelegram(message))
    results.push(await notifyWhatsApp(message))
    results.push(await notifyEmailWebhook({ title, level, details, context, message }))

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        sentAt: new Date().toISOString(),
        results,
      }),
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) }
  }
}

function buildMessage({ title, level, details, context }) {
  const prefix = level === 'critical' ? 'CRITICAL' : level === 'warning' ? 'WARNING' : 'INFO'
  const processed = context?.summary?.processed ?? context?.processed ?? '?'
  const failed = context?.summary?.failed ?? context?.failed ?? '?'
  const retried = context?.summary?.retried ?? context?.retried ?? '?'
  return [
    `[ABAWI SOCIAL OPS] ${prefix}`,
    title,
    details || '',
    `processed=${processed} failed=${failed} retried=${retried}`,
    `time=${new Date().toISOString()}`,
  ].filter(Boolean).join('\n')
}

async function notifyTelegram(text) {
  const token = process.env.SOCIAL_ALERT_TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.SOCIAL_ALERT_TELEGRAM_CHAT_ID || ''
  if (!token || !chatId) return { channel: 'telegram', status: 'skipped', reason: 'missing env' }
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) return { channel: 'telegram', status: 'failed', reason: `HTTP ${res.status}` }
  return { channel: 'telegram', status: 'sent' }
}

async function notifyWhatsApp(text) {
  const token = process.env.SOCIAL_ALERT_WHATSAPP_TOKEN || ''
  const phoneId = process.env.SOCIAL_ALERT_WHATSAPP_PHONE_ID || ''
  const to = process.env.SOCIAL_ALERT_WHATSAPP_TO || ''
  if (!token || !phoneId || !to) return { channel: 'whatsapp', status: 'skipped', reason: 'missing env' }
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneId)}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    }),
  })
  if (!res.ok) return { channel: 'whatsapp', status: 'failed', reason: `HTTP ${res.status}` }
  return { channel: 'whatsapp', status: 'sent' }
}

async function notifyEmailWebhook(payload) {
  const webhook = process.env.SOCIAL_ALERT_EMAIL_WEBHOOK || ''
  if (!webhook) return { channel: 'email-webhook', status: 'skipped', reason: 'missing env' }
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { channel: 'email-webhook', status: 'failed', reason: `HTTP ${res.status}` }
  return { channel: 'email-webhook', status: 'sent' }
}

/**
 * Send a Web Push notification to a user (all their subscriptions).
 * POST { membreId, title, body, url, icon, badge, tag }
 */
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@abawi.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'VAPID keys not configured' }) }
  }

  try {
    const { membreId, title, body, url, icon, badge, tag, data } = JSON.parse(event.body || '{}')

    if (!membreId || !title) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'membreId and title required' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('membre_id', membreId)

    if (!subs || subs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, sent: 0, reason: 'no subscriptions' }) }
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/abavie',
      icon: icon || '/icons/icon-192.png',
      badge: badge || '/icons/icon-72.png',
      tag: tag || 'abavie-message',
      data: data || {},
    })

    const results = await Promise.allSettled(
      subs.map(s => {
        const sub = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        }
        return webpush.sendNotification(sub, payload).catch(async err => {
          // Clean up dead subscriptions
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          }
          throw err
        })
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, sent, failed, total: subs.length }),
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}

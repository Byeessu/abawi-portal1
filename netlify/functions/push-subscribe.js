/**
 * Save a Web Push subscription for a user.
 * POST { membreId, subscription }
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

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

  try {
    const { membreId, subscription, action = 'subscribe' } = JSON.parse(event.body || '{}')

    if (!membreId || !subscription?.endpoint) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'membreId and subscription.endpoint required' }) }
    }

    if (!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase env not configured' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    if (action === 'unsubscribe') {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, action: 'unsubscribed' }) }
    }

    // Upsert subscription
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        membre_id: membreId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        user_agent: event.headers['user-agent'] || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) }
  }
}

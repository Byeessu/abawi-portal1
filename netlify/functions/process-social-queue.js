exports.config = {
  schedule: '*/10 * * * *', // every 10 minutes
}

exports.handler = async function handler() {
  try {
    if (String(process.env.SOCIAL_QUEUE_PAUSED || '').toLowerCase() === 'true') {
      return ok({ processed: 0, note: 'Queue paused by config (SOCIAL_QUEUE_PAUSED=true)' })
    }

    await maybeAutoRetryFailed()

    const rows = await fetchPendingJobs(30)
    if (!rows.length) {
      return ok({ processed: 0, note: 'No pending jobs' })
    }

    const results = []
    for (const row of rows) {
      await updateQueueRow(row.id, {
        status: 'running',
        started_at: new Date().toISOString(),
        attempts: Number(row.attempts || 0) + 1,
      })

      const target = row.payload || {}
      const text = row.message || ''
      let out
      try {
        if (row.platform === 'telegram') out = await retryDispatch(() => sendTelegram(target, text), row.platform)
        else if (row.platform === 'whatsapp') out = await retryDispatch(() => sendWhatsAppCloud(target, text), row.platform)
        else if (row.platform === 'facebook') out = await retryDispatch(() => sendFacebookPagePost(target, text), row.platform)
        else if (row.platform === 'linkedin') out = await retryDispatch(() => sendLinkedInPost(target, text), row.platform)
        else out = { status: 'connector-ready', details: `${row.platform}: connector ready` }
      } catch (e) {
        out = { status: 'failed', details: e.message }
      }

      const done = out.status === 'posted' || out.status === 'simulated' || out.status === 'connector-ready'
      await updateQueueRow(row.id, {
        status: done ? 'done' : 'failed',
        finished_at: new Date().toISOString(),
        last_error: done ? null : out.details || 'Error',
      })

      results.push({ queueId: row.id, platform: row.platform, ...out })
    }

    const summary = {
      processed: results.length,
      posted: results.filter((r) => r.status === 'posted').length,
      failed: results.filter((r) => r.status === 'failed').length,
      connectorReady: results.filter((r) => r.status === 'connector-ready').length,
    }
    const failedRate = summary.processed > 0 ? (summary.failed / summary.processed) : 0
    if (summary.processed >= 5 && failedRate >= 0.4) {
      const alertPayload = {
        level: 'warning',
        title: 'Taux d’échec social élevé',
        details: `Échec ${Math.round(failedRate * 100)}% sur ${summary.processed} jobs.`,
        summary,
      }
      await pushOpsAlert(alertPayload)
      await triggerOpsNotify(alertPayload)
    }

    return ok({ ...summary, results })
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e.message }),
    }
  }
}

function ok(payload) {
  return { statusCode: 200, body: JSON.stringify({ ok: true, ...payload }) }
}

async function fetchPendingJobs(limit = 20) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return []
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?status=eq.pending&order=scheduled_for.asc&limit=${limit}`
  const res = await fetch(endpoint, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function updateQueueRow(id, patch) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?id=eq.${encodeURIComponent(id)}`
  await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
}

async function maybeAutoRetryFailed() {
  const enabled = String(process.env.SOCIAL_AUTO_RETRY_FAILED || 'true').toLowerCase() === 'true'
  if (!enabled) return
  const now = new Date()
  const hour = now.getUTCHours()
  // Retry window: night UTC to avoid traffic peaks
  if (hour < 1 || hour > 4) return

  const rows = await fetchFailedRowsForRetry(20)
  for (const row of rows) {
    await updateQueueRow(row.id, {
      status: 'pending',
      last_error: null,
      started_at: null,
      finished_at: null,
      scheduled_for: new Date().toISOString(),
    })
  }
}

async function fetchFailedRowsForRetry(limit = 20) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return []
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?status=eq.failed&attempts=lt.3&order=finished_at.desc&limit=${limit}`
  const res = await fetch(endpoint, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function retryDispatch(fn, platform, maxAttempts = 3) {
  let attempt = 0
  let last = { status: 'failed', details: `${platform}: unknown failure` }
  while (attempt < maxAttempts) {
    attempt += 1
    try {
      const out = await fn()
      if (out.status === 'posted' || out.status === 'simulated' || out.status === 'connector-ready') {
        return { ...out, attempts: attempt }
      }
      last = out
    } catch (e) {
      last = { status: 'failed', details: `${platform}: ${e.message}` }
    }
    if (attempt < maxAttempts) await sleep(500 * attempt)
  }
  return { ...last, attempts: attempt }
}

async function sendTelegram(target, text) {
  const token = String(target.token || '').trim()
  const chatId = String(target.accountId || '').trim()
  if (!token || !chatId) return { status: 'failed', details: 'Missing Telegram token or chat_id' }
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
  })
  if (!res.ok) return { status: 'failed', details: `Telegram HTTP ${res.status}` }
  return { status: 'posted', details: 'Posted to Telegram' }
}

async function sendWhatsAppCloud(target, text) {
  const token = String(target.token || '').trim()
  const phoneId = String(target.accountId || '').trim()
  const to = process.env.WHATSAPP_DEFAULT_TO || ''
  if (!token || !phoneId || !to) return { status: 'failed', details: 'Missing WhatsApp token/phone_id/default_to' }
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
  if (!res.ok) return { status: 'failed', details: `WhatsApp HTTP ${res.status}` }
  return { status: 'posted', details: `Sent to WhatsApp ${to}` }
}

async function sendFacebookPagePost(target, text) {
  const token = String(target.token || '').trim()
  const pageId = String(target.accountId || '').trim()
  if (!token || !pageId) return { status: 'failed', details: 'Missing Facebook token/page_id' }
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/feed`
  const params = new URLSearchParams()
  params.set('message', text.slice(0, 5000))
  params.set('access_token', token)
  const res = await fetch(url, { method: 'POST', body: params })
  if (!res.ok) return { status: 'failed', details: `Facebook HTTP ${res.status}` }
  return { status: 'posted', details: `Posted to Facebook page ${pageId}` }
}

async function sendLinkedInPost(target, text) {
  const token = String(target.token || '').trim()
  const authorUrn = String(target.accountId || '').trim()
  if (!token || !authorUrn) return { status: 'failed', details: 'Missing LinkedIn token/author URN' }
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: text.slice(0, 2900) },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })
  if (!res.ok) return { status: 'failed', details: `LinkedIn HTTP ${res.status}` }
  return { status: 'posted', details: 'Posted to LinkedIn' }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pushOpsAlert(payload) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/ai_jobs`
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        tool: 'social-ops',
        job_type: 'alert',
        payload,
      }),
    })
  } catch {}
}

async function triggerOpsNotify(alertPayload) {
  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || ''
    if (!baseUrl) return
    await fetch(`${baseUrl.replace(/\/$/, '')}/.netlify/functions/social-ops-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: alertPayload.title || 'Alerte Social Ops',
        level: alertPayload.level || 'warning',
        details: alertPayload.details || '',
        context: alertPayload,
      }),
    })
  } catch {}
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const mode = body.mode || 'dry-run'
    const campaignName = body.campaignName || 'Campagne'
    const message = body.message || ''
    const targets = Array.isArray(body.targets) ? body.targets : []
    const asyncQueue = mode === 'live' && !!body.asyncQueue

    if (asyncQueue) {
      const queued = await enqueueTargets(body.ownerEmail || '', campaignName, mode, message, targets)
      const processed = await processQueueBatch(queued.map((q) => q.id))
      const payload = {
        ok: true,
        mode: 'live-queued',
        asyncQueue: true,
        campaignName,
        queuedCount: queued.length,
        processedCount: processed.length,
        dispatchedAt: new Date().toISOString(),
        results: processed,
      }
      await logDispatch(body.ownerEmail || '', campaignName, 'live-queued', payload)
      return { statusCode: 200, body: JSON.stringify(payload) }
    }

    const perTarget = []
    for (const t of targets) {
      if (mode !== 'live') {
        perTarget.push({
          platform: t.platform,
          accountId: t.accountId || '',
          status: 'simulated',
          details: `Simulation OK pour ${t.platform}.`,
        })
        continue
      }

      if (t.platform === 'telegram') {
        const out = await retryDispatch(() => sendTelegram(t, message), t.platform)
        perTarget.push({ platform: t.platform, accountId: t.accountId || '', ...out })
        continue
      }

      if (t.platform === 'whatsapp') {
        const out = await retryDispatch(() => sendWhatsAppCloud(t, message), t.platform)
        perTarget.push({ platform: t.platform, accountId: t.accountId || '', ...out })
        continue
      }

      if (t.platform === 'facebook') {
        const out = await retryDispatch(() => sendFacebookPagePost(t, message), t.platform)
        perTarget.push({ platform: t.platform, accountId: t.accountId || '', ...out })
        continue
      }

      if (t.platform === 'linkedin') {
        const out = await retryDispatch(() => sendLinkedInPost(t, message), t.platform)
        perTarget.push({ platform: t.platform, accountId: t.accountId || '', ...out })
        continue
      }

      perTarget.push({
        platform: t.platform,
        accountId: t.accountId || '',
        status: 'connector-ready',
        details: `${t.platform}: connecteur prêt. Branche l’OAuth/API provider pour publication native.`,
      })
    }

    const summary = {
      total: perTarget.length,
      posted: perTarget.filter((r) => r.status === 'posted').length,
      failed: perTarget.filter((r) => r.status === 'failed').length,
      simulated: perTarget.filter((r) => r.status === 'simulated').length,
      connectorReady: perTarget.filter((r) => r.status === 'connector-ready').length,
      retried: perTarget.filter((r) => Number(r.attempts || 1) > 1).length,
    }

    const resultPayload = {
      ok: true,
      mode,
      campaignName,
      messageLength: message.length,
      dispatchedAt: new Date().toISOString(),
      results: perTarget,
      summary,
      note: mode === 'live'
        ? 'Live: Telegram/WhatsApp/Facebook/LinkedIn exécutables selon credentials. Autres plateformes en mode connecteur prêt.'
        : 'Dry run exécuté sans publication externe.',
    }

    await logDispatch(body.ownerEmail || '', campaignName, mode, resultPayload)

    return {
      statusCode: 200,
      body: JSON.stringify(resultPayload),
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e.message }),
    }
  }
}

async function sendTelegram(target, text) {
  const token = String(target.token || '').trim()
  const chatId = String(target.accountId || '').trim()
  if (!token || !chatId) {
    return { status: 'failed', details: 'Token ou chat_id Telegram manquant.' }
  }
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      disable_web_page_preview: false,
    }),
  })
  if (!res.ok) {
    const err = await safeText(res)
    return { status: 'failed', details: `Telegram HTTP ${res.status}: ${truncate(err)}` }
  }
  return { status: 'posted', details: 'Message publié sur Telegram.' }
}

async function sendWhatsAppCloud(target, text) {
  const token = String(target.token || '').trim()
  const phoneId = String(target.accountId || '').trim()
  if (!token || !phoneId) {
    return { status: 'failed', details: 'Token ou phone_number_id WhatsApp manquant.' }
  }
  const to = process.env.WHATSAPP_DEFAULT_TO || ''
  if (!to) {
    return { status: 'failed', details: 'WHATSAPP_DEFAULT_TO non configuré côté serveur.' }
  }
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneId)}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    }),
  })
  if (!res.ok) {
    const err = await safeText(res)
    return { status: 'failed', details: `WhatsApp HTTP ${res.status}: ${truncate(err)}` }
  }
  return { status: 'posted', details: `Message WhatsApp envoyé à ${to}.` }
}

async function safeText(res) {
  try { return await res.text() } catch { return '' }
}

function truncate(s, max = 180) {
  const t = String(s || '')
  return t.length > max ? `${t.slice(0, max)}...` : t
}

async function sendFacebookPagePost(target, text) {
  const token = String(target.token || '').trim()
  const pageId = String(target.accountId || '').trim()
  if (!token || !pageId) {
    return { status: 'failed', details: 'Token ou page_id Facebook manquant.' }
  }
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/feed`
  const params = new URLSearchParams()
  params.set('message', text.slice(0, 5000))
  params.set('access_token', token)
  const res = await fetch(url, { method: 'POST', body: params })
  if (!res.ok) {
    const err = await safeText(res)
    return { status: 'failed', details: `Facebook HTTP ${res.status}: ${truncate(err)}` }
  }
  return { status: 'posted', details: `Post publié sur la page Facebook ${pageId}.` }
}

async function sendLinkedInPost(target, text) {
  const token = String(target.token || '').trim()
  const authorUrn = String(target.accountId || '').trim() // urn:li:person:... or urn:li:organization:...
  if (!token || !authorUrn) {
    return { status: 'failed', details: 'Token ou URN LinkedIn manquant.' }
  }
  const url = 'https://api.linkedin.com/v2/ugcPosts'
  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: text.slice(0, 2900) },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await safeText(res)
    return { status: 'failed', details: `LinkedIn HTTP ${res.status}: ${truncate(err)}` }
  }
  return { status: 'posted', details: 'Post publié sur LinkedIn.' }
}

async function logDispatch(ownerEmail, campaignName, mode, payload) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_logs`
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
        owner_email: ownerEmail || null,
        campaign_name: campaignName || null,
        mode: mode || 'dry-run',
        payload,
      }),
    })
  } catch { /* ignore */ }
}

async function enqueueTargets(ownerEmail, campaignName, mode, message, targets) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) {
    return targets.map((t, i) => ({ id: `mem-${Date.now()}-${i}`, platform: t.platform, account_id: t.accountId || '', payload: t }))
  }
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue`
  const rows = targets.map((t) => ({
    owner_email: ownerEmail || null,
    campaign_name: campaignName || null,
    platform: t.platform || null,
    account_id: t.accountId || null,
    mode: mode || 'live',
    message: message || '',
    payload: t || {},
    status: 'pending',
    attempts: 0,
  }))
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const err = await safeText(res)
    throw new Error(`queue insert failed: ${truncate(err)}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function processQueueBatch(queueIds) {
  const outputs = []
  for (const queueId of queueIds) {
    const row = await getQueueRow(queueId)
    if (!row) continue
    await updateQueueRow(queueId, { status: 'running', started_at: new Date().toISOString(), attempts: Number(row.attempts || 0) + 1 })
    const target = row.payload || {}
    const message = row.message || ''
    let result
    try {
      if (row.platform === 'telegram') result = await retryDispatch(() => sendTelegram(target, message), row.platform)
      else if (row.platform === 'whatsapp') result = await retryDispatch(() => sendWhatsAppCloud(target, message), row.platform)
      else if (row.platform === 'facebook') result = await retryDispatch(() => sendFacebookPagePost(target, message), row.platform)
      else if (row.platform === 'linkedin') result = await retryDispatch(() => sendLinkedInPost(target, message), row.platform)
      else result = { status: 'connector-ready', details: `${row.platform}: connecteur prêt.` }
    } catch (e) {
      result = { status: 'failed', details: e.message }
    }
    const done = result.status === 'posted' || result.status === 'simulated' || result.status === 'connector-ready'
    await updateQueueRow(queueId, {
      status: done ? 'done' : 'failed',
      finished_at: new Date().toISOString(),
      last_error: done ? null : result.details || 'Erreur',
    })
    outputs.push({ queueId, platform: row.platform, accountId: row.account_id || '', ...result })
  }
  return outputs
}

async function getQueueRow(id) {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !serviceRole) return null
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/social_dispatch_queue?id=eq.${encodeURIComponent(id)}&select=*`
  const res = await fetch(endpoint, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) ? data[0] : null
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

async function retryDispatch(fn, platform, maxAttempts = 3) {
  let attempt = 0
  let last = { status: 'failed', details: `${platform}: échec inconnu.` }
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

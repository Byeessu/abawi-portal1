/**
 * auto-publish-marketing.js
 * Scheduled every 10 min — lit les marketing_posts planifiés et les publie
 * automatiquement sur les réseaux sociaux configurés.
 *
 * Flux :
 *   1. Lire marketing_posts (statut=planifié, date+heure <= maintenant)
 *   2. Lire les tokens sociaux de l'utilisateur (site_content)
 *   3. Dispatcher sur la bonne plateforme
 *   4. Mettre à jour statut → publié | échoué
 */

exports.config = {
  schedule: '*/10 * * * *',
}

// ── Supabase helpers ──────────────────────────────────────────────────────

function sbEnv() {
  const url = process.env.SUPABASE_URL
    || process.env.VITE_SUPABASE_URL
    || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || ''
  if (!url || !key) throw new Error('Supabase env missing')
  return { url: url.replace(/\/$/, ''), key }
}

function sbHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function sbGet(path, key, url) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Supabase GET ${path}: ${res.status}`)
  return res.json()
}

async function sbPatch(path, key, url, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: sbHeaders(key),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Supabase PATCH ${path}: ${res.status} ${err.message || ''}`)
  }
}

// ── Fetch posts due for publishing ────────────────────────────────────────

async function fetchDuePosts(url, key) {
  const now = new Date()
  // Pad date and time for comparison
  const today = now.toISOString().slice(0, 10)           // YYYY-MM-DD
  const time  = now.toTimeString().slice(0, 5)           // HH:MM

  // Posts planifiés dont la date est passée OU (aujourd'hui et heure passée)
  // On récupère tout ce qui est planifié avec date <= aujourd'hui
  const rows = await sbGet(
    `marketing_posts?statut=eq.planifié&date_publication=lte.${today}&select=*&order=date_publication.asc,heure.asc&limit=50`,
    key, url
  )

  // Filtrer : date passée OU (aujourd'hui ET heure <= maintenant)
  return rows.filter(p => {
    if (p.date_publication < today) return true
    if (p.date_publication === today) return (p.heure || '00:00') <= time
    return false
  })
}

// ── Fetch social connector config for a user ─────────────────────────────

async function fetchConnectors(ownerEmail, url, key) {
  const rows = await sbGet(
    `site_content?content_type=eq.social_connector&owner_email=eq.${encodeURIComponent(ownerEmail)}&select=content_key,content_value`,
    key, url
  )
  const cfg = {}
  rows.forEach(r => {
    cfg[r.content_key] = r.content_value || {}
  })
  return cfg
}

// ── Platform dispatch functions ───────────────────────────────────────────

async function safeText(res) { try { return await res.text() } catch { return '' } }
function trunc(s, n = 200) { const t = String(s || ''); return t.length > n ? t.slice(0, n) + '…' : t }

async function dispatchFacebook(cfg, text) {
  const token  = String(cfg.token || '').trim()
  const pageId = String(cfg.accountId || '').trim()
  if (!token || !pageId) return { status: 'skipped', details: 'Token ou Page ID Facebook manquant dans les Connecteurs.' }
  const params = new URLSearchParams({ message: text.slice(0, 5000), access_token: token })
  const res = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/feed`, {
    method: 'POST', body: params,
  })
  if (!res.ok) return { status: 'failed', details: `Facebook HTTP ${res.status}: ${trunc(await safeText(res))}` }
  return { status: 'posted', details: `Publié sur la page Facebook ${pageId}.` }
}

async function dispatchInstagram(cfg, text) {
  // Instagram Graph API : nécessite ig_user_id + token Facebook lié
  const token  = String(cfg.token || '').trim()
  const igId   = String(cfg.accountId || '').trim()
  if (!token || !igId) return { status: 'skipped', details: 'IG User ID ou token manquant dans les Connecteurs.' }
  // 1. Create container
  const createRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption: text.slice(0, 2200), media_type: 'TEXT', access_token: token }),
  })
  if (!createRes.ok) return { status: 'failed', details: `IG create container: ${trunc(await safeText(createRes))}` }
  const { id: containerId } = await createRes.json()
  // 2. Publish
  const pubRes = await fetch(`https://graph.facebook.com/v20.0/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  })
  if (!pubRes.ok) return { status: 'failed', details: `IG publish: ${trunc(await safeText(pubRes))}` }
  return { status: 'posted', details: 'Publié sur Instagram Business.' }
}

async function dispatchLinkedIn(cfg, text) {
  const token  = String(cfg.token || '').trim()
  const author = String(cfg.accountId || '').trim()
  if (!token || !author) return { status: 'skipped', details: 'Token ou URN LinkedIn manquant dans les Connecteurs.' }
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author,
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
  if (!res.ok) return { status: 'failed', details: `LinkedIn HTTP ${res.status}: ${trunc(await safeText(res))}` }
  return { status: 'posted', details: 'Publié sur LinkedIn.' }
}

async function dispatchWhatsApp(cfg, text) {
  const token   = String(cfg.token || '').trim()
  const phoneId = String(cfg.accountId || '').trim()
  const to      = process.env.WHATSAPP_DEFAULT_TO || String(cfg.defaultTo || '').trim()
  if (!token || !phoneId) return { status: 'skipped', details: 'Token ou Phone ID WhatsApp manquant dans les Connecteurs.' }
  if (!to) return { status: 'skipped', details: 'WHATSAPP_DEFAULT_TO non configuré (numéro destinataire).' }
  const res = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(phoneId)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text.slice(0, 4096) } }),
  })
  if (!res.ok) return { status: 'failed', details: `WhatsApp HTTP ${res.status}: ${trunc(await safeText(res))}` }
  return { status: 'posted', details: `Message WhatsApp envoyé.` }
}

async function dispatchTelegram(cfg, text) {
  const token  = String(cfg.token || '').trim()
  const chatId = String(cfg.accountId || '').trim()
  if (!token || !chatId) return { status: 'skipped', details: 'Token ou Chat ID Telegram manquant dans les Connecteurs.' }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4096) }),
  })
  if (!res.ok) return { status: 'failed', details: `Telegram HTTP ${res.status}: ${trunc(await safeText(res))}` }
  return { status: 'posted', details: 'Publié sur Telegram.' }
}

async function dispatchTwitter(cfg, text) {
  // Twitter API v2 — nécessite OAuth2 bearer token avec write:tweets scope
  const token = String(cfg.token || '').trim()
  if (!token) return { status: 'skipped', details: 'Bearer token Twitter manquant dans les Connecteurs.' }
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  })
  if (!res.ok) return { status: 'failed', details: `Twitter HTTP ${res.status}: ${trunc(await safeText(res))}` }
  return { status: 'posted', details: 'Tweet publié.' }
}

async function dispatchTikTok(cfg, text) {
  // TikTok Content Posting API (v2)
  const token = String(cfg.token || '').trim()
  if (!token) return { status: 'skipped', details: 'Access token TikTok manquant dans les Connecteurs.' }
  // TikTok ne supporte que la vidéo via API — texte seul = connector-ready
  return { status: 'connector-ready', details: 'TikTok: token présent. Publication vidéo requise (pas de texte seul via API TikTok).' }
}

// ── Platform router ───────────────────────────────────────────────────────

async function dispatch(platform, connectors, text) {
  const cfg = connectors[platform] || connectors[platform === 'twitter' ? 'x' : platform] || {}
  if (!cfg.enabled) return { status: 'skipped', details: `Connecteur ${platform} non activé.` }

  switch (platform) {
    case 'facebook':  return dispatchFacebook(cfg, text)
    case 'instagram': return dispatchInstagram(cfg, text)
    case 'linkedin':  return dispatchLinkedIn(cfg, text)
    case 'whatsapp':  return dispatchWhatsApp(cfg, text)
    case 'telegram':  return dispatchTelegram(cfg, text)
    case 'twitter':
    case 'x':         return dispatchTwitter(cfg, text)
    case 'tiktok':    return dispatchTikTok(cfg, text)
    default: return { status: 'connector-ready', details: `${platform}: connecteur prêt, non encore implémenté.` }
  }
}

// ── Update post status ────────────────────────────────────────────────────

async function updatePostStatus(postId, statut, notes, url, key) {
  await sbPatch(
    `marketing_posts?id=eq.${postId}`,
    key, url,
    { statut, notes: notes ? notes.slice(0, 500) : undefined, updated_at: new Date().toISOString() }
  )
}

// ── Log to Supabase ───────────────────────────────────────────────────────

async function logAutoPublish(ownerEmail, results, url, key) {
  try {
    await fetch(`${url}/rest/v1/ai_jobs`, {
      method: 'POST',
      headers: sbHeaders(key),
      body: JSON.stringify({
        tool: 'auto-publish-marketing',
        job_type: 'scheduled_dispatch',
        payload: { results, processedAt: new Date().toISOString() },
        owner_email: ownerEmail,
      }),
    })
  } catch { /* non-fatal */ }
}

// ── Main ──────────────────────────────────────────────────────────────────

exports.handler = async function handler() {
  if (String(process.env.AUTO_PUBLISH_PAUSED || '').toLowerCase() === 'true') {
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'Auto-publish paused.' }) }
  }

  let sbUrl, sbKey
  try {
    const env = sbEnv()
    sbUrl = env.url
    sbKey = env.key
  } catch (e) {
    console.error('[auto-publish] Supabase env missing:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  const posts = await fetchDuePosts(sbUrl, sbKey).catch(e => {
    console.error('[auto-publish] fetchDuePosts:', e.message)
    return []
  })

  if (!posts.length) {
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'No posts due.' }) }
  }

  // Group posts by owner to load connectors once per user
  const byOwner = {}
  posts.forEach(p => {
    const owner = p.owner_email || ''
    if (!byOwner[owner]) byOwner[owner] = []
    byOwner[owner].push(p)
  })

  const allResults = []

  for (const [ownerEmail, ownerPosts] of Object.entries(byOwner)) {
    let connectors = {}
    try {
      connectors = await fetchConnectors(ownerEmail, sbUrl, sbKey)
    } catch (e) {
      console.error('[auto-publish] fetchConnectors:', e.message)
    }

    for (const post of ownerPosts) {
      const text = [post.titre || '', post.contenu || ''].filter(Boolean).join('\n\n')
      let result

      try {
        result = await dispatch(post.plateforme, connectors, text)
      } catch (e) {
        result = { status: 'failed', details: e.message }
      }

      // Update post status
      const newStatut = result.status === 'posted' ? 'publié'
        : result.status === 'skipped' ? 'planifié'   // keep planifié if connector not set
        : 'échoué'

      if (result.status !== 'skipped') {
        try {
          await updatePostStatus(post.id, newStatut, result.details, sbUrl, sbKey)
        } catch (e) {
          console.error('[auto-publish] updatePostStatus:', e.message)
        }
      }

      allResults.push({
        postId: post.id,
        titre: post.titre,
        platform: post.plateforme,
        owner: ownerEmail,
        ...result,
        newStatut,
      })

      console.log(`[auto-publish] ${result.status.toUpperCase().padEnd(12)} ${post.plateforme.padEnd(10)} "${post.titre?.slice(0, 40)}"`)
    }

    // Log activity
    await logAutoPublish(ownerEmail, allResults, sbUrl, sbKey).catch(() => {})
  }

  const summary = {
    processed: allResults.length,
    posted: allResults.filter(r => r.status === 'posted').length,
    skipped: allResults.filter(r => r.status === 'skipped').length,
    failed: allResults.filter(r => r.status === 'failed').length,
    connectorReady: allResults.filter(r => r.status === 'connector-ready').length,
  }

  console.log('[auto-publish] Summary:', JSON.stringify(summary))
  return { statusCode: 200, body: JSON.stringify({ ...summary, results: allResults }) }
}

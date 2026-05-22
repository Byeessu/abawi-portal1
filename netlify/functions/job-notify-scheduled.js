/**
 * job-notify-scheduled.js
 * Diffuse les nouvelles offres d'emploi (rm_offres + job_offers) à tous les abonnés.
 * Schedule : toutes les 30 minutes.
 *
 * Canal 1 — Push web (service worker) : notification à tous les push_subscriptions
 * Canal 2 — Email (Resend)            : membres abonnés à des alertes emploi (rm_alertes)
 * Canal 3 — Match alertes localStorage : inclus dans la notif push (le SW filtre côté client)
 *
 * Tables Supabase attendues :
 *   push_subscriptions (endpoint, p256dh, auth, membre_id)
 *   rm_offres          (id, titre, entreprise, type_contrat, ville, secteur, created_at, notif_sent)
 *   job_offers         (id, title, company, location, analyzed, active, notif_sent, created_at)
 *   rm_alertes         (id, email, label, secteur, type_contrat, ville, keywords, actif, created_at)
 *   membres            (id, email, prenom, nom)
 *
 * SQL minimal à exécuter une fois dans Supabase Dashboard :
 *   ALTER TABLE rm_offres ADD COLUMN IF NOT EXISTS notif_sent boolean DEFAULT false;
 *   ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS notif_sent boolean DEFAULT false;
 *   CREATE TABLE IF NOT EXISTS rm_alertes (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     email text NOT NULL,
 *     membre_id text,
 *     label text NOT NULL DEFAULT 'Alerte emploi',
 *     secteur text DEFAULT 'Tous',
 *     type_contrat text DEFAULT 'Tous',
 *     ville text DEFAULT 'Toutes',
 *     keywords text DEFAULT '',
 *     actif boolean DEFAULT true,
 *     created_at timestamptz DEFAULT now()
 *   );
 */

exports.config = { schedule: '*/30 * * * *' }

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const RESEND_KEY   = process.env.RESEND_API_KEY
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@abawi.com'
const SITE_URL      = process.env.URL || 'https://abawi.app'

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function sb(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...opts.headers,
    },
    ...opts,
  })
}

// ── Web Push (manual implementation without webpush npm on CommonJS) ──────────

async function importWebPush() {
  try {
    return require('web-push')
  } catch {
    return null
  }
}

async function sendPushToSubscription(webpush, sub, payload) {
  const subscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Expired subscription — delete it
      await sb(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' })
    }
    return false
  }
}

// ── Email via Resend ──────────────────────────────────────────────────────────

async function sendEmailAlert(to, prenom, offres) {
  if (!RESEND_KEY || !to) return false
  const offerList = offres.slice(0, 5).map(o => {
    const titre = o.titre || o.title || 'Offre d\'emploi'
    const entreprise = o.entreprise || o.company || ''
    const ville = o.ville || o.location || ''
    const type = o.type_contrat || o.contract_type || ''
    return `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">
        <strong style="color:#047857;">${titre}</strong><br>
        <span style="font-size:0.85rem;color:#6b7280;">${[entreprise, ville, type].filter(Boolean).join(' · ')}</span>
      </td>
    </tr>`
  }).join('')

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
  <div style="background:#047857;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#fff;font-size:1.1rem;">🔔 Recrute-Moi SN — Nouvelles offres d'emploi</h2>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <p>Bonjour ${prenom || ''},</p>
    <p>De nouvelles offres d'emploi correspondent à vos alertes sur <strong>Recrute-Moi SN</strong> :</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
      ${offerList}
    </table>
    ${offres.length > 5 ? `<p style="font-size:0.85rem;color:#6b7280;">… et ${offres.length - 5} autre(s) offre(s)</p>` : ''}
    <div style="text-align:center;margin:20px 0;">
      <a href="${SITE_URL}/outils/recrute-moi-sn" style="background:#047857;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
        Voir toutes les offres →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p style="font-size:0.78rem;color:#9ca3af;margin:0;">
      Vous recevez cet email car vous avez créé une alerte emploi sur Recrute-Moi SN.<br>
      Pour gérer vos alertes : <a href="${SITE_URL}/outils/recrute-moi-sn" style="color:#047857;">Mon espace alertes</a>
    </p>
  </div>
</div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Recrute-Moi SN <emploi@abawi.com>',
        to,
        subject: `🔔 ${offres.length} nouvelle(s) offre(s) d'emploi — Recrute-Moi SN`,
        html,
      }),
    })
    return res.ok
  } catch { return false }
}

// ── Match offre vs alerte ─────────────────────────────────────────────────────

function offreMatchesAlerte(offre, alerte) {
  const titre = (offre.titre || offre.title || '').toLowerCase()
  const secteur = (offre.secteur || offre.industry || '').toLowerCase()
  const type = (offre.type_contrat || offre.contract_type || '').toLowerCase()
  const ville = (offre.ville || offre.location || '').toLowerCase()
  const desc = (offre.description || offre.summary || '').toLowerCase()

  if (alerte.secteur && alerte.secteur !== 'Tous') {
    if (!secteur.includes(alerte.secteur.toLowerCase()) && !desc.includes(alerte.secteur.toLowerCase())) return false
  }
  if (alerte.type_contrat && alerte.type_contrat !== 'Tous') {
    if (!type.includes(alerte.type_contrat.toLowerCase())) return false
  }
  if (alerte.ville && alerte.ville !== 'Toutes') {
    if (!ville.includes(alerte.ville.toLowerCase())) return false
  }
  if (alerte.keywords) {
    const kws = alerte.keywords.toLowerCase().split(/[,\s]+/).filter(Boolean)
    const full = `${titre} ${secteur} ${desc} ${ville}`
    if (!kws.some(kw => full.includes(kw))) return false
  }
  return true
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function () {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[job-notify] Supabase non configuré — skip')
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no supabase' }) }
  }

  const stats = { push: 0, email: 0, rm_offres_new: 0, job_offers_new: 0 }

  // ── 1. Récupérer les nouvelles offres non notifiées ──────────────────────
  const [rmRes, joRes] = await Promise.all([
    sb('rm_offres?notif_sent=eq.false&order=created_at.desc&limit=30'),
    sb('job_offers?notif_sent=eq.false&analyzed=eq.true&active=eq.true&order=created_at.desc&limit=30'),
  ])

  const rmOffres = rmRes.ok ? (await rmRes.json()) : []
  const jobOffres = joRes.ok ? (await joRes.json()) : []

  const allNew = [...rmOffres, ...jobOffres]
  stats.rm_offres_new = rmOffres.length
  stats.job_offers_new = jobOffres.length

  if (allNew.length === 0) {
    console.log('[job-notify] Aucune nouvelle offre à diffuser')
    return { statusCode: 200, body: JSON.stringify({ ok: true, ...stats }) }
  }

  console.log(`[job-notify] ${allNew.length} offre(s) à diffuser`)

  // ── 2. Push web — diffusion à tous les abonnés ───────────────────────────
  const webpush = await importWebPush()
  if (webpush && VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

    const subsRes = await sb('push_subscriptions?select=endpoint,p256dh,auth,membre_id&limit=500')
    const subs = subsRes.ok ? (await subsRes.json()) : []

    if (subs.length > 0) {
      // Une notification groupée (max 1 push par run pour ne pas spammer)
      const sample = allNew[0]
      const titre = sample.titre || sample.title || 'Nouvelle offre'
      const entreprise = sample.entreprise || sample.company || ''
      const ville = sample.ville || sample.location || ''

      const payload = {
        title: `🔔 ${allNew.length} nouvelle${allNew.length > 1 ? 's' : ''} offre${allNew.length > 1 ? 's' : ''} — Recrute-Moi SN`,
        body: allNew.length === 1
          ? `${titre}${entreprise ? ' chez ' + entreprise : ''}${ville ? ' · ' + ville : ''}`
          : `${titre}${entreprise ? ' chez ' + entreprise : ''} et ${allNew.length - 1} autre(s)`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        url: `${SITE_URL}/outils/recrute-moi-sn`,
        tag: 'job-notify',
      }

      const results = await Promise.allSettled(
        subs.map(s => sendPushToSubscription(webpush, s, payload))
      )
      stats.push = results.filter(r => r.status === 'fulfilled' && r.value).length
      console.log(`[job-notify] Push envoyé à ${stats.push}/${subs.length} abonnés`)
    }
  } else {
    console.log('[job-notify] Push désactivé (VAPID non configuré ou web-push absent)')
  }

  // ── 3. Emails — abonnés aux alertes emploi ────────────────────────────────
  if (RESEND_KEY) {
    const alertRes = await sb('rm_alertes?actif=eq.true&select=email,prenom,label,secteur,type_contrat,ville,keywords&limit=200')
    const alertes = alertRes.ok ? (await alertRes.json()) : []

    // Grouper par email pour éviter les doublons
    const byEmail = {}
    for (const alerte of alertes) {
      if (!alerte.email) continue
      const matching = allNew.filter(o => offreMatchesAlerte(o, alerte))
      if (matching.length === 0) continue
      if (!byEmail[alerte.email]) {
        byEmail[alerte.email] = { prenom: alerte.prenom || '', offres: [] }
      }
      // Ajouter les offres sans doublon
      for (const o of matching) {
        const oid = o.id
        if (!byEmail[alerte.email].offres.some(x => x.id === oid)) {
          byEmail[alerte.email].offres.push(o)
        }
      }
    }

    const emailPromises = Object.entries(byEmail).map(([email, { prenom, offres }]) =>
      sendEmailAlert(email, prenom, offres)
    )
    const emailResults = await Promise.allSettled(emailPromises)
    stats.email = emailResults.filter(r => r.status === 'fulfilled' && r.value).length
    console.log(`[job-notify] Emails envoyés : ${stats.email}/${Object.keys(byEmail).length}`)
  }

  // ── 4. Marquer les offres comme notifiées ─────────────────────────────────
  if (rmOffres.length > 0) {
    const rmIds = rmOffres.map(o => o.id)
    await sb(`rm_offres?id=in.(${rmIds.join(',')})`, {
      method: 'PATCH',
      body: JSON.stringify({ notif_sent: true }),
    })
  }
  if (jobOffres.length > 0) {
    const joIds = jobOffres.map(o => o.id)
    await sb(`job_offers?id=in.(${joIds.join(',')})`, {
      method: 'PATCH',
      body: JSON.stringify({ notif_sent: true }),
    })
  }

  console.log('[job-notify] Done', stats)
  return { statusCode: 200, body: JSON.stringify({ ok: true, ...stats }) }
}

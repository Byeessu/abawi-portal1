/**
 * job-bot-scheduled.js
 * Toutes les 3 heures :
 *   1. Analyse les nouvelles offres brutes (job_offers.analyzed = false) avec Groq
 *   2. Les marque active = true, notif_sent = false (prête pour le notifier)
 *   3. Copie les offres enrichies dans rm_offres si elles n'y sont pas encore
 *   4. Appelle directement job-notify-scheduled pour diffuser sans attendre le prochain cron
 */

exports.config = { schedule: '0 */3 * * *' }

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const GROQ_KEY   = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const SITE_URL   = process.env.URL || 'https://abawi.app'

function sbHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() })
  return r.ok ? r.json() : []
}

async function sbPatch(path, body) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  })
}

async function sbInsert(table, row) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(row),
  })
}

// ── Groq enrichissement ───────────────────────────────────────────────────────

async function groqAnalyze(offer) {
  if (!GROQ_KEY) return null
  const prompt = `Analyse cette offre d'emploi et retourne UNIQUEMENT un JSON strict :
{
  "title": "titre propre et accrocheur (max 80 car.)",
  "summary": "résumé accrocheur 2-3 lignes pour candidats africains",
  "requirements": ["exigence 1", "exigence 2", "exigence 3"],
  "tags": ["CDI/CDD/Stage/Freelance", "secteur", "ville/pays", "niveau"],
  "contract_type": "CDI/CDD/Stage/Freelance/Intérim",
  "location": "ville, pays",
  "secteur": "Tech & Digital|Finance|Commerce|RH|Marketing|Juridique|Santé|BTP|Éducation|Autre",
  "niveau": "Junior|Confirmé|Senior|Direction",
  "salaire_indicatif": "ex: 300 000 - 500 000 FCFA ou Non précisé"
}

Offre brute :
Titre: ${offer.title || ''}
Description: ${(offer.description || '').slice(0, 3000)}
Source: ${offer.source || ''}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() || ''
    try { return JSON.parse(raw) } catch { return null }
  } catch (e) {
    console.error('[job-bot] groqAnalyze error:', e.message)
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

exports.handler = async function () {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[job-bot] Supabase non configuré')
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no supabase' }) }
  }

  // 1. Récupérer les offres non analysées
  const rawOffers = await sbGet('job_offers?analyzed=eq.false&limit=20&order=created_at.asc')
  if (!rawOffers?.length) {
    console.log('[job-bot] Aucune offre à analyser')
    return { statusCode: 200, body: JSON.stringify({ ok: true, processed: 0 }) }
  }

  console.log(`[job-bot] Analyse de ${rawOffers.length} offre(s)…`)

  let processed = 0
  const enrichedOffres = []

  for (const offer of rawOffers) {
    const enriched = await groqAnalyze(offer)
    if (!enriched) continue

    const patch = {
      title: enriched.title || offer.title,
      summary: enriched.summary || '',
      requirements: enriched.requirements || [],
      tags: enriched.tags || [],
      contract_type: enriched.contract_type || offer.contract_type || '',
      location: enriched.location || offer.location || '',
      secteur: enriched.secteur || '',
      niveau: enriched.niveau || '',
      salaire_indicatif: enriched.salaire_indicatif || '',
      analyzed: true,
      active: true,
      notif_sent: false, // prête pour le notifier
    }

    await sbPatch(`job_offers?id=eq.${offer.id}`, patch)

    // Copier dans rm_offres pour la visibilité temps réel (éviter les doublons par source_id)
    const existCheck = await sbGet(`rm_offres?source_id=eq.${offer.id}&limit=1`)
    if (!existCheck?.length) {
      await sbInsert('rm_offres', {
        titre: patch.title,
        description: offer.description || '',
        entreprise: offer.company || offer.entreprise || '',
        type_contrat: patch.contract_type,
        ville: patch.location,
        secteur: patch.secteur,
        niveau: patch.niveau,
        salaire: patch.salaire_indicatif,
        source: offer.source || 'job_bot',
        source_id: offer.id,
        lien_externe: offer.url || offer.apply_url || null,
        contact_email: offer.contact_email || null,
        statut: 'actif',
        notif_sent: false,
        created_at: offer.created_at || new Date().toISOString(),
      })
    }

    enrichedOffres.push({ ...offer, ...patch })
    processed++
  }

  console.log(`[job-bot] ${processed} offre(s) analysée(s) et publiées`)

  // 2. Déclencher la diffusion immédiate (appel interne au notifier)
  if (processed > 0) {
    try {
      const notifyHandler = require('./job-notify-scheduled').handler
      await notifyHandler({})
      console.log('[job-bot] Diffusion déclenchée')
    } catch (e) {
      console.warn('[job-bot] Impossible d\'appeler le notifier en interne:', e.message)
      // Non bloquant — le cron de job-notify-scheduled prendra le relai dans 30 min
    }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, processed }) }
}

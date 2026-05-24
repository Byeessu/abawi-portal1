/**
 * ABAWI — Enrichisseur d'articles de news
 * Netlify scheduled function : toutes les 2 heures.
 * Inactive de 01h00 à 06h30 (heure locale Dakar = UTC).
 *
 * Pour chaque article non enrichi :
 *   1. Nettoie le contenu HTML brut (RSS)
 *   2. Appelle Groq (llama-3.3-70b) → structure JSON bd[]
 *   3. Stocke ti / su / bd / rt / enriched / enriched_at en Supabase
 */

exports.config = { schedule: '0 */2 * * *' }

// ── Supabase helpers ────────────────────────────────────────────────────────

function sbEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           || process.env.SUPABASE_ANON_KEY
           || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return { url, key }
}

function sbHead(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function sbFetch(url, key, path, options = {}) {
  const res = await fetch(`${url}/rest/v1${path}`, {
    headers: sbHead(key),
    signal: AbortSignal.timeout(12000),
    ...options,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Supabase ${res.status}: ${txt.slice(0, 200)}`)
  }
  return res.json()
}

// ── Sleep guard ─────────────────────────────────────────────────────────────

function isSleeping() {
  const d = new Date()
  const h = d.getUTCHours() // Dakar = UTC+0 (pas de décalage)
  const m = d.getUTCMinutes()
  return (h >= 1 && h < 6) || (h === 6 && m < 30)
}

// ── HTML stripping ───────────────────────────────────────────────────────────

function stripHtml(raw) {
  if (!raw) return ''
  let s = String(raw)
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  // Two passes: handles double-encoded HTML like &amp;lt;a href=...&amp;gt;
  for (let pass = 0; pass < 2; pass++) {
    s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
         .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    s = s.replace(/<font\b[^>]*>[\s\S]*?<\/font>/gi, '')
    s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    s = s.replace(/<[^>]+>/g, ' ')
  }
  s = s.replace(/https?:\/\/\S+/g, '')
  s = s.replace(/&[a-zA-Z0-9#]+;/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

function extractBdText(article) {
  // Try to pull existing body text to use as source material
  if (article.bd) {
    try {
      const blocks = typeof article.bd === 'string' ? JSON.parse(article.bd) : article.bd
      if (Array.isArray(blocks) && blocks.length > 0) {
        const text = blocks.map(b => b.v || '').join(' ').replace(/\s+/g, ' ').trim()
        if (text.length > 80) return text.slice(0, 600)
      }
    } catch { /* ignore */ }
  }
  if (article.body && typeof article.body === 'string' && article.body.length > 80) {
    return article.body.slice(0, 600)
  }
  return ''
}

// ── AI helpers ───────────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const key = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
  if (!key) throw new Error('Groq key missing')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.5,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text().catch(() => '')}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function callGemini(prompt) {
  const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!key) throw new Error('Gemini key missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.5 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Enrichissement ────────────────────────────────────────────────────────────

function buildPrompt(article) {
  const rawTitle = stripHtml(article.ti || '')
  const rawSub = stripHtml(article.su || '')
  const rawBody = extractBdText(article)
  const tag = article.tag || 'Economie'

  const hasSub = rawSub.length > 60 && !rawSub.toLowerCase().startsWith(rawTitle.toLowerCase().slice(0, 25))
  const hasBody = rawBody.length > 100

  let contentHint
  if (hasBody) contentHint = `Contenu existant a enrichir: ${rawBody}`
  else if (hasSub) contentHint = `Extrait disponible: ${rawSub.slice(0, 500)}`
  else contentHint = `[Aucun contenu — genere un article complet a partir du titre et du contexte economique africain]`

  return `Tu es le redacteur en chef d ABAWI News, portail business premium specialise Afrique de l Ouest.

Article source:
Titre: ${rawTitle}
Categorie: ${tag}
${contentHint}

MISSION: Redige un article journalistique complet et professionnel en francais de qualite.

REGLES ABSOLUES:
- Genere exactement 5 paragraphes substantiels de 80 a 120 mots chacun
- Paragraphe 1: Accroche et faits cles avec chiffres concrets (montants FCFA/USD, pourcentages, dates)
- Paragraphe 2: Acteurs cles et leurs roles (institutions, entreprises, gouvernements, dirigeants)
- Paragraphe 3: Contexte et implications pour l Afrique de l Ouest (CEDEAO, UEMOA, BCEAO)
- Paragraphe 4: Enjeux economiques et geopolitiques approfondis
- Paragraphe 5: Perspectives et tendances a 12-24 mois
- Cite si pertinent: FMI, Banque Mondiale, BAD, BCEAO
- Titre: punchy et factuel, 60 a 85 caracteres
- JAMAIS de HTML, JAMAIS d URL dans le resultat
- Caracteres autorises: lettres, chiffres, ponctuation basique (. , : ; - ! )
- PAS de: # * { } [ ] | ? \\ / _ \`

Reponds UNIQUEMENT en JSON brut sans markdown ni backticks:
{"ti":"Titre 60-85 chars","su":"Resume 2 phrases 150-200 chars","bd":[{"t":"p","v":"Para 1 accroche 80-120 mots"},{"t":"p","v":"Para 2 acteurs 80-120 mots"},{"t":"p","v":"Para 3 Afrique 80-120 mots"},{"t":"p","v":"Para 4 enjeux 80-120 mots"},{"t":"p","v":"Para 5 perspectives 80-120 mots"}]}`
}

function parseAiResponse(response, article) {
  let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON introuvable dans la reponse IA')
  jsonStr = jsonStr.slice(start, end + 1)

  const parsed = JSON.parse(jsonStr)
  const clean = s => String(s || '').replace(/[#*{}\[\]|?\/\\`]/g, '').replace(/\s+/g, ' ').trim()

  const rawTitle = stripHtml(article.ti || '')
  const rawSub = stripHtml(article.su || '')

  let bd = []
  if (Array.isArray(parsed.bd) && parsed.bd.length > 0) {
    bd = parsed.bd.map(b => ({ t: b.t || 'p', v: clean(b.v) })).filter(b => b.v.length > 30)
  }
  // Fallback si bd vide mais body présent
  if (bd.length === 0 && parsed.body) {
    bd = parsed.body.split(/\n\n+/).map(p => ({ t: 'p', v: clean(p) })).filter(b => b.v.length > 30)
  }
  if (bd.length === 0) {
    bd = [{ t: 'p', v: clean(parsed.su || rawSub || rawTitle) }]
  }

  return {
    ti: clean(parsed.ti) || rawTitle,
    su: clean(parsed.su) || rawSub,
    bd,
  }
}

async function enrichArticle(article) {
  const prompt = buildPrompt(article)

  let response = ''
  try { response = await callGroq(prompt) } catch (e) { console.warn('[enrich-news] Groq fail:', e.message) }
  if (!response) {
    try { response = await callGemini(prompt) } catch (e) { console.warn('[enrich-news] Gemini fail:', e.message) }
  }
  if (!response) throw new Error('Aucune IA disponible')

  return parseAiResponse(response, article)
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function handler() {
  if (isSleeping()) {
    console.log(`[enrich-news] Bot en sommeil (01h00-06h30 UTC). Arret.`)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'sleeping' }) }
  }

  let sbUrl, sbKey
  try {
    const env = sbEnv()
    sbUrl = env.url
    sbKey = env.key
  } catch (e) {
    console.error('[enrich-news] Supabase env missing:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  // Fetch up to 10 unenriched published articles (most recent first)
  let articles
  try {
    articles = await sbFetch(sbUrl, sbKey,
      '/articles?select=*&pr=eq.true&or=(enriched.is.null,enriched.eq.false)&order=created_at.desc&limit=10'
    )
  } catch (e) {
    console.error('[enrich-news] Fetch articles error:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  if (!articles || articles.length === 0) {
    console.log('[enrich-news] Aucun article a enrichir.')
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'nothing to enrich' }) }
  }

  console.log(`[enrich-news] ${articles.length} article(s) a enrichir.`)

  const results = []

  for (const article of articles) {
    try {
      console.log(`[enrich-news] Enrichissement: ${String(article.ti || '').slice(0, 60)}`)
      const enriched = await enrichArticle(article)
      const readMins = Math.max(3, Math.ceil(enriched.bd.length * 1.5)) + ' min'

      const updateRes = await fetch(`${sbUrl}/rest/v1/articles?id=eq.${article.id}`, {
        method: 'PATCH',
        headers: sbHead(sbKey, { Prefer: 'return=minimal' }),
        body: JSON.stringify({
          ti: enriched.ti,
          su: enriched.su,
          bd: JSON.stringify(enriched.bd),
          rt: readMins,
          enriched: true,
          enriched_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!updateRes.ok) {
        const err = await updateRes.text().catch(() => '')
        console.error(`[enrich-news] Update error ${article.id}:`, err.slice(0, 200))
        results.push({ id: article.id, status: 'error', error: err.slice(0, 100) })
      } else {
        console.log(`[enrich-news] OK — ${enriched.bd.length} paragraphes, titre: ${enriched.ti.slice(0, 55)}`)
        results.push({ id: article.id, status: 'ok', paragraphs: enriched.bd.length })
      }

      // Respecter le rate limit Groq
      await new Promise(r => setTimeout(r, 2000))

    } catch (e) {
      console.error(`[enrich-news] Echec article ${article.id}:`, e.message)
      results.push({ id: article.id, status: 'error', error: e.message })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  console.log(`[enrich-news] Terminé: ${ok}/${results.length} enrichis.`)

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: ok, total: results.length, results }),
  }
}

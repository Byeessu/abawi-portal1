/**
 * News Enricher Bot — ABAWI
 * Runs every 2h via cron. Inactive 01:00–06:30.
 * Reads raw articles from Supabase, rewrites with Groq/Gemini,
 * stores structured bd (JSON paragraph blocks) + clean ti/su.
 */

import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY

function isSleeping() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes()
  return (h >= 1 && h < 6) || (h === 6 && m < 30)
}

function stripRawHtml(text) {
  if (!text) return ''
  return text
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<font\b[^>]*>[\s\S]*?<\/font>/gi, '')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ').trim()
}

function extractExistingBody(article) {
  if (article.bd) {
    try {
      const blocks = typeof article.bd === 'string' ? JSON.parse(article.bd) : article.bd
      if (Array.isArray(blocks) && blocks.length > 0) {
        const text = blocks.map(b => b.v || '').join(' ').trim()
        if (text.length > 80) return text.slice(0, 600)
      }
    } catch { /* ignore */ }
  }
  // Also try legacy body field
  if (article.body && typeof article.body === 'string' && article.body.length > 80) {
    return article.body.slice(0, 600)
  }
  return ''
}

function buildPrompt(article) {
  const rawTitle = stripRawHtml(article.ti || '')
  const rawSub = stripRawHtml(article.su || '')
  const rawBody = extractExistingBody(article)
  const tag = article.tag || 'Actualite'

  const hasSub = rawSub.length > 60 && !rawSub.toLowerCase().startsWith(rawTitle.toLowerCase().slice(0, 25))
  const hasBody = rawBody.length > 100

  let contentHint
  if (hasBody) {
    contentHint = `Contenu existant a enrichir: ${rawBody}`
  } else if (hasSub) {
    contentHint = `Extrait disponible: ${rawSub.slice(0, 500)}`
  } else {
    contentHint = `[Aucun contenu — genere un article complet a partir du titre et du contexte economique africain]`
  }

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
- Paragraphe 3: Contexte et implications pour l Afrique de l Ouest (CEDEAO, UEMOA, BCEAO, marches regionaux)
- Paragraphe 4: Enjeux economiques, geopolitiques et sociaux approfondis
- Paragraphe 5: Perspectives et tendances a 12-24 mois, opportunites ou risques a surveiller
- Cite si pertinent: FMI, Banque Mondiale, BAD, BCEAO, Banque Mondiale
- Titre: punchy et factuel, 60 a 85 caracteres, sans caracteres speciaux
- JAMAIS de balises HTML ni URL dans le resultat
- Caracteres autorises: lettres, chiffres et ponctuation simple (. , : ; - ! -)
- PAS de: # * { } [ ] | ? = + @ ^ ~ < > \\ / _ \`

Reponds UNIQUEMENT en JSON brut sans markdown ni backticks:
{"ti":"Titre accrocheur 60-85 chars","su":"Resume en 2 phrases claires 150-200 chars","bd":[{"t":"p","v":"Paragraphe 1 accroche et faits 80-120 mots"},{"t":"p","v":"Paragraphe 2 acteurs cles 80-120 mots"},{"t":"p","v":"Paragraphe 3 Afrique de l Ouest et contexte 80-120 mots"},{"t":"p","v":"Paragraphe 4 enjeux approfondis 80-120 mots"},{"t":"p","v":"Paragraphe 5 perspectives 12-24 mois 80-120 mots"}]}`
}

function parseResponse(response, article) {
  let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON introuvable')
  jsonStr = jsonStr.slice(start, end + 1)

  const parsed = JSON.parse(jsonStr)
  const clean = (s) => String(s || '').replace(/[#*{}\[\]|?\/\\]/g, '').replace(/\s+/g, ' ').trim()

  const rawTitle = stripRawHtml(article.ti || '')
  const rawSub = stripRawHtml(article.su || '')

  let bd = []
  if (Array.isArray(parsed.bd) && parsed.bd.length > 0) {
    bd = parsed.bd
      .map(b => ({ t: b.t || 'p', v: clean(b.v) }))
      .filter(b => b.v.length > 30)
  }
  if (bd.length === 0 && parsed.body) {
    bd = parsed.body.split(/\n\n+/)
      .map(p => ({ t: 'p', v: clean(p) }))
      .filter(b => b.v.length > 30)
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

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.5,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.5 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function enrich(article) {
  const prompt = buildPrompt(article)

  let response = ''
  if (GROQ_KEY) {
    try { response = await callGroq(prompt) } catch (e) { console.warn('Groq fail:', e.message) }
  }
  if (!response && GEMINI_KEY) {
    try { response = await callGemini(prompt) } catch (e) { console.warn('Gemini fail:', e.message) }
  }
  if (!response) throw new Error('Aucune IA disponible')

  return parseResponse(response, article)
}

async function main() {
  if (isSleeping()) {
    console.log(`[${new Date().toISOString()}] Bot en sommeil (01h00-06h30). Arret.`)
    return
  }

  if (!SB_URL || !SB_KEY) {
    console.error('Variables Supabase manquantes')
    process.exit(1)
  }

  const supabase = createClient(SB_URL, SB_KEY)

  // Fetch up to 10 unenriched published articles (most recent first)
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('pr', true)
    .or('enriched.is.null,enriched.eq.false')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Erreur lecture articles:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('Aucun article a enrichir.')
    return
  }

  console.log(`${data.length} article(s) a enrichir.`)

  for (const article of data) {
    try {
      console.log(`Enrichissement : ${article.ti?.slice(0, 60)}...`)
      const enriched = await enrich(article)
      const readMins = Math.max(3, Math.ceil(enriched.bd.length * 1.5)) + ' min'

      const { error: upErr } = await supabase
        .from('articles')
        .update({
          ti: enriched.ti,
          su: enriched.su,
          bd: JSON.stringify(enriched.bd),
          rt: readMins,
          enriched: true,
          enriched_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      if (upErr) {
        console.error('Erreur update:', upErr.message)
      } else {
        console.log(`Enrichi avec succes — ${enriched.bd.length} paragraphes, titre: ${enriched.ti.slice(0, 60)}`)
      }

      // Respect Groq rate limit
      await new Promise(r => setTimeout(r, 2000))
    } catch (e) {
      console.error('Echec enrichissement:', e.message)
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})

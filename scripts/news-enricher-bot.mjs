/**
 * News Enricher Bot — ABAWI
 * Tourne toutes les 2h via cron. Désactivé de 01h00 à 06h30.
 * Lit les articles bruts depuis Supabase, enrichit le titre et le corps
 * avec des sources stratégiques via IA, puis met à jour en base.
 */

import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY

function nowHour() {
  const d = new Date()
  return { h: d.getHours(), m: d.getMinutes() }
}

function isSleeping() {
  const { h } = nowHour()
  // Désactivé de 01h00 à 06h30
  return (h >= 1 && h < 6) || (h === 6 && nowHour().m < 30)
}

async function askGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.6 }
    })
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function askGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Tu es un redacteur expert en economie africaine. Tu enrichis les articles avec des donnees chiffrees, des contextes geopolitiques et des perspectives stratégiques. Reponds uniquement en JSON avec les champs ti, su, body. Pas de markdown, pas de caracteres speciaux.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2048,
      temperature: 0.5
    })
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function enrich(article) {
  const rawTitle = article.ti || ''
  const rawSub = article.su || ''
  const tag = article.tag || 'Actualite'

  const prompt = `Article source :
Titre : ${rawTitle}
Extrait : ${rawSub}
Categorie : ${tag}

Tu es le redacteur en chef d ABAWI News, specialise sur l economie et la tech africaine.
Redige un article professionnel de 4 a 6 paragraphes avec les regles suivantes :
1. Le titre doit etre punchy, sans accents, sans caracteres speciaux comme # * { } [ ] | etc.
2. Le sous-titre (su) doit resumer en 2 phrases l enjeu principal.
3. Le corps (body) doit etre un article complet avec :
   - Un contexte chiffre (sources type FMI, Banque Mondiale, BCEAO)
   - Les acteurs cles mentionnes
   - Les implications economiques ou geopolitiques
   - Une perspective a 12 ou 24 mois
   - Sans caracteres speciaux : pas de # * ? { } [ ] | etc. Utilise des lettres simples, des chiffres et la ponctuation basique (. , : ; -)

Reponds UNIQUEMENT au format JSON brut sans backticks ni markdown :
{"ti":"titre nettoye","su":"sous-titre","body":"corps de l article"}`

  let response = ''
  if (GROQ_KEY) {
    try { response = await askGroq(prompt) } catch (e) { console.warn('Groq fail:', e.message) }
  }
  if (!response && GEMINI_KEY) {
    try { response = await askGemini(prompt) } catch (e) { console.warn('Gemini fail:', e.message) }
  }
  if (!response) throw new Error('Aucune IA disponible')

  // Nettoyer la réponse
  let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON introuvable dans la reponse')
  jsonStr = jsonStr.slice(start, end + 1)

  const parsed = JSON.parse(jsonStr)
  return {
    ti: String(parsed.ti || rawTitle).replace(/[#*{}\[\]|?]/g, '').trim(),
    su: String(parsed.su || rawSub).replace(/[#*{}\[\]|?]/g, '').trim(),
    body: String(parsed.body || rawSub).replace(/[#*{}\[\]|?]/g, '').trim(),
    enriched: true,
  }
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

  // Cherche les 5 derniers articles non enrichis
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('pr', true)
    .or('enriched.is.null,enriched.eq.false')
    .order('created_at', { ascending: false })
    .limit(5)

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
      const { error: upErr } = await supabase
        .from('articles')
        .update({
          ti: enriched.ti,
          su: enriched.su,
          body: enriched.body,
          enriched: true,
          enriched_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      if (upErr) console.error('Erreur update:', upErr.message)
      else console.log('Enrichi avec succes.')
    } catch (e) {
      console.error('Echec enrichissement:', e.message)
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})

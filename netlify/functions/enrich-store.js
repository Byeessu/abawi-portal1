/**
 * ABAWI — Enrichisseur de produits Store IT
 * Netlify scheduled function : toutes les 3 heures (décalé de enrich-news).
 * Inactive de 01h00 à 06h30 UTC (Dakar).
 *
 * Pour chaque produit non enrichi :
 *   1. Construit un prompt avec nom/marque/catégorie/specs/prix
 *   2. Appelle Groq (llama-3.3-70b) → JSON structuré
 *   3. Stocke description_longue / points_forts / cas_usage / meta_title /
 *      meta_description / seo_tags / enriched / enriched_at en Supabase
 */

exports.config = { schedule: '30 1,4,7,10,13,16,19,22 * * *' }

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
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  return (h >= 1 && h < 6) || (h === 6 && m < 30)
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
      temperature: 0.4,
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
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Enrichissement produit ───────────────────────────────────────────────────

function cleanStr(s) {
  return String(s || '').replace(/[#*{}\[\]|?\\`]/g, '').replace(/\s+/g, ' ').trim()
}

function buildProductPrompt(product) {
  const nom = cleanStr(product.nom || product.name)
  const cat = cleanStr(product.categorie || product.cat || 'Informatique')
  const marque = cleanStr(product.marque || '')
  const modele = cleanStr(product.modele || '')
  const garantie = cleanStr(product.garantie || '12 mois')
  const prix = product.prix ? `${Number(product.prix).toLocaleString('fr-FR')} FCFA` : ''
  const desc = cleanStr(product.description || product.description_courte || '')

  // Flatten specs array or object
  let specsText = ''
  const raw = product.specs || product.specs_techniques
  if (Array.isArray(raw) && raw.length > 0) specsText = raw.filter(Boolean).join(', ')
  else if (raw && typeof raw === 'object') specsText = Object.entries(raw).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(', ')
  else if (typeof raw === 'string' && raw.length > 5) specsText = raw

  return `Tu es expert produit pour ABAWI Store, boutique informatique premium à Dakar (Sénégal), spécialisée entreprises et particuliers.

Produit:
Nom: ${nom}
Catégorie: ${cat}
${marque ? `Marque: ${marque}` : ''}
${modele ? `Modèle: ${modele}` : ''}
${prix ? `Prix: ${prix}` : ''}
${garantie ? `Garantie: ${garantie}` : ''}
${specsText ? `Caractéristiques: ${specsText}` : ''}
${desc ? `Description existante: ${desc}` : ''}

MISSION: Génère du contenu commercial et SEO professionnel en français pour ce produit vendu à Dakar, Sénégal.

RÈGLES:
- description_longue: 3 paragraphes de 60-100 mots, ton commercial expert, cible PME et particuliers africains
  - Para 1: présentation et atouts principaux du produit
  - Para 2: performance, fiabilité, cas d'usage business
  - Para 3: service ABAWI (garantie, support, livraison Dakar 24-48h)
- points_forts: exactement 5 points vendeurs courts (8-15 mots chacun), avantages concrets
- cas_usage: exactement 4 scénarios d'usage (ex: "Télétravail haute performance", "Bureaux d'études", etc.)
- meta_title: titre SEO 50-70 chars incluant nom + marque + Dakar/Sénégal
- meta_description: description SEO 120-160 chars avec appel à l'action
- seo_tags: 6 mots-clés pertinents pour le marché sénégalais
- JAMAIS de HTML, JAMAIS de markdown, JAMAIS de caractères spéciaux: # * { } [ ] | ? \\ / _ \`

Réponds UNIQUEMENT en JSON brut sans markdown:
{"description_longue":"Para1. Para2. Para3.","points_forts":["Point 1","Point 2","Point 3","Point 4","Point 5"],"cas_usage":["Usage 1","Usage 2","Usage 3","Usage 4"],"meta_title":"Titre SEO 50-70 chars","meta_description":"Desc SEO 120-160 chars","seo_tags":["tag1","tag2","tag3","tag4","tag5","tag6"]}`
}

function parseProductResponse(response, product) {
  let jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON introuvable')
  jsonStr = jsonStr.slice(start, end + 1)

  const parsed = JSON.parse(jsonStr)
  const nom = cleanStr(product.nom || product.name)
  const cat = cleanStr(product.categorie || '')

  const descLongue = cleanStr(parsed.description_longue)
  if (!descLongue || descLongue.length < 80) throw new Error('description_longue trop courte')

  const pointsForts = Array.isArray(parsed.points_forts)
    ? parsed.points_forts.map(p => cleanStr(p)).filter(p => p.length > 5).slice(0, 6)
    : []

  const casUsage = Array.isArray(parsed.cas_usage)
    ? parsed.cas_usage.map(u => cleanStr(u)).filter(u => u.length > 3).slice(0, 5)
    : []

  const seoTags = Array.isArray(parsed.seo_tags)
    ? parsed.seo_tags.map(t => cleanStr(t)).filter(t => t.length > 1).slice(0, 8)
    : []

  const metaTitle = cleanStr(parsed.meta_title) || `${nom} — ${cat} | ABAWI Store Dakar`
  const metaDesc = cleanStr(parsed.meta_description) || descLongue.slice(0, 155)

  return { description_longue: descLongue, points_forts: pointsForts, cas_usage: casUsage, meta_title: metaTitle, meta_description: metaDesc, seo_tags: seoTags }
}

async function enrichProduct(product) {
  const prompt = buildProductPrompt(product)

  let response = ''
  try { response = await callGroq(prompt) } catch (e) { console.warn('[enrich-store] Groq fail:', e.message) }
  if (!response) {
    try { response = await callGemini(prompt) } catch (e) { console.warn('[enrich-store] Gemini fail:', e.message) }
  }
  if (!response) throw new Error('Aucune IA disponible')

  return parseProductResponse(response, product)
}

// ── Main handler ──────────────────────────────────────────────────────────────

exports.handler = async function handler() {
  if (isSleeping()) {
    console.log('[enrich-store] Bot en sommeil (01h00-06h30 UTC). Arrêt.')
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'sleeping' }) }
  }

  let sbUrl, sbKey
  try {
    const env = sbEnv()
    sbUrl = env.url
    sbKey = env.key
  } catch (e) {
    console.error('[enrich-store] Supabase env missing:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  // Fetch up to 8 products not yet enriched (active only)
  let products
  try {
    products = await sbFetch(sbUrl, sbKey,
      '/store_products?select=*&actif=eq.true&or=(enriched.is.null,enriched.eq.false)&order=created_at.desc&limit=8'
    )
  } catch (e) {
    console.error('[enrich-store] Fetch products error:', e.message)
    return { statusCode: 200, body: JSON.stringify({ processed: 0, error: e.message }) }
  }

  if (!products || products.length === 0) {
    console.log('[enrich-store] Aucun produit à enrichir.')
    return { statusCode: 200, body: JSON.stringify({ processed: 0, note: 'nothing to enrich' }) }
  }

  console.log(`[enrich-store] ${products.length} produit(s) à enrichir.`)

  const results = []

  for (const product of products) {
    const name = String(product.nom || product.name || '').slice(0, 60)
    try {
      console.log(`[enrich-store] Enrichissement: ${name}`)
      const enriched = await enrichProduct(product)

      const updateRes = await fetch(`${sbUrl}/rest/v1/store_products?id=eq.${product.id}`, {
        method: 'PATCH',
        headers: sbHead(sbKey, { Prefer: 'return=minimal' }),
        body: JSON.stringify({
          description_longue: enriched.description_longue,
          points_forts:       enriched.points_forts,
          cas_usage:          enriched.cas_usage,
          meta_title:         enriched.meta_title,
          meta_description:   enriched.meta_description,
          seo_tags:           enriched.seo_tags,
          enriched:           true,
          enriched_at:        new Date().toISOString(),
          updated_at:         new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!updateRes.ok) {
        const err = await updateRes.text().catch(() => '')
        console.error(`[enrich-store] Update error ${product.id}:`, err.slice(0, 200))
        results.push({ id: product.id, name, status: 'error', error: err.slice(0, 100) })
      } else {
        console.log(`[enrich-store] OK — ${name} | ${enriched.points_forts.length} points forts`)
        results.push({ id: product.id, name, status: 'ok' })
      }

      await new Promise(r => setTimeout(r, 2500))

    } catch (e) {
      console.error(`[enrich-store] Échec produit ${product.id}:`, e.message)
      results.push({ id: product.id, name, status: 'error', error: e.message })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  console.log(`[enrich-store] Terminé: ${ok}/${results.length} enrichis.`)

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: ok, total: results.length, results }),
  }
}

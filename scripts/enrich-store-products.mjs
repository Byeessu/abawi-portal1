// Enrich existing store_products rows that are too thin: generate a rich
// description, structured specs, key selling points, target audience, and
// SEO keywords via Groq (or Claude / OpenAI fallback).
//
// Usage:
//   GROQ_API_KEY=xxx node scripts/enrich-store-products.mjs           # all thin rows
//   GROQ_API_KEY=xxx node scripts/enrich-store-products.mjs --all     # rebuild every row
//   GROQ_API_KEY=xxx node scripts/enrich-store-products.mjs --limit=10
//
// Env required: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY),
// and GROQ_API_KEY (preferred) OR ANTHROPIC_API_KEY.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://nqpfmnsecjhqxuvfkqhi.supabase.co'
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  // Fallback: same anon key used by import-store-products.js
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!GROQ_API_KEY && !ANTHROPIC_KEY) {
  console.error('❌ GROQ_API_KEY or ANTHROPIC_API_KEY required.')
  process.exit(1)
}

const FORCE_ALL = process.argv.includes('--all')
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : null

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// Spec extraction from product name (no AI required, deterministic)
// ─────────────────────────────────────────────────────────────────────────────
function extractSpecsFromName(name) {
  const s = (name || '').toString()
  const specs = {}

  // CPU
  const cpu = s.match(/\b(i[3579])[- ]?(\d{3,5}[A-Z]{0,2})\b/i)
  if (cpu) specs.processeur = `Intel Core ${cpu[1].toUpperCase()}-${cpu[2]}`
  const ryzen = s.match(/\bRyzen\s*([3579])\s*(\d{3,4}[A-Z]{0,2})?\b/i)
  if (ryzen) specs.processeur = `AMD Ryzen ${ryzen[1]}${ryzen[2] ? ' ' + ryzen[2] : ''}`
  const apple = s.match(/\bM([1-4])\s*(Pro|Max|Ultra)?\b/i)
  if (apple) specs.processeur = `Apple Silicon M${apple[1]}${apple[2] ? ' ' + apple[2] : ''}`

  // RAM
  const ram = s.match(/(\d{1,3})\s*Go\s*(?:RAM|DDR\d?)?\b/i) || s.match(/(\d{1,3})\s*GB\s*RAM/i)
  if (ram) specs.ram = `${ram[1]} Go`

  // Storage
  const ssd = s.match(/(\d{2,4})\s*Go\s*SSD\b/i) || s.match(/SSD\s*(\d{2,4})\s*Go/i)
  if (ssd) specs.stockage = `SSD ${ssd[1]} Go`
  const tb = s.match(/(\d)\s*To\s*(?:SSD|HDD|NVMe)?/i)
  if (tb) specs.stockage = `${tb[1]} To`
  const hdd = s.match(/(\d{3,4})\s*Go\s*HDD\b/i)
  if (hdd && !specs.stockage) specs.stockage = `HDD ${hdd[1]} Go`

  // Display
  const screen = s.match(/(\d{2}(?:[.,]\d)?)["'']/) || s.match(/(\d{2}(?:[.,]\d)?)\s*pouces/i)
  if (screen) specs.ecran = `${screen[1].replace(',', '.')} pouces`

  // GPU
  const rtx = s.match(/RTX\s*(\d{4})/i) || s.match(/GTX\s*(\d{4})/i)
  if (rtx) specs.carte_graphique = rtx[0].toUpperCase()
  const radeon = s.match(/\b(Radeon[\s\w]+)/i)
  if (radeon && !specs.carte_graphique) specs.carte_graphique = radeon[1].trim()

  // OS
  if (/windows\s*11/i.test(s)) specs.systeme = 'Windows 11'
  else if (/windows\s*10/i.test(s)) specs.systeme = 'Windows 10'
  else if (/macOS|OS X/i.test(s)) specs.systeme = 'macOS'
  else if (/Ubuntu|Linux/i.test(s)) specs.systeme = 'Linux'

  // Print specifics
  const ppm = s.match(/(\d{1,3})\s*ppm/i)
  if (ppm) specs.vitesse_impression = `${ppm[1]} pages/min`
  if (/recto[- ]?verso|duplex/i.test(s)) specs.duplex = 'Oui'
  if (/wifi|wi-fi|sans fil/i.test(s)) specs.connectivite = 'Wi-Fi'

  return specs
}

// ─────────────────────────────────────────────────────────────────────────────
// AI call: Groq preferred, Claude fallback
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  if (GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content:
              'Tu es un rédacteur produit B2B senior. Style: clair, structuré, professionnel. ' +
              'Aucun "#", "*", "##" ou marqueur Markdown apparent. Réponses en JSON strict valide uniquement, sans texte hors JSON.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  // Claude fallback
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

function extractJSON(raw) {
  if (!raw) return null
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI enrichment: rich description + sales angles + target audience + tags
// ─────────────────────────────────────────────────────────────────────────────
async function enrichProduct(product) {
  const extracted = extractSpecsFromName(product.nom)

  const prompt = `Produit : "${product.nom}"
Catégorie : ${product.categorie || 'Matériel informatique'}
Prix : ${product.prix} FCFA
Description actuelle : ${product.description || '(vide)'}
Specs déjà détectées : ${JSON.stringify(extracted)}

Rédige le contenu commercial pour la fiche produit en JSON strict :
{
  "description": "texte riche 3-4 paragraphes séparés par \\n\\n. Aucun #, *, ##. Pas de marqueurs Markdown. Style direct, pro, vendeur honnête. Le 1er paragraphe positionne le produit (qui, pourquoi). Le 2e détaille les caractéristiques techniques en prose. Le 3e décrit l'usage concret (qui en bénéficie, dans quel contexte). Le 4e (optionnel) évoque la garantie/livraison/service.",
  "points_forts": ["5 à 7 phrases courtes, sans markdown, claires, vendeuses, dans l'ordre d'importance"],
  "specs": {"clé": "valeur"},
  "public_cible": "1 phrase qui décrit l'utilisateur idéal",
  "cas_usage": ["3 à 5 cas d'usage concrets, courts"],
  "tags": ["5 à 8 mots-clés SEO en minuscules, sans #"]
}

Règles:
- Conserver les specs déjà détectées dans "specs" et y ajouter ce qui manque.
- En cas de spec inconnue, ne pas l'inventer — l'omettre.
- Ne mentionne jamais ABAWI, le revendeur, le numéro de téléphone, ni l'agrément.
- Pas de superlatifs creux ("incroyable", "exceptionnel"). Faits concrets uniquement.
- Réponds UNIQUEMENT avec le JSON, sans backticks, sans introduction.`

  const raw = await callAI(prompt)
  const data = extractJSON(raw)
  if (!data) {
    throw new Error('AI did not return valid JSON')
  }

  // Merge AI specs with deterministic extraction (deterministic wins on conflicts).
  const mergedSpecs = { ...(data.specs || {}), ...extracted }

  return {
    description: (data.description || '').trim(),
    points_forts: Array.isArray(data.points_forts) ? data.points_forts.slice(0, 8) : [],
    specs: mergedSpecs,
    public_cible: (data.public_cible || '').trim(),
    cas_usage: Array.isArray(data.cas_usage) ? data.cas_usage.slice(0, 6) : [],
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
function isThin(p) {
  if (FORCE_ALL) return true
  const desc = (p.description || '').trim()
  const hasSpecs =
    p.specs &&
    ((Array.isArray(p.specs) && p.specs.length >= 3) ||
      (typeof p.specs === 'object' && Object.keys(p.specs).length >= 3))
  return desc.length < 200 || !hasSpecs
}

async function main() {
  console.log('🔍 Loading products from Supabase...')
  const { data, error } = await supabase
    .from('store_products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  console.log(`   ${data.length} total products.`)

  let candidates = data.filter(isThin)
  if (LIMIT) candidates = candidates.slice(0, LIMIT)
  console.log(`   ${candidates.length} candidates to enrich.\n`)

  let ok = 0
  let fail = 0
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i]
    const tag = `[${i + 1}/${candidates.length}]`
    process.stdout.write(`${tag} ${p.nom?.slice(0, 60)} … `)

    try {
      const enriched = await enrichProduct(p)
      const update = {
        description: enriched.description || p.description,
        specs: enriched.specs,
        // Use generic JSON columns if they exist on the table; otherwise these
        // updates silently no-op on the unknown columns. Supabase rejects only
        // when the WHOLE update has unknown columns.
        points_forts: enriched.points_forts,
        public_cible: enriched.public_cible,
        cas_usage: enriched.cas_usage,
        tags: enriched.tags,
      }
      const { error: upErr } = await supabase
        .from('store_products')
        .update(update)
        .eq('id', p.id)
      if (upErr) {
        // Retry with the safe subset that's guaranteed to exist.
        const safe = { description: update.description, specs: update.specs }
        const { error: e2 } = await supabase
          .from('store_products')
          .update(safe)
          .eq('id', p.id)
        if (e2) throw e2
        console.log('OK (safe subset, missing columns: points_forts/public_cible/cas_usage/tags)')
      } else {
        console.log('OK')
      }
      ok++
    } catch (e) {
      console.log(`FAIL — ${e.message}`)
      fail++
    }

    // Be polite to the AI rate limits
    await new Promise((r) => setTimeout(r, 800))
  }

  console.log(`\n✅ Done. Enriched: ${ok} · Failed: ${fail}`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

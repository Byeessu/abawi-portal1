#!/usr/bin/env node
/**
 * Générateur SEO automatique pour tous les produits du store
 * Utilise l'IA pour générer : description_longue, caracteristiques, points_forts, cas_usage, meta_title, meta_description, seo_tags
 *
 * Usage:
 *   node scripts/generate-store-seo.mjs --table=store_products --limit=10
 *   node scripts/generate-store-seo.mjs --table=abavie_products --all
 *   node scripts/generate-store-seo.mjs --table=guides --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load env from project root (where .env.local lives)
const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
config({ path: resolve(rootDir, '.env.local') })
config({ path: resolve(rootDir, '.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY)

// ── AI Client (multi-provider, keys never logged) ──────────────────
const API_KEYS = [
  process.env.VITE_GROQ_API_KEY,
  process.env.GROQ_API_KEY,
  process.env.VITE_GROK_LLAMA_API_KEY,
  process.env.GROK_LLAMA_API_KEY,
].filter(Boolean)

const API_BASE = process.env.VITE_GROQ_BASE_URL || process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const MODELS = [
  process.env.VITE_GROQ_MODEL,
  process.env.GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
].filter(Boolean)

function maskKey(k) {
  if (!k) return 'none'
  if (k.length <= 8) return '***'
  return k.slice(0, 4) + '...' + k.slice(-4)
}

async function callAI(messages, maxTokens = 2000, temperature = 0.3, modelIdx = 0) {
  if (API_KEYS.length === 0) {
    throw new Error('Aucune clé API trouvée. Définissez VITE_GROQ_API_KEY, GROQ_API_KEY, VITE_GROK_LLAMA_API_KEY ou GROK_LLAMA_API_KEY dans .env.local')
  }
  const key = API_KEYS[0]
  const model = MODELS[modelIdx] || MODELS[0]

  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })

    if (res.status === 401) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`Clé API invalide (masquée: ${maskKey(key)}). Vérifiez votre .env.local — fournisseur: ${API_BASE}`)
    }
    if (res.status === 429) {
      throw new Error('Rate limit atteint. Attendez quelques secondes.')
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (err) {
    // Retry with next model if available
    if (modelIdx < MODELS.length - 1) {
      console.log(`    ⚠️ ${err.message.slice(0, 80)} — retry with fallback model ${MODELS[modelIdx + 1]}`)
      await new Promise(r => setTimeout(r, 1500))
      return callAI(messages, maxTokens, temperature, modelIdx + 1)
    }
    throw err
  }
}

function safeJSON(text, fallback = null) {
  try {
    let s = String(text || '').trim()
    s = s.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').replace(/```/g, '')
    const m = s.match(/(\{[\s\S]*\})/s)
    const candidate = m ? m[0] : s
    return JSON.parse(candidate)
  } catch { return fallback }
}

// ── SEO Generation Prompt ────────────────────────────────
function buildSEOPrompt(product, table) {
  const nom = product.nom || product.titre || product.name || 'Produit'
  const cat = product.categorie || product.matiere || product.serie || product.cat || 'Général'
  const desc = product.description || product.description_courte || ''
  const prix = product.prix || 0
  const specs = product.specs || product.caracteristiques || []

  const isDigital = ['guides', 'fascicules', 'podcasts', 'videos', 'summaries', 'fascicule_audios'].includes(table)
  const isHealth = table === 'abavie_products'
  const typeLabel = isDigital ? 'contenu digital' : isHealth ? 'produit santé / médical' : 'produit tech / informatique'

  return [
    {
      role: 'system',
      content: `Tu es un expert SEO e-commerce francophone spécialisé Afrique de l'Ouest (Sénégal, Côte d'Ivoire, Mali). Tu génères du contenu SEO optimisé pour Google, avec mots-clés naturels en français. Réponds UNIQUEMENT en JSON valide, sans markdown.`
    },
    {
      role: 'user',
      content: `Génère un contenu SEO complet pour ce ${typeLabel}:

NOM: ${nom}
CATÉGORIE: ${cat}
DESCRIPTION ACTUELLE: ${desc.slice(0, 500)}
PRIX: ${prix} FCFA
CARACTÉRISTIQUES EXISTANTES: ${Array.isArray(specs) ? specs.slice(0, 10).join(', ') : JSON.stringify(specs).slice(0, 300)}

Génère UNIQUEMENT ce JSON (pas de texte avant/après):
{
  "meta_title": "titre SEO 50-60 caractères incluant mot-clé principal + marque",
  "meta_description": "meta description 150-160 caractères, persuasive, avec CTA",
  "description_longue": "description détaillée 300-500 mots, 4-6 paragraphes riche en mots-clés naturels. Inclure: problème résolu, bénéfices, contexte Afrique de l'Ouest, pourquoi acheter maintenant",
  "caracteristiques": [
    {"label":"Nom caractéristique","value":"détail précis"},
    {"label":"...","value":"..."}
  ],
  "points_forts": ["point fort 1 (3-8 mots)","point fort 2","point fort 3","point fort 4","point fort 5"],
  "cas_usage": ["cas d'usage 1 : qui + quand + pourquoi","cas 2","cas 3","cas 4"],
  "seo_tags": ["tag1","tag2","tag3","tag4","tag5","tag6"],
  "public_cible": "description du public cible idéal (1-2 phrases)"
}

RÈGLES:
- meta_title: 50-60 car, mot-clé principal en début
- meta_description: 150-160 car, action + bénéfice + urgence
- description_longue: 300-500 mots minimum, paragraphes riches, mots-clés naturels
- caracteristiques: 5-10 paires label/valeur
- points_forts: 5 éléments punchy
- cas_usage: 4 cas concrets (qui + quand + bénéfice)
- seo_tags: 6 mots-clés pertinents
- Ton: professionnel mais accessible, orienté conversion
- Contexte: marché africain, FCFA, livraison Dakar, paiement mobile`}
  ]
}

// ── Process Single Product ───────────────────────────────
async function processProduct(product, table, dryRun = false) {
  const id = product.id
  const nom = product.nom || product.titre || product.name

  console.log(`  📝 ${nom.slice(0, 50)}...`)

  try {
    const prompt = buildSEOPrompt(product, table)
    const raw = await callAI(prompt, 3000, 0.3)
    const seo = safeJSON(raw)

    if (!seo || !seo.meta_title || !seo.description_longue) {
      console.log(`    ⚠️ Réponse IA invalide pour ${nom.slice(0, 40)}`)
      return { ok: false, error: 'Invalid AI response' }
    }

    const update = {
      meta_title: seo.meta_title?.slice(0, 70) || '',
      meta_description: seo.meta_description?.slice(0, 170) || '',
      description_longue: seo.description_longue || '',
      caracteristiques: JSON.stringify(seo.caracteristiques || []),
      points_forts: seo.points_forts || [],
      cas_usage: seo.cas_usage || [],
      seo_tags: seo.seo_tags || [],
      public_cible: seo.public_cible || '',
    }

    if (dryRun) {
      console.log(`    ✅ DRY RUN — would update:`)
      console.log(`       meta_title: ${update.meta_title.slice(0, 60)}...`)
      console.log(`       description_longue: ${update.description_longue.length} chars`)
      return { ok: true, dryRun: true }
    }

    const { error } = await supabase.from(table).update(update).eq('id', id)
    if (error) {
      console.log(`    ❌ DB error: ${error.message}`)
      return { ok: false, error: error.message }
    }

    console.log(`    ✅ SEO généré — score estimé: ${estimateScore(update)}`)
    return { ok: true }

  } catch (err) {
    console.log(`    ❌ Error: ${err.message}`)
    return { ok: false, error: err.message }
  }
}

function estimateScore(u) {
  let s = 0
  if (u.description_longue?.length > 300) s += 25
  else if (u.description_longue?.length > 150) s += 15
  try { if (JSON.parse(u.caracteristiques || '[]').length >= 5) s += 20 } catch {}
  if (u.points_forts?.length >= 5) s += 15
  if (u.cas_usage?.length >= 4) s += 15
  if (u.meta_title?.length > 30) s += 10
  if (u.meta_description?.length > 120) s += 10
  if (u.seo_tags?.length >= 5) s += 5
  return s
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const tableArg = args.find(a => a.startsWith('--table='))?.split('=')[1]
  const limitArg = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10
  const all = args.includes('--all')
  const dryRun = args.includes('--dry-run')

  const TABLES = ['store_products', 'abavie_products', 'guides', 'fascicules', 'podcasts', 'videos', 'content_packs', 'summaries']

  if (tableArg && !TABLES.includes(tableArg)) {
    console.error(`❌ Table inconnue: ${tableArg}. Tables valides: ${TABLES.join(', ')}`)
    process.exit(1)
  }

  const tablesToProcess = tableArg ? [tableArg] : TABLES

  console.log(`🚀 Générateur SEO — Dry run: ${dryRun}`)
  console.log(`   Tables: ${tablesToProcess.join(', ')}`)
  console.log('')

  for (const table of tablesToProcess) {
    console.log(`📦 Table: ${table}`)

    // Fetch products with low or missing SEO
    let query = supabase
      .from(table)
      .select('*')
      .or('meta_title.is.null,meta_title.eq.,seo_score.lt.50')
      .eq('active', true)

    if (!all) query = query.limit(limitArg)

    const { data: products, error } = await query

    if (error) {
      console.log(`  ❌ Fetch error: ${error.message}`)
      continue
    }
    if (!products?.length) {
      console.log(`  ℹ️ Aucun produit à traiter`)
      continue
    }

    console.log(`  📋 ${products.length} produits à traiter`)

    let success = 0
    let failed = 0

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      console.log(`  [${i + 1}/${products.length}]`)
      const result = await processProduct(p, table, dryRun)
      if (result.ok) success++
      else failed++

      // Rate limit friendly delay
      if (i < products.length - 1) await new Promise(r => setTimeout(r, 800))
    }

    console.log(`  ✅ ${success} succès | ❌ ${failed} échecs`)
    console.log('')
  }

  console.log('🏁 Terminé !')
}

main().catch(err => {
  console.error('💥 Fatal:', err)
  process.exit(1)
})

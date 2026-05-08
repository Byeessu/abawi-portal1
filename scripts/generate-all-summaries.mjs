/**
 * Pre-generate audio summaries for all guides.
 * Run: node scripts/generate-all-summaries.mjs
 * Saves to Supabase audio_cache for instant playback.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

const sb = createClient(
  'https://nqpfmnsecjhqxuvfkqhi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGZtbnNlY2pocXh1dmZrcWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI0MDgsImV4cCI6MjA4OTk1ODQwOH0.BCSmlEUmieRHFzT9AfIpSbauOCd2whl-NqQW-W0HIno'
)

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const EL_KEY = process.env.ELEVENLABS_API_KEY || ''
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel
const MODEL_ID = 'eleven_multilingual_v2'

// Load product list
const productsFile = readFileSync('C:/Users/HP/Desktop/abawi-portal/src/data/products.js', 'utf8')
const guideMatches = [...productsFile.matchAll(/"id":\s*"(g\d+)"[\s\S]*?"titre":\s*"([^"]+)"[\s\S]*?"categorie":\s*"([^"]+)"/g)]
const guides = guideMatches.map((m) => ({ id: m[1], titre: m[2], categorie: m[3] }))

// Featured first
const FEATURED_IDS = ['g8', 'g11', 'g13', 'g22', 'g24']
const sorted = [...guides.filter((g) => FEATURED_IDS.includes(g.id)), ...guides.filter((g) => !FEATURED_IDS.includes(g.id))]

const SUMMARY_DIR = 'C:/Users/HP/Desktop/abawi-portal/public/files/summaries'
if (!existsSync(SUMMARY_DIR)) mkdirSync(SUMMARY_DIR, { recursive: true })

async function isAlreadyCached(pid) {
  const { data } = await sb.from('audio_cache').select('id').eq('product_id', pid).eq('chapter_idx', 0).maybeSingle()
  return !!data
}

async function generateSummary(guide) {
  // Step 1: Groq generates summary text
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', max_tokens: 500, temperature: 0.7,
      messages: [{ role: 'user', content: `Génère un résumé audio captivant de ce guide en maximum 300 mots. Présente les 3-4 points essentiels. Donne envie d'acheter sans tout révéler. Termine par "Retrouvez toutes les stratégies détaillées dans le guide complet." Ne te présente jamais. Va droit au contenu. Titre : "${guide.titre}". Catégorie : ${guide.categorie}. Réponds uniquement avec le texte du résumé.` }],
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text || text.length < 50) throw new Error('Groq returned empty')

  // Step 2: ElevenLabs converts to audio
  const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: { stability: 0.40, similarity_boost: 0.82, style: 0.70, use_speaker_boost: true }, speed: 1.15 }),
  })
  if (!elRes.ok) throw new Error('ElevenLabs ' + elRes.status)
  const audioBuffer = Buffer.from(await elRes.arrayBuffer())

  // Step 3: Save as static file
  const slug = guide.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const filePath = `${SUMMARY_DIR}/${slug}.mp3`
  writeFileSync(filePath, audioBuffer)

  // Step 4: Save base64 in Supabase cache
  const b64 = 'data:audio/mpeg;base64,' + audioBuffer.toString('base64')
  await sb.from('audio_cache').insert({ product_id: guide.id, chapter_idx: 0, audio_base64: b64, caracteres: text.length })

  return { chars: text.length, fileSize: (audioBuffer.length / 1024).toFixed(0) + 'Ko' }
}

async function main() {
  console.log(`=== ABAWI Summary Generator ===`)
  console.log(`${sorted.length} guides to process (featured first)\n`)

  let generated = 0, skipped = 0, errors = 0, totalChars = 0
  const MAX = parseInt(process.argv[2]) || 10 // Default: 10 guides

  for (let i = 0; i < Math.min(sorted.length, MAX); i++) {
    const g = sorted[i]
    if (await isAlreadyCached(g.id)) { console.log(`  ⏭ ${g.titre.substring(0, 50)} — déjà en cache`); skipped++; continue }

    try {
      console.log(`  [${i + 1}/${MAX}] ${g.titre.substring(0, 50)}...`)
      const result = await generateSummary(g)
      console.log(`  ✅ ${g.titre.substring(0, 40)} — ${result.chars} car, ${result.fileSize}`)
      generated++; totalChars += result.chars
      await new Promise((r) => setTimeout(r, 2000)) // Rate limit
    } catch (e) {
      console.log(`  ❌ ${g.titre.substring(0, 40)} — ${e.message}`)
      errors++
    }
  }

  console.log(`\n=== Résultats ===`)
  console.log(`  Générés : ${generated}`)
  console.log(`  Déjà cachés : ${skipped}`)
  console.log(`  Erreurs : ${errors}`)
  console.log(`  Caractères ElevenLabs utilisés : ${totalChars}`)
}

main().catch(console.error)

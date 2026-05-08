/**
 * ABAWI File Sync Script
 * Scans ABAWI DIGITAL folder and syncs with public/files/ + products.js
 * Run: npm run sync
 */
import { readdirSync, statSync, copyFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const SRC = 'C:/Users/HP/Desktop/abawi-portal/ABAWI DIGITAL'
const DST_GUIDES = 'C:/Users/HP/Desktop/abawi-portal/public/files/guides'
const DST_FASC_S1 = 'C:/Users/HP/Desktop/abawi-portal/public/files/fascicules/s1'
const DST_FASC_S2 = 'C:/Users/HP/Desktop/abawi-portal/public/files/fascicules/s2'
const DST_FASC_L2 = 'C:/Users/HP/Desktop/abawi-portal/public/files/fascicules/l2'
const DST_PODCASTS = 'C:/Users/HP/Desktop/abawi-portal/public/files/podcasts'
const MAX_AUDIO_SIZE = 20 * 1024 * 1024 // 20Mo

const GROQ_KEY = process.env.GROQ_API_KEY || ''

function scanDir(dir, results = []) {
  if (!existsSync(dir)) return results
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) scanDir(full, results)
    else results.push({ name, path: full, size: stat.size, ext: extname(name).toLowerCase() })
  }
  return results
}

function cleanTitle(filename) {
  return filename
    .replace(/\.(pdf|mp3|m4a|wav)$/i, '')
    .replace(/_FINAL/g, '').replace(/_V\d+/g, '')
    .replace(/_/g, ' ').replace(/  +/g, ' ')
    .replace(/ABAWI /gi, '').replace(/  +/g, ' ')
    .trim()
}

function isDuplicate(name, existingFiles) {
  const norm = name.toLowerCase().replace(/ *\(\d+\)/g, '').replace(/_v\d+/gi, '').replace(/_final/gi, '')
  return existingFiles.some((f) => {
    const fn = f.toLowerCase().replace(/ *\(\d+\)/g, '').replace(/_v\d+/gi, '').replace(/_final/gi, '')
    return fn === norm
  })
}

function guessCategory(path) {
  const lp = path.toLowerCase()
  if (lp.includes('whatsapp') || lp.includes('facebook') || lp.includes('instagram') || lp.includes('tiktok') || lp.includes('marketing') || lp.includes('content_market') || lp.includes('vente_digital') || lp.includes('kit réseaux')) return 'Marketing Digital'
  if (lp.includes('negociation') || lp.includes('communication') || lp.includes('reseautage') || lp.includes('networking') || lp.includes('b2b') || lp.includes('oratoire') || lp.includes('partenaires') || lp.includes('exportation')) return 'Communication'
  if (lp.includes('visa') || lp.includes('bankable') || lp.includes('voyage') || lp.includes('business_plan') || lp.includes('financement')) return 'Visa & Dossier Bankable'
  if (lp.includes('programmation') || lp.includes('informatique') || lp.includes('ordinateur') || lp.includes('elementor') || lp.includes('ia_entrepreneur')) return 'Tech & IA'
  if (lp.includes('comptabilit')) return 'Comptabilite'
  if (lp.includes('restaurant')) return 'Restauration'
  if (lp.includes('emploi') || lp.includes('examen') || lp.includes('recrutement')) return 'Emploi'
  return 'Business & Strategie'
}

function guessPrix(cat) {
  const map = { 'Marketing Digital': 3490, 'Communication': 3990, 'Tech & IA': 4990, 'Visa & Dossier Bankable': 3490, 'Comptabilite': 3490, 'Restauration': 3990, 'Emploi': 3490 }
  return map[cat] || 3990
}

async function generateDescription(titre) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 100, temperature: 0.7,
        messages: [{ role: 'user', content: `Description marketing en 1 phrase (80 car max) pour ce guide PDF africain : "${titre}". Reponds juste la phrase.` }],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch { return '' }
}

async function main() {
  console.log('=== ABAWI File Sync ===\n')

  // Get existing files in public/files
  const existingGuides = existsSync(DST_GUIDES) ? readdirSync(DST_GUIDES) : []
  const existingS1 = existsSync(DST_FASC_S1) ? readdirSync(DST_FASC_S1) : []
  const existingS2 = existsSync(DST_FASC_S2) ? readdirSync(DST_FASC_S2) : []
  const existingL2 = existsSync(DST_FASC_L2) ? readdirSync(DST_FASC_L2) : []
  const existingPodcasts = existsSync(DST_PODCASTS) ? readdirSync(DST_PODCASTS) : []
  const allExisting = [...existingGuides, ...existingS1, ...existingS2, ...existingL2, ...existingPodcasts]

  console.log(`Existing: ${allExisting.length} files in public/files/`)

  // Scan source
  const allFiles = scanDir(SRC)
  const pdfs = allFiles.filter((f) => f.ext === '.pdf' && !f.name.includes('(1)') && !f.name.includes('(2)'))
  const audios = allFiles.filter((f) => ['.mp3', '.m4a'].includes(f.ext) && !f.name.includes('(1)') && f.size <= MAX_AUDIO_SIZE)

  console.log(`Source: ${pdfs.length} PDFs, ${audios.length} audio (<20Mo)\n`)

  let newGuides = 0, newFasc = 0, newPod = 0, skipped = 0

  // Sync PDFs
  for (const file of pdfs) {
    if (isDuplicate(file.name, allExisting)) { skipped++; continue }

    const lp = file.path.toLowerCase()
    let dst

    if (lp.includes('bac s1') || lp.includes('academy bac s1')) dst = DST_FASC_S1
    else if (lp.includes('bac s2') || lp.includes('academy bac s2')) dst = DST_FASC_S2
    else if (lp.includes('bac l2') || lp.includes('academy bac l2')) dst = DST_FASC_L2
    else if (lp.includes('pack essentiel') || lp.includes('pack premium') || lp.includes('pack excellence')) { skipped++; continue } // Skip pack copies
    else dst = DST_GUIDES

    const target = join(dst, file.name)
    if (!existsSync(target)) {
      copyFileSync(file.path, target)
      if (dst === DST_GUIDES) newGuides++
      else newFasc++
      console.log(`  ✅ ${file.name} → ${dst.split('/').pop()}`)
    }
  }

  // Sync audio (only small files)
  for (const file of audios) {
    if (isDuplicate(file.name, allExisting)) { skipped++; continue }
    const target = join(DST_PODCASTS, file.name.replace(/\s+/g, '_'))
    if (!existsSync(target)) {
      copyFileSync(file.path, target)
      newPod++
      console.log(`  🎧 ${file.name} → podcasts/`)
    }
  }

  console.log(`\n=== Results ===`)
  console.log(`  New guides: ${newGuides}`)
  console.log(`  New fascicules: ${newFasc}`)
  console.log(`  New podcasts: ${newPod}`)
  console.log(`  Skipped (duplicates/packs): ${skipped}`)
  console.log(`  Total synced: ${newGuides + newFasc + newPod}`)
}

main().catch(console.error)

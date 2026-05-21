#!/usr/bin/env node
/**
 * generate-exhaustive-products.mjs
 * Scans ALL files in public/files/ and generates a complete products.js
 * with every single file represented as a product entry.
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd())
const PUBLIC_FILES = path.join(ROOT, 'public/files')
const PRODUCTS_PATH = path.join(ROOT, 'src/data/products.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function titleCase(str) {
  return str.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function humanizeFilename(name) {
  // Remove extension
  let base = name.replace(/\.pdf$/i, '').replace(/\.mp3$/i, '').replace(/\.mp4$/i, '')
  // Remove ABAWI prefixes
  base = base.replace(/^ABAWI[_\s]/i, '').replace(/^ABAWI_Academy[_\s]/i, '')
  // Replace underscores with spaces
  base = base.replace(/_/g, ' ')
  // Title case
  return base.replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ').trim()
}

function extractChapitre(name) {
  const m = name.match(/ch(\d+)|ch0*(\d+)|chapter\s*(\d+)|chapitre\s*(\d+)/i)
  return m ? parseInt(m[1] || m[2] || m[3] || m[4]) : null
}

function extractSerieFromPath(relPath) {
  const lower = relPath.toLowerCase()
  if (lower.includes('bac s1') || lower.includes('s1') || lower.includes('bac_s1')) return 'S1'
  if (lower.includes('bac s2') || lower.includes('s2') || lower.includes('bac_s2')) return 'S2'
  if (lower.includes('bac l1') || lower.includes('l1') || lower.includes('bac_l1')) return 'L1'
  if (lower.includes('bac l2') || lower.includes('l2') || lower.includes('bac_l2')) return 'L2'
  return 'Autre'
}

function extractMatiereFromPath(relPath) {
  const lower = relPath.toLowerCase()
  const map = {
    'francais': 'Français', 'français': 'Français', 'fr': 'Français',
    'anglais': 'Anglais', 'english': 'Anglais', 'en': 'Anglais',
    'math': 'Maths', 'maths': 'Maths', 'mathematique': 'Maths', 'mathematiques': 'Maths',
    'hg': 'Histoire-Geo', 'histoire': 'Histoire-Geo', 'geographie': 'Histoire-Geo', 'geo': 'Histoire-Geo',
    'histoire-geo': 'Histoire-Geo', 'histoire_géo': 'Histoire-Geo', 'histoire_geo': 'Histoire-Geo',
    'philo': 'Philosophie', 'philosophie': 'Philosophie', 'phi': 'Philosophie',
    'pc': 'Physique-Chimie', 'physique': 'Physique-Chimie', 'chimie': 'Physique-Chimie',
    'physique_chimie': 'Physique-Chimie', 'physique-chimie': 'Physique-Chimie',
    'svt': 'SVT', 'biologie': 'SVT', 'vie': 'SVT',
  }
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val
  }
  return 'Autre'
}

// ─── Scan directories ────────────────────────────────────────────────────────
function scanDir(dir, ext, baseDir = PUBLIC_FILES) {
  const results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanDir(p, ext, baseDir))
    } else if (entry.isFile() && (!ext || entry.name.toLowerCase().endsWith(ext))) {
      const rel = path.relative(baseDir, p).replace(/\\/g, '/')
      results.push({ path: p, rel, name: entry.name })
    }
  }
  return results
}

// ─── Existing products.js data ───────────────────────────────────────────────
let existingGuides = new Map()
let existingFascicules = new Map()
let existingPodcasts = new Map()

// Parse existing products.js to preserve metadata
if (fs.existsSync(PRODUCTS_PATH)) {
  const code = fs.readFileSync(PRODUCTS_PATH, 'utf-8')
  // Extract guides
  const guideMatch = code.match(/export const guides = (\[[\s\S]*?\]);/)
  if (guideMatch) {
    try {
      const guides = JSON.parse(guideMatch[1].replace(/'/g, '"').replace(/\n/g, '').replace(/,\s*]/g, ']'))
      // Actually, the file uses proper JSON-like structure, let's eval it
      const guidesEval = eval(guideMatch[1])
      if (Array.isArray(guidesEval)) {
        guidesEval.forEach(g => { if (g.file_url) existingGuides.set(g.file_url, g) })
      }
    } catch (e) { /* ignore */ }
  }
  // Extract fascicules
  const fascMatch = code.match(/export const fascicules = \{([\s\S]*?)\};/)
  if (fascMatch) {
    try {
      const fascObj = eval('({' + fascMatch[1] + '})')
      Object.values(fascObj).flat().forEach(f => { if (f.file_url) existingFascicules.set(f.file_url, f) })
    } catch (e) { /* ignore */ }
  }
  // Extract podcasts
  const podMatch = code.match(/export const podcasts = (\[[\s\S]*?\]);/)
  if (podMatch) {
    try {
      const pods = eval(podMatch[1])
      pods.forEach(p => { if (p.audio_url) existingPodcasts.set(p.audio_url, p) })
    } catch (e) { /* ignore */ }
  }
}

// ─── Generate Guides ──────────────────────────────────────────────────────────
const guideFiles = scanDir(path.join(PUBLIC_FILES, 'guides'), '.pdf')
const guides = guideFiles.map((f, i) => {
  const existing = existingGuides.get('/files/guides/' + f.name)
  const url = '/files/guides/' + f.name
  const title = existing?.titre || humanizeFilename(f.name)
  return {
    id: existing?.id || `g${String(i + 1).padStart(3, '0')}`,
    titre: title,
    categorie: existing?.categorie || 'Business & Digital',
    prix: existing?.prix || 1490,
    prix_barre: existing?.prix_barre || 4900,
    file_url: url,
    drive_url: existing?.drive_url || null,
    brand: existing?.brand || 'digital',
    premium: existing?.premium !== false,
    gratuit: existing?.gratuit || false,
  }
})

// ─── Generate Fascicules ──────────────────────────────────────────────────────
const fasciculeFiles = scanDir(path.join(PUBLIC_FILES, 'fascicules'), '.pdf')
const fascicules = { s1: [], s2: [], l1: [], l2: [], other: [] }

fasciculeFiles.forEach((f, i) => {
  const existing = existingFascicules.get('/files/fascicules/' + f.rel.replace('fascicules/', ''))
  const url = '/files/fascicules/' + f.rel.replace('fascicules/', '')
  const serie = existing?.serie || extractSerieFromPath(f.rel)
  const matiere = existing?.matiere || extractMatiereFromPath(f.rel)
  const chapitre = existing?.chapitre || extractChapitre(f.name)
  const title = existing?.titre || humanizeFilename(f.name)
  const id = existing?.id || `f${slugify(serie + '-' + matiere).replace(/-+/g, '-')}-${String(i + 1).padStart(4, '0')}`

  const entry = {
    id,
    titre: title,
    matiere,
    serie,
    chapitre,
    prix: existing?.prix || 990,
    prix_barre: existing?.prix_barre || 2500,
    file_url: url,
    drive_url: existing?.drive_url || null,
    brand: existing?.brand || 'academy',
    premium: existing?.premium !== false,
    gratuit: existing?.gratuit || false,
  }

  const key = serie.toLowerCase()
  if (fascicules[key]) fascicules[key].push(entry)
  else fascicules.other.push(entry)
})

// ─── Generate Podcasts ────────────────────────────────────────────────────────
const podcastFiles = scanDir(path.join(PUBLIC_FILES, 'podcasts'), '.mp3')
const podcasts = podcastFiles.map((f, i) => {
  const existing = existingPodcasts.get('/files/podcasts/' + f.name)
  const url = '/files/podcasts/' + f.name
  const title = existing?.titre || humanizeFilename(f.name)
  return {
    id: existing?.id || `pod${String(i + 1).padStart(3, '0')}`,
    titre: title,
    serie: existing?.serie || 'Business & Digital',
    prix: existing?.prix || 1900,
    audio_url: url,
    premium: existing?.premium !== false,
    gratuit: existing?.gratuit || false,
    featured: existing?.featured || false,
    lyrics: existing?.lyrics || null,
  }
})

// ─── Generate Videos ──────────────────────────────────────────────────────────
const videoFiles = scanDir(path.join(PUBLIC_FILES, 'videos'), '.mp4')
const videos = videoFiles.map((f, i) => ({
  id: `vid${String(i + 1).padStart(3, '0')}`,
  titre: humanizeFilename(f.name),
  categorie: 'Business & Digital',
  prix: 1900,
  video_url: '/files/videos/' + f.name,
  premium: true,
  gratuit: false,
}))

// ─── Generate Summaries ─────────────────────────────────────────────────────
const summaryFiles = scanDir(path.join(PUBLIC_FILES, 'summaries'), '.mp3')
const summaries = summaryFiles.map((f, i) => ({
  id: `sum${String(i + 1).padStart(3, '0')}`,
  titre: humanizeFilename(f.name),
  categorie: 'Résumé Audio',
  audio_url: '/files/summaries/' + f.name,
  premium: false,
  gratuit: true,
}))

// ─── Generate Fascicule Audios ──────────────────────────────────────────────
const fascAudioFiles = scanDir(path.join(PUBLIC_FILES, 'fascicules-audio'), '.mp3')
const fasciculeAudios = fascAudioFiles.map((f, i) => ({
  id: `fa${String(i + 1).padStart(3, '0')}`,
  titre: humanizeFilename(f.name),
  serie: extractSerieFromPath(f.name),
  matiere: extractMatiereFromPath(f.name),
  audio_url: '/files/fascicules-audio/' + f.name,
  premium: false,
  gratuit: true,
}))

// ─── Write products.js ────────────────────────────────────────────────────────
const output = `// ================================================================
// PRODUCTS DATA — Exhaustive Catalog
// Auto-generated: ${new Date().toISOString()}
// ================================================================

export function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function formatPrix(n) {
  return n.toLocaleString('fr-FR') + ' F CFA'
}

// ─── GUIDES ───────────────────────────────────────────────────────────────────
export const guides = ${JSON.stringify(guides, null, 2)};

// ─── FASCICULES ───────────────────────────────────────────────────────────────
export const fascicules = {
  s1: ${JSON.stringify(fascicules.s1, null, 2)},
  s2: ${JSON.stringify(fascicules.s2, null, 2)},
  l1: ${JSON.stringify(fascicules.l1, null, 2)},
  l2: ${JSON.stringify(fascicules.l2, null, 2)},
  other: ${JSON.stringify(fascicules.other, null, 2)}
};

export const allFascicules = [
  ...fascicules.s1,
  ...fascicules.s2,
  ...fascicules.l1,
  ...fascicules.l2,
  ...fascicules.other
];

// ─── PODCASTS ─────────────────────────────────────────────────────────────────
export const podcasts = ${JSON.stringify(podcasts, null, 2)};

// ─── VIDEOS ─────────────────────────────────────────────────────────────────
export const videos = ${JSON.stringify(videos, null, 2)};

// ─── SUMMARIES ────────────────────────────────────────────────────────────────
export const summaries = ${JSON.stringify(summaries, null, 2)};

// ─── FASCICULE AUDIOS ───────────────────────────────────────────────────────
export const fasciculeAudios = ${JSON.stringify(fasciculeAudios, null, 2)};

// ─── PACKS ────────────────────────────────────────────────────────────────────
export const digitalPacks = [
  { id:'pd1', nom:'Pack Essentiel', emoji:'\\u{1F949}', prix:4900, prix_barre:15000, economie_pct:56, contenu:['12 guides marketing & reseaux sociaux'] },
  { id:'pd2', nom:'Pack Premium', emoji:'\\u{1F948}', prix:9900, prix_barre:45000, economie_pct:63, badge:'BEST SELLER', highlight:true, contenu:['Tout le Pack Essentiel','+ Business, Communication, Strategie'] },
  { id:'pd3', nom:'Pack Excellence', emoji:'\\u{1F947}', prix:19900, prix_barre:100000, economie_pct:67, badge:'PREMIUM', contenu:['Plus de 70 guides — Achat unique','Tout le Pack Premium + Tech, IA, Visa, Bankable'] },
  { id:'pd4', nom:'ABAWI+', emoji:'\\u{1F49A}', prix:4900, prix_barre:222500, economie_pct:97, badge:'VIP ILLIMITE', contenu:['ACCÈS ILLIMITÉ à TOUT le catalogue','Guides + Academy + Podcasts + Templates + Futurs contenus'] },
];

export const academyPacks = [
  { id:'pa1', nom:'Pack S1 Complet', prix:4900, prix_barre:15000, economie_pct:53, badge:'S1', description:'Toutes les matieres Bac S1 — ${fascicules.s1.length} fascicules' },
  { id:'pa2', nom:'Pack S2 Complet', prix:4900, prix_barre:20000, economie_pct:63, badge:'S2', description:'Toutes les matieres Bac S2 — ${fascicules.s2.length} fascicules' },
  { id:'pa3', nom:'Pack L1 Complet', prix:3900, prix_barre:12000, economie_pct:64, badge:'L1', description:'Toutes les matieres Bac L1 — ${fascicules.l1.length} fascicules' },
  { id:'pa4', nom:'Pack L2 Complet', prix:3900, prix_barre:12000, economie_pct:64, badge:'L2', description:'Toutes les matieres Bac L2 — ${fascicules.l2.length} fascicules' },
  { id:'pa5', nom:'Pack BAC TOTAL', prix:34990, prix_barre:105000, economie_pct:67, badge:'PACK ULTIME', description:'S1 + S2 + L1 + L2 — ${fascicules.s1.length + fascicules.s2.length + fascicules.l1.length + fascicules.l2.length} fascicules' },
];
`;

fs.writeFileSync(PRODUCTS_PATH, output, 'utf-8')

// ─── Report ────────────────────────────────────────────────────────────────────
console.log(`✅ products.js generated successfully`)
console.log(`   Guides        : ${guides.length}`)
console.log(`   Fascicules S1 : ${fascicules.s1.length}`)
console.log(`   Fascicules S2 : ${fascicules.s2.length}`)
console.log(`   Fascicules L1 : ${fascicules.l1.length}`)
console.log(`   Fascicules L2 : ${fascicules.l2.length}`)
console.log(`   Fascicules (Other) : ${fascicules.other.length}`)
console.log(`   Podcasts      : ${podcasts.length}`)
console.log(`   Videos        : ${videos.length}`)
console.log(`   Summaries     : ${summaries.length}`)
console.log(`   Fascicule Audios : ${fasciculeAudios.length}`)
console.log(`\n📄 Written to: ${PRODUCTS_PATH}`)

/**
 * generate-all-audio.mjs
 * Generates MP3 summaries for ALL guides + fascicules using ElevenLabs Bella voice.
 * Run: node scripts/generate-all-audio.mjs
 * - Guides  → public/files/summaries/{slug}.mp3
 * - Fascicules → public/files/fascicules-audio/{slug}.mp3
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const EL_KEY   = process.env.ELEVENLABS_API_KEY || ''
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL' // Bella — clear, warm French
const MODEL_ID = 'eleven_multilingual_v2'

const BASE = 'C:/Users/HP/Desktop/abawi-portal/public/files'
const GUIDES_DIR = `${BASE}/summaries`
const FASCI_DIR  = `${BASE}/fascicules-audio`

;[GUIDES_DIR, FASCI_DIR].forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }) })

// ─── Slugify (same as products.js) ───────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

// ─── Product lists ────────────────────────────────────────────────────────────
const GUIDES = [
  { id:'g1',  titre:'Mindset Entrepreneur',           categorie:'Leadership' },
  { id:'g2',  titre:'Art de la Communication',         categorie:'Communication' },
  { id:'g3',  titre:'Les 4 Piliers du Business',       categorie:'Business' },
  { id:'g4',  titre:'Vente & Digital Pro',             categorie:'Ventes' },
  { id:'g5',  titre:'Secrets des Digital Marketers',   categorie:'Marketing' },
  { id:'g6',  titre:'Facebook Ads Masterclass',        categorie:'Marketing' },
  { id:'g7',  titre:'Instagram Growth',                categorie:'Marketing' },
  { id:'g8',  titre:'Automatisation Business',         categorie:'Technologie' },
  { id:'g9',  titre:'IA pour Entrepreneurs',           categorie:'Technologie' },
  { id:'g10', titre:'Négociation Stratégique',         categorie:'Business' },
  { id:'g11', titre:'Intelligence Économique',         categorie:'Business' },
  { id:'g12', titre:'Réseautage & Networking',         categorie:'Leadership' },
  { id:'g13', titre:'Content Marketing Stratégique',   categorie:'Marketing' },
  { id:'g14', titre:'TikTok Business',                 categorie:'Marketing' },
  { id:'g15', titre:'Maîtrisez WhatsApp Business',     categorie:'Communication' },
  { id:'g16', titre:'Productivité CEO',                categorie:'Leadership' },
  { id:'g17', titre:'Dossier Bankable',                categorie:'Finance' },
  { id:'g18', titre:'Visa Bankable',                   categorie:'Finance' },
  { id:'g19', titre:'De Zéro à Millionnaire Digital',  categorie:'Business' },
  { id:'g20', titre:'Pack Emploi Complet',             categorie:'Carrière' },
  { id:'g21', titre:'Partenaires Internationaux',      categorie:'Business' },
  { id:'g22', titre:'Guide Restaurant Sénégal',        categorie:'Business' },
  { id:'g23', titre:'Comptabilité OHADA',              categorie:'Finance' },
  { id:'g24', titre:'Programmation Niveau 1',          categorie:'Technologie' },
  { id:'g25', titre:'Programmation Niveau 2',          categorie:'Technologie' },
  { id:'g26', titre:'Programmation Niveau 3',          categorie:'Technologie' },
  { id:'g27', titre:'B2B Masterclass',                 categorie:'Ventes' },
]

const FASCICULES = [
  // S1
  { id:'fs1_1',  titre:'English Bac S1 Ch01 Methodology',       matiere:'Anglais',   serie:'S1' },
  { id:'fs1_2',  titre:'English Bac S1 Ch02 Themes Vocabulary',  matiere:'Anglais',   serie:'S1' },
  { id:'fs1_3',  titre:'English Bac S1 Ch03 Texts Extracts',     matiere:'Anglais',   serie:'S1' },
  { id:'fs1_4',  titre:'Français Bac S1 Ch01 Méthodologie',      matiere:'Français',  serie:'S1' },
  { id:'fs1_5',  titre:"Français Bac S1 Ch02 L'Aventure Ambiguë",matiere:'Français',  serie:'S1' },
  { id:'fs1_6',  titre:"Français Bac S1 Ch03 L'Enfant Noir",     matiere:'Français',  serie:'S1' },
  { id:'fs1_7',  titre:"Français Bac S1 Ch04 Les Bouts de Bois de Dieu", matiere:'Français', serie:'S1' },
  { id:'fs1_8',  titre:'Français Bac S1 Ch05 La Négritude',      matiere:'Français',  serie:'S1' },
  { id:'fs1_9',  titre:'HG Bac S1 Ch01 Méthodologie',            matiere:'Histoire-Géo', serie:'S1' },
  { id:'fs1_10', titre:'HG Bac S1 Ch02 Colonisation Décolonisation', matiere:'Histoire-Géo', serie:'S1' },
  { id:'fs1_11', titre:'HG Bac S1 Ch03 Sénégal Relations Internationales', matiere:'Histoire-Géo', serie:'S1' },
  { id:'fs1_12', titre:'HG Bac S1 Ch04 Géographie Afrique Sénégal', matiere:'Histoire-Géo', serie:'S1' },
  { id:'fs1_13', titre:'HG Bac S1 Ch05 Mondialisation',          matiere:'Histoire-Géo', serie:'S1' },
  { id:'fs1_14', titre:'Philosophie Bac S1 Ch01 La Liberté',     matiere:'Philosophie', serie:'S1' },
  { id:'fs1_15', titre:'Philosophie Bac S1 Ch02 Conscience et Inconscient', matiere:'Philosophie', serie:'S1' },
  { id:'fs1_16', titre:'Philosophie Bac S1 Ch03 Travail et Technique', matiere:'Philosophie', serie:'S1' },
  { id:'fs1_17', titre:'Philosophie Bac S1 Ch05 État et Société', matiere:'Philosophie', serie:'S1' },
  { id:'fs1_18', titre:'Philosophie Bac S1 Ch06 Bonheur et Morale', matiere:'Philosophie', serie:'S1' },
  // S2
  { id:'fs2_1',  titre:'English Bac S2 Ch01 Reading Comprehension', matiere:'Anglais', serie:'S2' },
  { id:'fs2_2',  titre:'English Bac S2 Ch02 Grammar Tenses',       matiere:'Anglais', serie:'S2' },
  { id:'fs2_3',  titre:'English Bac S2 Ch03 Advanced Grammar',     matiere:'Anglais', serie:'S2' },
  { id:'fs2_4',  titre:'English Bac S2 Ch04 Vocabulary',           matiere:'Anglais', serie:'S2' },
  { id:'fs2_5',  titre:'English Bac S2 Ch05 Writing Skills',       matiere:'Anglais', serie:'S2' },
  { id:'fs2_6',  titre:'Français Bac S2 Ch01 Dissertation',        matiere:'Français', serie:'S2' },
  { id:'fs2_7',  titre:'Français Bac S2 Ch02 Commentaire Composé', matiere:'Français', serie:'S2' },
  { id:'fs2_8',  titre:'Français Bac S2 Ch03 Littérature Africaine', matiere:'Français', serie:'S2' },
  { id:'fs2_9',  titre:'Français Bac S2 Ch04 Figures de Style',   matiere:'Français', serie:'S2' },
  { id:'fs2_10', titre:'Français Bac S2 Ch05 Résumé et Expression', matiere:'Français', serie:'S2' },
  { id:'fs2_11', titre:'HG Bac S2 Ch01 Guerre Froide',             matiere:'Histoire-Géo', serie:'S2' },
  { id:'fs2_12', titre:'HG Bac S2 Ch02 Le Monde après la Guerre Froide', matiere:'Histoire-Géo', serie:'S2' },
  { id:'fs2_13', titre:'HG Bac S2 Ch03 Les Grandes Puissances',   matiere:'Histoire-Géo', serie:'S2' },
  { id:'fs2_14', titre:'HG Bac S2 Ch04 Développement et Inégalités', matiere:'Histoire-Géo', serie:'S2' },
  { id:'fs2_15', titre:'HG Bac S2 Ch05 Espaces Mondiaux',         matiere:'Histoire-Géo', serie:'S2' },
  { id:'fs2_16', titre:'Maths Bac S2 Ch01 Suites Numériques',     matiere:'Mathématiques', serie:'S2' },
  { id:'fs2_17', titre:'Maths Bac S2 Ch02 Limites et Continuité', matiere:'Mathématiques', serie:'S2' },
  { id:'fs2_18', titre:'Maths Bac S2 Ch03 Dérivation',            matiere:'Mathématiques', serie:'S2' },
  { id:'fs2_19', titre:'Maths Bac S2 Ch04 Intégration',           matiere:'Mathématiques', serie:'S2' },
  { id:'fs2_20', titre:'Maths Bac S2 Ch05 Probabilités',          matiere:'Mathématiques', serie:'S2' },
]

// ─── Groq text generation ─────────────────────────────────────────────────────
async function groqText(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_KEY },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', max_tokens: 400, temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text || text.length < 40) throw new Error('Groq vide')
  return text
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
async function tts(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.42, similarity_boost: 0.80, style: 0.65, use_speaker_boost: true },
    }),
  })
  if (!res.ok) throw new Error('ElevenLabs ' + res.status + ' — ' + await res.text())
  return Buffer.from(await res.arrayBuffer())
}

// ─── Guide summary ────────────────────────────────────────────────────────────
async function generateGuide(g) {
  const dest = `${GUIDES_DIR}/${slugify(g.titre)}.mp3`
  if (existsSync(dest)) { console.log(`  ⏭  ${g.titre.substring(0,50)} — déjà présent`); return null }

  const text = await groqText(
    `Génère un résumé audio captivant de 200 mots maximum pour le guide "${g.titre}" (catégorie: ${g.categorie}). ` +
    `Présente les 3 points essentiels. Donne envie d'acheter sans tout révéler. ` +
    `Termine par "Retrouvez toutes les stratégies dans le guide complet." ` +
    `Ne te présente jamais. Français impeccable avec accents. Réponds uniquement avec le texte du résumé.`
  )
  const audio = await tts(text)
  writeFileSync(dest, audio)
  return { chars: text.length, kb: (audio.length / 1024).toFixed(0) }
}

// ─── Fascicule intro ──────────────────────────────────────────────────────────
async function generateFascicule(f) {
  const dest = `${FASCI_DIR}/${slugify(f.titre)}.mp3`
  if (existsSync(dest)) { console.log(`  ⏭  ${f.titre.substring(0,50)} — déjà présent`); return null }

  const text = await groqText(
    `Génère une courte introduction audio de 120 mots maximum pour le fascicule scolaire "${f.titre}" ` +
    `(matière: ${f.matiere}, série: Bac ${f.serie}). ` +
    `Explique ce que l'élève va apprendre, les notions clés abordées, et comment ce fascicule l'aidera à réussir son BAC. ` +
    `Ton encourageant et dynamique. Termine par "Bonne révision avec ABAWI Academy !" ` +
    `Ne te présente jamais. Français impeccable. Réponds uniquement avec le texte de l'introduction.`
  )
  const audio = await tts(text)
  writeFileSync(dest, audio)
  return { chars: text.length, kb: (audio.length / 1024).toFixed(0) }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const onlyGuides    = args.includes('--guides')
  const onlyFascicules = args.includes('--fascicules')
  const runGuides    = !onlyFascicules
  const runFascicules = !onlyGuides

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║     ABAWI Audio Generator — Bella voice          ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  let ok = 0, skipped = 0, errors = 0, totalChars = 0

  // ── Guides ──
  if (runGuides) {
    console.log(`▶ Guides (${GUIDES.length})\n`)
    for (let i = 0; i < GUIDES.length; i++) {
      const g = GUIDES[i]
      process.stdout.write(`  [${String(i+1).padStart(2,'0')}/${GUIDES.length}] ${g.titre.substring(0,44).padEnd(44)} `)
      try {
        const r = await generateGuide(g)
        if (r === null) { process.stdout.write('⏭\n'); skipped++; continue }
        process.stdout.write(`✅ ${r.chars}c ${r.kb}Ko\n`)
        ok++; totalChars += r.chars
        await new Promise(r => setTimeout(r, 1800)) // rate-limit
      } catch(e) {
        process.stdout.write(`❌ ${e.message.substring(0,40)}\n`)
        errors++
        await new Promise(r => setTimeout(r, 3000))
      }
    }
  }

  // ── Fascicules ──
  if (runFascicules) {
    console.log(`\n▶ Fascicules (${FASCICULES.length})\n`)
    for (let i = 0; i < FASCICULES.length; i++) {
      const f = FASCICULES[i]
      process.stdout.write(`  [${String(i+1).padStart(2,'0')}/${FASCICULES.length}] ${f.titre.substring(0,44).padEnd(44)} `)
      try {
        const r = await generateFascicule(f)
        if (r === null) { process.stdout.write('⏭\n'); skipped++; continue }
        process.stdout.write(`✅ ${r.chars}c ${r.kb}Ko\n`)
        ok++; totalChars += r.chars
        await new Promise(r => setTimeout(r, 1800))
      } catch(e) {
        process.stdout.write(`❌ ${e.message.substring(0,40)}\n`)
        errors++
        await new Promise(r => setTimeout(r, 3000))
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log(`║  Générés : ${String(ok).padEnd(3)}  Sautés : ${String(skipped).padEnd(3)}  Erreurs : ${String(errors).padEnd(3)}    ║`)
  console.log(`║  Caractères ElevenLabs : ${String(totalChars).padEnd(6)}                   ║`)
  console.log('╚══════════════════════════════════════════════════╝\n')
}

main().catch(console.error)

import fs from 'fs'
import path from 'path'

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || ''
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa'

const VOICE_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.80,
  style: 0.45,
  use_speaker_boost: true,
  speed: 1.05,
}

const ANGLICISMES = {
  'business': 'activité professionnelle',
  'marketing': 'stratégie commerciale',
  'tips': 'conseils',
  'skills': 'compétences',
  'challenge': 'défi',
  'feedback': 'retour',
  'management': 'gestion',
  'networking': 'réseau professionnel',
  'coaching': 'accompagnement',
  'startup': 'jeune entreprise',
  'pitch': 'présentation',
  'mindset': "état d'esprit",
  'content': 'contenu',
  'online': 'en ligne',
  'framework': 'cadre méthodologique',
  'workflow': 'processus de travail',
  'digital': 'numérique',
  'masterclass': 'formation experte',
  'growth': 'croissance',
  'branding': 'image de marque',
}

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function purifierFrancais(text) {
  let cleaned = text
  for (const [en, fr] of Object.entries(ANGLICISMES)) {
    cleaned = cleaned.replace(new RegExp('\\b' + en + '\\b', 'gi'), fr)
  }
  return cleaned
}

async function genTexteGroq(titre, categorie, type, matiere, serie) {
  const forbidden = Object.keys(ANGLICISMES).join(', ')
  const prompt = type === 'guide'
    ? `Tu es une présentatrice française experte pour la plateforme ABAWI.
RÈGLES STRICTES :
- Réponds UNIQUEMENT en français
- MOTS INTERDITS (remplace-les) : ${forbidden}
- Phrases courtes, maximum 12 mots par phrase
- Ton chaleureux, direct, expert, captivant
- Aucun tiret, astérisque, numéro dans le texte
- Maximum 80 mots total
- Texte optimisé pour lecture à voix haute naturelle

Présente ce guide : "${titre}" (domaine : ${categorie || 'professionnel'})

Structure :
Accroche forte une phrase. Ce que vous allez apprendre deux à trois points. Résultat concret une phrase. Invitation à agir une phrase courte.`

    : `Tu es une présentatrice française experte pour ABAWI Academy.
RÈGLES STRICTES :
- Réponds UNIQUEMENT en français
- MOTS INTERDITS : ${forbidden}
- Phrases courtes maximum 12 mots
- Ton pédagogique, motivant, chaleureux
- Aucun tiret ni numéro
- Maximum 70 mots total

Présente ce fascicule : "${titre}" (matière : ${matiere || ''}, Bac ${serie || ''})

Structure :
Contenu du fascicule une phrase. Thèmes abordés deux points. Pourquoi indispensable pour le Bac une phrase. Encouragement une phrase.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 250, temperature: 0.55,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  return purifierFrancais(raw)
}

async function genMP3(text, fp) {
  if (!text || text.length < 15) throw new Error('Texte trop court: ' + text.length)
  const clean = purifierFrancais(text)

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_CHARLOTTE}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: clean,
      model_id: 'eleven_multilingual_v2',
      voice_settings: VOICE_SETTINGS,
    })
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`ElevenLabs ${res.status}: ${err.substring(0, 200)}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 15000) throw new Error(`MP3 trop petit: ${buffer.length} bytes`)

  fs.writeFileSync(fp, buffer)
  return buffer.length
}

async function processItem(item, type, dir, attempt = 1) {
  const fp = path.join(dir, slugify(item.titre) + '.mp3')

  if (!process.argv.includes('--force')) {
    if (fs.existsSync(fp) && fs.statSync(fp).size > 20000) {
      process.stdout.write(`⏭️  `)
      return 'skip'
    }
  }

  try {
    const text = await genTexteGroq(item.titre, item.categorie, type, item.matiere, item.serie)
    if (!text) throw new Error('Texte vide')
    const size = await genMP3(text, fp)
    console.log(`✅ ${item.titre.substring(0, 40)} (${(size/1024).toFixed(0)} Ko)`)
    return 'ok'
  } catch (e) {
    if (attempt < 3) {
      console.log(`  ⚠️  Tentative ${attempt}/3: ${e.message} — Retry...`)
      await new Promise(r => setTimeout(r, 3000))
      return processItem(item, type, dir, attempt + 1)
    }
    console.error(`  ❌ Échec: ${item.titre} — ${e.message}`)
    return 'fail'
  }
}

const PAGE_AUDIOS = {
  'outils': "Bienvenue dans les Outils ABAWI. Créez des documents professionnels de qualité en quelques minutes grâce à l'intelligence artificielle. Votre curriculum vitae optimisé pour les recruteurs, votre lettre de motivation percutante, votre plan d'affaires complet avec projections financières, votre facture professionnelle. Tout ce dont vous avez besoin pour vous imposer sur le marché africain. Choisissez votre outil et commencez maintenant.",
  'digital': "Bienvenue dans la bibliothèque numérique ABAWI. Plus de soixante-dix guides pratiques sur la stratégie commerciale, la communication, la technologie et l'emploi. Des méthodes concrètes et directement applicables pour développer votre activité en Afrique. Accédez à tout sans limite avec ABAWI Plus pour quatre mille neuf cents francs par mois.",
  'academy': "Bienvenue sur ABAWI Academy. Des fascicules de révision complets pour le Baccalauréat, conçus spécialement pour les élèves sénégalais. Corrigés inclus, programme officiel respecté. Donnez-vous toutes les chances de réussir vos examens avec les meilleurs outils pédagogiques disponibles.",
  'podcasts': "Bienvenue sur les Podcasts ABAWI. Des épisodes sur l'entrepreneuriat, le développement personnel et l'actualité économique africaine. Écoutez pendant vos déplacements. Plusieurs épisodes sont accessibles gratuitement. Accédez à la collection complète avec ABAWI Plus.",
  'news': "Bienvenue sur ABAWI Actualités. L'information économique, commerciale et technologique d'Afrique, sélectionnée pour vous. Tendances des marchés, opportunités d'investissement, innovations sectorielles. Tout pour prendre les meilleures décisions.",
}

const BIENVENUE = `Bienvenue sur ABAWI. Vous venez d'accéder à la première plateforme africaine d'excellence professionnelle. Plus de soixante-dix guides pratiques pour maîtriser la stratégie commerciale, le numérique, la communication et la technologie. Des outils d'intelligence artificielle pour créer votre curriculum vitae, votre plan d'affaires, vos factures et vos présentations en quelques minutes. Des fascicules complets pour réussir votre Baccalauréat. Des épisodes audio pour vous former en déplacement. Tout ce dont vous avez besoin pour vous imposer sur le marché africain. Accédez à tout, sans limite, avec ABAWI Plus. L'excellence est maintenant accessible. C'est votre moment.`

async function main() {
  const forceAll = process.argv.includes('--force')
  console.log('\n🎙️  RÉGÉNÉRATION COMPLÈTE — Charlotte (française native)')
  if (forceAll) console.log('⚡ Mode --force : tous les fichiers seront régénérés\n')
  else console.log('⏭️  Les fichiers existants valides seront ignorés\n')

  const DIRS = {
    summaries: 'public/files/summaries',
    fascicules: 'public/files/fascicules-audio',
    pages: 'public/files/page-audios',
    podcasts: 'public/files/podcasts',
  }
  Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }))

  // Supprimer anciens MP3 corrompus (< 15Ko)
  for (const dir of [DIRS.summaries, DIRS.fascicules]) {
    if (!fs.existsSync(dir)) continue
    fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).forEach(f => {
      const fp = path.join(dir, f)
      if (fs.statSync(fp).size < 15000) {
        fs.unlinkSync(fp)
        console.log(`🗑️  Supprimé corrompu: ${f}`)
      }
    })
  }

  const { guides, allFascicules } = await import('../src/data/products.js')
  let ok = 0, skip = 0, fail = 0

  console.log('\n═══ GUIDES (' + guides.length + ') ═══')
  for (const guide of guides) {
    const result = await processItem(guide, 'guide', DIRS.summaries)
    if (result === 'ok') ok++
    else if (result === 'skip') skip++
    else fail++
    if (result !== 'skip') await new Promise(r => setTimeout(r, 1800))
  }

  console.log('\n\n═══ FASCICULES (' + allFascicules.length + ') ═══')
  for (const fasc of allFascicules) {
    const result = await processItem(fasc, 'fascicule', DIRS.fascicules)
    if (result === 'ok') ok++
    else if (result === 'skip') skip++
    else fail++
    if (result !== 'skip') await new Promise(r => setTimeout(r, 1800))
  }

  console.log('\n\n═══ PAGES ═══')
  for (const [page, text] of Object.entries(PAGE_AUDIOS)) {
    const fp = path.join(DIRS.pages, page + '.mp3')
    const exists = fs.existsSync(fp) && fs.statSync(fp).size > 15000
    if (!exists || forceAll) {
      try {
        const size = await genMP3(text, fp)
        console.log(`✅ Page ${page} (${(size/1024).toFixed(0)} Ko)`)
        ok++
      } catch (e) { console.error(`❌ Page ${page}: ${e.message}`); fail++ }
      await new Promise(r => setTimeout(r, 1800))
    } else {
      console.log(`⏭️  Page ${page} OK`)
      skip++
    }
  }

  console.log('\n\n═══ PODCAST BIENVENUE ═══')
  const bienvenFp = path.join(DIRS.podcasts, 'bienvenue-abawi.mp3')
  const bienvenExists = fs.existsSync(bienvenFp) && fs.statSync(bienvenFp).size > 15000
  if (!bienvenExists || forceAll) {
    try {
      const size = await genMP3(BIENVENUE, bienvenFp)
      console.log(`✅ Bienvenue (${(size/1024).toFixed(0)} Ko)`)
      ok++
    } catch (e) { console.error(`❌ Bienvenue: ${e.message}`); fail++ }
  } else {
    console.log(`⏭️  Bienvenue OK`)
    skip++
  }

  console.log(`\n\n═══════════════════════════════`)
  console.log(`✅ ${ok} générés | ⏭️  ${skip} existants | ❌ ${fail} erreurs`)
  console.log(`═══════════════════════════════\n`)
}

main().catch(console.error)

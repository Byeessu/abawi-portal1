import fs from 'fs'
import path from 'path'

const GROQ_KEY = process.env.GROQ_API_KEY || ''
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || ''
const VOICE_RACHEL = '21m00Tcm4TlvDq8ikWAM'

const guides = [
  { slug: 'vente-digital-pro', titre: 'Vente Digital Pro' },
  { slug: 'maitrisez-whatsapp-business', titre: 'Maîtrisez WhatsApp Business' },
  { slug: 'facebook-ads-masterclass', titre: 'Facebook Ads Masterclass' },
  { slug: 'instagram-growth', titre: 'Instagram Growth' },
  { slug: 'tiktok-business', titre: 'TikTok Business' },
  { slug: 'secrets-des-digital-marketers', titre: 'Secrets des Digital Marketers' },
  { slug: 'content-marketing-strategique', titre: 'Content Marketing Stratégique' },
  { slug: 'mindset-entrepreneur', titre: 'Mindset Entrepreneur' },
  { slug: 'les-4-piliers-du-business', titre: 'Les 4 Piliers du Business' },
  { slug: 'productivite-ceo', titre: 'Productivité CEO' },
  { slug: 'intelligence-economique', titre: 'Intelligence Économique' },
  { slug: 'automatisation-business', titre: 'Automatisation Business' },
  { slug: 'de-zero-a-millionnaire-digital', titre: 'De Zéro à Millionnaire Digital' },
  { slug: 'negociation-strategique', titre: 'Négociation Stratégique' },
  { slug: 'communication-strategique', titre: 'Communication Stratégique' },
  { slug: 'reseautage-networking', titre: 'Réseautage & Networking' },
  { slug: 'partenaires-internationaux', titre: 'Partenaires Internationaux' },
  { slug: 'b2b-masterclass', titre: 'B2B Masterclass' },
  { slug: 'programmation-niveau-1', titre: 'Programmation Niveau 1' },
  { slug: 'programmation-niveau-2', titre: 'Programmation Niveau 2' },
  { slug: 'programmation-niveau-3', titre: 'Programmation Niveau 3' },
  { slug: 'ia-pour-entrepreneurs', titre: 'IA pour Entrepreneurs' },
  { slug: 'pack-emploi-complet', titre: 'Pack Emploi Complet' },
  { slug: 'dossier-bankable', titre: 'Dossier Bankable' },
  { slug: 'visa-bankable', titre: 'VISA Bankable' },
  { slug: 'comptabilite-ohada', titre: 'Comptabilité OHADA' },
  { slug: 'guide-restaurant-senegal', titre: 'Guide Restaurant Sénégal' },
]

const outputDir = 'public/files/summaries'
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

async function generateText(titre) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + GROQ_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', max_tokens: 400, temperature: 0.7,
      messages: [{ role: 'user', content: `Génère un résumé captivant de 200 mots pour le guide "${titre}". Va droit au but. Présente les 3 points essentiels. Donne envie d'acheter. Termine par "Retrouvez toutes les stratégies détaillées dans le guide complet." Pas de présentation personnelle. Français avec accents.` }],
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

async function textToAudio(text, filePath) {
  const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_RACHEL, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.40, similarity_boost: 0.82, style: 0.70, use_speaker_boost: true },
      speed: 1.15,
    }),
  })
  if (!res.ok) { console.error('  ❌ ElevenLabs:', res.status, await res.text().catch(() => '')); return false }
  fs.writeFileSync(filePath, Buffer.from(await res.arrayBuffer()))
  return true
}

const MAX = parseInt(process.argv[2]) || 5

async function main() {
  console.log(`=== Génération résumés audio (${MAX} max) ===\n`)
  let ok = 0, skip = 0, fail = 0, chars = 0

  for (let i = 0; i < Math.min(guides.length, MAX); i++) {
    const g = guides[i]
    const fp = path.join(outputDir, g.slug + '.mp3')
    if (fs.existsSync(fp) && fs.statSync(fp).size > 1000) {
      console.log(`⏭️  ${g.slug} — déjà généré`); skip++; continue
    }
    console.log(`[${i + 1}/${MAX}] ${g.titre}...`)
    try {
      const text = await generateText(g.titre)
      if (!text || text.length < 50) { console.error('  ❌ Groq vide'); fail++; continue }
      chars += text.length
      console.log('  📝 ' + text.substring(0, 80) + '...')
      const success = await textToAudio(text, fp)
      if (success) { console.log('  ✅ ' + fp + ' — ' + (fs.statSync(fp).size / 1024).toFixed(0) + ' Ko'); ok++ }
      else fail++
      await new Promise((r) => setTimeout(r, 3000))
    } catch (e) { console.error('  ❌', e.message); fail++ }
  }
  console.log(`\n=== ${ok} générés, ${skip} existants, ${fail} erreurs, ${chars} caractères ElevenLabs ===`)
}

main().catch(console.error)

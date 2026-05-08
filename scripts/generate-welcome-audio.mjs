/**
 * Pre-generate the ABAWI welcome podcast as a single MP3 file.
 * Run once: node scripts/generate-welcome-audio.mjs
 * Output: public/files/podcasts/bienvenue-abawi.mp3
 */
import { writeFileSync } from 'fs'

const EL_KEY = process.env.ELEVENLABS_API_KEY || ''
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb' // George
const MODEL_ID = 'eleven_multilingual_v2'
const VOICE_SETTINGS = { stability: 0.40, similarity_boost: 0.82, style: 0.70, use_speaker_boost: true }
const SPEED = 1.15
const OUTPUT = 'C:/Users/HP/Desktop/abawi-portal/public/files/podcasts/bienvenue-abawi.mp3'

// Import chapters text
const chaptersRaw = [
  `Salam Aleikoum. Bienvenue chez ABAWI. Si tu écoutes ce message, c'est que quelque part en toi, il y a une flamme. Une envie d'avancer. Une envie de construire. Une envie de réussir. Et ça, c'est déjà rare. Prends le temps d'écouter ce message jusqu'au bout. Ce n'est pas un pitch commercial. C'est un message de cœur.`,

  `Je ne te connais pas personnellement. Mais je sais une chose sur toi. Tu es une personne exceptionnelle. Pas parce que tu as de l'argent, des diplômes ou des connexions. Mais parce que tu cherches. Tu apprends. Tu avances. Dans un monde où la majorité se contente du minimum, toi tu veux plus. Tu veux comprendre. Tu veux maîtriser. Tu veux créer. Et je te le dis avec conviction : tu vas réussir. Pas demain peut-être. Pas sans effort. Mais tu vas réussir.`,

  `Première conviction que je veux partager avec toi. Ne laisse personne définir tes limites. Au Sénégal, en Afrique, on entend souvent : c'est trop dur, le marché est petit, il n'y a pas d'opportunités, le système est bloqué. C'est faux. Les opportunités sont partout. Dans le digital, dans le commerce, dans l'éducation, dans la tech, dans l'agriculture, dans le tourisme. Le problème n'est jamais le manque d'opportunités. C'est le manque de préparation. Et c'est exactement pour ça qu'ABAWI existe. Pour te préparer. Pour t'armer. Pour que tu sois prêt quand l'opportunité se présente. Commence maintenant. Commence petit si tu veux. Mais commence.`,

  `Deuxième conviction. Le succès n'est pas un événement, c'est un processus. On voit les entrepreneurs qui réussissent et on pense que c'est arrivé du jour au lendemain. C'est faux. Derrière chaque réussite, il y a des mois et des années de travail invisible. Des nuits blanches. Des doutes. Des échecs. Des recommencements. Mais aussi de l'apprentissage constant. De la discipline quotidienne. De la persévérance silencieuse. Chaque guide que tu lis, chaque fascicule que tu étudies, chaque podcast que tu écoutes, c'est un pas de plus vers ta réussite. La discipline bat le talent quand le talent manque de discipline.`,

  `Troisième conviction. On ne réussit jamais seul. Derrière chaque entrepreneur qui a percé, il y a une communauté. Des mentors. Des partenaires. Des clients fidèles. C'est pour ça qu'ABAWI n'est pas juste une bibliothèque de guides. C'est une communauté. Quand tu rejoins ABAWI plus, tu rejoins un groupe d'entrepreneurs qui partagent les mêmes ambitions. Qui s'entraident. Qui se poussent vers le haut. La Teranga, c'est notre force. L'entraide, c'est notre culture. Tends la main à ceux qui viennent après toi. Et accepte la main de ceux qui sont devant.`,

  `Maintenant laisse-moi te présenter ce que tu vas trouver chez ABAWI. ABAWI Digital, ce sont des guides premium écrits pour l'entrepreneur africain. Marketing, business, communication, tech, emploi, visa. Du concret. Du pratique. Du testé. ABAWI Academy, ce sont des fascicules pour réussir tes études. Maths, physique, philosophie, français, histoire-géo. Programme officiel sénégalais avec corrigés détaillés. ABAWI News, c'est ton média économique. Des sources fiables et vérifiées. L'économie du Sénégal et du monde décryptée pour toi. ABAWI Podcasts, c'est ce que tu écoutes maintenant. Des analyses, des interviews, de l'inspiration audio. Et Store IT, c'est du matériel informatique de qualité à Dakar. Parce qu'un entrepreneur a besoin de bons outils. Tout ça forme un écosystème complet. Et tu en fais partie.`,

  `On ne fait pas ça pour l'argent. On fait ça parce qu'on croit profondément que le savoir est le levier le plus puissant pour transformer des vies. Un jeune de Pikine qui lit le guide Marketing Digital peut lancer son business sur WhatsApp et nourrir sa famille. Une étudiante de Thiès qui utilise nos fascicules peut décrocher son Bac avec mention. Un entrepreneur de Saint-Louis qui écoute nos podcasts peut trouver l'idée qui change tout. C'est ça, l'effet ABAWI. Démocratiser l'accès au savoir stratégique. Rendre le premium accessible. Transformer l'Afrique une personne à la fois.`,

  `Alors voilà. Tu es au bon endroit. Au bon moment. Avec les bons outils. Que tu sois étudiant, entrepreneur débutant, professionnel en reconversion ou vétéran qui veut scaler, ABAWI a quelque chose pour toi. Le savoir qui transforme l'Afrique. C'est notre slogan. Mais c'est surtout notre promesse. Merci d'être là. Merci de faire partie de cette aventure. À très vite sur ABAWI. Et n'oublie jamais : tu es capable de bien plus que ce que tu imagines. Salam.`,
]

const fullText = chaptersRaw.join(' ... ')

console.log('=== ABAWI Welcome Podcast Generator ===')
console.log(`Text: ${fullText.length} characters`)
console.log(`Voice: George (${VOICE_ID})`)
console.log(`Speed: ${SPEED}x`)
console.log('')

async function generate() {
  console.log('Calling ElevenLabs API...')

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': EL_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: fullText,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
      speed: SPEED,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('ElevenLabs error:', res.status, err.substring(0, 300))
    process.exit(1)
  }

  console.log('Audio received, saving...')
  const buffer = Buffer.from(await res.arrayBuffer())
  writeFileSync(OUTPUT, buffer)
  const sizeMB = (buffer.length / 1048576).toFixed(1)
  console.log(`\n✅ Saved: ${OUTPUT}`)
  console.log(`   Size: ${sizeMB} MB`)
  console.log(`   Characters: ${fullText.length}`)
  console.log('\nDone! The podcast is ready to play.')
}

generate().catch((e) => { console.error('Fatal:', e.message); process.exit(1) })

import { uploadAudioSummary } from './uploadFile'
import { requestElevenLabsTTS } from './elevenlabsClient'
import { groqChatCompletion } from './groqClient'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const DEFAULT_VOICE = 'XB0fDUnXU5powFXDhCwa' // Charlotte

const ANGLICISMES = [
  [/\bstartup[s]?\b/gi, 'entreprise'],
  [/\bfeedback\b/gi, 'retour'],
  [/\bmanager\b/gi, 'responsable'],
  [/\bteam\b/gi, 'équipe'],
  [/\bmeeting\b/gi, 'réunion'],
  [/\bworkshop\b/gi, 'atelier'],
  [/\bleadership\b/gi, 'leadership'],
  [/\bnetworking\b/gi, 'réseautage'],
  [/\bpitch\b/gi, 'présentation'],
  [/\bbusiness plan\b/gi, "plan d'affaires"],
  [/\bcash flow\b/gi, 'trésorerie'],
]

function purifier(text) {
  for (const [pattern, replacement] of ANGLICISMES) {
    text = text.replace(pattern, replacement)
  }
  return text
}

async function withRetry(fn, attempts = 3, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === attempts - 1) throw e
      if (e.message?.includes('429')) await new Promise(r => setTimeout(r, 5000))
      else await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

/**
 * Generate a French audio summary text using Groq LLM.
 * @param {string} titre
 * @param {string} [categorie]
 * @param {string} [type] - 'guide' | 'fascicule' | 'podcast'
 * @param {string} [matiere] - school subject (for fascicules)
 * @param {string} [serie] - school series (for fascicules)
 * @returns {Promise<string>}
 */
export async function generateSummaryText(titre, categorie = '', type = 'guide', matiere = '', serie = '') {
  const typeLabel = {
    guide: 'un guide business africain',
    fascicule: `un fascicule éducatif${matiere ? ' de ' + matiere : ''}${serie ? ' (série ' + serie + ')' : ''} pour le Bac`,
    podcast: 'un épisode de podcast business africain',
  }[type] || 'un contenu ABAWI'

  const catInfo = categorie ? ` dans la catégorie "${categorie}"` : ''

  const prompt = `Tu es un narrateur africain expert. Génère un résumé audio de 150 à 200 mots en français parlé, naturel et engageant pour ${typeLabel}${catInfo} intitulé : "${titre}".
Le texte doit :
- Commencer directement par le sujet (pas de "Bonjour, aujourd'hui...")
- Présenter la valeur clé en 2-3 phrases d'accroche
- Lister 3 à 4 points concrets que l'auditeur va apprendre
- Terminer par une invitation à découvrir le contenu complet
- Utiliser un vocabulaire accessible, pas de jargon anglophone
Retourne UNIQUEMENT le texte à lire, sans titre ni annotation.`

  return withRetry(async () => {
    const data = await groqChatCompletion({
      model: GROQ_MODEL,
      max_tokens: 400,
      temperature: 0.65,
      messages: [{ role: 'user', content: prompt }],
    }, GROQ_KEY)
    let text = data.choices?.[0]?.message?.content?.trim() || ''
    if (!text) throw new Error('Groq: réponse vide')
    return purifier(text)
  })
}

/**
 * Generate an MP3 blob from text using ElevenLabs TTS.
 * @param {string} text
 * @param {string} [voiceId]
 * @param {object} [settings]
 * @returns {Promise<Blob>}
 */
export async function generateMP3(text, voiceId = DEFAULT_VOICE, settings = {}) {
  const body = {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: settings.stability ?? 0.5,
      similarity_boost: settings.similarity_boost ?? 0.75,
      style: settings.style ?? 0.3,
      use_speaker_boost: settings.use_speaker_boost ?? true,
    },
  }

  return withRetry(async () => {
    const blob = await requestElevenLabsTTS({
      voiceId,
      text,
      modelId: body.model_id,
      voiceSettings: body.voice_settings,
    })
    if (blob.size < 5000) throw new Error('Audio généré trop petit — vérifiez la clé ElevenLabs')
    return blob
  })
}

/**
 * Full pipeline: generate text + MP3 + upload to Supabase.
 * @param {string} titre
 * @param {string} [categorie]
 * @param {string} [type]
 * @param {string} [matiere]
 * @param {string} [serie]
 * @param {string} [voiceId]
 * @returns {Promise<{text: string, url: string}>}
 */
export async function generateAndUploadAudio(titre, categorie = '', type = 'guide', matiere = '', serie = '', voiceId = DEFAULT_VOICE) {
  const text = await generateSummaryText(titre, categorie, type, matiere, serie)
  const blob = await generateMP3(text, voiceId)
  const url = await uploadAudioSummary(titre, blob)
  return { text, url }
}

/**
 * Save audio blob locally (triggers browser download).
 * @param {Blob} blob
 * @param {string} filename
 */
export function saveAudioLocally(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.mp3') ? filename : filename + '.mp3'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

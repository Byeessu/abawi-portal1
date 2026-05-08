/**
 * autoAudio.js — Client-side audio generation helper
 * Generates TTS audio via Groq (text) + ElevenLabs (speech)
 * and returns a blob URL for immediate playback.
 */

import { requestElevenLabsTTS } from './elevenlabsClient'
import { groqChatCompletion } from './groqClient'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa'

/**
 * Generate a short audio summary/intro and return a playable blob URL.
 * @param {string} titre
 * @param {'guide'|'fascicule'} type
 * @returns {Promise<string>} blob URL
 */
export async function generateAudioBlob(titre, type = 'guide') {
  const prompt = type === 'fascicule'
    ? `Génère une courte introduction audio de 120 mots maximum pour le fascicule scolaire "${titre}". Explique ce que l'élève va apprendre et comment ce fascicule l'aidera à réussir son BAC. Ton encourageant. Termine par "Bonne révision avec ABAWI Academy !" Ne te présente jamais. Français impeccable. Réponds uniquement avec le texte.`
    : `Génère un résumé audio captivant de 180 mots maximum pour le guide "${titre}". Présente les 3 points essentiels. Donne envie d'acheter sans tout révéler. Termine par "Retrouvez toutes les stratégies dans le guide complet." Ne te présente jamais. Français impeccable. Réponds uniquement avec le texte.`

  // Step 1: text via Groq
  const groqData = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: 350,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  const text = groqData.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq returned empty text')

  // Step 2: speech via ElevenLabs Charlotte
  const blob = await requestElevenLabsTTS({
    voiceId: VOICE_CHARLOTTE,
    text,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: { stability: 0.55, similarity_boost: 0.80, style: 0.45, use_speaker_boost: true },
    speed: 1.08,
  })
  const buffer = await blob.arrayBuffer()
  const audioBlob = new Blob([buffer], { type: 'audio/mpeg' })
  return URL.createObjectURL(audioBlob)
}

/**
 * Check if a static MP3 exists via HEAD request.
 * @param {string} url  e.g. /files/summaries/mindset-entrepreneur.mp3
 * @returns {Promise<boolean>}
 */
export async function checkAudioExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

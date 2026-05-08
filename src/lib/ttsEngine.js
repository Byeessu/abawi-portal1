import { supabase } from './supabase'
import { requestElevenLabsTTS } from './elevenlabsClient'
import { requestAzureTTS } from './azureTtsClient'
import { groqChatCompletion } from './groqClient'
import { AZURE_VOICE_BY_KEY } from '../data/voices'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const ELEVENLABS_ENV_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''
// Voix ElevenLabs privilégiant l'accent français
const VOICES = {
  charlotte: { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte — Femme professionnelle (FR)' },
  bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella — Femme douce (FR)' },
  dorothy: { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy — Voix claire (FR)' },
}
const GUIDE_VOICE = 'charlotte' // Résumés guides : accent français
const PODCAST_VOICE = 'bella'   // Podcasts / bienvenue : accent français
const MODEL_ID = 'eleven_multilingual_v2'
const VOICE_SETTINGS = { stability: 0.40, similarity_boost: 0.82, style: 0.70, use_speaker_boost: true }
const VOICE_SPEED = 1.15
let activeAudio = null
let activeAudioUrl = ''

export function getVoiceId(type) {
  if (type === 'podcast') return VOICES[getTTSSettings().podcastVoice || PODCAST_VOICE]?.id || VOICES.bella.id
  if (type === 'guide') return VOICES[getTTSSettings().guideVoice || GUIDE_VOICE]?.id || VOICES.charlotte.id
  const v = getTTSSettings().voiceKey || GUIDE_VOICE
  return VOICES[v]?.id || VOICES.charlotte.id
}

/** `elevenlabs` (défaut) ou `azure` (Microsoft Speech, via proxy Netlify) */
export function getTtsProvider() {
  const p = getTTSSettings().ttsProvider
  return p === 'azure' ? 'azure' : 'elevenlabs'
}

function getAzureVoiceName(voiceType) {
  const s = getTTSSettings()
  let key = GUIDE_VOICE
  if (voiceType === 'podcast') key = s.podcastVoice || PODCAST_VOICE
  else if (voiceType === 'guide') key = s.guideVoice || GUIDE_VOICE
  else key = s.voiceKey || GUIDE_VOICE
  return AZURE_VOICE_BY_KEY[key] || AZURE_VOICE_BY_KEY.charlotte
}
export { VOICES }

// ===== Settings =====
export function getTTSSettings() {
  try { return JSON.parse(localStorage.getItem('abawi_tts') || '{}') } catch { return {} }
}
export function saveTTSSettings(s) { localStorage.setItem('abawi_tts', JSON.stringify(s)) }

export function getElevenLabsKey() {
  return getTTSSettings().elevenLabsKey || ELEVENLABS_ENV_KEY || localStorage.getItem('abawi-elevenlabs-key') || ''
}

export function getCreditsUsed() {
  const s = getTTSSettings()
  const month = new Date().toISOString().slice(0, 7)
  return (s.creditsMonth === month) ? (s.creditsUsed || 0) : 0
}

function addCredits(chars) {
  const s = getTTSSettings()
  const month = new Date().toISOString().slice(0, 7)
  if (s.creditsMonth !== month) { s.creditsUsed = 0; s.creditsMonth = month }
  s.creditsUsed = (s.creditsUsed || 0) + chars
  saveTTSSettings(s)
}

export function isQuotaExhausted() { return getCreditsUsed() >= 100000 }

// ===== Ding sound between chapters =====
export function playDing() {
  return new Promise((resolve) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.3)
      setTimeout(resolve, 400)
    } catch { resolve() }
  })
}

// ===== Cache =====
async function getCachedAudio(productId, chapterIdx) {
  try {
    const { data } = await supabase.from('audio_cache')
      .select('audio_base64')
      .eq('product_id', productId)
      .eq('chapter_idx', chapterIdx)
      .maybeSingle()
    return data?.audio_base64 || null
  } catch { return null }
}

async function setCachedAudio(productId, chapterIdx, base64, chars) {
  try {
    await supabase.from('audio_cache').insert({
      product_id: productId, chapter_idx: chapterIdx,
      audio_base64: base64, caracteres: chars
    })
  } catch (e) { console.log('[TTS] Cache save failed:', e.message) }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(b64) {
  const parts = b64.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'audio/mpeg'
  const bytes = atob(parts[1])
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ===== ElevenLabs TTS =====
async function callElevenLabs(text, voiceType) {
  const key = getElevenLabsKey()
  if (isQuotaExhausted()) throw new Error('QUOTA_EXHAUSTED')
  let blob
  try {
    blob = await requestElevenLabsTTS({
      voiceId: getVoiceId(voiceType),
      text,
      modelId: MODEL_ID,
      voiceSettings: VOICE_SETTINGS,
      speed: VOICE_SPEED,
    }, key)
  } catch (e) {
    throw new Error(e.message || 'NO_KEY')
  }
  addCredits(text.length)
  return blob
}

async function callAzureTTS(text, voiceType) {
  try {
    return await requestAzureTTS({
      text,
      voiceName: getAzureVoiceName(voiceType),
    })
  } catch (e) {
    throw new Error(e.message || 'AZURE_ERROR')
  }
}

function playBlob(blob) {
  return new Promise((resolve, reject) => {
    if (activeAudio) {
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      try { activeAudio.pause() } catch {}
    }
    if (activeAudioUrl) {
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      try { URL.revokeObjectURL(activeAudioUrl) } catch {}
      activeAudioUrl = ''
    }
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    activeAudio = audio
    activeAudioUrl = url
    // Amplify with GainNode
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaElementSource(audio)
      const gain = ctx.createGain()
      gain.gain.value = 1.6
      source.connect(gain)
      gain.connect(ctx.destination)
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null
      if (activeAudioUrl === url) activeAudioUrl = ''
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      if (activeAudio === audio) activeAudio = null
      if (activeAudioUrl === url) activeAudioUrl = ''
      URL.revokeObjectURL(url)
      reject(new Error('playback'))
    }
    audio.play().catch(reject)
  })
}

// ===== Main speak function with cache =====
export async function speak(text, productId, chapterIdx, onProgress, voiceType) {
  // Strip markers
  const clean = text.replace(/\[PAUSE\]/g, '... ').replace(/\[EMPHASE\]/g, '').replace(/\[\/EMPHASE\]/g, '').trim()
  if (!clean) return

  // Check cache first
  const cacheKey = productId || clean.substring(0, 50)
  const cached = await getCachedAudio(cacheKey, chapterIdx || 0)
  if (cached) {
    console.log('[TTS] Playing from cache')
    if (onProgress) onProgress('playing')
    const blob = base64ToBlob(cached)
    await playBlob(blob)
    if (onProgress) onProgress('done')
    return
  }

  const provider = getTtsProvider()
  if (provider === 'elevenlabs') {
    const key = getElevenLabsKey()
    if (!key) { if (onProgress) onProgress('no_key'); return }
    if (isQuotaExhausted()) { if (onProgress) onProgress('quota'); return }
  }

  const chunkLimit = provider === 'azure' ? 1500 : 400
  const chunks = []
  let remaining = clean
  while (remaining.length > 0) {
    let end = Math.min(remaining.length, chunkLimit)
    if (end < remaining.length) {
      const lastDot = remaining.lastIndexOf('.', end)
      const minChunk = provider === 'azure' ? 400 : 200
      if (lastDot > minChunk) end = lastDot + 1
    }
    chunks.push(remaining.substring(0, end).trim())
    remaining = remaining.substring(end).trim()
  }

  if (onProgress) onProgress('generating')

  // Generate audio for each chunk, combine
  const audioBlobs = []
  for (let i = 0; i < chunks.length; i++) {
    try {
      const blob =
        provider === 'azure'
          ? await callAzureTTS(chunks[i], voiceType)
          : await callElevenLabs(chunks[i], voiceType)
      audioBlobs.push(blob)
      if (onProgress) onProgress('chunk', i + 1, chunks.length)
    } catch (e) {
      console.error('[TTS] error on chunk', i, ':', e.message)
      if (e.message === 'QUOTA_EXHAUSTED') { if (onProgress) onProgress('quota'); return }
      if (
        e.message === 'INVALID_KEY' ||
        e.message === 'NO_KEY' ||
        e.message === 'AZURE_INVALID_KEY' ||
        String(e.message).includes('HTTP_')
      ) {
        if (onProgress) onProgress('no_key')
        return
      }
    }
  }

  if (audioBlobs.length === 0) { if (onProgress) onProgress('error'); return }

  // Combine blobs
  const combined = new Blob(audioBlobs, { type: 'audio/mpeg' })

  // Cache the result
  const b64 = await blobToBase64(combined)
  await setCachedAudio(cacheKey, chapterIdx || 0, b64, clean.length)

  // Play
  if (onProgress) onProgress('playing')
  await playBlob(combined)
  if (onProgress) onProgress('done')
}

export function stopSpeaking() {
  try {
    if (activeAudio) {
      activeAudio.pause()
      activeAudio.currentTime = 0
      activeAudio.src = ''
      activeAudio.load()
      activeAudio = null
    }
    if (activeAudioUrl) {
      URL.revokeObjectURL(activeAudioUrl)
      activeAudioUrl = ''
    }
  } catch {
    // no-op
  }
}

// ===== Groq narration generation =====
const NARRATION_RULES = `RÈGLES ABSOLUES :
- Ne te présente JAMAIS. Ne dis JAMAIS "Je m'appelle", "Bonjour je suis", "Je suis ravi". Va droit au contenu.
- Commence par "Ce guide vous donne les clés pour..." ou "Voici comment maîtriser..."
- Présente le contenu concret : stratégies clés, outils pratiques, ce que le lecteur va apprendre.
- Le texte doit être dynamique et rythmé. Phrases courtes. Pas de longueurs. Alterne entre phrases percutantes et explications. Le lecteur doit rester accroché du début à la fin.
- Maximum 600 mots par chapitre.
- Insère [PAUSE] pour les pauses naturelles et [EMPHASE]texte[/EMPHASE] pour insister.
- Réponds en français avec tous les accents corrects (é, è, ê, à, â, ù, ô, ç, î, ï).
- Pour les fascicules scolaires : parle aux élèves ET étudiants, pas seulement aux bacheliers.`

export async function generateChapters(titre, categorie, pdfContent) {
  const hasReal = pdfContent && pdfContent.hasRealContent
  const sourceText = hasReal ? pdfContent.content.substring(0, 10000) : ''

  const prompt = hasReal
    ? `Tu es un expert formateur africain. Génère un RÉSUMÉ AUDIO CAPTIVANT de ce guide en MAXIMUM 300 mots total, en 2 chapitres seulement.

${NARRATION_RULES}

CONTENU SOURCE :
${sourceText.substring(0, 4000)}

Présente les 3-4 points essentiels. Donne envie d'acheter SANS tout révéler. Termine par : "Retrouvez toutes les stratégies détaillées dans le guide complet."

JSON strict :
{"chapters":[{"title":"Ce que vous allez découvrir","text":"200 mots max..."},{"title":"Pourquoi ce guide est pour vous","text":"100 mots max, termine par la phrase d'accroche finale"}]}`
    : `Tu es un expert formateur africain. Génère un RÉSUMÉ AUDIO CAPTIVANT du guide "${titre}" (${categorie}) en MAXIMUM 300 mots total, en 2 chapitres.

${NARRATION_RULES}

Présente les 3-4 points essentiels. Donne envie d'acheter sans tout révéler. Termine par : "Retrouvez toutes les stratégies détaillées dans le guide complet."

JSON strict :
{"chapters":[{"title":"Ce que vous allez découvrir","text":"200 mots max..."},{"title":"Pourquoi ce guide est pour vous","text":"100 mots max..."}]}`

  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: hasReal ? 3000 : 2000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean).chapters || []
}

export async function generateVideoSlides(titre, categorie, pdfContent) {
  const hasReal = pdfContent && pdfContent.hasRealContent
  const sourceText = hasReal ? pdfContent.content.substring(0, 8000) : ''

  const prompt = hasReal
    ? `Voici le contenu RÉEL du guide "${titre}" (${categorie}). Crée un script vidéo de 8 slides avec les VRAIES informations. Ne te présente jamais. Va droit au contenu. Réponds en français avec accents corrects.

CONTENU SOURCE :
${sourceText}

JSON strict : [{"slide":1,"titre":"...","points":["vrai point 1","vrai point 2","vrai point 3"],"citation":"phrase clé du guide","narration":"2 phrases directes"}]`
    : `Crée un script vidéo de 5 slides pour le guide "${titre}" (${categorie}). Ne te présente jamais. Réponds en français avec accents. JSON : [{"slide":1,"titre":"...","points":["...","...","..."],"narration":"2 phrases directes"}]`

  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: hasReal ? 2000 : 800,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean)
}

// ===== Test voice =====
export async function testVoice() {
  const text = 'Bienvenue sur ABAWI Digital. Le savoir qui transforme l\'Afrique.'
  try {
    const blob = await callElevenLabs(text)
    await playBlob(blob)
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ===== For admin: get available voices (not needed anymore but keep for compat) =====
export function getAvailableFrenchVoices() { return [] }
export function getBestFrenchVoice() { return null }

import { useState } from 'react'
import { useAudio } from '../context/AudioContext'
import { useAuth } from '../context/AuthContext'
import { formatPrix, waLink, slugify } from '../data/products'
import { ELEVENLABS_VOICES, VOICE_SETTINGS_PRESETS, DEFAULT_VOICE_BY_TYPE, DEFAULT_PRESET_BY_TYPE } from '../data/voices'
import { resolveFirstPlayable } from '../lib/mediaResolver'
import { requestElevenLabsTTS } from '../lib/elevenlabsClient'
import { groqChatCompletion } from '../lib/groqClient'
import { toUserFriendlyAIError } from '../lib/aiErrorMessages'
import { canDownload } from '../lib/freeContentQuota'
import './PDFAudioReader.css'
import { CoverImage } from './CoverImage'
import VoiceSelector from './VoiceSelector'
import Equalizer from './Equalizer'
import { Link } from 'react-router-dom'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

async function generateTextGroq(titre, type) {
  const prompt = type === 'fascicule'
    ? `Génère une courte introduction audio de 120 mots maximum pour le fascicule scolaire "${titre}". Explique ce que l'élève va apprendre et comment ce fascicule l'aidera à réussir son BAC. Ton encourageant. Termine par "Bonne révision avec ABAWI Academy !" Ne te présente jamais. Français impeccable. Réponds uniquement avec le texte.`
    : `Génère un résumé audio captivant de 180 mots maximum pour le guide "${titre}". Présente les 3 points essentiels. Donne envie d'acheter sans tout révéler. Termine par "Retrouvez toutes les stratégies dans le guide complet." Ne te présente jamais. Français impeccable. Réponds uniquement avec le texte du résumé.`

  console.log(`[PDFAudioReader] Groq — requête pour "${titre}" (type: ${type})`)

  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: 350,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  console.log('[PDFAudioReader] Groq réponse:', data)

  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) {
    console.error('[PDFAudioReader] Groq texte vide:', data)
    throw new Error('Groq a retourné un texte vide')
  }

  console.log(`[PDFAudioReader] Groq texte généré (${text.length} chars):`, text.substring(0, 80) + '...')
  return text
}

async function generateMP3Blob(text, voiceId, presetKey) {
  const preset = VOICE_SETTINGS_PRESETS[presetKey] || VOICE_SETTINGS_PRESETS.professionnelle
  console.log(`[PDFAudioReader] ElevenLabs — voix ${voiceId}, preset ${presetKey}`)
  const blob = await requestElevenLabsTTS({
    voiceId,
    text,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: preset.settings,
  })
  const buffer = await blob.arrayBuffer()
  console.log(`[PDFAudioReader] ElevenLabs blob reçu: ${buffer.byteLength} octets`)

  if (buffer.byteLength < 5000) {
    throw new Error(`Audio trop petit (${buffer.byteLength} octets) — probablement vide`)
  }

  return new Blob([buffer], { type: 'audio/mpeg' })
}

export default function PDFAudioReader({ type = 'guide', titre, categorie, brand, serie, matiere, productId, fileUrl, prix, onClose }) {
  const auth = useAuth()
  const audio = useAudio()
  const isMember = auth?.membre?.isActive

  const defaultVoice = DEFAULT_VOICE_BY_TYPE[type] || DEFAULT_VOICE_BY_TYPE.default
  const defaultPreset = DEFAULT_PRESET_BY_TYPE[type] || DEFAULT_PRESET_BY_TYPE.default

  const [status, setStatus] = useState('idle') // idle | loading | playing | error
  const [generating, setGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedVoice, setSelectedVoice] = useState(defaultVoice)
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)

  const slug = slugify(titre)
  const mp3Src = type === 'fascicule'
    ? `/files/fascicules-audio/${slug}.mp3`
    : `/files/summaries/${slug}.mp3`

  const selectedVoiceName = ELEVENLABS_VOICES.find(v => v.id === selectedVoice)?.name || 'Charlotte'
  const allowFeature = canDownload(auth?.membre, auth?.isAdmin)

  if (!onClose) return null

  async function handlePlay() {
    setStatus('loading')
    setErrorMsg('')

    // 1. Try static MP3 first
    try {
      const staticSrc = await resolveFirstPlayable([
        mp3Src,
        type === 'fascicule' ? `/files/fascicules-audio/${slug}.mp3` : `/files/resumes/${slug}.mp3`,
      ])
      if (staticSrc) {
        await audio.play({
          id: productId || slug,
          titre: type === 'fascicule' ? `Intro : ${titre}` : `Résumé : ${titre}`,
          serie: type === 'fascicule' ? 'Academy' : 'Résumé',
          src: staticSrc,
        })
        setStatus('playing')
        return
      }
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch { /* ignore */ }

    // 2. Generate on-the-fly
    if (!GROQ_KEY) {
      setErrorMsg('Clé Groq manquante: configure VITE_GROQ_API_KEY.')
      setStatus('error')
      return
    }
    setGenerating(true)
    try {
      const text = await generateTextGroq(titre, type)
      const blob = await generateMP3Blob(text, selectedVoice, selectedPreset)
      const blobUrl = URL.createObjectURL(blob)
      await audio.play({
        id: productId || slug,
        titre: type === 'fascicule' ? `Intro : ${titre}` : `Résumé : ${titre}`,
        serie: type === 'fascicule' ? 'Academy' : 'Résumé',
        src: blobUrl,
      })
      setStatus('playing')
    } catch (e) {
      console.error('[PDFAudioReader] Échec génération:', e)
      setErrorMsg(toUserFriendlyAIError(e, 'Erreur inconnue lors de la génération audio'))
      setStatus('error')
    }
    setGenerating(false)
  }

  const trackId = productId || slug
  const isPlaying = audio.track?.id === trackId && audio.playing
  const isDone = audio.track?.id === trackId && !audio.playing && audio.current > 0 && audio.current >= audio.duration - 0.5

  const badgeLabel = type === 'fascicule' ? '🎧 Intro audio' : '🎧 Résumé audio'

  return (
    <div className="par-overlay" onClick={onClose}>
      <div className="par-modal" onClick={(e) => e.stopPropagation()}>
        <div className="par-header">
          <span className="par-badge">{badgeLabel}</span>
          <span className="par-title">{titre}</span>
          <button className="par-close" onClick={onClose}>&times;</button>
        </div>

        <div className="par-body">
          <div className="par-cover">
            <CoverImage titre={titre} categorie={categorie} type={type} brand={brand || 'digital'} serie={serie} matiere={matiere} size="md" />
          </div>

          <div className="par-content">
            {!allowFeature && (
              <div className="par-start" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>Fonction réservée aux membres ABAWI+</p>
                <p style={{ fontSize: '0.85rem', color: '#8B95A5', marginBottom: 16 }}>
                  Les résumés audio intelligents sont inclus dans ABAWI+. Les utilisateurs gratuits peuvent consulter le contenu directement.
                </p>
                <Link to="/plans" className="par-gen-btn" onClick={onClose}>
                  Découvrir ABAWI+
                </Link>
              </div>
            )}
            {allowFeature && status === 'idle' && (
              <div className="par-start">
                <p>{type === 'fascicule' ? 'Écoutez l\'introduction audio de ce fascicule — 1 minute.' : 'Écoutez le résumé audio de ce guide — 1 à 2 minutes.'}</p>

                {/* Voice selector toggle */}
                <button
                  onClick={() => setShowVoiceSelector(s => !s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 10, marginBottom: 12,
                    background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)',
                    color: '#F0B429', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  🎙️ Voix : {selectedVoiceName} · {VOICE_SETTINGS_PRESETS[selectedPreset]?.icon} {VOICE_SETTINGS_PRESETS[selectedPreset]?.label}
                  <span style={{ marginLeft: 4, opacity: 0.7 }}>{showVoiceSelector ? '▲' : '▼'}</span>
                </button>

                {showVoiceSelector && (
                  <div style={{
                    background: '#070B0F', border: '1px solid #1A2332', borderRadius: 12,
                    padding: '16px', marginBottom: 12, maxHeight: 320, overflowY: 'auto',
                  }}>
                    <VoiceSelector
                      selectedVoice={selectedVoice}
                      selectedPreset={selectedPreset}
                      onVoiceChange={(v) => { setSelectedVoice(v); setShowVoiceSelector(false) }}
                      onPresetChange={setSelectedPreset}
                      compact
                    />
                  </div>
                )}

                <button className="par-gen-btn" onClick={handlePlay}>
                  ▶ {type === 'fascicule' ? "Écouter l'intro" : 'Écouter le résumé'}
                </button>
              </div>
            )}

            {status === 'loading' && (
              <div className="par-start">
                {generating
                  ? <p className="par-generating">⚡ Génération audio en cours…</p>
                  : <p className="par-generating">⏳ Chargement…</p>
                }
                <div className="par-spinner" />
              </div>
            )}

            {status === 'error' && (
              <div className="par-start">
                <div style={{
                  padding: '12px 16px', borderRadius: 10, marginBottom: 12,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', fontSize: '0.82rem', lineHeight: 1.5,
                }}>
                  ❌ {errorMsg}
                </div>
                <button className="par-gen-btn" onClick={handlePlay} style={{ background: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', color: '#ef4444' }}>
                  🔄 Réessayer
                </button>
              </div>
            )}

            {(status === 'playing' || isPlaying) && (
              <div className="par-playing">
                <Equalizer size="lg" />
                <div className="par-play-controls">
                  <button
                    className="par-ctrl-play"
                    onClick={() => audio.playing ? audio.pause() : audio.play(audio.track)}
                  >
                    {audio.playing ? '⏸' : '▶'}
                  </button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {Math.floor(audio.current / 60)}:{String(Math.floor(audio.current % 60)).padStart(2, '0')}
                    {' / '}
                    {Math.floor(audio.duration / 60)}:{String(Math.floor(audio.duration % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {isDone && (
              <div className="par-done-cta">
                <div className="par-done-info">
                  <h4>{type === 'fascicule' ? '📚' : '📖'} {titre}</h4>
                  {prix && <span className="par-done-prix">{formatPrix(prix)}</span>}
                </div>
                <div className="par-done-btns">
                  {isMember ? (
                    <a href={fileUrl || '#'} className="par-done-buy">
                      {type === 'fascicule' ? 'Télécharger le fascicule' : 'Lire le guide complet'}
                    </a>
                  ) : (
                    <a href={waLink(titre, prix)} target="_blank" rel="noopener noreferrer" className="par-done-buy">
                      Commander — {prix ? formatPrix(prix) : 'WhatsApp'}
                    </a>
                  )}
                  <button className="par-done-replay" onClick={() => setStatus('idle')}>Réécouter</button>
                </div>
                {type !== 'fascicule' && (
                  <Link to="/plans" className="par-done-plus">
                    Accédez à 70+ guides avec ABAWI+ →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

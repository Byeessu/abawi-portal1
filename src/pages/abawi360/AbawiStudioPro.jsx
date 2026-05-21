import { useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { cleanIAText } from '../../lib/cleanText'
import { ELEVENLABS_VOICES, VOICE_SETTINGS_PRESETS } from '../../data/voices'
import { groqChatCompletion } from '../../lib/groqClient'
import { requestElevenLabsTTS } from '../../lib/elevenlabsClient'
import { REPLICATE_MODELS, generateImage, pollPrediction } from '../../lib/replicateClient'
import { resolveRuntimeApiKey } from '../../lib/runtimeApiKeys'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

function getGroqKey() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_GROQ_API_KEY, import.meta.env.VITE_GROK_LLAMA_API_KEY],
    providerId: 'groq',
    includeAlias: true,
  })
}

function getElevenLabsKey() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_ELEVENLABS_API_KEY, import.meta.env.VITE_ELEVEN_KEY],
    providerId: 'elevenlabs',
    includeAlias: true,
  })
}

function getReplicateToken() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_REPLICATE_API_TOKEN, import.meta.env.VITE_REPLICATE_API_KEY],
    providerId: 'replicate',
    includeAlias: true,
  })
}

export default function AbawiStudioPro() {
  const [script, setScript] = useState('')
  const [voice, setVoice] = useState(ELEVENLABS_VOICES[0]?.id || '')
  const [preset, setPreset] = useState('professionnelle')
  const [style, setStyle] = useState('Podcast business motivant')
  const [musicMood, setMusicMood] = useState('Afro chill premium')
  const [mastering, setMastering] = useState(true)
  const [amplified, setAmplified] = useState(true)
  const [dolbyLike, setDolbyLike] = useState(false)
  const [status, setStatus] = useState('')
  const [transcript, setTranscript] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('idle')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_studio_history') || '[]') } catch { return [] }
  })
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState('')
  const [scriptMode, setScriptMode] = useState('complet')
  const [editInstruction, setEditInstruction] = useState('')
  const [audioSpeed, setAudioSpeed] = useState(1)
  const audioRef = useRef(null)

  // États pour Replicate (génération d'images)
  const [activeTab, setActiveTab] = useState('audio')
  const [imagePrompt, setImagePrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState(REPLICATE_MODELS[0]?.id || '')
  const [imageWidth, setImageWidth] = useState(1024)
  const [imageHeight, setImageHeight] = useState(1024)
  const [generatedImages, setGeneratedImages] = useState([])
  const [imageHistory, setImageHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_image_history') || '[]') } catch { return [] }
  })
  const [imageLoading, setImageLoading] = useState(false)
  const [imageProgress, setImageProgress] = useState('')

  const canGenerate = useMemo(() => script.trim().length > 20, [script])
  const canGenerateImage = useMemo(() => imagePrompt.trim().length > 5, [imagePrompt])

  async function transcribeAudio() {
    if (!audioFile) return
    const groqKey = getGroqKey()
    if (!groqKey) {
      setStatus("Clé GROQ manquante. Ajoute VITE_GROQ_API_KEY dans l'environnement.")
      return
    }
    setLoading(true)
    setStep('transcription')
    setStatus('Transcription en cours...')
    try {
      const body = new FormData()
      body.append('file', audioFile)
      body.append('model', 'whisper-large-v3-turbo')
      body.append('response_format', 'json')
      body.append('language', 'fr')
      const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}` },
        body,
      })
      const responseText = await res.text().catch(() => '')
      if (!res.ok) {
        throw new Error(`Erreur transcription (${res.status}): ${responseText.slice(0, 120)}`)
      }
      let data
      try { data = JSON.parse(responseText) } catch { throw new Error('Réponse non-JSON du serveur de transcription') }
      const text = cleanIAText(data?.text || '')
      setTranscript(text)
      if (!script.trim()) setScript(text)
      setStatus('Transcription terminee.')
      await saveJob('transcription', { sourceFile: audioFile.name, transcript: text })
    } catch (e) {
      setStatus(`Transcription indisponible: ${e.message}`)
    } finally {
      setLoading(false)
      setStep('idle')
    }
  }

  function readPreview() {
    if (!script.trim()) return
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(script.slice(0, 900))
    utterance.lang = 'fr-FR'
    utterance.rate = amplified ? 1.02 : 1
    utterance.pitch = dolbyLike ? 1.06 : 1
    synth.cancel()
    synth.speak(utterance)
    setStatus('Lecture preview lancee (TTS navigateur de secours).')
  }

  async function generateVoiceFromScript() {
    if (!script.trim()) return
    const elevenLabsKey = getElevenLabsKey()
    if (!elevenLabsKey) {
      setStatus("Cle ElevenLabs absente. Ajoute VITE_ELEVENLABS_API_KEY dans l'environnement.")
      return
    }
    setLoading(true)
    setStep('generation')
    setStatus('Generation audio ElevenLabs en cours...')
    try {
      const settings = VOICE_SETTINGS_PRESETS[preset]?.settings || VOICE_SETTINGS_PRESETS.professionnelle.settings
      const blob = await requestElevenLabsTTS({
        voiceId: voice,
        text: script.slice(0, 4500),
        modelId: 'eleven_multilingual_v2',
        voiceSettings: settings,
      }, elevenLabsKey)
      const url = URL.createObjectURL(blob)
      setGeneratedAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setStatus('Audio genere. Tu peux ecouter, telecharger et retoucher le texte.')
      await saveJob('tts', { voice, preset, chars: script.length })
    } catch (e) {
      setStatus(`Generation audio impossible: ${e.message}`)
    } finally {
      setLoading(false)
      setStep('idle')
    }
  }

  async function generateScript() {
    const groqKey = getGroqKey()
    if (!groqKey) {
      setStatus("Clé GROQ manquante. Ajoute VITE_GROQ_API_KEY dans l'environnement.")
      return
    }
    setLoading(true)
    setStep('generation')
    setStatus('Generation du script studio...')
    try {
      const modeInstruction = scriptMode === 'court'
        ? 'Rends le script tres concis (60-90 secondes de lecture).'
        : scriptMode === 'long'
          ? 'Rends le script detaille (5-8 minutes de lecture).'
          : 'Rends le script complet et equilibre (2-4 minutes de lecture).'
      const prompt = `Ecris un script de podcast pro en francais.
Style: ${style}
Musique: ${musicMood}
Mastering: ${mastering ? 'Oui' : 'Non'}
Amplifie: ${amplified ? 'Oui' : 'Non'}
Effet Dolby-like: ${dolbyLike ? 'Oui' : 'Non'}
Mode: ${scriptMode}

Contenu source:
${script}

Donne un format:
1) Hook d ouverture
2) Corps principal en sections
3) Outro + appel a l action
4) Notes de montage (musique, transitions, voix).

Contraintes:
- Ecriture naturelle et pro, sans symboles decoratifs.
- Pas de markdown, pas d'asterisques, pas de guillemets parasites.
- ${modeInstruction}`
      const data = await groqChatCompletion({
        model: GROQ_MODEL,
        temperature: 0.25,
        max_tokens: 2200,
        messages: [
          { role: 'system', content: 'Tu es un realisateur audio/video expert pour podcasts business premium.' },
          { role: 'user', content: prompt },
        ],
      }, groqKey)
      const out = cleanIAText(data?.choices?.[0]?.message?.content || '')
      setScript(out)
      setStatus('Script studio genere. Tu peux lancer une lecture preview.')
      await saveJob('generation', {
        voice, style, musicMood, mastering, amplified, dolbyLike, scriptMode,
        output: out,
      })
    } catch (e) {
      setStatus(`Generation impossible: ${e.message}`)
    } finally {
      setLoading(false)
      setStep('idle')
    }
  }

  async function refineScript() {
    if (!script.trim() || !editInstruction.trim()) return
    const groqKey = getGroqKey()
    if (!groqKey) {
      setStatus("Clé GROQ manquante. Ajoute VITE_GROQ_API_KEY dans l'environnement.")
      return
    }
    setLoading(true)
    setStep('generation')
    setStatus('Retouche IA en cours...')
    try {
      const prompt = `Ameliore ce script selon l'instruction.

Instruction:
${editInstruction}

Script original:
${script}

Rends uniquement la version finale, claire, professionnelle, sans markdown ni symboles inutiles.`
      const data = await groqChatCompletion({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 2200,
        messages: [
          { role: 'system', content: 'Tu es un editor studio exigeant et orienté impact.' },
          { role: 'user', content: prompt },
        ],
      }, groqKey)
      const out = cleanIAText(data?.choices?.[0]?.message?.content || '')
      setScript(out)
      setStatus('Script retouche avec succes.')
      await saveJob('refine', { instruction: editInstruction, output: out })
    } catch (e) {
      setStatus(`Retouche impossible: ${e.message}`)
    } finally {
      setLoading(false)
      setStep('idle')
    }
  }

  async function saveJob(type, payload) {
    const row = {
      tool: 'abawi-studio-pro',
      job_type: type,
      payload,
      created_at: new Date().toISOString(),
    }
    let savedToDb = false
    try {
      const { error } = await supabase.from('ai_jobs').insert(row)
      if (!error) savedToDb = true
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch { /* ignore */ }
    const localRow = { id: `${Date.now()}-${Math.random()}`, ...row, storage: savedToDb ? 'supabase' : 'local' }
    const next = [localRow, ...history].slice(0, 20)
    setHistory(next)
    localStorage.setItem('abawi_studio_history', JSON.stringify(next))
  }

  function downloadText() {
    if (!script.trim()) return
    const content = [
      'ABAWI STUDIO PRO - EXPORT SCRIPT',
      `Date: ${new Date().toLocaleString('fr-FR')}`,
      `Voix: ${voice}`,
      `Style: ${style}`,
      `Musique: ${musicMood}`,
      '',
      script,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `abawi-studio-script-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function generateImageWithReplicate() {
    if (!getReplicateToken()) {
      setStatus('❌ Clé API Replicate manquante. Ajoutez VITE_REPLICATE_API_TOKEN dans .env')
      setImageProgress('Erreur: Clé API manquante')
      return
    }
    if (!imagePrompt.trim()) {
      setStatus('❌ Veuillez entrer une description pour l\'image')
      return
    }

    setImageLoading(true)
    setImageProgress('🚀 Initialisation...')
    
    try {
      const prediction = await generateImage({
        prompt: imagePrompt,
        model: selectedModel,
        width: imageWidth,
        height: imageHeight,
        numOutputs: 1
      })

      setImageProgress('⏳ Génération en cours...')
      
      const result = await pollPrediction(prediction.id, (status, attempt) => {
        setImageProgress(`⏳ Génération en cours... (${attempt}/60) - ${status}`)
      })

      if (result.output && result.output.length > 0) {
        const imageUrls = result.output
        setGeneratedImages(imageUrls)
        
        // Sauvegarder dans l'historique
        const newEntry = {
          id: result.id,
          prompt: imagePrompt,
          model: selectedModel,
          images: imageUrls,
          created_at: new Date().toISOString()
        }
        const next = [newEntry, ...imageHistory].slice(0, 20)
        setImageHistory(next)
        localStorage.setItem('abawi_image_history', JSON.stringify(next))
        
        setStatus('✅ Images générées avec succès!')
        setImageProgress('✅ Terminé!')
      } else {
        throw new Error('Aucune image retournée par l\'API')
      }
    } catch (e) {
      setStatus('❌ Erreur: ' + e.message)
      setImageProgress('❌ Erreur: ' + e.message)
    }
    setImageLoading(false)
  }

  function downloadImage(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = `abawi-image-${Date.now()}.png`
    a.target = '_blank'
    a.click()
  }

  const tabBtn = (key, label, icon) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      style={{
        padding: '12px 20px',
        borderRadius: 8,
        border: 'none',
        background: activeTab === key ? 'var(--accent)' : 'transparent',
        color: activeTab === key ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  )

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }}>
      <section style={{ border: '1px solid var(--border)', borderRadius: 20, padding: 24, background: 'linear-gradient(135deg, rgba(20,184,166,0.14), var(--bg-card))' }}>
        <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.78rem', letterSpacing: 1.2 }}>ABAWI 360 / STUDIO PRO</div>
        <h1 style={{ color: 'var(--text-primary)', marginTop: 10 }}>ABAWI Studio Pro</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 780 }}>
          MVP operationnel: transcription audio vers texte, generation de script podcast, preview voix et options studio
          (mastering, amplification, ambiance, effet dolby-like).
        </p>
        
        {/* Navigation par onglets */}
        <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {tabBtn('audio', 'Audio Studio', '🎙️')}
          {tabBtn('images', 'Génération Images', '🎨')}
        </div>
        
        {activeTab === 'audio' && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
          {[
            ['idle', '1) Préparer'],
            ['transcription', '2) Transcription'],
            ['generation', '3) Script IA'],
            ['export', '4) Export'],
          ].map(([id, label]) => (
            <span key={id} style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', border: `1px solid ${step === id ? 'var(--accent)' : 'var(--border)'}`, color: step === id ? 'var(--accent)' : 'var(--text-secondary)', background: step === id ? 'var(--gold-glow)' : 'rgba(255,255,255,0.02)' }}>
              {label}
            </span>
          ))}
        </div>

        <section style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--bg-card)' }}>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Script / contenu source</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={14}
            placeholder="Colle ton texte, ton brief, ou la transcription d un audio..."
            style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 12, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={generateScript} disabled={!canGenerate || loading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer' }}>Generer script studio</button>
            <button onClick={readPreview} disabled={!canGenerate} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--accent3), var(--accent3)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer' }}>Preview local</button>
            <button onClick={generateVoiceFromScript} disabled={!canGenerate || loading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--accent2), var(--accent2)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer' }}>Generer audio ElevenLabs</button>
            <button onClick={() => { setStep('export'); downloadText(); setTimeout(() => setStep('idle'), 500) }} disabled={!canGenerate} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer' }}>Exporter TXT</button>
          </div>
          {generatedAudioUrl && (
            <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--bg-primary)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 8 }}>Sortie audio studio</div>
              <audio ref={audioRef} src={generatedAudioUrl} controls style={{ width: '100%' }} />
              <div style={{ marginTop: 10 }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: 4 }}>Vitesse lecture audio: x{audioSpeed.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={audioSpeed}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value)
                    setAudioSpeed(next)
                    if (audioRef.current) audioRef.current.playbackRate = next
                  }}
                  style={{ width: '100%' }}
                />
              </div>
              <a href={generatedAudioUrl} download={`abawi-studio-audio-${Date.now()}.mp3`} style={{ display: 'inline-block', marginTop: 10, color: 'var(--accent2)', fontWeight: 700, textDecoration: 'none' }}>
                Telecharger le rendu audio
              </a>
            </div>
          )}
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--bg-card)' }}>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Voix</label>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }}>
            {ELEVENLABS_VOICES.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
          </select>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Preset vocal</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }}>
            {Object.entries(VOICE_SETTINGS_PRESETS).map(([id, p]) => <option key={id} value={id}>{p.icon} {p.label}</option>)}
          </select>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Mode de script</label>
          <select value={scriptMode} onChange={(e) => setScriptMode(e.target.value)} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }}>
            <option value="court">Court (60-90 sec)</option>
            <option value="complet">Complet (2-4 min)</option>
            <option value="long">Long (5-8 min)</option>
          </select>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Style podcast</label>
          <input value={style} onChange={(e) => setStyle(e.target.value)} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }} />
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Ambiance musicale</label>
          <input value={musicMood} onChange={(e) => setMusicMood(e.target.value)} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }} />
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <Toggle label="Masterise auto" value={mastering} onChange={setMastering} />
            <Toggle label="Amplification" value={amplified} onChange={setAmplified} />
            <Toggle label="Effet Dolby-like" value={dolbyLike} onChange={setDolbyLike} />
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Instruction de retouche IA</label>
            <input
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Ex: Raccourcir et rendre plus commercial pour WhatsApp"
              style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }}
            />
            <button onClick={refineScript} disabled={!script.trim() || !editInstruction.trim() || loading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--accent3), var(--accent3)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
              Retoucher le script
            </button>
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>Audio source a transcrire (mp3/wav/m4a)</label>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }} />
            <button onClick={transcribeAudio} disabled={!audioFile || loading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold)cc)', color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>Transcrire audio</button>
          </div>
        </div>
      </section>

      {transcript && (
        <section style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 16, padding: 14, background: 'var(--bg-card)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Transcription detectee</h3>
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{transcript}</p>
        </section>
      )}

      {status && <p style={{ marginTop: 14, color: 'var(--accent)', fontWeight: 600 }}>{status}</p>}

      {history.length > 0 && (
        <section style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'var(--bg-card)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: 10 }}>Historique Studio (20 derniers jobs)</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {history.map((h) => (
              <div key={h.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: 10, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                <span>{h.job_type} - {new Date(h.created_at).toLocaleString('fr-FR')}</span>
                <span style={{ color: h.storage === 'supabase' ? 'var(--green)' : 'var(--gold)', fontWeight: 700 }}>{h.storage}</span>
              </div>
            ))}
          </div>
        </section>
      )}
          </>
        )}

      {/* Onglet Génération d'Images */}
      {activeTab === 'images' && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 16 }}> Génération d'Images par IA</h2>
          
          {/* Configuration */}
          <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Modèle IA</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              >
                {REPLICATE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name} - {m.description}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Largeur (px)</label>
                <select
                  value={imageWidth}
                  onChange={(e) => setImageWidth(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                  <option value={1344}>1344px</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Hauteur (px)</label>
                <select
                  value={imageHeight}
                  onChange={(e) => setImageHeight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                  <option value={1344}>1344px</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>
              Description de l'image (prompt)
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Décrivez l'image que vous souhaitez générer... Ex: 'Un portrait professionnel d'un entrepreneur africain dans un bureau moderne, éclairage naturel, style photographique'"
              style={{
                width: '100%',
                minHeight: 100,
                padding: '12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Bouton générer */}
          <button
            onClick={generateImageWithReplicate}
            disabled={imageLoading || !canGenerateImage}
            style={{
              padding: '12px 24px',
              background: canGenerateImage ? 'var(--accent)' : 'var(--border)',
              color: canGenerateImage ? 'var(--text-on-accent)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: canGenerateImage ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {imageLoading ? ' Génération...' : ' Générer l\'image'}
          </button>

          {/* Progress */}
          {imageProgress && (
            <div style={{ marginTop: 12, color: 'var(--accent)', fontSize: '0.9rem' }}>
              {imageProgress}
            </div>
          )}

          {/* Résultats */}
          {generatedImages.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Images générées</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {generatedImages.map((url, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)' }}>
                    <img
                      src={url}
                      alt={`Généré ${idx + 1}`}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                    <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => downloadImage(url)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'var(--accent)',
                          color: 'var(--text-on-accent)',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Télécharger
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historique */}
          {imageHistory.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Historique des générations</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {imageHistory.slice(0, 5).map((entry) => (
                  <div key={entry.id} style={{ 
                    display: 'flex', 
                    gap: 12, 
                    padding: 12, 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 8,
                    alignItems: 'center'
                  }}>
                    <img
                      src={entry.images[0]}
                      alt="Preview"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>{entry.prompt.slice(0, 60)}...</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(entry.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadImage(entry.images[0])}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-primary)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Télécharger
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      </section>

      <ToolInfoPanel
        toolName="Studio Pro 360"
        icon="🎨"
        description="Outil de création de contenu multimédia : génération d'images, vidéos, audio et documents par IA"
        benefits={[
          'Génération d\'images par IA (DALL-E, Midjourney-like)',
          'Création de vidéos et animations',
          'Génération et édition audio',
          'Création de documents et présentations',
          'Bibliothèque de modèles prédéfinis',
          'Export dans tous les formats standards',
          'Éditeur intégré avec corrections IA',
          'Historique et organisation par projets',
        ]}
        howToUse={[
          'Choisissez le type de contenu à créer (image, vidéo, audio, document)',
          'Utilisez les modèles prédéfinis ou créez depuis zéro',
          'Décrivez ce que vous voulez générer avec l\'IA',
          'Personnalisez les paramètres (style, taille, format)',
          'Générez et modifiez jusqu\'à satisfaction',
          'Exportez dans le format souhaité',
          'Organisez vos créations dans des projets',
        ]}
        tips={[
          'Soyez précis dans vos descriptions pour de meilleurs résultats',
          'Utilisez les modèles comme point de départ',
          'L\'éditeur IA peut améliorer vos textes automatiquement',
          'Sauvegardez vos projets régulièrement',
          'Les créations peuvent être utilisées dans Marketing 360',
        ]}
      />
    </main>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`, background: value ? 'var(--gold-glow)' : 'var(--bg-primary)', color: value ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}>
      {value ? '✓' : '○'} {label}
    </button>
  )
}

const lbl = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 10, marginBottom: 6 }
const field = { width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px 11px' }
const btn = (color) => ({ padding: '10px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'var(--text-on-accent)', fontWeight: 700, cursor: 'pointer' })

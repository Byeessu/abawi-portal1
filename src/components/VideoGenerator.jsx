import { useState, useRef, useEffect, useCallback } from 'react'
import { generateVideoSlides } from '../lib/ttsEngine'
import { getContentForAI } from '../lib/pdfExtractor'
import './VideoGenerator.css'
const GRADS = {
  'Marketing Digital': ['#F0B429', '#B8860B'],
  'Business & Strategie': ['#1a3a5c', '#0D1117'],
  'Communication': ['#4A1A6B', '#1a1a2e'],
  'Tech & IA': ['#0a4a2e', '#070B0F'],
  default: ['#1a3a5c', '#070B0F'],
}

function getGrad(cat) { return GRADS[cat] || GRADS.default }

export function VideoGenerator({ titre, categorie, productId, fileUrl, onClose }) {
  const [status, setStatus] = useState('idle') // idle | generating | playing | error
  const [slides, setSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [voiceType, setVoiceType] = useState('standard')
  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const synthRef = useRef(null)

  const SLIDE_DURATION = 8000

  async function generate() {
    setStatus('generating'); setProgress(10)
    try {
      // Extract real PDF content if available
      let pdfContent = null
      try {
        if (fileUrl || productId) {
          pdfContent = await getContentForAI(productId || titre, fileUrl, titre, categorie)
        }
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
      setProgress(30)
      const parsed = await generateVideoSlides(titre, categorie, pdfContent)
      setSlides(Array.isArray(parsed) ? parsed : parsed.slides || parsed)
      setProgress(60)
      setStatus('playing')
      setCurrentSlide(0)
      setPlaying(true)
    } catch (e) {
      console.error('VideoGen error:', e)
      setStatus('error')
    }
  }

  // Draw slide on canvas
  const drawSlide = useCallback((idx) => {
    const c = canvasRef.current
    if (!c || !slides[idx]) return
    const ctx = c.getContext('2d')
    const [c1, c2] = getGrad(categorie)
    const w = c.width, h = c.height

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, c1); grad.addColorStop(1, c2)
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)

    // Dot pattern
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let x = 0; x < w; x += 20) for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill() }

    const s = slides[idx]

    // Slide number
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = 'bold 14px Outfit'; ctx.fillText(`${idx + 1} / ${slides.length}`, 30, 35)

    // Title
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Syne'; ctx.fillText(s.titre, 30, 80)

    // Points
    ctx.font = '16px Outfit'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
    s.points.forEach((p, i) => { ctx.fillText('• ' + p, 40, 130 + i * 36) })

    // ABAWI branding
    // Citation if available
    if (s.citation) {
      ctx.fillStyle = 'rgba(240,180,41,0.15)'; ctx.fillRect(30, 240, w - 60, 50); ctx.strokeStyle = '#F0B429'; ctx.lineWidth = 2; ctx.strokeRect(30, 240, 3, 50)
      ctx.fillStyle = '#F0B429'; ctx.font = 'italic 13px Outfit'; ctx.fillText('"' + s.citation.substring(0, 80) + '"', 44, 268)
    }
    ctx.fillStyle = '#18A84A'; ctx.font = 'bold 12px Syne'; ctx.fillText('ABAWI DIGITAL', 30, h - 25)

    // Narration text
    if (voiceType === 'standard' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(s.narration)
      u.lang = 'fr-FR'; u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }, [slides, categorie, voiceType])

  // Playback loop
  useEffect(() => {
    if (!playing || slides.length === 0) return
    drawSlide(currentSlide)
    timerRef.current = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide((c) => c + 1)
      } else {
        setPlaying(false)
        window.speechSynthesis?.cancel()
      }
    }, SLIDE_DURATION)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setProgress(60 + ((currentSlide + 1) / slides.length) * 40)
    return () => clearTimeout(timerRef.current)
  }, [playing, currentSlide, slides, drawSlide])

  function togglePlay() {
    if (playing) { setPlaying(false); window.speechSynthesis?.cancel(); clearTimeout(timerRef.current) }
    else { setPlaying(true) }
  }

  return (
    <div className="vg-overlay" onClick={onClose}>
      <div className="vg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vg-header">
          <span className="vg-badge">IA</span>
          <span className="vg-title">Video — {titre}</span>
          <div className="vg-header-btns">
            <select className="vg-voice-select" value={voiceType} onChange={(e) => setVoiceType(e.target.value)}>
              <option value="standard">Voix standard</option>
              <option value="none">Sans voix</option>
            </select>
            <button className="vg-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        {status === 'idle' && (
          <div className="vg-start">
            <p>Générez une vidéo animée avec narration IA à partir du guide.</p>
            <button className="vg-gen-btn" onClick={generate}>Générer la vidéo</button>
          </div>
        )}

        {status === 'generating' && (
          <div className="vg-loading">
            <p>Génération de votre vidéo...</p>
            <div className="vg-progress"><div className="vg-progress-fill" style={{ width: progress + '%' }} /></div>
          </div>
        )}

        {status === 'error' && (
          <div className="vg-start">
            <p style={{ color: '#ef4444' }}>Erreur de génération. Réessayez.</p>
            <button className="vg-gen-btn" onClick={generate}>Régénérer</button>
          </div>
        )}

        {(status === 'playing') && (
          <>
            <canvas ref={canvasRef} width={640} height={360} className="vg-canvas" />
            <div className="vg-controls">
              <button className="vg-ctrl-play" onClick={togglePlay}>
                {playing ? '⏸' : '▶'}
              </button>
              <span className="vg-slide-num">Slide {currentSlide + 1} / {slides.length}</span>
              <div className="vg-ctrl-progress"><div className="vg-ctrl-fill" style={{ width: ((currentSlide + 1) / slides.length * 100) + '%' }} /></div>
              <button className="vg-ctrl-btn" onClick={() => { setCurrentSlide(0); setPlaying(true) }}>Rejouer</button>
              <button className="vg-ctrl-btn" onClick={generate}>Régénérer</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

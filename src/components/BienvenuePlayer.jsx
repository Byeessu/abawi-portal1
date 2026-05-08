import { useState, useRef, useEffect, useMemo } from 'react'
import { BIENVENUE_CHAPTERS } from '../data/podcast-bienvenue'
import { resolveFirstPlayable } from '../lib/mediaResolver'
import './BienvenuePlayer.css'

const AUDIO_CANDIDATES = [
  '/files/podcasts/bienvenue-abawi.mp3',
  '/files/podcasts/bienvenue-chez-abawi-le-message-qui-change-tout.mp3',
]

function fmt(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec }

// Pre-calculate word counts per chapter for timestamp estimation
const CHAPTER_WORDS = BIENVENUE_CHAPTERS.map((ch) =>
  ch.text.replace(/\[PAUSE\]/g, '').replace(/\[EMPHASE\]/g, '').replace(/\[\/EMPHASE\]/g, '').split(/\s+/).length
)
const TOTAL_WORDS = CHAPTER_WORDS.reduce((a, b) => a + b, 0)
const CHAPTER_PCT = (() => {
  const pcts = []; let cum = 0
  for (const w of CHAPTER_WORDS) { pcts.push(cum / TOTAL_WORDS); cum += w }
  return pcts
})()

function KaraokeDisplay({ text, active }) {
  const clean = text.replace(/\[PAUSE\]/g, '').replace(/\[EMPHASE\]/g, '**').replace(/\[\/EMPHASE\]/g, '**')
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean]
  return (
    <div className="bv-karaoke">
      {sentences.map((s, i) => {
        const isBold = s.includes('**')
        const displayed = s.replace(/\*\*/g, '')
        return <span key={i} className={`bv-sent ${active ? (isBold ? 'bv-sent--highlight' : 'bv-sent--active') : 'bv-sent--future'}`}>{displayed} </span>
      })}
    </div>
  )
}

export default function BienvenuePlayer({ autoPlay = false, compact = false }) {
  const [status, setStatus] = useState('idle')
  const [audioError, setAudioError] = useState('')
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const gainRef = useRef(null)

  const chapterIdx = useMemo(() => {
    if (duration <= 0) return 0
    const pct = current / duration
    for (let i = CHAPTER_PCT.length - 1; i >= 0; i--) {
      if (pct >= CHAPTER_PCT[i]) return i
    }
    return 0
  }, [current, duration])

  const chapter = BIENVENUE_CHAPTERS[chapterIdx]
  const globalPct = duration > 0 ? (current / duration) * 100 : 0

  useEffect(() => {
    let disposed = false
    const a = new Audio()
    a.preload = 'metadata'
    audioRef.current = a

    // Amplify
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaElementSource(a)
      const gain = ctx.createGain()
      gain.gain.value = 1.6
      source.connect(gain); gain.connect(ctx.destination)
      gainRef.current = gain
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}

    a.addEventListener('loadedmetadata', () => { setDuration(a.duration); setAudioError('') })
    a.addEventListener('timeupdate', () => setCurrent(a.currentTime))
    a.addEventListener('ended', () => setStatus('done'))
    a.addEventListener('canplay', () => { if (autoPlay) setTimeout(() => { a.play(); setStatus('playing') }, 2000) }, { once: true })
    a.addEventListener('error', () => {
      setAudioError("Le mot d'accueil audio n'est pas disponible pour le moment.")
      setStatus('idle')
    })

    resolveFirstPlayable(AUDIO_CANDIDATES).then((src) => {
      if (disposed) return
      if (!src) {
        setAudioError("Le mot d'accueil audio n'est pas disponible pour le moment.")
        return
      }
      a.src = src
      a.load()
    })

    return () => { disposed = true; a.pause(); a.src = '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  function togglePlay() {
    const a = audioRef.current; if (!a) return
    if (status === 'playing') { a.pause(); setStatus('paused') }
    else if (status === 'done') { a.currentTime = 0; a.play(); setStatus('playing') }
    else { a.play().catch(() => {}); setStatus('playing') }
  }

  function seekToChapter(idx) {
    const a = audioRef.current; if (!a || duration <= 0) return
    a.currentTime = CHAPTER_PCT[idx] * duration
    if (status !== 'playing') { a.play().catch(() => {}); setStatus('playing') }
  }

  function seekBar(e) {
    const a = audioRef.current; if (!a || duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  if (compact) {
    return (
      <div className="bv-compact">
        <div className="bv-compact-info">
          <span className="bv-compact-badge">GRATUIT</span>
          <h3 className="bv-compact-title">Bienvenue chez ABAWI</h3>
          <p className="bv-compact-desc">Le message qui change tout</p>
        </div>
        <button className="bv-compact-play" onClick={togglePlay}>
          {status === 'playing' ? '⏸' : '▶'}
        </button>
        {status !== 'idle' && <div className="bv-compact-bar"><div className="bv-compact-fill" style={{ width: globalPct + '%' }} /></div>}
        {audioError && <span style={{ color: '#ef4444', fontSize: '0.74rem' }}>{audioError}</span>}
      </div>
    )
  }

  return (
    <div className="bv-player">
      <div className="bv-player-header">
        <span className="bv-player-badge">GRATUIT — Offert par ABAWI</span>
        <h3 className="bv-player-title">🎧 Un message pour vous — par le fondateur d'ABAWI</h3>
        <p className="bv-player-desc">2 minutes qui peuvent tout changer</p>
      </div>

      <div className="bv-chapters">
        {BIENVENUE_CHAPTERS.map((ch, i) => (
          <button key={i} className={`bv-ch ${i === chapterIdx ? 'bv-ch--active' : i < chapterIdx && status !== 'idle' ? 'bv-ch--done' : ''}`}
            onClick={() => seekToChapter(i)}>
            {i < chapterIdx && status !== 'idle' ? '✓ ' : ''}{ch.title}
          </button>
        ))}
      </div>

      {status !== 'idle' && chapter && (
        <div className="bv-text-area">
          <h4 className="bv-ch-title">{chapter.title}</h4>
          <KaraokeDisplay text={chapter.text} active={status === 'playing'} />
        </div>
      )}

      <div className="bv-controls">
        <div className="bv-progress" onClick={seekBar}><div className="bv-progress-fill" style={{ width: globalPct + '%' }} /></div>
        <div className="bv-ctrl-row">
          <button className="bv-ctrl-btn" onClick={() => seekToChapter(Math.max(0, chapterIdx - 1))} disabled={chapterIdx === 0}>Préc</button>
          <button className="bv-ctrl-play" onClick={togglePlay}>
            {status === 'playing' ? '⏸' : status === 'done' ? '↻' : '▶'}
          </button>
          <button className="bv-ctrl-btn" onClick={() => seekToChapter(Math.min(BIENVENUE_CHAPTERS.length - 1, chapterIdx + 1))} disabled={chapterIdx >= BIENVENUE_CHAPTERS.length - 1}>Suiv</button>
          <span className="bv-ctrl-info">{fmt(current)} / {fmt(duration)}</span>
        </div>
      </div>
      {audioError && <p style={{ marginTop: 10, color: '#ef4444', fontSize: '0.8rem' }}>{audioError}</p>}
    </div>
  )
}

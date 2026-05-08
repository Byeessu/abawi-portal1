import { useAuth } from '../context/AuthContext'
import { useAudio } from '../context/AudioContext'
import './AudioPlayer.css'
import { Link } from 'react-router-dom'

function fmt(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec }

/**
 * AudioPlayer — uses global AudioContext
 * Props: src, titre, serie, premium, id, size
 */
export function AudioPlayer({ src, titre, serie, premium = false, id, size = 'md' }) {
  const auth = useAuth()
  const audio = useAudio()
  const isMember = auth?.isMember
  const isAdmin = auth?.isAdmin
  const isPreview = premium && !isMember && !isAdmin

  const isThisTrack = audio.track?.id === id
  const isPlaying = isThisTrack && audio.playing
  const showOverlay = isThisTrack && audio.previewEnded

  function handlePlay() {
    audio.play({
      id: id || titre,
      titre: titre || 'Audio',
      serie: serie || '',
      src,
      isPreview,
      previewDuration: isPreview ? 45 : null,
    })
  }

  function handleSeek(e) {
    if (!isThisTrack) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.seek(pct * audio.duration)
  }

  const progress = isThisTrack && audio.duration > 0 ? (audio.current / audio.duration) * 100 : 0
  const previewPct = isPreview && audio.duration > 0 ? (45 / audio.duration) * 100 : 100

  return (
    <div className={`aplayer aplayer--${size}`}>
      {/* Preview ended overlay */}
      {showOverlay && (
        <div className="aplayer-overlay">
          <div className="aplayer-overlay-content">
            <span style={{ fontSize: '1.3rem' }}>🔒</span>
            <span className="aplayer-overlay-text">Cet épisode est réservé aux membres ABAWI+</span>
            <span style={{ fontSize: '0.72rem', color: '#8B95A5' }}>Extrait {fmt(45)} sur {fmt(audio.duration)}</span>
            <div className="aplayer-overlay-btns">
              <Link to="/plans" className="aplayer-overlay-cta">S'abonner — 4 900 F/mois</Link>
              <button className="aplayer-overlay-replay" onClick={() => audio.replay()}>Réécouter</button>
            </div>
            <Link to="/membre" style={{ fontSize: '0.7rem', color: '#8B95A5' }}>Déjà membre ?</Link>
          </div>
        </div>
      )}

      <button className="aplayer-play" onClick={handlePlay}>
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
        )}
      </button>

      <span className="aplayer-time">{isThisTrack ? fmt(audio.current) : '0:00'}</span>

      <div className="aplayer-bar" onClick={handleSeek}>
        {isPreview && <div className="aplayer-preview-zone" style={{ width: previewPct + '%' }} />}
        {isPreview && <div className="aplayer-locked-zone" style={{ left: previewPct + '%', width: (100 - previewPct) + '%' }} />}
        <div className="aplayer-fill" style={{ width: Math.min(progress, previewPct) + '%' }} />
      </div>

      <span className="aplayer-time">{isThisTrack ? fmt(audio.duration) : '--:--'}</span>

      {isPreview && !showOverlay && <span className="aplayer-preview-badge">Extrait 45s</span>}
      {isMember && premium && <span className="aplayer-vip-badge">VIP ✓</span>}
    </div>
  )
}

export function LockedPlayer() {
  return (
    <div className="aplayer aplayer--locked">
      <div className="aplayer-lock-icon">🔒</div>
      <div className="aplayer-lock-text">
        <span className="aplayer-lock-title">Épisode Premium</span>
        <span className="aplayer-lock-sub">Audio bientôt disponible — Inclus dans ABAWI+</span>
      </div>
      <div className="aplayer-lock-btns">
        <Link to="/plans" className="aplayer-lock-btn">S'abonner</Link>
      </div>
    </div>
  )
}

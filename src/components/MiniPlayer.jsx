import { useEffect } from 'react'
import { useAudio } from '../context/AudioContext'
import './MiniPlayer.css'
import { Link } from 'react-router-dom'

function fmt(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec }

export default function MiniPlayer() {
  const { track, playing, current, duration, previewEnded, miniVisible, miniCollapsed, setMiniCollapsed, play, pause, stop, seek, replay } = useAudio()

  useEffect(() => {
    if (!track || miniCollapsed) return
    if (playing) return
    const t = window.setTimeout(() => setMiniCollapsed(true), 8000)
    return () => window.clearTimeout(t)
  }, [track, playing, miniCollapsed, setMiniCollapsed])

  useEffect(() => {
    if (playing && miniCollapsed) setMiniCollapsed(false)
  }, [playing, miniCollapsed, setMiniCollapsed])

  if (!miniVisible || !track) return null

  const pct = duration > 0 ? (current / duration) * 100 : 0
  const previewPct = track.isPreview && duration > 0 ? ((track.previewDuration || 45) / duration) * 100 : 100

  function seekBar(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const target = ((e.clientX - rect.left) / rect.width) * duration
    seek(target)
  }

  // Collapsed mode — small FAB
  if (miniCollapsed) {
    return (
      <button className="mp-fab" onClick={() => setMiniCollapsed(false)}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
        )}
      </button>
    )
  }

  return (
    <div className="mp">
      {/* Progress bar */}
      <div className="mp-bar" onClick={seekBar}>
        {track.isPreview && <div className="mp-bar-limit" style={{ width: previewPct + '%' }} />}
        <div className="mp-bar-fill" style={{ width: Math.min(pct, previewPct) + '%' }} />
      </div>

      <div className="mp-inner">
        <div className="mp-info">
          <span className="mp-title">{track.titre}</span>
          <span className="mp-serie">{track.serie || ''}</span>
        </div>

        <div className="mp-controls">
          <button className="mp-play" onClick={() => previewEnded ? replay() : (playing ? pause() : play(track))}>
            {playing ? '⏸' : previewEnded ? '↻' : '▶'}
          </button>
          <span className="mp-time">{fmt(current)} / {fmt(duration)}</span>
        </div>

        {/* Preview ended CTA */}
        {previewEnded && (
          <Link to="/plans" className="mp-cta">ABAWI+</Link>
        )}

        <button className="mp-collapse" onClick={() => setMiniCollapsed(true)}>↓</button>
        <button className="mp-stop" onClick={stop}>✕</button>
      </div>
    </div>
  )
}

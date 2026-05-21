import { useRef, useState, useEffect, useCallback } from 'react'

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PremiumVideoPlayer({ src, poster, title }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [pip, setPip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showControls, setShowControls] = useState(true)
  const [seeking, setSeeking] = useState(false)
  const controlsTimer = useRef(null)

  const hideControls = useCallback(() => {
    if (playing && !seeking) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 2500)
    }
  }, [playing, seeking])

  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    hideControls()
  }, [hideControls])

  useEffect(() => {
    hideControls()
    return () => clearTimeout(controlsTimer.current)
  }, [hideControls])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    function onTimeUpdate() {
      setCurrentTime(v.currentTime)
      setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
      if (v.buffered.length > 0) {
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
      }
    }
    function onLoadedMeta() { setDuration(v.duration); setLoading(false) }
    function onWaiting() { setLoading(true) }
    function onPlaying() { setLoading(false); setPlaying(true) }
    function onPause() { setPlaying(false) }
    function onEnded() { setPlaying(false); setProgress(100) }
    function onError() {
      setError('Impossible de lire cette vidéo. Vérifiez votre connexion ou réessayez.')
      setLoading(false)
    }
    function onCanPlay() { setLoading(false); setError(null) }
    function onVolumeChange() { setVolume(v.volume); setMuted(v.muted) }
    function onRateChange() { setSpeed(v.playbackRate) }

    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('loadedmetadata', onLoadedMeta)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('volumechange', onVolumeChange)
    v.addEventListener('ratechange', onRateChange)

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('loadedmetadata', onLoadedMeta)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('volumechange', onVolumeChange)
      v.removeEventListener('ratechange', onRateChange)
    }
  }, [src])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (!videoRef.current) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(videoRef.current.currentTime + 5)
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(videoRef.current.currentTime - 5)
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(Math.max(0, volume - 0.1))
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          togglePiP()
          break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
    resetControlsTimer()
  }

  function seek(val) {
    const v = videoRef.current
    if (!v || !isFinite(v.duration)) return
    v.currentTime = Math.max(0, Math.min(v.duration, val))
    resetControlsTimer()
  }

  function handleSeekBarClick(e) {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(pct * duration)
  }

  function changeVolume(val) {
    const v = videoRef.current
    if (!v) return
    v.volume = val
    v.muted = val === 0
    setVolume(val)
    setMuted(val === 0)
    resetControlsTimer()
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    resetControlsTimer()
  }

  function changeSpeed(rate) {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = rate
    setSpeed(rate)
    resetControlsTimer()
  }

  async function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch { /* ignore */ }
    resetControlsTimer()
  }

  async function togglePiP() {
    const v = videoRef.current
    if (!v || !document.pictureInPictureEnabled) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setPip(false)
      } else {
        await v.requestPictureInPicture()
        setPip(true)
      }
    } catch { /* ignore */ }
    resetControlsTimer()
  }

  function handleDoubleClick(e) {
    e.stopPropagation()
    toggleFullscreen()
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => playing && !seeking && setShowControls(false)}
      onClick={togglePlay}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0B1119',
        aspectRatio: '16/9',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onClick={(e) => { e.stopPropagation(); togglePlay() }}
      />

      {/* Masque subtil des watermarks (Notebook LM etc.) — bandeau glassmorphism en bas */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 44,
        background: 'linear-gradient(to top, rgba(11,17,25,0.85) 0%, rgba(11,17,25,0.4) 50%, transparent 100%)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Masque ciblé coin inférieur droit (watermark fréquent) */}
      <div style={{
        position: 'absolute',
        bottom: 8, right: 8,
        width: 140, height: 36,
        background: 'rgba(11,17,25,0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: 8,
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* Loading spinner */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '3px solid rgba(240,180,41,0.2)',
            borderTopColor: '#F0B429',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      )}

      {/* Big play button overlay */}
      {!playing && !loading && !error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.25)'
        }} onClick={(e) => { e.stopPropagation(); togglePlay() }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(240,180,41,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(240,180,41,0.35)',
            transition: 'transform 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <span style={{ fontSize: '2rem', marginLeft: 4, color: '#070B0F' }}>▶</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', padding: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Erreur de lecture</p>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: 400, marginBottom: 20 }}>{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setError(null); setLoading(true); videoRef.current?.load() }}
            style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #F0B429',
              background: 'rgba(240,180,41,0.1)', color: '#F0B429',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
            }}
          >
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* Controls bar */}
      <div
        ref={controlsRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '40px 16px 12px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: 4,
        }}
      >
        {/* Title */}
        {title && (
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 8, textShadow: '0 1px 4px rgba(0,0,0,0.5)', opacity: 0.9 }}>
            {title}
          </div>
        )}

        {/* Progress bar */}
        <div
          style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', marginBottom: 10, cursor: 'pointer' }}
          onClick={handleSeekBarClick}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: 'rgba(255,255,255,0.25)', width: `${buffered}%` }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: '#F0B429', width: `${progress}%`, transition: seeking ? 'none' : 'width 0.1s linear' }} />
          <div style={{
            position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)',
            width: 14, height: 14, borderRadius: '50%', background: '#F0B429',
            boxShadow: '0 0 8px rgba(240,180,41,0.6)', opacity: showControls ? 1 : 0, transition: 'opacity 0.2s'
          }} />
        </div>

        {/* Bottom controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={controlBtnStyle}>
              {playing ? '⏸' : '▶'}
            </button>

            {/* Time */}
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums', minWidth: 80 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Speed */}
            <div style={{ position: 'relative' }}>
              <select
                value={speed}
                onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '4px 20px 4px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  appearance: 'none', WebkitAppearance: 'none'
                }}
              >
                <option value={0.5} style={{ background: '#1a1a1a' }}>0.5x</option>
                <option value={1} style={{ background: '#1a1a1a' }}>1x</option>
                <option value={1.25} style={{ background: '#1a1a1a' }}>1.25x</option>
                <option value={1.5} style={{ background: '#1a1a1a' }}>1.5x</option>
                <option value={2} style={{ background: '#1a1a1a' }}>2x</option>
              </select>
            </div>

            {/* Volume */}
            <button onClick={toggleMute} style={controlBtnStyle}>
              {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              style={{ width: 60, accentColor: '#F0B429', cursor: 'pointer' }}
            />

            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} style={{ ...controlBtnStyle, opacity: pip ? 1 : 0.7 }}>
                {pip ? '⛶' : '◱'}
              </button>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={controlBtnStyle}>
              {fullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const controlBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: '1rem',
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 6,
  opacity: 0.9,
  transition: 'opacity 0.2s',
  lineHeight: 1,
}

import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import { trackEvent } from '../lib/observability'

const Ctx = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export const useAudio = () => useContext(Ctx)

function waitForCanPlay(a) {
  return new Promise((resolve) => {
    if (a.readyState >= 3) { resolve(); return }
    const timeout = setTimeout(() => {
      a.removeEventListener('canplay', onCan)
      a.removeEventListener('loadeddata', onCan)
      resolve() // timeout — try anyway
    }, 5000)
    function onCan() {
      clearTimeout(timeout)
      a.removeEventListener('canplay', onCan)
      a.removeEventListener('loadeddata', onCan)
      resolve()
    }
    a.addEventListener('canplay', onCan)
    a.addEventListener('loadeddata', onCan)
  })
}

export function AudioProvider({ children }) {
  const audioRef = useRef(null)
  const webCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const sourceCreated = useRef(false)
  const rafRef = useRef(null)
  const trackRef = useRef(null) // mirror of `track` state for use inside the persistent `ended` listener

  const [track, setTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [frequencies, setFrequencies] = useState(new Uint8Array(32))
  const [previewEnded, setPreviewEnded] = useState(false)
  const [miniVisible, setMiniVisible] = useState(false)
  const [miniCollapsed, setMiniCollapsed] = useState(false)

  useEffect(() => {
    const a = new Audio()
    a.crossOrigin = 'anonymous'
    a.preload = 'auto'
    audioRef.current = a

    a.addEventListener('timeupdate', () => {
      const previewMax = track?.isPreview ? (track.previewDuration || 45) : null
      if (previewMax && a.currentTime >= previewMax) {
        a.pause()
        a.currentTime = previewMax
        setPlaying(false)
        setPreviewEnded(true)
      }
      setCurrent(a.currentTime)
      setDuration(isNaN(a.duration) ? 0 : a.duration)
    })
    a.addEventListener('loadedmetadata', () => setDuration(a.duration))
    a.addEventListener('ended', () => {
      setPlaying(false)
      setPreviewEnded(false)
      const t = trackRef.current
      if (t) trackEvent('podcast_complete', { id: t.id, title: t.title, isPreview: !!t.isPreview })
    })
    a.addEventListener('error', (e) => console.error('[Audio] Error:', e))

    return () => { a.pause(); cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  function initWebAudio(audioEl) {
    try {
      if (!webCtxRef.current) {
        const wCtx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = wCtx.createAnalyser()
        analyser.fftSize = 64
        webCtxRef.current = wCtx
        analyserRef.current = analyser
      }
      if (!sourceCreated.current) {
        const source = webCtxRef.current.createMediaElementSource(audioEl)
        source.connect(analyserRef.current)
        analyserRef.current.connect(webCtxRef.current.destination)
        sourceRef.current = source
        sourceCreated.current = true

        function loop() {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          setFrequencies(new Uint8Array(data))
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      }
    } catch (e) { console.error('[WebAudio] Init error:', e) }
  }

  const play = useCallback(async (t) => {
    const a = audioRef.current
    if (!a) return

    if (track?.id === t.id && !previewEnded) {
      if (playing) { a.pause(); setPlaying(false) }
      else {
        if (webCtxRef.current?.state === 'suspended') {
          await webCtxRef.current.resume()
        }
        await a.play().catch(console.error)
        setPlaying(true)
      }
      return
    }

    a.pause()
    a.volume = 1
    a.src = t.src
    a.load()

    initWebAudio(a)

    // Resume AudioContext BEFORE play (mobile autoplay policy)
    if (webCtxRef.current?.state === 'suspended') {
      await webCtxRef.current.resume()
    }

    // Wait for audio to be ready (up to 5s)
    await waitForCanPlay(a)

    try {
      await a.play()
      setTrack(t)
      trackRef.current = t
      setPlaying(true)
      setPreviewEnded(false)
      setCurrent(0)
      setMiniVisible(true)
      setMiniCollapsed(false)
      trackEvent('podcast_play', { id: t.id, title: t.title, isPreview: !!t.isPreview })
    } catch (e) {
      console.error('[Audio] Play failed:', e)
    }
  }, [track, playing, previewEnded])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.currentTime = 0; a.src = '' }
    setTrack(null); trackRef.current = null
    setPlaying(false); setCurrent(0)
    setDuration(0); setPreviewEnded(false); setMiniVisible(false)
  }, [])

  const seek = useCallback((time) => {
    const a = audioRef.current
    if (!a) return
    const maxSeek = track?.isPreview ? (track.previewDuration || 45) : Infinity
    a.currentTime = Math.min(time, maxSeek)
  }, [track])

  const replay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0; a.volume = 1
    setPreviewEnded(false)
    if (webCtxRef.current?.state === 'suspended') webCtxRef.current.resume()
    a.play().catch(console.error)
    setPlaying(true)
  }, [])

  return (
    <Ctx.Provider value={{
      track, playing, current, duration, frequencies,
      previewEnded, miniVisible, miniCollapsed, setMiniCollapsed,
      play, pause, stop, seek, replay, audioRef, analyserRef
    }}>
      {children}
    </Ctx.Provider>
  )
}

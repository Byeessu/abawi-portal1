import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useToolAccess } from '../../hooks/useToolAccess'
import ToolHero from '../../components/ToolHero'
import ToolIcon from '../../components/ToolIcon'
import ToolAccessHeader from '../../components/ToolAccessHeader'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import TokenCounter from '../../components/TokenCounter'
import SEO from '../../components/SEO'
import { requestAzureTTS } from '../../lib/azureTtsClient'

/* ═══════════════════════════════════════════════════════════════
   AUDIO STUDIO ÉLITE v3 — Éditeur Audio Professionnel
   Waveform · Timeline · Sélection · Effets temps réel · Export
   ═══════════════════════════════════════════════════════════════ */

const EQ_BANDS = [
  { f: 32, label: '32Hz' }, { f: 64, label: '64Hz' }, { f: 125, label: '125Hz' },
  { f: 250, label: '250Hz' }, { f: 500, label: '500Hz' }, { f: 1000, label: '1kHz' },
  { f: 2000, label: '2kHz' }, { f: 4000, label: '4kHz' }, { f: 8000, label: '8kHz' }, { f: 16000, label: '16kHz' },
]

const FX_PRESETS = [
  { id: 'flat', name: 'Bypass', eq: EQ_BANDS.map(() => 0), comp: { thr: -24, ratio: 1, atk: 0.003, rel: 0.25 }, limit: -0.1, width: 0, reverb: 0, exciter: 0, noiseGate: 0.01, master: 0.8, hpFreq: 20, lpFreq: 20000 },
  { id: 'podcast', name: 'Podcast Pro', eq: [2, 1, 0, -1, 0, 1, 2, 1, 0, -1], comp: { thr: -18, ratio: 4, atk: 0.003, rel: 0.1 }, limit: -1, width: 0.15, reverb: 0.08, exciter: 0.1, noiseGate: 0.02, master: 0.85, hpFreq: 80, lpFreq: 12000 },
  { id: 'vocal', name: 'Voix Claires', eq: [-2, 0, 1, 2, 3, 3, 2, 1, 0, -2], comp: { thr: -20, ratio: 3, atk: 0.005, rel: 0.12 }, limit: -1.5, width: 0.1, reverb: 0.12, exciter: 0.15, noiseGate: 0.015, master: 0.9, hpFreq: 100, lpFreq: 15000 },
  { id: 'interview', name: 'Interview', eq: [0, 0, 1, 2, 2, 1, 0, -1, -1, -2], comp: { thr: -16, ratio: 5, atk: 0.002, rel: 0.08 }, limit: -1, width: 0.05, reverb: 0.05, exciter: 0.05, noiseGate: 0.025, master: 0.88, hpFreq: 120, lpFreq: 14000 },
  { id: 'bass', name: 'Bass Boost', eq: [6, 4, 2, 0, -1, -1, 0, 1, 2, 1], comp: { thr: -22, ratio: 2.5, atk: 0.01, rel: 0.2 }, limit: -0.5, width: 0.2, reverb: 0.1, exciter: 0.2, noiseGate: 0.01, master: 0.8, hpFreq: 20, lpFreq: 18000 },
  { id: 'concert', name: 'Concert Hall', eq: [0, 0, 0, 0, 0, 0, 1, 2, 3, 2], comp: { thr: -20, ratio: 2, atk: 0.01, rel: 0.3 }, limit: -1, width: 0.4, reverb: 0.35, exciter: 0.25, noiseGate: 0.01, master: 0.82, hpFreq: 20, lpFreq: 20000 },
  { id: 'dolby', name: 'Dolby On', eq: [1, 0, 0, 0, 1, 2, 3, 2, 1, 0], comp: { thr: -24, ratio: 3.5, atk: 0.001, rel: 0.15 }, limit: -1.2, width: 0.35, reverb: 0.18, exciter: 0.3, noiseGate: 0.008, master: 0.92, hpFreq: 40, lpFreq: 18000 },
  { id: 'surround', name: 'Surround', eq: [0, 0, 1, 1, 0, 0, 1, 2, 3, 2], comp: { thr: -22, ratio: 2.5, atk: 0.005, rel: 0.2 }, limit: -1, width: 0.6, reverb: 0.25, exciter: 0.2, noiseGate: 0.01, master: 0.85, hpFreq: 20, lpFreq: 20000 },
  { id: 'debruit', name: 'Débruitage', eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], comp: { thr: -30, ratio: 10, atk: 0.001, rel: 0.05 }, limit: -0.5, width: 0, reverb: 0, exciter: 0, noiseGate: 0.08, master: 0.95, hpFreq: 200, lpFreq: 8000 },
  { id: 'radio', name: 'Radio FM', eq: [3, 2, 1, 0, 0, 1, 2, 3, 2, 1], comp: { thr: -14, ratio: 6, atk: 0.001, rel: 0.06 }, limit: -0.8, width: 0.2, reverb: 0.06, exciter: 0.2, noiseGate: 0.03, master: 0.9, hpFreq: 60, lpFreq: 15000 },
  { id: 'telephone', name: 'Téléphone', eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], comp: { thr: -20, ratio: 4, atk: 0.001, rel: 0.1 }, limit: -1, width: 0, reverb: 0, exciter: 0, noiseGate: 0.02, master: 0.85, hpFreq: 300, lpFreq: 3400 },
  { id: 'mastering', name: 'Mastering', eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], comp: { thr: -18, ratio: 2, atk: 0.02, rel: 0.3 }, limit: -0.5, width: 0.1, reverb: 0, exciter: 0.1, noiseGate: 0.005, master: 0.95, hpFreq: 30, lpFreq: 18000 },
  { id: 'warm', name: 'Warm Vintage', eq: [2, 2, 1, 0, 0, -1, -1, 0, 1, 2], comp: { thr: -20, ratio: 3, atk: 0.01, rel: 0.25 }, limit: -1, width: 0.15, reverb: 0.1, exciter: 0.05, noiseGate: 0.01, master: 0.88, hpFreq: 50, lpFreq: 10000 },
  { id: 'air', name: 'Air / Brillance', eq: [0, 0, 0, 0, 0, 0, 1, 2, 4, 5], comp: { thr: -22, ratio: 2, atk: 0.005, rel: 0.2 }, limit: -1, width: 0.3, reverb: 0.15, exciter: 0.35, noiseGate: 0.008, master: 0.9, hpFreq: 80, lpFreq: 20000 },
]

const TRANSCRIBE_LANGS = [
  { code: 'fr-FR', name: 'Français' }, { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Español' }, { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' }, { code: 'pt-BR', name: 'Português' },
  { code: 'ar-SA', name: 'العربية' }, { code: 'wo-SN', name: 'Wolof' },
]

/* ── Helpers ── */
function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '00:00.000'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 1000)
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(ms).padStart(3,'0')}`
}

function bufferToWav(ab) {
  const nCh = ab.numberOfChannels, len = ab.length * nCh * 2 + 44
  const buf = new ArrayBuffer(len)
  const v = new DataView(buf)
  const chans = []
  let p = 0, o = 0
  const u16 = d => { v.setUint16(p, d, true); p += 2 }
  const u32 = d => { v.setUint32(p, d, true); p += 4 }
  u32(0x46464952); u32(len - 8); u32(0x45564157)
  u32(0x20746d66); u32(16); u16(1)
  u16(nCh); u32(ab.sampleRate)
  u32(ab.sampleRate * 2 * nCh); u16(nCh * 2); u16(16)
  u32(0x61746164); u32(len - p - 4)
  for (let i = 0; i < ab.numberOfChannels; i++) chans.push(ab.getChannelData(i))
  while (o < ab.length) {
    for (let i = 0; i < nCh; i++) {
      let s = Math.max(-1, Math.min(1, chans[i][o]))
      v.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      p += 2
    }
    o++
  }
  return new Blob([buf], { type: 'audio/wav' })
}

function createReverbIR(ctx, dur = 2.0, decay = 2.0) {
  const sr = ctx.sampleRate, len = sr * dur
  const buf = ctx.createBuffer(2, len, sr)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function makeExciterCurve(sr, amount) {
  const len = 1024, curve = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * 2 - 1
    curve[i] = x + amount * (Math.tanh(x * 3) - x * 0.3)
  }
  return curve
}

/* ── Compute peak data for waveform drawing ── */
function computePeaks(buffer, samplesPerPixel) {
  const ch = buffer.numberOfChannels
  const total = buffer.length
  const peaks = []
  const spp = Math.max(1, Math.floor(samplesPerPixel))
  for (let px = 0; px < Math.ceil(total / spp); px++) {
    let min = 1, max = -1
    const start = px * spp
    const end = Math.min(start + spp, total)
    for (let c = 0; c < ch; c++) {
      const d = buffer.getChannelData(c)
      for (let i = start; i < end; i++) {
        const v = d[i]
        if (v < min) min = v
        if (v > max) max = v
      }
    }
    peaks.push({ min, max })
  }
  return peaks
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function AudioStudioElite() {
  const { membre } = useAuth()
  const { darkMode } = useTheme()
  const tool = useToolAccess('studio', 'audio_studio')
  const [showPayment, setShowPayment] = useState(false)

  /* ── Audio State ── */
  const [audioBuffer, setAudioBuffer] = useState(null)     // the loaded/edited AudioBuffer
  const [peaks, setPeaks] = useState([])                   // pre-computed peaks for drawing
  const [fileName, setFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [playhead, setPlayhead] = useState(0)             // seconds
  const [duration, setDuration] = useState(0)
  const [selStart, setSelStart] = useState(0)             // selection start (seconds)
  const [selEnd, setSelEnd] = useState(0)                 // selection end (seconds)
  const [zoom, setZoom] = useState(1)                     // zoom level (samples per pixel divisor)
  const [scrollOffset, setScrollOffset] = useState(0)   // horizontal scroll in pixels
  const [level, setLevel] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportingMp3, setExportingMp3] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [sidePanel, setSidePanel] = useState('effects')   // 'effects' | 'tts' | 'files'
  const [playbackSpeed, setPlaybackSpeed] = useState(1)   // vitesse de lecture
  const [lufs, setLufs] = useState(null)                  // loudness LUFS mesuré
  const [whisperLoading, setWhisperLoading] = useState(false)
  const [loopOn, setLoopOn] = useState(false)
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [ttsBlob, setTtsBlob] = useState(null)
  const [ttsBlobUrl, setTtsBlobUrl] = useState(null)

  /* ── Effect States ── */
  const [eqGains, setEqGains] = useState(EQ_BANDS.map(() => 0))
  const [comp, setComp] = useState({ thr: -24, ratio: 1, atk: 0.003, rel: 0.25 })
  const [limiterCeiling, setLimiterCeiling] = useState(-0.1)
  const [stereoWidth, setStereoWidth] = useState(0)
  const [reverbAmount, setReverbAmount] = useState(0)
  const [exciterAmount, setExciterAmount] = useState(0)
  const [noiseGateThr, setNoiseGateThr] = useState(0.01)
  const [masterGain, setMasterGain] = useState(0.8)
  const [selectedPreset, setSelectedPreset] = useState('flat')
  const [monitorEnabled, setMonitorEnabled] = useState(false)

  /* ── Pro filter states ── */
  const [hpFreq, setHpFreq] = useState(20)
  const [lpFreq, setLpFreq] = useState(20000)

  /* ── TTS / Voice States ── */
  const [ttsText, setTtsText] = useState('Bonjour, ceci est un test de synthèse vocale.')
  const [ttsRate, setTtsRate] = useState(1)
  const [ttsPitch, setTtsPitch] = useState(1)
  const [ttsVolume, setTtsVolume] = useState(1)
  const [ttsVoice, setTtsVoice] = useState('')
  const [ttsVoices, setTtsVoices] = useState([])
  const [ttsSpeaking, setTtsSpeaking] = useState(false)
  const [ttsDownloading, setTtsDownloading] = useState(false)
  const [voiceSamples, setVoiceSamples] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('abawi_voice_samples') || '[]'); return s.map(x => ({...x, url: x.base64 || x.url})) } catch { return [] }
  })
  const [selectedSample, setSelectedSample] = useState(() => { try { return localStorage.getItem('abawi_selected_voice_sample') || '' } catch { return '' } })
  const [sampleRecording, setSampleRecording] = useState(false)
  const [sampleBlob, setSampleBlob] = useState(null)
  const [sampleName, setSampleName] = useState('')

  /* ── Transcription States ── */
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [transLang, setTransLang] = useState('fr-FR')
  const recogRef = useRef(null)

  /* ── Refs ── */
  const acRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const analyserRef = useRef(null)
  const nodesRef = useRef({})
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const playStartRef = useRef(0)
  const playStartTimeRef = useRef(0)
  const micStreamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const sampleRecorderRef = useRef(null)
  const sampleChunksRef = useRef([])
  const [clipboard, setClipboard] = useState(null)

  /* ═══════════════════════════════════════════════════════════════
     AUDIO CONTEXT & EFFECT CHAIN
     ═══════════════════════════════════════════════════════════════ */
  const initAudio = useCallback(() => {
    if (acRef.current) return acRef.current
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC({ sampleRate: 48000, latencyHint: 'interactive' })
    acRef.current = ctx
    return ctx
  }, [])

  const buildChain = useCallback((ctx) => {
    const inputGain = ctx.createGain()
    const noiseGate = ctx.createGain()
    const highPass = ctx.createBiquadFilter()
    highPass.type = 'highpass'; highPass.frequency.value = hpFreq; highPass.Q.value = 0.7
    const eqFilters = EQ_BANDS.map(b => {
      const f = ctx.createBiquadFilter()
      f.type = 'peaking'; f.frequency.value = b.f; f.Q.value = 1.4; f.gain.value = 0
      return f
    })
    const compressor = ctx.createDynamicsCompressor()
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -0.1; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.knee.value = 0
    const exciter = ctx.createWaveShaper()
    exciter.curve = makeExciterCurve(ctx.sampleRate, 0)
    const lowPass = ctx.createBiquadFilter()
    lowPass.type = 'lowpass'; lowPass.frequency.value = lpFreq; lowPass.Q.value = 0.7
    const split = ctx.createChannelSplitter(2)
    const delayL = ctx.createDelay(), delayR = ctx.createDelay()
    const gainL = ctx.createGain(), gainR = ctx.createGain()
    const merger = ctx.createChannelMerger(2)
    delayL.delayTime.value = 0; delayR.delayTime.value = 0; gainL.gain.value = 1; gainR.gain.value = 1
    const convolver = ctx.createConvolver()
    convolver.buffer = createReverbIR(ctx, 2.5, 3.0); convolver.normalize = true
    const wetGain = ctx.createGain(), dryGain = ctx.createGain()
    wetGain.gain.value = 0; dryGain.gain.value = 1
    const master = ctx.createGain()
    master.gain.value = masterGain
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.8
    const monitorGain = ctx.createGain(); monitorGain.gain.value = 0

    inputGain.connect(noiseGate)
    noiseGate.connect(highPass)
    let last = highPass
    eqFilters.forEach(f => { last.connect(f); last = f })
    last.connect(compressor); compressor.connect(limiter); limiter.connect(exciter); exciter.connect(lowPass); lowPass.connect(split)
    split.connect(delayL, 0); split.connect(delayR, 1)
    delayL.connect(gainL); delayR.connect(gainR)
    gainL.connect(merger, 0, 0); gainR.connect(merger, 0, 1)
    merger.connect(dryGain); dryGain.connect(master)
    merger.connect(convolver); convolver.connect(wetGain); wetGain.connect(master)
    master.connect(analyser)

    nodesRef.current = { inputGain, noiseGate, highPass, eqFilters, compressor, limiter, exciter, lowPass, split, delayL, delayR, gainL, gainR, merger, convolver, wetGain, dryGain, master, analyser, monitorGain }
    analyserRef.current = analyser
    return { inputGain, analyser, master, monitorGain }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Update effect parameters ── */
  useEffect(() => { const n = nodesRef.current; if (n.eqFilters) n.eqFilters.forEach((f, i) => f.gain.value = eqGains[i]) }, [eqGains])
  useEffect(() => { const n = nodesRef.current; if (n.compressor) { n.compressor.threshold.value = comp.thr; n.compressor.ratio.value = comp.ratio; n.compressor.attack.value = comp.atk; n.compressor.release.value = comp.rel } }, [comp])
  useEffect(() => { const n = nodesRef.current; if (n.limiter) n.limiter.threshold.value = limiterCeiling }, [limiterCeiling])
  useEffect(() => { const n = nodesRef.current; if (n.delayL) { const w = stereoWidth; n.delayL.delayTime.value = w * 0.012; n.delayR.delayTime.value = w * 0.008; n.gainL.gain.value = 1 + w * 0.2; n.gainR.gain.value = 1 - w * 0.1 } }, [stereoWidth])
  useEffect(() => { const n = nodesRef.current; if (n.wetGain) { n.wetGain.gain.value = reverbAmount; n.dryGain.gain.value = 1 - reverbAmount * 0.5 } }, [reverbAmount])
  useEffect(() => { const n = nodesRef.current; if (n.exciter) n.exciter.curve = makeExciterCurve(acRef.current?.sampleRate || 48000, exciterAmount) }, [exciterAmount])
  useEffect(() => { const n = nodesRef.current; if (n.master) n.master.gain.value = masterGain }, [masterGain])
  useEffect(() => { const n = nodesRef.current; if (n.monitorGain && acRef.current) n.monitorGain.gain.setTargetAtTime(monitorEnabled ? 0.5 : 0, acRef.current.currentTime, 0.05) }, [monitorEnabled])
  useEffect(() => { const n = nodesRef.current; if (n.highPass) n.highPass.frequency.value = hpFreq }, [hpFreq])
  useEffect(() => { const n = nodesRef.current; if (n.lowPass) n.lowPass.frequency.value = lpFreq }, [lpFreq])

  /* ── Apply preset ── */
  function applyPreset(id) {
    const p = FX_PRESETS.find(x => x.id === id)
    if (!p) return
    setSelectedPreset(id)
    setEqGains([...p.eq])
    setComp({ ...p.comp })
    setLimiterCeiling(p.limit)
    setStereoWidth(p.width)
    setReverbAmount(p.reverb)
    setExciterAmount(p.exciter)
    setNoiseGateThr(p.noiseGate)
    setMasterGain(p.master)
    setHpFreq(p.hpFreq ?? 20)
    setLpFreq(p.lpFreq ?? 20000)
  }

  /* ═══════════════════════════════════════════════════════════════
     HISTORY (UNDO / REDO)
     ═══════════════════════════════════════════════════════════════ */
  function pushHistory(buf) {
    if (!buf) return
    const newHist = history.slice(0, historyIdx + 1)
    newHist.push(buf)
    if (newHist.length > 20) newHist.shift()
    setHistory(newHist)
    setHistoryIdx(newHist.length - 1)
  }

  function undo() {
    if (historyIdx > 0) {
      const idx = historyIdx - 1
      const buf = history[idx]
      setHistoryIdx(idx)
      setAudioBuffer(buf)
      setPeaks(computePeaks(buf, 800 / buf.length * zoom))
      setDuration(buf.duration)
      setPlayhead(0)
      setSelStart(0); setSelEnd(0)
    }
  }

  function redo() {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1
      const buf = history[idx]
      setHistoryIdx(idx)
      setAudioBuffer(buf)
      setPeaks(computePeaks(buf, 800 / buf.length * zoom))
      setDuration(buf.duration)
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     FILE LOADING
     ═══════════════════════════════════════════════════════════════ */
  async function loadAudioFile(file) {
    if (!file) return
    try {
      const ctx = initAudio()
      const ab = await file.arrayBuffer()
      const buffer = await ctx.decodeAudioData(ab)
      setAudioBuffer(buffer)
      setFileName(file.name)
      setDuration(buffer.duration)
      setPlayhead(0); setSelStart(0); setSelEnd(0)
      const spp = Math.max(1, Math.floor(buffer.length / 2000))
      setPeaks(computePeaks(buffer, spp))
      setZoom(1); setScrollOffset(0)
      pushHistory(buffer)
    } catch (e) { alert('Erreur lecture audio : ' + e.message) }
  }

  /* ═══════════════════════════════════════════════════════════════
     RECORDING
     ═══════════════════════════════════════════════════════════════ */
  async function startRecording() {
    if (!tool.allowed) { setShowPayment(true); return }
    try {
      const ctx = initAudio()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 48000, echoCancellation: true, noiseSuppression: true } })
      micStreamRef.current = stream
      await ctx.resume()
      const { inputGain, analyser, master } = buildChain(ctx)
      const src = ctx.createMediaStreamSource(stream)
      src.connect(inputGain)
      const dest = ctx.createMediaStreamDestination()
      master.connect(dest)
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const mr = new MediaRecorder(dest.stream, { mimeType: mime })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        stream.getTracks().forEach(t => t.stop())
        // Decode to AudioBuffer
        blob.arrayBuffer().then(ab => ctx.decodeAudioData(ab)).then(buf => {
          setAudioBuffer(buf)
          setFileName(`Enregistrement ${new Date().toLocaleTimeString()}`)
          setDuration(buf.duration)
          setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / 2000))))
          setPlayhead(0); setSelStart(0); setSelEnd(0)
          pushHistory(buf)
        }).catch(() => {})
      }
      mr.start(100)
      recorderRef.current = mr
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (e) { alert('Microphone inaccessible : ' + e.message) }
  }

  function stopRecording() {
    if (recorderRef.current) recorderRef.current.stop()
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    setIsRecording(false)
    clearInterval(timerRef.current)
  }

  /* ═══════════════════════════════════════════════════════════════
     PLAYBACK & TRANSPORT
     ═══════════════════════════════════════════════════════════════ */
  async function playAudio() {
    if (!audioBuffer || isPlaying) return
    const ctx = initAudio()
    if (ctx.state === 'suspended') await ctx.resume()
    stopAudio()
    // Nettoyer l'ancienne chaine pour éviter l'accumulation de nodes sur destination
    const old = nodesRef.current
    if (old.master) try { old.master.disconnect() } catch { /* ignore */ }
    if (old.analyser) try { old.analyser.disconnect() } catch { /* ignore */ }
    if (old.monitorGain) try { old.monitorGain.disconnect() } catch { /* ignore */ }
    const { inputGain, analyser, master } = buildChain(ctx)
    master.connect(ctx.destination)
    const src = ctx.createBufferSource()
    src.buffer = audioBuffer
    src.loop = loopOn
    src.playbackRate.value = playbackSpeed
    src.connect(inputGain)
    const startOffset = Math.max(0, Math.min(playhead, audioBuffer.duration - 0.001))
    src.start(0, startOffset)
    sourceNodeRef.current = src
    playStartTimeRef.current = ctx.currentTime
    playStartRef.current = startOffset
    setIsPlaying(true)

    src.onended = () => {
      if (!loopOn) {
        setIsPlaying(false)
        setPlayhead(audioBuffer.duration)
      }
    }
  }

  function stopAudio() {
    try { sourceNodeRef.current?.stop() } catch { /* ignore */ }
    sourceNodeRef.current = null
    setIsPlaying(false)
  }

  function togglePlay() {
    if (isPlaying) { stopAudio(); setPlayhead(playStartRef.current + (acRef.current?.currentTime - playStartTimeRef.current || 0)) }
    else { playAudio().catch(() => {}) }
  }

  /* ── Animation frame for playhead & analyser ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    const draw = () => {
      const w = canvas.width, h = canvas.height
      ctx2d.clearRect(0, 0, w, h)

      /* Background */
      ctx2d.fillStyle = darkMode ? '#0a0a0f' : '#f8fafc'
      ctx2d.fillRect(0, 0, w, h)

      /* Grid lines */
      ctx2d.strokeStyle = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)'
      ctx2d.lineWidth = 1
      for (let i = 0; i < h; i += 40) { ctx2d.beginPath(); ctx2d.moveTo(0, i); ctx2d.lineTo(w, i); ctx2d.stroke() }

      /* Waveform */
      if (peaks.length && audioBuffer) {
        const chH = h / audioBuffer.numberOfChannels
        for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
          const cy = c * chH + chH / 2
          const yOff = chH / 2 - 2
          ctx2d.fillStyle = c === 0 ? '#22c55e' : '#0ea5e9'
          for (let px = 0; px < w && px + scrollOffset < peaks.length; px++) {
            const p = peaks[px + scrollOffset]
            if (!p) continue
            const top = cy + p.min * yOff
            const bot = cy + p.max * yOff
            ctx2d.fillRect(px, top, 1, Math.max(1, bot - top))
          }
        }
      }

      /* Selection highlight */
      if (audioBuffer && selStart !== selEnd) {
        const spp = peaks.length ? audioBuffer.length / peaks.length : 1
        const sx = Math.max(0, (selStart * audioBuffer.sampleRate / spp) - scrollOffset)
        const ex = Math.max(0, (selEnd * audioBuffer.sampleRate / spp) - scrollOffset)
        ctx2d.fillStyle = 'rgba(14,165,233,0.15)'
        ctx2d.fillRect(sx, 0, ex - sx, h)
        ctx2d.strokeStyle = '#0ea5e9'
        ctx2d.lineWidth = 1
        ctx2d.beginPath(); ctx2d.moveTo(sx, 0); ctx2d.lineTo(sx, h); ctx2d.stroke()
        ctx2d.beginPath(); ctx2d.moveTo(ex, 0); ctx2d.lineTo(ex, h); ctx2d.stroke()
      }

      /* Playhead */
      if (audioBuffer) {
        const spp = peaks.length ? audioBuffer.length / peaks.length : 1
        let ph = playhead
        if (isPlaying && acRef.current) {
          ph = playStartRef.current + (acRef.current.currentTime - playStartTimeRef.current)
          if (loopOn && ph >= audioBuffer.duration) ph = ph % audioBuffer.duration
          if (ph > audioBuffer.duration) ph = audioBuffer.duration
          setPlayhead(ph)
        }
        const px = (ph * audioBuffer.sampleRate / spp) - scrollOffset
        if (px >= 0 && px < w) {
          ctx2d.strokeStyle = '#f59e0b'
          ctx2d.lineWidth = 2
          ctx2d.beginPath(); ctx2d.moveTo(px, 0); ctx2d.lineTo(px, h); ctx2d.stroke()
        }
      }

      /* Level meter from analyser */
      const analyser = analyserRef.current
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        let peak = 0
        for (let i = 0; i < data.length; i++) if (data[i] > peak) peak = data[i]
        setLevel(peak)
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [peaks, scrollOffset, playhead, isPlaying, selStart, selEnd, audioBuffer, loopOn, darkMode])

  /* ═══════════════════════════════════════════════════════════════
     CANVAS INTERACTION (selection, zoom, seek)
     ═══════════════════════════════════════════════════════════════ */
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartSel = useRef(0)

  function canvasScaleX() {
    const canvas = canvasRef.current
    if (!canvas) return 1
    const rect = canvas.getBoundingClientRect()
    return rect.width > 0 ? canvas.width / rect.width : 1
  }

  function getMouseX(e) {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    return (e.clientX - rect.left) * (canvas.width / rect.width)
  }

  function pixelsToTime(px) {
    if (!audioBuffer || !peaks.length) return 0
    const spp = audioBuffer.length / peaks.length
    return ((px + scrollOffset) * spp) / audioBuffer.sampleRate
  }

  function handleCanvasMouseDown(e) {
    if (!audioBuffer) return
    const x = getMouseX(e)
    const t = pixelsToTime(x)
    if (e.shiftKey) {
      // Extend selection
      if (t < selStart) { setSelStart(t); setPlayhead(t) }
      else { setSelEnd(t); setPlayhead(t) }
    } else {
      setSelStart(t)
      setSelEnd(t)
      setPlayhead(t)
      dragStartX.current = x
      dragStartSel.current = t
      setIsDragging(true)
    }
  }

  function handleCanvasMouseMove(e) {
    if (!isDragging || !audioBuffer) return
    const x = getMouseX(e)
    const t = pixelsToTime(x)
    if (t < dragStartSel.current) { setSelStart(t); setSelEnd(dragStartSel.current) }
    else { setSelStart(dragStartSel.current); setSelEnd(t) }
  }

  function handleCanvasMouseUp() {
    setIsDragging(false)
  }

  function handleWheel(e) {
    if (!audioBuffer) return
    e.preventDefault()
    const scale = canvasScaleX()
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const newZoom = Math.max(0.1, Math.min(50, zoom + (e.deltaY > 0 ? -0.5 : 0.5)))
      setZoom(newZoom)
      const spp = Math.max(1, Math.floor(audioBuffer.length / (2000 * newZoom)))
      setPeaks(computePeaks(audioBuffer, spp))
      // Recentrer scroll sur curseur si possible
      const x = getMouseX(e)
      const newScroll = Math.max(0, Math.floor((x / canvasRef.current.width) * (audioBuffer.length / spp)) - x)
      setScrollOffset(Math.max(0, newScroll))
    } else {
      // Scroll
      setScrollOffset(o => Math.max(0, o + e.deltaY * 2 * scale))
    }
  }

  function seekToTime(t) {
    if (!audioBuffer) return
    const clamped = Math.max(0, Math.min(t, audioBuffer.duration))
    setPlayhead(clamped)
    if (isPlaying) { stopAudio(); setTimeout(() => playAudio().catch(() => {}), 50) }
  }

  /* ═══════════════════════════════════════════════════════════════
     EDITING OPERATIONS
     ═══════════════════════════════════════════════════════════════ */
  function cloneBuffer(src) {
    const ctx = initAudio()
    const dst = ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate)
    for (let c = 0; c < src.numberOfChannels; c++) dst.getChannelData(c).set(src.getChannelData(c))
    return dst
  }

  function getSelectionSamples() {
    if (!audioBuffer || selStart >= selEnd) return null
    const sr = audioBuffer.sampleRate
    const s0 = Math.floor(selStart * sr)
    const s1 = Math.floor(selEnd * sr)
    return { start: s0, end: s1 }
  }

  function deleteSelection() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    if (!sel) return
    const ctx = initAudio()
    const newLen = audioBuffer.length - (sel.end - sel.start)
    if (newLen <= 0) { setAudioBuffer(null); setPeaks([]); setDuration(0); setSelStart(0); setSelEnd(0); return }
    const buf = ctx.createBuffer(audioBuffer.numberOfChannels, newLen, audioBuffer.sampleRate)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const src = audioBuffer.getChannelData(c)
      const dst = buf.getChannelData(c)
      dst.set(src.subarray(0, sel.start))
      dst.set(src.subarray(sel.end), sel.start)
    }
    setAudioBuffer(buf)
    setDuration(buf.duration)
    const spp = Math.max(1, Math.floor(buf.length / (2000 * zoom)))
    setPeaks(computePeaks(buf, spp))
    setSelStart(0); setSelEnd(0); setPlayhead(sel.start / buf.sampleRate)
    pushHistory(buf)
  }

  function copySelection() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    if (!sel) return
    const ctx = initAudio()
    const len = sel.end - sel.start
    const buf = ctx.createBuffer(audioBuffer.numberOfChannels, len, audioBuffer.sampleRate)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      buf.getChannelData(c).set(audioBuffer.getChannelData(c).subarray(sel.start, sel.end))
    }
    setClipboard(buf)
    alert('Sélection copiée (' + fmtTime(len / audioBuffer.sampleRate) + ')')
  }

  function cutSelection() {
    copySelection()
    deleteSelection()
  }

  function pasteAtPlayhead() {
    if (!audioBuffer || !clipboard) return
    const clip = clipboard
    const ctx = initAudio()
    const insertAt = Math.floor(playhead * audioBuffer.sampleRate)
    const newLen = audioBuffer.length + clip.length
    const buf = ctx.createBuffer(audioBuffer.numberOfChannels, newLen, audioBuffer.sampleRate)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const src = audioBuffer.getChannelData(c)
      const dst = buf.getChannelData(c)
      const clipData = clip.getChannelData(c % clip.numberOfChannels)
      dst.set(src.subarray(0, insertAt), 0)
      dst.set(clipData, insertAt)
      dst.set(src.subarray(insertAt), insertAt + clip.length)
    }
    setAudioBuffer(buf)
    setDuration(buf.duration)
    const spp = Math.max(1, Math.floor(buf.length / (2000 * zoom)))
    setPeaks(computePeaks(buf, spp))
    pushHistory(buf)
  }

  function trimToSelection() {
    if (!audioBuffer || selStart >= selEnd) return
    const ctx = initAudio()
    const s0 = Math.floor(selStart * audioBuffer.sampleRate)
    const s1 = Math.floor(selEnd * audioBuffer.sampleRate)
    const len = s1 - s0
    const buf = ctx.createBuffer(audioBuffer.numberOfChannels, len, audioBuffer.sampleRate)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      buf.getChannelData(c).set(audioBuffer.getChannelData(c).subarray(s0, s1))
    }
    setAudioBuffer(buf)
    setDuration(buf.duration)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    setPlayhead(0); setSelStart(0); setSelEnd(buf.duration)
    pushHistory(buf)
  }

  function normalizeAudio() {
    if (!audioBuffer) return
    const ctx = initAudio()
    const buf = cloneBuffer(audioBuffer)
    let peak = 0
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a }
    }
    if (peak < 0.001) return
    const gain = 0.95 / peak
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < d.length; i++) d[i] *= gain
    }
    setAudioBuffer(buf)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    pushHistory(buf)
  }

  function silenceSelection() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    if (!sel) return
    const buf = cloneBuffer(audioBuffer)
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      for (let i = sel.start; i < sel.end; i++) d[i] = 0
    }
    setAudioBuffer(buf)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    pushHistory(buf)
  }

  function fadeInSelection() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    if (!sel) return
    const buf = cloneBuffer(audioBuffer)
    const len = sel.end - sel.start
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      for (let i = sel.start; i < sel.end; i++) d[i] *= (i - sel.start) / len
    }
    setAudioBuffer(buf)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    pushHistory(buf)
  }

  function fadeOutSelection() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    if (!sel) return
    const buf = cloneBuffer(audioBuffer)
    const len = sel.end - sel.start
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      for (let i = sel.start; i < sel.end; i++) d[i] *= 1 - (i - sel.start) / len
    }
    setAudioBuffer(buf)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    pushHistory(buf)
  }

  /* ─── Helper script CDN ─── */
  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve()
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s) })
  }

  /* ─── Reverse (sélection ou tout) ─── */
  function reverseAudio() {
    if (!audioBuffer) return
    const sel = getSelectionSamples()
    const buf = cloneBuffer(audioBuffer)
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c)
      if (sel && sel.end > sel.start) {
        for (let i = sel.start, j = sel.end - 1; i < j; i++, j--) {
          const tmp = d[i]; d[i] = d[j]; d[j] = tmp
        }
      } else { d.reverse() }
    }
    setAudioBuffer(buf)
    setPeaks(computePeaks(buf, Math.max(1, Math.floor(buf.length / (2000 * zoom)))))
    pushHistory(buf)
  }

  /* ─── LUFS measure (ITU-R BS.1770 simplifié) ─── */
  function measureLUFS() {
    if (!audioBuffer) return
    let sumSq = 0, n = 0
    const K = 1.53512485958697
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const d = audioBuffer.getChannelData(c)
      const w = c === 2 ? 0 : c > 3 ? 0 : 1
      let p1 = 0, p2 = 0, q1 = 0, q2 = 0
      for (let i = 0; i < d.length; i++) {
        const y = K * d[i] - 0.568 * p1 + 0.028 * p2 + 0.512 * q1 - 0.068 * q2
        p2 = p1; p1 = d[i]; q2 = q1; q1 = y
        sumSq += y * y * w; n++
      }
    }
    const ms = sumSq / (n || 1)
    const val = ms < 1e-10 ? -Infinity : -0.691 + 10 * Math.log10(ms)
    setLufs(isFinite(val) ? val.toFixed(1) : '-∞')
  }

  /* ─── Export MP3 via lamejs (CDN) ─── */
  async function exportMp3() {
    if (!audioBuffer) { alert('Aucun audio à exporter.'); return }
    setExportingMp3(true)
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js')
      if (!window.lamejs) throw new Error('lamejs non chargé')
      const ac = initAudio()
      const off = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
      const src = off.createBufferSource(); src.buffer = audioBuffer
      const { inputGain } = buildChain(off)
      src.connect(inputGain); src.start(0)
      const rendered = await off.startRendering()
      const nCh = rendered.numberOfChannels
      const enc = new window.lamejs.Mp3Encoder(Math.min(nCh, 2), rendered.sampleRate, 192)
      const block = 1152, mp3 = []
      const L = rendered.getChannelData(0), R = nCh > 1 ? rendered.getChannelData(1) : L
      for (let i = 0; i < L.length; i += block) {
        const len = Math.min(block, L.length - i)
        const l16 = new Int16Array(len), r16 = new Int16Array(len)
        for (let j = 0; j < len; j++) {
          l16[j] = Math.max(-32768, Math.min(32767, L[i + j] * 32767))
          r16[j] = Math.max(-32768, Math.min(32767, R[i + j] * 32767))
        }
        const chunk = enc.encodeBuffer(l16, r16); if (chunk.length) mp3.push(chunk)
      }
      const tail = enc.flush(); if (tail.length) mp3.push(tail)
      const blob = new Blob(mp3, { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = (fileName.replace(/\.[^/.]+$/, '') || 'abawi-mix') + '.mp3'
      a.click(); URL.revokeObjectURL(url)
    } catch(e) { alert('Erreur MP3 : ' + e.message) }
    setExportingMp3(false)
  }

  /* ─── Transcription Groq Whisper-large-v3 ─── */
  async function transcribeWhisper() {
    if (!audioBuffer) { alert('Chargez un fichier audio d\'abord.'); return }
    setWhisperLoading(true)
    try {
      const wavBlob = bufferToWav(audioBuffer)
      const file = new File([wavBlob], 'audio.wav', { type: 'audio/wav' })
      const fd = new FormData()
      fd.append('file', file); fd.append('model', 'whisper-large-v3')
      fd.append('language', transLang.split('-')[0]); fd.append('response_format', 'text')
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: fd,
      })
      if (!res.ok) { const e = await res.text().catch(() => res.statusText); throw new Error(`Groq ${res.status}: ${e.slice(0,100)}`) }
      const text = await res.text()
      setTranscript(t => (t ? t + '\n' : '') + text.trim())
    } catch(e) { alert('Erreur Whisper : ' + e.message) }
    setWhisperLoading(false)
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════════════ */
  async function exportWav() {
    if (!audioBuffer) { alert('Aucun audio à exporter.'); return }
    if (!tool.allowed) { setShowPayment(true); return }
    setExporting(true)
    try {
      const ctx = initAudio()
      const off = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
      const src = off.createBufferSource(); src.buffer = audioBuffer
      const { inputGain } = buildChain(off)
      src.connect(inputGain)
      src.start(0)
      const rendered = await off.startRendering()
      const blob = bufferToWav(rendered)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = (fileName.replace(/\.[^/.]+$/, '') || 'abawi-mix') + '.wav'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) { alert('Erreur export : ' + e.message) }
    setExporting(false)
  }

  /* ═══════════════════════════════════════════════════════════════
     TTS & VOICE CLONE (from previous version, cleaned)
     ═══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices() || []
      setTtsVoices(voices)
      const saved = localStorage.getItem('abawi_preferred_voice')
      if (voices.length) {
        if (saved && voices.find(v => v.name === saved)) { if (!ttsVoice) setTtsVoice(saved) }
        else {
          const frGoogle = voices.find(v => v.lang?.startsWith('fr') && v.name.includes('Google'))
          const fr = voices.find(v => v.lang?.startsWith('fr'))
          if (!ttsVoice) setTtsVoice((frGoogle || fr || voices[0])?.name || '')
        }
      }
    }
    loadVoices()
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices
  }, [ttsVoice])

  useEffect(() => {
    if (!audioBuffer) { Promise.resolve().then(() => setAudioBlobUrl(null)); return }
    const blob = bufferToWav(audioBuffer)
    const url = URL.createObjectURL(blob)
    Promise.resolve().then(() => setAudioBlobUrl(url))
    return () => URL.revokeObjectURL(url)
  }, [audioBuffer])

  useEffect(() => { if (selectedSample) localStorage.setItem('abawi_selected_voice_sample', selectedSample) }, [selectedSample])

  useEffect(() => {
    if (!ttsBlob) { Promise.resolve().then(() => setTtsBlobUrl(null)); return }
    const url = URL.createObjectURL(ttsBlob)
    Promise.resolve().then(() => setTtsBlobUrl(url))
    return () => URL.revokeObjectURL(url)
  }, [ttsBlob])

  function getDefaultFrenchVoice() {
    const voices = window.speechSynthesis?.getVoices() || []
    return voices.find(v => v.lang?.startsWith('fr') && v.name.includes('Google')) || voices.find(v => v.lang?.startsWith('fr')) || voices[0] || null
  }

  function speakTTS() {
    if (!window.speechSynthesis) { alert('Synthèse vocale non supportée.'); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(ttsText)
    let rate = ttsRate, pitch = ttsPitch, voice = ttsVoices.find(v => v.name === ttsVoice)
    if (ttsVoice?.startsWith('sample-')) {
      const sid = ttsVoice.replace('sample-', '')
      const p = voiceSamples.find(s => String(s.id) === sid)
      if (p) { if (p.rate != null) rate = p.rate; if (p.pitch != null) pitch = p.pitch }
      voice = getDefaultFrenchVoice()
    }
    u.rate = rate; u.pitch = pitch; u.volume = ttsVolume
    if (voice) u.voice = voice
    u.onstart = () => setTtsSpeaking(true)
    u.onend = () => setTtsSpeaking(false)
    u.onerror = () => setTtsSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  function stopTTS() { window.speechSynthesis.cancel(); setTtsSpeaking(false) }

  async function downloadTTS() {
    if (!ttsText.trim()) return
    setTtsDownloading(true)
    try {
      const blob = await requestAzureTTS({ text: ttsText.trim(), voiceName: 'fr-FR-DeniseNeural' })
      setTtsBlob(blob)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `abawi-tts-${Date.now()}.mp3`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch (e) { alert('Erreur génération TTS : ' + e.message) }
    setTtsDownloading(false)
  }

  /* Voice sample recording */
  async function startSampleRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      sampleChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) sampleChunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(sampleChunksRef.current, { type: 'audio/webm' })
        setSampleBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      sampleRecorderRef.current = mr
      setSampleRecording(true)
    } catch (e) { alert('Erreur micro : ' + e.message) }
  }

  function stopSampleRecording() {
    if (sampleRecorderRef.current) { sampleRecorderRef.current.stop(); setSampleRecording(false) }
  }

  function saveVoiceSample() {
    if (!sampleBlob) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result
      const url = URL.createObjectURL(sampleBlob)
      const name = sampleName.trim() || `Profil ${voiceSamples.length + 1}`
      const sample = { id: Date.now(), name, url, base64, blobType: sampleBlob.type, pitch: ttsPitch, rate: ttsRate }
      const updated = [...voiceSamples, sample]
      setVoiceSamples(updated)
      localStorage.setItem('abawi_voice_samples', JSON.stringify(updated.map(s => ({ id: s.id, name: s.name, base64: s.base64, blobType: s.blobType, pitch: s.pitch, rate: s.rate }))))
      setSelectedSample(String(sample.id))
      setSampleBlob(null); setSampleName('')
      alert('Profil vocal sauvegardé : "' + name + '"')
    }
    reader.readAsDataURL(sampleBlob)
  }

  function playVoiceSample(id) { const s = voiceSamples.find(v => v.id === id); if (s) new Audio(s.url).play() }
  function deleteVoiceSample(id) {
    const updated = voiceSamples.filter(v => v.id !== id)
    setVoiceSamples(updated)
    localStorage.setItem('abawi_voice_samples', JSON.stringify(updated.map(s => ({ id: s.id, name: s.name, base64: s.base64, blobType: s.blobType, pitch: s.pitch, rate: s.rate }))))
    if (String(selectedSample) === String(id)) { setSelectedSample(''); localStorage.removeItem('abawi_selected_voice_sample') }
  }

  /* ═══════════════════════════════════════════════════════════════
     TRANSCRIPTION
     ═══════════════════════════════════════════════════════════════ */
  function startTranscription() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) { alert('Reconnaissance vocale non supportée.'); return }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new R(); r.lang = transLang; r.continuous = true; r.interimResults = true
    r.onstart = () => setTranscribing(true)
    r.onresult = e => {
      let final = '', interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      if (final) setTranscript(t => t + final + ' ')
      setInterimTranscript(interim)
    }
    r.onerror = () => setTranscribing(false)
    r.onend = () => setTranscribing(false)
    recogRef.current = r
    r.start()
  }
  function stopTranscription() { recogRef.current?.stop(); setTranscribing(false); setInterimTranscript('') }
  function copyTranscript() { navigator.clipboard.writeText(transcript).then(() => alert('Transcription copiée !')) }
  function clearTranscript() { setTranscript(''); setInterimTranscript('') }

  /* ═══════════════════════════════════════════════════════════════
     KEYBOARD SHORTCUTS
     ═══════════════════════════════════════════════════════════════ */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelection() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelection() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') { e.preventDefault(); cutSelection() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteAtPlayhead() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, audioBuffer, selStart, selEnd, playhead, historyIdx, history])

  /* ═══════════════════════════════════════════════════════════════
     STYLES
     ═══════════════════════════════════════════════════════════════ */
  const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }
  const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }
  const btnDanger = { ...btnBase, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }
  const btnGhost = { ...btnBase, background: 'transparent', color: 'var(--text-secondary)' }
  const btnActive = { ...btnBase, background: 'rgba(6,182,212,0.12)', color: '#06b6d4', borderColor: '#06b6d4' }
  const inputStyle = { padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }
  const card = { background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }
  const sectionLabel = { fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 60 }}>
      <SEO title="Audio Studio Élite — Éditeur Audio Professionnel" description="Éditez, mixez et masterisez vos pistes audio. Waveform, EQ, compresseur, réverbération, export WAV."  image="/og-tools/audio-studio.jpg"/>
      <ToolHero
        icon={<ToolIcon name="audio-studio" size={40} />}
        badge="ÉLITE"
        title="Audio Studio"
        titleAccent="Élite"
        subtitle="Éditeur audio professionnel — waveform, EQ 10 bandes, compresseur, réverbération, exciter, noise gate, mastering & export studio."
        gradient="linear-gradient(135deg, #0f172a 0%, #164e63 50%, #06b6d4 100%)"
        glowColor="rgba(6,182,212,0.4)"
        accentColor="#67e8f9"
      />
      <ToolAccessHeader toolAccess={tool} toolName="Audio Studio Élite" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <TokenCounter />
      </div>
      <ToolInfoPanel
        toolName="Audio Studio Élite"
        icon={<ToolIcon name="audio-studio" size={28} />}
        description="Éditeur audio professionnel côté client : waveform interactif, EQ paramétrique 10 bandes, compresseur/limitateur, réverbération convolution, exciter harmonique, noise gate, et mastering."
        benefits={[
          'Waveform interactif avec zoom, scroll, sélection et édition (couper/copier/coller)',
          'EQ 10 bandes + filtres passe-haut / passe-bas pour un contrôle tonal complet',
          'Compresseur dynamique avec threshold, ratio, attack, release',
          'Réverbération convolution, exciter harmonique, stereo widening',
          'Noise gate, normalisation, fade in/out, rognage',
          'Voice cloning, synthèse vocale TTS multilingue, transcription',
          'Export WAV studio et MP3 TTS',
        ]}
        howToUse={[
          'Importez un fichier audio ou enregistrez avec le microphone',
          'Naviguez dans la waveform : zoom molette, défilement, clic pour playhead',
          'Sélectionnez une zone et appliquez couper, copier, coller, silence ou fade',
          'Onglet Effets : choisissez un preset puis affinez EQ, dynamique et effets',
          'Exportez en WAV une fois le mastering terminé',
        ]}
        tips={[
          'Utilisez le preset "Débruitage" pour nettoyer un enregistrement micro',
          'Le preset "Voix Claires" met en valeur les fréquences vocales',
          'Activez le monitoring pour entendre votre voix pendant l\'enregistrement',
          'Le raccourci Espace démarre/arrête la lecture',
        ]}
      />
      {showPayment && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', borderRadius: 12, marginBottom: 20, color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
          Cet outil nécessite un abonnement. <a href="/abonnement" style={{ color: '#b45309', textDecoration: 'underline' }}>Voir les offres</a>
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)' }}>
        <label style={{ ...btnPrimary, cursor: 'pointer' }}>
          <input type="file" accept="audio/*" onChange={e => { loadAudioFile(e.target.files[0]); e.target.value = '' }} style={{ display: 'none' }} />
          📁 Importer
        </label>
        <button onClick={exportWav} disabled={exporting || !audioBuffer} style={{ ...btnBase, opacity: audioBuffer ? 1 : 0.5 }}>{exporting ? '⏳...' : '💾 WAV'}</button>
        <button onClick={exportMp3} disabled={exportingMp3 || !audioBuffer} style={{ ...btnBase, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', opacity: audioBuffer ? 1 : 0.5 }} title="Export MP3 192kbps via lamejs">{exportingMp3 ? '⏳ MP3...' : '🎵 MP3'}</button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={undo} disabled={historyIdx <= 0} style={{ ...btnGhost, opacity: historyIdx > 0 ? 1 : 0.4 }}>↩ Undo</button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1} style={{ ...btnGhost, opacity: historyIdx < history.length - 1 ? 1 : 0.4 }}>↪ Redo</button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={cutSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>✂️ Couper</button>
        <button onClick={copySelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>📋 Copier</button>
        <button onClick={pasteAtPlayhead} disabled={!audioBuffer || !clipboard} style={{ ...btnGhost, opacity: audioBuffer && clipboard ? 1 : 0.4 }}>📎 Coller</button>
        <button onClick={deleteSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnDanger, fontSize: '0.78rem', padding: '6px 12px', opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>🗑 Suppr</button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={trimToSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>✂️ Rogner</button>
        <button onClick={normalizeAudio} disabled={!audioBuffer} style={{ ...btnGhost, opacity: audioBuffer ? 1 : 0.4 }}>📈 Normaliser</button>
        <button onClick={silenceSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>🔇 Silence</button>
        <button onClick={fadeInSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>📉 Fade In</button>
        <button onClick={fadeOutSelection} disabled={!audioBuffer || selStart >= selEnd} style={{ ...btnGhost, opacity: audioBuffer && selStart < selEnd ? 1 : 0.4 }}>📈 Fade Out</button>
        <button onClick={reverseAudio} disabled={!audioBuffer} style={{ ...btnGhost, opacity: audioBuffer ? 1 : 0.4 }} title="Inverser la sélection ou tout l'audio">🔃 Inverser</button>
        <button onClick={() => { measureLUFS() }} disabled={!audioBuffer} style={{ ...btnGhost, opacity: audioBuffer ? 1 : 0.4, color: lufs ? (parseFloat(lufs) > -14 ? '#22c55e' : parseFloat(lufs) > -23 ? '#F59E0B' : '#EF4444') : undefined }} title="Mesurer le niveau LUFS (BS.1770)">
          📊 {lufs ? `${lufs} LUFS` : 'LUFS'}
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setLoopOn(!loopOn)} style={loopOn ? btnActive : btnGhost}>🔁 Loop</button>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="ase-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Left: Waveform + Transport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Transport bar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={togglePlay} style={{ ...btnPrimary, minWidth: 80, justifyContent: 'center' }}>{isPlaying ? '⏹ Stop' : '▶ Play'}</button>
            <button onClick={() => seekToTime(0)} style={btnGhost}>⏮ Début</button>
            <button onClick={() => seekToTime(Math.max(0, playhead - 5))} style={btnGhost}>⏪ -5s</button>
            <button onClick={() => seekToTime(Math.min(duration, playhead + 5))} style={btnGhost}>⏩ +5s</button>
            <div style={{ ...card, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <span style={{ color: '#0ea5e9', fontWeight: 700 }}>{fmtTime(playhead)}</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(duration)}</span>
            </div>
            <button onClick={startRecording} disabled={isRecording} style={{ ...btnDanger, opacity: isRecording ? 0.5 : 1 }}>● Enregistrer</button>
            {isRecording && <button onClick={stopRecording} style={{ ...btnDanger }}>⏹ Arrêter</button>}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Vitesse:
              <input type="range" min={0.25} max={2} step={0.05} value={playbackSpeed}
                onChange={e => { setPlaybackSpeed(Number(e.target.value)); if (sourceNodeRef.current) sourceNodeRef.current.playbackRate.value = Number(e.target.value) }}
                style={{ width: 80, accentColor: '#A855F7' }} />
              <span style={{ color: '#A855F7', fontWeight: 700, minWidth: 34 }}>{playbackSpeed.toFixed(2)}×</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zoom:
              <input type="range" min={0.5} max={50} step={0.5} value={zoom} onChange={e => { const z = Number(e.target.value); setZoom(z); if (audioBuffer) { const spp = Math.max(1, Math.floor(audioBuffer.length / (2000 * z))); setPeaks(computePeaks(audioBuffer, spp)); setScrollOffset(0) } }} style={{ width: 100, accentColor: '#0ea5e9' }} />
              <span>{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* File name */}
          {fileName && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>🎵 {fileName} · {audioBuffer?.numberOfChannels}ch · {audioBuffer?.sampleRate / 1000}kHz</div>}

          {/* Waveform Canvas */}
          <div style={{ ...card, padding: 0, overflow: 'hidden', position: 'relative', height: 240 }}
            onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) loadAudioFile(f) }}
          >
            <canvas
              ref={canvasRef}
              width={1200}
              height={240}
              style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'crosshair' : 'pointer' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleWheel}
            />
            {!audioBuffer && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12, pointerEvents: 'none' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,rgba(6,182,212,0.15),rgba(8,145,178,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎵</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Importez un fichier audio ou enregistrez</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Glissez-déposez un fichier audio ici, ou utilisez 📁 Importer</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 100, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>WAV · MP3 · OGG · FLAC</span>
              </div>
            )}
          </div>

          {/* Level meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, minWidth: 44, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niveau</span>
            <div style={{ flex: 1, height: 12, background: darkMode ? '#1a1a2e' : '#e2e8f0', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #22c55e 0%, #22c55e 70%, #f59e0b 85%, #ef4444 100%)', opacity: 0.25 }} />
              <div style={{ width: `${Math.min(100, (level / 255) * 100)}%`, height: '100%', background: level > 220 ? '#ef4444' : level > 180 ? '#f59e0b' : '#22c55e', borderRadius: 6, transition: 'width 0.05s linear', position: 'relative', zIndex: 1 }} />
              <div style={{ position: 'absolute', left: `${Math.min(98, (level / 255) * 100)}%`, top: 0, bottom: 0, width: 3, background: '#fff', borderRadius: 2, opacity: 0.7, transition: 'left 0.05s linear', zIndex: 2 }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'right' }}>{Math.round((level / 255) * 100)}%</span>
          </div>

          {/* Selection info */}
          {audioBuffer && selStart < selEnd && (
            <div style={{ ...card, padding: '10px 14px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Sélection :</span>
              <span>Début: <strong>{fmtTime(selStart)}</strong></span>
              <span>Fin: <strong>{fmtTime(selEnd)}</strong></span>
              <span>Durée: <strong style={{ color: '#0ea5e9' }}>{fmtTime(selEnd - selStart)}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Panel tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4 }}>
            {[{id:'effects',label:'🎛 Effets'},{id:'tts',label:'🗣 TTS'},{id:'files',label:'📁 Fichiers'}].map(t => (
              <button key={t.id} onClick={() => setSidePanel(t.id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', background: sidePanel === t.id ? 'rgba(14,165,233,0.15)' : 'transparent', color: sidePanel === t.id ? '#0ea5e9' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>{t.label}</button>
            ))}
          </div>

          {sidePanel === 'effects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Presets */}
              <div style={card}>
                <div style={sectionLabel}>Presets</div>
                <select value={selectedPreset} onChange={e => applyPreset(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                  {FX_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* EQ */}
              <div style={card}>
                <div style={sectionLabel}>Égaliseur 10 bandes</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {EQ_BANDS.map((b, i) => (
                    <div key={b.f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 45, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{b.label}</span>
                      <input type="range" min={-12} max={12} step={0.5} value={eqGains[i]} onChange={e => { const g = [...eqGains]; g[i] = Number(e.target.value); setEqGains(g); setSelectedPreset('flat') }} style={{ flex: 1, accentColor: eqGains[i] > 0 ? '#22c55e' : eqGains[i] < 0 ? '#ef4444' : '#0ea5e9' }} />
                      <span style={{ width: 36, fontSize: '0.75rem', textAlign: 'right', fontWeight: 700, color: eqGains[i] > 0 ? '#22c55e' : eqGains[i] < 0 ? '#ef4444' : 'var(--text-secondary)' }}>{eqGains[i] > 0 ? '+' : ''}{eqGains[i]}dB</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setEqGains(EQ_BANDS.map(() => 0)); setSelectedPreset('flat') }} style={{ ...btnGhost, marginTop: 10, fontSize: '0.75rem', width: '100%' }}>↺ Reset EQ</button>
              </div>

              {/* Filters */}
              <div style={card}>
                <div style={sectionLabel}>Filtres Pro</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Passe-haut (HPF)</span><span>{hpFreq}Hz</span></div>
                  <input type="range" min={20} max={1000} step={10} value={hpFreq} onChange={e => { setHpFreq(Number(e.target.value)); setSelectedPreset('flat') }} style={{ width: '100%', accentColor: '#06b6d4' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Passe-bas (LPF)</span><span>{lpFreq >= 10000 ? (lpFreq/1000).toFixed(0) + 'kHz' : lpFreq + 'Hz'}</span></div>
                  <input type="range" min={1000} max={20000} step={100} value={lpFreq} onChange={e => { setLpFreq(Number(e.target.value)); setSelectedPreset('flat') }} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                </div>
              </div>

              {/* Dynamics */}
              <div style={card}>
                <div style={sectionLabel}>Dynamique</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Threshold</span><span>{comp.thr}dB</span></div>
                  <input type="range" min={-60} max={0} step={1} value={comp.thr} onChange={e => setComp(p => ({...p, thr: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Ratio</span><span>{comp.ratio}:1</span></div>
                  <input type="range" min={1} max={20} step={0.5} value={comp.ratio} onChange={e => setComp(p => ({...p, ratio: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Attack</span><span>{(comp.atk * 1000).toFixed(0)}ms</span></div>
                    <input type="range" min={0.001} max={0.1} step={0.001} value={comp.atk} onChange={e => setComp(p => ({...p, atk: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Release</span><span>{(comp.rel * 1000).toFixed(0)}ms</span></div>
                    <input type="range" min={0.01} max={1} step={0.01} value={comp.rel} onChange={e => setComp(p => ({...p, rel: Number(e.target.value)}))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Limiter</span><span>{limiterCeiling}dB</span></div>
                  <input type="range" min={-6} max={0} step={0.1} value={limiterCeiling} onChange={e => setLimiterCeiling(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Noise Gate</span><span>{noiseGateThr}</span></div>
                  <input type="range" min={0.001} max={0.1} step={0.001} value={noiseGateThr} onChange={e => setNoiseGateThr(Number(e.target.value))} style={{ width: '100%', accentColor: '#22c55e' }} />
                </div>
              </div>

              {/* FX */}
              <div style={card}>
                <div style={sectionLabel}>Effets</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Réverbération</span><span>{Math.round(reverbAmount*100)}%</span></div>
                  <input type="range" min={0} max={1} step={0.01} value={reverbAmount} onChange={e => setReverbAmount(Number(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Stereo Width</span><span>{Math.round(stereoWidth*100)}%</span></div>
                  <input type="range" min={0} max={1} step={0.01} value={stereoWidth} onChange={e => setStereoWidth(Number(e.target.value))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Exciter</span><span>{Math.round(exciterAmount*100)}%</span></div>
                  <input type="range" min={0} max={1} step={0.01} value={exciterAmount} onChange={e => setExciterAmount(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b' }} />
                </div>
              </div>

              {/* Master */}
              <div style={card}>
                <div style={sectionLabel}>Master</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}><span>Gain Master</span><span>{Math.round(masterGain*100)}%</span></div>
                <input type="range" min={0} max={2} step={0.01} value={masterGain} onChange={e => setMasterGain(Number(e.target.value))} style={{ width: '100%', accentColor: '#22c55e' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={monitorEnabled} onChange={e => setMonitorEnabled(e.target.checked)} />
                  Monitoring (risque larsen)
                </label>
              </div>
            </div>
          )}

          {sidePanel === 'tts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={card}>
                <div style={sectionLabel}>Synthèse Vocale</div>
                <textarea value={ttsText} onChange={e => setTtsText(e.target.value)} rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Vitesse</div>
                    <input type="range" min={0.5} max={2} step={0.05} value={ttsRate} onChange={e => setTtsRate(Number(e.target.value))} style={{ width: '100%', accentColor: '#0ea5e9' }} />
                    <div style={{ fontSize: '0.7rem', textAlign: 'center', color: 'var(--text-muted)' }}>{ttsRate}x</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Pitch</div>
                    <input type="range" min={0.5} max={2} step={0.05} value={ttsPitch} onChange={e => setTtsPitch(Number(e.target.value))} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                    <div style={{ fontSize: '0.7rem', textAlign: 'center', color: 'var(--text-muted)' }}>{ttsPitch}</div>
                  </div>
                </div>
                <select value={ttsVoice} onChange={e => { setTtsVoice(e.target.value); setSelectedSample('') }} style={{ ...inputStyle, width: '100%', marginBottom: 10 }}>
                  {(() => {
                    const groups = {}
                    ttsVoices.forEach(v => { const l = v.lang || 'Unknown'; if (!groups[l]) groups[l] = []; groups[l].push(v) })
                    return Object.keys(groups).sort().map(lang => (
                      <optgroup key={lang} label={lang}>
                        {groups[lang].map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </optgroup>
                    ))
                  })()}
                  {voiceSamples.length > 0 && (
                    <optgroup label="Profils personnalisés">
                      {voiceSamples.map(s => <option key={`sample-${s.id}`} value={`sample-${s.id}`}>{s.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={speakTTS} disabled={ttsSpeaking} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>{ttsSpeaking ? '🔊 Lecture...' : '▶ Lire'}</button>
                  <button onClick={stopTTS} style={btnGhost}>⏹</button>
                </div>
                <button onClick={downloadTTS} disabled={ttsDownloading || !ttsText.trim()} style={{ ...btnPrimary, width: '100%', marginTop: 8, justifyContent: 'center', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                  {ttsDownloading ? '⏳ Génération...' : '⬇ Télécharger MP3'}
                </button>
                {ttsBlobUrl && (
                  <audio src={ttsBlobUrl} controls style={{ width: '100%', marginTop: 10 }} />
                )}
              </div>

              {/* Voice Clone */}
              <div style={card}>
                <div style={sectionLabel}>Voice Cloning</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>Enregistrez plusieurs échantillons, nommez-les, puis sélectionnez-les dans la liste TTS.</p>
                {!sampleRecording ? (
                  <button onClick={startSampleRecording} style={{ ...btnDanger, width: '100%', justifyContent: 'center', marginBottom: 8 }}>● Enregistrer échantillon</button>
                ) : (
                  <button onClick={stopSampleRecording} style={{ ...btnDanger, width: '100%', justifyContent: 'center', marginBottom: 8 }}>⏹ Arrêter l'enregistrement</button>
                )}
                {sampleBlob && (
                  <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                    <audio src={URL.createObjectURL(sampleBlob)} controls style={{ width: '100%' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={sampleName} onChange={e => setSampleName(e.target.value)} placeholder="Nom du profil" style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={saveVoiceSample} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>💾</button>
                    </div>
                  </div>
                )}
                {voiceSamples.map(s => {
                  const isSel = String(selectedSample) === String(s.id)
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: isSel ? 'rgba(14,165,233,0.1)' : 'transparent', border: isSel ? '1px solid #0ea5e9' : '1px solid transparent', marginBottom: 4 }}>
                      <span style={{ flex: 1, fontSize: '0.8rem' }}>{s.name}</span>
                      <button onClick={() => playVoiceSample(s.id)} style={{ ...btnGhost, fontSize: '0.7rem', padding: '4px 8px' }}>▶</button>
                      <button onClick={() => { setSelectedSample(String(s.id)); localStorage.setItem('abawi_selected_voice_sample', String(s.id)) }} style={{ ...btnGhost, fontSize: '0.7rem', padding: '4px 8px' }}>🎙</button>
                      <button onClick={() => deleteVoiceSample(s.id)} style={{ ...btnGhost, fontSize: '0.7rem', padding: '4px 8px', color: '#ef4444' }}>🗑</button>
                    </div>
                  )
                })}
                {selectedSample && (
                  <div style={{ marginTop: 6, padding: '6px 8px', background: 'rgba(14,165,233,0.08)', borderRadius: 6, color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 600 }}>
                    Actif: {voiceSamples.find(s => String(s.id) === selectedSample)?.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {sidePanel === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={card}>
                <div style={sectionLabel}>Transcription</div>
                <select value={transLang} onChange={e => setTransLang(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 10 }}>
                  {TRANSCRIBE_LANGS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {!transcribing ? (
                    <button onClick={startTranscription} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>🎤 Micro live</button>
                  ) : (
                    <button onClick={stopTranscription} style={{ ...btnDanger, flex: 1, justifyContent: 'center' }}>⏹ Arrêter</button>
                  )}
                  <button onClick={clearTranscript} style={btnGhost} title="Effacer">🗑</button>
                </div>
                <button onClick={transcribeWhisper} disabled={whisperLoading || !audioBuffer} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginBottom: 10, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', opacity: audioBuffer ? 1 : 0.5 }} title="Groq Whisper-large-v3 — supérieur au Web Speech API, supporte Wolof, Pulaar, français africain">
                  {whisperLoading ? '⏳ Whisper IA…' : '🤖 Whisper IA (Groq)'}
                </button>
                {transcript && (
                  <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 10, fontSize: '0.82rem', lineHeight: 1.5, maxHeight: 200, overflow: 'auto' }}>
                    {transcript}{interimTranscript && <span style={{ color: 'var(--text-muted)' }}> {interimTranscript}</span>}
                  </div>
                )}
                {transcript && <button onClick={copyTranscript} style={{ ...btnGhost, marginTop: 8, fontSize: '0.75rem', width: '100%' }}>📋 Copier transcription</button>}
              </div>

              {audioBlobUrl && (
                <div style={card}>
                  <div style={sectionLabel}>Audio en cours</div>
                  <audio src={audioBlobUrl} controls style={{ width: '100%' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{fileName || 'Enregistrement'}</p>
                </div>
              )}
              <div style={card}>
                <div style={sectionLabel}>Raccourcis clavier</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <div><strong>Espace</strong> — Play / Pause</div>
                  <div><strong>Ctrl+Z</strong> — Undo</div>
                  <div><strong>Ctrl+Shift+Z</strong> — Redo</div>
                  <div><strong>Ctrl+C</strong> — Copier sélection</div>
                  <div><strong>Ctrl+X</strong> — Couper sélection</div>
                  <div><strong>Ctrl+V</strong> — Coller</div>
                  <div><strong>Suppr</strong> — Supprimer sélection</div>
                  <div><strong>Ctrl+Molette</strong> — Zoom</div>
                  <div><strong>Molette</strong> — Scroll</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .ase-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: var(--border); outline: none; cursor: pointer; }
        .ase-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(135deg,#06b6d4,#0891b2); cursor: pointer; box-shadow: 0 2px 6px rgba(6,182,212,0.4); border: 2px solid #fff; transition: transform .15s; }
        .ase-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .ase-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(135deg,#06b6d4,#0891b2); cursor: pointer; box-shadow: 0 2px 6px rgba(6,182,212,0.4); border: 2px solid #fff; }
        @media (max-width: 768px) {
          .ase-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

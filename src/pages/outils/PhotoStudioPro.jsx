import { useCallback, useEffect, useRef, useState } from 'react'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const PRESETS = [
  { id: 'eu_id',         name: 'Identité / Visa UE (35×45 mm)',     detail: 'Format officiel UE — 413×531 px.',     aspectW: 35, aspectH: 45, outW: 413, outH: 531 },
  { id: 'us_2x2',        name: 'Passeport / Visa USA (2×2 po)',      detail: 'Carré strict — 600×600 px.',           aspectW: 1,  aspectH: 1,  outW: 600, outH: 600 },
  { id: 'embassy_45x35', name: 'Administration / Ambassade (45×35)', detail: '531×413 px.',                          aspectW: 45, aspectH: 35, outW: 531, outH: 413 },
  { id: 'bio_square',    name: 'Portrait pro réseaux (carré HD)',    detail: 'LinkedIn, mail, profils — 1080×1080.', aspectW: 1,  aspectH: 1,  outW: 1080, outH: 1080 },
  { id: 'bio_4_5',       name: 'Portrait vertical (4:5)',            detail: 'Instagram portrait — 1080×1350.',      aspectW: 4,  aspectH: 5,  outW: 1080, outH: 1350 },
]

const FILTER_PRESETS = [
  { id: 'auto',      label: '✨ Auto',         brightness: 1.04, contrast: 1.08, saturate: 1.05, warmth: 0.1,  sharpness: 0.35 },
  { id: 'studio',    label: '🎥 Studio Pro',   brightness: 1.08, contrast: 1.12, saturate: 1.08, warmth: 0.15, sharpness: 0.45 },
  { id: 'pro',       label: '💼 Professionnel',brightness: 1.03, contrast: 1.08, saturate: 1.0,  warmth: 0.05, sharpness: 0.4 },
  { id: 'warm',      label: '🌅 Portrait chaud',brightness: 1.05, contrast: 1.05, saturate: 1.15, warmth: 0.28, sharpness: 0.25 },
  { id: 'natural',   label: '🌿 Naturel',      brightness: 1.0,  contrast: 1.0,  saturate: 1.0,  warmth: 0.05, sharpness: 0.2 },
  { id: 'bw',        label: '⬛ Noir & Blanc',  brightness: 1.05, contrast: 1.2,  saturate: 0,    warmth: 0,    sharpness: 0.5 },
  { id: 'vintage',   label: '📷 Vintage',      brightness: 0.95, contrast: 1.05, saturate: 0.65, warmth: 0.35, sharpness: 0.15 },
  { id: 'crisp',     label: '🔬 Net & Précis', brightness: 1.02, contrast: 1.15, saturate: 1.05, warmth: 0,    sharpness: 0.7 },
]

/* ── Centre-crop depuis vidéo ── */
function centerCropFromVideo(video, aspectW, aspectH, targetW, targetH, filters) {
  const vw = video.videoWidth, vh = video.videoHeight
  if (!vw || !vh) return null
  const ta = aspectW / aspectH, va = vw / vh
  let sx, sy, sw, sh
  if (va > ta) { sh = vh; sw = vh * ta; sy = 0; sx = (vw - sw) / 2 }
  else          { sw = vw; sh = vw / ta; sx = 0; sy = (vh - sh) / 2 }
  const canvas = document.createElement('canvas')
  canvas.width = targetW; canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (filters) {
    const warm = filters.warmth > 0 ? ` sepia(${filters.warmth * 0.35})` : ''
    ctx.filter = `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturate})${warm}`
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH)
  ctx.filter = 'none'
  return canvas
}

/* ── Netteté ── */
function applySharpen(sourceCanvas, sharpness) {
  if (sharpness <= 0.05) return sourceCanvas
  const w = sourceCanvas.width, h = sourceCanvas.height
  const ctx0 = sourceCanvas.getContext('2d')
  if (!ctx0) return sourceCanvas
  const img = ctx0.getImageData(0, 0, w, h), d = img.data
  const out = ctx0.createImageData(w, h), od = out.data
  const k = sharpness * 0.4
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const center = d[i + c]
        const lap = -d[i - 4 + c] - d[i + 4 + c] - d[i - w * 4 + c] - d[i + w * 4 + c] + 4 * center
        od[i + c] = Math.min(255, Math.max(0, Math.round(center + k * lap)))
      }
      od[i + 3] = d[i + 3]
    }
  }
  const c2 = document.createElement('canvas')
  c2.width = w; c2.height = h
  c2.getContext('2d')?.putImageData(out, 0, 0)
  return c2
}

/* ── Suppression de fond par flood-fill depuis les bords ── */
function removeBackground(sourceCanvas, tolerance = 30) {
  const w = sourceCanvas.width, h = sourceCanvas.height
  if (w === 0 || h === 0) return sourceCanvas

  const ctx = sourceCanvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Échantillonner la couleur du fond depuis les bords
  const step = Math.max(1, Math.floor(Math.min(w, h) / 16))
  let rSum = 0, gSum = 0, bSum = 0, cnt = 0
  for (let x = 0; x < w; x += step) {
    let i = x * 4; rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]; cnt++
    i = ((h-1)*w + x) * 4; rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]; cnt++
  }
  for (let y = step; y < h - step; y += step) {
    let i = y*w*4; rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]; cnt++
    i = (y*w + w-1)*4; rSum += d[i]; gSum += d[i+1]; bSum += d[i+2]; cnt++
  }
  const bgR = rSum / cnt, bgG = gSum / cnt, bgB = bSum / cnt

  function colorDist(idx) {
    const dr = d[idx] - bgR, dg = d[idx+1] - bgG, db = d[idx+2] - bgB
    return Math.sqrt(dr*dr + dg*dg + db*db)
  }

  // BFS depuis tous les pixels de bord proches du fond
  const visited = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let qHead = 0, qTail = 0

  function seed(pos) {
    if (!visited[pos] && colorDist(pos * 4) < tolerance) {
      visited[pos] = 1; queue[qTail++] = pos
    }
  }

  for (let x = 0; x < w; x++) { seed(x); seed((h-1)*w + x) }
  for (let y = 1; y < h-1; y++) { seed(y*w); seed(y*w + w-1) }

  while (qHead < qTail) {
    const pos = queue[qHead++]
    // Pixel semi-transparent pour adoucir les bords
    const alpha = d[pos*4+3]
    d[pos*4+3] = Math.max(0, alpha - 255)

    const x = pos % w, y = Math.floor(pos / w)
    if (y > 0 && !visited[pos-w])   { const np = pos-w;   visited[np]=1; if (colorDist(np*4)<tolerance*1.15) queue[qTail++]=np }
    if (y < h-1 && !visited[pos+w]) { const np = pos+w;   visited[np]=1; if (colorDist(np*4)<tolerance*1.15) queue[qTail++]=np }
    if (x > 0 && !visited[pos-1])   { const np = pos-1;   visited[np]=1; if (colorDist(np*4)<tolerance*1.15) queue[qTail++]=np }
    if (x < w-1 && !visited[pos+1]) { const np = pos+1;   visited[np]=1; if (colorDist(np*4)<tolerance*1.15) queue[qTail++]=np }
  }

  // Créer un canvas avec fond transparent
  const result = document.createElement('canvas')
  result.width = w; result.height = h
  result.getContext('2d').putImageData(imageData, 0, 0)
  return result
}

/* ── Composer le sujet sur fond coloré ── */
function composeOnBackground(subjectCanvas, bgColor, w, h) {
  const out = document.createElement('canvas')
  out.width = w; out.height = h
  const ctx = out.getContext('2d')
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(subjectCanvas, 0, 0)
  return out
}

export default function PhotoStudioPro() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const baseCanvasRef = useRef(null)
  const subjectCanvasRef = useRef(null) // canvas après suppression fond
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  const [mode, setMode] = useState('photo') // 'photo' | 'video'
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0]
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [filterId, setFilterId] = useState('auto')
  const filter = FILTER_PRESETS.find(f => f.id === filterId) || FILTER_PRESETS[0]
  const [brightness, setBrightness] = useState(filter.brightness)
  const [contrast, setContrast] = useState(filter.contrast)
  const [saturate, setSaturate] = useState(filter.saturate)
  const [warmth, setWarmth] = useState(filter.warmth)
  const [sharpness, setSharpness] = useState(filter.sharpness)
  const [bgColor, setBgColor] = useState('white')
  const [bgRemoved, setBgRemoved] = useState(false)
  const [bgTolerance, setBgTolerance] = useState(30)
  const [bgRemoving, setBgRemoving] = useState(false)

  // Vidéo
  const [recording, setRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoBlob, setVideoBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    setRecording(false)
    clearInterval(timerRef.current)
  }

  useEffect(() => () => { stopCamera() }, [])

  async function startCamera() {
    setError('')
    setCameraLoading(true)
    stopCamera()
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      })
      streamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {})
          setCameraOn(true)
          setCameraLoading(false)
        }
      }
    } catch (e) {
      setCameraLoading(false)
      setError('Caméra inaccessible — autorisez l\'accès dans votre navigateur.')
    }
  }

  const applyRetouchFromBase = useCallback(() => {
    const base = bgRemoved ? subjectCanvasRef.current : baseCanvasRef.current
    if (!base) return
    const temp = document.createElement('canvas')
    temp.width = base.width; temp.height = base.height
    const ctx = temp.getContext('2d')
    if (!ctx) return
    if (bgColor !== 'transparent') { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, temp.width, temp.height) }
    const warm = warmth > 0 ? ` sepia(${warmth * 0.35})` : ''
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})${warm}`
    ctx.drawImage(base, 0, 0)
    ctx.filter = 'none'
    const sharpened = applySharpen(temp, sharpness)
    setPreviewUrl(sharpened.toDataURL('image/png'))
  }, [brightness, contrast, saturate, warmth, sharpness, bgColor, bgRemoved])

  useEffect(() => {
    if (baseCanvasRef.current) applyRetouchFromBase()
  }, [applyRetouchFromBase])

  function applyFilterPreset(fid) {
    setFilterId(fid)
    const f = FILTER_PRESETS.find(x => x.id === fid)
    if (!f) return
    setBrightness(f.brightness); setContrast(f.contrast)
    setSaturate(f.saturate); setWarmth(f.warmth); setSharpness(f.sharpness)
  }

  function capture() {
    const v = videoRef.current
    if (!v || !streamRef.current) { setError('Démarrez la caméra avant de capturer.'); return }
    const canvas = centerCropFromVideo(v, preset.aspectW, preset.aspectH, preset.outW, preset.outH, null)
    if (!canvas) { setError('Image vide — attendez que la caméra soit prête.'); return }
    baseCanvasRef.current = canvas
    subjectCanvasRef.current = null
    setBgRemoved(false)
    setError('')
    applyRetouchFromBase()
  }

  function handleRemoveBackground() {
    if (!baseCanvasRef.current) return
    setBgRemoving(true)
    // Utiliser setTimeout pour ne pas bloquer le thread principal
    setTimeout(() => {
      try {
        const subject = removeBackground(baseCanvasRef.current, bgTolerance)
        subjectCanvasRef.current = subject
        setBgRemoved(true)
      } catch (e) {
        setError('Erreur lors de la suppression du fond.')
      } finally {
        setBgRemoving(false)
      }
    }, 50)
  }

  function resetBackground() {
    subjectCanvasRef.current = null
    setBgRemoved(false)
  }

  function download(format) {
    if (!previewUrl) return
    const a = document.createElement('a')
    if (format === 'jpg') {
      const c = document.createElement('canvas')
      const img = new Image(); img.src = previewUrl
      img.onload = () => {
        c.width = img.width; c.height = img.height
        const ctx = c.getContext('2d')
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        const u = c.toDataURL('image/jpeg', 0.95)
        const a2 = document.createElement('a'); a2.href = u; a2.download = `photo-${preset.id}.jpg`; a2.click()
      }
      return
    }
    a.href = previewUrl
    a.download = `photo-${preset.id}.png`
    a.click()
  }

  async function sharePhoto() {
    if (!previewUrl) return
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const file = new File([blob], `photo-${preset.id}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Photo Studio ABAWI' })
      } else {
        download('png')
      }
    } catch (e) {
      download('png')
    }
  }

  // ── Enregistrement vidéo ──
  function startRecording() {
    if (!streamRef.current) return
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'
    recordedChunksRef.current = []
    const mr = new MediaRecorder(streamRef.current, { mimeType })
    mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      clearInterval(timerRef.current)
    }
    mr.start(100)
    mediaRecorderRef.current = mr
    setRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }

  function downloadVideo() {
    if (!videoBlob) return
    const a = document.createElement('a')
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
    a.href = videoUrl; a.download = `video-abawi.${ext}`; a.click()
  }

  async function shareVideo() {
    if (!videoBlob) return
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([videoBlob], `video-abawi.${ext}`, { type: videoBlob.type })
    try {
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Vidéo ABAWI Studio' })
      } else {
        downloadVideo()
      }
    } catch { downloadVideo() }
  }

  const sliders = [
    { key: 'brightness', label: 'Luminosité',   val: brightness, set: setBrightness, min: 0.7,  max: 1.4,  step: 0.01 },
    { key: 'contrast',   label: 'Contraste',     val: contrast,   set: setContrast,   min: 0.8,  max: 1.5,  step: 0.01 },
    { key: 'saturate',   label: 'Saturation',    val: saturate,   set: setSaturate,   min: 0,    max: 1.5,  step: 0.01 },
    { key: 'warmth',     label: 'Chaleur peau',  val: warmth,     set: setWarmth,     min: 0,    max: 0.5,  step: 0.01 },
    { key: 'sharpness',  label: 'Netteté',       val: sharpness,  set: setSharpness,  min: 0,    max: 1,    step: 0.01 },
  ]

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <main style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px) 80px' }}>
      <ToolInfoPanel
        toolName="Studio Photo ID Pro"
        icon="📸"
        description="Photos d'identité et portraits professionnels HD directement depuis votre webcam"
        benefits={[
          'Formats officiels prêts à l\'emploi : UE 35×45mm, USA 2×2", Ambassade 45×35mm',
          'Cadrage automatique et centrage intelligent du visage',
          'Filtres professionnels : Studio Pro, Portrait chaud, N&B, Vintage, Net & Précis',
          'Suppression de fond en un clic, correction auto luminosité/netteté',
          'Export HD PNG/JPG pour visa, CNI, passeport, LinkedIn, réseaux',
        ]}
        howToUse={[
          'Autorisez l\'accès à votre webcam quand demandé',
          'Choisissez le format de sortie (identité UE/USA ou portrait carré/vertical)',
          'Cadrez votre visage au centre, bon éclairage recommandé',
          'Appliquez un filtre (Auto fonctionne pour 80% des cas)',
          'Cliquez sur capturer, ajustez si besoin, exportez en PNG ou JPG',
        ]}
        tips={[
          'Pour visa/CNI : fond uni clair, regard vers l\'objectif, sans lunettes foncées',
          'Le filtre « Professionnel » est optimal pour LinkedIn et profils corporate',
          'Si fond complexe : utilisez la suppression de fond avant d\'exporter',
          'La webcam HD de votre ordinateur donne des résultats proches d\'un photomaton',
        ]}
      />
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #0c1a2e)', border: '1px solid #1E293B', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.7rem', letterSpacing: 2, marginBottom: 6 }}>ABAWI STUDIO PRO</div>
        <h1 style={{ color: '#F8FAFC', margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 900 }}>Studio Photo & Vidéo Pro</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.55, margin: 0 }}>
          Cadrage automatique, suppression de fond, filtres pro, enregistrement vidéo, export HD, partage réseaux.
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ id: 'photo', label: '📷 Mode Photo' }, { id: 'video', label: '🎬 Mode Vidéo' }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setVideoUrl(''); stopCamera() }} style={{
            padding: '10px 20px', borderRadius: 10, border: `2px solid ${mode === m.id ? '#38BDF8' : '#1E293B'}`,
            background: mode === m.id ? 'rgba(56,189,248,0.12)' : '#0F172A',
            color: mode === m.id ? '#38BDF8' : '#64748B', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mode === 'photo' && (
            <div style={card}>
              <div style={sectionLabel}>Format de sortie</div>
              <select value={presetId} onChange={e => { setPresetId(e.target.value); setPreviewUrl(''); baseCanvasRef.current = null; setBgRemoved(false) }} style={sel}>
                {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: 6 }}>Export : {preset.outW}×{preset.outH} px — ratio {preset.aspectW}:{preset.aspectH}</p>
            </div>
          )}

          {/* Camera view */}
          <div style={card}>
            <div style={sectionLabel}>Aperçu caméra {recording && <span style={{ color: '#ef4444', marginLeft: 8 }}>● {fmtTime(recordingTime)}</span>}</div>
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#020617', aspectRatio: mode === 'video' ? '16/9' : `${preset.aspectW} / ${preset.aspectH}`, maxHeight: 420 }}>
              <video
                ref={videoRef}
                playsInline muted={mode === 'photo'} autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
              />
              {!cameraOn && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#475569' }}>
                  <div style={{ fontSize: 48, opacity: 0.4 }}>{mode === 'video' ? '🎬' : '📷'}</div>
                  <div style={{ fontSize: '0.85rem' }}>{cameraLoading ? 'Activation...' : 'Caméra inactive'}</div>
                </div>
              )}
              {cameraOn && mode === 'photo' && (
                <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '55%', height: '70%', border: '2px dashed rgba(56,189,248,0.7)', borderRadius: '50% / 44%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
                </div>
              )}
              {recording && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 800 }}>
                  ● REC {fmtTime(recordingTime)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {!cameraOn ? (
                <button onClick={startCamera} disabled={cameraLoading} style={btnPrimary}>
                  {cameraLoading ? '⏳ Activation...' : `${mode === 'video' ? '🎬' : '📷'} Activer la caméra`}
                </button>
              ) : mode === 'photo' ? (
                <>
                  <button onClick={capture} style={{ ...btnPrimary, flex: 1 }}>📸 Capturer</button>
                  <button onClick={stopCamera} style={btnGhost}>⏹ Stop</button>
                </>
              ) : (
                <>
                  {!recording ? (
                    <button onClick={startRecording} style={{ ...btnPrimary, flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>● Enregistrer</button>
                  ) : (
                    <button onClick={stopRecording} style={{ ...btnPrimary, flex: 1, background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>⏹ Arrêter</button>
                  )}
                  <button onClick={stopCamera} style={btnGhost}>✕ Fermer</button>
                </>
              )}
            </div>
            {error && <p style={{ color: '#FCA5A5', fontSize: '0.82rem', marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{error}</p>}
          </div>

          {/* Vidéo enregistrée */}
          {mode === 'video' && videoUrl && (
            <div style={card}>
              <div style={sectionLabel}>Vidéo enregistrée</div>
              <video src={videoUrl} controls style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={downloadVideo} style={{ ...btnPrimary, justifyContent: 'center' }}>⬇ Télécharger</button>
                <button onClick={shareVideo} style={{ ...btnPrimary, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>↗ Partager</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { label: '📱 WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent('Vidéo ABAWI Studio')}` },
                  { label: '🐦 Twitter / X', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Vidéo ABAWI Studio')}` },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                    background: s.color + '22', border: `1px solid ${s.color}44`,
                    color: s.color, fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
                  }}>{s.label}</a>
                ))}
              </div>
              <button onClick={() => { setVideoUrl(''); setVideoBlob(null) }} style={{ ...btnGhost, marginTop: 8, width: '100%' }}>🔄 Nouvelle vidéo</button>
            </div>
          )}

          {/* Fond de la photo */}
          {mode === 'photo' && (
            <div style={card}>
              <div style={sectionLabel}>Fond de la photo</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'white',   label: 'Blanc',      color: '#ffffff' },
                  { id: '#f0f0f0', label: 'Gris clair', color: '#f0f0f0' },
                  { id: '#e8f0fe', label: 'Bleu admin', color: '#e8f0fe' },
                  { id: '#f5f0e8', label: 'Crème',      color: '#f5f0e8' },
                  { id: '#dceeff', label: 'Bleu ciel',  color: '#dceeff' },
                  { id: '#c8f0d0', label: 'Vert clair', color: '#c8f0d0' },
                  { id: 'transparent', label: 'Aucun',  color: null },
                ].map(b => (
                  <button key={b.id} onClick={() => setBgColor(b.id)} style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    border: `2px solid ${bgColor === b.id ? '#38BDF8' : '#1E293B'}`,
                    background: b.color || 'repeating-conic-gradient(#888 0% 25%, transparent 0% 50%) 0 0 / 12px 12px',
                    color: bgColor === b.id ? '#38BDF8' : '#64748B',
                    minWidth: 60,
                  }}>{b.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mode === 'photo' && (
            <>
              {/* Suppression de fond */}
              {baseCanvasRef.current && (
                <div style={{ ...card, borderColor: bgRemoved ? 'rgba(34,197,94,0.3)' : 'rgba(56,189,248,0.2)', background: bgRemoved ? 'rgba(34,197,94,0.04)' : 'rgba(56,189,248,0.04)' }}>
                  <div style={sectionLabel}>Suppression de fond IA</div>
                  <p style={{ color: '#64748B', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 12 }}>
                    Supprime le fond de votre photo par détection des couleurs de bordure. Fonctionne sur les fonds unis (blanc, bleu, crème…).
                  </p>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', marginBottom: 3 }}>
                      <span>Tolérance de couleur</span>
                      <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{bgTolerance}</span>
                    </div>
                    <input type="range" min={10} max={80} step={1} value={bgTolerance}
                      onChange={e => setBgTolerance(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#38BDF8' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569', marginTop: 2 }}>
                      <span>Précis</span><span>Large</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleRemoveBackground}
                      disabled={bgRemoving}
                      style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: bgRemoving ? 0.7 : 1 }}
                    >
                      {bgRemoving ? '⏳ Traitement...' : bgRemoved ? '🔁 Ré-appliquer' : '✂️ Supprimer le fond'}
                    </button>
                    {bgRemoved && (
                      <button onClick={resetBackground} style={btnGhost}>↩ Restaurer</button>
                    )}
                  </div>
                  {bgRemoved && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                      ✅ Fond supprimé — choisissez un fond de remplacement ci-dessous
                    </div>
                  )}
                </div>
              )}

              {/* Filtres */}
              <div style={card}>
                <div style={sectionLabel}>Filtres & Styles</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {FILTER_PRESETS.map(f => (
                    <button key={f.id} onClick={() => applyFilterPreset(f.id)} style={{
                      padding: '8px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${filterId === f.id ? '#38BDF8' : '#1E293B'}`,
                      background: filterId === f.id ? 'rgba(56,189,248,0.1)' : '#0F172A',
                      color: filterId === f.id ? '#38BDF8' : '#64748B',
                      fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.3,
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Réglages fins */}
              <div style={card}>
                <div style={sectionLabel}>Réglages fins</div>
                {sliders.map(s => (
                  <div key={s.key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', marginBottom: 3 }}>
                      <span>{s.label}</span>
                      <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>{s.val.toFixed(2)}</span>
                    </div>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                      onChange={e => { s.set(Number(e.target.value)); setFilterId('custom') }}
                      style={{ width: '100%', accentColor: '#38BDF8' }} />
                  </div>
                ))}
              </div>

              {/* Résultat & Export */}
              <div style={card}>
                <div style={sectionLabel}>Résultat & Export</div>
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Aperçu"
                      style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10, border: '1px solid #1E293B', background: bgColor === 'transparent' ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 20px 20px' : bgColor, marginBottom: 12 }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <button onClick={() => download('png')} style={{ ...btnPrimary, justifyContent: 'center' }}>⬇ PNG</button>
                      <button onClick={() => download('jpg')} style={{ ...btnPrimary, justifyContent: 'center', background: 'linear-gradient(135deg,#818cf8,#6366f1)' }}>⬇ JPEG</button>
                    </div>
                    <button onClick={sharePhoto} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)', marginBottom: 8 }}>
                      ↗ Partager la photo
                    </button>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { label: '📱 WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent('Photo ABAWI Studio')}` },
                        { label: '🔗 LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
                      ].map(s => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                          flex: 1, textAlign: 'center', padding: '7px', borderRadius: 8,
                          background: s.color + '22', border: `1px solid ${s.color}44`,
                          color: s.color, fontSize: '0.73rem', fontWeight: 700, textDecoration: 'none',
                        }}>{s.label}</a>
                      ))}
                    </div>
                    <button onClick={() => { baseCanvasRef.current = null; subjectCanvasRef.current = null; setPreviewUrl(''); setBgRemoved(false) }} style={{ ...btnGhost, marginTop: 8, width: '100%' }}>🔄 Recommencer</button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#334155' }}>
                    <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>🖼</div>
                    <div style={{ fontSize: '0.85rem' }}>Capturez une photo pour la voir ici.</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Conseils */}
          <div style={{ ...card, borderColor: 'rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.04)' }}>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginBottom: 8 }}>CONSEILS PRO</div>
            {(mode === 'photo' ? [
              'Placez votre visage dans le guide ovale.',
              'Fond uni clair pour une meilleure suppression automatique.',
              'Bonne luminosité frontale — évitez les contre-jours.',
              'Ajustez la tolérance selon la couleur de votre fond.',
            ] : [
              'Activez le son pour enregistrer votre voix.',
              'Restez stable pour une vidéo nette.',
              'Utilisez "Partager" pour envoyer directement sur WhatsApp ou Instagram.',
              'Téléchargez la vidéo pour un partage manuel sur les autres réseaux.',
            ]).map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                <span style={{ color: '#38BDF8', flexShrink: 0 }}>•</span>
                <span style={{ color: '#64748B', fontSize: '0.78rem', lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

const card  = { border: '1px solid #1E293B', borderRadius: 14, padding: 16, background: '#0F172A' }
const sectionLabel = { color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center' }
const sel   = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#020617', color: '#F1F5F9', fontSize: '0.85rem' }
const btnPrimary = { border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, color: '#0f172a', background: 'linear-gradient(135deg,#22d3ee,#38bdf8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const btnGhost  = { border: '1px solid #334155', borderRadius: 10, padding: '10px 16px', fontWeight: 600, color: '#E2E8F0', background: 'transparent', cursor: 'pointer' }

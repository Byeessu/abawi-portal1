import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToolAccess } from '../../hooks/useToolAccess'
import SEO from '../../components/SEO'
import ToolHero from '../../components/ToolHero'
import ToolAccessHeader from '../../components/ToolAccessHeader'
import ToolInfoPanel from '../../components/ToolInfoPanel'

/* ── Logo SVG Studio Photo & Vidéo Pro ── */
function StudioLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="32" height="24" rx="4" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <circle cx="20" cy="24" r="7" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
      <path d="M32 18L40 14V34L32 30" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="20" cy="24" r="2.5" fill="white"/>
    </svg>
  )
}

const PRESETS = [
  { id: 'eu_id',         name: 'Identité / Visa UE (35×45 mm)',     detail: 'Format officiel UE — 413×531 px.',     aspectW: 35, aspectH: 45, outW: 413, outH: 531 },
  { id: 'us_2x2',        name: 'Passeport / Visa USA (2×2 po)',      detail: 'Carré strict — 600×600 px.',           aspectW: 1,  aspectH: 1,  outW: 600, outH: 600 },
  { id: 'embassy_45x35', name: 'Administration / Ambassade (45×35)', detail: '531×413 px.',                          aspectW: 45, aspectH: 35, outW: 531, outH: 413 },
  { id: 'bio_square',    name: 'Portrait pro réseaux (carré HD)',    detail: 'LinkedIn, mail, profils — 1080×1080.', aspectW: 1,  aspectH: 1,  outW: 1080, outH: 1080 },
  { id: 'bio_4_5',       name: 'Portrait vertical (4:5)',            detail: 'Instagram portrait — 1080×1350.',      aspectW: 4,  aspectH: 5,  outW: 1080, outH: 1350 },
  { id: 'bio_16_9',      name: 'Bannière / Cover (16:9)',            detail: 'YouTube, LinkedIn cover — 1920×1080.', aspectW: 16, aspectH: 9,  outW: 1920, outH: 1080 },
  { id: 'bio_3_4',       name: 'Portrait classique (3:4)',          detail: 'CV, portfolio — 900×1200 px.',          aspectW: 3,  aspectH: 4,  outW: 900,  outH: 1200 },
  { id: 'bio_1_1_hd',    name: 'Avatar HD (1:1)',                   detail: 'Twitter, GitHub, Discord — 800×800.', aspectW: 1,  aspectH: 1,  outW: 800,  outH: 800 },
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
  { id: 'cinema',    label: '🎬 Cinéma',       brightness: 1.06, contrast: 1.18, saturate: 0.85, warmth: 0.08, sharpness: 0.35 },
  { id: 'hdr',       label: '⚡ HDR',           brightness: 1.12, contrast: 1.25, saturate: 1.2,  warmth: 0.02, sharpness: 0.55 },
  { id: 'softskin',  label: '✨ Peau douce',   brightness: 1.03, contrast: 0.95, saturate: 1.08, warmth: 0.18, sharpness: 0.1 },
  { id: 'night',     label: '🌙 Nuit',         brightness: 0.85, contrast: 1.3,  saturate: 0.75, warmth: 0.05, sharpness: 0.45 },
  { id: 'document',  label: '📄 Document',     brightness: 1.15, contrast: 1.35, saturate: 0.3,  warmth: 0,    sharpness: 0.8 },
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
/* ── Chargement script CDN dynamique ── */
function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

/* ── MediaPipe Selfie Segmentation — Suppression fond IA ── */
async function removeBackgroundAI(sourceCanvas) {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465578'
  await loadScript(`${CDN}/selfie_segmentation.js`)
  const SS = window.SelfieSegmentation
  if (!SS) throw new Error('MediaPipe non chargé')
  const seg = new SS({ locateFile: f => `${CDN}/${f}` })
  seg.setOptions({ modelSelection: 1 })
  const w = sourceCanvas.width, h = sourceCanvas.height

  const result = await new Promise((resolve, reject) => {
    seg.onResults(r => {
      try {
        const out = document.createElement('canvas')
        out.width = w; out.height = h
        const ctx = out.getContext('2d')
        ctx.drawImage(sourceCanvas, 0, 0)

        // Redimensionner le masque à la taille source
        const mc = document.createElement('canvas')
        mc.width = w; mc.height = h
        mc.getContext('2d').drawImage(r.segmentationMask, 0, 0, w, h)
        const maskD = mc.getContext('2d').getImageData(0, 0, w, h)

        const imgD = ctx.getImageData(0, 0, w, h)
        for (let i = 0; i < imgD.data.length; i += 4) {
          // Feather edges: alpha = mask * original_alpha
          const m = maskD.data[i] / 255
          imgD.data[i + 3] = Math.round(imgD.data[i + 3] * m)
        }
        ctx.putImageData(imgD, 0, 0)
        resolve(out)
      } catch(e) { reject(e) }
    })
    seg.send({ image: sourceCanvas })
  })
  seg.close()
  return result
}

/* ── Mise en page A4 — 4×3 photos pour impression ── */
function printA4Layout(imageUrl, presetName) {
  const img = new Image()
  img.onload = () => {
    const A4W = 2480, A4H = 3508 // A4 @ 300dpi
    const c = document.createElement('canvas')
    c.width = A4W; c.height = A4H
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, A4W, A4H)

    const cols = 3, rows = 4, margin = 90
    const pw = (A4W - margin * (cols + 1)) / cols
    const ph = (A4H - margin * (rows + 1)) / rows

    // Dessiner les photos + guides de découpe
    for (let r = 0; r < rows; r++) {
      for (let co = 0; co < cols; co++) {
        const x = margin + co * (pw + margin)
        const y = margin + r * (ph + margin)

        // Ombre légère
        ctx.shadowColor = 'rgba(0,0,0,0.08)'
        ctx.shadowBlur = 8
        ctx.drawImage(img, x, y, pw, ph)
        ctx.shadowBlur = 0

        // Guides de découpe (coins)
        ctx.strokeStyle = '#bbbbbb'
        ctx.lineWidth = 2
        const g = 16
        ;[[x-1,y-1,1,0],[x-1,y-1,0,1],[x+pw,y-1,-1,0],[x+pw,y-1,0,1],
          [x-1,y+ph,1,0],[x-1,y+ph,0,-1],[x+pw,y+ph,-1,0],[x+pw,y+ph,0,-1]
        ].forEach(([sx,sy,dx,dy]) => {
          ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+dx*g,sy+dy*g); ctx.stroke()
        })
      }
    }

    // Étiquette en bas
    ctx.font = '36px Arial'
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'center'
    ctx.fillText(`ABAWI Studio · ${presetName} · Format impression A4`, A4W / 2, A4H - 40)

    const link = document.createElement('a')
    link.download = 'photos-identite-A4.png'
    link.href = c.toDataURL('image/png', 0.95)
    link.click()
  }
  img.src = imageUrl
}

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
  const { membre } = useAuth()
  const tool = useToolAccess('studio', 'studio_photo')
  const [showPayment, setShowPayment] = useState(false)
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

  /* ── Studio Pro State ── */
  const [activeTab, setActiveTab] = useState('capture') // capture | retouch | export
  const [history, setHistory] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [watermark, setWatermark] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [customWidth, setCustomWidth] = useState(0)
  const [customHeight, setCustomHeight] = useState(0)
  const dropRef = useRef(null)
  const historyUrlsRef = useRef(new Set())
  const pendingLabelRef = useRef('')

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
    const watermarked = addWatermark(sharpened)
    const url = watermarked.toDataURL('image/png')
    setPreviewUrl(url)
    // Ajouter à l'historique si c'est une nouvelle image
    const label = pendingLabelRef.current || fileName
    if (label && !historyUrlsRef.current.has(url)) {
      historyUrlsRef.current.add(url)
      pushHistory(url, label)
      pendingLabelRef.current = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, saturate, warmth, sharpness, bgColor, bgRemoved, watermark, tool.unlimited])

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

  /* ── Chargement image depuis fichier ── */
  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setFileName(file.name)
    pendingLabelRef.current = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        baseCanvasRef.current = canvas
        subjectCanvasRef.current = null
        setBgRemoved(false)
        setError('')
        applyRetouchFromBase()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  /* ── Watermark ABAWI ── */
  function addWatermark(sourceCanvas) {
    if (!watermark || tool.unlimited) return sourceCanvas
    const w = sourceCanvas.width, h = sourceCanvas.height
    const out = document.createElement('canvas')
    out.width = w; out.height = h
    const ctx = out.getContext('2d')
    ctx.drawImage(sourceCanvas, 0, 0)
    const wmSize = Math.max(12, Math.floor(Math.min(w, h) * 0.04))
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${wmSize}px system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText('ABAWI Studio', w - 12, h - 12)
    ctx.globalAlpha = 1
    return out
  }

  /* ── Ajouter à l'historique ── */
  function pushHistory(url, label) {
    setHistory(prev => [{ url, label, ts: Date.now() }, ...prev].slice(0, 20))
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
    const label = `capture-${preset.id}-${Date.now()}`
    setFileName(label)
    pendingLabelRef.current = label
    applyRetouchFromBase()
    // Auto-switch vers retouch après capture
    setTimeout(() => setActiveTab('retouch'), 300)
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

  async function debitIfNeeded() {
    if (tool.unlimited) return true
    const res = await tool.debit()
    if (!res.ok) { setShowPayment(true); return false }
    return true
  }

  async function download(format) {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!previewUrl) return
    setExporting(true)
    const a = document.createElement('a')
    if (format === 'jpg') {
      const c = document.createElement('canvas')
      const img = new Image(); img.src = previewUrl
      img.onload = async () => {
        c.width = img.width; c.height = img.height
        const ctx = c.getContext('2d')
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        const u = c.toDataURL('image/jpeg', 0.95)
        const a2 = document.createElement('a'); a2.href = u; a2.download = `photo-${preset.id}.jpg`; a2.click()
        await debitIfNeeded()
        setExporting(false)
      }
      return
    }
    a.href = previewUrl
    a.download = `photo-${preset.id}.png`
    a.click()
    await debitIfNeeded()
    setExporting(false)
  }

  async function sharePhoto() {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!previewUrl) return
    try {
      const res = await fetch(previewUrl)
      const blob = await res.blob()
      const file = new File([blob], `photo-${preset.id}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Photo Studio ABAWI' })
        await debitIfNeeded()
      } else {
        await download('png')
      }
    } catch (e) {
      await download('png')
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

  async function downloadVideo() {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!videoBlob) return
    const a = document.createElement('a')
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
    a.href = videoUrl; a.download = `video-abawi.${ext}`; a.click()
    await debitIfNeeded()
  }

  async function shareVideo() {
    if (!tool.allowed) { setShowPayment(true); return }
    if (!videoBlob) return
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([videoBlob], `video-abawi.${ext}`, { type: videoBlob.type })
    try {
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Vidéo ABAWI Studio' })
        await debitIfNeeded()
      } else {
        await downloadVideo()
      }
    } catch { await downloadVideo() }
  }

  const sliders = [
    { key: 'brightness', label: 'Luminosité',   val: brightness, set: setBrightness, min: 0.7,  max: 1.4,  step: 0.01 },
    { key: 'contrast',   label: 'Contraste',     val: contrast,   set: setContrast,   min: 0.8,  max: 1.5,  step: 0.01 },
    { key: 'saturate',   label: 'Saturation',    val: saturate,   set: setSaturate,   min: 0,    max: 1.5,  step: 0.01 },
    { key: 'warmth',     label: 'Chaleur peau',  val: warmth,     set: setWarmth,     min: 0,    max: 0.5,  step: 0.01 },
    { key: 'sharpness',  label: 'Netteté',       val: sharpness,  set: setSharpness,  min: 0,    max: 1,    step: 0.01 },
  ]

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const PSP_CSS = `
    .psp-grid { display: grid; grid-template-columns: 1fr 360px; gap: 16px; }
    .psp-sidebar { display: flex; flex-direction: column; gap: 14px; }
    .psp-cam-area {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      max-height: 520px;
      width: 100%;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
      box-shadow: inset 0 0 40px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.25);
      border: 1px solid rgba(56,189,248,0.12);
    }
    .psp-cam-area video {
      background: #0f172a;
    }
    @media (max-width: 840px) {
      .psp-grid { grid-template-columns: 1fr !important; }
      .psp-sidebar { order: 2; }
      .psp-cam-area {
        max-height: 70vh !important;
        min-height: 280px;
        border-radius: 16px;
        box-shadow: inset 0 0 50px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.3);
      }
    }
    @media (max-width: 500px) {
      .psp-cam-area {
        max-height: 72vh !important;
        min-height: 240px;
        border-radius: 14px;
      }
    }
    .psp-recorded-video {
      width: 100%;
      max-height: 55vh;
      border-radius: 12px;
      margin-bottom: 12px;
      background: #0f172a;
    }
    @media (max-width: 500px) {
      .psp-recorded-video { max-height: 50vh; border-radius: 10px; }
    }
  `

  return (
    <main style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2.5vw, 40px) 80px' }}>
      <style>{PSP_CSS}</style>
      <SEO
        title="Studio Photo ID Pro — Passeport, visa & portrait pro"
        description="Studio photo professionnel dans votre navigateur : formats UE, USA, administration, portrait LinkedIn. Webcam HD, filtres, retouche express, export PNG/JPG haute résolution."
        keywords="photo identité Sénégal, passeport photo, visa photo, portrait pro, photo LinkedIn, studio photo en ligne"
        image="/og-tools/photo-studio-pro.jpg"
      />
      <ToolHero title="Studio Photo & Vidéo Pro" subtitle="Studio photo professionnel — formats identité, portrait pro, suppression de fond, filtres temps réel, export HD" icon={<StudioLogo size={40} />} />
      <ToolAccessHeader toolAccess={tool} toolName="Studio Photo & Vidéo Pro" />
      <ToolInfoPanel
        toolName="Studio Photo & Vidéo Pro"
        icon="📸"
        description="Photos d'identité, portraits professionnels et vidéos HD directement depuis votre navigateur"
        benefits={[
          '13 formats officiels & réseaux : UE, USA, LinkedIn, YouTube, Instagram, CV…',
          '13 filtres professionnels : Studio Pro, Cinéma, HDR, Peau douce, N&B…',
          'Suppression de fond IA par flood-fill intelligent avec tolérance réglable',
          'Import drag & drop, webcam HD, enregistrement vidéo avec audio',
          'Export PNG/JPG HD avec watermark optionnel, partage natif WhatsApp/LinkedIn',
        ]}
        howToUse={[
          'Importez une photo (glisser-déposer ou webcam) ou enregistrez une vidéo',
          'Choisissez le format de sortie ou dimensions personnalisées',
          'Appliquez un filtre pro puis ajustez luminosité, contraste, netteté',
          'Supprimez le fond si besoin et choisissez un fond de remplacement',
          'Exportez en PNG/JPG HD ou partagez directement',
        ]}
        tips={[
          'Pour visa/CNI : fond uni clair, regard vers l\'objectif, sans lunettes foncées',
          'Le filtre « Cinéma » est optimal pour portraits artistiques et couvertures',
          'Importez une photo existante via drag & drop pour la retoucher',
          'La suppression de fond fonctionne mieux sur les fonds unis (blanc, bleu)',
        ]}
      />
      {showPayment && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', borderRadius: 12, marginBottom: 20, color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
          Cet outil nécessite un abonnement. <a href="/abonnement" style={{ color: '#b45309', textDecoration: 'underline' }}>Voir les offres</a>
        </div>
      )}

      {/* ── TOOLBAR PRO ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)' }}>
        <label style={{ ...btnPrimary, cursor: 'pointer' }}>
          <input type="file" accept="image/*" onChange={e => { loadImageFile(e.target.files[0]); e.target.value = '' }} style={{ display: 'none' }} />
          📁 Importer
        </label>
        <button onClick={() => { baseCanvasRef.current = null; subjectCanvasRef.current = null; setPreviewUrl(''); setBgRemoved(false); setFileName('') }} style={btnGhost}>🗑 Effacer</button>
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
        <button onClick={() => setWatermark(w => !w)} style={watermark ? btnActive : btnGhost}>{watermark ? '🔒' : '🔓'} Watermark</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'photo', label: '📷 Photo' }, { id: 'video', label: '🎬 Vidéo' }].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setVideoUrl(''); stopCamera(); setActiveTab('capture') }} style={{
              padding: '8px 16px', borderRadius: 10, border: `2px solid ${mode === m.id ? '#38BDF8' : 'var(--border)'}`,
              background: mode === m.id ? 'rgba(56,189,248,0.12)' : 'var(--bg-card)',
              color: mode === m.id ? '#38BDF8' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[
          { id: 'capture', label: '📷 Capturer' },
          { id: 'retouch', label: '🎨 Retoucher' },
          { id: 'export',  label: '💾 Exporter' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
            background: activeTab === t.id ? 'rgba(56,189,248,0.15)' : 'transparent',
            color: activeTab === t.id ? '#38BDF8' : 'var(--text-muted)',
            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB CONTENT
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'capture' && (
        <div className="psp-grid">
          {/* ── Left: Preview & Controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'photo' && (
              <div style={card}>
                <div style={sectionLabel}>Format de sortie</div>
                <select value={presetId} onChange={e => { setPresetId(e.target.value); setPreviewUrl(''); baseCanvasRef.current = null; setBgRemoved(false) }} style={sel}>
                  {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>Export : {preset.outW}×{preset.outH} px — ratio {preset.aspectW}:{preset.aspectH}</p>
              </div>
            )}

            {/* Camera / Drop zone */}
            <div style={card}>
              <div style={sectionLabel}>{fileName ? `📁 ${fileName}` : (mode === 'video' ? 'Aperçu vidéo' : 'Aperçu caméra')} {recording && <span style={{ color: '#ef4444', marginLeft: 8 }}>● {fmtTime(recordingTime)}</span>}</div>
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadImageFile(f) }}
                className="psp-cam-area"
                style={{ background: dragOver ? 'rgba(56,189,248,0.1)' : 'var(--bg-primary)', border: dragOver ? '2px dashed #38BDF8' : '2px dashed transparent', aspectRatio: mode === 'video' ? '16/9' : `${preset.aspectW} / ${preset.aspectH}` }}
              >
                <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain', display: cameraOn ? 'block' : 'none' }} />
                {!cameraOn && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 48, opacity: 0.4 }}>{mode === 'video' ? '🎬' : '📷'}</div>
                    <div style={{ fontSize: '0.85rem', textAlign: 'center', padding: '0 20px' }}>
                      {cameraLoading ? 'Activation...' : dragOver ? 'Déposez votre image ici' : (mode === 'photo' ? 'Caméra inactive — activez ou glissez une photo' : 'Caméra inactive — activez pour enregistrer')}
                    </div>
                  </div>
                )}
                {cameraOn && mode === 'photo' && (
                  <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '55%', height: '70%', border: '2px dashed rgba(56,189,248,0.7)', borderRadius: '50% / 44%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
                  </div>
                )}
                {recording && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 800 }}>● REC {fmtTime(recordingTime)}</div>
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
                <video src={videoUrl} controls className="psp-recorded-video" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={downloadVideo} style={{ ...btnPrimary, justifyContent: 'center' }}>⬇ Télécharger</button>
                  <button onClick={shareVideo} style={{ ...btnPrimary, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>↗ Partager</button>
                </div>
                <button onClick={() => { setVideoUrl(''); setVideoBlob(null) }} style={{ ...btnGhost, marginTop: 8, width: '100%' }}>🔄 Nouvelle vidéo</button>
              </div>
            )}
          </div>

          {/* ── Right: History & Tips ── */}
          <div className="psp-sidebar">
            {/* Historique */}
            {history.length > 0 && (
              <div style={card}>
                <div style={sectionLabel}>Historique ({history.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <div key={i} onClick={() => { setPreviewUrl(h.url); setActiveTab('export') }} style={{
                      display: 'flex', gap: 10, alignItems: 'center', padding: 8, borderRadius: 10, cursor: 'pointer',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    }}>
                      <img src={h.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(h.ts).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setHistory([])} style={{ ...btnGhost, marginTop: 8, width: '100%', fontSize: '0.75rem', padding: '6px' }}>� Vider l'historique</button>
              </div>
            )}

            <div style={{ ...card, borderColor: 'rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.04)' }}>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700, marginBottom: 8 }}>CONSEILS PRO</div>
              {(mode === 'photo' ? [
                'Placez votre visage dans le guide ovale.',
                'Fond uni clair pour une meilleure suppression automatique.',
                'Bonne luminosité frontale — évitez les contre-jours.',
                'Glissez-déposez une photo existante pour la retoucher.',
              ] : [
                'Activez le son pour enregistrer votre voix.',
                'Restez stable pour une vidéo nette.',
                'Utilisez "Partager" pour envoyer directement sur WhatsApp.',
                'Téléchargez la vidéo pour un partage manuel sur les autres réseaux.',
              ]).map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                  <span style={{ color: '#38BDF8', flexShrink: 0 }}>•</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'retouch' && mode === 'photo' && (
        <div className="psp-grid">
          {/* Left: Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={sectionLabel}>Aperçu retouché</div>
              {previewUrl ? (
                <img src={previewUrl} alt="Aperçu" style={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 10, border: '1px solid #1E293B', background: bgColor === 'transparent' ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 20px 20px' : bgColor }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 16px', color: '#334155' }}>
                  <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>🖼</div>
                  <div style={{ fontSize: '0.85rem' }}>Importez ou capturez une photo pour la retoucher.</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Suppression de fond */}
            {baseCanvasRef.current && (
              <div style={{ ...card, borderColor: bgRemoved ? 'rgba(34,197,94,0.3)' : 'rgba(56,189,248,0.2)', background: bgRemoved ? 'rgba(34,197,94,0.04)' : 'rgba(56,189,248,0.04)' }}>
                <div style={sectionLabel}>Suppression de fond IA</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 12 }}>
                  Supprime le fond par détection des couleurs de bordure. Fonctionne sur les fonds unis (blanc, bleu, crème…).
                </p>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 3 }}>
                    <span>Tolérance</span><span style={{ fontFamily: 'monospace' }}>{bgTolerance}</span>
                  </div>
                  <input type="range" min={10} max={80} step={1} value={bgTolerance} onChange={e => setBgTolerance(Number(e.target.value))} style={{ width: '100%', accentColor: '#38BDF8' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleRemoveBackground} disabled={bgRemoving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: bgRemoving ? 0.7 : 1 }}>
                    {bgRemoving ? '⏳...' : bgRemoved ? '🔁 Ré-appliquer' : '✂️ Classique'}
                  </button>
                  <button onClick={async () => {
                    if (!baseCanvasRef.current || bgRemoving) return
                    setBgRemoving(true)
                    try {
                      const result = await removeBackgroundAI(baseCanvasRef.current)
                      subjectCanvasRef.current = result
                      setBgRemoved(true)
                      applyRetouchFromBase()
                      if (navigator.vibrate) navigator.vibrate(60)
                    } catch(e) {
                      alert('Erreur IA : ' + e.message + '\n\nVérifiez votre connexion (modèle MediaPipe requis).')
                    } finally { setBgRemoving(false) }
                  }} disabled={bgRemoving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', opacity: bgRemoving ? 0.7 : 1 }} title="Segmentation IA via MediaPipe — précision portrait">
                    {bgRemoving ? '⏳ IA...' : '🤖 IA Fond'}
                  </button>
                  {bgRemoved && <button onClick={resetBackground} style={btnGhost}>↩</button>}
                </div>
                {bgRemoved && <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>✅ Fond supprimé</div>}
              </div>
            )}

            {/* Fond de remplacement */}
            <div style={card}>
              <div style={sectionLabel}>Fond de remplacement</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: '#ffffff', label: 'Blanc', color: '#ffffff', title: 'Norme UE/USA/Sénégal' },
                  { id: '#e8f0fe', label: 'Bleu passeport', color: '#e8f0fe', title: 'CEDEAO / Administration' },
                  { id: '#3A5BA0', label: 'Bleu foncé', color: '#3A5BA0', title: 'Visa certains pays' },
                  { id: '#f0f0f0', label: 'Gris clair', color: '#f0f0f0', title: 'Portrait pro' },
                  { id: '#f5f0e8', label: 'Crème', color: '#f5f0e8', title: 'Portrait élégant' },
                  { id: '#C8392B', label: 'Rouge', color: '#C8392B', title: 'Certaines administrations' },
                  { id: 'transparent', label: 'Transparent', color: null, title: 'PNG sans fond' },
                ].map(b => (
                  <button key={b.id} onClick={() => setBgColor(b.id)} style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    border: `2px solid ${bgColor === b.id ? '#38BDF8' : '#1E293B'}`,
                    background: b.color || 'repeating-conic-gradient(#888 0% 25%, transparent 0% 50%) 0 0 / 12px 12px',
                    color: bgColor === b.id ? '#38BDF8' : '#64748B', minWidth: 60,
                  }}>{b.label}</button>
                ))}
              </div>
            </div>

            {/* Filtres */}
            <div style={card}>
              <div style={sectionLabel}>Filtres & Styles</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 3 }}>
                    <span>{s.label}</span>
                    <span style={{ fontFamily: 'monospace' }}>{s.val.toFixed(2)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                    onChange={e => { s.set(Number(e.target.value)); setFilterId('custom') }}
                    style={{ width: '100%', accentColor: '#38BDF8' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && mode === 'photo' && (
        <div className="psp-grid">
          {/* Left: Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={sectionLabel}>Aperçu final</div>
              {previewUrl ? (
                <img src={previewUrl} alt="Aperçu" style={{ width: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: 10, border: '1px solid #1E293B', background: bgColor === 'transparent' ? 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 20px 20px' : bgColor }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 16px', color: '#334155' }}>
                  <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.4 }}>🖼</div>
                  <div style={{ fontSize: '0.85rem' }}>Rien à exporter pour le moment.</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Export tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {previewUrl && (
              <>
                <div style={card}>
                  <div style={sectionLabel}>Export HD</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => download('png')} disabled={exporting} style={{ ...btnPrimary, justifyContent: 'center', opacity: exporting ? 0.6 : 1 }}>{exporting ? '⏳ Export...' : '⬇ PNG'}</button>
                    <button onClick={() => download('jpg')} disabled={exporting} style={{ ...btnPrimary, justifyContent: 'center', background: 'linear-gradient(135deg,#818cf8,#6366f1)', opacity: exporting ? 0.6 : 1 }}>{exporting ? '⏳ Export...' : '⬇ JPEG'}</button>
                  </div>
                  <button onClick={sharePhoto} disabled={exporting} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)', marginBottom: 8, opacity: exporting ? 0.6 : 1 }}>↗ Partager</button>
                  <button onClick={() => previewUrl && printA4Layout(previewUrl, preset.name)} disabled={!previewUrl} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#F59E0B,#D97706)', marginBottom: 8, color: '#0a0a0a', opacity: !previewUrl ? 0.5 : 1 }} title="Mise en page 4×3 photos sur A4 pour impression">🖨️ Imprimer A4 (12 photos)</button>
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
                </div>

                <div style={card}>
                  <div style={sectionLabel}>Options</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <input type="checkbox" id="wm" checked={watermark} onChange={e => setWatermark(e.target.checked)} style={{ accentColor: '#38BDF8' }} />
                    <label htmlFor="wm" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Watermark ABAWI Studio (gratuit)</label>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {tool.unlimited
                      ? '✅ Compte premium — export sans watermark illimité.'
                      : '💡 Les membres premium peuvent désactiver le watermark et exporter sans limite.'}
                  </p>
                </div>
              </>
            )}

            {/* Dimensions custom */}
            <div style={card}>
              <div style={sectionLabel}>Dimensions personnalisées</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input type="number" placeholder="Largeur" value={customWidth || ''} onChange={e => setCustomWidth(Number(e.target.value))} style={{ ...sel, flex: 1 }} />
                <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>×</span>
                <input type="number" placeholder="Hauteur" value={customHeight || ''} onChange={e => setCustomHeight(Number(e.target.value))} style={{ ...sel, flex: 1 }} />
              </div>
              <button onClick={() => {
                if (!customWidth || !customHeight || !baseCanvasRef.current) return
                const c = document.createElement('canvas')
                c.width = customWidth; c.height = customHeight
                const ctx = c.getContext('2d')
                ctx.drawImage(baseCanvasRef.current, 0, 0, customWidth, customHeight)
                baseCanvasRef.current = c
                applyRetouchFromBase()
              }} disabled={!customWidth || !customHeight} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: (!customWidth || !customHeight) ? 0.5 : 1 }}>📐 Redimensionner</button>
            </div>

            <button onClick={() => { baseCanvasRef.current = null; subjectCanvasRef.current = null; setPreviewUrl(''); setBgRemoved(false); setFileName(''); setActiveTab('capture') }} style={{ ...btnGhost, width: '100%' }}>🔄 Nouvelle photo</button>
          </div>
        </div>
      )}
    </main>
  )
}

const card  = { border: '1px solid var(--border)', borderRadius: 14, padding: 16, background: 'var(--bg-card)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }
const sectionLabel = { color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center' }
const sel   = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }
const btnPrimary = { border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, color: '#0f172a', background: 'linear-gradient(135deg,#22d3ee,#38bdf8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const btnGhost  = { border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', cursor: 'pointer' }
const btnActive = { border: '1px solid #38BDF8', borderRadius: 10, padding: '10px 16px', fontWeight: 600, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', cursor: 'pointer' }

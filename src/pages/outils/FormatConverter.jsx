import { useState, useRef, useCallback } from 'react'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

// ─── Compatibility matrix ────────────────────────────────────────────────────
const COMPAT = {
  // Images (Canvas API)
  png:  ['jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif', 'tiff', 'svg'],
  jpg:  ['png', 'webp', 'gif', 'bmp', 'ico', 'avif', 'tiff', 'svg'],
  jpeg: ['png', 'webp', 'gif', 'bmp', 'ico', 'avif', 'tiff', 'svg'],
  webp: ['png', 'jpeg', 'gif', 'bmp', 'ico', 'avif', 'tiff', 'svg'],
  gif:  ['png', 'jpeg', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'svg'],
  bmp:  ['png', 'jpeg', 'webp', 'gif', 'ico', 'avif', 'tiff', 'svg'],
  ico:  ['png', 'jpeg', 'webp', 'gif', 'bmp', 'avif', 'svg'],
  svg:  ['png', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif', 'tiff'],
  avif: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'tiff', 'svg'],
  tiff: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif', 'svg'],
  tif:  ['png', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'avif', 'svg'],
  heic: ['png', 'jpeg', 'webp', 'bmp'],
  heif: ['png', 'jpeg', 'webp', 'bmp'],
  hec:  ['png', 'jpeg', 'webp', 'bmp', 'heic', 'heif'],
  // Audio (Web Audio API + encoders)
  mp3:  ['wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'webm', 'weba'],
  wav:  ['mp3', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'webm', 'weba'],
  aiff: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'webm', 'weba'],
  flac: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'webm', 'weba'],
  ogg:  ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'webm', 'weba'],
  wma:  ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  aac:  ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'opus', 'webm', 'weba'],
  m4a:  ['mp3', 'wav', 'ogg', 'flac', 'aac', 'opus', 'webm', 'weba'],
  opus: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'webm', 'weba'],
  weba: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'],
  // Video (ffmpeg.wasm)
  mp4:  ['webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac', 'png', 'jpeg', 'webp'],
  webm: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac', 'png', 'jpeg', 'webp'],
  avi:  ['mp4', 'webm', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac', 'png', 'jpeg', 'webp'],
  mov:  ['mp4', 'webm', 'avi', 'mkv', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac', 'png', 'jpeg', 'webp'],
  mkv:  ['mp4', 'webm', 'avi', 'mov', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac', 'png', 'jpeg', 'webp'],
  flv:  ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac'],
  wmv:  ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac'],
  mpeg: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ogv', 'gif', 'mp3', 'wav', 'aac'],
  mpg:  ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ogv', 'gif', 'mp3', 'wav', 'aac'],
  '3gp': ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'ogv', 'gif', 'mp3', 'wav', 'aac'],
  ogv:  ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'gif', 'mp3', 'wav', 'aac'],
  // Documents
  docx: ['txt', 'html', 'md', 'pdf', 'rtf', 'odt'],
  doc:  ['txt', 'html', 'md', 'pdf', 'rtf', 'odt'],
  odt:  ['txt', 'html', 'md', 'pdf'],
  rtf:  ['txt', 'html', 'md', 'pdf'],
  txt:  ['html', 'md', 'pdf', 'rtf', 'odt', 'docx'],
  md:   ['html', 'txt', 'pdf', 'rtf', 'odt', 'docx'],
  html: ['txt', 'md', 'pdf', 'rtf', 'odt', 'docx'],
  htm:  ['txt', 'md', 'pdf', 'rtf', 'odt', 'docx'],
  pdf:  ['txt', 'html', 'md', 'docx'],
  epub: ['txt', 'html', 'md', 'pdf'],
  // Data
  json: ['csv', 'tsv', 'xml', 'yaml', 'yml', 'xlsx', 'sql', 'ndjson'],
  csv:  ['json', 'tsv', 'xml', 'yaml', 'yml', 'xlsx', 'sql', 'ndjson'],
  tsv:  ['json', 'csv', 'xml', 'xlsx', 'sql', 'ndjson'],
  xml:  ['json', 'csv', 'tsv', 'xlsx', 'sql', 'yaml', 'yml'],
  yaml: ['json', 'csv', 'tsv', 'xml', 'xlsx', 'sql'],
  yml:  ['json', 'csv', 'tsv', 'xml', 'xlsx', 'sql'],
  xlsx: ['json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'sql', 'ndjson'],
  xls:  ['json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'sql', 'ndjson'],
  ods:  ['json', 'csv', 'tsv', 'xml', 'xlsx'],
  sql:  ['json', 'csv', 'tsv', 'xml', 'yaml'],
  ndjson: ['json', 'csv', 'tsv', 'xml', 'yaml'],
}

const FORMAT_LABELS = {
  png: 'PNG', jpeg: 'JPEG', jpg: 'JPEG', webp: 'WebP', gif: 'GIF', bmp: 'BMP', svg: 'SVG', ico: 'ICO',
  avif: 'AVIF', tiff: 'TIFF', tif: 'TIFF', heic: 'HEIC', heif: 'HEIF', hec: 'HEC (HEIC)',
  mp3: 'MP3', wav: 'WAV', aiff: 'AIFF', flac: 'FLAC', ogg: 'OGG Vorbis', wma: 'WMA',
  aac: 'AAC', m4a: 'M4A (AAC)', opus: 'Opus', weba: 'WebM Audio',
  mp4: 'MP4 (H.264)', webm: 'WebM', avi: 'AVI', mov: 'MOV (QuickTime)',
  mkv: 'MKV (Matroska)', flv: 'FLV', wmv: 'WMV', mpeg: 'MPEG', mpg: 'MPEG',
  '3gp': '3GP', ogv: 'OGG Theora',
  json: 'JSON', csv: 'CSV', tsv: 'TSV', xml: 'XML', yaml: 'YAML', yml: 'YAML',
  xlsx: 'Excel (XLSX)', xls: 'Excel (XLS)', ods: 'OpenDocument Sheet',
  sql: 'SQL', ndjson: 'NDJSON',
  docx: 'Word (DOCX)', doc: 'Word (DOC)', odt: 'OpenDocument Text',
  rtf: 'RTF', txt: 'Texte brut', html: 'HTML', htm: 'HTML',
  md: 'Markdown', pdf: 'PDF', epub: 'EPUB',
}

const FORMAT_ICONS = {
  png: '🖼', jpeg: '🖼', jpg: '🖼', webp: '🖼', gif: '🖼', bmp: '🖼', svg: '🖼', ico: '🖼',
  avif: '🖼', tiff: '🖼', tif: '🖼', heic: '🖼', heif: '🖼', hec: '🖼',
  mp3: '🎵', wav: '🔊', aiff: '🔊', flac: '🎵', ogg: '🎵', wma: '🎵',
  aac: '🎵', m4a: '🎵', opus: '🎵', weba: '🎵',
  mp4: '🎬', webm: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬', flv: '🎬',
  wmv: '🎬', mpeg: '🎬', mpg: '🎬', '3gp': '📱', ogv: '🎬',
  json: '{}', csv: '📊', tsv: '📊', xml: '📰', yaml: '📋', yml: '📋',
  xlsx: '📊', xls: '📊', ods: '📊', sql: '🗄', ndjson: '{}',
  docx: '📝', doc: '📝', odt: '📝', rtf: '📝', txt: '📄', html: '🌐', htm: '🌐',
  md: '📑', pdf: '📕', epub: '📚',
}

const MIME_TYPES = {
  png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  bmp: 'image/bmp', ico: 'image/x-icon', svg: 'image/svg+xml', avif: 'image/avif',
  tiff: 'image/tiff', tif: 'image/tiff', hec: 'image/heic',
  mp3: 'audio/mpeg', wav: 'audio/wav', aiff: 'audio/aiff', flac: 'audio/flac',
  ogg: 'audio/ogg', wma: 'audio/x-ms-wma', aac: 'audio/aac', m4a: 'audio/mp4',
  opus: 'audio/opus', weba: 'audio/webm',
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', mov: 'video/quicktime',
  mkv: 'video/x-matroska', flv: 'video/x-flv', wmv: 'video/x-ms-wmv',
  mpeg: 'video/mpeg', mpg: 'video/mpeg', '3gp': 'video/3gpp', ogv: 'video/ogg',
  json: 'application/json', csv: 'text/csv', tsv: 'text/tab-separated-values',
  xml: 'application/xml', yaml: 'text/yaml', yml: 'text/yaml',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel', ods: 'application/vnd.oasis.opendocument.spreadsheet',
  sql: 'text/plain', ndjson: 'application/x-ndjson',
  txt: 'text/plain', html: 'text/html', md: 'text/markdown', pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword', odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf', epub: 'application/epub+zip',
}

// ─── Image conversion ────────────────────────────────────────────────────────
function encodeBmp(canvas) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { width, height, data } = imageData
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const pixelArraySize = rowSize * height
  const fileSize = 54 + pixelArraySize
  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)
  const u8 = new Uint8Array(buffer)
  view.setUint16(0, 0x4D42, true)
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, 54, true)
  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = ((height - 1 - y) * width + x) * 4
      const dstIdx = 54 + (y * rowSize) + (x * 3)
      u8[dstIdx] = data[srcIdx + 2]
      u8[dstIdx + 1] = data[srcIdx + 1]
      u8[dstIdx + 2] = data[srcIdx]
    }
  }
  return new Blob([buffer], { type: 'image/bmp' })
}

async function convertImage(file, toExt) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (toExt === 'jpeg' || toExt === 'jpg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(objUrl)
      if (toExt === 'bmp') {
        return resolve(encodeBmp(canvas))
      }
      const mimeMap = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', ico: 'image/png', avif: 'image/avif', tiff: 'image/tiff', svg: 'image/svg+xml' }
      const mime = mimeMap[toExt] || `image/${toExt}`
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error(`Conversion image vers ${toExt.toUpperCase()} non supportée par ce navigateur`))
      }, mime, 0.95)
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Fichier image illisible')) }
    img.src = objUrl
  })
}

// ─── Audio conversion ────────────────────────────────────────────────────────
function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataLength = audioBuffer.length * blockAlign
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)
  const offset = 44
  const channels = []
  for (let i = 0; i < numChannels; i++) channels.push(audioBuffer.getChannelData(i))
  let index = 0
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      index += 2
    }
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

async function loadLamejs() {
  if (window.lamejs) return window.lamejs
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.lamejs
}

async function encodeMp3(audioBuffer, bitrate = 128) {
  const lamejs = await loadLamejs()
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate)
  const samples = []
  for (let i = 0; i < numChannels; i++) samples.push(audioBuffer.getChannelData(i))
  const blockSize = 1152
  const mp3Data = []
  for (let i = 0; i < audioBuffer.length; i += blockSize) {
    const left = new Int16Array(blockSize)
    const right = numChannels > 1 ? new Int16Array(blockSize) : null
    for (let j = 0; j < blockSize && i + j < audioBuffer.length; j++) {
      left[j] = Math.max(-32768, Math.min(32767, samples[0][i + j] * 32767))
      if (right) right[j] = Math.max(-32768, Math.min(32767, samples[1][i + j] * 32767))
    }
    const mp3buf = numChannels > 1 ? mp3encoder.encodeBuffer(left, right) : mp3encoder.encodeBuffer(left)
    if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf))
  }
  const end = mp3encoder.flush()
  if (end.length > 0) mp3Data.push(new Int8Array(end))
  return new Blob(mp3Data, { type: 'audio/mpeg' })
}

async function encodeWithMediaRecorder(audioBuffer, mimeType) {
  const wavBlob = encodeWav(audioBuffer)
  const audioUrl = URL.createObjectURL(wavBlob)
  const audio = document.createElement('audio')
  audio.src = audioUrl
  audio.muted = true
  await new Promise((resolve, reject) => { audio.oncanplaythrough = resolve; audio.onerror = reject; audio.load() })
  await audio.play().catch(() => {})
  const stream = audio.captureStream ? audio.captureStream() : audio.mozCaptureStream()
  const mediaRecorder = new MediaRecorder(stream, { mimeType })
  const chunks = []
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    mediaRecorder.onstop = () => { URL.revokeObjectURL(audioUrl); resolve(new Blob(chunks, { type: mimeType })) }
    mediaRecorder.onerror = (e) => { URL.revokeObjectURL(audioUrl); reject(e) }
    mediaRecorder.start()
    setTimeout(() => { mediaRecorder.stop(); audio.pause() }, (audioBuffer.duration * 1000) + 500)
  })
}

async function convertAudio(file, fromExt, toExt) {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  let audioBuffer
  try { audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0)) }
  catch (e) { audioContext.close(); throw new Error(`Impossible de décoder le fichier audio ${fromExt.toUpperCase()}`) }
  audioContext.close()
  if (toExt === 'wav' || toExt === 'weba') return encodeWav(audioBuffer)
  if (toExt === 'mp3') return encodeMp3(audioBuffer)
  const mimeMap = { ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/mp4', m4a: 'audio/mp4', opus: 'audio/webm;codecs=opus', webm: 'audio/webm' }
  const mime = mimeMap[toExt]
  if (mime && MediaRecorder.isTypeSupported(mime)) return encodeWithMediaRecorder(audioBuffer, mime)
  const genericMime = `audio/${toExt}`
  if (MediaRecorder.isTypeSupported(genericMime)) return encodeWithMediaRecorder(audioBuffer, genericMime)
  throw new Error(`Conversion audio vers ${toExt.toUpperCase()} non supportée dans ce navigateur. Essayez WAV ou MP3.`)
}

// ─── Video conversion (ffmpeg.wasm) ──────────────────────────────────────────
let ffmpegPromise = null
async function getFfmpeg() {
  if (ffmpegPromise) return ffmpegPromise
  ffmpegPromise = (async () => {
    try {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import('https://esm.sh/@ffmpeg/ffmpeg@0.12.10'),
        import('https://esm.sh/@ffmpeg/util@0.12.1')
      ])
      const ffmpeg = new FFmpeg()
      await ffmpeg.load()
      return { ffmpeg, fetchFile }
    } catch (e) {
      ffmpegPromise = null
      throw new Error(`Impossible de charger ffmpeg.wasm (${e.message}). Vérifiez votre connexion internet.`)
    }
  })()
  return ffmpegPromise
}

async function convertVideo(file, fromExt, toExt) {
  const { ffmpeg, fetchFile } = await getFfmpeg()
  const inputName = `input.${fromExt}`
  const outputName = `output.${toExt}`
  await ffmpeg.writeFile(inputName, await fetchFile(file))
  const args = ['-i', inputName, '-y']
  if (toExt === 'gif') {
    args.push('-vf', 'fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse', '-loop', '0')
  } else if (toExt === 'mp3') {
    args.push('-vn', '-acodec', 'libmp3lame', '-q:a', '4')
  } else if (toExt === 'wav') {
    args.push('-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2')
  } else if (toExt === 'aac') {
    args.push('-vn', '-acodec', 'aac', '-b:a', '128k')
  } else if (['png', 'jpeg', 'jpg', 'webp'].includes(toExt)) {
    args.push('-ss', '00:00:01', '-vframes', '1', '-q:v', '2')
  } else {
    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart')
  }
  args.push(outputName)
  await ffmpeg.exec(args)
  const data = await ffmpeg.readFile(outputName)
  const mime = MIME_TYPES[toExt] || `video/${toExt}`
  return new Blob([data.buffer], { type: mime })
}

// ─── Data conversion (JSON / CSV / TSV / XML / YAML / XLSX) ─────────────────
async function parseDataFile(file, ext) {
  if (ext === 'xlsx' || ext === 'xls') {
    const X = await import('xlsx')
    const wb = X.read(await file.arrayBuffer(), { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    return X.utils.sheet_to_json(ws, { defval: '' })
  }
  const text = await file.text()
  if (ext === 'json') {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : [data]
  }
  if (ext === 'csv' || ext === 'tsv') {
    const sep = ext === 'tsv' ? '\t' : ','
    const lines = text.trim().split(/\r?\n/)
    if (!lines.length) return []
    const headers = splitCsvLine(lines[0], sep)
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = splitCsvLine(line, sep)
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    })
  }
  if (ext === 'xml') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'application/xml')
    const items = doc.querySelectorAll('item, row, record, entry')
    if (items.length) {
      return Array.from(items).map(el => {
        const obj = {}
        el.children.length
          ? Array.from(el.children).forEach(c => { obj[c.tagName] = c.textContent })
          : Array.from(el.attributes).forEach(a => { obj[a.name] = a.value })
        return obj
      })
    }
    // Root element with children as records
    const root = doc.documentElement
    return Array.from(root.children).map(el => {
      const obj = {}
      Array.from(el.children).forEach(c => { obj[c.tagName] = c.textContent })
      if (!Object.keys(obj).length) obj[el.tagName] = el.textContent
      return obj
    })
  }
  return []
}

function splitCsvLine(line, sep) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function rowsToXml(rows) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<data>']
  for (const row of rows) {
    lines.push('  <item>')
    for (const [k, v] of Object.entries(row)) {
      const tag = String(k).replace(/[^a-zA-Z0-9_.-]/g, '_') || 'field'
      const val = String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      lines.push(`    <${tag}>${val}</${tag}>`)
    }
    lines.push('  </item>')
  }
  lines.push('</data>')
  return lines.join('\n')
}

function rowsToYaml(rows) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  return rows.map(row => {
    const fields = headers.map(h => {
      const v = String(row[h] ?? '')
      const needsQ = /[:#[\]{}|,|>&*!,?-]/.test(v) || v.trim() !== v || v === ''
      const escaped = needsQ ? `'${v.replace(/'/g, "''")}'` : v
      return `  ${h}: ${escaped}`
    }).join('\n')
    return `-\n${fields}`
  }).join('\n')
}

async function convertData(file, fromExt, toExt) {
  const rows = await parseDataFile(file, fromExt)
  const headers = rows.length ? Object.keys(rows[0]) : []

  if (toExt === 'json') {
    return new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  }
  if (toExt === 'csv') {
    const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [headers.map(csvEscape).join(','), ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))]
    return new Blob([lines.join('\n')], { type: 'text/csv' })
  }
  if (toExt === 'tsv') {
    const lines = [headers.join('\t'), ...rows.map(r => headers.map(h => String(r[h] ?? '')).join('\t'))]
    return new Blob([lines.join('\n')], { type: 'text/tab-separated-values' })
  }
  if (toExt === 'xml') {
    return new Blob([rowsToXml(rows)], { type: 'application/xml' })
  }
  if (toExt === 'yaml') {
    return new Blob([rowsToYaml(rows)], { type: 'text/yaml' })
  }
  if (toExt === 'xlsx') {
    const X = await import('xlsx')
    const ws = X.utils.json_to_sheet(rows)
    const wb = X.utils.book_new()
    X.utils.book_append_sheet(wb, ws, 'Données')
    const buf = X.write(wb, { type: 'array', bookType: 'xlsx' })
    return new Blob([buf], { type: MIME_TYPES.xlsx })
  }
  throw new Error(`Conversion ${fromExt} → ${toExt} non supportée`)
}

// ─── Markdown helpers ────────────────────────────────────────────────────────
function mdToHtml(text) {
  return text
    .replace(/^#{6}\s(.+)/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s(.+)/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s(.+)/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)/gm, '<li>$2</li>')
    .replace(/(<li>[\s\S]+?<\/li>)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h1-6|ul|li|p])(.+)/gm, '<p>$1</p>')
}

function htmlToMd(html) {
  return html
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => '#'.repeat(Number(l)) + ' ' + t.replace(/<[^>]+>/g, '') + '\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Document conversion ─────────────────────────────────────────────────────
const PROSE_CSS = `body{font-family:Georgia,'Times New Roman',serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.7;color:#1a1a1a}h1,h2,h3{font-family:Arial,sans-serif;color:#111}h1{font-size:2rem;border-bottom:2px solid #eee;padding-bottom:.5rem}h2{font-size:1.5rem}code{background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:.9em}pre{background:#f5f5f5;padding:16px;border-radius:6px;overflow:auto}blockquote{border-left:4px solid #ccc;padding-left:16px;color:#555;margin:16px 0}a{color:#1d4ed8}ul,ol{padding-left:1.5em}`

async function convertDocument(file, fromExt, toExt) {
  if (fromExt === 'docx' || fromExt === 'doc') {
    const m = await import('mammoth')
    if (toExt === 'txt') {
      const { value } = await m.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      return new Blob([value], { type: 'text/plain' })
    }
    if (toExt === 'html') {
      const { value } = await m.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
      return new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PROSE_CSS}</style></head><body>${value}</body></html>`], { type: 'text/html' })
    }
  }

  const text = await file.text()

  if (fromExt === 'md') {
    const html = mdToHtml(text)
    if (toExt === 'html') return new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PROSE_CSS}</style></head><body>${html}</body></html>`], { type: 'text/html' })
    if (toExt === 'txt') return new Blob([text.replace(/^#{1,6}\s/gm, '').replace(/\*\*?/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')], { type: 'text/plain' })
    if (toExt === 'pdf') return htmlToPdfBlob(`<style>${PROSE_CSS}</style><body>${html}</body>`)
  }

  if (fromExt === 'html' || fromExt === 'htm') {
    if (toExt === 'txt') {
      const doc = new DOMParser().parseFromString(text, 'text/html')
      return new Blob([doc.body.textContent || ''], { type: 'text/plain' })
    }
    if (toExt === 'md') return new Blob([htmlToMd(text)], { type: 'text/markdown' })
    if (toExt === 'pdf') return htmlToPdfBlob(text)
  }

  if (fromExt === 'txt') {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (toExt === 'html') return new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PROSE_CSS} body{white-space:pre-wrap;font-family:system-ui,sans-serif}</style></head><body>${escaped}</body></html>`], { type: 'text/html' })
    if (toExt === 'md') return new Blob([text], { type: 'text/markdown' })
    if (toExt === 'pdf') return htmlToPdfBlob(`<style>${PROSE_CSS} body{white-space:pre-wrap;font-family:system-ui,sans-serif}</style><body>${escaped}</body>`)
  }

  throw new Error(`Conversion ${fromExt} → ${toExt} non supportée`)
}

async function htmlToPdfBlob(htmlContent) {
  const { default: html2pdf } = await import('html2pdf.js')
  const div = document.createElement('div')
  div.innerHTML = htmlContent
  div.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;'
  document.body.appendChild(div)
  try {
    const blob = await html2pdf().set({ margin: [15, 15], filename: 'doc.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(div).outputPdf('blob')
    return blob
  } finally {
    document.body.removeChild(div)
  }
}

// ─── PDF extraction ──────────────────────────────────────────────────────────
async function convertPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n\n'
  }
  return new Blob([text.trim()], { type: 'text/plain' })
}

// ─── Main conversion dispatcher ──────────────────────────────────────────────
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'svg', 'avif', 'tiff', 'tif', 'heic', 'heif', 'hec'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'aiff', 'flac', 'ogg', 'wma', 'aac', 'm4a', 'opus', 'weba'])
const VIDEO_EXTS = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'mpeg', 'mpg', '3gp', 'ogv'])
const DATA_EXTS  = new Set(['json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'xlsx', 'xls', 'ods', 'sql', 'ndjson'])
const DOC_EXTS   = new Set(['docx', 'doc', 'txt', 'md', 'html', 'htm', 'odt', 'rtf', 'epub'])

async function convert(file, fromExt, toExt) {
  if (IMAGE_EXTS.has(fromExt)) return convertImage(file, toExt)
  if (AUDIO_EXTS.has(fromExt)) return convertAudio(file, fromExt, toExt)
  if (VIDEO_EXTS.has(fromExt)) return convertVideo(file, fromExt, toExt)
  if (DATA_EXTS.has(fromExt))  return convertData(file, fromExt, toExt)
  if (fromExt === 'pdf')       return convertPdf(file)
  if (DOC_EXTS.has(fromExt))   return convertDocument(file, fromExt, toExt)
  throw new Error(`Format source non supporté : ${fromExt}`)
}

// ─── Component ───────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '0 0 60px' },
  header: { background: 'linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)', padding: '40px 32px 48px', borderRadius: '0 0 32px 32px', color: '#fff', marginBottom: 32 },
  badge: { fontSize: '.7rem', fontWeight: 800, letterSpacing: 1.5, background: 'rgba(255,255,255,.2)', borderRadius: 100, padding: '4px 14px', display: 'inline-block', marginBottom: 12 },
  title: { fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.15 },
  sub: { fontSize: '1.05rem', opacity: .88, margin: 0, maxWidth: 600 },
  wrap: { maxWidth: 1400, margin: '0 auto', padding: '0 24px' },
  card: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 },
  label: { fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 10, display: 'block' },
  dropzone: (active) => ({
    border: `2px dashed ${active ? '#7c3aed' : 'var(--border)'}`,
    borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
    transition: 'all .2s', background: active ? 'rgba(124,58,237,.06)' : 'var(--bg-primary)',
  }),
  pill: (active) => ({
    padding: '8px 18px', borderRadius: 100, border: `2px solid ${active ? '#7c3aed' : 'var(--border)'}`,
    background: active ? 'rgba(124,58,237,.12)' : 'transparent', color: active ? '#7c3aed' : 'var(--text-secondary)',
    fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', transition: 'all .18s',
  }),
  btn: { padding: '14px 36px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', background: 'linear-gradient(90deg,#1d4ed8,#7c3aed)', color: '#fff' },
  btnSec: { padding: '10px 24px', borderRadius: 10, border: '1px solid var(--border)', fontWeight: 600, fontSize: '.9rem', cursor: 'pointer', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
  result: { display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(90deg,rgba(29,78,216,.08),rgba(124,58,237,.08))', border: '1px solid rgba(124,58,237,.3)', borderRadius: 16, padding: '20px 24px' },
  error: { background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '14px 18px', color: '#ef4444', fontSize: '.9rem' },
}

export default function FormatConverter() {
  const [file, setFile] = useState(null)
  const [outputFmt, setOutputFmt] = useState('')
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const { membre } = useAuth()
  const guard = useToolGuard('format_converter', 'format_converter')

  const inputExt = file ? file.name.split('.').pop().toLowerCase() : ''
  const compatOutputs = COMPAT[inputExt] || []

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    setOutputFmt('')
    if (preview) { URL.revokeObjectURL(preview); setPreview('') }
    if (IMAGE_EXTS.has(f.name.split('.').pop().toLowerCase())) {
      setPreview(URL.createObjectURL(f))
    }
  }, [preview])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function checkAccessThen(action) {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return false
    await guard.recordUsage({ action })
    return true
  }

  const handleConvert = async () => {
    if (!file || !outputFmt) return
    const ok = await checkAccessThen()
    if (!ok) return
    setConverting(true)
    setError('')
    setResult(null)
    try {
      const blob = await convert(file, inputExt, outputFmt)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      const filename = `${baseName}.${outputFmt}`
      const url = URL.createObjectURL(blob)
      setResult({ blob, url, filename, size: blob.size })
    } catch (e) {
      setError(e.message || 'Erreur de conversion')
    } finally {
      setConverting(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.filename
    a.click()
  }

  const reset = () => {
    setFile(null); setOutputFmt(''); setResult(null); setError('')
    if (preview) { URL.revokeObjectURL(preview); setPreview('') }
    if (result?.url) URL.revokeObjectURL(result.url)
  }

  const fmt = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(2)} MB`

  return (
    <main style={s.page}>
      <SEO
        title="Format Converter Pro — Convertisseur universel de fichiers | ABAWI"
        description="Convertissez facilement vos fichiers entre différents formats : images, audio, vidéo, documents, tableurs et PDF. Traitement 100% local dans le navigateur pour garantir la confidentialité de vos données."
        keywords="conversion de formats, convertisseur de fichiers, convertir image, convertir audio, convertir vidéo, convertir document, convertir PDF, outil en ligne, conversion locale, confidentialité"
        type="website"
        path="/tools/format-converter"
       image="/og-tools/format-converter.jpg"/>
      <div style={{ ...s.wrap, marginBottom: 10 }}>
        <ToolGuardBadge guard={guard} />
      </div>
      <div style={s.wrap}>
        <span style={s.badge}>OUTILS ESSENTIELS</span>
        <p style={{ color: 'var(--txt-muted)', fontSize: '1.05rem', maxWidth: 560, textAlign: 'center' }}>Importez votre fichier, choisissez le format de sortie et téléchargez le résultat instantanément. <strong>Traitement 100 % local</strong> : vos fichiers ne quittent jamais votre navigateur.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {['🖼 Images', '🎵 Audio', '🎬 Vidéo', '📊 Données', '📝 Documents', '📕 PDF'].map(tag => (
            <span key={tag} style={{ fontSize: '.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,.18)', color: '#fff' }}>{tag}</span>
          ))}
        </div>
      </div>

      <div style={s.wrap}>
        {/* Drop zone */}
        <div style={s.card}>
          <span style={s.label}>1 — Fichier source</span>
          <div
            style={s.dropzone(isDragging)}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
            {file ? (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{FORMAT_ICONS[inputExt] || '📁'}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{FORMAT_LABELS[inputExt] || inputExt.toUpperCase()} · {fmt(file.size)}</div>
                {compatOutputs.length === 0 && (
                  <div style={{ color: '#ef4444', marginTop: 8, fontSize: '.85rem' }}>Format non supporté pour la conversion.</div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Glissez votre fichier ici ou cliquez pour parcourir</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>
                  Images · Audio · Vidéo · Documents · Tableurs · PDF
                </div>
              </div>
            )}
          </div>
          {preview && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)', objectFit: 'contain' }} />
            </div>
          )}
        </div>

        {/* Format selector */}
        {compatOutputs.length > 0 && (
          <div style={s.card}>
            <span style={s.label}>2 — Format de sortie</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {compatOutputs.map(fmt => (
                <button key={fmt} style={s.pill(outputFmt === fmt)} onClick={() => setOutputFmt(fmt)}>
                  {FORMAT_ICONS[fmt] || '📄'} {FORMAT_LABELS[fmt] || fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Convert button */}
        {file && outputFmt && !result && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button style={{ ...s.btn, opacity: converting ? .6 : 1 }} onClick={handleConvert} disabled={converting}>
              {converting ? '⏳ Conversion en cours…' : `Convertir en ${FORMAT_LABELS[outputFmt] || outputFmt.toUpperCase()} →`}
            </button>
          </div>
        )}

        {/* Error */}
        {error && <div style={s.error}>⚠ {error}</div>}

        {/* Result */}
        {result && (
          <div style={{ ...s.card, marginTop: 0 }}>
            <div style={s.result}>
              <div style={{ fontSize: '2.5rem' }}>{FORMAT_ICONS[outputFmt] || '📄'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{result.filename}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>
                  {FORMAT_LABELS[outputFmt]} · {fmt(result.size)} · Conversion réussie
                </div>
              </div>
              <button style={{ ...s.btn, padding: '12px 28px', fontSize: '.9rem' }} onClick={handleDownload}>
                ⬇ Télécharger
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button style={s.btnSec} onClick={reset}>Convertir un autre fichier</button>
            </div>
          </div>
        )}

        {/* Formats guide */}
        {!file && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 8 }}>
            {[
              { icon: '🖼', cat: 'Images', fmts: 'PNG · JPEG · WebP · GIF · BMP · SVG · ICO · AVIF · HEIC · HEC → PNG · JPEG · WebP · GIF · BMP · ICO · AVIF' },
              { icon: '🎵', cat: 'Audio', fmts: 'MP3 · WAV · FLAC · OGG · AAC · M4A · Opus → MP3 · WAV · OGG · FLAC · AAC · M4A · Opus · WebM' },
              { icon: '🎬', cat: 'Vidéo', fmts: 'MP4 · WebM · AVI · MOV · MKV · FLV · WMV · MPEG → MP4 · WebM · AVI · MOV · MKV · GIF · MP3 · PNG' },
              { icon: '📊', cat: 'Données', fmts: 'JSON · CSV · XML · YAML · Excel → JSON · CSV · TSV · XML · YAML · Excel · SQL · NDJSON' },
              { icon: '📝', cat: 'Documents', fmts: 'DOCX · DOC · TXT · MD · HTML · ODT · RTF → TXT · HTML · MD · PDF · ODT · RTF' },
              { icon: '📕', cat: 'PDF', fmts: 'PDF → Texte brut · HTML · Markdown · DOCX' },
              { icon: '🔒', cat: 'Privé & local', fmts: 'Audio = Web Audio API. Vidéo = ffmpeg.wasm (chargé à la volée). Aucun upload serveur.' },
            ].map(({ icon, cat, fmts }) => (
              <div key={cat} style={{ ...s.card, padding: '18px 20px', marginBottom: 0 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{cat}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{fmts}</div>
              </div>
            ))}
          </div>
        )}

        <ToolInfoPanel
          toolName="Format Converter Pro"
          icon="🔄"
          description="Convertisseur universel de fichiers — 100 % local, sans envoi sur serveur, sans limite de taille."
          benefits={['Confidentialité totale : traitement 100 % dans le navigateur', 'Conversion rapide sans inscription ni upload', 'Images : PNG, JPEG, WebP, GIF, BMP, SVG, ICO, AVIF, HEIC, HEC', 'Audio : MP3, WAV, FLAC, OGG, AAC, M4A, Opus — Web Audio API', 'Vidéo : MP4, WebM, AVI, MOV, MKV, FLV, WMV — ffmpeg.wasm', 'Données : JSON, CSV, XML, YAML, Excel, SQL, NDJSON bidirectionnel', 'Documents Word, Markdown, HTML, PDF, ODT, RTF']}
          howToUse={['Glissez votre fichier dans la zone', 'Sélectionnez le format de sortie souhaité', 'Cliquez sur Convertir — le fichier se télécharge directement']}
          tips={['Pour JPEG, le fond blanc est automatiquement appliqué sur les zones transparentes', "PDF → TXT extrait tout le texte brut sans perte d'information", 'Excel → JSON exporte la première feuille du classeur', 'La conversion vidéo utilise ffmpeg.wasm (chargé une seule fois, ~30 Mo)', "Pour l'audio, WAV et MP3 sont les formats les plus compatibles"]}
        />
      </div>

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />
    </main>
  )
}

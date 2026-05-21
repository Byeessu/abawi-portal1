/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE AI — Intégration cloud Replicate pour Image Pro
   • removeBackgroundAI : suppression de fond pro via modèle IA
   • upscaleAI : super-résolution (Real-ESRGAN)
   • restoreAI : restauration de visages (GFPGAN)
   • enhanceAI : enhancement général (Clarity Upscaler)
   ═══════════════════════════════════════════════════════════════════════════ */

const EDGE_URL = '/.netlify/functions/replicate-image-pro'

function dataUriToBlob(dataUri) {
  const arr = dataUri.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i)
  return new Blob([u8arr], { type: mime })
}

async function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function imageDataToDataUri(imageData) {
  const c = document.createElement('canvas')
  c.width = imageData.width
  c.height = imageData.height
  c.getContext('2d').putImageData(imageData, 0, 0)
  return c.toDataURL('image/png')
}

async function canvasToDataUri(canvas) {
  return canvas.toDataURL('image/png')
}

/* ─── API Calls ─── */
async function callImageProAPI(action, imageDataUri, extra = {}) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, image: imageDataUri, ...extra }),
  })

  const text = await res.text()
  if (!text) {
    throw new Error(`Edge function returned empty body (status ${res.status})`)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Edge function returned invalid JSON (status ${res.status}): ${text.slice(0, 200)}`)
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `AI processing failed (status ${res.status})`)
  }
  return data.output[0]
}

/* Suppression de fond IA */
export async function removeBackgroundAI(source) {
  let dataUri = source
  if (source instanceof File || source instanceof Blob) {
    dataUri = await fileToDataUri(source)
  } else if (source instanceof ImageData) {
    dataUri = await imageDataToDataUri(source)
  }
  return callImageProAPI('removebg', dataUri)
}

/* Super-résolution */
export async function upscaleAI(source, scale = 2) {
  let dataUri = source
  if (source instanceof File || source instanceof Blob) {
    dataUri = await fileToDataUri(source)
  } else if (source instanceof ImageData) {
    dataUri = await imageDataToDataUri(source)
  }
  return callImageProAPI('upscale', dataUri, { scale })
}

/* Restauration de visages */
export async function restoreAI(source) {
  let dataUri = source
  if (source instanceof File || source instanceof Blob) {
    dataUri = await fileToDataUri(source)
  } else if (source instanceof ImageData) {
    dataUri = await imageDataToDataUri(source)
  }
  return callImageProAPI('restore', dataUri)
}

/* Enhancement général */
export async function enhanceAI(source, prompt) {
  let dataUri = source
  if (source instanceof File || source instanceof Blob) {
    dataUri = await fileToDataUri(source)
  } else if (source instanceof ImageData) {
    dataUri = await imageDataToDataUri(source)
  }
  return callImageProAPI('enhance', dataUri, { prompt })
}

/* ─── Image utilities ─── */
export async function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      resolve({
        imageData: c.getContext('2d').getImageData(0, 0, img.width, img.height),
        width: img.width,
        height: img.height,
      })
    }
    img.onerror = reject
    img.src = url
  })
}

export async function urlToImageData(url, maxDim = 1600) {
  const { imageData, width, height } = await loadImageFromUrl(url)
  if (width <= maxDim && height <= maxDim) return imageData
  const scale = Math.min(maxDim / width, maxDim / height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const temp = document.createElement('canvas')
  temp.width = width; temp.height = height
  temp.getContext('2d').putImageData(imageData, 0, 0)
  c.getContext('2d').drawImage(temp, 0, 0, w, h)
  return c.getContext('2d').getImageData(0, 0, w, h)
}

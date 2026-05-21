/* Image Pro Web Worker — Traitement lourd hors du UI thread */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function rgbToLab(r, g, b) {
  r = r / 255; g = g / 255; b = b / 255
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
  const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
  const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function labDist(l1, l2) {
  const dl = l1[0] - l2[0], da = l1[1] - l2[1], db = l1[2] - l2[2]
  return Math.sqrt(dl * dl + da * da + db * db)
}

function slicSuperpixels(data, w, h, numSuperpixels, compactness) {
  const N = w * h
  const S = Math.sqrt(N / numSuperpixels)
  const step = Math.round(S)
  const labData = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const p = i * 4
    const lab = rgbToLab(data[p], data[p + 1], data[p + 2])
    labData[i * 3] = lab[0]
    labData[i * 3 + 1] = lab[1]
    labData[i * 3 + 2] = lab[2]
  }

  const centers = []
  for (let y = Math.floor(step / 2); y < h; y += step) {
    for (let x = Math.floor(step / 2); x < w; x += step) {
      const idx = y * w + x
      centers.push({
        x, y,
        l: labData[idx * 3],
        a: labData[idx * 3 + 1],
        b: labData[idx * 3 + 2],
      })
    }
  }

  const labels = new Int32Array(N).fill(-1)
  const distances = new Float32Array(N).fill(Infinity)
  const m = compactness / S

  for (let iter = 0; iter < 5; iter++) {
    distances.fill(Infinity)
    for (let c = 0; c < centers.length; c++) {
      const cx = Math.round(centers[c].x)
      const cy = Math.round(centers[c].y)
      const yStart = Math.max(0, cy - step)
      const yEnd = Math.min(h, cy + step)
      const xStart = Math.max(0, cx - step)
      const xEnd = Math.min(w, cx + step)
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * w + x
          const dx = x - centers[c].x
          const dy = y - centers[c].y
          const dLab = labDist(
            [labData[idx * 3], labData[idx * 3 + 1], labData[idx * 3 + 2]],
            [centers[c].l, centers[c].a, centers[c].b]
          )
          const D = dLab + m * Math.sqrt(dx * dx + dy * dy)
          if (D < distances[idx]) {
            distances[idx] = D
            labels[idx] = c
          }
        }
      }
    }
    const sums = new Float32Array(centers.length * 5)
    const counts = new Int32Array(centers.length)
    for (let i = 0; i < N; i++) {
      const c = labels[i]
      if (c >= 0) {
        sums[c * 5] += labData[i * 3]
        sums[c * 5 + 1] += labData[i * 3 + 1]
        sums[c * 5 + 2] += labData[i * 3 + 2]
        sums[c * 5 + 3] += i % w
        sums[c * 5 + 4] += Math.floor(i / w)
        counts[c]++
      }
    }
    for (let c = 0; c < centers.length; c++) {
      if (counts[c] > 0) {
        centers[c].l = sums[c * 5] / counts[c]
        centers[c].a = sums[c * 5 + 1] / counts[c]
        centers[c].b = sums[c * 5 + 2] / counts[c]
        centers[c].x = sums[c * 5 + 3] / counts[c]
        centers[c].y = sums[c * 5 + 4] / counts[c]
      }
    }
  }
  return labels
}

function spectralSaliency(data, w, h) {
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  }
  const blockSize = 8
  const bw = Math.ceil(w / blockSize), bh = Math.ceil(h / blockSize)
  const salMap = new Float32Array(bw * bh)
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let sum = 0, sumSq = 0, n = 0
      for (let y = by * blockSize; y < Math.min((by + 1) * blockSize, h); y++) {
        for (let x = bx * blockSize; x < Math.min((bx + 1) * blockSize, w); x++) {
          const v = gray[y * w + x]
          sum += v; sumSq += v * v; n++
        }
      }
      const mean = sum / n
      salMap[by * bw + bx] = Math.sqrt(sumSq / n - mean * mean + 1)
    }
  }
  const saliency = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      saliency[y * w + x] = salMap[Math.min(bh - 1, Math.floor(y / blockSize)) * bw + Math.min(bw - 1, Math.floor(x / blockSize))]
    }
  }
  let maxSal = 0
  for (let i = 0; i < w * h; i++) maxSal = Math.max(maxSal, saliency[i])
  if (maxSal > 0) for (let i = 0; i < w * h; i++) saliency[i] /= maxSal
  return saliency
}

function otsuThreshold(data, w, h) {
  const gray = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2])
  const hist = new Float32Array(256)
  for (let i = 0; i < w * h; i++) hist[gray[i]]++
  const total = w * h
  for (let i = 0; i < 256; i++) hist[i] /= total
  let maxVar = 0, threshold = 128
  for (let t = 1; t < 255; t++) {
    let w0 = 0, w1 = 0, mu0 = 0, mu1 = 0
    for (let i = 0; i <= t; i++) { w0 += hist[i]; mu0 += i * hist[i] }
    for (let i = t + 1; i < 256; i++) { w1 += hist[i]; mu1 += i * hist[i] }
    if (w0 === 0 || w1 === 0) continue
    mu0 /= w0; mu1 /= w1
    const varBetween = w0 * w1 * (mu0 - mu1) * (mu0 - mu1)
    if (varBetween > maxVar) { maxVar = varBetween; threshold = t }
  }
  const mask = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) mask[i] = gray[i] > threshold ? 255 : 0
  return mask
}

function dilateMask(mask, w, h, radius) {
  const out = new Uint8ClampedArray(mask.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let max = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          max = Math.max(max, mask[ny * w + nx])
        }
      }
      out[y * w + x] = max
    }
  }
  return out
}

function erodeMask(mask, w, h, radius) {
  const out = new Uint8ClampedArray(mask.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let min = 255
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          min = Math.min(min, mask[ny * w + nx])
        }
      }
      out[y * w + x] = min
    }
  }
  return out
}

function smoothMask(mask, w, h, radius) {
  const out = new Uint8ClampedArray(mask.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          sum += mask[ny * w + nx]; cnt++
        }
      }
      out[y * w + x] = sum / cnt
    }
  }
  return out
}

function connectedComponents(mask, w, h) {
  const labels = new Int32Array(w * h).fill(0)
  let nextLabel = 1
  const equiv = new Map()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!mask[i]) continue
      const n = []
      if (x > 0 && labels[i - 1]) n.push(labels[i - 1])
      if (y > 0 && labels[i - w]) n.push(labels[i - w])
      if (n.length === 0) { labels[i] = nextLabel++ }
      else {
        labels[i] = Math.min(...n)
        for (const l of n) { if (l !== labels[i]) equiv.set(l, labels[i]) }
      }
    }
  }
  function find(l) { while (equiv.has(l) && equiv.get(l) !== l) l = equiv.get(l); return l }
  for (let i = 0; i < w * h; i++) if (labels[i]) labels[i] = find(labels[i])
  return labels
}

function grabCutLike(data, w, h) {
  const saliency = spectralSaliency(data, w, h)
  const otsuMask = otsuThreshold(data, w, h)
  const fgMask = new Uint8ClampedArray(w * h)
  const bgMask = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    if (saliency[i] > 0.6 && otsuMask[i]) fgMask[i] = 255
    else if (saliency[i] < 0.15) bgMask[i] = 255
  }

  const fgHist = new Float32Array(768).fill(0)
  const bgHist = new Float32Array(768).fill(0)
  let fgCount = 0, bgCount = 0
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    if (fgMask[i]) { fgHist[data[p]]++; fgHist[256 + data[p + 1]]++; fgHist[512 + data[p + 2]]++; fgCount++ }
    else if (bgMask[i]) { bgHist[data[p]]++; bgHist[256 + data[p + 1]]++; bgHist[512 + data[p + 2]]++; bgCount++ }
  }
  if (fgCount === 0 || bgCount === 0) return otsuMask
  for (let i = 0; i < 768; i++) { fgHist[i] = (fgHist[i] + 1) / (fgCount + 256); bgHist[i] = (bgHist[i] + 1) / (bgCount + 256) }

  const finalMask = new Uint8ClampedArray(w * h)
  for (let iter = 0; iter < 5; iter++) {
    const changed = new Int32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      const p = i * 4
      const fgProb = fgHist[data[p]] * fgHist[256 + data[p + 1]] * fgHist[512 + data[p + 2]]
      const bgProb = bgHist[data[p]] * bgHist[256 + data[p + 1]] * bgHist[512 + data[p + 2]]
      changed[i] = fgProb > bgProb ? 1 : 0
      finalMask[i] = changed[i] ? 255 : 0
    }
    fgHist.fill(0); bgHist.fill(0); fgCount = 0; bgCount = 0
    for (let i = 0; i < w * h; i++) {
      const p = i * 4
      if (changed[i]) { fgHist[data[p]]++; fgHist[256 + data[p + 1]]++; fgHist[512 + data[p + 2]]++; fgCount++ }
      else { bgHist[data[p]]++; bgHist[256 + data[p + 1]]++; bgHist[512 + data[p + 2]]++; bgCount++ }
    }
    for (let i = 0; i < 768; i++) { fgHist[i] = (fgHist[i] + 1) / (fgCount + 256); bgHist[i] = (bgHist[i] + 1) / (bgCount + 256) }
  }

  let cleaned = dilateMask(finalMask, w, h, 1)
  cleaned = erodeMask(cleaned, w, h, 1)
  cleaned = smoothMask(cleaned, w, h, 2)
  return cleaned
}

function smartSubjectDetection(data, w, h) {
  const gcMask = grabCutLike(data, w, h)
  const cc = connectedComponents(gcMask, w, h)
  const sizes = new Map()
  for (let i = 0; i < w * h; i++) if (cc[i] > 0) sizes.set(cc[i], (sizes.get(cc[i]) || 0) + 1)
  let maxSize = 0, maxLabel = 0
  for (const [label, size] of sizes) { if (size > maxSize) { maxSize = size; maxLabel = label } }
  const refined = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) refined[i] = (cc[i] === maxLabel) ? 255 : 0

  const dist = distanceTransform(refined, w, h)
  const feathered = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    if (refined[i]) feathered[i] = 255
    else { const d = dist[i]; feathered[i] = d < 5 ? Math.round((1 - d / 5) * 255) : 0 }
  }
  return feathered
}

function distanceTransform(mask, w, h) {
  const INF = w + h
  const dist = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) dist[i] = mask[i] ? INF : 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1)
    if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 1)
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x
    if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1)
    if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 1)
  }
  return dist
}

/* ─── Message Handler ─── */
self.onmessage = function (e) {
  const { type, payload, id } = e.data
  const { data, w, h, numSuperpixels, compactness } = payload

  try {
    switch (type) {
      case 'slic': {
        const labels = slicSuperpixels(data, w, h, numSuperpixels || 200, compactness || 20)
        self.postMessage({ id, type: 'slic', labels }, [labels.buffer])
        break
      }
      case 'saliency': {
        const sal = spectralSaliency(data, w, h)
        self.postMessage({ id, type: 'saliency', saliency: sal }, [sal.buffer])
        break
      }
      case 'smartSubject': {
        const mask = smartSubjectDetection(data, w, h)
        self.postMessage({ id, type: 'smartSubject', mask }, [mask.buffer])
        break
      }
      case 'grabcut': {
        const mask = grabCutLike(data, w, h)
        self.postMessage({ id, type: 'grabcut', mask }, [mask.buffer])
        break
      }
      default:
        self.postMessage({ id, type: 'error', error: 'Unknown worker type: ' + type })
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', error: err.message })
  }
}

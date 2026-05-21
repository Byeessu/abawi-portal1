import { useState, useRef, useEffect } from 'react'
import SEO from '../../components/SEO'
import ToolHero from '../../components/ToolHero'
import ToolIcon from '../../components/ToolIcon'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { removeBackgroundAI, restoreAI, enhanceAI } from '../../lib/imageAI'
import { smartSubjectDetection } from '../../lib/imageSegmentation'
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'

/* ═══════════════════════════════════════════════════════════════════════════
   IMAGE PRO — Éditeur d'image ultra-complet avec IA
   • Suppression de fond IA (cloud) + segmentation avancée (local)
   • Chroma Key / Green Screen avec auto-détection de couleur
   • Tampon de clonage, pipette (color picker), texte stylisé
   • Modes de fusion (multiply, screen, overlay, soft-light, hard-light, difference, exclusion)
   • Histogramme RGB, courbes RVB, filtres qualité GPU + presets pro
   • Recadrage, redimensionnement, rotation/flip, watermark, Smart Crop
   • Comparaison avant/après (slider), traitement par lot (batch)
   • Sauvegarde/chargement de projet (localStorage)
   • Enhancement / Super-résolution / Restauration visages via Replicate
   • Export PNG / JPEG / WebP — 100% côté client
   ═══════════════════════════════════════════════════════════════════════════ */

const ACCENT = '#7C3AED'
const GOLD = '#F0B429'

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function hexToRgba(hex, a = 1) {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m) return [0, 0, 0, a]
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16), a]
}

/* ─── Convolution kernels ─── */
const KERNELS = {
  sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  edge: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
  gaussian3: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  gaussian5: [1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4, 1, 4, 6, 4, 1],
}

function convolve(data, w, h, kernel, size = 3) {
  const out = new Uint8ClampedArray(data.length)
  const half = Math.floor(size / 2)
  const div = kernel.reduce((a, b) => a + b, 0) || 1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0
      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const px = clamp(x + kx - half, 0, w - 1)
          const py = clamp(y + ky - half, 0, h - 1)
          const i = (py * w + px) * 4
          const k = kernel[ky * size + kx]
          r += data[i] * k; g += data[i + 1] * k; b += data[i + 2] * k
        }
      }
      const oi = (y * w + x) * 4
      out[oi] = clamp(r / div, 0, 255)
      out[oi + 1] = clamp(g / div, 0, 255)
      out[oi + 2] = clamp(b / div, 0, 255)
      out[oi + 3] = data[oi + 3]
    }
  }
  return out
}

function stackBlur(data, w, h, radius) {
  if (radius < 1) return data.slice()
  const out = new Uint8ClampedArray(data)
  const tmp = new Uint8ClampedArray(data.length)
  const r = Math.floor(radius)
  // horizontal pass
  for (let y = 0; y < h; y++) {
    let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0
    for (let x = -r; x < w + r; x++) {
      const rx = clamp(x, 0, w - 1)
      const i = (y * w + rx) * 4
      if (x + r < w) {
        sumR += out[i]; sumG += out[i + 1]; sumB += out[i + 2]; sumA += out[i + 3]; count++
      }
      if (x - r - 1 >= 0) {
        const li = (y * w + (x - r - 1)) * 4
        sumR -= out[li]; sumG -= out[li + 1]; sumB -= out[li + 2]; sumA -= out[li + 3]; count--
      }
      if (x >= 0 && x < w) {
        const oi = (y * w + x) * 4
        tmp[oi] = sumR / count; tmp[oi + 1] = sumG / count; tmp[oi + 2] = sumB / count; tmp[oi + 3] = sumA / count
      }
    }
  }
  // vertical pass
  for (let x = 0; x < w; x++) {
    let sumR = 0, sumG = 0, sumB = 0, sumA = 0, count = 0
    for (let y = -r; y < h + r; y++) {
      const ry = clamp(y, 0, h - 1)
      const i = (ry * w + x) * 4
      if (y + r < h) {
        sumR += tmp[i]; sumG += tmp[i + 1]; sumB += tmp[i + 2]; sumA += tmp[i + 3]; count++
      }
      if (y - r - 1 >= 0) {
        const li = ((y - r - 1) * w + x) * 4
        sumR -= tmp[li]; sumG -= tmp[li + 1]; sumB -= tmp[li + 2]; sumA -= tmp[li + 3]; count--
      }
      if (y >= 0 && y < h) {
        const oi = (y * w + x) * 4
        out[oi] = sumR / count; out[oi + 1] = sumG / count; out[oi + 2] = sumB / count; out[oi + 3] = sumA / count
      }
    }
  }
  return out
}

function adjustHSL(data, brightness = 0, contrast = 0, saturation = 0) {
  const cF = (259 * (contrast + 255)) / (255 * (259 - contrast))
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2]
    // brightness
    r += brightness; g += brightness; b += brightness
    // contrast
    r = cF * (r - 128) + 128; g = cF * (g - 128) + 128; b = cF * (b - 128) + 128
    r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255)
    // saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = gray + (r - gray) * (1 + saturation / 100)
    g = gray + (g - gray) * (1 + saturation / 100)
    b = gray + (b - gray) * (1 + saturation / 100)
    data[i] = clamp(r, 0, 255)
    data[i + 1] = clamp(g, 0, 255)
    data[i + 2] = clamp(b, 0, 255)
  }
  return data
}

function addNoise(data, amount) {
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    data[i] = clamp(data[i] + n, 0, 255)
    data[i + 1] = clamp(data[i + 1] + n, 0, 255)
    data[i + 2] = clamp(data[i + 2] + n, 0, 255)
  }
  return data
}

/* ─── Color space conversions ─── */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}
function hslToRgb(h, s, l) {
  let r, g, b
  if (s === 0) { r = g = b = l } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/* ─── Advanced adjustments ─── */
function adjustTemperatureTint(data, temp, tintVal) {
  // temp: -100 (cool/blue) to +100 (warm/yellow)
  // tint: -100 (green) to +100 (magenta)
  for (let i = 0; i < data.length; i += 4) {
    let [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2])
    if (temp !== 0) {
      // shift hue toward orange (warm) or blue (cool)
      const shift = temp > 0 ? (temp / 100) * 0.03 : (temp / 100) * -0.03
      h = (h + shift + 1) % 1
    }
    if (tintVal !== 0) {
      const shift = tintVal > 0 ? (tintVal / 100) * 0.04 : (tintVal / 100) * -0.04
      h = (h + shift + 1) % 1
    }
    const [r, g, b] = hslToRgb(h, s, l)
    data[i] = r; data[i+1] = g; data[i+2] = b
  }
  return data
}

function adjustVibrance(data, amount) {
  // Smart saturation: boosts less-saturated colors more, protects skin tones
  const amt = amount / 100
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2])
    // protect skin tones (roughly orange-red hues)
    const isSkin = (h > 0.03 && h < 0.12) || (h > 0.92)
    const boost = isSkin ? amt * 0.3 : amt
    const newS = clamp(s * (1 + boost * (1 - s * 0.5)), 0, 1)
    const [r, g, b] = hslToRgb(h, newS, l)
    data[i] = r; data[i+1] = g; data[i+2] = b
  }
  return data
}

function adjustClarity(data, w, h, amount) {
  // Local contrast enhancement (mid-tone contrast)
  if (amount === 0) return data
  const radius = 3
  const out = new Uint8ClampedArray(data.length)
  const strength = amount / 100
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          const idx = (ny * w + nx) * 4
          r += data[idx]; g += data[idx+1]; b += data[idx+2]; cnt++
        }
      }
      const i = (y * w + x) * 4
      const mr = r / cnt, mg = g / cnt, mb = b / cnt
      const dr = data[i] - mr, dg = data[i+1] - mg, db = data[i+2] - mb
      // boost local contrast, protect extremes
      const lum = (data[i] + data[i+1] + data[i+2]) / 3
      const mask = 1 - Math.abs(lum - 128) / 128 // mid-tone emphasis
      out[i] = clamp(data[i] + dr * strength * mask, 0, 255)
      out[i+1] = clamp(data[i+1] + dg * strength * mask, 0, 255)
      out[i+2] = clamp(data[i+2] + db * strength * mask, 0, 255)
      out[i+3] = data[i+3]
    }
  }
  return out
}

function adjustDehaze(data, w, h, amount) {
  if (amount <= 0) return data
  // Simple dark channel prior approximation
  const strength = amount / 100
  const dark = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    dark[i] = Math.min(data[p], data[p+1], data[p+2]) / 255
  }
  // Estimate atmospheric light from brightest dark channel areas
  let atmR = 0, atmG = 0, atmB = 0, maxDark = 0
  for (let i = 0; i < w * h; i++) {
    if (dark[i] > maxDark) {
      maxDark = dark[i]
      const p = i * 4
      atmR = data[p]; atmG = data[p+1]; atmB = data[p+2]
    }
  }
  const aR = atmR / 255, aG = atmG / 255, aB = atmB / 255
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    const t = Math.max(0.01, 1 - strength * dark[i])
    data[p] = clamp((data[p]/255 - aR) / t + aR, 0, 1) * 255
    data[p+1] = clamp((data[p+1]/255 - aG) / t + aG, 0, 1) * 255
    data[p+2] = clamp((data[p+2]/255 - aB) / t + aB, 0, 1) * 255
  }
  return data
}

function adjustShadowsHighlights(data, shadowsAmt, highlightsAmt) {
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i+1] + data[i+2]) / 3
    if (shadowsAmt !== 0 && lum < 80) {
      const factor = 1 + (shadowsAmt / 100) * ((80 - lum) / 80)
      data[i] = clamp(data[i] * factor, 0, 255)
      data[i+1] = clamp(data[i+1] * factor, 0, 255)
      data[i+2] = clamp(data[i+2] * factor, 0, 255)
    }
    if (highlightsAmt !== 0 && lum > 180) {
      const factor = 1 - (highlightsAmt / 100) * ((lum - 180) / 75)
      data[i] = clamp(data[i] * factor, 0, 255)
      data[i+1] = clamp(data[i+1] * factor, 0, 255)
      data[i+2] = clamp(data[i+2] * factor, 0, 255)
    }
  }
  return data
}

function applyVignette(data, w, h, amount) {
  if (amount === 0) return data
  const cx = w / 2, cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const strength = amount / 100
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist
      const factor = 1 - strength * (dist ** 1.8)
      const i = (y * w + x) * 4
      data[i] *= factor; data[i+1] *= factor; data[i+2] *= factor
    }
  }
  return data
}

function adjustHue(data, shiftDeg) {
  if (shiftDeg === 0) return data
  const shift = shiftDeg / 360
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2])
    const [r, g, b] = hslToRgb((h + shift + 1) % 1, s, l)
    data[i] = r; data[i+1] = g; data[i+2] = b
  }
  return data
}

/* ─── Unsharp mask (pro sharpening) ─── */
function unsharpMask(data, w, h, amount, radius) {
  if (amount <= 0 || radius <= 0) return data
  // Gaussian blur first
  const blurred = stackBlur(new Uint8ClampedArray(data), w, h, radius)
  const strength = amount / 100
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] + (data[i] - blurred[i]) * strength, 0, 255)
    data[i+1] = clamp(data[i+1] + (data[i+1] - blurred[i+1]) * strength, 0, 255)
    data[i+2] = clamp(data[i+2] + (data[i+2] - blurred[i+2]) * strength, 0, 255)
  }
  return data
}

/* ─── Sobel edge detection ─── */
function sobelEdges(data, w, h, threshold) {
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    gray[i] = 0.299 * data[p] + 0.587 * data[p+1] + 0.114 * data[p+2]
  }
  const edges = new Uint8ClampedArray(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = -gray[i-w-1] + gray[i-w+1] - 2*gray[i-1] + 2*gray[i+1] - gray[i+w-1] + gray[i+w+1]
      const gy = -gray[i-w-1] - 2*gray[i-w] - gray[i-w+1] + gray[i+w-1] + 2*gray[i+w] + gray[i+w+1]
      if (Math.sqrt(gx*gx + gy*gy) > threshold) edges[i] = 255
    }
  }
  return edges
}

/* ─── Feather mask edges ─── */
function featherMask(mask, w, h, radius = 3) {
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          sum += mask[ny * w + nx] ? 1 : 0
          cnt++
        }
      }
      out[y * w + x] = sum / cnt
    }
  }
  return out
}

/* ─── Advanced skin detection (HSV-based) ─── */
function skinMaskAdvanced(data, w, h) {
  const mask = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    const r = data[p] / 255, g = data[p+1] / 255, b = data[p+2] / 255
    const [h] = rgbToHsl(data[p], data[p+1], data[p+2])
    const maxC = Math.max(r, g, b), minC = Math.min(r, g, b)
    const s = maxC === 0 ? 0 : (maxC - minC) / maxC
    // HSV skin range
    const skin = (h > 0.02 && h < 0.12) && (s > 0.15 && s < 0.7) && (maxC > 0.25)
    if (skin) mask[i] = 255
  }
  return mask
}

/* ─── Presets ─── */
const PRESETS = {
  none: {},
  portrait: { brightness: 5, contrast: 8, saturation: -5, vibrance: 20, clarity: 15, temperature: 8 },
  vibrant: { brightness: 0, contrast: 12, saturation: 15, vibrance: 35, clarity: 10 },
  cinematic: { brightness: -8, contrast: 18, saturation: -10, vibrance: 15, shadows: 25, highlights: -15, vignette: 25 },
  bw: { brightness: 0, contrast: 20, saturation: -100 },
  vintage: { brightness: -5, contrast: 5, saturation: -20, temperature: 20, tint: 5, vignette: 30 },
  hdr: { clarity: 40, shadows: 40, highlights: -30, dehaze: 20, contrast: 15 },
  moody: { brightness: -15, contrast: 25, shadows: 30, highlights: -20, saturation: -15, vignette: 35 },
  warm: { temperature: 25, brightness: 5, vibrance: 20 },
  cool: { temperature: -20, brightness: 3, dehaze: 10 },
}

/* ─── Mask helpers ─── */
function createMask(w, h) {
  return new Uint8ClampedArray(w * h * 4)
}

function fillMaskCircle(mask, w, h, cx, cy, r, val) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        const i = (y * w + x) * 4 + 3
        mask[i] = val
      }
    }
  }
}

/* Distance colorimétrique perceptuelle (luma-weighted) + Lab approximation */
function colorDist(data, i, tr, tg, tb) {
  const r = data[i], g = data[i + 1], b = data[i + 2]
  // Pondération luma : l'œil est plus sensible au vert
  const dr = (r - tr) * 0.30, dg = (g - tg) * 0.59, db = (b - tb) * 0.11
  return Math.sqrt(dr * dr + dg * dg + db * db) +
    // Composante chroma : différence de saturation
    Math.abs(Math.max(r, g, b) - Math.min(r, g, b) - (Math.max(tr, tg, tb) - Math.min(tr, tg, tb))) * 0.12
}

/* Feathering : lisse les bords du masque pour des transitions douces */
function featherMaskEdges(mask, w, h, radius = 2) {
  const out = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) out[i] = mask[i]
  // Horizontal blur sur les valeurs flottantes
  const tmp = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = clamp(x + dx, 0, w - 1)
        sum += out[y * w + nx]; cnt++
      }
      tmp[y * w + x] = sum / cnt
    }
  }
  // Vertical blur
  const result = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = clamp(y + dy, 0, h - 1)
        sum += tmp[ny * w + x]; cnt++
      }
      result[y * w + x] = Math.round(sum / cnt)
    }
  }
  return result
}

function magicWand(data, w, h, sx, sy, tolerance, contiguous = true) {
  const mask = new Uint8ClampedArray(w * h)
  const si = (sy * w + sx) * 4
  const tr = data[si], tg = data[si + 1], tb = data[si + 2]
  // Tolérance en espace perceptuel (0-100 → 0-50 en luma-weighted)
  const tolPerceptual = tolerance * 0.5

  if (contiguous) {
    // Flood fill avec distance perceptuelle + 8 directions (meilleure couverture)
    const stack = [sy * w + sx]
    const visited = new Uint8Array(w * h)
    visited[sy * w + sx] = 1
    mask[sy * w + sx] = 255
    const dirs8 = [1, -1, w, -w, w + 1, w - 1, -w + 1, -w - 1]
    while (stack.length) {
      const idx = stack.pop()
      for (const d of dirs8) {
        const nidx = idx + d
        if (nidx < 0 || nidx >= w * h || visited[nidx]) continue
        // Vérifier les bords (évite les sauts de ligne)
        const x = nidx % w, y = Math.floor(nidx / w)
        const px = idx % w
        if (Math.abs(x - px) > 1) continue
        visited[nidx] = 1
        const dist = colorDist(data, nidx * 4, tr, tg, tb)
        if (dist <= tolPerceptual) {
          mask[nidx] = 255
          stack.push(nidx)
        }
      }
    }
  } else {
    for (let i = 0; i < w * h; i++) {
      if (colorDist(data, i * 4, tr, tg, tb) <= tolPerceptual) mask[i] = 255
    }
  }
  // Feathering léger pour des bords naturels
  return featherMaskEdges(mask, w, h, 1)
}

function edgeMask(data, w, h, threshold = 30) {
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
  }
  const mask = new Uint8ClampedArray(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = gray[i + 1] - gray[i - 1]
      const gy = gray[i + w] - gray[i - w]
      if (Math.sqrt(gx * gx + gy * gy) > threshold) mask[i] = 255
    }
  }
  return mask
}

function skinMask(data, w, h) {
  const mask = new Uint8ClampedArray(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    const r = data[p], g = data[p + 1], b = data[p + 2]
    // simple skin detection in RGB
    const skin = r > 60 && g > 40 && b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 && r > g && r > b
    if (skin) mask[i] = 255
  }
  return mask
}

function invertMask(mask) {
  for (let i = 0; i < mask.length; i++) mask[i] = mask[i] ? 0 : 255
  return mask
}

function dilateMask(mask, w, h, radius = 1) {
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

function erodeMask(mask, w, h, radius = 1) {
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

function smoothMask(mask, w, h, radius = 2) {
  // Gaussian-like smoothing on mask
  const out = new Uint8ClampedArray(mask.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = clamp(y + dy, 0, h - 1)
          const nx = clamp(x + dx, 0, w - 1)
          sum += mask[ny * w + nx]
          cnt++
        }
      }
      out[y * w + x] = sum / cnt
    }
  }
  return out
}

function applyMaskToAlpha(data, mask, w, h, invert = false) {
  for (let i = 0; i < w * h; i++) {
    const m = mask[i]
    const alpha = invert ? (m ? 0 : 255) : (m ? 255 : 0)
    data[i * 4 + 3] = alpha
  }
  return data
}

function composite(bgData, fgData, outData, w, h) {
  for (let i = 0; i < w * h * 4; i += 4) {
    const a = fgData[i + 3] / 255
    const ia = 1 - a
    outData[i] = fgData[i] * a + bgData[i] * ia
    outData[i + 1] = fgData[i + 1] * a + bgData[i + 1] * ia
    outData[i + 2] = fgData[i + 2] * a + bgData[i + 2] * ia
    outData[i + 3] = 255
  }
  return outData
}

/* ─── Histogram computation ─── */
function computeHistogram(data) {
  const r = new Uint32Array(256), g = new Uint32Array(256), b = new Uint32Array(256)
  for (let i = 0; i < data.length; i += 4) { r[data[i]]++; g[data[i+1]]++; b[data[i+2]]++ }
  const max = Math.max(1, ...r, ...g, ...b)
  return { r: Array.from(r).map(v => v / max), g: Array.from(g).map(v => v / max), b: Array.from(b).map(v => v / max) }
}

/* ─── Rotate image ─── */
function rotateImage(data, w, h, deg) {
  // deg: 90, 180, 270
  if (deg === 180) {
    const out = new Uint8ClampedArray(data.length)
    for (let i = 0; i < w * h; i++) {
      const src = i * 4, dst = ((w * h - 1 - i) * 4)
      out[dst] = data[src]; out[dst+1] = data[src+1]; out[dst+2] = data[src+2]; out[dst+3] = data[src+3]
    }
    return { data: out, w, h }
  }
  const nw = h, nh = w
  const out = new Uint8ClampedArray(nw * nh * 4)
  if (deg === 90) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const src = (y * w + x) * 4
        const dst = ((x) * nw + (h - 1 - y)) * 4
        out[dst] = data[src]; out[dst+1] = data[src+1]; out[dst+2] = data[src+2]; out[dst+3] = data[src+3]
      }
    }
  } else if (deg === 270) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const src = (y * w + x) * 4
        const dst = ((w - 1 - x) * nw + y) * 4
        out[dst] = data[src]; out[dst+1] = data[src+1]; out[dst+2] = data[src+2]; out[dst+3] = data[src+3]
      }
    }
  }
  return { data: out, w: nw, h: nh }
}

/* ─── Flip image ─── */
function flipImage(data, w, h, horizontal) {
  const out = new Uint8ClampedArray(data.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4
      const nx = horizontal ? w - 1 - x : x
      const ny = horizontal ? y : h - 1 - y
      const dst = (ny * w + nx) * 4
      out[dst] = data[src]; out[dst+1] = data[src+1]; out[dst+2] = data[src+2]; out[dst+3] = data[src+3]
    }
  }
  return { data: out, w, h }
}

/* ─── Crop image ─── */
function cropImage(data, w, h, x, y, cw, ch) {
  const out = new Uint8ClampedArray(cw * ch * 4)
  for (let cy = 0; cy < ch; cy++) {
    for (let cx = 0; cx < cw; cx++) {
      const src = ((y + cy) * w + (x + cx)) * 4
      const dst = (cy * cw + cx) * 4
      out[dst] = data[src]; out[dst+1] = data[src+1]; out[dst+2] = data[src+2]; out[dst+3] = data[src+3]
    }
  }
  return { data: out, w: cw, h: ch }
}

/* ─── Resize image (bilinear) ─── */
function resizeImage(data, w, h, nw, nh) {
  const out = new Uint8ClampedArray(nw * nh * 4)
  const xRatio = w / nw, yRatio = h / nh
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const sx = x * xRatio, sy = y * yRatio
      const x0 = Math.floor(sx), y0 = Math.floor(sy)
      const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
      const fx = sx - x0, fy = sy - y0
      const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4
      const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4
      const dst = (y * nw + x) * 4
      for (let c = 0; c < 4; c++) {
        const v00 = data[i00 + c], v10 = data[i10 + c]
        const v01 = data[i01 + c], v11 = data[i11 + c]
        out[dst + c] = Math.round(
          (v00 * (1 - fx) + v10 * fx) * (1 - fy) +
          (v01 * (1 - fx) + v11 * fx) * fy
        )
      }
    }
  }
  return { data: out, w: nw, h: nh }
}

/* ─── Draw histogram on canvas ─── */
function drawHistogramCanvas(canvas, histogram, width, height) {
  const ctx = canvas.getContext('2d')
  canvas.width = width; canvas.height = height
  ctx.clearRect(0, 0, width, height)
  const barW = width / 256
  const colors = [['#ef4444', 'rgba(239,68,68,0.35)'], ['#22c55e', 'rgba(34,197,94,0.35)'], ['#3b82f6', 'rgba(59,130,246,0.35)']]
  const channels = [histogram.r, histogram.g, histogram.b]
  colors.forEach(([stroke, fill], ci) => {
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let i = 0; i < 256; i++) {
      const h = channels[ci][i] * height * 0.92
      ctx.lineTo(i * barW, height - h)
    }
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.2
    ctx.stroke()
  })
}

/* ─── Curves (Tone curves per channel) ───
   shadow/mid/highlight lift for each RGB channel.
   values: -100..100. Negative = darken, Positive = lighten. */
function applyCurves(data, w, h, curves) {
  // curves = { r: [shadow, mid, highlight], g: [...], b: [...] }
  const out = new Uint8ClampedArray(data)
  const channels = ['r', 'g', 'b']
  const lut = {}
  channels.forEach(ch => {
    const c = curves[ch] || [0, 0, 0]
    lut[ch] = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
      const norm = i / 255
      let v = norm
      // Shadow lift
      if (c[0] !== 0) {
        const amt = c[0] / 100
        const shadowMask = 1 - norm
        v += amt * shadowMask * 0.5
      }
      // Mid-tone
      if (c[1] !== 0) {
        const amt = c[1] / 100
        const midMask = 1 - Math.abs(norm - 0.5) * 2
        v += amt * midMask * 0.4
      }
      // Highlight
      if (c[2] !== 0) {
        const amt = c[2] / 100
        const hlMask = norm
        v += amt * hlMask * 0.5
      }
      lut[ch][i] = clamp(Math.round(v * 255), 0, 255)
    }
  })
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    out[p] = lut.r[data[p]]
    out[p+1] = lut.g[data[p+1]]
    out[p+2] = lut.b[data[p+2]]
  }
  return out
}

/* ─── Green Screen / Chroma Key ─── */
function greenScreenMask(data, w, h, keyColor, tolerance = 60) {
  const m = new Uint8ClampedArray(w * h)
  const [kr, kg, kb] = hexToRgba(keyColor)
  const tol2 = tolerance * tolerance
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    const dr = data[p] - kr, dg = data[p+1] - kg, db = data[p+2] - kb
    const d2 = dr*dr + dg*dg + db*db
    // Also favor high saturation colors (green screen tends to be very saturated)
    const max = Math.max(data[p], data[p+1], data[p+2])
    const min = Math.min(data[p], data[p+1], data[p+2])
    const sat = max > 0 ? (max - min) / max : 0
    if (d2 < tol2 * 3 && sat > 0.5) m[i] = 0; else m[i] = 255
  }
  // Smooth edges
  return smoothMask(m, w, h, 1)
}

/* ─── Blend modes for compositing ─── */
function blendPixel(a, b, mode) {
  switch (mode) {
    case 'multiply': return (a * b) / 255
    case 'screen': return 255 - ((255 - a) * (255 - b)) / 255
    case 'overlay': return a < 128 ? (2 * a * b) / 255 : 255 - (2 * (255 - a) * (255 - b)) / 255
    case 'soft-light': return b < 128 ? (2 * a * b + a * a * (1 - 2 * b / 255)) / 255 : Math.sqrt(a / 255) * (2 * b - 255) + (2 * a * (1 - b / 255))
    case 'hard-light': return b < 128 ? (2 * a * b) / 255 : 255 - (2 * (255 - a) * (255 - b)) / 255
    case 'difference': return Math.abs(a - b)
    case 'exclusion': return a + b - (2 * a * b) / 255
    default: return b
  }
}
function compositeWithBlend(bgData, fgData, outData, w, h, mode) {
  for (let i = 0; i < w * h * 4; i += 4) {
    const a = fgData[i + 3] / 255
    const ia = 1 - a
    outData[i]   = blendPixel(bgData[i],   fgData[i],   mode) * a + bgData[i]   * ia
    outData[i+1] = blendPixel(bgData[i+1], fgData[i+1], mode) * a + bgData[i+1] * ia
    outData[i+2] = blendPixel(bgData[i+2], fgData[i+2], mode) * a + bgData[i+2] * ia
    outData[i+3] = 255
  }
  return outData
}

/* ─── Auto-detect dominant background color (for green screen) ─── */
function detectDominantBgColor(data, w, h) {
  const corners = [[0,0], [w-1,0], [0,h-1], [w-1,h-1], [Math.floor(w/2),0], [0,Math.floor(h/2)]]
  const counts = {}
  corners.forEach(([cx, cy]) => {
    const i = (cy * w + cx) * 4
    const key = `${Math.round(data[i]/16)},${Math.round(data[i+1]/16)},${Math.round(data[i+2]/16)}`
    counts[key] = (counts[key] || 0) + 1
  })
  const best = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]
  if (!best) return '#00ff00'
  const [r,g,b] = best[0].split(',').map(v => parseInt(v) * 16)
  return `rgb(${r},${g},${b})`
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ImagePro() {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const fileRef = useRef(null)
  const bgFileRef = useRef(null)

  const { membre } = useAuth()
  const guard = useToolGuard('image_pro', 'image_pro')

  const [image, setImage] = useState(null) // { src, w, h, data: Uint8ClampedArray }
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [tool, setTool] = useState('wand') // wand | brush | eraser | pan
  const [mode, setMode] = useState('remove') // remove | replace | quality
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)

  /* Remove background params */
  const [tolerance, setTolerance] = useState(32)
  const [bgType, setBgType] = useState('auto') // auto | color | skin | edge | manual
  const [brushSize, setBrushSize] = useState(20)
  const [mask, setMask] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)

  /* Replace background params */
  const [bgMode, setBgMode] = useState('color') // color | gradient | image | transparent
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgGradient, setBgGradient] = useState(['#7C3AED', '#F0B429'])
  const [bgImage, setBgImage] = useState(null)

  /* Quality params */
  const [quality, setQuality] = useState({ brightness: 0, contrast: 0, saturation: 0, blur: 0, sharpen: 0, noise: 0, smooth: 0 })
  const [scale, setScale] = useState(100) // %

  /* UI */
  const [activeTab, setActiveTab] = useState('upload')
  const [msg, setMsg] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  /* Advanced Quality params */
  const [temperature, setTemperature] = useState(0)
  const [tint, setTint] = useState(0)
  const [vibrance, setVibrance] = useState(0)
  const [clarity, setClarity] = useState(0)
  const [dehaze, setDehaze] = useState(0)
  const [shadows, setShadows] = useState(0)
  const [highlights, setHighlights] = useState(0)
  const [vignette, setVignette] = useState(0)
  const [hueShift, setHueShift] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState('none')

  /* AI / Advanced segmentation */
  const workerRef = useRef(null)
  const [aiMode, setAiMode] = useState('local') // 'local' | 'cloud'
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction, setAiAction] = useState('') // current AI operation label
  const [showAiPanel, setShowAiPanel] = useState(false)

  /* Transform & Crop */
  const histoRef = useRef(null)
  const [cropMode, setCropMode] = useState(false)
  const [cropRect, setCropRect] = useState(null) // {x, y, w, h}
  const [cropStart, setCropStart] = useState(null)
  const [resizeW, setResizeW] = useState(0)
  const [resizeH, setResizeH] = useState(0)
  const [keepRatio, setKeepRatio] = useState(true)
  const [showHistogram, setShowHistogram] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [compareSplit, setCompareSplit] = useState(0.5)
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkPos, setWatermarkPos] = useState('bottom-right')
  const [rectSelectMode, setRectSelectMode] = useState(false)
  const [rectSelect, setRectSelect] = useState(null)
  const [rectStart, setRectStart] = useState(null)

  /* Curves */
  const [curves, setCurves] = useState({ r: [0, 0, 0], g: [0, 0, 0], b: [0, 0, 0] })

  /* Batch */
  const [batchFiles, setBatchFiles] = useState([])
  const [batchResults, setBatchResults] = useState([])
  const [batchProcessing, setBatchProcessing] = useState(false)

  /* Green Screen / Chroma Key */
  const [chromaColor, setChromaColor] = useState('#00ff00')
  const [chromaTolerance, setChromaTolerance] = useState(60)
  const [chromaAuto, setChromaAuto] = useState(false)

  /* Blend Mode for background replace */
  const [blendMode, setBlendMode] = useState('normal')

  /* Text Overlay Pro */
  const [overlayText, setOverlayText] = useState('')
  const [overlayFontSize, setOverlayFontSize] = useState(48)
  const [overlayTextColor, setOverlayTextColor] = useState('#ffffff')
  const [overlayTextBg, setOverlayTextBg] = useState('transparent')
  const [overlayTextPos, setOverlayTextPos] = useState('center')
  const [overlayTextRotation, setOverlayTextRotation] = useState(0)
  const [overlayTextOutline, setOverlayTextOutline] = useState(true)

  /* Color picker */
  const [pickedColor, setPickedColor] = useState('#000000')
  const [pickerMode, setPickerMode] = useState(false)

  /* Clone stamp */
  const [cloneMode, setCloneMode] = useState(false)
  const [cloneSource, setCloneSource] = useState(null)
  const [cloneSize, setCloneSize] = useState(20)

  // Init Web Worker
  useEffect(() => {
    workerRef.current = new Worker('/imageProWorker.js')
    workerRef.current.onmessage = (e) => {
      const { id, type, mask, labels, saliency, error } = e.data
      if (error) {
        setAiLoading(false)
        setMsg('Erreur IA: ' + error)
        return
      }
      if (type === 'smartSubject' && mask) {
        setMask(new Uint8ClampedArray(mask))
        previewMask(new Uint8ClampedArray(mask))
        setAiLoading(false)
        setMsg('Détection intelligente terminée')
      } else if (type === 'grabcut' && mask) {
        setMask(new Uint8ClampedArray(mask))
        previewMask(new Uint8ClampedArray(mask))
        setAiLoading(false)
        setMsg('Segmentation GrabCut terminée')
      }
    }
    return () => { if (workerRef.current) workerRef.current.terminate() }
  }, [])

  // Fix timing : renderToCanvas après que React monte le canvas dans le DOM
  const pendingRenderRef = useRef(null)
  useEffect(() => {
    if (pendingRenderRef.current && canvasRef.current) {
      const { data, w, h } = pendingRenderRef.current
      pendingRenderRef.current = null
      renderToCanvas(data, w, h)
    }
  }, [image]) // image vient d'être set → canvas vient de monter

  function pushHistory(data, w, h) {
    const snap = { data: new Uint8ClampedArray(data), w, h }
    const next = history.slice(0, histIdx + 1)
    next.push(snap)
    if (next.length > 20) next.shift()
    setHistory(next)
    setHistIdx(next.length - 1)
  }

  function undo() {
    if (histIdx > 0) {
      const snap = history[histIdx - 1]
      setHistIdx(histIdx - 1)
      renderToCanvas(snap.data, snap.w, snap.h)
    }
  }

  function redo() {
    if (histIdx < history.length - 1) {
      const snap = history[histIdx + 1]
      setHistIdx(histIdx + 1)
      renderToCanvas(snap.data, snap.w, snap.h)
    }
  }

  function getCanvasImageData() {
    const c = canvasRef.current
    if (!c) return null
    const ctx = c.getContext('2d')
    return ctx.getImageData(0, 0, c.width, c.height)
  }

  function renderToCanvas(data, w, h) {
    const c = canvasRef.current
    if (!c) return
    c.width = w; c.height = h
    const ctx = c.getContext('2d')
    const img = new ImageData(data, w, h)
    ctx.putImageData(img, 0, 0)
  }

  function loadImage(file) {
    setLoading(true)
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const maxW = 1600, maxH = 1600
      let w = img.width, h = img.height
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const d = ctx.getImageData(0, 0, w, h).data
      setImage({ src: url, w, h, data: new Uint8ClampedArray(d) })
      pushHistory(d, w, h)
      setMask(new Uint8ClampedArray(w * h))
      setActiveTab('edit')
      setLoading(false)
      // Stocker dans le ref pour que useEffect le dessine après montage du canvas
      pendingRenderRef.current = { data: d, w, h }
    }
    img.onerror = () => { setLoading(false); setMsg('Erreur chargement image') }
    img.src = url
  }

  function loadBgImage(file) {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = image.w; c.height = image.h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, image.w, image.h)
      setBgImage({ src: url, data: ctx.getImageData(0, 0, image.w, image.h).data })
    }
    img.src = url
  }

  function getPointerPos(e) {
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (c.width / rect.width),
      y: (clientY - rect.top) * (c.height / rect.height),
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }
  function handleDragLeave() {
    setIsDragOver(false)
  }
  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) loadImage(file)
  }

  function handleCanvasDown(e) {
    if (!image) return
    if (tool === 'pan') return
    e.preventDefault()
    const { x, y } = getPointerPos(e)
    const ix = Math.floor(x), iy = Math.floor(y)
    if (ix < 0 || iy < 0 || ix >= image.w || iy >= image.h) return

    if (pickerMode) {
      const p = (iy * image.w + ix) * 4
      const hex = '#' + [image.data[p], image.data[p+1], image.data[p+2]].map(v => v.toString(16).padStart(2,'0')).join('')
      setPickedColor(hex)
      setPickerMode(false)
      setMsg(`Couleur capturée: ${hex}`)
      return
    }
    if (cloneMode) {
      if (e.altKey || e.shiftKey || !cloneSource) {
        setCloneSource([ix, iy])
        setMsg(`Source clone: ${ix},${iy}`)
      } else {
        applyCloneStamp(ix, iy)
      }
      return
    }
    if (cropMode) {
      setCropStart({ x: ix, y: iy })
      setCropRect({ x: ix, y: iy, w: 0, h: 0 })
      setIsDrawing(true)
      return
    }
    if (rectSelectMode) {
      setRectStart({ x: ix, y: iy })
      setRectSelect({ x: ix, y: iy, w: 0, h: 0 })
      setIsDrawing(true)
      return
    }

    setIsDrawing(true)
    if (tool === 'wand') {
      const newMask = magicWand(image.data, image.w, image.h, ix, iy, tolerance, true)
      const merged = new Uint8ClampedArray(mask)
      for (let i = 0; i < merged.length; i++) if (newMask[i]) merged[i] = 255
      setMask(merged)
      previewMask(merged)
    } else if (tool === 'brush') {
      const merged = new Uint8ClampedArray(mask)
      fillMaskCircle(merged, image.w, image.h, ix, iy, brushSize, 255)
      setMask(merged)
      previewMask(merged)
    } else if (tool === 'eraser') {
      const merged = new Uint8ClampedArray(mask)
      fillMaskCircle(merged, image.w, image.h, ix, iy, brushSize, 0)
      setMask(merged)
      previewMask(merged)
    }
  }

  function handleCanvasMove(e) {
    if (!isDrawing || !image) return
    e.preventDefault()
    const { x, y } = getPointerPos(e)
    const ix = Math.floor(x), iy = Math.floor(y)

    if (cropMode && cropStart) {
      const x0 = clamp(cropStart.x, 0, image.w)
      const y0 = clamp(cropStart.y, 0, image.h)
      const x1 = clamp(ix, 0, image.w)
      const y1 = clamp(iy, 0, image.h)
      setCropRect({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) })
      // Draw selection overlay
      const c = canvasRef.current
      if (c) {
        const ctx = c.getContext('2d')
        ctx.putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
        ctx.strokeStyle = '#F0B429'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
        ctx.setLineDash([])
      }
      return
    }
    if (rectSelectMode && rectStart) {
      const x0 = clamp(rectStart.x, 0, image.w)
      const y0 = clamp(rectStart.y, 0, image.h)
      const x1 = clamp(ix, 0, image.w)
      const y1 = clamp(iy, 0, image.h)
      setRectSelect({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) })
      const c = canvasRef.current
      if (c) {
        const ctx = c.getContext('2d')
        ctx.putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
        ctx.strokeStyle = '#7C3AED'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
        ctx.setLineDash([])
      }
      return
    }

    if (cloneMode && cloneSource) {
      applyCloneStamp(ix, iy)
      return
    }
    if (tool === 'brush') {
      const merged = new Uint8ClampedArray(mask)
      fillMaskCircle(merged, image.w, image.h, ix, iy, brushSize, 255)
      setMask(merged)
      previewMask(merged)
    } else if (tool === 'eraser') {
      const merged = new Uint8ClampedArray(mask)
      fillMaskCircle(merged, image.w, image.h, ix, iy, brushSize, 0)
      setMask(merged)
      previewMask(merged)
    }
  }

  function handleCanvasUp() {
    if (cloneMode) return
    if (cropMode && cropRect && cropRect.w > 5 && cropRect.h > 5) {
      // keep cropRect for applyCrop
    } else if (rectSelectMode && rectSelect && rectSelect.w > 5 && rectSelect.h > 5) {
      // Apply rectangle to mask
      const m = new Uint8ClampedArray(mask)
      for (let y = rectSelect.y; y < rectSelect.y + rectSelect.h; y++) {
        for (let x = rectSelect.x; x < rectSelect.x + rectSelect.w; x++) {
          if (y >= 0 && y < image.h && x >= 0 && x < image.w) m[y * image.w + x] = 255
        }
      }
      setMask(m)
      previewMask(m)
      setRectSelectMode(false)
      setRectSelect(null)
      renderToCanvas(image.data, image.w, image.h)
    }
    setIsDrawing(false)
  }

  function previewMask(currentMask = mask) {
    if (!image || !currentMask) return
    const data = new Uint8ClampedArray(image.data)
    for (let i = 0; i < image.w * image.h; i++) {
      if (currentMask[i]) {
        data[i * 4 + 3] = 255
      } else {
        data[i * 4] = 0; data[i * 4 + 1] = 0; data[i * 4 + 2] = 0; data[i * 4 + 3] = 0
      }
    }
    if (mode === 'replace') {
      const bg = buildBackground(image.w, image.h)
      composite(bg, data, data, image.w, image.h)
    }
    renderToCanvas(data, image.w, image.h)
  }

  function buildBackground(w, h) {
    const bg = new Uint8ClampedArray(w * h * 4)
    if (bgMode === 'transparent') {
      for (let i = 3; i < bg.length; i += 4) bg[i] = 0
    } else if (bgMode === 'color') {
      const [r, g, b] = hexToRgba(bgColor)
      for (let i = 0; i < w * h; i++) {
        bg[i * 4] = r; bg[i * 4 + 1] = g; bg[i * 4 + 2] = b; bg[i * 4 + 3] = 255
      }
    } else if (bgMode === 'gradient') {
      const [r1, g1, b1] = hexToRgba(bgGradient[0])
      const [r2, g2, b2] = hexToRgba(bgGradient[1])
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1 || 1)
        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          bg[i] = r; bg[i + 1] = g; bg[i + 2] = b; bg[i + 3] = 255
        }
      }
    } else if (bgMode === 'image' && bgImage) {
      bg.set(bgImage.data)
    }
    return bg
  }

  function applyRemoveBg() {
    if (!image || !mask) return
    setLoading(true)
    setTimeout(() => {
      const data = new Uint8ClampedArray(image.data)
      applyMaskToAlpha(data, mask, image.w, image.h, false)
      pushHistory(data, image.w, image.h)
      renderToCanvas(data, image.w, image.h)
      // update stored image data
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(data) }))
      setLoading(false)
      setMsg('Fond supprimé')
    }, 100)
  }

  function applyReplaceBg() {
    if (!image || !mask) return
    setLoading(true)
    setTimeout(() => {
      const fg = new Uint8ClampedArray(image.data)
      applyMaskToAlpha(fg, mask, image.w, image.h, false)
      const bg = buildBackground(image.w, image.h)
      const out = new Uint8ClampedArray(image.w * image.h * 4)
      composite(bg, fg, out, image.w, image.h)
      pushHistory(out, image.w, image.h)
      renderToCanvas(out, image.w, image.h)
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(out) }))
      setLoading(false)
      setMsg('Fond remplacé')
    }, 100)
  }

  function applyPreset(name) {
    const p = PRESETS[name]
    if (!p) return
    setSelectedPreset(name)
    setQuality(q => ({ ...q, brightness: p.brightness ?? q.brightness, contrast: p.contrast ?? q.contrast, saturation: p.saturation ?? q.saturation }))
    setVibrance(p.vibrance ?? 0)
    setClarity(p.clarity ?? 0)
    setTemperature(p.temperature ?? 0)
    setTint(p.tint ?? 0)
    setShadows(p.shadows ?? 0)
    setHighlights(p.highlights ?? 0)
    setDehaze(p.dehaze ?? 0)
    setVignette(p.vignette ?? 0)
  }

  function resetAllQuality() {
    setSelectedPreset('none')
    setQuality({ brightness: 0, contrast: 0, saturation: 0, blur: 0, sharpen: 0, noise: 0, smooth: 0 })
    setVibrance(0); setClarity(0); setTemperature(0); setTint(0)
    setShadows(0); setHighlights(0); setDehaze(0); setVignette(0); setHueShift(0)
  }

  function applyQuality() {
    if (!image) return
    setLoading(true)
    setTimeout(() => {
      let data = new Uint8ClampedArray(image.data)
      const w = image.w, h = image.h

      // Temperature / Tint (before other adjustments)
      if (temperature !== 0 || tint !== 0) data = adjustTemperatureTint(data, temperature, tint)

      // Hue shift
      if (hueShift !== 0) data = adjustHue(data, hueShift)

      // Blur / Smooth (do before sharpening)
      if (quality.blur > 0) data = stackBlur(data, w, h, quality.blur)
      if (quality.smooth > 0) {
        for (let i = 0; i < quality.smooth; i++) data = convolve(data, w, h, KERNELS.gaussian3, 3)
      }

      // Unsharp mask (pro sharpening)
      if (quality.sharpen > 0) data = unsharpMask(data, w, h, quality.sharpen * 20, 2)

      // HSL base adjustments
      if (quality.brightness !== 0 || quality.contrast !== 0 || quality.saturation !== 0) {
        data = adjustHSL(new Uint8ClampedArray(data), quality.brightness, quality.contrast, quality.saturation)
      }

      // Vibrance (smart saturation)
      if (vibrance !== 0) data = adjustVibrance(new Uint8ClampedArray(data), vibrance)

      // Clarity (local contrast)
      if (clarity !== 0) data = adjustClarity(new Uint8ClampedArray(data), w, h, clarity)

      // Dehaze
      if (dehaze > 0) data = adjustDehaze(new Uint8ClampedArray(data), w, h, dehaze)

      // Shadows / Highlights
      if (shadows !== 0 || highlights !== 0) data = adjustShadowsHighlights(new Uint8ClampedArray(data), shadows, highlights)

      // Vignette
      if (vignette !== 0) data = applyVignette(new Uint8ClampedArray(data), w, h, vignette)

      // Noise
      if (quality.noise > 0) data = addNoise(new Uint8ClampedArray(data), quality.noise)

      pushHistory(data, w, h)
      renderToCanvas(data, w, h)
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(data) }))
      setLoading(false)
      setMsg('Filtres appliqués')
    }, 100)
  }

  function autoRemove() {
    if (!image) return
    setLoading(true)
    setTimeout(() => {
      let m = new Uint8ClampedArray(image.w * image.h)
      if (bgType === 'edge') {
        // Sobel edge detection for sharper contours
        const edges = sobelEdges(image.data, image.w, image.h, tolerance)
        // Keep interior, remove edges as background
        m = invertMask(edges)
        m = dilateMask(m, image.w, image.h, 2)
        m = smoothMask(m, image.w, image.h, 2)
      } else if (bgType === 'skin') {
        // Advanced HSV-based skin detection
        m = skinMaskAdvanced(image.data, image.w, image.h)
        m = dilateMask(m, image.w, image.h, 2)
        m = smoothMask(m, image.w, image.h, 2)
      } else if (bgType === 'color') {
        // Sample more points for robust bg color detection
        const pts = [[0,0], [image.w-1,0], [0,image.h-1], [image.w-1,image.h-1],
                     [Math.floor(image.w/2),0], [Math.floor(image.w/2),image.h-1],
                     [0,Math.floor(image.h/2)], [image.w-1,Math.floor(image.h/2)]]
        const avgs = pts.map(([cx, cy]) => {
          const i = (cy * image.w + cx) * 4
          return [image.data[i], image.data[i+1], image.data[i+2]]
        })
        const tr = avgs.reduce((a, v) => a + v[0], 0) / avgs.length
        const tg = avgs.reduce((a, v) => a + v[1], 0) / avgs.length
        const tb = avgs.reduce((a, v) => a + v[2], 0) / avgs.length
        for (let i = 0; i < image.w * image.h; i++) {
          const p = i * 4
          const d2 = (image.data[p] - tr)**2 + (image.data[p+1] - tg)**2 + (image.data[p+2] - tb)**2
          if (d2 > tolerance * tolerance * 3) m[i] = 255
        }
      } else if (bgType === 'auto') {
        // Multi-strategy: corners + center sampling, then Sobel refinement
        const pts = [[0,0], [image.w-1,0], [0,image.h-1], [image.w-1,image.h-1],
                     [Math.floor(image.w/4),0], [Math.floor(image.w*0.75),0],
                     [0,Math.floor(image.h/4)], [image.w-1,Math.floor(image.h/4)]]
        const avgs = pts.map(([cx, cy]) => {
          const i = (cy * image.w + cx) * 4
          return [image.data[i], image.data[i+1], image.data[i+2]]
        })
        const tr = avgs.reduce((a, v) => a + v[0], 0) / avgs.length
        const tg = avgs.reduce((a, v) => a + v[1], 0) / avgs.length
        const tb = avgs.reduce((a, v) => a + v[2], 0) / avgs.length
        for (let i = 0; i < image.w * image.h; i++) {
          const p = i * 4
          const d2 = (image.data[p] - tr)**2 + (image.data[p+1] - tg)**2 + (image.data[p+2] - tb)**2
          if (d2 > tolerance * tolerance * 2.5) m[i] = 255
        }
        // Refine with Sobel edges to clean up borders
        const edges = sobelEdges(image.data, image.w, image.h, 20)
        for (let i = 0; i < image.w * image.h; i++) {
          if (edges[i] && m[i]) m[i] = 255 // reinforce edges in mask
        }
        m = dilateMask(m, image.w, image.h, 1)
        m = smoothMask(m, image.w, image.h, 2)
      }
      setMask(m)
      previewMask(m)
      setLoading(false)
      setMsg('Auto-détection terminée — affinez si besoin')
    }, 100)
  }

  function resetMask() {
    if (!image) return
    setMask(new Uint8ClampedArray(image.w * image.h))
    renderToCanvas(image.data, image.w, image.h)
  }

  function invertCurrentMask() {
    if (!mask) return
    const m = new Uint8ClampedArray(mask)
    invertMask(m)
    setMask(m)
    previewMask(m)
  }

  /* ─── AI / Advanced detection functions ─── */

  function detectSmartSubject() {
    if (!image) return
    setAiLoading(true)
    setAiAction('Analyse intelligente du sujet...')
    // Use worker for non-blocking computation
    if (workerRef.current) {
      const data = image.data.slice()
      workerRef.current.postMessage({
        type: 'smartSubject',
        payload: { data, w: image.w, h: image.h },
        id: Date.now(),
      }, [data.buffer])
    } else {
      // Fallback direct
      setTimeout(() => {
        const m = smartSubjectDetection(image.data, image.w, image.h)
        setMask(m)
        previewMask(m)
        setAiLoading(false)
        setMsg('Détection intelligente terminée')
      }, 100)
    }
  }

  async function removeBackgroundCloud() {
    if (!image) return
    setAiLoading(true)
    setAiAction('Suppression de fond IA (cloud)...')
    setMsg('Envoi vers IA cloud... cela peut prendre 10-20s')
    try {
      const c = document.createElement('canvas')
      c.width = image.w; c.height = image.h
      c.getContext('2d').putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
      const dataUri = c.toDataURL('image/png')
      const resultUrl = await removeBackgroundAI(dataUri)
      // Load result back
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = resultUrl })
      const c2 = document.createElement('canvas')
      c2.width = image.w; c2.height = image.h
      const ctx2 = c2.getContext('2d')
      ctx2.drawImage(img, 0, 0, image.w, image.h)
      const newData = ctx2.getImageData(0, 0, image.w, image.h).data
      pushHistory(newData, image.w, image.h)
      renderToCanvas(newData, image.w, image.h)
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(newData) }))
      setMsg('Fond supprimé par IA')
    } catch (e) {
      setMsg('Erreur IA cloud: ' + e.message)
    }
    setAiLoading(false)
    setAiAction('')
  }

  async function enhanceImageCloud() {
    if (!image) return
    setAiLoading(true)
    setAiAction('Enhancement IA (cloud)...')
    setMsg('Amélioration en cours...')
    try {
      const c = document.createElement('canvas')
      c.width = image.w; c.height = image.h
      c.getContext('2d').putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
      const dataUri = c.toDataURL('image/png')
      const resultUrl = await enhanceAI(dataUri)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = resultUrl })
      const c2 = document.createElement('canvas')
      const scale = 2
      c2.width = image.w * scale; c2.height = image.h * scale
      const ctx2 = c2.getContext('2d')
      ctx2.drawImage(img, 0, 0, c2.width, c2.height)
      const newData = ctx2.getImageData(0, 0, c2.width, c2.height).data
      pushHistory(newData, c2.width, c2.height)
      renderToCanvas(newData, c2.width, c2.height)
      setImage({ src: null, w: c2.width, h: c2.height, data: new Uint8ClampedArray(newData) })
      setMsg('Image améliorée et upscalée x2')
    } catch (e) {
      setMsg('Erreur enhancement: ' + e.message)
    }
    setAiLoading(false)
    setAiAction('')
  }

  async function restoreImageCloud() {
    if (!image) return
    setAiLoading(true)
    setAiAction('Restauration IA (cloud)...')
    setMsg('Restauration en cours...')
    try {
      const c = document.createElement('canvas')
      c.width = image.w; c.height = image.h
      c.getContext('2d').putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
      const dataUri = c.toDataURL('image/png')
      const resultUrl = await restoreAI(dataUri)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = resultUrl })
      const c2 = document.createElement('canvas')
      c2.width = image.w; c2.height = image.h
      const ctx2 = c2.getContext('2d')
      ctx2.drawImage(img, 0, 0, image.w, image.h)
      const newData = ctx2.getImageData(0, 0, image.w, image.h).data
      pushHistory(newData, image.w, image.h)
      renderToCanvas(newData, image.w, image.h)
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(newData) }))
      setMsg('Image restaurée')
    } catch (e) {
      setMsg('Erreur restauration: ' + e.message)
    }
    setAiLoading(false)
    setAiAction('')
  }

  /* ─── Transform operations ─── */

  function handleRotate(deg) {
    if (!image) return
    const { data: d, w: nw, h: nh } = rotateImage(image.data, image.w, image.h, deg)
    pushHistory(d, nw, nh)
    renderToCanvas(d, nw, nh)
    setImage({ src: null, w: nw, h: nh, data: new Uint8ClampedArray(d) })
    setMask(new Uint8ClampedArray(nw * nh))
    setMsg(`Rotation ${deg}° appliquée`)
  }

  function handleFlip(horizontal) {
    if (!image) return
    const { data: d, w, h } = flipImage(image.data, image.w, image.h, horizontal)
    pushHistory(d, w, h)
    renderToCanvas(d, w, h)
    setImage(prev => ({ ...prev, data: new Uint8ClampedArray(d) }))
    setMsg(horizontal ? 'Retournement horizontal' : 'Retournement vertical')
  }

  function applyCrop() {
    if (!image || !cropRect) return
    const { x, y, w: cw, h: ch } = cropRect
    const x0 = clamp(Math.round(x), 0, image.w - 1)
    const y0 = clamp(Math.round(y), 0, image.h - 1)
    const cw2 = clamp(Math.round(cw), 1, image.w - x0)
    const ch2 = clamp(Math.round(ch), 1, image.h - y0)
    const { data: d, w: nw, h: nh } = cropImage(image.data, image.w, image.h, x0, y0, cw2, ch2)
    pushHistory(d, nw, nh)
    renderToCanvas(d, nw, nh)
    setImage({ src: null, w: nw, h: nh, data: new Uint8ClampedArray(d) })
    setMask(new Uint8ClampedArray(nw * nh))
    setCropRect(null)
    setCropMode(false)
    setMsg(`Recadrage ${nw}×${nh}px`)
  }

  function applyResize() {
    if (!image || resizeW <= 0 || resizeH <= 0) return
    const nw = clamp(resizeW, 16, 4096)
    const nh = clamp(resizeH, 16, 4096)
    const { data: d, w: nw2, h: nh2 } = resizeImage(image.data, image.w, image.h, nw, nh)
    pushHistory(d, nw2, nh2)
    renderToCanvas(d, nw2, nh2)
    setImage({ src: null, w: nw2, h: nh2, data: new Uint8ClampedArray(d) })
    setMask(new Uint8ClampedArray(nw2 * nh2))
    setMsg(`Redimensionnement ${nw2}×${nh2}px`)
  }

  function applySmartCrop() {
    if (!image || !mask) return
    // Find bounding box of mask
    let minX = image.w, minY = image.h, maxX = 0, maxY = 0
    for (let y = 0; y < image.h; y++) {
      for (let x = 0; x < image.w; x++) {
        if (mask[y * image.w + x]) {
          minX = Math.min(minX, x); minY = Math.min(minY, y)
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
        }
      }
    }
    if (minX >= maxX || minY >= maxY) { setMsg('Aucun sujet détecté'); return }
    // Add 10% padding
    const padX = Math.round((maxX - minX) * 0.1)
    const padY = Math.round((maxY - minY) * 0.1)
    const x0 = clamp(minX - padX, 0, image.w)
    const y0 = clamp(minY - padY, 0, image.h)
    const x1 = clamp(maxX + padX, 0, image.w)
    const y1 = clamp(maxY + padY, 0, image.h)
    const cw = x1 - x0, ch = y1 - y0
    const { data: d, w: nw, h: nh } = cropImage(image.data, image.w, image.h, x0, y0, cw, ch)
    pushHistory(d, nw, nh)
    renderToCanvas(d, nw, nh)
    setImage({ src: null, w: nw, h: nh, data: new Uint8ClampedArray(d) })
    setMask(new Uint8ClampedArray(nw * nh))
    setMsg(`Smart crop ${nw}×${nh}px`)
  }

  function applyWatermark() {
    if (!image || !watermarkText.trim()) return
    const c = document.createElement('canvas')
    c.width = image.w; c.height = image.h
    const ctx = c.getContext('2d')
    ctx.putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
    ctx.font = 'bold 24px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 2
    const txt = watermarkText
    const tw = ctx.measureText(txt).width
    let tx, ty
    switch (watermarkPos) {
      case 'top-left': tx = 20; ty = 36; break
      case 'top-right': tx = image.w - tw - 20; ty = 36; break
      case 'bottom-left': tx = 20; ty = image.h - 16; break
      case 'center': tx = (image.w - tw) / 2; ty = image.h / 2; break
      default: tx = image.w - tw - 20; ty = image.h - 16
    }
    ctx.strokeText(txt, tx, ty)
    ctx.fillText(txt, tx, ty)
    const newData = ctx.getImageData(0, 0, image.w, image.h).data
    pushHistory(newData, image.w, image.h)
    renderToCanvas(newData, image.w, image.h)
    setImage(prev => ({ ...prev, data: new Uint8ClampedArray(newData) }))
    setMsg('Watermark appliqué')
  }

  function handleSetPresetSize(w, h, name) {
    if (!image) return
    setResizeW(w); setResizeH(h); setKeepRatio(true)
    setMsg(`Preset ${name} : ${w}×${h}`)
  }

  /* ─── Curves ─── */
  function applyCurvesToImage() {
    if (!image) return
    const data = applyCurves(image.data, image.w, image.h, curves)
    pushHistory(data, image.w, image.h)
    renderToCanvas(data, image.w, image.h)
    setImage(prev => ({ ...prev, data: new Uint8ClampedArray(data) }))
    setMsg('Courbes RVB appliquées')
  }

  function resetCurves() {
    setCurves({ r: [0, 0, 0], g: [0, 0, 0], b: [0, 0, 0] })
  }

  /* ─── LocalStorage Save/Load ─── */
  function saveProject() {
    if (!image) return
    const project = {
      w: image.w, h: image.h,
      data: Array.from(image.data),
      mask: mask ? Array.from(mask) : null,
      quality, temperature, tint, vibrance, clarity, dehaze, shadows, highlights, vignette, hueShift,
      curves,
      timestamp: Date.now(),
    }
    localStorage.setItem('imagePro_project', JSON.stringify(project))
    setMsg('Projet sauvegardé')
  }

  function loadProject() {
    const raw = localStorage.getItem('imagePro_project')
    if (!raw) { setMsg('Aucun projet sauvegardé'); return }
    try {
      const p = JSON.parse(raw)
      const d = new Uint8ClampedArray(p.data)
      setImage({ src: null, w: p.w, h: p.h, data: d })
      setMask(p.mask ? new Uint8ClampedArray(p.mask) : new Uint8ClampedArray(p.w * p.h))
      if (p.quality) setQuality(p.quality)
      if (p.curves) setCurves(p.curves)
      if (p.temperature !== undefined) setTemperature(p.temperature)
      if (p.tint !== undefined) setTint(p.tint)
      if (p.vibrance !== undefined) setVibrance(p.vibrance)
      if (p.clarity !== undefined) setClarity(p.clarity)
      if (p.dehaze !== undefined) setDehaze(p.dehaze)
      if (p.shadows !== undefined) setShadows(p.shadows)
      if (p.highlights !== undefined) setHighlights(p.highlights)
      if (p.vignette !== undefined) setVignette(p.vignette)
      if (p.hueShift !== undefined) setHueShift(p.hueShift)
      pushHistory(d, p.w, p.h)
      renderToCanvas(d, p.w, p.h)
      setActiveTab('edit')
      setMsg('Projet chargé')
    } catch (e) {
      setMsg('Erreur chargement projet')
    }
  }

  /* ─── Batch processing ─── */
  async function processBatchFiles(files) {
    if (!files.length) return
    setBatchProcessing(true)
    setBatchResults([])
    const results = []
    for (const file of files) {
      const url = URL.createObjectURL(file)
      const img = new window.Image()
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url })
      let w = img.width, h = img.height
      const maxW = 1600, maxH = 1600
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const d = ctx.getImageData(0, 0, w, h).data
      // Apply same quality settings
      let data = new Uint8ClampedArray(d)
      if (quality.brightness !== 0 || quality.contrast !== 0 || quality.saturation !== 0)
        data = adjustHSL(new Uint8ClampedArray(data), quality.brightness, quality.contrast, quality.saturation)
      if (quality.blur > 0) data = stackBlur(data, w, h, quality.blur)
      if (quality.sharpen > 0) data = unsharpMask(data, w, h, quality.sharpen * 20, 2)
      if (vibrance !== 0) data = adjustVibrance(new Uint8ClampedArray(data), vibrance)
      if (clarity !== 0) data = adjustClarity(new Uint8ClampedArray(data), w, h, clarity)
      if (temperature !== 0 || tint !== 0) data = adjustTemperatureTint(data, temperature, tint)
      // Export
      const outC = document.createElement('canvas')
      outC.width = w; outC.height = h
      outC.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0)
      results.push({ name: file.name, url: outC.toDataURL('image/png'), w, h })
    }
    setBatchResults(results)
    setBatchProcessing(false)
    setMsg(`${results.length} images traitées`)
  }

  async function checkAccessThen(action) {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return false
    await guard.recordUsage({ action })
    return true
  }

  function downloadBatchResult(url, name) {
    const link = document.createElement('a')
    link.href = url
    link.download = `pro-${name}`
    link.click()
  }

  async function download(format = 'png') {
    const ok = await checkAccessThen()
    if (!ok) return
    const c = canvasRef.current
    if (!c) return
    const link = document.createElement('a')
    link.download = `image-pro-${Date.now()}.${format}`
    link.href = c.toDataURL(`image/${format}`, 0.92)
    link.click()
  }

  /* ─── Green Screen / Chroma Key ─── */
  function applyChromaKey() {
    if (!image) return
    setLoading(true)
    setTimeout(() => {
      const keyColor = chromaAuto ? detectDominantBgColor(image.data, image.w, image.h) : chromaColor
      const m = greenScreenMask(image.data, image.w, image.h, keyColor, chromaTolerance)
      setMask(m)
      previewMask(m)
      setLoading(false)
      setMsg(`Chroma key ${chromaAuto ? '(auto)' : ''} appliqué`)
    }, 50)
  }

  /* ─── Text Overlay Pro ─── */
  function applyTextOverlay() {
    if (!image || !overlayText.trim()) return
    const c = document.createElement('canvas')
    c.width = image.w; c.height = image.h
    const ctx = c.getContext('2d')
    ctx.putImageData(new ImageData(image.data, image.w, image.h), 0, 0)
    ctx.save()
    ctx.font = `bold ${overlayFontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const tw = ctx.measureText(overlayText).width
    let tx, ty
    switch (overlayTextPos) {
      case 'top-left': tx = tw/2 + 20; ty = overlayFontSize; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; break
      case 'top-right': tx = image.w - tw/2 - 20; ty = overlayFontSize; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; break
      case 'bottom-left': tx = 20; ty = image.h - overlayFontSize/2 - 10; ctx.textAlign = 'left'; break
      case 'bottom-right': tx = image.w - 20; ty = image.h - overlayFontSize/2 - 10; ctx.textAlign = 'right'; break
      default: tx = image.w / 2; ty = image.h / 2
    }
    ctx.translate(tx, ty)
    ctx.rotate((overlayTextRotation * Math.PI) / 180)
    if (overlayTextBg !== 'transparent') {
      const pad = overlayFontSize * 0.3
      ctx.fillStyle = overlayTextBg
      ctx.fillRect(-tw/2 - pad, -overlayFontSize/2 - pad/2, tw + pad*2, overlayFontSize + pad)
    }
    if (overlayTextOutline) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'
      ctx.lineWidth = Math.max(2, overlayFontSize / 12)
      ctx.strokeText(overlayText, 0, 0)
    }
    ctx.fillStyle = overlayTextColor
    ctx.fillText(overlayText, 0, 0)
    ctx.restore()
    const newData = ctx.getImageData(0, 0, image.w, image.h).data
    pushHistory(newData, image.w, image.h)
    renderToCanvas(newData, image.w, image.h)
    setImage(prev => ({ ...prev, data: new Uint8ClampedArray(newData) }))
    setMsg('Texte ajouté')
  }

  /* ─── Blend Mode background replace ─── */
  function applyReplaceBgBlend() {
    if (!image || !mask) return
    setLoading(true)
    setTimeout(() => {
      const fg = new Uint8ClampedArray(image.data)
      applyMaskToAlpha(fg, mask, image.w, image.h, false)
      const bg = buildBackground(image.w, image.h)
      const out = new Uint8ClampedArray(image.w * image.h * 4)
      if (blendMode === 'normal') {
        composite(bg, fg, out, image.w, image.h)
      } else {
        compositeWithBlend(bg, fg, out, image.w, image.h, blendMode)
      }
      pushHistory(out, image.w, image.h)
      renderToCanvas(out, image.w, image.h)
      setImage(prev => ({ ...prev, data: new Uint8ClampedArray(out) }))
      setLoading(false)
      setMsg(`Fond remplacé (${blendMode})`)
    }, 50)
  }

  /* ─── Clone Stamp helpers ─── */
  function applyCloneStamp(cx, cy) {
    if (!image || !cloneSource) return
    const size = cloneSize
    const half = Math.floor(size / 2)
    const data = new Uint8ClampedArray(image.data)
    const [sx, sy] = cloneSource
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) {
        const dx = cx + x, dy = cy + y
        const sdx = sx + x, sdy = sy + y
        if (dx >= 0 && dx < image.w && dy >= 0 && dy < image.h && sdx >= 0 && sdx < image.w && sdy >= 0 && sdy < image.h) {
          const di = (dy * image.w + dx) * 4
          const si = (sdy * image.w + sdx) * 4
          data[di] = image.data[si]
          data[di+1] = image.data[si+1]
          data[di+2] = image.data[si+2]
        }
      }
    }
    pushHistory(data, image.w, image.h)
    renderToCanvas(data, image.w, image.h)
    setImage(prev => ({ ...prev, data: new Uint8ClampedArray(data) }))
  }

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histIdx, history])

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 3000); return () => clearTimeout(t) } }, [msg])

  // Histogram: update when image changes
  useEffect(() => {
    if (!image || !histoRef.current) return
    const hist = computeHistogram(image.data)
    drawHistogramCanvas(histoRef.current, hist, histoRef.current.clientWidth || 300, 80)
  }, [image, histIdx])

  // Compare mode: restore current image when turning off
  useEffect(() => {
    if (!compareMode && history[histIdx]) {
      renderToCanvas(history[histIdx].data, history[histIdx].w, history[histIdx].h)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode])

  const CSS = `
.ip { --accent: ${ACCENT}; --gold: ${GOLD}; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); }
.ip-body { display: flex; flex-direction: row; gap: 20px; padding: 0 clamp(16px,4vw,40px) 40px; align-items: flex-start; }
.ip-sidebar { background: var(--bg-secondary, var(--bg-card)); border: 1px solid var(--border); border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 14px; width: 290px; min-width: 260px; flex-shrink: 0; position: sticky; top: 80px; max-height: calc(100vh - 96px); overflow-y: auto; overflow-x: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.06); scrollbar-width: thin; z-index: 1; }
.ip-section-title { font-size: .66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin: 0 0 8px; }
.ip-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; font-size: .86rem; font-weight: 700; cursor: pointer; transition: all .18s; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: .2px; }
.ip-btn--primary { background: linear-gradient(135deg,#7c3aed,#a855f7); color: #fff; box-shadow: 0 4px 16px rgba(124,58,237,.35); }
.ip-btn--primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,.45); }
.ip-btn--primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
.ip-btn--gold { background: linear-gradient(135deg,#f0b429,#f59e0b); color: #1a1a1a; box-shadow: 0 4px 16px rgba(240,180,41,.35); }
.ip-btn--gold:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(240,180,41,.45); }
.ip-btn--secondary { background: var(--bg-primary); color: var(--text-primary); border: 1.5px solid var(--border); }
.ip-btn--secondary:hover { border-color: var(--accent); color: var(--accent); background: rgba(124,58,237,.06); }
.ip-tool-row { display: flex; gap: 6px; flex-wrap: wrap; }
.ip-tool { padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--bg-primary); font-size: .76rem; font-weight: 700; cursor: pointer; transition: all .18s; color: var(--text-secondary); }
.ip-tool:hover { border-color: var(--accent); color: var(--accent); background: rgba(124,58,237,.06); }
.ip-tool.active { border-color: var(--accent); background: linear-gradient(135deg,rgba(124,58,237,.12),rgba(168,85,247,.08)); color: var(--accent); box-shadow: 0 2px 8px rgba(124,58,237,.15); }
.ip-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: var(--border); outline: none; cursor: pointer; }
.ip-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg,#7c3aed,#a855f7); cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,.4); border: 2px solid #fff; transition: transform .15s; }
.ip-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
.ip-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg,#7c3aed,#a855f7); cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,.4); border: 2px solid #fff; }
.ip-canvas-wrap { background: var(--bg-secondary, var(--bg-card)); border: 1px solid var(--border); border-radius: 20px; min-height: 520px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.06); flex: 1; min-width: 0; }
.ip-canvas-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 10px; background: var(--bg-primary); }
.ip-canvas-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: auto; background-image: linear-gradient(45deg, var(--bg-primary) 25%, transparent 25%), linear-gradient(-45deg, var(--bg-primary) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--bg-primary) 75%), linear-gradient(-45deg, transparent 75%, var(--bg-primary) 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; background-color: var(--bg-secondary, var(--bg-card)); }
.ip-canvas-area canvas { max-width: 100%; max-height: 560px; border-radius: 12px; cursor: crosshair; box-shadow: 0 8px 32px rgba(0,0,0,.15); transition: box-shadow .2s; }
.ip-canvas-area canvas:hover { box-shadow: 0 12px 40px rgba(0,0,0,.2); }
.ip-empty { text-align: center; padding: 80px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.ip-empty-box { border: 2px dashed var(--border); border-radius: 20px; padding: 48px 40px; background: var(--bg-primary); transition: all .25s; cursor: pointer; max-width: 480px; width: 100%; }
.ip-empty-box:hover, .ip-empty-box.dragover { border-color: var(--accent); background: rgba(124,58,237,.04); }
.ip-empty-box.dragover { transform: scale(1.02); }
.ip-empty-icon { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg,rgba(124,58,237,.15),rgba(168,85,247,.1)); display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px; }
.ip-tabs { display: flex; gap: 6px; margin-bottom: 16px; background: var(--bg-primary); border-radius: 12px; padding: 4px; }
.ip-tab { flex: 1; padding: 9px 4px; border: none; border-radius: 10px; background: transparent; font-size: .76rem; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
.ip-tab:hover { color: var(--text-secondary); }
.ip-tab.active { color: #fff; background: linear-gradient(135deg,#7c3aed,#a855f7); box-shadow: 0 4px 12px rgba(124,58,237,.3); }
.ip-msg { position: fixed; bottom: 24px; right: 24px; background: linear-gradient(135deg,#7c3aed,#a855f7); color: #fff; padding: 12px 20px; border-radius: 12px; font-size: .86rem; font-weight: 700; box-shadow: 0 8px 28px rgba(124,58,237,.4); animation: ip-slideup .35s cubic-bezier(.34,1.56,.64,1); z-index: 9999; }
@keyframes ip-slideup { from { transform: translateY(30px) scale(.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.ip-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ip-input-file { display: none; }
.ip-file-btn { display: block; width: 100%; box-sizing: border-box; padding: 20px 16px; border: 2px dashed var(--border); border-radius: 14px; text-align: center; cursor: pointer; transition: all .2s; color: var(--text-secondary); font-size: .85rem; font-weight: 600; background: var(--bg-primary); }
.ip-file-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(124,58,237,.04); }
.ip-quality-grid { display: grid; gap: 8px; }
.ip-quality-row { display: flex; align-items: center; gap: 8px; }
.ip-quality-label { font-size: .7rem; font-weight: 700; color: var(--text-secondary); width: 82px; flex-shrink: 0; }
.ip-quality-val { font-size: .7rem; font-weight: 700; color: var(--accent); width: 34px; text-align: right; flex-shrink: 0; }
.ip-divider { height: 1px; background: var(--border); margin: 2px 0; }
.ip-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 100px; background: rgba(124,58,237,.1); color: var(--accent); font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; }
.ip-compare-btn { padding: 6px 12px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg-primary); font-size: .75rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; transition: all .18s; }
.ip-compare-btn:hover { border-color: var(--accent); color: var(--accent); }
.ip-compare-btn.active { border-color: var(--accent); background: rgba(124,58,237,.1); color: var(--accent); }
.ip-preset-select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: .82rem; font-weight: 700; cursor: pointer; outline: none; }
.ip-preset-select:focus { border-color: var(--accent); }
@media (max-width: 900px) { .ip-body { flex-direction: column; } .ip-sidebar { position: static; width: 100%; min-width: unset; max-height: none; } .ip-canvas-area canvas { max-height: 420px; } }
`

  return (
    <>
      <SEO title="Image Pro — Éditeur photo ultra-complet | ABAWI" description="Suppression de fond IA, Chroma Key, tampon de clonage, pipette, modes de fusion, texte stylisé, histogramme RGB, courbes RVB, recadrage, watermark, traitement par lot. 100% côté client."  image="/og-tools/image-pro.jpg"/>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 16px 0' }}>
        <ToolGuardBadge guard={guard} />
      </div>
      <div className="ip">
        <ToolHero
          icon={<ToolIcon name="image-pro" size={40} />}
          badge="PRO"
          title="Image"
          titleAccent="Pro"
          subtitle="Éditeur photo ultra-complet côté client — suppression de fond IA, Chroma Key, clonage, pipette, modes de fusion, histogramme, courbes RVB, traitement par lot."
          gradient="linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)"
          glowColor="rgba(124,58,237,0.4)"
          accentColor="#c4b5fd"
        />
        <ToolInfoPanel
          toolName="Image Pro"
          icon={<ToolIcon name="image-pro" size={28} />}
          description="Éditeur photo ultra-complet côté client : suppression de fond IA (cloud + local), Chroma Key / Green Screen, tampon de clonage, pipette, modes de fusion, texte stylisé, histogramme RGB, courbes RVB, recadrage, watermark, traitement par lot, sauvegarde de projet."
          benefits={[
            'Suppression de fond : baguette magique, détection contours, portrait HSV, Chroma Key / Green Screen avec auto-détection',
            'Remplacement d\'arrière-plan : couleur, dégradé, image personnalisée + 8 modes de fusion (multiply, screen, overlay, soft-light, hard-light, difference, exclusion)',
            'Outils créatifs : tampon de clonage, pipette (capture couleur), texte stylisé (taille, rotation, contour, fond)',
            'Ajustements pro : histogramme RGB, courbes RVB (ombres/tons moyens/hautes lumières), vibrance, clarté, déhaze, température, ombres/lumières, vignettage',
            'Transform : recadrage, redimensionnement, rotation 90°/180°/270°, flip, Smart Crop (masque), presets sociaux',
            'Comparaison avant/après, watermark, traitement par lot (batch), sauvegarde/chargement de projet',
            'Export PNG (transparence), JPEG, WebP — 100% côté client'
          ]}
          howToUse={[
            'Chargez une image (JPG, PNG, WebP, HEIC) par glisser-déposer ou clic',
            'Onglet Fond : suppression de fond par baguette magique, contours, portrait, couleur ou Chroma Key / Green Screen',
            'Onglet Arrière-plan : remplacez par couleur, dégradé, image ou mode de fusion (multiply, screen, overlay…)',
            'Onglet Qualité : histogramme RGB, courbes RVB, préréglages pro et ajustements manuels',
            'Onglet Transform : recadrage, redimensionnement, rotation/flip, watermark, texte stylisé',
            'Sélection : pipette pour capturer une couleur, tampon de clonage (Alt+clic = source)',
            'Traitement par lot : appliquez les mêmes réglages à plusieurs images',
            'Sauvegardez votre projet pour le reprendre plus tard',
            'Maintenez "Original" ou utilisez le slider de comparaison pour voir avant/après',
          ]}
          tips={[
            'Le préréglage "Portrait" protège les tons de peau tout en boostant les couleurs',
            'La Clarté agit sur le contraste local (effet Lightroom) sans brûler les hautes lumières',
            'Le Déhaze utilise le dark channel prior pour restaurer la profondeur',
            'Vibrance booste les couleurs faibles sans saturer les tons de peau',
            'Chroma Key : utilisez le mode Auto pour détecter automatiquement la couleur de fond (vert/bleu)',
            'Courbes RVB : ajustez les ombres, tons moyens et hautes lumières par canal séparément',
            'Pipette : cliquez n\'importe où sur l\'image pour capturer la couleur hexadécimale',
            'Clone stamp : Alt+clic pour définir la source, puis cliquez/drag pour cloner',
          ]}
        />

        <div className="ip-body">
          {/* ── Sidebar ── */}
          <aside className="ip-sidebar">
            {/* Upload */}
            {!image && (
              <div>
                <p className="ip-section-title">📁 Charger une image</p>
                <div className="ip-file-btn" role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Cliquez pour charger</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>JPG, PNG, WebP — max 1600px</div>
                </div>
                <input ref={fileRef} className="ip-input-file" type="file" accept="image/*" onChange={e => e.target.files?.[0] && loadImage(e.target.files[0])} />
              </div>
            )}

            {image && (
              <>
                {/* Tabs */}
                <div className="ip-tabs">
                  <button className={`ip-tab${mode === 'remove' ? ' active' : ''}`} onClick={() => setMode('remove')}>🪄 Fond</button>
                  <button className={`ip-tab${mode === 'replace' ? ' active' : ''}`} onClick={() => setMode('replace')}>🎨 Arrière-plan</button>
                  <button className={`ip-tab${mode === 'quality' ? ' active' : ''}`} onClick={() => setMode('quality')}>✨ Qualité</button>
                  <button className={`ip-tab${mode === 'transform' ? ' active' : ''}`} onClick={() => setMode('transform')}>🔧 Transform</button>
                </div>

                {/* ── Remove Background ── */}
                {mode === 'remove' && (
                  <>
                    <div>
                      <p className="ip-section-title">Outils de sélection</p>
                      <div className="ip-tool-row">
                        {['wand', 'brush', 'eraser'].map(t => (
                          <button key={t} className={`ip-tool${tool === t && !rectSelectMode && !pickerMode && !cloneMode ? ' active' : ''}`} onClick={() => { setTool(t); setRectSelectMode(false); setCropMode(false); setPickerMode(false); setCloneMode(false); }}>
                            {t === 'wand' ? '✨ Baguette' : t === 'brush' ? '🖌️ Pinceau' : '🧽 Gomme'}
                          </button>
                        ))}
                        <button className={`ip-tool${rectSelectMode ? ' active' : ''}`} onClick={() => { setRectSelectMode(!rectSelectMode); setCropMode(false); setPickerMode(false); setCloneMode(false); setTool('wand'); }} title="Sélection rectangle">
                          ⬜ Rect
                        </button>
                        <button className={`ip-tool${pickerMode ? ' active' : ''}`} onClick={() => { setPickerMode(!pickerMode); setCloneMode(false); setRectSelectMode(false); setCropMode(false); }} title="Pipette couleur">
                          🧪 Pipette
                        </button>
                        <button className={`ip-tool${cloneMode ? ' active' : ''}`} onClick={() => { setCloneMode(!cloneMode); setPickerMode(false); setRectSelectMode(false); setCropMode(false); setCloneSource(null); }} title="Tampon de clonage (Alt+clic = source)">
                          🖨️ Clone
                        </button>
                      </div>
                      {cloneMode && (
                        <div style={{ marginTop: 10 }}>
                          <div className="ip-quality-row">
                            <span className="ip-quality-label">Taille</span>
                            <input className="ip-slider" type="range" min={4} max={60} value={cloneSize} onChange={e => setCloneSize(+e.target.value)} />
                            <span className="ip-quality-val">{cloneSize}</span>
                          </div>
                          {cloneSource && <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Source: {cloneSource[0]},{cloneSource[1]}</div>}
                        </div>
                      )}
                      {(tool === 'brush' || tool === 'eraser') && (
                        <div style={{ marginTop: 10 }}>
                          <div className="ip-quality-row">
                            <span className="ip-quality-label">Taille</span>
                            <input className="ip-slider" type="range" min={2} max={80} value={brushSize} onChange={e => setBrushSize(+e.target.value)} />
                            <span className="ip-quality-val">{brushSize}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="ip-section-title">Algorithme auto</p>
                      <div className="ip-tool-row">
                        {[
                          { id: 'auto', label: '🤖 Auto' },
                          { id: 'color', label: '🎨 Couleur' },
                          { id: 'skin', label: '👤 Portrait' },
                          { id: 'edge', label: '✂️ Contours' },
                        ].map(b => (
                          <button key={b.id} className={`ip-tool${bgType === b.id ? ' active' : ''}`} onClick={() => setBgType(b.id)}>{b.label}</button>
                        ))}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="ip-quality-row">
                          <span className="ip-quality-label">Tolérance</span>
                          <input className="ip-slider" type="range" min={5} max={120} value={tolerance} onChange={e => setTolerance(+e.target.value)} />
                          <span className="ip-quality-val">{tolerance}</span>
                        </div>
                      </div>
                      <button className="ip-btn ip-btn--primary" style={{ marginTop: 10 }} onClick={autoRemove} disabled={loading || aiLoading}>
                        {loading ? '⏳ Analyse…' : '⚡ Détecter automatiquement'}
                      </button>
                    </div>

                    {/* ── Green Screen / Chroma Key ── */}
                    <div style={{ marginTop: 14, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <p className="ip-section-title" style={{ color: '#4ade80', marginTop: 0 }}>🎬 Chroma Key</p>
                      <div className="ip-quality-row" style={{ marginBottom: 8 }}>
                        <span className="ip-quality-label">Couleur</span>
                        <input type="color" value={chromaColor} onChange={e => setChromaColor(e.target.value)} style={{ width: 40, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={chromaAuto} onChange={e => setChromaAuto(e.target.checked)} /> Auto
                        </label>
                      </div>
                      <div className="ip-quality-row">
                        <span className="ip-quality-label">Tolérance</span>
                        <input className="ip-slider" type="range" min={10} max={200} value={chromaTolerance} onChange={e => setChromaTolerance(+e.target.value)} />
                        <span className="ip-quality-val">{chromaTolerance}</span>
                      </div>
                      <button className="ip-btn ip-btn--primary" style={{ marginTop: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} onClick={applyChromaKey} disabled={loading}>
                        🎬 Supprimer fond couleur
                      </button>
                    </div>

                    {/* ── AI Advanced Detection ── */}
                    <div style={{ marginTop: 14, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(240,180,41,0.08))', border: '1px solid rgba(124,58,237,0.25)' }}>
                      <p className="ip-section-title" style={{ color: '#A78BFA', marginTop: 0 }}>🧠 Détection IA avancée</p>
                      <div className="ip-tool-row" style={{ gap: 8 }}>
                        <button className="ip-btn ip-btn--primary" onClick={detectSmartSubject} disabled={aiLoading} title="Détection intelligente du sujet (local)">
                          {aiLoading && aiAction.includes('Analyse') ? '⏳ ' + aiAction : '🎯 Sujet intelligent'}
                        </button>
                        <button className="ip-btn ip-btn--primary" onClick={removeBackgroundCloud} disabled={aiLoading} title="Suppression pro de fond via IA cloud" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                          {aiLoading && aiAction.includes('fond') ? '⏳ ' + aiAction : '☁️ Fond IA Cloud'}
                        </button>
                      </div>
                      <div className="ip-tool-row" style={{ gap: 8, marginTop: 8 }}>
                        <button className="ip-btn ip-btn--secondary" onClick={enhanceImageCloud} disabled={aiLoading} title="Enhancement + upscale x2 via IA">
                          {aiLoading && aiAction.includes('Enhancement') ? '⏳ ' + aiAction : '✨ Enhancer x2'}
                        </button>
                        <button className="ip-btn ip-btn--secondary" onClick={restoreImageCloud} disabled={aiLoading} title="Restauration de visages vieilles photos">
                          {aiLoading && aiAction.includes('Restauration') ? '⏳ ' + aiAction : '📸 Restaurer'}
                        </button>
                      </div>
                    </div>

                    <div className="ip-grid-2">
                      <button className="ip-btn ip-btn--secondary" onClick={invertCurrentMask} disabled={aiLoading}>↔ Inverser</button>
                      <button className="ip-btn ip-btn--secondary" onClick={resetMask} disabled={aiLoading}>↺ Réinitialiser</button>
                    </div>

                    <button className="ip-btn ip-btn--gold" onClick={applyRemoveBg} disabled={loading || aiLoading}>
                      ✂️ Appliquer la suppression
                    </button>
                  </>
                )}

                {/* ── Replace Background ── */}
                {mode === 'replace' && (
                  <>
                    <div>
                      <p className="ip-section-title">Type d'arrière-plan</p>
                      <div className="ip-tool-row">
                        {[
                          { id: 'transparent', label: '◻ Transparent' },
                          { id: 'color', label: '🎨 Couleur' },
                          { id: 'gradient', label: '🌈 Dégradé' },
                          { id: 'image', label: '📷 Image' },
                        ].map(b => (
                          <button key={b.id} className={`ip-tool${bgMode === b.id ? ' active' : ''}`} onClick={() => setBgMode(b.id)}>{b.label}</button>
                        ))}
                      </div>
                    </div>

                    {bgMode === 'color' && (
                      <div>
                        <p className="ip-section-title">Couleur</p>
                        <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); previewMask(); }} style={{ width: '100%', height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                      </div>
                    )}

                    {bgMode === 'gradient' && (
                      <div>
                        <p className="ip-section-title">Dégradé</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="color" value={bgGradient[0]} onChange={e => { setBgGradient([e.target.value, bgGradient[1]]); previewMask(); }} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                          <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>→</span>
                          <input type="color" value={bgGradient[1]} onChange={e => { setBgGradient([bgGradient[0], e.target.value]); previewMask(); }} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                        </div>
                      </div>
                    )}

                    {bgMode === 'image' && (
                      <div>
                        <p className="ip-section-title">Image de fond</p>
                        <div className="ip-file-btn" role="button" tabIndex={0} onClick={() => bgFileRef.current?.click()}>
                          📁 Charger un fond
                        </div>
                        <input ref={bgFileRef} className="ip-input-file" type="file" accept="image/*" onChange={e => e.target.files?.[0] && loadBgImage(e.target.files[0])} />
                      </div>
                    )}

                    <div>
                      <p className="ip-section-title">Mode de fusion</p>
                      <div className="ip-tool-row">
                        {['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference', 'exclusion'].map(m => (
                          <button key={m} className={`ip-tool${blendMode === m ? ' active' : ''}`} onClick={() => setBlendMode(m)} style={{ fontSize: '.68rem' }}>
                            {m === 'normal' ? 'Normal' : m === 'soft-light' ? 'Soft' : m === 'hard-light' ? 'Hard' : m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="ip-btn ip-btn--gold" onClick={applyReplaceBgBlend} disabled={loading}>
                      🎨 Appliquer le fond
                    </button>
                  </>
                )}

                {/* ── Quality ── */}
                {mode === 'quality' && (
                  <>
                    {/* Presets */}
                    <div>
                      <p className="ip-section-title">Préréglages Pro</p>
                      <select className="ip-preset-select" value={selectedPreset} onChange={e => applyPreset(e.target.value)}>
                        <option value="none">— Choisir un préréglage —</option>
                        <option value="portrait">🧑 Portrait (peau naturelle)</option>
                        <option value="vibrant">🌈 Vibrant (couleurs vives)</option>
                        <option value="cinematic">🎬 Cinematic (film look)</option>
                        <option value="bw">⬛ Noir & Blanc</option>
                        <option value="vintage">📷 Vintage (rétro)</option>
                        <option value="hdr">🏔 HDR (détail max)</option>
                        <option value="moody">🌑 Moody (sombre)</option>
                        <option value="warm">☀ Warm (chaud)</option>
                        <option value="cool">❄ Cool (froid)</option>
                      </select>
                    </div>

                    <div className="ip-divider" />

                    {/* Light */}
                    <div>
                      <p className="ip-section-title">Lumière</p>
                      <div className="ip-quality-grid">
                        {[
                          { key: 'brightness', label: 'Luminosité', min: -100, max: 100 },
                          { key: 'contrast', label: 'Contraste', min: -100, max: 100 },
                          { key: 'shadows', label: 'Ombres', min: -100, max: 100, st: shadows, set: setShadows },
                          { key: 'highlights', label: 'Hautes lumières', min: -100, max: 100, st: highlights, set: setHighlights },
                        ].map(q => (
                          <div key={q.key} className="ip-quality-row">
                            <span className="ip-quality-label">{q.label}</span>
                            <input className="ip-slider" type="range" min={q.min} max={q.max} value={q.st ?? quality[q.key]} onChange={e => q.set ? q.set(+e.target.value) : setQuality(prev => ({ ...prev, [q.key]: +e.target.value }))} />
                            <span className="ip-quality-val">{q.st ?? quality[q.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ip-divider" />

                    {/* Color */}
                    <div>
                      <p className="ip-section-title">Couleur</p>
                      <div className="ip-quality-grid">
                        {[
                          { key: 'temperature', label: 'Température', min: -100, max: 100, st: temperature, set: setTemperature },
                          { key: 'tint', label: 'Teinte', min: -100, max: 100, st: tint, set: setTint },
                          { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                          { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, st: vibrance, set: setVibrance },
                          { key: 'hueShift', label: 'Rotation hue', min: -180, max: 180, st: hueShift, set: setHueShift },
                        ].map(q => (
                          <div key={q.key} className="ip-quality-row">
                            <span className="ip-quality-label">{q.label}</span>
                            <input className="ip-slider" type="range" min={q.min} max={q.max} value={q.st ?? quality[q.key]} onChange={e => q.set ? q.set(+e.target.value) : setQuality(prev => ({ ...prev, [q.key]: +e.target.value }))} />
                            <span className="ip-quality-val">{q.st ?? quality[q.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ip-divider" />

                    {/* Effects */}
                    <div>
                      <p className="ip-section-title">Effets</p>
                      <div className="ip-quality-grid">
                        {[
                          { key: 'clarity', label: 'Clarté', min: -100, max: 100, st: clarity, set: setClarity },
                          { key: 'dehaze', label: 'Déhaze', min: 0, max: 100, st: dehaze, set: setDehaze },
                          { key: 'vignette', label: 'Vignettage', min: -100, max: 100, st: vignette, set: setVignette },
                          { key: 'blur', label: 'Flou', min: 0, max: 10 },
                          { key: 'sharpen', label: 'Netteté', min: 0, max: 5 },
                          { key: 'smooth', label: 'Lissage', min: 0, max: 5 },
                          { key: 'noise', label: 'Grain', min: 0, max: 60 },
                        ].map(q => (
                          <div key={q.key} className="ip-quality-row">
                            <span className="ip-quality-label">{q.label}</span>
                            <input className="ip-slider" type="range" min={q.min} max={q.max} value={q.st ?? quality[q.key]} onChange={e => q.set ? q.set(+e.target.value) : setQuality(prev => ({ ...prev, [q.key]: +e.target.value }))} />
                            <span className="ip-quality-val">{q.st ?? quality[q.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ip-divider" />

                    {/* Tone Curves */}
                    <div>
                      <p className="ip-section-title">Courbes RVB (Tone)</p>
                      {[
                        { ch: 'r', label: 'Rouge', color: '#ef4444' },
                        { ch: 'g', label: 'Vert', color: '#22c55e' },
                        { ch: 'b', label: 'Bleu', color: '#3b82f6' },
                      ].map(({ ch, label, color }) => (
                        <div key={ch} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: '.72rem', fontWeight: 800, color, marginBottom: 4 }}>{label}</div>
                          <div className="ip-quality-grid">
                            {[
                              { idx: 0, lbl: 'Ombres' },
                              { idx: 1, lbl: 'Tons moyens' },
                              { idx: 2, lbl: 'Hautes lumières' },
                            ].map(({ idx, lbl }) => (
                              <div key={idx} className="ip-quality-row">
                                <span className="ip-quality-label" style={{ width: 90 }}>{lbl}</span>
                                <input className="ip-slider" type="range" min={-100} max={100} value={curves[ch][idx]} onChange={e => {
                                  const v = +e.target.value
                                  setCurves(prev => ({ ...prev, [ch]: prev[ch].map((c, i) => i === idx ? v : c) }))
                                }} />
                                <span className="ip-quality-val">{curves[ch][idx]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="ip-grid-2">
                        <button className="ip-btn ip-btn--primary" onClick={applyCurvesToImage} disabled={!image}>
                          🎚️ Appliquer courbes
                        </button>
                        <button className="ip-btn ip-btn--secondary" onClick={resetCurves}>
                          ↺ Reset courbes
                        </button>
                      </div>
                    </div>

                    <button className="ip-btn ip-btn--primary" onClick={applyQuality} disabled={loading}>
                      ✨ Appliquer les filtres
                    </button>
                    <button className="ip-btn ip-btn--secondary" onClick={resetAllQuality}>
                      ↺ Réinitialiser tout
                    </button>
                  </>
                )}

                {/* ── Transform ── */}
                {mode === 'transform' && (
                  <>
                    {/* Rotation & Flip */}
                    <div>
                      <p className="ip-section-title">Rotation & Flip</p>
                      <div className="ip-tool-row" style={{ gap: 8 }}>
                        <button className="ip-btn ip-btn--secondary" style={{ flex: 1 }} onClick={() => handleRotate(90)} disabled={!image}>↻ 90°</button>
                        <button className="ip-btn ip-btn--secondary" style={{ flex: 1 }} onClick={() => handleRotate(180)} disabled={!image}>↻ 180°</button>
                        <button className="ip-btn ip-btn--secondary" style={{ flex: 1 }} onClick={() => handleRotate(270)} disabled={!image}>↺ 270°</button>
                      </div>
                      <div className="ip-tool-row" style={{ gap: 8, marginTop: 8 }}>
                        <button className="ip-btn ip-btn--secondary" style={{ flex: 1 }} onClick={() => handleFlip(true)} disabled={!image}>⇄ Horiz</button>
                        <button className="ip-btn ip-btn--secondary" style={{ flex: 1 }} onClick={() => handleFlip(false)} disabled={!image}>⇅ Vert</button>
                      </div>
                    </div>

                    {/* Crop */}
                    <div>
                      <p className="ip-section-title">Recadrage</p>
                      <button className={`ip-btn${cropMode ? ' ip-btn--gold' : ' ip-btn--primary'}`} onClick={() => { setCropMode(!cropMode); setRectSelectMode(false); }} disabled={!image}>
                        {cropMode ? '✅ Confirmer sélection' : '✂️ Sélectionner zone'}
                      </button>
                      {cropMode && cropRect && cropRect.w > 0 && (
                        <div style={{ marginTop: 8, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                          Zone: {cropRect.w}×{cropRect.h}px
                          <button className="ip-btn ip-btn--gold" style={{ marginTop: 6 }} onClick={applyCrop}>📐 Appliquer recadrage</button>
                        </div>
                      )}
                      <button className="ip-btn ip-btn--secondary" style={{ marginTop: 8 }} onClick={applySmartCrop} disabled={!image || !mask || aiLoading}>
                        🎯 Smart Crop (masque)
                      </button>
                    </div>

                    {/* Resize */}
                    <div>
                      <p className="ip-section-title">Redimensionnement</p>
                      <div className="ip-quality-grid">
                        <div className="ip-quality-row">
                          <span className="ip-quality-label">Largeur</span>
                          <input type="number" min={16} max={4096} value={resizeW || (image?.w || 0)} onChange={e => {
                            const v = +e.target.value
                            setResizeW(v)
                            if (keepRatio && image) setResizeH(Math.round(v * image.h / image.w))
                          }} style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '.82rem' }} />
                          <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>px</span>
                        </div>
                        <div className="ip-quality-row">
                          <span className="ip-quality-label">Hauteur</span>
                          <input type="number" min={16} max={4096} value={resizeH || (image?.h || 0)} onChange={e => {
                            const v = +e.target.value
                            setResizeH(v)
                            if (keepRatio && image) setResizeW(Math.round(v * image.w / image.h))
                          }} style={{ width: 70, padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '.82rem' }} />
                          <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>px</span>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)} /> Conserver le ratio
                      </label>
                      <button className="ip-btn ip-btn--primary" style={{ marginTop: 10 }} onClick={applyResize} disabled={!image || resizeW <= 0 || resizeH <= 0}>
                        📐 Redimensionner
                      </button>
                    </div>

                    {/* Presets sociaux */}
                    <div>
                      <p className="ip-section-title">Presets réseaux sociaux</p>
                      <div className="ip-tool-row">
                        {[
                          { w: 1080, h: 1080, name: 'Insta Carré' },
                          { w: 1080, h: 1350, name: 'Insta Portrait' },
                          { w: 1080, h: 566, name: 'Insta Paysage' },
                          { w: 1200, h: 630, name: 'LinkedIn' },
                          { w: 1500, h: 500, name: 'Twitter Header' },
                          { w: 1920, h: 1080, name: 'HD 1080p' },
                        ].map(p => (
                          <button key={p.name} className="ip-tool" onClick={() => handleSetPresetSize(p.w, p.h, p.name)} disabled={!image}>{p.name}</button>
                        ))}
                      </div>
                    </div>

                    {/* Text Overlay Pro */}
                    <div>
                      <p className="ip-section-title">Texte stylisé</p>
                      <input type="text" placeholder="Votre texte..." value={overlayText} onChange={e => setOverlayText(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '.82rem', fontWeight: 600, marginBottom: 8, boxSizing: 'border-box' }} />
                      <div className="ip-quality-row">
                        <span className="ip-quality-label">Taille</span>
                        <input className="ip-slider" type="range" min={12} max={200} value={overlayFontSize} onChange={e => setOverlayFontSize(+e.target.value)} />
                        <span className="ip-quality-val">{overlayFontSize}</span>
                      </div>
                      <div className="ip-quality-row">
                        <span className="ip-quality-label">Rotation</span>
                        <input className="ip-slider" type="range" min={-180} max={180} value={overlayTextRotation} onChange={e => setOverlayTextRotation(+e.target.value)} />
                        <span className="ip-quality-val">{overlayTextRotation}°</span>
                      </div>
                      <div className="ip-tool-row" style={{ marginTop: 8 }}>
                        <input type="color" value={overlayTextColor} onChange={e => setOverlayTextColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} title="Couleur texte" />
                        <input type="color" value={overlayTextBg} onChange={e => setOverlayTextBg(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} title="Fond texte" />
                        <button className={`ip-tool${overlayTextOutline ? ' active' : ''}`} onClick={() => setOverlayTextOutline(!overlayTextOutline)} style={{ fontSize: '.68rem' }}>
                          {overlayTextOutline ? '✓' : '✗'} Contour
                        </button>
                      </div>
                      <div className="ip-tool-row" style={{ marginTop: 6 }}>
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map(pos => (
                          <button key={pos} className={`ip-tool${overlayTextPos === pos ? ' active' : ''}`} onClick={() => setOverlayTextPos(pos)} style={{ fontSize: '.68rem' }}>
                            {pos === 'top-left' ? '↖' : pos === 'top-right' ? '↗' : pos === 'bottom-left' ? '↙' : pos === 'bottom-right' ? '↘' : '⊙'}
                          </button>
                        ))}
                      </div>
                      <button className="ip-btn ip-btn--primary" style={{ marginTop: 8 }} onClick={applyTextOverlay} disabled={!image || !overlayText.trim()}>
                        📝 Ajouter texte
                      </button>
                    </div>

                    {/* Watermark */}
                    <div>
                      <p className="ip-section-title">Watermark</p>
                      <input type="text" placeholder="Votre texte..." value={watermarkText} onChange={e => setWatermarkText(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '.82rem', fontWeight: 600, marginBottom: 8, boxSizing: 'border-box' }} />
                      <div className="ip-tool-row">
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map(pos => (
                          <button key={pos} className={`ip-tool${watermarkPos === pos ? ' active' : ''}`} onClick={() => setWatermarkPos(pos)} style={{ fontSize: '.68rem' }}>
                            {pos === 'top-left' ? '↖' : pos === 'top-right' ? '↗' : pos === 'bottom-left' ? '↙' : pos === 'bottom-right' ? '↘' : '⊙'}
                          </button>
                        ))}
                      </div>
                      <button className="ip-btn ip-btn--primary" style={{ marginTop: 8 }} onClick={applyWatermark} disabled={!image || !watermarkText.trim()}>
                        🔏 Appliquer
                      </button>
                    </div>

                    {/* Batch Processing */}
                    <div>
                      <p className="ip-section-title">Traitement par lot</p>
                      <div className="ip-file-btn" role="button" tabIndex={0} onClick={() => document.getElementById('batch-input')?.click()}>
                        📁 Sélectionner plusieurs images
                      </div>
                      <input id="batch-input" className="ip-input-file" type="file" accept="image/*" multiple onChange={e => {
                        const files = Array.from(e.target.files || [])
                        if (files.length) processBatchFiles(files)
                      }} />
                      {batchProcessing && (
                        <div style={{ marginTop: 8, fontSize: '.78rem', color: 'var(--accent)', fontWeight: 700 }}>⏳ Traitement en cours...</div>
                      )}
                      {batchResults.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {batchResults.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'var(--bg-primary)', fontSize: '.75rem' }}>
                              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{r.name}</span>
                              <button className="ip-tool" style={{ padding: '4px 8px', fontSize: '.68rem' }} onClick={() => downloadBatchResult(r.url, r.name)}>⬇</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="ip-grid-2">
                    <button className="ip-btn ip-btn--secondary" onClick={saveProject} disabled={!image}>💾 Sauver</button>
                    <button className="ip-btn ip-btn--secondary" onClick={loadProject}>📂 Charger</button>
                  </div>
                  <div className="ip-grid-2">
                    <button className="ip-btn ip-btn--secondary" onClick={undo}>↩ Annuler</button>
                    <button className="ip-btn ip-btn--secondary" onClick={redo}>↪ Refaire</button>
                  </div>
                  <div className="ip-grid-2">
                    <button className="ip-btn ip-btn--primary" onClick={() => download('png')}>⬇ PNG</button>
                    <button className="ip-btn ip-btn--primary" onClick={() => download('jpeg')}>⬇ JPEG</button>
                  </div>
                  <button className="ip-btn ip-btn--secondary" onClick={() => { setImage(null); setHistory([]); setHistIdx(-1); setMask(null); }}>
                    🗑 Nouvelle image
                  </button>
                </div>
              </>
            )}
          </aside>

          {/* ── Canvas ── */}
          <section className="ip-canvas-wrap">
            <div className="ip-canvas-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text-primary)' }}>
                  {image ? `${image.w} × ${image.h}px` : 'Aperçu'}
                </span>
                {image && history.length > 1 && (
                  <>
                    <button
                      className={`ip-compare-btn${showOriginal ? ' active' : ''}`}
                      onMouseDown={() => { if (history[0]) renderToCanvas(history[0].data, history[0].w, history[0].h); setShowOriginal(true) }}
                      onMouseUp={() => { if (history[histIdx]) renderToCanvas(history[histIdx].data, history[histIdx].w, history[histIdx].h); setShowOriginal(false) }}
                      onMouseLeave={() => { if (showOriginal && history[histIdx]) { renderToCanvas(history[histIdx].data, history[histIdx].w, history[histIdx].h); setShowOriginal(false) } }}
                      onTouchStart={() => { if (history[0]) renderToCanvas(history[0].data, history[0].w, history[0].h); setShowOriginal(true) }}
                      onTouchEnd={() => { if (history[histIdx]) renderToCanvas(history[histIdx].data, history[histIdx].w, history[histIdx].h); setShowOriginal(false) }}
                    >
                      👁 Original
                    </button>
                    <button className={`ip-compare-btn${compareMode ? ' active' : ''}`} onClick={() => setCompareMode(!compareMode)}>
                      ↔ Compar.
                    </button>
                  </>
                )}
              </div>
              {image && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="ip-tool" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>−</button>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, minWidth: 44, textAlign: 'center', color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
                  <button className="ip-tool" onClick={() => setZoom(z => Math.min(4, z + 0.25))}>+</button>
                  <button className="ip-tool" onClick={() => setZoom(1)} title="Reset zoom">⟲</button>
                </div>
              )}
            </div>
            <div
              className="ip-canvas-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ position: 'relative' }}
            >
              {image ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={image.w}
                    height={image.h}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    onMouseDown={handleCanvasDown}
                    onMouseMove={handleCanvasMove}
                    onMouseUp={handleCanvasUp}
                    onMouseLeave={handleCanvasUp}
                    onTouchStart={handleCanvasDown}
                    onTouchMove={handleCanvasMove}
                    onTouchEnd={handleCanvasUp}
                  />
                  {compareMode && history.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: 20, zIndex: 2 }}>
                      <span style={{ fontSize: '.7rem', color: '#fff', fontWeight: 700 }}>Original</span>
                      <input type="range" min={0} max={100} value={Math.round(compareSplit * 100)} onChange={e => {
                        const split = +e.target.value / 100
                        setCompareSplit(split)
                        // Draw split view
                        const c = canvasRef.current; if (!c) return
                        const ctx = c.getContext('2d')
                        const cur = history[histIdx]
                        const orig = history[0]
                        if (!cur || !orig) return
                        const tmp = document.createElement('canvas')
                        tmp.width = cur.w; tmp.height = cur.h
                        const tctx = tmp.getContext('2d')
                        // Draw original on left, current on right
                        const splitX = Math.round(cur.w * split)
                        tctx.putImageData(new ImageData(orig.data, orig.w, orig.h), 0, 0)
                        const curImg = tctx.getImageData(0, 0, cur.w, cur.h)
                        for (let i = splitX; i < cur.w; i++) {
                          for (let y = 0; y < cur.h; y++) {
                            const src = (y * cur.w + i) * 4
                            const dst = (y * cur.w + i) * 4
                            curImg.data[dst] = cur.data[src]
                            curImg.data[dst+1] = cur.data[src+1]
                            curImg.data[dst+2] = cur.data[src+2]
                            curImg.data[dst+3] = cur.data[src+3]
                          }
                        }
                        // Draw line
                        for (let y = 0; y < cur.h; y++) {
                          const p = (y * cur.w + splitX) * 4
                          curImg.data[p] = 255; curImg.data[p+1] = 255; curImg.data[p+2] = 255; curImg.data[p+3] = 255
                        }
                        ctx.putImageData(curImg, 0, 0)
                      }} style={{ width: 120 }} />
                      <span style={{ fontSize: '.7rem', color: '#fff', fontWeight: 700 }}>Edit</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="ip-empty">
                  <div
                    className={`ip-empty-box${isDragOver ? ' dragover' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="ip-empty-icon">🖼️</div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px' }}>Glissez-déposez une image ici</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', margin: '0 0 18px' }}>JPG, PNG, WebP — jusqu'à 1600×1600px</p>
                    <span className="ip-badge">📁 ou cliquez pour parcourir</span>
                  </div>
                </div>
              )}
            </div>
            {/* Histogram */}
            {image && showHistogram && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>Histogramme RGB</span>
                  <button className="ip-tool" style={{ padding: '4px 8px', fontSize: '.68rem' }} onClick={() => setShowHistogram(false)}>✕</button>
                </div>
                <canvas ref={histoRef} style={{ width: '100%', height: 80, borderRadius: 8, background: 'var(--bg-primary)' }} />
              </div>
            )}
          </section>
        </div>
      </div>
      {msg && <div className="ip-msg">{msg}</div>}

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />
    </>
  )
}

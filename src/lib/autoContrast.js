/**
 * autoContrast — utilitaires de contraste automatique
 * Calcule si un fond est sombre ou clair et retourne la couleur de texte adaptée.
 */

function parseCSSColor(color) {
  if (!color || color === 'transparent') return null
  // rgb(r, g, b) ou rgba(r, g, b, a)
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return [+m[1], +m[2], +m[3]]
  // #rrggbb ou #rgb
  if (color.startsWith('#')) {
    const h = color.replace('#', '')
    if (h.length === 3) return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ]
    if (h.length >= 6) return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  return null
}

function relativeLuminance([r, g, b]) {
  const toLinear = c => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Retourne true si la couleur est sombre (luminance < 0.179)
 */
export function isDark(color) {
  const rgb = parseCSSColor(color)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.179
}

/**
 * Retourne '#ffffff' si le fond est sombre, '#0a0a0a' si le fond est clair.
 * Utiliser dans les styles inline pour garantir le contraste.
 *
 * @param {string} bgColor  – couleur de fond (hex, rgb, rgba)
 * @param {string} [dark]   – couleur texte sur fond sombre (défaut #ffffff)
 * @param {string} [light]  – couleur texte sur fond clair  (défaut #0a0a0a)
 */
export function autoTextColor(bgColor, dark = '#ffffff', light = '#0a0a0a') {
  return isDark(bgColor) ? dark : light
}

/**
 * Retourne un objet style { color, background } avec contraste garanti.
 */
export function contrastStyle(bgColor) {
  return {
    background: bgColor,
    color: autoTextColor(bgColor),
  }
}

/**
 * Hook-compatible : résout une CSS variable en couleur computée,
 * puis retourne la couleur de texte contrastée.
 * À appeler uniquement côté client (besoin de getComputedStyle).
 */
export function getAutoTextColorFromVar(cssVar) {
  try {
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar).trim()
    return autoTextColor(computed)
  } catch {
    return 'inherit'
  }
}

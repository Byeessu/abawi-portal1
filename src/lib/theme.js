import { useTheme } from '../context/ThemeContext';

/**
 * Token → CSS variable map.
 * BusinessPlanEliteSimple (and similar files) pass shorthand tokens as style values.
 * themed() resolves them to proper var(--xxx) references so every theme works.
 */
const TOKEN_MAP = {
  'bg-primary':    'var(--bg-primary)',
  'bg-secondary':  'var(--bg-secondary)',
  'bg-card':       'var(--bg-card)',
  'bg-card-hover': 'var(--bg-card-hover)',
  'text-primary':  'var(--text-primary)',
  'text-secondary':'var(--text-secondary)',
  'text-muted':    'var(--text-muted)',
  'border':        'var(--border)',
  'accent2':       'var(--accent2)',
  'accent3':       'var(--accent3)',
  'nav-bg':        'var(--nav-bg)',
}

// Patterns pre-compiled once — match tokens surrounded by whitespace / string boundaries
// e.g. "1px solid border" → "1px solid var(--border)"
const PATTERNS = Object.entries(TOKEN_MAP).map(([token, cssVar]) => ({
  re: new RegExp(`(^|\\s)${token.replace(/-/g, '\\-')}(\\s|$)`),
  cssVar,
}))

function resolveTokens(val) {
  if (typeof val !== 'string') return val
  // Fast path: exact match
  if (TOKEN_MAP[val] !== undefined) return TOKEN_MAP[val]
  // Slow path: token embedded in compound value (e.g. "1px solid border")
  let out = val
  for (const { re, cssVar } of PATTERNS) {
    out = out.replace(re, (_, pre, post) => `${pre}${cssVar}${post}`)
  }
  return out
}

export function resolveVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export function useThemedStyles() {
  const { themeKey, modeKey } = useTheme()
  const themed = (styles) => {
    const result = {}
    for (const [k, v] of Object.entries(styles)) {
      result[k] = resolveTokens(v)
    }
    return result
  }
  return { themed, themeKey, modeKey }
}

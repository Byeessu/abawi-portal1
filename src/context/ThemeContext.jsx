import { createContext, useContext, useState, useEffect } from 'react'

// Helper function to convert hex color to RGB values for CSS rgba() usage
function hexToRgb(hex) {
  if (!hex) return '240,180,41'
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '240,180,41'
  return `${r},${g},${b}`
}

const THEMES = {
  dark: {
    name: 'Sombre', emoji: '🌑',
    bg_primary: '#070B0F', bg_secondary: '#0D1117', bg_card: '#0D1117', bg_card_hover: '#131A23',
    border: '#1A2332', text_primary: '#F0F2F5', text_secondary: '#8B95A5', text_muted: '#4A5568',
    accent: '#F0B429', accent2: '#18A84A', accent3: '#8B5CF6',
    nav_bg: 'rgba(7,11,15,0.92)', gradient_hero: 'linear-gradient(135deg,#070B0F 0%,#0D1117 100%)',
  },
  light: {
    name: 'Clair', emoji: '☀️',
    bg_primary: '#F5F7FA', bg_secondary: '#FFFFFF', bg_card: '#FFFFFF', bg_card_hover: '#F0F1F4',
    border: '#E2E4EA', text_primary: '#1A1A2E', text_secondary: '#555770', text_muted: '#8E90A6',
    accent: '#F0B429', accent2: '#18A84A', accent3: '#7C3AED',
    nav_bg: 'rgba(245,247,250,0.92)', gradient_hero: 'linear-gradient(135deg,#F5F7FA 0%,#FFFFFF 100%)',
  },
  galaxy: {
    name: 'Galaxy', emoji: '🌌',
    bg_primary: '#05001A', bg_secondary: '#0A0425', bg_card: '#0A0425', bg_card_hover: '#100840',
    border: '#1E1060', text_primary: '#E8E0FF', text_secondary: '#9B8EC4', text_muted: '#4A3A7A',
    accent: '#9B5CFF', accent2: '#5CC8FF', accent3: '#FF5CDB',
    nav_bg: 'rgba(5,0,26,0.95)', gradient_hero: 'linear-gradient(135deg,#05001A 0%,#1E0850 100%)',
  },
  ia: {
    name: 'IA Blue', emoji: '🤖',
    bg_primary: '#020E1F', bg_secondary: '#041730', bg_card: '#041730', bg_card_hover: '#072040',
    border: '#0A3060', text_primary: '#D0E8FF', text_secondary: '#6B90C4', text_muted: '#2A4A6A',
    accent: '#00BFFF', accent2: '#00FF9D', accent3: '#7B5CFF',
    nav_bg: 'rgba(2,14,31,0.95)', gradient_hero: 'linear-gradient(135deg,#020E1F 0%,#041F40 100%)',
  },
  gold: {
    name: 'Gold', emoji: '✨',
    bg_primary: '#0A0800', bg_secondary: '#151000', bg_card: '#151000', bg_card_hover: '#1E1800',
    border: '#3A2E00', text_primary: '#FFF8E0', text_secondary: '#C9A84C', text_muted: '#5A4A20',
    accent: '#F0C040', accent2: '#FFF0A0', accent3: '#E08020',
    nav_bg: 'rgba(10,8,0,0.95)', gradient_hero: 'linear-gradient(135deg,#0A0800 0%,#201800 100%)',
    // Light mode: use deep gold/amber so the accent stays visibly gold on white backgrounds
    light_accent: '#B8860B', light_accent2: '#C97020',
  },
  antarctique: {
    name: 'Arctique', emoji: '🧊',
    bg_primary: '#010A12', bg_secondary: '#021420', bg_card: '#021420', bg_card_hover: '#042035',
    border: '#0A2A40', text_primary: '#C8F0FF', text_secondary: '#5A9AB5', text_muted: '#2A5070',
    accent: '#00D4FF', accent2: '#80F0D0', accent3: '#5080FF',
    nav_bg: 'rgba(1,10,18,0.95)', gradient_hero: 'linear-gradient(135deg,#010A12 0%,#021A30 100%)',
  },
  luxe: {
    name: 'Luxe', emoji: '💎',
    bg_primary: '#0A0510', bg_secondary: '#120A1E', bg_card: '#120A1E', bg_card_hover: '#1A1030',
    border: '#2A1A40', text_primary: '#F0E8FF', text_secondary: '#9A80C4', text_muted: '#4A3A6A',
    accent: '#C080FF', accent2: '#FF80C0', accent3: '#80C0FF',
    nav_bg: 'rgba(10,5,16,0.95)', gradient_hero: 'linear-gradient(135deg,#0A0510 0%,#180A2A 100%)',
  },
  cristal: {
    name: 'Cristal', emoji: '🔮',
    bg_primary: '#030810', bg_secondary: '#05101C', bg_card: '#05101C', bg_card_hover: '#081828',
    border: '#102840', text_primary: '#E0F0FF', text_secondary: '#6090B8', text_muted: '#304860',
    accent: '#60C8FF', accent2: '#A0FFE0', accent3: '#C0A0FF',
    nav_bg: 'rgba(3,8,16,0.95)', gradient_hero: 'linear-gradient(135deg,#030810 0%,#081828 100%)',
  },
  platine: {
    name: 'Platine', emoji: '🥈',
    bg_primary: '#08090A', bg_secondary: '#0E1012', bg_card: '#0E1012', bg_card_hover: '#141618',
    border: '#202428', text_primary: '#E8EAEC', text_secondary: '#8090A0', text_muted: '#404850',
    accent: '#C0C8D0', accent2: '#80D8C0', accent3: '#A080E0',
    nav_bg: 'rgba(8,9,10,0.95)', gradient_hero: 'linear-gradient(135deg,#08090A 0%,#101418 100%)',
    // Light mode: silver/slate visible on white
    light_accent: '#5A6878', light_accent2: '#2A9080',
  },
  diamant: {
    name: 'Diamant', emoji: '💠',
    bg_primary: '#000508', bg_secondary: '#010810', bg_card: '#010810', bg_card_hover: '#020C18',
    border: '#0A2030', text_primary: '#D8F8FF', text_secondary: '#50A0C0', text_muted: '#204858',
    accent: '#40E0FF', accent2: '#80FFE0', accent3: '#C0A0FF',
    nav_bg: 'rgba(0,5,8,0.98)', gradient_hero: 'linear-gradient(135deg,#000508 0%,#010C20 100%)',
  },
  aero: {
    name: 'Aéro', emoji: '🌊',
    bg_primary: '#020C18', bg_secondary: '#041525', bg_card: '#041525', bg_card_hover: '#081C30',
    border: '#103050', text_primary: '#D0E8FF', text_secondary: '#5080A8', text_muted: '#204868',
    accent: '#0080FF', accent2: '#00D4AA', accent3: '#8060FF',
    nav_bg: 'rgba(2,12,24,0.95)', gradient_hero: 'linear-gradient(135deg,#020C18 0%,#041830 100%)',
  },
  nature: {
    name: 'Nature', emoji: '🌿',
    bg_primary: '#010A04', bg_secondary: '#020F06', bg_card: '#020F06', bg_card_hover: '#041810',
    border: '#0A2A10', text_primary: '#D0F0D8', text_secondary: '#50A060', text_muted: '#204830',
    accent: '#40C060', accent2: '#A0E040', accent3: '#60D0A0',
    nav_bg: 'rgba(1,10,4,0.95)', gradient_hero: 'linear-gradient(135deg,#010A04 0%,#031808 100%)',
  },
  urbain: {
    name: 'Urbain', emoji: '🏙️',
    bg_primary: '#080808', bg_secondary: '#101010', bg_card: '#101010', bg_card_hover: '#181818',
    border: '#282828', text_primary: '#E8E8E8', text_secondary: '#787878', text_muted: '#404040',
    accent: '#FF4040', accent2: '#FFB020', accent3: '#40B0FF',
    nav_bg: 'rgba(8,8,8,0.96)', gradient_hero: 'linear-gradient(135deg,#080808 0%,#181818 100%)',
  },
  forest: {
    name: 'Forêt', emoji: '🌳',
    bg_primary: '#020804', bg_secondary: '#040E08', bg_card: '#040E08', bg_card_hover: '#081810',
    border: '#102818', text_primary: '#C8E8D0', text_secondary: '#487848', text_muted: '#204828',
    accent: '#60A840', accent2: '#A0D060', accent3: '#40C898',
    nav_bg: 'rgba(2,8,4,0.95)', gradient_hero: 'linear-gradient(135deg,#020804 0%,#041808 100%)',
  },
  ultime: {
    name: 'Ultime', emoji: '🔥',
    bg_primary: '#080002', bg_secondary: '#100004', bg_card: '#100004', bg_card_hover: '#180006',
    border: '#300010', text_primary: '#FFE0E0', text_secondary: '#C05060', text_muted: '#602030',
    accent: '#FF2040', accent2: '#FF8020', accent3: '#FF40C0',
    nav_bg: 'rgba(8,0,2,0.96)', gradient_hero: 'linear-gradient(135deg,#080002 0%,#180004 100%)',
  },
  deep: {
    name: 'Deep', emoji: '🌊',
    bg_primary: '#000208', bg_secondary: '#010410', bg_card: '#010410', bg_card_hover: '#020818',
    border: '#081830', text_primary: '#C0D8F8', text_secondary: '#4060A8', text_muted: '#202848',
    accent: '#2060FF', accent2: '#40A0FF', accent3: '#6040FF',
    nav_bg: 'rgba(0,2,8,0.98)', gradient_hero: 'linear-gradient(135deg,#000208 0%,#010820 100%)',
  },
  intellect: {
    name: 'Intellect', emoji: '🧠',
    bg_primary: '#040010', bg_secondary: '#080020', bg_card: '#080020', bg_card_hover: '#0C0030',
    border: '#180050', text_primary: '#E0D0FF', text_secondary: '#8060C0', text_muted: '#402880',
    accent: '#9060FF', accent2: '#C060FF', accent3: '#60A0FF',
    nav_bg: 'rgba(4,0,16,0.97)', gradient_hero: 'linear-gradient(135deg,#040010 0%,#080030 100%)',
  },
  ice: {
    name: 'Ice', emoji: '❄️',
    bg_primary: '#E8F4FF', bg_secondary: '#FFFFFF', bg_card: '#FFFFFF', bg_card_hover: '#D8ECFF',
    border: '#B0D4F0', text_primary: '#0A2A40', text_secondary: '#3870A0', text_muted: '#8090A8',
    accent: '#0080C0', accent2: '#00A8E0', accent3: '#4060FF',
    nav_bg: 'rgba(232,244,255,0.95)', gradient_hero: 'linear-gradient(135deg,#E8F4FF 0%,#FFFFFF 100%)',
  },
  premium: {
    name: 'Premium', emoji: '👑',
    bg_primary: '#050305', bg_secondary: '#0A080A', bg_card: '#0A080A', bg_card_hover: '#100E10',
    border: '#201E20', text_primary: '#F8F0F8', text_secondary: '#9080A8', text_muted: '#504858',
    accent: '#D040A0', accent2: '#F090D0', accent3: '#9040D0',
    nav_bg: 'rgba(5,3,5,0.97)', gradient_hero: 'linear-gradient(135deg,#050305 0%,#100A10 100%)',
  },
  pure: {
    name: 'Pure', emoji: '◾',
    bg_primary: '#000000', bg_secondary: '#0A0A0A', bg_card: '#141414', bg_card_hover: '#1C1C1E',
    border: '#2C2C2E', text_primary: '#F5F5F7', text_secondary: '#6E6E73', text_muted: '#3A3A3C',
    accent: '#007AFF', accent2: '#34C759', accent3: '#5E5CE6',
    nav_bg: 'rgba(0,0,0,0.80)', gradient_hero: 'linear-gradient(135deg,#000000 0%,#0A0A0A 100%)',
  },
  universe: {
    name: 'Universe', emoji: '🌠',
    bg_primary: '#000000', bg_secondary: '#0A0A0A', bg_card: '#111111', bg_card_hover: '#161616',
    border: '#1C1C1E', text_primary: '#FFFFFF', text_secondary: '#98989D', text_muted: '#3A3A3C',
    accent: '#FFFFFF', accent2: '#E0E0E0', accent3: 'rgba(255,255,255,0.08)',
    nav_bg: 'rgba(0,0,0,0.94)', gradient_hero: 'linear-gradient(135deg,#000000 0%,#0A0A14 100%)',
  },
}

const ThemeContext = createContext(null)
const MODES = {
  dark: {
    bg_primary: '#070B0F',
    bg_secondary: '#0D1117',
    bg_card: '#0D1117',
    bg_card_hover: '#131A23',
    border: '#1A2332',
    text_primary: '#F0F2F5',
    text_secondary: '#8B95A5',
    text_muted: '#4A5568',
    nav_bg: 'rgba(7,11,15,0.92)',
    gradient_hero: 'linear-gradient(135deg,#070B0F 0%,#0D1117 100%)',
  },
  light: {
    bg_primary: '#F5F7FA',
    bg_secondary: '#FFFFFF',
    bg_card: '#FFFFFF',
    bg_card_hover: '#F0F1F4',
    border: '#E2E4EA',
    text_primary: '#1A1A2E',
    text_secondary: '#555770',
    text_muted: '#8E90A6',
    nav_bg: 'rgba(245,247,250,0.92)',
    gradient_hero: 'linear-gradient(135deg,#F5F7FA 0%,#FFFFFF 100%)',
  },
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    const saved = localStorage.getItem('abawi_theme')
    return (saved && THEMES[saved]) ? saved : 'dark'
  })
  const [modeKey, setModeKey] = useState(() => {
    const saved = localStorage.getItem('abawi_mode')
    if (saved && MODES[saved]) return saved
    const legacyTheme = localStorage.getItem('abawi_theme') || 'dark'
    return ['light', 'ice', 'aero'].includes(legacyTheme) ? 'light' : 'dark'
  })

  function applyTheme(key, mode) {
    const t = THEMES[key] || THEMES.dark
    const m = MODES[mode] || MODES.dark
    const root = document.documentElement

    // In dark mode, custom palette themes use their OWN structural colors (bg, text, nav).
    // Light themes (ice, aero) and base themes (dark, light) always use MODES colors.
    // In light mode: always use MODES.light for readability.
    const isCustomPalette = key !== 'dark' && key !== 'light'
    const bgLum = (() => {
      const hex = (t.bg_primary || '#000000').replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16) || 0
      const g = parseInt(hex.slice(2, 4), 16) || 0
      const b = parseInt(hex.slice(4, 6), 16) || 0
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255
    })()
    const usePaletteBg = mode === 'dark' && isCustomPalette && bgLum < 0.35

    const structural = usePaletteBg ? t : m

    root.style.setProperty('--bg-primary',    structural.bg_primary)
    root.style.setProperty('--bg-secondary',   structural.bg_secondary)
    root.style.setProperty('--bg-card',        structural.bg_card)
    root.style.setProperty('--bg-card-hover',  structural.bg_card_hover)
    root.style.setProperty('--border',         structural.border)
    root.style.setProperty('--text-primary',   structural.text_primary)
    root.style.setProperty('--text-secondary', structural.text_secondary)
    root.style.setProperty('--text-muted',     structural.text_muted)
    root.style.setProperty('--nav-bg',         structural.nav_bg)
    root.style.setProperty('--gradient-hero',  structural.gradient_hero)

    // Theme controls accent personality colors.
    // In light mode, truly near-white accents (#FFFFFF, lum > 0.88) become dark to stay readable.
    // Themes can define light_accent / light_accent2 to override the automatic fallback.
    function accentLum(hex) {
      if (!hex || !hex.startsWith('#')) return 0.5
      const h = hex.replace('#', '')
      const r = parseInt(h.slice(0, 2), 16) || 0
      const g = parseInt(h.slice(2, 4), 16) || 0
      const b = parseInt(h.slice(4, 6), 16) || 0
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255
    }
    const accent = mode === 'light'
      ? (t.light_accent || (accentLum(t.accent) > 0.88 ? '#1C1C1E' : t.accent))
      : t.accent
    const accent2 = mode === 'light'
      ? (t.light_accent2 || (accentLum(t.accent2 || '') > 0.88 ? '#4B5563' : (t.accent2 || t.accent)))
      : (t.accent2 || t.accent)

    root.style.setProperty('--accent', accent)
    root.style.setProperty('--accent-rgb', hexToRgb(accent))
    root.style.setProperty('--gold', accent)
    root.style.setProperty('--gold-glow', accent + '26')
    root.style.setProperty('--gold-border', accent + '40')
    // --text-on-accent : texte sur bouton coloré.
    // En mode clair, l'accent peut être sombre → texte blanc.
    // En mode sombre, l'accent est souvent vif → texte sombre.
    const textOnAccent = (() => {
      const h = accent.replace('#','')
      const r = parseInt(h.slice(0,2),16)||0, g = parseInt(h.slice(2,4),16)||0, b = parseInt(h.slice(4,6),16)||0
      return ((0.299*r+0.587*g+0.114*b)/255) > 0.55 ? '#070B0F' : '#FFFFFF'
    })()
    root.style.setProperty('--text-on-accent', textOnAccent)
    root.style.setProperty('--text-on-gold', textOnAccent)
    root.style.setProperty('--accent2', accent2)
    root.style.setProperty('--accent3', t.accent3)
    // Additional semantic colors for tags/components
    root.style.setProperty('--red', t.accent2 === '#EF4444' ? t.accent2 : '#EF4444')
    root.style.setProperty('--orange', '#F97316')
    root.style.setProperty('--cyan', '#06B6D4')
    root.style.setProperty('--purple', '#8B5CF6')
    root.style.setProperty('--pink', '#EC4899')
    root.style.setProperty('--lime', '#84CC16')
    // data-theme attribute for CSS selectors
    root.setAttribute('data-theme', key)
    root.setAttribute('data-mode', mode)
    document.body.style.background = 'var(--bg-primary)'
    document.body.style.color = 'var(--text-primary)'
    // light/dark class for legacy CSS
    if (mode === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
  }

  useEffect(() => { applyTheme(themeKey, modeKey) }, [themeKey, modeKey])

  function setTheme(key) {
    setThemeKey(key)
    localStorage.setItem('abawi_theme', key)
  }

  function setMode(mode) {
    const safe = MODES[mode] ? mode : 'dark'
    setModeKey(safe)
    localStorage.setItem('abawi_mode', safe)
  }

  function toggleDarkLight() {
    setMode(modeKey === 'light' ? 'dark' : 'light')
  }

  const darkMode = modeKey !== 'light'

  return (
    <ThemeContext.Provider value={{ themeKey, setTheme, modeKey, setMode, toggleDarkLight, darkMode, themes: THEMES, modes: MODES }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

// Alias pour compatibilité
// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = useTheme

// Note: useThemedStyles is intentionally NOT re-exported here to avoid
// the circular dependency ThemeContext → lib/theme → ThemeContext.
// Import it directly: import { useThemedStyles } from '../hooks/useThemedStyles'

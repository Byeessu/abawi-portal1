/**
 * ArkelUpIcons — Bibliothèque d'icônes SVG professionnelles
 * Style : stroke thin (1.6–2px), rounded caps, minimal
 * Palette : hérite du contexte via currentColor
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/* ── Catégories de cours ──────────────────────────────────────────── */

export function IconBusiness({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
    </svg>
  )
}

export function IconTech({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
      <line x1="14" y1="4" x2="10" y2="20"/>
    </svg>
  )
}

export function IconFinance({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}

export function IconMarketing({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  )
}

export function IconManagement({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

export function IconJuridique({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

export function IconRH({ size = 24, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <circle cx="12" cy="8" r="4"/>
      <path d="M6 20v-1a6 6 0 0 1 12 0v1"/>
      <path d="M1 20h22"/>
    </svg>
  )
}

/* Map catégorie → icône */
export function CategoryIcon({ category, size = 22, color }) {
  const props = { size, color }
  switch (category) {
    case 'Business':    return <IconBusiness {...props} />
    case 'Tech':        return <IconTech {...props} />
    case 'Finance':     return <IconFinance {...props} />
    case 'Marketing':   return <IconMarketing {...props} />
    case 'Management':  return <IconManagement {...props} />
    case 'Juridique':   return <IconJuridique {...props} />
    case 'RH':          return <IconRH {...props} />
    default:            return <IconBusiness {...props} />
  }
}

/* ── Méta des cours ───────────────────────────────────────────────── */

export function IconClock({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

export function IconBook({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

export function IconUsers({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

export function IconStar({ size = 14, color, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round"
      style={color ? { color } : {}}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

export function IconLevel({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <rect x="2" y="16" width="4" height="6" rx="1"/>
      <rect x="9" y="10" width="4" height="12" rx="1"/>
      <rect x="16" y="4" width="4" height="18" rx="1"/>
    </svg>
  )
}

/* ── Types de leçons (player) ─────────────────────────────────────── */

export function IconPlay({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
    </svg>
  )
}

export function IconQuiz({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="12" y2="17"/>
      <line x1="9" y1="9" x2="10" y2="9"/>
    </svg>
  )
}

export function IconExercise({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

export function IconReading({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

export function IconProject({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.74-.74a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/>
    </svg>
  )
}

export function IconLive({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M23 7l-7 5 7 5V7z"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  )
}

/* Map type leçon → icône */
export function LessonTypeIcon({ type, size = 16, color }) {
  const props = { size, color }
  switch (type) {
    case 'video':    return <IconPlay {...props} />
    case 'quiz':     return <IconQuiz {...props} />
    case 'exercise': return <IconExercise {...props} />
    case 'project':  return <IconProject {...props} />
    case 'reading':  return <IconReading {...props} />
    case 'live':     return <IconLive {...props} />
    default:         return <IconPlay {...props} />
  }
}

/* ── UI génériques ────────────────────────────────────────────────── */

export function IconCheck({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export function IconCheckCircle({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export function IconArrowRight({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

export function IconChevronRight({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export function IconChevronDown({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export function IconClose({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export function IconDownload({ size = 15, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export function IconCopy({ size = 15, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

export function IconPrint({ size = 15, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  )
}

export function IconCertificate({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      <polyline points="9 8 11 10 15 6"/>
    </svg>
  )
}

export function IconBP({ size = 20, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

export function IconSearch({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

export function IconGlobe({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

export function IconPause({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="10" y1="15" x2="10" y2="9"/>
      <line x1="14" y1="15" x2="14" y2="9"/>
    </svg>
  )
}

export function IconRefresh({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

export function IconPlus({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="2.2" style={color ? { color } : {}}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export function IconPDF({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.7" style={color ? { color } : {}}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="9" y2="18"/>
      <path d="M9 15h1.5a1 1 0 0 1 0 2H9"/>
      <path d="M13 15h1a2 2 0 0 1 0 4h-1v-4z"/>
    </svg>
  )
}

export function IconEye({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export function IconEyeOff({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export function IconUpload({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  )
}

export function IconShield({ size = 18, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

export function IconUnlock({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  )
}

export function IconTrash({ size = 15, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth="1.8" style={color ? { color } : {}}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  )
}

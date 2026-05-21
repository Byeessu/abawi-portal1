/**
 * ToolIcon — Icônes SVG premium pour tous les outils & sections ABAWI.
 * Toutes les icônes sont en 32×32 viewBox, sans dépendance externe, théme-reactive.
 * Utilisation :
 *   <ToolIcon name="business-plan" size={36} />
 *   <ToolIcon name="finance" tone="green" />
 */
import { useId } from 'react'

const PALETTES = {
  gold:    { from: '#FDE68A', mid: '#F0B429', to: '#B45309', soft: '#FEF3C7' },
  green:   { from: '#86EFAC', mid: '#22C55E', to: '#15803D', soft: '#DCFCE7' },
  blue:    { from: '#93C5FD', mid: '#3B82F6', to: '#1D4ED8', soft: '#DBEAFE' },
  purple:  { from: '#C4B5FD', mid: '#8B5CF6', to: '#6D28D9', soft: '#EDE9FE' },
  pink:    { from: '#FBCFE8', mid: '#EC4899', to: '#BE185D', soft: '#FCE7F3' },
  cyan:    { from: '#A5F3FC', mid: '#06B6D4', to: '#0E7490', soft: '#CFFAFE' },
  orange:  { from: '#FED7AA', mid: '#FB923C', to: '#C2410C', soft: '#FFEDD5' },
  red:     { from: '#FCA5A5', mid: '#EF4444', to: '#B91C1C', soft: '#FEE2E2' },
  teal:    { from: '#5EEAD4', mid: '#14B8A6', to: '#0F766E', soft: '#CCFBF1' },
  slate:   { from: '#CBD5E1', mid: '#64748B', to: '#1E293B', soft: '#F1F5F9' },
  emerald: { from: '#6EE7B7', mid: '#10B981', to: '#047857', soft: '#D1FAE5' },
  amber:   { from: '#FCD34D', mid: '#F59E0B', to: '#B45309', soft: '#FEF3C7' },
}

const TOOL_TONE = {
  'business-plan': 'gold',
  'pitch':         'purple',
  'finance':       'emerald',
  'juridique':     'amber',
  'comptable':     'teal',
  'rh':            'pink',
  'immobilier':    'cyan',
  'consultant':    'blue',
  'cv':            'gold',
  'lettre':        'purple',
  'photo':         'pink',
  'analyse-cv':    'cyan',
  'facture':       'green',
  'editeur':       'slate',
  'abawi-ia':      'gold',
  'abawi-ia-vocal':'orange',
  'translator':    'cyan',
  'dictionnaire':  'blue',
  'smart-office':  'purple',
  'exegetika':     'teal',
  'abavie':        'green',
  'autoroute':     'orange',
  'digital':       'gold',
  'academy':       'green',
  'news':          'cyan',
  'podcasts':      'purple',
  'store':         'orange',
  'crm':           'blue',
  'studio-pro':    'teal',
  'dissecteur':    'purple',
  'planification': 'cyan',
  'marketing':     'pink',
  'abawi360':      'purple',
  'abawi-plus':    'gold',
  'abawi-pay':     'gold',
  'tontine':       'emerald',
  'maxavis':       'blue',
  'procardElite':  'gold',
  'qrcodepro':     'dark',
  'senticket':     'purple',
  'recrutemoisn':  'blue',
  'espaceouvrier': 'amber',
  'placeouvrier':    'amber',
  'format-converter':'blue',
  'audio-studio': 'cyan',
  'image-pro': 'purple',
  'abzone':     'cyan',
  'abspacegps': 'orange',
  'abschool':    'emerald',
}

function Frame({ id, tone = 'gold', children, withRing = true, withGlow = true }) {
  const p = PALETTES[tone] || PALETTES.gold
  return (
    <>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.from} stopOpacity="0.18" />
          <stop offset="100%" stopColor={p.to} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="55%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
        {withGlow && (
          <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.mid} stopOpacity="0.55" />
            <stop offset="70%" stopColor={p.mid} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      {withGlow && <circle cx="16" cy="16" r="14" fill={`url(#${id}-glow)`} />}
      <rect x="2.5" y="2.5" width="27" height="27" rx="8" fill={`url(#${id}-bg)`} stroke={p.mid} strokeOpacity="0.35" strokeWidth="0.8" />
      {withRing && (
        <rect x="2.5" y="2.5" width="27" height="27" rx="8" fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="1" strokeOpacity="0.4" />
      )}
      {children}
    </>
  )
}

function Lib({ name, id, tone }) {
  const p = PALETTES[tone] || PALETTES.gold
  const g = `url(#${id}-grad)`
  const s = `url(#${id}-stroke)`

  switch (name) {
    case 'business-plan':
      return (
        <g>
          <path d="M9 22V14M14 22V11M19 22V8M24 22V5" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 14L14 11L19 8L24 5" stroke={p.mid} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" />
          <circle cx="24" cy="5" r="2" fill={g} />
          <path d="M7 24h18" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
        </g>
      )
    case 'pitch':
      return (
        <g>
          <rect x="7" y="8" width="18" height="13" rx="2" fill="none" stroke={s} strokeWidth="1.6" />
          <path d="M11 17V14M14 17V12M17 17V13M20 17V11" stroke={g} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 21V25" stroke={p.mid} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 26h8" stroke={p.mid} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="23" cy="9.5" r="1.5" fill={g} />
        </g>
      )
    case 'finance':
      return (
        <g>
          <ellipse cx="16" cy="9" rx="7" ry="2.4" fill="none" stroke={s} strokeWidth="1.4" />
          <path d="M9 9v6c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V9" stroke={s} strokeWidth="1.4" fill="none" />
          <path d="M9 15v6c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-6" stroke={s} strokeWidth="1.4" fill="none" />
          <path d="M14 13l2 2 4-4" stroke={g} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'juridique':
      return (
        <g>
          <path d="M16 6v18" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 24h14" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="16" cy="6" r="1.6" fill={g} />
          <path d="M16 9l-4 6h8l-4-6" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M11 15h2M19 15h2" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'comptable':
      return (
        <g>
          <rect x="8" y="6" width="16" height="20" rx="2.5" fill="none" stroke={s} strokeWidth="1.5" />
          <rect x="11" y="9" width="10" height="3" rx="1" fill={g} />
          <circle cx="12.5" cy="16" r="0.9" fill={p.mid} />
          <circle cx="16" cy="16" r="0.9" fill={p.mid} />
          <circle cx="19.5" cy="16" r="0.9" fill={p.mid} />
          <circle cx="12.5" cy="19" r="0.9" fill={p.mid} />
          <circle cx="16" cy="19" r="0.9" fill={p.mid} />
          <circle cx="19.5" cy="19" r="0.9" fill={p.mid} />
          <rect x="11" y="22" width="10" height="2" rx="1" fill={g} />
        </g>
      )
    case 'rh':
      return (
        <g>
          <circle cx="11" cy="12" r="3" fill="none" stroke={s} strokeWidth="1.5" />
          <circle cx="21" cy="12" r="3" fill="none" stroke={s} strokeWidth="1.5" />
          <circle cx="16" cy="20.5" r="3" fill={g} />
          <path d="M6 22c0-3 2.5-4 5-4s5 1 5 4" stroke={s} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M16 22c0-3 2.5-4 5-4s5 1 5 4" stroke={s} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      )
    case 'immobilier':
      return (
        <g>
          <path d="M6 25V15l5-4 5 4v10" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 25V11l5-3 5 3v14" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="9" y="18" width="2.5" height="3" fill={g} />
          <rect x="19" y="14" width="2" height="2.5" fill={g} />
          <rect x="22" y="14" width="2" height="2.5" fill={g} />
          <rect x="19" y="19" width="2" height="2.5" fill={p.mid} opacity="0.6" />
          <rect x="22" y="19" width="2" height="2.5" fill={p.mid} opacity="0.6" />
          <path d="M5 26h22" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
        </g>
      )
    case 'consultant':
      return (
        <g>
          <circle cx="14" cy="14" r="6" fill="none" stroke={s} strokeWidth="1.6" />
          <path d="M19 19l5 5" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M11 13l2 2 4-4" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'cv':
      return (
        <g>
          <rect x="8" y="5" width="16" height="22" rx="2.5" fill="none" stroke={s} strokeWidth="1.5" />
          <circle cx="16" cy="11" r="2.6" fill={g} />
          <path d="M11 17.5c0-2.5 2.2-3.5 5-3.5s5 1 5 3.5" stroke={p.mid} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M11 21h10M11 23.5h7" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        </g>
      )
    case 'lettre':
      return (
        <g>
          <rect x="6" y="9" width="20" height="14" rx="2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          <path d="M6 11l10 7 10-7" stroke={s} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          <path d="M19 22l3-3 3 3-3 3z" fill={g} />
          <path d="M22 19l1-1" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'photo':
      return (
        <g>
          <rect x="5" y="9" width="22" height="16" rx="2.5" fill="none" stroke={s} strokeWidth="1.5" />
          <path d="M11 9l1.5-2.5h7L21 9" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="16" cy="17" r="4" fill="none" stroke={s} strokeWidth="1.5" />
          <circle cx="16" cy="17" r="2" fill={g} />
          <circle cx="23.5" cy="13" r="0.9" fill={p.mid} />
        </g>
      )
    case 'analyse-cv':
      return (
        <g>
          <rect x="6" y="5" width="14" height="20" rx="2" fill="none" stroke={s} strokeWidth="1.5" />
          <path d="M9 11h8M9 14h8M9 17h6" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
          <circle cx="22" cy="20" r="4.5" fill="none" stroke={s} strokeWidth="1.6" />
          <path d="M25 23l3 3" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 18.5v3M20.5 20h3" stroke={g} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )
    case 'facture':
      return (
        <g>
          <path d="M8 5v22l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V5z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M11 11h10M11 14h10M11 17h7" stroke={p.mid} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M19 20l1.5 1.5L23 19" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'editeur':
      return (
        <g>
          <path d="M5 27l3-1 14-14-2-2-14 14z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M19 7l4 4" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M21 5l4 4-2 2-4-4z" fill={g} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M5 27l3-1" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'abawi-ia':
      return (
        <g>
          {/* Ampoule IA — corps */}
          <path d="M12 20.5c0-2.2.8-3.5 1.5-4.5C12.3 14.8 11 12.8 11 11c0-3.3 2.2-6 5-6s5 2.7 5 6c0 1.8-1.3 3.8-2.5 5 .7 1 1.5 2.3 1.5 4.5"
            fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinecap="round" />
          {/* Socle */}
          <path d="M12.5 21h7M13 23h6M14 25h4"
            stroke={s} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.8" />
          {/* Filament lumineux — cerveau IA */}
          <path d="M14.5 17.5c.3-.8 1-1.3 1.5-1.3s1.2.5 1.5 1.3"
            stroke={g} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Étincelles IA — haut gauche */}
          <path d="M8 7l1.2 3 3 .8-2.2 2 .8 3-2.8-1.6-2.8 1.6.8-3-2.2-2 3-.8z"
            fill={g} opacity="0.85" />
          {/* Point brillant coin haut droit */}
          <circle cx="24" cy="7" r="1.5" fill={g} />
          <circle cx="27" cy="11" r="0.9" fill={p.mid} opacity="0.7" />
        </g>
      )
    case 'abawi-ia-vocal':
      return (
        <g>
          <rect x="13" y="6" width="6" height="12" rx="3" fill={g} />
          <path d="M9 14a7 7 0 0014 0" fill="none" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 21v4M13 25h6" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 13c.5 1 .8 2 0 3M27 13c-.5 1-.8 2 0 3" stroke={p.mid} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.6" />
        </g>
      )
    case 'translator':
      return (
        <g>
          <circle cx="16" cy="16" r="11" fill="none" stroke={s} strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="5" ry="11" fill="none" stroke={p.mid} strokeWidth="1.2" strokeOpacity="0.7" />
          <path d="M5 16h22" stroke={p.mid} strokeWidth="1.2" strokeOpacity="0.7" />
          <path d="M5 12h22M5 20h22" stroke={p.mid} strokeWidth="1" strokeOpacity="0.5" />
          <path d="M22 22l2 2-2 2M24 24h-3" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'dictionnaire':
      return (
        <g>
          <path d="M6 7v18l5-2 5 2 5-2 5 2V7" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 9v16" stroke={s} strokeWidth="1.5" />
          <path d="M9 12h5M9 15h5M18 12h5M18 15h5" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <circle cx="14" cy="20" r="0.8" fill={g} />
        </g>
      )
    case 'smart-office':
      return (
        <g>
          <rect x="5" y="8" width="22" height="14" rx="2" fill="none" stroke={s} strokeWidth="1.5" />
          <rect x="8" y="11" width="16" height="8" rx="1" fill={`url(#${id}-bg)`} />
          <path d="M3 25h26l-2-3H5z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 11.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill={g} />
        </g>
      )
    case 'exegetika':
      return (
        <g>
          <path d="M11 7c4 3 6 7 0 18" stroke={s} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M21 7c-4 3-6 7 0 18" stroke={p.mid} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M11 10h10M12 14h8M12 18h8M11 22h10" stroke={g} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="11" cy="7" r="1.4" fill={g} />
          <circle cx="21" cy="25" r="1.4" fill={g} />
        </g>
      )
    case 'sante':
      return (
        <g>
          <rect x="13" y="5" width="6" height="22" rx="1.5" fill={g} />
          <rect x="5" y="13" width="22" height="6" rx="1.5" fill={g} />
          <path d="M3 19c2-4 5-2 7 0s4-4 6-2 5 4 7 0 4 0 6-2" stroke={p.mid} strokeWidth="1.2" fill="none" strokeOpacity="0.5" strokeLinecap="round" />
        </g>
      )
    case 'autoroute':
      return (
        <g>
          <path d="M9 5l-2 22M23 5l2 22" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 6v3M16 13v3M16 20v3" stroke={g} strokeWidth="2" strokeLinecap="round" />
          <rect x="6" y="20" width="6" height="5" rx="1.5" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          <circle cx="7.5" cy="25.5" r="0.9" fill={p.mid} />
          <circle cx="10.5" cy="25.5" r="0.9" fill={p.mid} />
        </g>
      )
    case 'digital':
      return (
        <g>
          <path d="M16 4l8 4v9c0 5-3 8-8 11-5-3-8-6-8-11V8z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M14 16l1.5 1.5L19 14" stroke={g} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="11" r="0.8" fill={g} />
        </g>
      )
    case 'academy':
      return (
        <g>
          <path d="M3 12l13-5 13 5-13 5z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 14v6c0 1.5 3 3 7 3s7-1.5 7-3v-6" stroke={s} strokeWidth="1.5" fill="none" />
          <path d="M27 12v8" stroke={g} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="27" cy="22" r="1.6" fill={g} />
        </g>
      )
    case 'news':
      return (
        <g>
          <rect x="5" y="8" width="22" height="18" rx="2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          <path d="M5 12h22" stroke={p.mid} strokeWidth="1.2" />
          <rect x="8" y="15" width="8" height="6" rx="1" fill={g} />
          <path d="M18 15h6M18 18h6M18 21h4" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" />
          <rect x="8" y="23" width="16" height="1.4" rx="0.7" fill={p.mid} opacity="0.5" />
        </g>
      )
    case 'podcasts':
      return (
        <g>
          <rect x="13" y="5" width="6" height="13" rx="3" fill={g} />
          <path d="M9 14a7 7 0 0014 0" fill="none" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 21v3M12 25h8" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6" cy="13" r="1" fill={p.mid} opacity="0.7" />
          <circle cx="3.5" cy="13" r="0.6" fill={p.mid} opacity="0.4" />
          <circle cx="26" cy="13" r="1" fill={p.mid} opacity="0.7" />
          <circle cx="28.5" cy="13" r="0.6" fill={p.mid} opacity="0.4" />
        </g>
      )
    case 'store':
      return (
        <g>
          <path d="M7 11h18l-1.5 13H8.5z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M11 11V8a5 5 0 0110 0v3" stroke={s} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="13" cy="18" r="1.4" fill={g} />
          <circle cx="19" cy="18" r="1.4" fill={g} />
        </g>
      )
    case 'crm':
      return (
        <g>
          {/* Hub central — client principal */}
          <circle cx="16" cy="16" r="3.8" fill={g} />
          <circle cx="16" cy="16" r="1.6" fill="#fff" fillOpacity="0.55" />
          {/* 4 contacts satellites — réseau client */}
          <circle cx="16" cy="6"  r="2.2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          <circle cx="26" cy="16" r="2.2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          <circle cx="16" cy="26" r="2.2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          <circle cx="6"  cy="16" r="2.2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          {/* Connexions hub → satellites */}
          <path d="M16 10.2v2.2M19.8 16h2.2M16 21.8v-2.2M12.2 16H10"
            stroke={p.mid} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.7" />
        </g>
      )
    case 'studio-pro':
      return (
        <g>
          <circle cx="16" cy="16" r="9" fill="none" stroke={s} strokeWidth="1.4" />
          <circle cx="16" cy="16" r="5" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          <circle cx="16" cy="16" r="1.6" fill={g} />
          <path d="M16 4v3M16 25v3M4 16h3M25 16h3" stroke={p.mid} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.7" />
        </g>
      )
    case 'dissecteur':
      return (
        <g>
          <path d="M8 5v18l8 4 8-4V5" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 5h16" stroke={s} strokeWidth="1.5" />
          <path d="M11 11h10M11 15h10M11 19h6" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M19 21l1 1.5L23 20" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'planification':
      return (
        <g>
          <rect x="5" y="7" width="22" height="20" rx="2" fill="none" stroke={s} strokeWidth="1.5" />
          <path d="M5 12h22" stroke={s} strokeWidth="1.4" />
          <path d="M10 4v6M22 4v6" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="9" y="15" width="6" height="3" rx="1" fill={g} />
          <rect x="13" y="19" width="9" height="3" rx="1" fill={p.mid} opacity="0.7" />
          <rect x="11" y="23" width="5" height="2.5" rx="1" fill={p.mid} opacity="0.5" />
        </g>
      )
    case 'marketing':
      return (
        <g>
          <path d="M6 13l16-6v18l-16-6z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M22 7l5 6-5 6" stroke={g} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M9 19v3a2 2 0 002 2h2a2 2 0 002-2v-3" stroke={s} strokeWidth="1.4" fill="none" />
        </g>
      )
    case 'abawi360':
      return (
        <g>
          <circle cx="16" cy="16" r="11" fill="none" stroke={s} strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke={p.mid} strokeWidth="1.3" strokeOpacity="0.7" />
          <ellipse cx="16" cy="16" rx="4.5" ry="11" fill="none" stroke={p.mid} strokeWidth="1.3" strokeOpacity="0.7" />
          <circle cx="16" cy="16" r="2.4" fill={g} />
        </g>
      )
    case 'abawi-plus':
      return (
        <g>
          <path d="M16 5l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill={g} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 11v6M13 14h6" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
        </g>
      )
    case 'abawi-pay':
      return (
        <g>
          <rect x="4" y="9" width="24" height="14" rx="2.5" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          <path d="M4 13h24" stroke={s} strokeWidth="1.5" />
          <rect x="7" y="17" width="6" height="3" rx="1" fill={g} />
          <path d="M19 18.5h6" stroke={p.mid} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="22" cy="11" r="0.8" fill={p.mid} />
        </g>
      )
    case 'tontine':
      return (
        <g>
          {/* Anneau rotatif — cycle de la tontine */}
          <circle cx="16" cy="16" r="10.5" fill="none" stroke={s} strokeWidth="1.3" strokeOpacity="0.55" />
          {/* Arc clockwise haut-droite */}
          <path d="M16 5.5a10.5 10.5 0 0 1 9.1 5.25" stroke={g} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Pointe de flèche */}
          <path d="M25.1 10.75 L27 9.5 L24.5 8.8" stroke={g} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Arc clockwise bas */}
          <path d="M25.1 21.25a10.5 10.5 0 0 1-18.2 0" stroke={g} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* 3 membres (nœuds du cercle) */}
          <circle cx="16"   cy="5.5"  r="2.3" fill={g} />
          <circle cx="25.1" cy="21.2" r="2.3" fill={g} />
          <circle cx="6.9"  cy="21.2" r="2.3" fill={g} />
          {/* Lignes de connexion vers centre */}
          <path d="M16 7.8v4.5M22.9 19.6l-3.8-2.1M9.1 19.6l3.8-2.1"
            stroke={p.mid} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55" />
          {/* Pièce centrale — double cercle géométrique */}
          <circle cx="16" cy="16" r="3.8" fill={`url(#${id}-bg)`} stroke={g} strokeWidth="1.3" />
          <circle cx="16" cy="16" r="1.8" fill={g} />
          {/* Motif monnaie — 4 rayons courts */}
          <path d="M16 13.2v1.2M16 18.8v-1.2M13.2 16h1.2M18.8 16h-1.2"
            stroke={p.from} strokeWidth="0.9" strokeLinecap="round" />
        </g>
      )
    case 'maxavis':
      return (
        <g>
          {/* Graphique barres */}
          <rect x="6" y="14" width="5" height="12" rx="1" fill={g} />
          <rect x="13" y="10" width="5" height="16" rx="1" fill={s} stroke={s} strokeWidth="0.5" fillOpacity="0.3" />
          <rect x="20" y="8" width="5" height="18" rx="1" fill={g} opacity="0.7" />
          {/* Ligne tendance */}
          <path d="M8.5 12l6-3 6 2 5-4" stroke={p.mid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Points de données */}
          <circle cx="8.5" cy="12" r="1.5" fill={g} />
          <circle cx="14.5" cy="9" r="1.5" fill={g} />
          <circle cx="20.5" cy="11" r="1.5" fill={g} />
          <circle cx="25.5" cy="7" r="1.5" fill={g} />
          {/* Checkmark validation */}
          <circle cx="25" cy="24" r="4" fill={g} />
          <path d="M23 24l1.5 1.5L27 22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'recrutemoisn':
      return (
        <g>
          {/* Candidat — tête */}
          <circle cx="11" cy="10" r="3.2" fill={g} />
          {/* Corps/silhouette */}
          <path d="M5.5 23c0-4.5 2.5-6.5 5.5-6.5s5.5 2 5.5 6.5"
            fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinecap="round" />
          {/* Loupe — recruteur qui cherche */}
          <circle cx="22" cy="19" r="5.2" fill="none" stroke={s} strokeWidth="1.7" />
          <path d="M25.7 22.7l3 3" stroke={s} strokeWidth="1.9" strokeLinecap="round" />
          {/* Étoile talent dans la loupe */}
          <path d="M22 15.5l.75 2.1 2.2.1-1.75 1.3.65 2.1-1.85-1.2-1.85 1.2.65-2.1-1.75-1.3 2.2-.1z"
            fill={g} />
        </g>
      )
    case 'procardElite':
      return (
        <g>
          {/* Card shape */}
          <rect x="4" y="8" width="24" height="16" rx="3" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          {/* Chip */}
          <rect x="7" y="12" width="6" height="5" rx="1.2" fill={g} opacity="0.9" />
          <path d="M7 14h6M9 12v5" stroke={`url(#${id}-bg)`} strokeWidth="0.7" />
          {/* Contactless waves */}
          <path d="M16 11.5c1.5 1 2 2.5 2 4s-.5 3-2 4" stroke={g} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M18.5 10c2 1.5 3 3.5 3 6s-1 4.5-3 6" stroke={g} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6" />
          {/* Name line */}
          <rect x="7" y="19.5" width="8" height="1.5" rx="0.75" fill={p.mid} />
          <rect x="7" y="22" width="5" height="1" rx="0.5" fill={p.mid} opacity="0.6" />
        </g>
      )
    case 'qrcodepro':
      return (
        <g>
          {/* QR code outline */}
          <rect x="6" y="6" width="10" height="10" rx="2" fill="none" stroke={s} strokeWidth="1.8" />
          <rect x="8.5" y="8.5" width="5" height="5" rx="1" fill={g} />
          <rect x="18" y="6" width="8" height="8" rx="2" fill="none" stroke={s} strokeWidth="1.8" />
          <rect x="20" y="8" width="4" height="4" rx="0.8" fill={g} />
          <rect x="6" y="18" width="8" height="8" rx="2" fill="none" stroke={s} strokeWidth="1.8" />
          <rect x="8" y="20" width="4" height="4" rx="0.8" fill={g} />
          {/* Dot grid bottom-right */}
          <rect x="18" y="18" width="2.5" height="2.5" rx="0.6" fill={p.mid} />
          <rect x="21.5" y="18" width="2.5" height="2.5" rx="0.6" fill={p.mid} />
          <rect x="18" y="21.5" width="2.5" height="2.5" rx="0.6" fill={p.mid} />
          <rect x="21.5" y="21.5" width="2.5" height="2.5" rx="0.6" fill={g} />
          <rect x="18" y="25" width="2.5" height="2.5" rx="0.6" fill={p.mid} />
          <rect x="21.5" y="25" width="2.5" height="2.5" rx="0.6" fill={g} />
          <rect x="25" y="21.5" width="2.5" height="2.5" rx="0.6" fill={p.mid} />
          <rect x="25" y="25" width="2.5" height="2.5" rx="0.6" fill={g} />
        </g>
      )
    case 'espaceouvrier':
      return (
        <g>
          {/* Casque de chantier */}
          <path d="M8 19h16v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          <path d="M8 19c0-5 2-9 8-9s8 4 8 9" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          <path d="M5 19h22" stroke={s} strokeWidth="1.4" strokeLinecap="round" />
          {/* Visière */}
          <path d="M10 13h12" stroke={g} strokeWidth="1.6" strokeLinecap="round" />
          {/* Boulon central */}
          <circle cx="16" cy="10" r="1.2" fill={g} />
          {/* Silhouettes communauté */}
          <circle cx="9" cy="25.5" r="1.4" fill={p.mid} />
          <circle cx="16" cy="25.5" r="1.4" fill={g} />
          <circle cx="23" cy="25.5" r="1.4" fill={p.mid} />
          <path d="M7 28c0-1.2.9-1.8 2-1.8s2 .6 2 1.8M14 28c0-1.2.9-1.8 2-1.8s2 .6 2 1.8M21 28c0-1.2.9-1.8 2-1.8s2 .6 2 1.8" stroke={s} strokeWidth="1" strokeLinecap="round" fill="none" />
        </g>
      )
    case 'placeouvrier':
      return (
        <g>
          {/* Pin de localisation */}
          <path d="M16 4c-4.8 0-8.5 3.7-8.5 8.5 0 6.2 8.5 15.5 8.5 15.5s8.5-9.3 8.5-15.5C24.5 7.7 20.8 4 16 4z"
            fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          {/* Personne (candidat) à l'intérieur du pin */}
          <circle cx="16" cy="11" r="2.2" fill={g} />
          <path d="M12.5 17c0-2 1.6-3.2 3.5-3.2s3.5 1.2 3.5 3.2" stroke={g} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Étoile disponibilité */}
          <circle cx="22" cy="7" r="2.2" fill={g} />
          <path d="M22 5.5l.4 1.2h1.2l-1 .7.4 1.2-1-.7-1 .7.4-1.2-1-.7h1.2z" fill="#fff" fillOpacity="0.9" />
        </g>
      )
    case 'abschool':
      return (
        <g>
          {/* Chapeau de graduation / toque */}
          <path d="M16 4L4 11l12 7 12-7-12-7z" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 18v6" stroke={s} strokeWidth="1.4" strokeLinecap="round" />
          {/* Pompon */}
          <circle cx="16" cy="21" r="1.6" fill={g} />
          {/* Livre ouvert sous le chapeau */}
          <path d="M7 24c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0" stroke={s} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M7 24v4c3-1.5 6-1.5 9 0v-4M16 24v4c3-1.5 6-1.5 9 0v-4" stroke={s} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Pages */}
          <line x1="16" y1="24" x2="16" y2="28.5" stroke={s} strokeWidth="1" />
        </g>
      )
    case 'senticket':
      return (
        <g>
          {/* Corps du ticket */}
          <rect x="3" y="9" width="26" height="14" rx="2.5"
            fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          {/* Perforation stub (ligne verticale à x=13.5) */}
          <circle cx="13.5" cy="9" r="2.2" fill="var(--bg-primary, #0a0a0a)" />
          <circle cx="13.5" cy="23" r="2.2" fill="var(--bg-primary, #0a0a0a)" />
          <path d="M13.5 11.2v9.6" stroke={s} strokeWidth="0.9"
            strokeDasharray="2 1.5" strokeLinecap="round" />
          {/* Étoile dans le stub gauche — centre (8.5, 16), R=3, r=1.3 */}
          <path d="M8.5 13 L9.3 15 L11.4 15.1 L9.7 16.4 L10.3 18.5 L8.5 17.3 L6.7 18.5 L7.3 16.4 L5.6 15.1 L7.7 15 Z"
            fill={g} />
          {/* Section principale — infos événement */}
          {/* Titre (ligne épaisse) */}
          <rect x="15.5" y="11.5" width="10.5" height="1.8" rx="0.9"
            fill={s} fillOpacity="0.85" />
          {/* Date / lieu */}
          <path d="M15.5 15.5h8M15.5 18.5h9.5" stroke={p.mid}
            strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.65" />
          {/* Badge validé — coin bas-droit */}
          <circle cx="26" cy="21.5" r="2" fill={g} />
          <path d="M25.1 21.5l.65.65 1.3-1.3" stroke="#fff"
            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'format-converter':
      return (
        <g>
          <rect x="5" y="7" width="9" height="12" rx="2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          <path d="M8 10h4M8 12.5h3M8 15h4" stroke={p.mid} strokeWidth="1" strokeLinecap="round" />
          <path d="M15.5 13.5l2.5-2 2.5 2" stroke={g} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M18 11.5v5" stroke={g} strokeWidth="1.8" strokeLinecap="round" />
          <rect x="18" y="13" width="9" height="12" rx="2" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          <path d="M20 16h4M20 18.5h3M20 21h4" stroke={g} strokeWidth="1" strokeLinecap="round" />
        </g>
      )
    case 'abzone':
      return (
        <g>
          {/* Zone boundary — ring dashed */}
          <circle cx="16" cy="16" r="11" fill="none" stroke={g}
            strokeWidth="1.5" strokeDasharray="3 2.5" />
          {/* Zone intérieure */}
          <circle cx="16" cy="16" r="7" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.3" />
          {/* Marqueur central */}
          <circle cx="16" cy="16" r="2.8" fill={g} />
          <circle cx="16" cy="16" r="1.1" fill="#fff" fillOpacity="0.75" />
          {/* Réticule */}
          <path d="M6 16h6M20 16h6M16 6v6M16 20v6"
            stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.55" />
        </g>
      )
    case 'abspacegps':
      return (
        <g>
          {/* Satellite signal */}
          <path d="M6 6l4 4" stroke={g} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 10a9 9 0 0 1 9-9" stroke={g} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M6 14a6 6 0 0 1 6-6" stroke={p.mid} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeOpacity="0.7" />
          {/* Pin GPS */}
          <path d="M17 12c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z"
            fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.4" />
          <circle cx="17" cy="19" r="2.5" fill={g} />
          <circle cx="17" cy="19" r="1" fill="#fff" fillOpacity="0.7" />
        </g>
      )
    case 'abavie':
      // Coordonnées copiées verbatim depuis /abavie-logo.svg (viewBox 48×48 portion)
      // transform : scale 0.48 + translate pour centrer dans 32×32
      return (
        <g transform="translate(4.3, 4.3) scale(0.48)">
          <rect x="18" y="8"  width="12" height="32" rx="3" fill={g} />
          <rect x="8"  y="18" width="32" height="12" rx="3" fill={g} />
          <circle cx="24" cy="24" r="5" fill="#fff" fillOpacity="0.75" />
        </g>
      )
    case 'audio-studio':
      return (
        <g>
          <rect x="8" y="6" width="16" height="20" rx="3" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          <rect x="11" y="9" width="10" height="14" rx="2" fill="none" stroke={s} strokeWidth="1.3" />
          <path d="M12 13h8M12 16h6M12 19h4" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          <circle cx="22" cy="10" r="2" fill={g} />
          <path d="M5 14a3 3 0 003 3M5 18a3 3 0 003 3" stroke={g} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M27 14a3 3 0 01-3 3M27 18a3 3 0 01-3 3" stroke={g} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      )
    case 'image-pro':
      return (
        <g>
          <rect x="5" y="7" width="22" height="18" rx="3" fill={`url(#${id}-bg)`} stroke={s} strokeWidth="1.5" />
          <circle cx="16" cy="16" r="5" fill="none" stroke={s} strokeWidth="1.4" />
          <circle cx="16" cy="16" r="2.5" fill={g} />
          <path d="M5 16h6M21 16h6" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <path d="M16 7v4M16 21v4" stroke={p.mid} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <path d="M7 7l2-2M25 7l-2-2M7 25l2 2M25 25l-2 2" stroke={g} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    default:
      // Fallback : sparkle générique
      return (
        <g>
          <path d="M16 7l1.6 4.6L22 13l-4.4 1.4L16 19l-1.6-4.6L10 13l4.4-1.4z" fill={g} />
          <circle cx="22" cy="22" r="1.4" fill={p.mid} />
          <circle cx="9.5" cy="22" r="1" fill={p.mid} opacity="0.6" />
        </g>
      )
  }
}

export default function ToolIcon({ name, size = 32, tone, withFrame = true, withRing = true, withGlow = true, className, style }) {
  const id = useId().replace(/:/g, '')
  const finalTone = tone || TOOL_TONE[name] || 'gold'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={name}
      className={className}
      style={style}
    >
      {withFrame && <Frame id={id} tone={finalTone} withRing={withRing} withGlow={withGlow}>{null}</Frame>}
      {!withFrame && (
        <defs>
          <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={(PALETTES[finalTone] || PALETTES.gold).from} />
            <stop offset="55%" stopColor={(PALETTES[finalTone] || PALETTES.gold).mid} />
            <stop offset="100%" stopColor={(PALETTES[finalTone] || PALETTES.gold).to} />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={(PALETTES[finalTone] || PALETTES.gold).mid} />
            <stop offset="100%" stopColor={(PALETTES[finalTone] || PALETTES.gold).to} />
          </linearGradient>
        </defs>
      )}
      <Lib name={name} id={id} tone={finalTone} />
    </svg>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export const TOOL_ICON_NAMES = Object.keys(TOOL_TONE)

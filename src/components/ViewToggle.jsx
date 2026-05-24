import { useState } from 'react'
import './ViewToggle.css'

const MODES = [
  {
    id: 'large', title: 'Grande vue',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="14" rx="1.5" fill="currentColor" opacity=".9"/>
        <rect x="9" y="1" width="6" height="14" rx="1.5" fill="currentColor" opacity=".9"/>
      </svg>
    ),
  },
  {
    id: 'medium', title: 'Vue moyenne',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1"   y="1" width="4" height="14" rx="1.2" fill="currentColor" opacity=".9"/>
        <rect x="6"   y="1" width="4" height="14" rx="1.2" fill="currentColor" opacity=".9"/>
        <rect x="11"  y="1" width="4" height="14" rx="1.2" fill="currentColor" opacity=".9"/>
      </svg>
    ),
  },
  {
    id: 'icon', title: 'Vue icônes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1"   width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="5" y="1"   width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="9" y="1"   width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="13" y="1"  width="2" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="1" y="8.5" width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="5" y="8.5" width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="9" y="8.5" width="3" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
        <rect x="13" y="8.5" width="2" height="6.5" rx="1" fill="currentColor" opacity=".9"/>
      </svg>
    ),
  },
  {
    id: 'list', title: 'Vue liste',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2"  width="14" height="3.5" rx="1.2" fill="currentColor" opacity=".9"/>
        <rect x="1" y="6.3"  width="14" height="3.5" rx="1.2" fill="currentColor" opacity=".9"/>
        <rect x="1" y="10.6" width="14" height="3.5" rx="1.2" fill="currentColor" opacity=".9"/>
      </svg>
    ),
  },
]

export function useViewMode(pageKey, defaultMode = 'medium') {
  const key = `abawi_view_${pageKey}`
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(key) || defaultMode } catch { return defaultMode }
  })
  function onChange(v) {
    setMode(v)
    try { localStorage.setItem(key, v) } catch {}
  }
  return [mode, onChange]
}

export default function ViewToggle({ mode, onChange, label }) {
  return (
    <div className="vt">
      {label && <span className="vt__label">{label}</span>}
      <div className="vt__group">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            className={`vt__btn${mode === m.id ? ' vt__btn--on' : ''}`}
            onClick={() => onChange(m.id)}
            title={m.title}
          >
            {m.icon}
          </button>
        ))}
      </div>
    </div>
  )
}

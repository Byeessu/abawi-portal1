import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { themeKey, setTheme, modeKey, setMode, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const MODE_KEYS = new Set(['dark', 'light'])
  const ORDER = ['galaxy', 'ia', 'gold', 'antarctique', 'luxe', 'cristal', 'platine', 'diamant', 'aero', 'nature', 'urbain', 'forest', 'ultime', 'deep', 'intellect', 'ice', 'premium']
  const paletteList = ORDER.filter((k) => themes[k] && !MODE_KEYS.has(k))
    .concat(Object.keys(themes).filter((k) => !ORDER.includes(k) && !MODE_KEYS.has(k)))

  function updateMenuPosition() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const menuWidth = 280
      const spacing = 8
      let right = window.innerWidth - rect.right
      if (rect.right + menuWidth > window.innerWidth) {
        right = Math.max(10, window.innerWidth - rect.left - menuWidth)
      }
      setMenuPos({
        top: rect.bottom + spacing,
        right: right
      })
    }
  }

  function handleToggle() {
    if (!open) {
      updateMenuPosition()
    }
    setOpen(o => !o)
  }

  function handleSetMode(key) {
    setMode(key)
    setOpen(false)
  }

  function handleSetTheme(key) {
    setTheme(key)
    setOpen(false)
  }

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return

    function handleClickOutside(e) {
      if (btnRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }

    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    function handleScroll() {
      if (open) updateMenuPosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Changer de thème"
        style={{
          padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
          background: 'var(--gold-glow)', border: '1px solid var(--gold-border)',
          color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {themes[themeKey]?.emoji || '🎨'} <span style={{ fontSize: '0.75rem' }}>{modeKey === 'light' ? 'Clair' : 'Sombre'} · Thème</span>
      </button>

      {open && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'transparent',
            }}
          />
          <div
            ref={menuRef}
            style={{
              position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 16, width: 280,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
              animation: 'dropdownIn 0.2s ease-out',
            }}
          >
            <style>{`
              @keyframes dropdownIn {
                from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <div style={{
              gridColumn: '1/-1',
              fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)',
              letterSpacing: 1.2, textTransform: 'uppercase',
              marginBottom: 4, padding: '0 4px'
            }}>
              Mode d'affichage
            </div>
            {['dark', 'light'].map((key) => {
              const active = modeKey === key
              return (
              <button
                key={key}
                onClick={() => handleSetMode(key)}
                style={{
                  padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  background: active ? 'var(--gold-glow)' : 'color-mix(in srgb, var(--bg-card) 70%, var(--border))',
                  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                  color: active ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: '0.7rem', fontWeight: active ? 700 : 500,
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--gold-glow-soft, rgba(240,180,41,0.1))' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 70%, var(--border))' }}
              >
                <span style={{ fontSize: '1.4rem', filter: active ? 'drop-shadow(0 2px 4px rgba(240,180,41,0.3))' : 'none' }}>
                  {key === 'light' ? '\u2600\uFE0F' : '\uD83C\udf19'}
                </span>
                <span>{key === 'light' ? 'Clair' : 'Sombre'}</span>
              </button>
            )})}

            <div style={{
              gridColumn: '1/-1',
              height: 1, background: 'var(--border)', margin: '8px 4px'
            }} />

            <div style={{
              gridColumn: '1/-1',
              fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)',
              letterSpacing: 1.2, textTransform: 'uppercase',
              marginBottom: 4, padding: '0 4px'
            }}>
              Palettes de couleurs
            </div>

            {paletteList.map((key) => {
              const t = themes[key]
              const active = themeKey === key
              return (
                <button
                  key={key}
                  onClick={() => handleSetTheme(key)}
                  style={{
                    padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    background: active ? 'var(--gold-glow)' : 'color-mix(in srgb, var(--bg-card) 70%, var(--border))',
                    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                    color: active ? 'var(--gold)' : 'var(--text-secondary)',
                    fontSize: '0.7rem', fontWeight: active ? 700 : 500,
                    fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--gold-glow-soft, rgba(240,180,41,0.1))' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'color-mix(in srgb, var(--bg-card) 70%, var(--border))' }}
                >
                  <span style={{
                    fontSize: '1.4rem',
                    filter: active ? 'drop-shadow(0 2px 4px rgba(240,180,41,0.3))' : 'none'
                  }}>
                    {t.emoji}
                  </span>
                  <span>{t.name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'

/**
 * @param {{ toolName?: string, icon?: string, description?: string, benefits?: string[], howToUse?: string[], features?: string[], tips?: string[] }} props
 */
export default function ToolInfoPanel({ toolName, icon, description, benefits = [], howToUse, features, tips = [] }) {
  // `features` is accepted as alias for `howToUse` (backward compat)
  const rawSteps = howToUse ?? features ?? [];
  const steps = Array.isArray(rawSteps) ? rawSteps : rawSteps ? [rawSteps] : [];
  const [isOpen, setIsOpen] = useState(false)
  const bodyRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!bodyRef.current) return
    Promise.resolve().then(() => setHeight(isOpen ? bodyRef.current.scrollHeight : 0))
  }, [isOpen])

  return (
    <div style={{
      marginBottom: 24,
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
      background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
      position: 'relative',
    }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <div
        onClick={() => setIsOpen(o => !o)}
        role="button"
        aria-expanded={isOpen}
        style={{
          padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          cursor: 'pointer',
          position: 'relative', zIndex: 1,
          background: isOpen
            ? 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent)'
            : 'transparent',
          borderBottom: isOpen ? '1px solid color-mix(in srgb, var(--accent) 15%, var(--border))' : 'none',
          transition: 'background 0.25s ease',
        }}
      >
        {/* Left: icon + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'color-mix(in srgb, var(--accent) 15%, var(--bg-card))',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 8%, transparent)',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          }}>
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0, fontSize: '1rem', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {toolName}
            </h3>
            <p style={{
              margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)',
              lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {description}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <button style={{
          flexShrink: 0, padding: '7px 16px', borderRadius: 100, border: 'none',
          background: isOpen
            ? 'color-mix(in srgb, var(--accent) 18%, var(--bg-card))'
            : 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 90%, #000), var(--accent))',
          color: isOpen ? 'var(--accent)' : '#fff',
          fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? 'none' : '0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)',
          letterSpacing: '0.2px',
        }}>
          {isOpen ? 'Masquer' : 'En savoir plus'}
          <span style={{
            display: 'inline-block',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          }}>▾</span>
        </button>
      </div>

      {/* Accordion body */}
      <div
        ref={bodyRef}
        style={{
          maxHeight: height,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div style={{ padding: '24px 22px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Benefits */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 18%, transparent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>💡</span>
              Pourquoi cet outil ?
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {benefits.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* How to use */}
          {steps.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🚀</span>
              Comment l'utiliser
            </h4>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, counterReset: 'steps' }}>
              {steps.map((step, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          )}

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div style={{
              padding: '16px 18px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(240,180,41,0.04))',
              border: '1px solid rgba(240,180,41,0.2)',
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 800, color: '#F0B429', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <span>⭐</span> Conseils Pro
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tips.map((t, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: '#F0B429', fontSize: '0.7rem', marginTop: 4, flexShrink: 0 }}>◆</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

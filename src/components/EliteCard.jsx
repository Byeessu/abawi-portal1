import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTilt } from '../hooks/useTilt'
import ToolIcon from './ToolIcon'
import ToolMockup from './ToolMockup'
import { CREDIT_COSTS_DISPLAY, TOOL_ACCENT } from '../data/tools'

function fmtFCFA(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export default function EliteCard({ tool }) {
  const tiltRef = useTilt({ max: 5, scale: 1.015, glare: true })
  const [expanded, setExpanded] = useState(false)
  const credits = tool.creditKey ? CREDIT_COSTS_DISPLAY[tool.creditKey] : null
  const isFree = !tool.prix || tool.access === 'public'
  const [t1, t2] = TOOL_ACCENT[tool.id] ?? ['#334155', '#475569']

  let badgeText = ''
  let badgeAlt = ''
  if (isFree && !tool.quota) {
    badgeText = 'GRATUIT'
  } else if (tool.quota) {
    badgeText = `${tool.quota.anonymous} gratuites/jour`
    badgeAlt = `compte = ${tool.quota.member}`
  } else if (credits) {
    badgeText = `${credits} crédits`
    badgeAlt = tool.access === 'outils-elite' ? 'ABAWI+' : 'à la demande'
  } else {
    badgeText = fmtFCFA(tool.prix)
  }

  return (
    <Link to={tool.path} ref={tiltRef} className="outils-elite-card" style={{ '--t1': t1, '--t2': t2, display: 'flex', flexDirection: 'column' }}>

      {/* ── Window preview ── */}
      {tool.mockup && (
        <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <ToolMockup type={tool.mockup} accent={t1} />
        </div>
      )}

      {/* ── Card header ── */}
      <div className="outils-elite-card__hd" style={{ paddingTop: tool.mockup ? 14 : undefined }}>
        <span className="outils-elite-card__icon">
          <ToolIcon name={tool.iconKey} size={36} />
        </span>
        <div className="outils-elite-card__hd-text">
          <h3 className="outils-elite-card__title">{tool.title}</h3>
          <span className="outils-elite-badge">ÉLITE</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="outils-elite-card__body" style={{ flex: 1 }}>
        <p className="outils-elite-card__desc">{tool.desc}</p>

        {/* Features list */}
        {tool.features?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={e => { e.preventDefault(); setExpanded(o => !o) }}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}
            >
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
              {expanded ? 'Masquer les détails' : 'En savoir plus'}
            </button>
            {expanded && (
              <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}
                  onClick={e => e.preventDefault()}
              >
                {tool.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    <span style={{ color: t1, flexShrink: 0, marginTop: 1, fontSize: '0.6rem' }}>◆</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tool.tags && (
          <div className="outils-elite-card__tags" style={{ marginTop: 10 }}>
            {tool.tags.map(tag => (
              <span key={tag} className="outils-elite-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="outils-elite-card__footer">
          {isFree && !tool.quota ? (
            <span className="outils-elite-card__prix outils-elite-card__prix--free">{badgeText}</span>
          ) : (
            <span className="outils-elite-prix-wrap">
              <span className="outils-elite-credits">{badgeText}</span>
              {badgeAlt && <span className="outils-elite-prix-alt">{badgeAlt}</span>}
            </span>
          )}
          <span className="outils-elite-card__cta">Accéder →</span>
        </div>
      </div>
    </Link>
  )
}

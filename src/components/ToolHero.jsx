import { Link } from 'react-router-dom'
import './ToolHero.css'

/**
 * ToolHero — Bannière hero ultra-premium pour tous les outils ABAWI.
 * Logo Abawi (cercle tournant) + nom de l'outil en haut, design haut de gamme.
 */
export default function ToolHero({
  icon,
  badge,
  title,
  titleAccent,
  subtitle,
  stats = [],
  accentColor = '#3B82F6',
  accentFrom  = '#1e3a5f',
  accentTo    = '#1d4ed8',
  children,
  backTo = '/outils',
}) {
  const hex = accentColor.replace('#', '')

  return (
    <div className="th" style={{
      '--th-accent':    accentColor,
      '--th-from':      accentFrom,
      '--th-to':        accentTo,
    }}>
      {/* ── Fonds ── */}
      <div className="th-bg" />
      <div className="th-grid" />
      <div className="th-orb th-orb--1" />
      <div className="th-orb th-orb--2" />
      <div className="th-orb th-orb--3" />

      {/* ── Particules ── */}
      <span className="th-dot th-dot--1" aria-hidden="true" />
      <span className="th-dot th-dot--2" aria-hidden="true" />
      <span className="th-dot th-dot--3" aria-hidden="true" />
      <span className="th-dot th-dot--4" aria-hidden="true" />

      {/* ── Topbar ── */}
      <div className="th-topbar">
        {/* Nom de l'outil */}
        <div className="th-topbar-name">
          <span className="th-topbar-brand">ABAWI</span>
          <span className="th-topbar-sep" aria-hidden="true">·</span>
          <span className="th-topbar-tool">{title}{titleAccent ? ` ${titleAccent}` : ''}</span>
        </div>

        <div className="th-topbar-actions">
          {backTo && (
            <Link to={backTo} className="th-back-link">← Retour aux outils</Link>
          )}

          {/* Badge catégorie */}
          {badge && (
            <span className="th-badge">
              <span className="th-badge-dot" aria-hidden="true" />
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="th-body">
        {/* Icône outil */}
        <div className="th-icon-wrap" aria-hidden="true">
          <div className="th-icon-halo" />
          <div className="th-icon">{icon}</div>
        </div>

        <div className="th-content">
          {/* Titre */}
          <h1 className="th-title">
            {title}
            {titleAccent && <span className="th-title-accent"> {titleAccent}</span>}
          </h1>

          {/* Sous-titre */}
          {subtitle && <p className="th-sub">{subtitle}</p>}

          {/* Stats / features */}
          {stats.length > 0 && (
            <div className="th-stats">
              {stats.map(([statIcon, label]) => (
                <span key={label} className="th-stat">
                  <span className="th-stat-icon">{statIcon}</span>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Slot libre (tabs, boutons…) */}
          {children}
        </div>
      </div>

      {/* ── Ticker bas ── */}
      <div className="th-ticker-wrap" aria-hidden="true">
        <div className="th-ticker">
          {title} · ABAWI DIGITAL · OUTIL IA · INTELLIGENCE ARTIFICIELLE · {title} · PORTAIL PREMIUM AFRICAIN · {badge || 'OUTIL PRO'} · ABAWI · {title} · OUTILS & IA · EXCELLENCE AFRICAINE ·&nbsp;
          {title} · ABAWI DIGITAL · OUTIL IA · INTELLIGENCE ARTIFICIELLE · {title} · PORTAIL PREMIUM AFRICAIN · {badge || 'OUTIL PRO'} · ABAWI · {title} · OUTILS & IA · EXCELLENCE AFRICAINE ·
        </div>
      </div>
    </div>
  )
}

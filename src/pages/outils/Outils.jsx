import './Outils.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ToolIcon from '../../components/ToolIcon'
import SEO from '../../components/SEO'
import GradientOrbs from '../../components/premium/GradientOrbs'
import SectionReveal from '../../components/premium/SectionReveal'

import { TOOLS_ESSENTIELS, TOOLS_ELITE, CREDIT_COSTS_DISPLAY, TOOL_ACCENT } from '../../data/tools'
import EliteCard from '../../components/EliteCard'
import ToolMockup from '../../components/ToolMockup'
import ViewToggle, { useViewMode } from '../../components/ViewToggle'

// Plans à mettre en avant (Starter / Pro / Elite)
const PACKS_SPOTLIGHT = [
  { id: 'starter', nom: 'Starter',  prix: 4990,  credits: 100,  couleur: '#3B82F6', desc: 'Pour démarrer' },
  { id: 'pro',     nom: 'Pro',      prix: 9990,  credits: 300,  couleur: '#F0B429', desc: 'Le plus populaire', popular: true },
  { id: 'elite',   nom: 'Elite',    prix: 19990, credits: 1000, couleur: '#8B5CF6', desc: 'Illimité ou presque' },
]

function fmtFCFA(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

// Badge informatif : quota gratuit ou coût crédits (pas de prix affiché sur la grille)
function ToolBadge({ tool }) {
  // Outil public / 100% gratuit sans quota
  if (tool.free && !tool.quota) {
    return <span className="outils-card-prix outils-card-prix--free">GRATUIT</span>
  }
  // Outil freemium avec quota
  if (tool.quota) {
    const anon = tool.quota.anonymous
    return (
      <span className="outils-card-prix-wrap">
        <span className="outils-card-credits">{anon} gratuites/jour</span>
        <span className="outils-card-prix-alt">compte = {tool.quota.member}</span>
      </span>
    )
  }
  // Outil payant (crédits uniquement, pas de prix FCFA)
  const credits = tool.creditKey ? CREDIT_COSTS_DISPLAY[tool.creditKey] : null
  if (credits) {
    return (
      <span className="outils-card-prix-wrap">
        <span className="outils-card-credits">{credits} crédits</span>
        <span className="outils-card-prix-alt">{tool.access === 'outils-elite' ? 'ABA WI+' : 'à la demande'}</span>
      </span>
    )
  }
  // Fallback (ne devrait pas arriver)
  return <span className="outils-card-prix">{fmtFCFA(tool.prix)}</span>
}

function EssentielCard({ tool: t, t1, t2 }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Link to={t.path} className="outils-card" style={{ '--t1': t1, '--t2': t2, display: 'flex', flexDirection: 'column' }}>
      {t.mockup && (
        <div style={{ pointerEvents: 'none', userSelect: 'none', display: 'flex', justifyContent: 'center' }}>
          <ToolMockup type={t.mockup} accent={t1} />
        </div>
      )}
      <div className="outils-card__hd">
        <span className="outils-card-icon">
          <ToolIcon name={t.iconKey} size={36} />
        </span>
        <div className="outils-card__hd-text">
          <h3 className="outils-card-title">{t.title}</h3>
          {t.badge && <span className="outils-card__badge">{t.badge}</span>}
        </div>
      </div>
      <div className="outils-card__body" style={{ flex: 1 }}>
        <p className="outils-card-desc">{t.desc}</p>
        {t.features?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={e => { e.preventDefault(); setExpanded(o => !o) }}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}
            >
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
              {expanded ? 'Masquer' : 'En savoir plus'}
            </button>
            {expanded && (
              <ul style={{ margin: '7px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}
                  onClick={e => e.preventDefault()}
              >
                {t.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <span style={{ color: t1, flexShrink: 0, marginTop: 2, fontSize: '0.55rem' }}>◆</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="outils-card__footer" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <ToolBadge tool={t} />
          <span className="outils-card-cta">Utiliser →</span>
        </div>
      </div>
    </Link>
  )
}

export default function Outils() {
  const [viewMode, setViewMode] = useViewMode('outils', 'medium')
  return (
    <main className="outils-page">
      <SEO
        title="Outils IA professionnels — CV, Business Plan, Finance, Juridique"
        description="Plus de 20 outils IA professionnels pour l'Afrique : CV optimisé ATS, business plan exhaustif, analyse financière OHADA, documents juridiques, RH, immobilier, consultant, photo d'identité, éditeur pro."
        keywords="outils IA Afrique, CV Sénégal, business plan OHADA, SYSCOHADA, analyse financière, juridique OHADA, pitch deck, photo identité, éditeur pro, Dakar, UEMOA"
      />

      {/* Hero */}
      <section className="outils-hero" style={{ position: 'relative' }}>
        <GradientOrbs variant="gold" intensity={0.45} count={3} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionReveal as="span" className="outils-badge" delay={0}>🛠️ Outils ABAWI</SectionReveal>
          <SectionReveal as="h1" className="outils-title" delay={100}>
            Créez vos documents professionnels en <span className="text-gold">5 minutes</span>
          </SectionReveal>
          <SectionReveal as="p" className="outils-sub" delay={200}>
            CV, lettres, business plans, analyses financières — générés par IA, optimisés pour le marché africain.
          </SectionReveal>
        </div>
      </section>

      {/* ── Pack Spotlight ── */}
      <section className="outils-packs">
        <SectionReveal delay={0}>
          <div className="outils-packs__header">
            <span className="outils-packs__label">💎 ABAWI+</span>
            <p className="outils-packs__sub">
              Avec un pack crédits, tous les outils deviennent accessibles à la demande — plus besoin de payer à chaque utilisation.
            </p>
          </div>
          <div className="outils-packs__grid">
            {PACKS_SPOTLIGHT.map(pack => (
              <Link key={pack.id} to="/plans" className={`outils-pack-card${pack.popular ? ' outils-pack-card--popular' : ''}`} style={{ '--pack-color': pack.couleur }}>
                {pack.popular && <span className="outils-pack-badge">⭐ Populaire</span>}
                <div className="outils-pack-nom">{pack.nom}</div>
                <div className="outils-pack-credits">
                  <span className="outils-pack-credits__num">{pack.credits.toLocaleString('fr-FR')}</span>
                  <span className="outils-pack-credits__unit">crédits / mois</span>
                </div>
                <div className="outils-pack-prix">{fmtFCFA(pack.prix)}<span className="outils-pack-prix__per">/mois</span></div>
                <div className="outils-pack-desc">{pack.desc}</div>
              </Link>
            ))}
          </div>
          <div className="outils-packs__cta">
            <Link to="/plans" className="outils-packs__link">Voir tous les plans et packs de crédits →</Link>
          </div>
        </SectionReveal>
      </section>

      {/* ── Barre de contrôle ── */}
      <div className="outils-controls">
        <ViewToggle mode={viewMode} onChange={setViewMode} label="Affichage" />
      </div>

      {/* ── Outils Essentiels ── */}
      <section style={{ marginBottom: '3rem' }} data-view={viewMode}>
        <SectionReveal as="h2" className="outils-section-title">
          <span>📄</span> Outils Essentiels
        </SectionReveal>
        <div className="outils-grid">
          {TOOLS_ESSENTIELS.map((t) => {
            const [t1, t2] = TOOL_ACCENT[t.id] ?? ['#334155', '#475569']
            return (
              <EssentielCard key={t.id} tool={t} t1={t1} t2={t2} />
            )
          })}
        </div>
      </section>

      {/* ── Outils Élite ── */}
      <SectionReveal as="section" className="outils-elite-section" direction="up" distance={32} data-view={viewMode}>
        <div className="outils-elite-section__header">
          <h2 className="outils-section-title outils-section-title--gold">
            <span>✨</span> Outils Élite — Analyse IA Avancée
          </h2>
          <p className="outils-elite-section__sub">
            Des outils professionnels de niveau cabinet, propulsés par l'IA, conçus pour les entrepreneurs et dirigeants africains.
          </p>
        </div>
        <div className="outils-elite-grid">
          {TOOLS_ELITE.map(tool => (
            <EliteCard key={tool.id} tool={tool} />
          ))}
        </div>
      </SectionReveal>
    </main>
  )
}

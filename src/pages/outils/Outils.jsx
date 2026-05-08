import './Outils.css'
import { Link } from 'react-router-dom'
import ToolIcon from '../../components/ToolIcon'
import SEO from '../../components/SEO'
import GradientOrbs from '../../components/premium/GradientOrbs'
import SectionReveal from '../../components/premium/SectionReveal'

import { TOOLS_ESSENTIELS, TOOLS_ELITE } from '../../data/tools';
import EliteCard from '../../components/EliteCard';

function formatP(n) {
  return n === 0 ? 'GRATUIT' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

export default function Outils() {
  return (
    <main className="outils-page">
      <SEO
        title="Outils IA professionnels — CV, Business Plan, Finance, Juridique"
        description="Plus de 20 outils IA professionnels pour l'Afrique : CV optimisé ATS, business plan exhaustif, analyse financière OHADA, documents juridiques, RH, immobilier, consultant, photo d'identité, éditeur pro."
        keywords="outils IA Afrique, CV Sénégal, business plan OHADA, SYSCOHADA, analyse financière, juridique OHADA, pitch deck, photo identité, éditeur pro, Dakar, UEMOA"
      />
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

      {/* Section Essentiels */}
      <section style={{ marginBottom: '3rem' }}>
        <SectionReveal as="h2" className="outils-section-title">
          <span>📄</span> Outils Essentiels
        </SectionReveal>
        <div className="outils-grid">
          {TOOLS_ESSENTIELS.map((t) => (
            <Link key={t.id} to={t.path} className={`outils-card ${t.free ? 'outils-card--free' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="outils-card-icon">
                  <ToolIcon name={t.iconKey} size={42} />
                </span>
                {t.badge && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: 1, padding: '2px 8px', borderRadius: 100, background: 'linear-gradient(90deg,#c9a84c,#f0c040)', color: '#0a0a0a' }}>
                    {t.badge}
                  </span>
                )}
              </div>
              <h3 className="outils-card-title">{t.title}</h3>
              <p className="outils-card-desc">{t.desc}</p>
              <span className={`outils-card-prix ${t.free ? 'outils-card-prix--free' : ''}`}>{formatP(t.prix)}</span>
              <span className="outils-card-cta">Utiliser →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Section Élite */}
      <SectionReveal as="section" className="outils-elite-section" direction="up" distance={32}>
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

import { podcasts } from '../data/products'
import './Home.css'
import HomeSlider from '../components/HomeSlider'
import { Link } from 'react-router-dom'
import BienvenuePlayer from '../components/BienvenuePlayer'
import { AudioPlayer } from '../components/AudioPlayer'
import SEO from '../components/SEO'

import { sections, stats } from '../data/home';

function Home() {
  return (
    <main className="home home-cosmos">
      <SEO
        title="ABAWI — Guides Premium, Outils IA et Académie Business pour l'Afrique"
        description="Portail premium africain : guides business, outils IA (CV, business plan, finance, juridique), académie Bac, actualités économiques. Créez vos documents professionnels en 5 minutes."
        keywords="ABAWI, business plan Afrique, CV Sénégal, outils IA, OHADA, SYSCOHADA, académie Bac, guides business, fintech, entrepreneuriat africain"
        image="/abawi-og-banner.jpg"
      />

      {/* === HERO BANNER ABAWI === */}
      <section className="hhb">
        {/* Éléments de fond */}
        <div className="hhb-grid" aria-hidden="true" />
        <div className="hhb-orb hhb-orb--1" aria-hidden="true" />
        <div className="hhb-orb hhb-orb--2" aria-hidden="true" />
        <div className="hhb-orb hhb-orb--3" aria-hidden="true" />

        {/* Particules flottantes existantes */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className={`hhb-particle hhb-particle--${i + 1}`} aria-hidden="true" />
        ))}

        {/* Logo */}
        <div className="hhb-logo-wrap">
          <div className="hhb-logo-circle">
            <span className="hhb-ring" aria-hidden="true" />
            <span className="hhb-ring hhb-ring--outer" aria-hidden="true" />
            <div className="hhb-logo-img-wrap">
              <img src="/favicon-abawi-256.webp" alt="ABAWI" className="hhb-logo-img" loading="eager" decoding="async" />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="hhb-content">
          <span className="hhb-badge">
            <span className="hhb-badge-dot" aria-hidden="true" />
            PORTAIL PREMIUM AFRICAIN
          </span>
          <h2 className="hhb-title">
            Intelligence · <span className="hhb-title-accent">Création</span> · <span className="hhb-title-gold">Excellence</span>
          </h2>
          <p className="hhb-sub">
            30+ outils IA, guides business, académie Bac, finance OHADA et communauté d'entrepreneurs africains — tout en un seul endroit.
          </p>
          <div className="hhb-tags">
            <span className="hhb-tag">🤖 IA Expert 24h/24</span>
            <span className="hhb-tag">📚 Guides Premium</span>
            <span className="hhb-tag">⚖️ OHADA · BCEAO</span>
            <span className="hhb-tag">💰 Finance Élite</span>
            <span className="hhb-tag">🎓 Academy Bac</span>
            <span className="hhb-tag">🌍 Communauté</span>
          </div>
        </div>

        {/* Ticker bas */}
        <div className="hhb-ticker-wrap" aria-hidden="true">
          <div className="hhb-ticker">
            ABAWI DIGITAL · GUIDES PREMIUM · OUTILS IA · BUSINESS PLAN · CV PRO · FINANCE OHADA · JURIDIQUE ÉLITE · ACADÉMIE BAC · PODCASTS · STORE IT · COMMUNAUTÉ AFRICAINE · ABAWI 360 · CRM · PLANIFICATION · MARKETING · RH · ABAWI DIGITAL ·
          </div>
        </div>
      </section>

      {/* === HERO SLIDER PREMIUM === */}
      <section className="hero-slider-section" style={{ position: 'relative' }}>
        {/* Étoiles filantes sur le slider */}
        <span className="home-shooting-star home-shooting-star--1" aria-hidden="true" />
        <span className="home-shooting-star home-shooting-star--2" aria-hidden="true" />
        <HomeSlider />
        <div className="hero-actions hero-actions--under-slider">
          <Link to="/digital" className="btn btn--gold">
            Découvrir les guides
          </Link>
          <Link to="/outils" className="btn btn--green">
            Explorer les outils →
          </Link>
        </div>
      </section>

      {/* === BIENVENUE — EN HAUT === */}
      <section className="home-bienvenue">
        <BienvenuePlayer />
      </section>

      {/* === ABAWI 360 — CARTE COMPACTE PREMIUM === */}
      <section className="card-360-section" style={{ position: 'relative' }}>
        {/* Orbites décoratives */}
        <div className="home-orbit home-orbit--1" aria-hidden="true" />
        <div className="home-orbit home-orbit--2" aria-hidden="true" />
        {/* Flottant : stat IA */}
        <div className="home-float home-float--ai home-float--in-360" aria-hidden="true">
          <span className="home-float__icon">🤖</span>
          <div className="home-float__body">
            <div className="home-float__title">IA Active</div>
            <div className="home-float__sub">7 modes · 24h/24</div>
          </div>
          <span className="home-float__dot" />
        </div>
        <div className="card-360">
          <div className="card-360-aura" />
          <div className="card-360-content">
            <span className="card-360-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/></svg>
              NOUVEAU — ABAWI 360
            </span>
            <h2 className="card-360-title">
              Gérez votre business <span className="card-360-title-gradient">à 360°</span>
            </h2>
            <p className="card-360-desc">
              CRM · Planification · Statistiques · Finance · Juridique · RH — tout en un seul endroit pour les entrepreneurs africains.
            </p>
            <div className="card-360-pills">
              <span className="card-360-pill">👥 CRM</span>
              <span className="card-360-pill">📋 Projets</span>
              <span className="card-360-pill">📊 Stats</span>
              <span className="card-360-pill">💰 Finance</span>
              <span className="card-360-pill">⚖️ Juridique</span>
              <span className="card-360-pill">👤 RH</span>
            </div>
            <Link to="/abawi360" className="card-360-cta">
              Découvrir ABAWI 360 →
            </Link>
          </div>
          <div className="card-360-visual" aria-hidden="true">
            <div className="card-360-visual-overlay" />
          </div>
        </div>
      </section>

      {/* === SECTIONS CARDS === */}
      <section className="sections" style={{ position: 'relative' }}>
        {/* Sparks décoratifs entre les cards */}
        {[...Array(4)].map((_, i) => (
          <span key={i} className={`home-spark home-spark--${i + 1}`} aria-hidden="true" />
        ))}
        <div className="sections-grid">
          {sections.map((s) => (
            <Link to={s.path} key={s.path} className={`section-card section-card--${s.color}`}>
              <div className={`section-card-icon section-card-icon--${s.color}`}>
                <s.Icon />
              </div>
              <h3 className="section-card-title">{s.title}</h3>
              <p className="section-card-desc">{s.desc}</p>
              <span className={`section-card-cta section-card-cta--${s.color}`}>
                Explorer &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* === ABAWI 360 VISION — BANNIÈRE LARGE PREMIUM === */}
      <section className="vision-360-section" style={{ position: 'relative' }}>
        {/* Flottant métrique */}
        <div className="home-float home-float--metric" aria-hidden="true">
          <div className="home-float__stat-val">10×</div>
          <div className="home-float__stat-label">Productivité</div>
        </div>
        <div className="home-float home-float--live home-float--live-360" aria-hidden="true">
          <span className="home-float__live-dot" />
          <span>Live · Sénégal</span>
        </div>
        <div className="vision-360">
          <div className="vision-360-bg" />
          <div className="vision-360-overlay" />
          <div className="vision-360-aura" />
          <div className="vision-360-content">
            <span className="vision-360-badge">ABAWI 360 VISION</span>
            <h2 className="vision-360-title">
              CRM, IA, <span className="vision-360-accent">Studio Pro</span>, Disséqueur Élite
            </h2>
            <p className="vision-360-sub">
              Une tour de contrôle premium pour piloter son écosystème, accélérer ses décisions et industrialiser sa productivité.
            </p>
            <ul className="vision-360-points">
              <li><span className="vision-360-bullet">◆</span> Pipeline client intelligent</li>
              <li><span className="vision-360-bullet">◆</span> Productivité média 10× pro</li>
              <li><span className="vision-360-bullet">◆</span> Analyses en temps réel sans friction</li>
            </ul>
            <Link to="/abawi360" className="vision-360-cta">Activer ABAWI 360 →</Link>
            <div className="vision-360-ticker-wrap">
              <div className="vision-360-ticker">ABAWI 360 · CRM · IA · Studio Pro · Disséqueur Élite · Analytics · Marketing 360 · Planification · OHADA · BCEAO</div>
            </div>
          </div>
          <div className="vision-360-icon" aria-hidden="true">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/></svg>
          </div>
        </div>
      </section>

      {/* === SOCIAL PROOF === */}
      <section className="proof" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Particules déco */}
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`home-spark home-spark--${i + 1}`} aria-hidden="true" />
        ))}
        {/* Flottant membres */}
        <div className="home-float home-float--members home-float--in-proof" aria-hidden="true">
          <div className="home-float__stat-val">2 840+</div>
          <div className="home-float__stat-label">Entrepreneurs</div>
        </div>
        <div className="home-proof-glow" aria-hidden="true" />
        <div className="proof-grid">
          {stats.map((s) => (
            <div key={s.label} className="proof-item">
              <span className="proof-value">{s.value}</span>
              <span className="proof-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === PODCASTS — EN BAS === */}
      {(() => {
        const freeEp = podcasts.find((p) => !p.premium && p.audio_url && p.id !== 'pod-bienvenue')
        if (!freeEp) return null
        return (
          <section className="home-podcast">
            <div className="home-podcast-inner">
              <div className="home-podcast-info">
                <span className="home-podcast-badge">Nos Podcasts</span>
                <h3 className="home-podcast-title">{freeEp.titre}</h3>
                <AudioPlayer src={freeEp.audio_url} size="mini" titre={freeEp.titre} serie={freeEp.serie} id={freeEp.id} />
              </div>
              <Link to="/podcasts" className="home-podcast-link">
                Voir tous les podcasts &rarr;
              </Link>
            </div>
          </section>
        )
      })()}

      {/* === ABAWI+ — POURQUOI REJOINDRE === */}
      <section className="abawi-plus-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Éléments flottants premium */}
        <div className="home-float home-float--badge home-float--badge-1" aria-hidden="true">✓ Business Plan IA</div>
        <div className="home-float home-float--badge home-float--badge-2" aria-hidden="true">✓ CV Pro ATS</div>
        <div className="home-float home-float--badge home-float--badge-3" aria-hidden="true">✓ Finance OHADA</div>
        <div className="home-float home-float--badge home-float--badge-4" aria-hidden="true">✓ 150+ Guides PDF</div>
        <div className="home-aura home-aura--plus" aria-hidden="true" />
        <div className="abawi-plus-inner">
          <div className="abawi-plus-header">
            <span className="promo-badge">ABAWI+</span>
            <h2 className="abawi-plus-title">
              Tout ce dont vous avez besoin,{' '}
              <span className="text-gold">sous un seul toit</span>
            </h2>
            <p className="abawi-plus-sub">
              Guides premium, 30+ outils IA, communauté privée — conçu pour les entrepreneurs africains qui veulent avancer vite.
            </p>
          </div>
          <div className="abawi-plus-benefits">
            <div className="abawi-plus-benefit">
              <span className="abawi-plus-benefit-icon">🤖</span>
              <h4>IA Expert Senior 24h/24</h4>
              <p>30+ outils IA professionnels : Business Plan, CV Pro, Studio Design, Analyse Juridique et bien plus — disponibles à tout moment.</p>
            </div>
            <div className="abawi-plus-benefit">
              <span className="abawi-plus-benefit-icon">📚</span>
              <h4>150+ Ressources Premium</h4>
              <p>Guides PDF, vidéos, podcasts, fascicules scolaires — tout le savoir stratégique dont un entrepreneur africain a besoin.</p>
            </div>
            <div className="abawi-plus-benefit">
              <span className="abawi-plus-benefit-icon">🌍</span>
              <h4>Rejoignez la Communauté ABAWI</h4>
              <p>Groupe WhatsApp privé, réseau d'entrepreneurs africains, entraide et opportunités — une famille qui construit ensemble.</p>
            </div>
          </div>
          <div className="abawi-plus-cta-wrap">
            <Link to="/plans" className="btn btn--gold btn--lg">
              Rejoindre ABAWI+ →
            </Link>
            <span className="abawi-plus-price">à partir de 4 990 FCFA/mois</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home

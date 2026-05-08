import { podcasts } from '../data/products'
import './Home.css'
import HomeSlider from '../components/HomeSlider'
import { Link } from 'react-router-dom'
import BienvenuePlayer from '../components/BienvenuePlayer'
import { AudioPlayer } from '../components/AudioPlayer'

import { sections, stats } from '../data/home';

const WA_LINK =
  'https://wa.me/221775009740?text=Bonjour%20ABAWI%2C%20je%20veux%20le%20Pack%20Platine'

function Home() {
  return (
    <main className="home">
      {/* === HERO SLIDER PREMIUM === */}
      <section className="hero-slider-section">
        <HomeSlider />
        <div className="hero-actions hero-actions--under-slider">
          <Link to="/digital" className="btn btn--gold">
            Découvrir les guides
          </Link>
          <a href={WA_LINK} className="btn btn--whatsapp" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander via WhatsApp
          </a>
        </div>
      </section>

      {/* === BIENVENUE — EN HAUT === */}
      <section className="home-bienvenue">
        <BienvenuePlayer />
      </section>

      {/* === ABAWI 360 — CARTE COMPACTE PREMIUM === */}
      <section className="card-360-section">
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
      <section className="sections">
        <div className="sections-grid">
          {sections.map((s) => (
            <Link to={s.path} key={s.path} className={`section-card section-card--${s.color}`}>
              <div className={`section-card-icon section-card-icon--${s.color}`}>
                {s.icon}
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
      <section className="vision-360-section">
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
      <section className="proof">
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

      {/* === PROMO BANNER === */}
      <section className="promo-banner">
        <div className="promo-inner">
          <div className="promo-text">
            <span className="promo-badge">Offre limitée</span>
            <h2 className="promo-title">
              Pack Platine <span className="text-gold">-67%</span>
            </h2>
            <p className="promo-desc">
              Tous les guides ABAWI Digital + Academy pour seulement{' '}
              <strong>49 990 FCFA</strong> au lieu de 150 000 FCFA
            </p>
          </div>
          <a href={WA_LINK} className="btn btn--gold btn--lg" target="_blank" rel="noopener noreferrer">
            Commander maintenant &rarr;
          </a>
        </div>
      </section>
    </main>
  )
}

export default Home

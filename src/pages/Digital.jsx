import { useState, useRef } from 'react'
import { guides, digitalPacks, DIGITAL_CATEGORIES, formatPrix, waLink, slugify } from '../data/products'
import { useFav } from '../context/FavContext'
import './Digital.css'
import PaymentFlow from '../components/PaymentFlow'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'
import { Link } from 'react-router-dom'
import { CoverImage } from '../components/CoverImage';
import { generateDesc } from '../lib/groq';


function Digital() {
  const [filter, setFilter] = useState('Tous')
  const [modal, setModal] = useState(null)
  const [adminMode, setAdminMode] = useState(false)
  const [aiDescs, setAiDescs] = useState({})
  const [aiLoading, setAiLoading] = useState(null)
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  const { toggle: toggleFav, isFav } = useFav()
  const filtered = filter === 'Tous' ? guides : guides.filter((g) => g.categorie === filter)

  function handleTripleClick() {
    clickCount.current++
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 500)
    if (clickCount.current >= 3) { setAdminMode((v) => !v); clickCount.current = 0 }
  }

  async function handleGenerateDesc(g) {
    setAiLoading(g.id);
    const desc = await generateDesc(g);
    if (desc) {
      setAiDescs((p) => ({ ...p, [g.id]: desc }));
    }
    setAiLoading(null);
  }

  return (
    <main className="dg-page">
      <PaymentFlow product={modal} onClose={() => setModal(null)} />

      <section className="dg-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticlesBackground count={30} color="#F0B429" linkDistance={100} opacity={0.25} />
        <GradientOrbs variant="gold" intensity={0.3} count={2} />
        <SectionReveal as="span" className="dg-badge" onClick={handleTripleClick} delay={0}>ABAWI Digital</SectionReveal>
        <SectionReveal as="h1" className="dg-hero-title" delay={100}>
          <span className="text-gold">Des dizaines de Guides Premium</span> pour Entrepreneurs Africains
        </SectionReveal>
        <SectionReveal as="p" className="dg-hero-sub" delay={200}>De 990 F le fascicule a 49 900 F le pack complet — PDF telechargeable immediatement.</SectionReveal>
      </section>

      {/* PACKS */}
      <SectionReveal as="section" className="dg-packs" direction="up" distance={32}>
        <h2 className="dg-section-title">Packs — Economisez jusqu'a 67%</h2>
        <div className="dg-packs-scroll">
          {digitalPacks.filter((p) => p.badge !== 'VIP ILLIMITE').map((p) => (
            <div key={p.id} className={`dg-pack ${p.highlight ? 'dg-pack--best' : ''}`}>
              {p.badge && <span className="dg-pack-badge">{p.badge}</span>}
              <Link to={`/digital/pack/${slugify(p.nom)}`} className="dg-pack-head"><span className="dg-pack-emoji">{p.emoji}</span><h3 className="dg-pack-name">{p.nom}</h3></Link>
              <ul className="dg-pack-list">{p.contenu.map((c, i) => <li key={i}>{c}</li>)}</ul>
              <div className="dg-pack-pricing">
                <span className="dg-pack-prix">{formatPrix(p.prix)}</span>
                <span className="dg-pack-barre">{formatPrix(p.prix_barre)}</span>
              </div>
              <span className="dg-pack-eco">-{p.economie_pct}%</span>
              <div className="dg-pack-btns">
                <button className="dg-pack-pay" onClick={() => setModal({ id: p.id, titre: p.nom, prix: p.prix })}>
                  Payer — {formatPrix(p.prix)}
                </button>
                <a href={waLink(p.nom, p.prix)} target="_blank" rel="noopener noreferrer" className="dg-pack-wa">WhatsApp</a>
              </div>
            </div>
          ))}
        </div>
      </SectionReveal>

      {/* ABAWI+ */}
      <SectionReveal as="section" className="dg-aplus" direction="up" distance={32}>
        <div className="dg-aplus-card">
          <div className="dg-aplus-glow" />
          <div className="dg-aplus-content">
            <div className="dg-aplus-top">
              <span className="dg-aplus-badge">VIP ILLIMITE</span>
              <span className="dg-aplus-emoji">💚</span>
              <Link to="/plans"><h2 className="dg-aplus-title">ABAWI+</h2></Link>
              <p className="dg-aplus-tagline">L'acces illimite a tout l'univers ABAWI</p>
            </div>
            <div className="dg-aplus-features">
              {[
                'Tous les guides & fascicules (existants + futurs)',
                'ABAWI IA — accès complet à tous les modes IA',
                'Outils Élite : Business Plan, Finance, Juridique…',
                'Podcasts audio premium illimités',
                'ABAWI Academy — formations et masterclasses',
                'Templates professionnels et modèles business',
                'Groupe WhatsApp VIP — support prioritaire',
                'Nouvelles ressources chaque mois',
              ].map((f, i) => (
                <div key={i} className="dg-aplus-feat"><span className="dg-aplus-feat-icon">✦</span>{f}</div>
              ))}
            </div>
            <div className="dg-aplus-pricing">
              <span className="dg-aplus-prix">4 900 FCFA<span className="dg-aplus-month">/mois</span></span>
              <span className="dg-aplus-barre">au lieu de 222 500 FCFA</span>
              <span className="dg-aplus-eco">-97%</span>
              <span className="dg-aplus-cancel">Annulable a tout moment</span>
            </div>
            <div className="dg-aplus-btns">
              <button className="dg-aplus-sub" onClick={() => setModal({ id: 'pd4', titre: 'Abonnement ABAWI+ — Mois 1', prix: 4900 })}>
                S'abonner — 4 900 F/mois
              </button>
              <a href={waLink('Abonnement ABAWI+ (4 900 F/mois)')} target="_blank" rel="noopener noreferrer" className="dg-aplus-wa">
                WhatsApp / Wave
              </a>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* FILTERS */}
      <SectionReveal as="section" className="dg-filters" direction="up" distance={32}>
        <h2 className="dg-section-title">Guides individuels</h2>
        <div className="dg-filter-bar">
          {DIGITAL_CATEGORIES.map((cat) => (
            <button key={cat} className={`dg-filter ${filter === cat ? 'dg-filter--active' : ''}`} onClick={() => setFilter(cat)}>
              {cat}
              {cat !== 'Tous' && <span className="dg-filter-count">{guides.filter((g) => g.categorie === cat).length}</span>}
            </button>
          ))}
        </div>
      </SectionReveal>

      {/* GRID */}
      <SectionReveal as="section" className="dg-products" direction="up" distance={32}>
        <div className="dg-grid">
          {filtered.map((g, i) => (
            <article key={g.id} className="dg-card" style={{ animation: `slideUp 0.5s ease ${i * 0.05}s both` }}>
              <Link to={`/digital/${slugify(g.titre)}`} className="dg-card-img">
                <CoverImage titre={g.titre} categorie={g.categorie} type="guide" brand="digital" size="md" />
              </Link>
              <div className="dg-card-body">
                <div className="dg-card-top-row">
                  <span className="dg-card-cat">{g.categorie}</span>
                  <button className={`fav-btn ${isFav(g.id) ? 'fav-btn--active' : ''}`} onClick={(e) => { e.preventDefault(); toggleFav(g.id) }}>
                    {isFav(g.id) ? '♥' : '♡'}
                  </button>
                </div>
                <Link to={`/digital/${slugify(g.titre)}`} className="dg-card-title-link"><h3 className="dg-card-title">{g.titre}</h3></Link>
                {aiDescs[g.id] && <p className="dg-card-desc">{aiDescs[g.id]}</p>}
                {adminMode && !aiDescs[g.id] && (
                  <button className="dg-ai-btn" onClick={() => generateDesc(g)} disabled={aiLoading === g.id}>
                    {aiLoading === g.id ? 'IA...' : '✨ Description IA'}
                  </button>
                )}
                <div className="dg-card-pricing">
                  <span className="dg-card-prix">{formatPrix(g.prix)}</span>
                  <span className="dg-card-barre">{formatPrix(g.prix_barre)}</span>
                </div>
                <div className="dg-card-actions">
                  <button className="dg-card-cta" onClick={() => setModal(g)}>
                    Payer — {formatPrix(g.prix)}
                  </button>
                  <a href={waLink(g.titre, g.prix)} target="_blank" rel="noopener noreferrer" className="dg-card-wa">WhatsApp</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionReveal>
    </main>
  )
}

export default Digital

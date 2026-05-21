import { useState, useRef } from 'react'
import { guides, videos, digitalPacks, DIGITAL_CATEGORIES, formatPrix, waLink, slugify } from '../data/products'
import { PLANS } from '../data/plans'
import { useFav } from '../context/FavContext'
import './Digital.css'
import PaymentFlow from '../components/PaymentFlow'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'
import { Link } from 'react-router-dom'
import { CoverImage } from '../components/CoverImage';
import { generateDesc } from '../lib/groq';
import { useProductAccess } from '../hooks/useProductAccess'
import AccessBadge from '../components/AccessBadge'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'

function VideoCardActions({ video, setModal }) {
  const access = useProductAccess(video, 'video')
  const navigate = useNavigate()

  if (video.gratuit) {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <span style={{
          fontSize: '0.78rem', fontWeight: 700, color: '#18A84A',
          background: 'rgba(24,168,74,0.1)', borderRadius: 8, padding: '6px 12px',
          display: 'inline-block',
        }}>✓ Gratuit — Accès immédiat</span>
      </div>
    )
  }

  if (access.canUnlock && access.type !== 'none') {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} compact />
        </div>
        <Link
          to={`/videos/${slugify(video.titre)}`}
          style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #F0B429, #e5a820)',
            color: '#070B0F', fontWeight: 800, fontSize: '0.82rem',
            textDecoration: 'none', textAlign: 'center', display: 'block',
            cursor: 'pointer',
          }}
        >
          🎬 Regarder
        </Link>
      </div>
    )
  }

  const prix = video.prix
  return (
    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F0B429' }}>{formatPrix(prix)}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dg-card-cta" style={{ flex: 1 }} onClick={() => setModal(video)}>
          Acheter
        </button>
      </div>
      <a href={waLink(video.titre, video.prix)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#8B95A5', textAlign: 'center', textDecoration: 'none' }}>
        Commander via WhatsApp
      </a>
    </div>
  )
}

function GuideCardActions({ guide, setModal }) {
  const access = useProductAccess(guide, 'guide')
  const navigate = useNavigate()

  if (guide.gratuit) {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        <span style={{
          fontSize: '0.78rem', fontWeight: 700, color: '#18A84A',
          background: 'rgba(24,168,74,0.1)', borderRadius: 8, padding: '6px 12px',
          display: 'inline-block',
        }}>✓ Gratuit — Accès immédiat</span>
      </div>
    )
  }

  if (access.canUnlock && access.type !== 'none') {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} compact />
        </div>
        <Link
          to={`/digital/${slugify(guide.titre)}`}
          style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #18A84A, #16a34a)',
            color: '#fff', fontWeight: 800, fontSize: '0.82rem',
            textDecoration: 'none', textAlign: 'center', display: 'block',
            cursor: 'pointer',
          }}
        >
          📖 Consulter
        </Link>
      </div>
    )
  }

  const prix = guide.prix
  const prixBarre = guide.prix_barre
  const eco = prixBarre ? Math.round((1 - prix / prixBarre) * 100) : 0

  return (
    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F0B429' }}>{formatPrix(prix)}</span>
        {prixBarre > 0 && <span style={{ fontSize: '0.78rem', color: '#8B95A5', textDecoration: 'line-through' }}>{formatPrix(prixBarre)}</span>}
        {eco > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18A84A', background: 'rgba(24,168,74,0.12)', borderRadius: 6, padding: '2px 6px' }}>-{eco}%</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dg-card-cta" style={{ flex: 1 }} onClick={() => setModal(guide)}>
          Acheter
        </button>
        {access.creditCost > 0 && (
          <Link
            to={`/digital/${slugify(guide.titre)}`}
            style={{
              padding: '8px 10px', borderRadius: 10, border: '1px solid #8B5CF6',
              background: 'rgba(139,92,246,0.08)', color: '#8B5CF6',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}
            title={`Débloquer avec ${access.creditCost} crédits`}
          >
            🔓 {access.creditCost}c
          </Link>
        )}
      </div>
      <a href={waLink(guide.titre, guide.prix)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#8B95A5', textAlign: 'center', textDecoration: 'none' }}>
        Commander via WhatsApp
      </a>
    </div>
  )
}

function Digital() {
  const [filter, setFilter] = useState('Tous')
  const [tab, setTab] = useState('guides')
  const [modal, setModal] = useState(null)
  const [adminMode, setAdminMode] = useState(false)
  const [aiDescs, setAiDescs] = useState({})
  const [aiLoading, setAiLoading] = useState(null)
  const clickCount = useRef(0)
  const clickTimer = useRef(null)

  const { toggle: toggleFav, isFav } = useFav()
  const filtered = filter === 'Tous' ? guides : guides.filter((g) => g.categorie === filter)
  const videoFiltered = filter === 'Tous' ? videos : videos.filter((v) => v.categorie === filter)

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
      <SEO
        title="Guides Premium ABAWI — Business & Entrepreneuriat Afrique"
        description="Guides business premium pour l'Afrique : entrepreneuriat, finance SYSCOHADA, marketing, droit OHADA et bien plus. Développez votre activité avec ABAWI."
        keywords="guides business Afrique, entrepreneuriat Sénégal, marketing digital, finance OHADA, droit OHADA, business plan, UEMOA"
        image="/abawi-og-banner.jpg"
      />
      <PaymentFlow product={modal} onClose={() => setModal(null)} />

      <section className="dg-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticlesBackground count={30} color="#F0B429" linkDistance={100} opacity={0.25} />
        <GradientOrbs variant="gold" intensity={0.3} count={2} />
        <SectionReveal as="span" className="dg-badge" onClick={handleTripleClick} delay={0}>ABAWI Digital</SectionReveal>
        <SectionReveal as="h1" className="dg-hero-title" delay={100}>
          <span className="text-gold">Guides & Vidéos</span> pour Entrepreneurs Africains
        </SectionReveal>
        <SectionReveal as="p" className="dg-hero-sub" delay={200}>PDF téléchargeables et vidéos premium — de 490 F à 19 900 F.</SectionReveal>
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
      {(() => {
        const plan = PLANS.find(p => p.popular)
        if (!plan) return null
        return (
          <SectionReveal as="section" className="dg-aplus" direction="up" distance={32}>
            <div className="dg-aplus-card">
              <div className="dg-aplus-glow" />
              <div className="dg-aplus-content">
                <div className="dg-aplus-top">
                  {plan.badge && <span className="dg-aplus-badge">{plan.badge}</span>}
                  <span className="dg-aplus-emoji">💚</span>
                  <Link to="/plans"><h2 className="dg-aplus-title">ABAWI+</h2></Link>
                  <p className="dg-aplus-tagline">Abonnement complet avec crédits — annulable à tout moment</p>
                </div>
                <div className="dg-aplus-features">
                  {plan.features.filter(f => f.ok).map((f, i) => (
                    <div key={i} className="dg-aplus-feat"><span className="dg-aplus-feat-icon">✦</span>{f.label}</div>
                  ))}
                </div>
                <div className="dg-aplus-pricing">
                  <span className="dg-aplus-prix">{formatPrix(plan.prix)}<span className="dg-aplus-month">/mois</span></span>
                  <span style={{ fontSize: '0.85rem', color: '#F0B429', fontWeight: 700 }}>{plan.credits} crédits / mois</span>
                  <span className="dg-aplus-cancel">Annulable à tout moment</span>
                </div>
                <div className="dg-aplus-btns">
                  <button className="dg-aplus-sub" onClick={() => setModal({ id: plan.id, titre: `Abonnement ${plan.nom} — Mois 1`, prix: plan.prix })}>
                    S'abonner — {formatPrix(plan.prix)}/mois
                  </button>
                  <a href={waLink(`Abonnement ${plan.nom} (${formatPrix(plan.prix)}/mois)`)} target="_blank" rel="noopener noreferrer" className="dg-aplus-wa">
                    WhatsApp / Wave
                  </a>
                </div>
              </div>
            </div>
          </SectionReveal>
        )
      })()}

      {/* TABS */}
      <SectionReveal as="section" className="dg-filters" direction="up" distance={32}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28,
          background: 'var(--bg-card)', padding: 6, borderRadius: 14,
          border: '1px solid var(--border)', maxWidth: 420, margin: '0 auto 28px'
        }}>
          <button
            onClick={() => setTab('guides')}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
              background: tab === 'guides' ? 'linear-gradient(135deg, #F0B429, #e5a820)' : 'transparent',
              color: tab === 'guides' ? '#070B0F' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            📄 Guides PDF
          </button>
          <button
            onClick={() => setTab('videos')}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none',
              fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
              background: tab === 'videos' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'transparent',
              color: tab === 'videos' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            🎬 Vidéos
          </button>
        </div>

        <h2 className="dg-section-title">
          {tab === 'guides' ? 'Guides individuels' : 'Vidéos'}
        </h2>
        <div className="dg-filter-bar">
          {DIGITAL_CATEGORIES.map((cat) => (
            <button key={cat} className={`dg-filter ${filter === cat ? 'dg-filter--active' : ''}`} onClick={() => setFilter(cat)}>
              {cat}
              {cat !== 'Tous' && (
                <span className="dg-filter-count">
                  {tab === 'guides'
                    ? guides.filter((g) => g.categorie === cat).length
                    : videos.filter((v) => v.categorie === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </SectionReveal>

      {/* GRID */}
      <SectionReveal as="section" className="dg-products" direction="up" distance={32}>
        <div className="dg-grid">
          {tab === 'guides' ? filtered.map((g, i) => (
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
                  <GuideCardActions guide={g} setModal={setModal} />
              </div>
            </article>
          )) : videoFiltered.map((v, i) => (
            <article key={v.id} className="dg-card" style={{ animation: `slideUp 0.5s ease ${i * 0.05}s both` }}>
              <Link to={`/videos/${slugify(v.titre)}`} className="dg-card-img" style={{ position: 'relative' }}>
                <CoverImage titre={v.titre} categorie={v.categorie} type="video" brand="digital" size="md" />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.35)', borderRadius: 'inherit'
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    <span style={{ fontSize: '1.3rem', marginLeft: 3 }}>▶</span>
                  </div>
                </div>
                <span style={{
                  position: 'absolute', top: 8, right: 8, fontSize: '0.75rem', fontWeight: 800,
                  background: 'rgba(239,68,68,0.85)', color: '#fff', padding: '3px 8px', borderRadius: 6,
                  textTransform: 'uppercase', letterSpacing: 0.5
                }}>Vidéo</span>
              </Link>
              <div className="dg-card-body">
                <div className="dg-card-top-row">
                  <span className="dg-card-cat" style={{ color: '#EF4444' }}>{v.categorie}</span>
                  <button className={`fav-btn ${isFav(v.id) ? 'fav-btn--active' : ''}`} onClick={(e) => { e.preventDefault(); toggleFav(v.id) }}>
                    {isFav(v.id) ? '♥' : '♡'}
                  </button>
                </div>
                <Link to={`/videos/${slugify(v.titre)}`} className="dg-card-title-link"><h3 className="dg-card-title">{v.titre}</h3></Link>
                <VideoCardActions video={v} setModal={setModal} />
              </div>
            </article>
          ))}
        </div>
      </SectionReveal>
    </main>
  )
}

export default Digital

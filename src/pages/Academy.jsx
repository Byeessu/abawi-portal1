import { useState } from 'react'
import { allFascicules, academyPacks, ACADEMY_SERIES, ACADEMY_MATIERES, formatPrix, slugify } from '../data/products'
import { useFav } from '../context/FavContext'
import './Academy.css'
import PaymentFlow from '../components/PaymentFlow'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'
import { Link, useNavigate } from 'react-router-dom'
import { CoverImage } from '../components/CoverImage'
import { useProductAccess } from '../hooks/useProductAccess'
import AccessBadge from '../components/AccessBadge'
import SEO from '../components/SEO'

function FasciculeCardActions({ fascicule, setModal, toggleFav, isFav }) {
  const access = useProductAccess(fascicule, 'fascicule')
  const navigate = useNavigate()

  const prix = fascicule.prix
  const prixBarre = fascicule.prix_barre
  const eco = prixBarre ? Math.round((1 - prix / prixBarre) * 100) : 0

  if (access.canUnlock && access.type !== 'none') {
    return (
      <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} compact />
        <Link
          to={`/academy/${slugify(fascicule.titre)}`}
          style={{
            width: '100%', padding: '9px', borderRadius: 10, border: 'none',
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

  return (
    <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F0B429' }}>{formatPrix(prix)}</span>
        {prixBarre > 0 && <span style={{ fontSize: '0.75rem', color: '#8B95A5', textDecoration: 'line-through' }}>{formatPrix(prixBarre)}</span>}
        {eco > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18A84A', background: 'rgba(24,168,74,0.12)', borderRadius: 6, padding: '2px 6px' }}>-{eco}%</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="ac-pack-cta"
          style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
          onClick={() => setModal(fascicule)}
        >
          Acheter
        </button>
        {access.creditCost > 0 && (
          <button
            onClick={() => navigate(`/academy/${slugify(fascicule.titre)}`)}
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid #8B5CF6',
              background: 'rgba(139,92,246,0.08)', color: '#8B5CF6',
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
            }}
            title={`Débloquer avec ${access.creditCost} crédits`}
          >
            🔓 {access.creditCost}c
          </button>
        )}
        <button
          onClick={() => toggleFav(fascicule.id)}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '7px 9px',
            cursor: 'pointer', fontSize: '1rem',
            color: isFav ? '#ef4444' : 'var(--text-muted)',
          }}
        >
          {isFav ? '♥' : '♡'}
        </button>
      </div>
    </div>
  )
}

function Academy() {
  const [serie, setSerie] = useState('Toutes')
  const [matiere, setMatiere] = useState('Toutes')
  const [modal, setModal] = useState(null)
  const { toggle: toggleFav, isFav } = useFav()

  const filtered = allFascicules.filter((f) => {
    const matchSerie = serie === 'Toutes' || f.serie === serie
    const matchMatiere = matiere === 'Toutes' || f.matiere === matiere
    return matchSerie && matchMatiere
  })

  return (
    <main className="ac-page">
      <SEO
        title="Académie ABAWI — Préparation Bac & Cours Sénégal"
        description="Révisez votre Bac avec les meilleurs fascicules ABAWI : maths, sciences, français, anglais — adapté au programme sénégalais. S1, S2, L."
        keywords="Bac Sénégal, révision Bac, fascicules Sénégal, cours S1 S2 L, académie, préparation examen, ABAWI Academy"
        image="/abawi-og-banner.jpg"
      />
      <PaymentFlow product={modal} onClose={() => setModal(null)} />

      {/* HERO */}
      <section className="ac-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticlesBackground count={30} color="#18A84A" linkDistance={100} opacity={0.25} />
        <GradientOrbs variant="green" intensity={0.3} count={2} />
        <SectionReveal as="span" className="ac-badge" delay={0}>ABAWI Academy</SectionReveal>
        <SectionReveal as="h1" className="ac-hero-title" delay={100}>
          Fascicules <span className="text-green">Bac & Supérieur</span>
        </SectionReveal>
        <SectionReveal as="p" className="ac-hero-sub" delay={200}>
          Cours complets, exercices corrigés et annales pour réussir votre Baccalauréat et vos examens.
          Programme officiel sénégalais.
        </SectionReveal>
      </section>

      {/* PACKS */}
      {academyPacks && academyPacks.length > 0 && (
        <SectionReveal as="section" className="ac-packs" direction="up" distance={32}>
          <h2 className="ac-section-title">Packs complets</h2>
          <div className="ac-packs-grid">
            {academyPacks.map((pack) => (
              <div key={pack.id} className={`ac-pack ${pack.badge ? 'ac-pack--highlight' : ''}`}>
                {pack.badge && <span className="ac-pack-badge">{pack.badge}</span>}
                <CoverImage pack={pack} brand="academy" size="sm" />
                <div className="ac-pack-name">{pack.nom}</div>
                <div className="ac-pack-desc">{pack.desc}</div>
                <div className="ac-pack-pricing">
                  <span className="ac-pack-prix">{formatPrix(pack.prix)}</span>
                  {pack.prix_barre && <span className="ac-pack-barre">{formatPrix(pack.prix_barre)}</span>}
                  {pack.eco && <span className="ac-pack-eco">-{pack.eco}%</span>}
                </div>
                <button className="ac-pack-cta" onClick={() => setModal(pack)}>
                  Commander ce pack
                </button>
              </div>
            ))}
          </div>
        </SectionReveal>
      )}

      {/* FILTRES */}
      <SectionReveal as="section" className="ac-filters" direction="up" distance={32}>
        <div className="ac-filter-bar">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 8, alignSelf: 'center' }}>Série :</span>
          {ACADEMY_SERIES.map((s) => (
            <button key={s} className={`ac-filter ${serie === s ? 'ac-filter--active' : ''}`} onClick={() => setSerie(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="ac-filter-bar" style={{ marginTop: 12 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 8, alignSelf: 'center' }}>Matière :</span>
          {ACADEMY_MATIERES.map((m) => (
            <button key={m} className={`ac-filter ${matiere === m ? 'ac-filter--active' : ''}`} onClick={() => setMatiere(m)}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {filtered.length} fascicule{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </div>
      </SectionReveal>

      {/* GRILLE */}
      <SectionReveal as="div" className="ac-grid" direction="up" distance={32}>
        {filtered.map((f) => (
          <div key={f.id} className="ac-card">
            <Link to={`/academy/${slugify(f.titre)}`} className="ac-card-img">
              <CoverImage titre={f.titre} categorie={f.matiere} type="fascicule" brand="academy" serie={f.serie} matiere={f.matiere} size="md" />
              {f.corriges && <span className="ac-card-corriges" style={{ position: 'absolute', bottom: 8, right: 8 }}>✓ Corrigés</span>}
            </Link>
            <div className="ac-card-body">
              <div className="ac-card-tags">
                <span className="ac-card-cat">{f.matiere}</span>
                <span className="ac-card-serie">Bac {f.serie}</span>
              </div>
              <Link to={`/academy/${slugify(f.titre)}`}>
                <h3 className="ac-card-title">{f.titre}</h3>
              </Link>
              {f.chapitre > 0 && (
                <span className="ac-card-pages">Chapitre {f.chapitre}</span>
              )}
              <FasciculeCardActions fascicule={f} setModal={setModal} toggleFav={toggleFav} isFav={isFav(f.id)} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            Aucun fascicule pour ces filtres.
          </p>
        )}
      </SectionReveal>
    </main>
  )
}

export default Academy

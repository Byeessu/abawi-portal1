import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { digitalPacks, academyPacks, guides, allFascicules, slugify, formatPrix, waLink } from '../../data/products'
import './DetailPage.css'
import PaymentFlow from '../../components/PaymentFlow'
import { Link } from 'react-router-dom'
import { PackCover } from '../../components/CoverImage'
import ShareButtons from '../../components/ShareButtons'
import { CoverImage } from '../../components/CoverImage'

function PackDetail() {
  const { slug } = useParams()
  const [modal, setModal] = useState(null)

  const isAcademy = !digitalPacks.find((p) => slugify(p.nom) === slug)
  const allPacks = isAcademy ? academyPacks : digitalPacks
  const pack = allPacks.find((p) => slugify(p.nom) === slug)
  const color = isAcademy ? 'green' : 'gold'
  const basePath = isAcademy ? '/academy' : '/digital'

  if (!pack) return <main className="detail"><p style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Pack introuvable.</p></main>

  // Get included products
  const products = isAcademy ? allFascicules : guides
  const otherPacks = allPacks.filter((p) => p.id !== pack.id)

  return (
    <main className="detail">
      <PaymentFlow product={modal} onClose={() => setModal(null)} />

      <nav className="detail-bread">
        <Link to="/">Accueil</Link><span>/</span>
        <Link to={basePath}>{isAcademy ? 'Academy' : 'Digital'}</Link><span>/</span>
        <span>{pack.nom}</span>
      </nav>

      <section className="detail-hero">
        <div className="detail-hero-img">
          <PackCover nom={pack.nom} badge={pack.badge} count={products.length} brand={isAcademy ? 'academy' : 'digital'} size="lg" />
        </div>
        <div className="detail-hero-info">
          <span className={`detail-hero-cat detail-hero-cat--${color}`}>{isAcademy ? 'Pack Academy' : 'Pack Digital'}</span>
          <h1 className="detail-hero-title">{pack.nom}</h1>
          <div className="detail-hero-pricing">
            <span className={`detail-hero-prix detail-hero-prix--${color}`}>{formatPrix(pack.prix)}{pack.badge === 'VIP ILLIMITE' ? '/mois' : ''}</span>
            <span className="detail-hero-barre">{formatPrix(pack.prix_barre)}</span>
            <span className="detail-hero-eco">-{pack.economie_pct}%</span>
          </div>
          <p className="detail-hero-desc">{pack.description || (pack.contenu || []).join(', ')}</p>
          <div className="detail-hero-btns">
            <button className={`detail-btn detail-btn--${color}`} onClick={() => setModal({ id: pack.id, titre: pack.nom, prix: pack.prix })}>
              Acheter ce pack — {formatPrix(pack.prix)}
            </button>
            <a href={waLink(pack.nom, pack.prix)} target="_blank" rel="noopener noreferrer" className="detail-btn detail-btn--outline">
              Commander WhatsApp
            </a>
          </div>
          <ShareButtons titre={pack.nom} type="pack" prix={pack.prix} prixBarre={pack.prix_barre} economie={pack.economie_pct} />
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Contenu du pack — {products.length} {isAcademy ? 'fascicules' : 'guides'} disponibles</h2>
        <div className="detail-pack-list">
          {products.slice(0, pack.produits_limit || 99).map((p) => (
            <Link key={p.id} to={`${basePath}/${slugify(p.titre)}`} className="detail-pack-item">
              <CoverImage titre={p.titre} categorie={p.categorie || p.matiere} type={isAcademy ? 'fascicule' : 'guide'} brand={isAcademy ? 'academy' : 'digital'} serie={p.serie} matiere={p.matiere} size="sm" />
              <span className="detail-pack-item-title">{p.titre}</span>
              <span className="detail-pack-item-meta">{p.categorie || p.matiere}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Pourquoi choisir ce pack</h2>
        <div className="detail-points">
          <div className="detail-point"><span className="detail-point-icon">💰</span><span>Économie de {pack.economie_pct}% par rapport à l'achat individuel</span></div>
          <div className="detail-point"><span className="detail-point-icon">📦</span><span>Tous les {isAcademy ? 'fascicules' : 'guides'} en un seul achat</span></div>
          <div className="detail-point"><span className="detail-point-icon">🎯</span><span>Contenu complémentaire et progressif</span></div>
          <div className="detail-point"><span className="detail-point-icon">⚡</span><span>Livraison instantanée après paiement</span></div>
        </div>
      </section>

      {otherPacks.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Autres packs</h2>
          <div className="detail-similar">
            {otherPacks.map((p) => (
              <Link key={p.id} to={`${basePath}/pack/${slugify(p.nom)}`} className="detail-similar-card">
                <PackCover nom={p.nom} badge={p.badge} count={0} brand={isAcademy ? 'academy' : 'digital'} size="sm" />
                <div className="detail-similar-body">
                  <div className="detail-similar-title">{p.nom}</div>
                  <div className="detail-similar-prix" style={{ color: `var(--${color})` }}>{formatPrix(p.prix)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="detail-section">
        <h2 className="detail-section-title">Ce que disent nos clients</h2>
        <div className="detail-testimonials">
          <div className="detail-testimonial">"Le pack m'a permis de lancer mon business en 2 semaines. Le contenu est concret et adapté au Sénégal."<div className="detail-testimonial-author">— Moussa D., Dakar</div></div>
          <div className="detail-testimonial">"J'ai économisé plus de 60% par rapport à l'achat guide par guide. Excellent rapport qualité-prix."<div className="detail-testimonial-author">— Aminata S., Thiès</div></div>
          <div className="detail-testimonial">"Les guides sont clairs, bien structurés et vraiment pratiques. Je recommande à tous les entrepreneurs."<div className="detail-testimonial-author">— Ibrahima F., Saint-Louis</div></div>
        </div>
      </section>

      <div className="detail-sticky">
        <div className="detail-sticky-inner">
          <div className="detail-sticky-info">
            <span className="detail-sticky-title">{pack.nom}</span>
            <span className="detail-sticky-prix" style={{ color: `var(--${color})` }}>{formatPrix(pack.prix)}</span>
          </div>
          <div className="detail-sticky-btns">
            <button className={`detail-btn detail-btn--${color}`} onClick={() => setModal({ id: pack.id, titre: pack.nom, prix: pack.prix })}>Acheter — {formatPrix(pack.prix)}</button>
            <a href={waLink(pack.nom, pack.prix)} target="_blank" rel="noopener noreferrer" className="detail-btn detail-btn--outline">WhatsApp</a>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PackDetail

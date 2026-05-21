import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { guides, slugify, formatPrix, waLink, findSummaryForContent } from '../../data/products'
import { usePrefetchAudio } from '../../hooks/usePrefetchAudio'
import { canDownload } from '../../lib/freeContentQuota'
import './DetailPage.css'
import { Link } from 'react-router-dom'
import PaymentFlow from '../../components/PaymentFlow'
import ContentViewer from '../../components/ContentViewer'
import PDFAudioReader from '../../components/PDFAudioReader'
import { CoverImage } from '../../components/CoverImage'
import { useProductAccess } from '../../hooks/useProductAccess'
import AccessBadge from '../../components/AccessBadge'
import ExpiryReminder from '../../components/ExpiryReminder'
import ShareButtons from '../../components/ShareButtons'
import SEO from '../../components/SEO'

function GuideDetail() {
  const { slug } = useParams()
  const { isMember, membre, isAdmin } = useAuth()
  const [payflow, setPayflow] = useState(false)
  const [viewer, setViewer] = useState(null)   // { type, src, titre }
  const [audioReader, setAudioReader] = useState(false)
  const allowDownload = canDownload(membre, isAdmin)

  function handleRead() {
    setViewer({ type: 'pdf', src: pdfSrc, titre: guide.titre })
  }

  const guide = guides.find((g) => slugify(g.titre) === slug)
  const access = useProductAccess(guide, 'guide')
  const audioAvailable = usePrefetchAudio(slug, 'guide')

  if (!guide) return (
    <main className="detail" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2 style={{ marginBottom: 12 }}>Guide non trouvé</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Ce guide n'existe pas ou a été déplacé.</p>
      <Link to="/digital" style={{ color: 'var(--gold)', fontWeight: 600 }}>← Retour aux guides</Link>
    </main>
  )

  const similar = guides.filter((g) => g.categorie === guide.categorie && g.id !== guide.id).slice(0, 4)
  const eco = guide.prix_barre ? Math.round((1 - guide.prix / guide.prix_barre) * 100) : 0
  const pdfSrc = guide.file_url || guide.drive_url || null

  const guideDesc = guide.description || `Guide premium ${guide.categorie} pour entrepreneurs africains. Document professionnel PDF — ${guide.titre}. Téléchargement immédiat.`
  const guideSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: guide.titre,
    description: guideDesc,
    url: `https://abawi.app/digital/${slugify(guide.titre)}`,
    brand: { '@type': 'Brand', name: 'ABAWI' },
    category: guide.categorie,
    offers: {
      '@type': 'Offer',
      price: guide.prix,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'ABAWI SN' },
    },
    ...(guide.cover ? { image: `https://abawi.app${guide.cover}` } : {}),
  }

  return (
    <main className="detail">
      <SEO
        title={`${guide.titre} — Guide ABAWI`}
        description={guideDesc}
        keywords={`${guide.categorie}, guide ${guide.categorie}, business Afrique, ${guide.titre}, ABAWI, guide PDF`}
        image={guide.cover || `/og-content/guides/${guide.id}.jpg`}
        type="article"
        structuredData={guideSchema}
      />
      {payflow && <PaymentFlow product={guide} onClose={() => setPayflow(false)} />}
      {viewer && <ContentViewer type={viewer.type} src={viewer.src} titre={viewer.titre} onClose={() => setViewer(null)} product={guide} onBuy={() => setPayflow(true)} access={access} />}
      {audioReader && (
        <PDFAudioReader
          titre={guide.titre}
          categorie={guide.categorie}
          brand="digital"
          productId={guide.id}
          fileUrl={pdfSrc}
          prix={guide.prix}
          onClose={() => setAudioReader(false)}
        />
      )}

      <nav className="detail-bread">
        <Link to="/">Accueil</Link><span>/</span>
        <Link to="/digital">Digital</Link><span>/</span>
        <span>{guide.categorie}</span><span>/</span>
        <span>{guide.titre}</span>
      </nav>

      <section className="detail-hero">
        <div className="detail-hero-img">
          <CoverImage titre={guide.titre} categorie={guide.categorie} type="guide" brand="digital" size="lg" />
        </div>
        <div className="detail-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="detail-hero-cat detail-hero-cat--gold">{guide.categorie}</span>
            {guide.gratuit && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#18A84A',
                background: 'rgba(24,168,74,0.12)', border: '1px solid rgba(24,168,74,0.3)',
                borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 1,
              }}>GRATUIT</span>
            )}
          </div>
          <h1 className="detail-hero-title">{guide.titre}</h1>

          {access.reminder && (
            <ExpiryReminder reminder={access.reminder} onDismiss={access.dismissReminder} context="product" />
          )}
          {!guide.gratuit && access.type === 'none' && (
            <div className="detail-hero-pricing">
              <span className="detail-hero-prix detail-hero-prix--gold">{formatPrix(guide.prix)}</span>
              {guide.prix_barre && <span className="detail-hero-barre">{formatPrix(guide.prix_barre)}</span>}
              {eco > 0 && <span className="detail-hero-eco">-{eco}%</span>}
            </div>
          )}
          {access.canUnlock && access.type !== 'none' && access.type !== 'public' && (
            <div style={{ marginBottom: 12 }}>
              <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} />
            </div>
          )}

          <div className="detail-hero-meta">
            <span className="detail-meta-item">PDF téléchargeable</span>
            <span className="detail-meta-item">Français</span>
            <span className="detail-meta-item">MAJ 2026</span>
          </div>

          <p className="detail-hero-desc">
            Guide professionnel ABAWI Digital conçu pour les entrepreneurs africains.
            Stratégies concrètes, méthodes testées et adaptées au contexte sénégalais et ouest-africain.
          </p>

          {/* Résumé audio statique s'il existe */}
          {(() => {
            const summary = findSummaryForContent(guide.titre)
            if (!summary) return null
            return (
              <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A78BFA', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  🎙️ Résumé audio — {summary.titre.replace(/-/g, ' ')}
                </div>
                <audio controls style={{ width: '100%', height: 36 }} src={summary.audio_url} />
              </div>
            )
          })()}

          <div className="detail-hero-btns">
            {guide.gratuit || access.canUnlock ? (
              <>
                {pdfSrc && (
                  <button
                    className="detail-btn detail-btn--gold"
                    onClick={handleRead}
                  >
                    📖 {guide.gratuit ? 'Lire gratuitement' : 'Lire le guide complet'}
                  </button>
                )}
                {pdfSrc && allowDownload && (
                  <a href={pdfSrc} download className="detail-btn detail-btn--outline">
                    ⬇️ Télécharger PDF
                  </a>
                )}
              </>
            ) : (
              <>
                <button className="detail-btn detail-btn--gold" onClick={() => setPayflow(true)}>
                  Acheter ce guide — {formatPrix(guide.prix)}
                </button>
                <a
                  href={waLink(guide.titre, guide.prix)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-btn detail-btn--outline"
                >
                  Commander WhatsApp
                </a>
                {access.creditCost > 0 && (
                  <button
                    className="detail-btn detail-btn--outline"
                    style={{ borderColor: '#8B5CF6', color: '#8B5CF6' }}
                    onClick={() => {/* TODO: credit unlock */}}
                  >
                    Débloquer avec {access.creditCost} crédit{access.creditCost > 1 ? 's' : ''}
                  </button>
                )}
                <a href="/plans" className="detail-btn detail-btn--outline" style={{ borderColor: '#F0B429', color: '#F0B429' }}>
                  💎 ABAWI+ — Accès illimité
                </a>
              </>
            )}

            {(audioAvailable || audioAvailable === false) && (
              <button
                className="detail-btn detail-btn--outline"
                style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                onClick={() => setAudioReader(true)}
              >
                🎧 Écouter le résumé intelligent (IA)
              </button>
            )}
            {audioAvailable === null && (
              <button className="detail-btn detail-btn--outline" disabled>
                🎧 Vérification...
              </button>
            )}
          </div>

          <ShareButtons titre={guide.titre} type="guide" prix={guide.prix} />
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Ce que vous allez découvrir</h2>
        <div className="detail-points">
          {[
            'Stratégies concrètes adaptées au marché sénégalais',
            'Méthodes testées par des entrepreneurs africains',
            'Études de cas réels et chiffres précis',
            'Templates et outils prêts à l\'emploi',
            'Exercices pratiques pour appliquer immédiatement',
            'Ressources complémentaires et liens utiles',
          ].map((p, i) => (
            <div key={i} className="detail-point"><span className="detail-point-icon">✅</span><span>{p}</span></div>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">À qui s'adresse ce guide</h2>
        <div className="detail-profiles">
          {[
            { h: 'Entrepreneurs débutants', p: 'Vous lancez votre activité et cherchez une feuille de route claire.' },
            { h: 'Entrepreneurs en croissance', p: 'Vous voulez scaler et optimiser vos processus business.' },
            { h: 'Étudiants et diplômés', p: 'Vous préparez votre entrée dans le monde professionnel.' },
            { h: 'Salariés en reconversion', p: 'Vous envisagez de lancer votre propre activité.' },
          ].map((pr, i) => (
            <div key={i} className="detail-profile"><h4>{pr.h}</h4><p>{pr.p}</p></div>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Détails</h2>
        <div className="detail-specs">
          <div className="detail-spec"><div className="detail-spec-val">PDF</div><div className="detail-spec-label">Format</div></div>
          <div className="detail-spec"><div className="detail-spec-val">FR</div><div className="detail-spec-label">Langue</div></div>
          <div className="detail-spec"><div className="detail-spec-val">2026</div><div className="detail-spec-label">Mise à jour</div></div>
          <div className="detail-spec"><div className="detail-spec-val">Oui</div><div className="detail-spec-label">Mobile friendly</div></div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Guides similaires</h2>
          <div className="detail-similar">
            {similar.map((g) => (
              <Link key={g.id} to={`/digital/${slugify(g.titre)}`} className="detail-similar-card">
                <CoverImage titre={g.titre} categorie={g.categorie} type="guide" brand="digital" size="sm" />
                <div className="detail-similar-body">
                  <div className="detail-similar-title">{g.titre}</div>
                  <div className="detail-similar-prix" style={{ color: 'var(--gold)' }}>
                    {g.gratuit ? 'Gratuit' : formatPrix(g.prix)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="detail-sticky">
        <div className="detail-sticky-inner">
          <div className="detail-sticky-info">
            <span className="detail-sticky-title">{guide.titre}</span>
            <span className="detail-sticky-prix" style={{ color: guide.gratuit ? 'var(--green)' : 'var(--gold)' }}>
              {guide.gratuit ? 'Gratuit' : access.canUnlock ? '✓ Accès' : formatPrix(guide.prix)}
            </span>
          </div>
          <div className="detail-sticky-btns">
            {guide.gratuit || access.canUnlock ? (
              pdfSrc && (
                <button
                  className="detail-btn detail-btn--gold"
                  onClick={handleRead}
                >
                  📖 Lire
                </button>
              )
            ) : (
              <>
                <button className="detail-btn detail-btn--gold" onClick={() => setPayflow(true)}>
                  Payer — {formatPrix(guide.prix)}
                </button>
                <a
                  href={waLink(guide.titre, guide.prix)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-btn detail-btn--outline"
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default GuideDetail

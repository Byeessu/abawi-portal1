import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { allFascicules, slugify, formatPrix, waLink } from '../../data/products'
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

function FasciculeDetail() {
  const { slug } = useParams()
  const { isMember, membre, isAdmin } = useAuth()
  const [payflow, setPayflow] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [audioReader, setAudioReader] = useState(false)
  const allowDownload = canDownload(membre, isAdmin)

  function handleRead() {
    setViewer({ type: 'pdf', src: pdfSrc, titre: fasc.titre })
  }

  const fasc = allFascicules.find((f) => slugify(f.titre) === slug)
  const audioAvailable = usePrefetchAudio(slug, 'fascicule')
  const access = useProductAccess(fasc || {}, 'fascicule')

  if (!fasc) return (
    <main className="detail" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2 style={{ marginBottom: 12 }}>Fascicule non trouvé</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Ce fascicule n'existe pas ou a été déplacé.</p>
      <Link to="/academy" style={{ color: 'var(--green)', fontWeight: 600 }}>← Retour aux fascicules</Link>
    </main>
  )

  const similar = allFascicules.filter((f) => f.matiere === fasc.matiere && f.id !== fasc.id).slice(0, 4)
  const pdfSrc = fasc.file_url || fasc.drive_url || null

  const fascDesc = `Fascicule ${fasc.matiere || ''} Bac ${fasc.serie || ''} — ${fasc.titre}. Chapitre ${fasc.chapitre || ''}. Cours, méthodes et exercices corrigés premium — ABAWI Academy Sénégal.`
  const fascSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: fasc.titre,
    description: fascDesc,
    url: `https://abawi.app/academy/${slugify(fasc.titre)}`,
    author: { '@type': 'Organization', name: 'ABAWI Academy' },
    publisher: { '@type': 'Organization', name: 'ABAWI SN' },
    inLanguage: 'fr',
    educationalLevel: fasc.serie || 'Baccalauréat',
    genre: fasc.matiere || 'Sciences',
    offers: {
      '@type': 'Offer',
      price: fasc.prix,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <main className="detail">
      <SEO
        title={`${fasc.titre} — Fascicule BAC ${fasc.serie || ''} ABAWI`}
        description={fascDesc}
        keywords={`fascicule bac ${fasc.serie || ''}, ${fasc.matiere || ''}, cours bac Sénégal, ${fasc.titre}, académie ABAWI, révision bac`}
        image={`/og-content/fascicules/${fasc.id}.jpg`}
        type="article"
        structuredData={fascSchema}
      />
      {payflow && <PaymentFlow product={fasc} onClose={() => setPayflow(false)} />}
      {viewer && <ContentViewer type={viewer.type} src={viewer.src} titre={viewer.titre} onClose={() => setViewer(null)} product={fasc} onBuy={() => setPayflow(true)} access={access} />}
      {audioReader && (
        <PDFAudioReader
          type="fascicule"
          titre={fasc.titre}
          categorie={fasc.matiere}
          brand="academy"
          serie={fasc.serie}
          matiere={fasc.matiere}
          productId={fasc.id}
          fileUrl={pdfSrc}
          prix={fasc.prix}
          onClose={() => setAudioReader(false)}
        />
      )}

      <nav className="detail-bread">
        <Link to="/">Accueil</Link><span>/</span>
        <Link to="/academy">Academy</Link><span>/</span>
        <span>{fasc.serie} — {fasc.matiere}</span><span>/</span>
        <span>{fasc.titre}</span>
      </nav>

      <section className="detail-hero">
        <div className="detail-hero-img">
          <CoverImage titre={fasc.titre} categorie={fasc.categorie} type="fascicule" brand="academy" serie={fasc.serie} matiere={fasc.matiere} size="lg" />
        </div>
        <div className="detail-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="detail-hero-cat detail-hero-cat--green">{fasc.matiere} — Bac {fasc.serie}</span>
            {fasc.gratuit && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#18A84A',
                background: 'rgba(24,168,74,0.12)', border: '1px solid rgba(24,168,74,0.3)',
                borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 1,
              }}>GRATUIT</span>
            )}
          </div>

          <h1 className="detail-hero-title">{fasc.titre}</h1>

          {access.reminder && (
            <ExpiryReminder reminder={access.reminder} onDismiss={access.dismissReminder} context="product" />
          )}
          {!fasc.gratuit && access.type === 'none' && (
            <div className="detail-hero-pricing">
              <span className="detail-hero-prix detail-hero-prix--green">{formatPrix(fasc.prix)}</span>
              {fasc.prix_barre && <span className="detail-hero-barre">{formatPrix(fasc.prix_barre)}</span>}
            </div>
          )}
          {access.canUnlock && access.type !== 'none' && access.type !== 'public' && (
            <div style={{ marginBottom: 12 }}>
              <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} />
            </div>
          )}

          <div className="detail-hero-meta">
            <span className="detail-meta-item">PDF téléchargeable</span>
            <span className="detail-meta-item">Corrigés inclus</span>
            <span className="detail-meta-item">Programme officiel SN</span>
          </div>

          <p className="detail-hero-desc">
            Fascicule complet du programme officiel sénégalais. Cours structurés, exercices corrigés détaillés
            et méthodologie Bac. Conçu par des enseignants expérimentés pour maximiser vos chances de réussite.
          </p>

          <div className="detail-hero-btns">
            {fasc.gratuit || access.canUnlock ? (
              <>
                {pdfSrc && (
                  <button
                    className="detail-btn detail-btn--green"
                    onClick={handleRead}
                  >
                    📖 {fasc.gratuit ? 'Lire gratuitement' : 'Lire le fascicule complet'}
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
                <button className="detail-btn detail-btn--green" onClick={() => setPayflow(true)}>
                  Acheter — {formatPrix(fasc.prix)}
                </button>
                <a
                  href={waLink(fasc.titre, fasc.prix)}
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
                    🔓 Débloquer avec {access.creditCost} crédit{access.creditCost > 1 ? 's' : ''}
                  </button>
                )}
              </>
            )}

            {(audioAvailable || audioAvailable === false) && (
              <button
                className="detail-btn detail-btn--outline"
                style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                onClick={() => setAudioReader(true)}
              >
                🎧 Écouter l'intro intelligente
              </button>
            )}
          </div>

          <ShareButtons titre={fasc.titre} type="fascicule" prix={fasc.prix} />
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Programme couvert</h2>
        <div className="detail-points">
          {[
            'Cours complet conforme au programme officiel',
            'Exercices corrigés avec méthode détaillée',
            'Fiches de révision synthétiques',
            'Annales Bac corrigées',
            'Méthodologie de l\'épreuve',
            'Conseils pratiques pour le jour J',
          ].map((p, i) => (
            <div key={i} className="detail-point"><span className="detail-point-icon">✅</span><span>{p}</span></div>
          ))}
        </div>
      </section>

      <section className="detail-section">
        <h2 className="detail-section-title">Détails</h2>
        <div className="detail-specs">
          <div className="detail-spec"><div className="detail-spec-val">PDF</div><div className="detail-spec-label">Format</div></div>
          <div className="detail-spec"><div className="detail-spec-val">{fasc.serie}</div><div className="detail-spec-label">Série</div></div>
          <div className="detail-spec"><div className="detail-spec-val">FR</div><div className="detail-spec-label">Langue</div></div>
          <div className="detail-spec"><div className="detail-spec-val">{fasc.chapitre > 0 ? 'Ch. ' + fasc.chapitre : 'Complet'}</div><div className="detail-spec-label">Chapitre</div></div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Fascicules similaires</h2>
          <div className="detail-similar">
            {similar.map((f) => (
              <Link key={f.id} to={`/academy/${slugify(f.titre)}`} className="detail-similar-card">
                <CoverImage titre={f.titre} categorie={f.categorie} type="fascicule" brand="academy" serie={f.serie} matiere={f.matiere} size="sm" />
                <div className="detail-similar-body">
                  <div className="detail-similar-title">{f.titre}</div>
                  <div className="detail-similar-prix" style={{ color: 'var(--green)' }}>
                    {f.gratuit ? 'Gratuit' : formatPrix(f.prix)}
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
            <span className="detail-sticky-title">{fasc.titre}</span>
            <span className="detail-sticky-prix" style={{ color: fasc.gratuit ? 'var(--green)' : 'var(--green)' }}>
              {fasc.gratuit ? 'Gratuit' : access.canUnlock ? '✓ Accès' : formatPrix(fasc.prix)}
            </span>
          </div>
          <div className="detail-sticky-btns">
            {fasc.gratuit || access.canUnlock ? (
              pdfSrc && (
                <button
                  className="detail-btn detail-btn--green"
                  onClick={handleRead}
                >
                  📖 Lire
                </button>
              )
            ) : (
              <>
                <button className="detail-btn detail-btn--green" onClick={() => setPayflow(true)}>
                  Payer — {formatPrix(fasc.prix)}
                </button>
                <a
                  href={waLink(fasc.titre, fasc.prix)}
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

export default FasciculeDetail

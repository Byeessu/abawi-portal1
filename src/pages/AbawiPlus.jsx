import { useState } from 'react'
import { waLink } from '../data/products'
import './AbawiPlus.css'
import PaymentFlow from '../components/PaymentFlow'
import { Link } from 'react-router-dom'

/* ── Tiers tarifaires alignés ── */
const TIERS = [
  {
    id: 'gratuit', nom: 'Gratuit', prix_m: 0, prix_a: 0,
    credits: '15 crédits', periode: '/mois',
    note: 'Découverte, outils basiques',
    color: '#6B7280',
    features: ['Accès limité aux guides', '15 crédits IA/mois', 'Outils basiques', 'Support communauté'],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'starter', nom: 'Starter', prix_m: 4990, prix_a: 3742,
    credits: '100 crédits', periode: '/mois',
    note: 'Guides premium + essentiels',
    color: '#3B82F6',
    features: ['Bibliothèque guides complète', '100 crédits IA/mois', 'Outils essentiels', 'Podcasts inclus'],
    cta: "S'abonner",
    productId: 'aplus-starter',
  },
  {
    id: 'pro', nom: 'Pro', prix_m: 9990, prix_a: 7492,
    credits: '300 crédits', periode: '/mois',
    note: 'Outils IA avancés + priorité',
    color: '#F0B429', featured: true,
    badge: 'POPULAIRE',
    features: ['Tout Starter +', '300 crédits IA/mois', 'Outils IA avancés', 'Annah prioritaire', 'Academy complète'],
    cta: "S'abonner",
    productId: 'aplus-pro',
  },
  {
    id: 'p360', nom: '360', prix_m: 14990, prix_a: 11242,
    credits: '600 crédits', periode: '/mois',
    note: 'ABAWI 360 complet + exports',
    color: '#8B5CF6',
    features: ['Tout Pro +', '600 crédits IA/mois', 'ABAWI 360 activé', 'CRM + Marketing', 'Exports professionnels'],
    cta: "S'abonner",
    productId: 'aplus-360',
  },
  {
    id: 'elite', nom: 'Élite', prix_m: 19990, prix_a: 14992,
    credits: '1 000 crédits', periode: '/mois',
    note: 'Niveau cabinet, analyses étendues',
    color: '#18A84A',
    features: ['Tout 360 +', '1 000 crédits IA/mois', 'Studio Pro inclus', 'Analyses approfondies', 'Packs documents illimités'],
    cta: "S'abonner",
    productId: 'aplus-elite',
  },
  {
    id: 'vip', nom: 'VIP', prix_m: 49990, prix_a: 37492,
    credits: 'Illimité', periode: '',
    note: 'Priorité absolue + avant-premières',
    color: '#F97316',
    features: ['Tout Élite +', 'Crédits illimités', 'Accès avant-première', 'Support dédié 24/7', 'Formations exclusives'],
    cta: 'Contacter',
    productId: 'aplus-vip',
  },
]

const FEATURES = [
  { icon: '📚', title: 'Guides Premium', desc: 'Bibliothèque complète — nouveaux guides chaque mois selon plan' },
  { icon: '🤖', title: 'Outils IA', desc: 'CV, business plan, juridique, finance, RH, immobilier et plus' },
  { icon: '🌀', title: 'ABAWI 360', desc: 'CRM, planification, statistiques, marketing et studio (dès plan 360)' },
  { icon: '🎙️', title: 'Annah', desc: "Assistante vocale stratégique premium — accès prioritaire selon plan" },
  { icon: '🎧', title: 'Podcasts & Academy', desc: 'Audio premium, cours certifiants, parcours professionnels' },
  { icon: '💳', title: 'Crédits flexibles', desc: 'Quota mensuel selon plan + packs de recharge disponibles' },
]

const FAQ = [
  { q: 'Comment annuler mon abonnement ?', a: 'Envoyez simplement "STOP" sur WhatsApp au 77 500 97 40. Arrêt immédiat, sans frais.' },
  { q: 'Puis-je changer de plan ?', a: 'Oui, à tout moment. Le changement prend effet à la prochaine période de facturation.' },
  { q: 'Que se passe-t-il à la fin de mon abonnement ?', a: 'Vous conservez les contenus déjà récupérés. Les accès premium (IA, 360, Annah) s\'arrêtent à la fin de la période payée.' },
  { q: "Quelle est la différence annuel/mensuel ?", a: "L'abonnement annuel représente -25% sur le prix mensuel, soit environ 3 mois offerts sur l'année." },
  { q: 'Puis-je partager mon accès ?', a: "L'abonnement est individuel. Pour les équipes, contactez-nous pour une offre entreprise." },
]

export default function AbawiPlus() {
  const [billing, setBilling] = useState('mensuel')
  const [showPayment, setShowPayment] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  function subscribe(tier) {
    if (tier.id === 'gratuit') { window.location.href = '/inscription'; return }
    if (tier.id === 'vip') {
      window.open(waLink('Abonnement ABAWI+ VIP', tier.prix_m), '_blank')
      return
    }
    setSelectedTier(tier)
    setShowPayment(true)
  }

  const prix = (tier) => billing === 'annuel' ? tier.prix_a : tier.prix_m

  return (
    <main className="ap-page">
      {showPayment && selectedTier && (
        <PaymentFlow
          product={{
            id: selectedTier.productId,
            titre: `ABAWI+ ${selectedTier.nom} — ${billing === 'annuel' ? 'Annuel' : 'Mensuel'}`,
            prix: billing === 'annuel' ? selectedTier.prix_a * 12 : selectedTier.prix_m,
            type: 'abonnement',
            billing_type: billing,
          }}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* HERO */}
      <section className="ap-hero">
        <div className="ap-hero-grid-bg" />
        <div className="ap-hero-glow ap-hero-glow--1" />
        <div className="ap-hero-glow ap-hero-glow--2" />
        <div className="ap-hero-content">
          <div className="ap-hero-eyebrow">
            <span className="ap-hero-dot" /><span>Plateforme N°1 au Sénégal</span>
          </div>
          <span className="ap-hero-badge">ABAWI<span className="ap-hero-badge-plus">+</span></span>
          <h1 className="ap-hero-title">
            Tout ce dont vous avez<br/>besoin pour <span className="ap-hero-plus">réussir</span>
          </h1>
          <p className="ap-hero-tagline">Guides premium · IA complète · Annah · ABAWI 360<br/>En un seul espace, pour tous vos projets.</p>
          <div className="ap-hero-metrics">
            <div className="ap-hero-metric"><span className="ap-hero-metric-val">30+</span><span className="ap-hero-metric-lbl">Outils IA</span></div>
            <div className="ap-hero-metric-sep" />
            <div className="ap-hero-metric"><span className="ap-hero-metric-val">6</span><span className="ap-hero-metric-lbl">Plans flexibles</span></div>
            <div className="ap-hero-metric-sep" />
            <div className="ap-hero-metric"><span className="ap-hero-metric-val">4 990</span><span className="ap-hero-metric-lbl">FCFA / mois</span></div>
          </div>
          <div className="ap-hero-btns">
            <button className="ap-hero-sub" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Choisir mon plan →
            </button>
            <a href={waLink('ABAWI+ Informations', 0)} target="_blank" rel="noopener noreferrer" className="ap-hero-wa">
              Questions ? WhatsApp
            </a>
          </div>
          <p className="ap-hero-reassurance">✓ Sans engagement · ✓ Annulation en 1 clic · ✓ Accès immédiat</p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="ap-features">
        <h2 className="ap-section-title">Ce qui est inclus</h2>
        <div className="ap-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="ap-feat-card">
              <span className="ap-feat-icon">{f.icon}</span>
              <h3 className="ap-feat-title">{f.title}</h3>
              <p className="ap-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="ap-pricing" id="pricing">
        <h2 className="ap-section-title">Choisir votre plan</h2>

        {/* Toggle mensuel / annuel */}
        <div className="ap-billing-toggle">
          <button
            className={`ap-billing-btn${billing === 'mensuel' ? ' active' : ''}`}
            onClick={() => setBilling('mensuel')}
          >Mensuel</button>
          <button
            className={`ap-billing-btn${billing === 'annuel' ? ' active' : ''}`}
            onClick={() => setBilling('annuel')}
          >Annuel <span className="ap-billing-save">−25%</span></button>
        </div>

        <div className="ap-tiers-grid">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`ap-tier-card${tier.featured ? ' ap-tier-card--featured' : ''}`}
              style={{ '--tier-color': tier.color }}
            >
              {tier.badge && <div className="ap-tier-badge">{tier.badge}</div>}
              <div className="ap-tier-name">{tier.nom}</div>
              <div className="ap-tier-note">{tier.note}</div>
              <div className="ap-tier-price">
                {tier.prix_m === 0
                  ? <span className="ap-tier-amount">Gratuit</span>
                  : <>
                      <span className="ap-tier-amount">{prix(tier).toLocaleString('fr-FR')}</span>
                      <span className="ap-tier-unit"> FCFA/mois</span>
                    </>
                }
                {billing === 'annuel' && tier.prix_m > 0 && (
                  <div className="ap-tier-annual">Facturé {(tier.prix_a * 12).toLocaleString('fr-FR')} F/an</div>
                )}
              </div>
              <div className="ap-tier-credits">{tier.credits}{tier.periode}</div>
              <ul className="ap-tier-features">
                {tier.features.map((f, i) => (
                  <li key={i}><span className="ap-tier-check">✓</span> {f}</li>
                ))}
              </ul>
              <button
                className={`ap-tier-cta${tier.featured ? ' ap-tier-cta--featured' : ''}`}
                style={tier.featured ? {} : { borderColor: tier.color, color: tier.color }}
                onClick={() => subscribe(tier)}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARE */}
      <section className="ap-compare">
        <h2 className="ap-section-title">Comparatif des fonctionnalités</h2>
        <div className="ap-compare-table">
          <div className="ap-compare-row ap-compare-header">
            <div className="ap-compare-cell ap-compare-label">Fonctionnalité</div>
            {['Gratuit','Starter','Pro','360','Élite','VIP'].map(n => (
              <div key={n} className={`ap-compare-cell${n === 'Pro' ? ' ap-compare-cell--plus' : ''}`}>{n}</div>
            ))}
          </div>
          {[
            ['Crédits IA/mois',        '15',     '100',    '300',    '600',    '1 000',  '∞'],
            ['Guides premium',         'Limité',  '✓',      '✓',      '✓',      '✓',      '✓'],
            ['Podcasts & Academy',     '—',       '✓',      '✓',      '✓',      '✓',      '✓'],
            ['Outils IA avancés',      '—',       '—',      '✓',      '✓',      '✓',      '✓'],
            ['Annah vocal premium',    '—',       '—',      '✓',      '✓',      '✓',      '✓'],
            ['ABAWI 360',              '—',       '—',      '—',      '✓',      '✓',      '✓'],
            ['Studio Pro',             '—',       '—',      '—',      '—',      '✓',      '✓'],
            ['Support prioritaire',    '—',       '—',      '—',      '—',      '—',      '✓'],
          ].map((row, i) => (
            <div key={i} className="ap-compare-row">
              <div className="ap-compare-cell ap-compare-label">{row[0]}</div>
              {row.slice(1).map((v, j) => (
                <div key={j} className={`ap-compare-cell${j === 2 ? ' ap-compare-cell--plus' : ''}`}>{v}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="ap-faq">
        <h2 className="ap-section-title">Questions fréquentes</h2>
        <div className="ap-faq-list">
          {FAQ.map((f, i) => (
            <div key={i} className={`ap-faq-item${openFaq === i ? ' ap-faq-item--open' : ''}`}>
              <button className="ap-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <span className="ap-faq-arrow">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="ap-faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* STICKY */}
      <div className="ap-sticky">
        <div className="ap-sticky-inner">
          <span className="ap-sticky-text">ABAWI+ — À partir de 4 990 FCFA/mois</span>
          <div className="ap-sticky-btns">
            <button className="ap-sticky-sub" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Voir les offres
            </button>
            <a href={waLink('ABAWI+ Informations', 0)} target="_blank" rel="noopener noreferrer" className="ap-sticky-wa">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

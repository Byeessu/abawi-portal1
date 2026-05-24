import React from 'react';
import './MarketingDesigns.css';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const offers = [
  {
    icon: '🚀',
    title: 'Pack Démarrage',
    desc: 'Solution complète pour lancer votre présence digitale avec Abawi 360°, site vitrine, et intégration sociale.',
    price: '149 000',
    unit: 'FCFA',
    features: ['Site vitrine responsive', 'SEO de base', 'Réseaux sociaux connectés', 'Support 30 jours'],
    badge: 'Populaire',
    highlight: false,
  },
  {
    icon: '💎',
    title: 'Pack Premium',
    desc: 'E-commerce, catalogue produits, paiements intégrés et tableau de bord analytics avancé.',
    price: '349 000',
    unit: 'FCFA',
    features: ['Boutique en ligne', 'Paiement Wave/OM', 'Catalogue Abavie & Store', 'Analytics BI', 'Support 90 jours'],
    badge: 'Recommandé',
    highlight: true,
  },
  {
    icon: '🏢',
    title: 'Pack Entreprise',
    desc: 'Solution sur mesure avec API, multi-sites, intégration CRM et accompagnement stratégique.',
    price: 'Sur devis',
    unit: '',
    features: ['Architecture sur mesure', 'API REST complète', 'Multi-domaines', 'CRM & Marketing', 'Accompagnement dédié'],
    badge: 'Sur mesure',
    highlight: false,
  },
];

const included = [
  { icon: '🔒', title: 'Sécurité SSL', desc: 'Certificats HTTPS et protection DDoS inclus.' },
  { icon: '⚡', title: 'Performance', desc: 'CDN global, caching et optimisation automatique.' },
  { icon: '📱', title: '100% Responsive', desc: 'Mobile, tablette et desktop parfaitement adaptés.' },
  { icon: '🤖', title: 'IA Intégrée', desc: 'Chatbot, génération de contenu et analyse prédictive.' },
];

export default function CommercialOffers() {
  const handlePrint = () => window.print();
  const { mode } = useThemedStyles();
  const isLight = mode === 'light';
  const dimColor = isLight ? '#4A5568' : '#c9d1d9';

  return (
    <div className="abawi-marketing">
      {/* HERO */}
      <section className="mk-hero">
        <div className="mk-hero-badge">✨ Offres 2026</div>
        <h1>
          Propulsez votre business<br />
          <span>avec Abawi</span>
        </h1>
        <p>
          Des solutions digitales clés en main, pensées pour les entrepreneurs,
          PME et grandes entreprises en Afrique et au-delà.
        </p>
        <div className="mk-hero-actions">
          <button className="btn-premium" onClick={() => document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' })}>
            Voir les offres
          </button>
          <a href="#contact" className="link-underline" style={{ color: '#F0B429', fontWeight: 600 }}>
            Demander un devis →
          </a>
        </div>
      </section>

      {/* OFFRES */}
      <section id="offres" className="mk-section">
        <div className="mk-section-title">
          <h2>Nos <span>Offres Commerciales</span></h2>
          <p>Des forfaits transparents, sans frais cachés, évolutifs selon vos besoins.</p>
        </div>
        <div className="mk-grid mk-grid--3">
          {offers.map((o, i) => (
            <div
              key={i}
              className="mk-card"
              style={o.highlight ? { borderColor: 'rgba(240,180,41,0.4)', boxShadow: '0 0 0 1px rgba(240,180,41,0.15), 0 16px 40px rgba(240,180,41,0.1)' } : {}}
            >
              <div className="mk-card-icon">{o.icon}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3>{o.title}</h3>
                <span className={`mk-badge ${o.badge === 'Recommandé' ? 'mk-badge--green' : 'mk-badge--gold'}`}>{o.badge}</span>
              </div>
              <p>{o.desc}</p>
              <div className="mk-card-price">
                {o.price} <span>{o.unit}</span>
              </div>
              <ul style={{ margin: '20px 0 0', padding: 0, listStyle: 'none' }}>
                {o.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: '0.92rem', color: dimColor }}>
                    <span style={{ color: '#F0B429' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* INCLUS */}
      <section className="mk-section" style={{ background: 'linear-gradient(180deg, transparent, rgba(240,180,41,0.03))' }}>
        <div className="mk-section-title">
          <h2>Toujours <span>inclus</span></h2>
          <p>Peu importe l'offre choisie, vous bénéficiez de ces garanties.</p>
        </div>
        <div className="mk-grid mk-grid--4">
          {included.map((item, i) => (
            <div key={i} className="mk-card" style={{ textAlign: 'center', padding: '28px' }}>
              <div className="mk-card-icon" style={{ margin: '0 auto 16px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.05rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.88rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mk-section" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
          Prêt à <span>démarrer ?</span>
        </h2>
        <p style={{ color: dimColor, marginBottom: 32 }}>
          Contactez-nous pour une consultation gratuite et un devis personnalisé.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-premium">Demander un devis</button>
          <button className="btn-premium" style={{ background: 'transparent', border: '2px solid #F0B429', color: '#F0B429' }}>
            Télécharger la brochure
          </button>
        </div>
      </section>

      <button className="mk-print-btn" onClick={handlePrint}>
        🖨️ Imprimer / PDF
      </button>
    </div>
  );
}

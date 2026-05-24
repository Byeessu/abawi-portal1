import React, { useState } from 'react';
import './MarketingDesigns.css';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const demoProducts = [
  { id: 1, name: 'Abawi 360° Pro', category: 'Digital', price: '89 000', img: '📦', desc: 'Présence digitale complète avec site, réseaux et analytics.' },
  { id: 2, name: 'Pack Santé Abavie', category: 'Santé', price: '45 000', img: '🌿', desc: 'Compléments alimentaires naturels, bien-être quotidien.' },
  { id: 3, name: 'Formations Arkel Up', category: 'Éducation', price: '25 000', img: '🎓', desc: 'Certifications digitales et parcours e-learning premium.' },
  { id: 4, name: 'SenTicket Premium', category: 'Événement', price: '5 000', img: '🎫', desc: 'Gestion et billetterie événementielle intelligente.' },
  { id: 5, name: 'Abawi Store API', category: 'Tech', price: '120 000', img: '⚙️', desc: 'API e-commerce complète pour intégration propriétaire.' },
  { id: 6, name: 'Abawi IA Vocal', category: 'IA', price: '65 000', img: '🎙️', desc: 'Assistant vocal intelligent, synthèse et reconnaissance.' },
];

const categories = ['Tous', 'Digital', 'Santé', 'Éducation', 'Événement', 'Tech', 'IA'];

export default function CatalogueViewer() {
  const [filter, setFilter] = useState('Tous');
  const filtered = filter === 'Tous' ? demoProducts : demoProducts.filter(p => p.category === filter);
  const { mode } = useThemedStyles();
  const isLight = mode === 'light';
  const dimColor = isLight ? '#4A5568' : '#8B95A5';
  const filterBorder = isLight ? '#CBD5E0' : '#1A2332';

  const handlePrint = () => window.print();

  return (
    <div className="abawi-marketing">
      <section className="mk-hero" style={{ padding: '56px 24px' }}>
        <div className="mk-hero-badge">📖 Catalogue 2026</div>
        <h1>
          Découvrez nos <span>solutions</span>
        </h1>
        <p>Technologie, santé, éducation et événementiel — tout en un écosystème.</p>
      </section>

      <section className="mk-catalogue">
        <div className="mk-catalogue-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Nos Produits & Services</h3>
            <p style={{ margin: '6px 0 0', color: dimColor, fontSize: '0.9rem' }}>{filtered.length} résultat(s)</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 100,
                  border: '1px solid ' + (filter === c ? '#F0B429' : filterBorder),
                  background: filter === c ? 'rgba(240,180,41,0.15)' : 'transparent',
                  color: filter === c ? '#F0B429' : dimColor,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mk-catalogue-grid">
          {filtered.map(p => (
            <div key={p.id} className="mk-product-card">
              <div className="mk-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                {p.img}
              </div>
              <div className="mk-product-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="mk-badge mk-badge--gold">{p.category}</span>
                </div>
                <h4>{p.name}</h4>
                <p>{p.desc}</p>
                <div className="mk-product-meta">
                  <span className="mk-product-price">{p.price} FCFA</span>
                  <button className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mk-section" style={{ textAlign: 'center', paddingTop: 0 }}>
        <p style={{ color: dimColor, marginBottom: 24 }}>
          Besoin d'un catalogue personnalisé pour votre secteur ? Contactez notre équipe commerciale.
        </p>
        <button className="btn-premium">Demander un catalogue sur mesure</button>
      </section>

      <button className="mk-print-btn" onClick={handlePrint}>🖨️ Imprimer / PDF</button>
    </div>
  );
}

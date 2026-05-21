import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MarketingDesigns.css';
import { useThemedStyles } from '../../context/ThemeContext';

const slides = [
  {
    type: 'hero',
    title: 'ABAWI',
    subtitle: "L'écosystème digital de l'Afrique",
    body: 'Technologie · Santé · Éducation · Événementiel — unifiés sur une seule plateforme.',
  },
  {
    type: 'stats',
    title: 'Chiffres clés',
    body: 'Une croissance rapide, des utilisateurs engagés et un impact mesurable.',
    stats: [
      { number: '15K+', label: 'Utilisateurs actifs' },
      { number: '50+', label: 'Partenaires' },
      { number: '6', label: 'Pays couverts' },
      { number: '98%', label: 'Satisfaction client' },
    ],
  },
  {
    type: 'content',
    title: 'Notre Vision',
    body: 'Démocratiser l\'accès aux technologies de pointe pour les entreprises africaines. Nous croyons que l\'innovation ne doit pas être un luxe réservé aux grandes multinationales.',
    points: [
      'Accessibilité : des prix adaptés aux réalités locales',
      'Performance : des outils comparables aux standards mondiaux',
      'Accompagnement : un suivi humain à chaque étape',
    ],
  },
  {
    type: 'content',
    title: 'Nos Piliers',
    body: 'Quatre verticales complémentaires pour répondre à tous vos besoins digitaux.',
    points: [
      'Abawi 360° — Plateforme digitale tout-en-un',
      'Abavie — Santé & bien-être naturel',
      'Arkel Up — Formation & certification',
      'SenTicket — Billetterie & événementiel',
    ],
  },
  {
    type: 'cta',
    title: 'Rejoignez le mouvement',
    body: 'Que vous soyez startup, PME ou grand compte, nous avons la solution pour accélérer votre croissance digitale.',
  },
];

export default function PresentationDeck() {
  const handlePrint = () => window.print();
  const navigate = useNavigate();
  const { mode } = useThemedStyles();
  const isLight = mode === 'light';
  const dimColor = isLight ? '#4A5568' : '#8B95A5';
  const subtitleColor = isLight ? '#1A202C' : '#F0F2F5';
  const borderColor = isLight ? '#CBD5E0' : '#1A2332';

  const scrollToNext = () => {
    const slides = document.querySelectorAll('.mk-slide');
    if (slides[1]) slides[1].scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="abawi-marketing mk-deck">
      {slides.map((slide, i) => (
        <div key={i} className="mk-slide">
          {slide.type === 'hero' && (
            <>
              <div className="mk-hero-badge" style={{ marginBottom: 32 }}>🚀 Présentation 2026</div>
              <h2>{slide.title}<span>.</span></h2>
              <p style={{ fontSize: '1.4rem', fontWeight: 600, color: subtitleColor, marginBottom: 16 }}>{slide.subtitle}</p>
              <p>{slide.body}</p>
              <div style={{ marginTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn-premium" onClick={() => navigate('/contact')}>Démarrer un projet</button>
                <button onClick={scrollToNext} style={{ background: 'none', border: 'none', color: dimColor, cursor: 'pointer', fontSize: '0.95rem', alignSelf: 'center', padding: '8px 0' }}>
                  → Faites défiler pour en savoir plus
                </button>
              </div>
            </>
          )}

          {slide.type === 'stats' && (
            <>
              <h2>{slide.title}</h2>
              <p>{slide.body}</p>
              <div className="mk-stat">
                {slide.stats.map((s, j) => (
                  <div key={j} className="mk-stat-item">
                    <div className="mk-stat-number">{s.number}</div>
                    <div className="mk-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {slide.type === 'content' && (
            <>
              <h2>{slide.title}</h2>
              <p style={{ marginBottom: 32 }}>{slide.body}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 }}>
                {slide.points.map((pt, j) => (
                  <li key={j} style={{
                    padding: '20px 24px',
                    background: 'rgba(240,180,41,0.06)',
                    border: '1px solid rgba(240,180,41,0.15)',
                    borderRadius: 12,
                    fontSize: '1.05rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ color: '#F0B429', fontSize: '1.2rem' }}>▸</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </>
          )}

          {slide.type === 'cta' && (
            <>
              <h2>{slide.title}<span>.</span></h2>
              <p style={{ marginBottom: 40 }}>{slide.body}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button className="btn-premium" onClick={() => navigate('/contact')}>Nous contacter</button>
                <button className="btn-premium" onClick={() => navigate('/offres')} style={{ background: 'transparent', border: '2px solid #F0B429', color: '#F0B429' }}>
                  Voir les offres
                </button>
              </div>
              <div style={{ marginTop: 56, paddingTop: 32, borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, color: dimColor, fontSize: '0.9rem' }}>
                <span>🌐 abawi.app</span>
                <span>📧 contact@abawi.app</span>
                <span>📍 Dakar · Abidjan</span>
              </div>
            </>
          )}
        </div>
      ))}

      <button className="mk-print-btn" onClick={handlePrint}>
        🖨️ Imprimer / PDF
      </button>
    </div>
  );
}

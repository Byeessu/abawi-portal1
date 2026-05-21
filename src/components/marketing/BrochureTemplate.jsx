import React from 'react';
import './MarketingDesigns.css';

const brochureData = {
  company: 'ABAWI',
  tagline: 'L\'innovation au service de l\'Afrique',
  contact: {
    web: 'www.abawi.app',
    email: 'contact@abawi.app',
    tel: '+221 77 123 45 67',
    address: 'Dakar, Sénégal — Abidjan, Côte d\'Ivoire',
  },
  sections: [
    {
      title: 'Qui sommes-nous ?',
      items: [
        { label: 'Abawi 360°', desc: 'Plateforme digitale tout-en-un pour entrepreneurs, PME et grandes entreprises.' },
        { label: 'Abavie', desc: 'Boutique santé & bien-être avec produits naturels et conseils personnalisés.' },
        { label: 'Arkel Up', desc: 'Centre de formation digitale avec certifications reconnues.' },
        { label: 'SenTicket', desc: 'Billetterie et gestion événementielle intelligente.' },
      ],
    },
    {
      title: 'Nos Solutions Clés',
      items: [
        { label: 'Sites & E-commerce', desc: 'Vitrines performantes et boutiques avec paiement mobile intégré.' },
        { label: 'Intelligence Artificielle', desc: 'Chatbots, génération de contenu, analyse prédictive et assistant vocal.' },
        {nlabel: 'Marketing Digital', desc: 'SEO, réseaux sociaux, campagnes automatisées et analytics BI.' },
        { label: 'Cloud & API', desc: 'Infrastructure scalable, API REST et intégrations tierces.' },
      ],
    },
    {
      title: 'Pourquoi nous choisir ?',
      items: [
        { label: 'Expertise locale', desc: 'Des équipes basées en Afrique, compréhension des marchés et usages locaux.' },
        { label: 'Technologie de pointe', desc: 'IA, cloud, sécurité — nous utilisons les meilleurs outils mondiaux.' },
        { label: 'Accompagnement humain', desc: 'Pas de robot déshumanisé : un conseiller dédié à chaque étape.' },
        { label: 'Prix accessibles', desc: 'Des forfaits transparents pensés pour les budgets africains.' },
      ],
    },
  ],
};

export default function BrochureTemplate() {
  const handlePrint = () => window.print();

  return (
    <div className="abawi-marketing">
      <div className="mk-brochure">
        {/* HEADER */}
        <div className="mk-brochure-header">
          <div className="mk-brochure-logo">
            {brochureData.company}<span>.</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
            <div>{brochureData.contact.web}</div>
            <div>{brochureData.contact.email}</div>
          </div>
        </div>

        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2.4rem', margin: '0 0 12px', color: '#0D1117' }}>
            {brochureData.tagline}
          </h2>
          <p style={{ color: '#666', fontSize: '1.05rem', margin: 0 }}>
            Découvrez l'écosystème digital pensé pour propulser votre business.
          </p>
        </div>

        {/* CONTENT */}
        {brochureData.sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 36 }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0D1117',
              margin: '0 0 16px',
              paddingBottom: 8,
              borderBottom: '2px solid #F0B429',
              display: 'inline-block',
            }}>
              {sec.title}
            </h3>
            <div className="mk-brochure-grid">
              {sec.items.map((item, j) => (
                <div key={j} className="mk-brochure-item">
                  <h4>{item.label}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CONTACT */}
        <div style={{
          background: 'linear-gradient(135deg, #0D1117, #1A2332)',
          borderRadius: 16,
          padding: 28,
          color: '#fff',
          marginTop: 32,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem' }}>Contactez-nous</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: '0.9rem' }}>
            <div>🌐 {brochureData.contact.web}</div>
            <div>📧 {brochureData.contact.email}</div>
            <div>📞 {brochureData.contact.tel}</div>
            <div>📍 {brochureData.contact.address}</div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mk-brochure-footer">
          © 2026 Abawi. Tous droits réservés. Ce document est la propriété exclusive d'Abawi.
        </div>
      </div>

      <button className="mk-print-btn" onClick={handlePrint}>
        🖨️ Imprimer / PDF
      </button>
    </div>
  );
}

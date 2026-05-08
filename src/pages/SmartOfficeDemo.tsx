/**
 * ABAWI SMART OFFICE - PAGE DÉMONSTRATION
 * Test complet de toutes les fonctionnalités
 */

import React, { useState } from 'react';
import AbawiSmartOfficeEditorPro from '../components/AbawiSmartOfficeEditorPro';

export default function SmartOfficeDemo() {
  const [showDemo, setShowDemo] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
          ABAWI Smart Office - Demo
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
          Document Intelligence Engine pour l'Afrique
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <span style={{
            background: '#10b981',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            ABAWI IA Activé
          </span>
          <span style={{
            background: '#3b82f6',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            5 Agents Experts
          </span>
          <span style={{
            background: '#f59e0b',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            Africa-First
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: 'clamp(16px, 2.5vw, 28px)',
        maxWidth: 'min(1440px, 96vw)',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
            Instructions d'utilisation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#3b82f6', fontSize: '1rem' }}>
                Slash Commands
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                Tapez <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>/</code> dans l'éditeur pour voir toutes les commandes
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '1rem' }}>
                Agents IA ABAWI
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                Utilisez <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>IA Bancaire</code>, <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>IA Consulting</code>, etc.
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '1rem' }}>
                Smart Blocks
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                Insérez KPI, SWOT, DCF, OHADA directement avec les commandes
              </p>
            </div>
          </div>
        </div>

        {/* Exemples de test */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
            Exemples à tester
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Business Plan Tech Startup Sénégal

Notre startup développe une solution fintech pour les PMES sénégalaises.

Chiffres clés :
- CA année 1 : 15M XOF
- CA année 2 : 45M XOF  
- CA année 3 : 120M XOF
- Marge nette : 22%
- Investissement initial : 25M XOF

Nous cherchons un financement de 50M XOF pour accélérer notre croissance.`;
                }
              }}
              style={{
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Test IA Bancaire
            </button>
            
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Analyse d'une entreprise de e-commerce au Sénégal

Contexte :
Entreprise créée en 2022, spécialisée dans la vente en ligne de produits locaux.
Marché en croissance de 35% par an.

Forces :
- Premier entrant sur niche produits locaux
- Team expérimentée e-commerce
- Partenariats avec artisans

Faiblesse :
- Capital limité
- Logistique complexe
- Concurrence internationale

Objectifs :
- Levée de fonds 2M$
- Expansion UEMOA
- 100K utilisateurs d'ici 2 ans`;
                }
              }}
              style={{
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Test IA Consulting
            </button>
            
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Projet de contrat de partenariat

Entre la Société Tech Innovation Sénégal et la Société Distribution Africa

Objet : Distribution exclusive des produits tech sur le territoire UEMOA

Durée : 3 ans renouvelable

Conditions :
- Commission : 15% du CA HT
- Minimum garanti : 2M XOF/an
- Exclusivité territoire UEMOA

Obligations :
- Tech Innovation : Fournir produits conformes, support technique
- Distribution Africa : Marketing, vente, rapports mensuels

Nous souhaitons un contrat conforme au droit OHADA.`;
                }
              }}
              style={{
                padding: '12px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Test IA Juridique
            </button>
            
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `CV Développeur Full Stack

JEAN DIOP
jean.diop@email.com | +221 77 123 45 67 | Dakar, Sénégal

EXPÉRIENCE
Développeur Senior | Tech Startup Sénégal | 2021-Présent
- Développement applications React/Node.js
- Lead équipe de 5 développeurs
- Architecture microservices

Développeur Web | Digital Agency | 2019-2021  
- Sites e-commerce pour clients internationaux
- Optimisation SEO et performance

COMPÉTENCES TECHNIQUES
Frontend : React, TypeScript, Next.js, Tailwind CSS
Backend : Node.js, Python, MongoDB, PostgreSQL
DevOps : Docker, CI/CD, AWS, Kubernetes
Outils : Git, Jira, Slack, Figma

FORMATION
Licence Informatique | Université Cheikh Anta Diop | 2015-2019

PROJETS
- Plateforme e-commerce 10K+ utilisateurs
- API REST pour application mobile
- Système gestion inventaire

LANGUES
Français (natif), Anglais (professionnel), Wolof (courant)

OBJECTIF
Poste de Lead Developer ou CTO dans startup innovante`;
                }
              }}
              style={{
                padding: '12px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Test IA RH
            </button>
            
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Projet d'investissement immobilier Dakar

Bien : Appartement 3 pièces, 85m2
Localisation : Dakar Plateau (excellent)
Prix demandé : 85M XOF

Caractéristiques :
- 3 chambres, 2 salles de bain
- Balcon terrasse 15m2
- État : Bon à rafraîchir
- Étage : 4/6 avec ascenseur

Analyse marché :
- Prix m2 quartier : 1.2M XOF
- Loyer moyen 3 pièces : 250K XOF/mois
- Taux vacance : 5%
- Charges copropriété : 60K XOF/mois

Investissement :
- Apport personnel : 30% (25.5M XOF)
- Emprunt bancaire : 59.5M XOF
- Frais notariés : 6.8M XOF
- Frais agence : 2.55M XOF

Rentabilité attendue :
- Loyer annuel : 3M XOF
- Cash flow mensuel : ?
- TRI sur 20 ans : ?
- Plus-value potentielle : 3%/an

Veuillez analyser la rentabilité de cet investissement.`;
                }
              }}
              style={{
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Test IA Immobilier
            </button>
          </div>
        </div>
      </div>

      {/* Éditeur Smart Office */}
      {showDemo && (
        <div style={{ height: 'calc(100vh - 300px)' }}>
          <AbawiSmartOfficeEditorPro />
        </div>
      )}
    </div>
  );
}

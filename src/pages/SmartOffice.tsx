/**
 * ABAWI SMART OFFICE - VERSION OFFICIELLE
 * Éditeur de documents intelligent universel
 */

import React, { useState } from 'react';
import AbawiSmartOfficeEditorPro from '../components/AbawiSmartOfficeEditorPro';
import ToolInfoPanel from '../components/ToolInfoPanel';

export default function SmartOffice() {
  const [showDemo, setShowDemo] = useState(true);
  const [settings, setSettings] = useState({
    showAfricaFeatures: false,
    showAdvancedAI: true,
    professionalMode: true
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowY: 'auto', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{
        padding: '12px',
        background: 'var(--gradient-hero)',
        color: 'var(--text-primary)',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          ABAWI Smart Office
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Document Intelligence Engine
        </p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {settings.showAdvancedAI && (
            <span style={{
              background: 'var(--accent2)',
              color: 'var(--bg-primary)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              IA Intégrée
            </span>
          )}
          <span style={{
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            5 Agents Experts
          </span>
          {settings.professionalMode && (
            <span style={{
              background: 'var(--accent3)',
              color: 'var(--bg-primary)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Mode Pro
            </span>
          )}
        </div>
      </div>

      {/* Info Panel - En savoir plus */}
      <div style={{
        padding: 'clamp(10px, 2vw, 20px)',
        maxWidth: 'min(1440px, 96vw)',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <ToolInfoPanel
          toolName="Smart Office"
          icon="📄"
          description="Éditeur de documents intelligent avec 5 agents experts IA"
          benefits={[
            'Rédaction assistée par IA pour tous types de documents',
            '5 experts spécialisés : Bancaire, Consulting, Juridique, RH, Immobilier',
            'Smart Blocks : KPI, SWOT, DCF, tableaux intégrés',
            'Mode Africa avec OHADA et BCEAO',
            'Export PDF professionnel avec mise en page optimisée',
            'Commandes rapides avec le préfixe /'
          ]}
          howToUse={[
            'Choisissez le type de document à rédiger dans l\'éditeur',
            'Utilisez les boutons de test pour charger des exemples',
            'Tapez / dans l\'éditeur pour voir les commandes rapides',
            'Laissez l\'IA analyser et améliorer votre contenu',
            'Exportez votre document en PDF avec mise en page pro'
          ]}
          tips={[
            'Plus votre brief est détaillé, meilleure est l\'analyse IA',
            'Utilisez les Smart Blocks pour des données structurées',
            'L\'IA Bancaire excelle sur les business plans et prévisions',
            'L\'IA Juridique connaît le droit OHADA et français'
          ]}
        />
      </div>

      {/* Panneau de configuration */}
      <div style={{
        padding: 'clamp(10px, 2vw, 20px)',
        maxWidth: 'min(1440px, 96vw)',
        margin: '0 auto',
        width: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '10px'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Paramètres
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.showAfricaFeatures}
                onChange={(e) => setSettings({...settings, showAfricaFeatures: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Fonctionnalités Africa (OHADA, BCEAO)
              </span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.showAdvancedAI}
                onChange={(e) => setSettings({...settings, showAdvancedAI: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                IA Avancée
              </span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.professionalMode}
                onChange={(e) => setSettings({...settings, professionalMode: e.target.checked})}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Mode Professionnel
              </span>
            </label>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '10px'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Guide d'utilisation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent)', fontSize: '1rem' }}>
                Commandes Rapides
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tapez <code style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }}>/</code> dans l'éditeur pour voir toutes les commandes
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent2)', fontSize: '1rem' }}>
                Agents Experts
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Utilisez les agents IA pour transformer vos documents
              </p>
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent3)', fontSize: '1rem' }}>
                Smart Blocks
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Insérez KPI, SWOT, DCF directement avec les commandes
              </p>
            </div>
          </div>
        </div>

        {/* Exemples de test */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '10px'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Exemples à tester
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Business Plan Tech Startup

Notre startup développe une solution fintech pour les entreprises.

Chiffres clés :
- CA année 1 : 150K EUR
- CA année 2 : 450K EUR  
- CA année 3 : 1.2M EUR
- Marge nette : 22%
- Investissement initial : 250K EUR

Nous cherchons un financement de 500K EUR pour accélérer notre croissance.`;
                }
              }}
              style={{
                padding: '8px',
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              Test IA Bancaire
            </button>
            
            <button
              onClick={() => {
                const textarea = document.querySelector('.aso-editor');
                if (textarea) {
                  (textarea as HTMLElement).textContent = `Analyse d'une entreprise de e-commerce

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
- Levée de fonds 2M EUR
- Expansion internationale
- 100K utilisateurs d'ici 2 ans`;
                }
              }}
              style={{
                padding: '12px',
                background: 'var(--accent2)',
                color: 'var(--bg-primary)',
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

Entre la Société Tech Innovation et la Société Distribution Global

Objet : Distribution exclusive des produits tech sur le territoire européen

Durée : 3 ans renouvelable

Conditions :
- Commission : 15% du CA HT
- Minimum garanti : 200K EUR/an
- Exclusivité territoire

Obligations :
- Tech Innovation : Fournir produits conformes, support technique
- Distribution : Marketing, vente, rapports mensuels

Nous souhaitons un contrat conforme au droit commercial.`;
                }
              }}
              style={{
                padding: '12px',
                background: 'var(--accent3)',
                color: '#FFFFFF',
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

JEAN MARTIN
jean.martin@email.com | +33 6 12 34 56 78 | Paris, France

EXPÉRIENCE
Développeur Senior | Tech Startup | 2021-Présent
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
Master Informatique | École d'ingénieurs | 2015-2019

PROJETS
- Plateforme e-commerce 10K+ utilisateurs
- API REST pour application mobile
- Système gestion inventaire

LANGUES
Français (natif), Anglais (courant), Espagnol (intermédiaire)

OBJECTIF
Poste de Lead Developer ou CTO dans startup innovante`;
                }
              }}
              style={{
                padding: '12px',
                background: 'var(--accent3)',
                color: 'var(--bg-primary)',
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
                  (textarea as HTMLElement).textContent = `Projet d'investissement immobilier

Bien : Appartement 3 pièces, 85m2
Localisation : Centre-ville (excellent)
Prix demandé : 450K EUR

Caractéristiques :
- 3 chambres, 2 salles de bain
- Balcon terrasse 15m2
- État : Bon à rafraîchir
- Étage : 4/6 avec ascenseur

Analyse marché :
- Prix m2 quartier : 5.5K EUR
- Loyer moyen 3 pièces : 2.2K EUR/mois
- Taux vacance : 5%
- Charges copropriété : 300 EUR/mois

Investissement :
- Apport personnel : 30% (135K EUR)
- Emprunt bancaire : 315K EUR
- Frais notariés : 35K EUR
- Frais agence : 13.5K EUR

Rentabilité attendue :
- Loyer annuel : 26.4K EUR
- Cash flow mensuel : ?
- TRI sur 20 ans : ?
- Plus-value potentielle : 3%/an

Veuillez analyser la rentabilité de cet investissement.`;
                }
              }}
              style={{
                padding: '12px',
                background: 'var(--red)',
                color: 'var(--bg-primary)',
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
        <div style={{
          flex: 1,
          overflow: 'hidden',
          border: '2px solid var(--border)',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          margin: '0 auto',
          width: '100%',
          maxWidth: 'min(1440px, 96vw)',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '500px',
          boxSizing: 'border-box',
        }}>
          <AbawiSmartOfficeEditorPro />
        </div>
      )}
    </div>
  );
}

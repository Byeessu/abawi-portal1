/**
 * ABAWI SMART OFFICE - VERSION SIMPLIFIÉE FONCTIONNELLE
 * Test direct de l'IA avec interface minimaliste
 */

import React, { useState, useRef } from 'react';
import { generateWithGrokLlama, getGrokAgents } from '../lib/grokService';
import { resolveRuntimeApiKey } from '../lib/runtimeApiKeys';

export default function SimpleSmartOffice() {
  const grokApiKey = resolveRuntimeApiKey({
    envKeys: ([import.meta.env.VITE_GROK_API_KEY, import.meta.env.VITE_GROQ_API_KEY] as string[]),
    providerId: 'groq',
    includeAlias: true
  });
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('banking');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agents = getGrokAgents();

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('Veuillez entrer du contenu à transformer');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('Génération avec agent:', selectedAgent);
      console.log('Contenu:', content.substring(0, 100) + '...');
      
      const generated = await generateWithGrokLlama(content, selectedAgent);
      console.log('Résultat généré:', generated.substring(0, 100) + '...');
      
      setResult(generated);
    } catch (error) {
      console.error('Erreur génération:', error);
      setResult(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testContent: Record<string, string> = {
    banking: `Business Plan Tech Startup

Notre startup développe une solution fintech pour les entreprises.

Chiffres clés :
- CA année 1 : 150K EUR
- CA année 2 : 450K EUR  
- CA année 3 : 1.2M EUR
- Marge nette : 22%
- Investissement initial : 250K EUR

Nous cherchons un financement de 500K EUR pour accélérer notre croissance.`,
    
    consulting: `Analyse d'une entreprise de e-commerce

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
- 100K utilisateurs d'ici 2 ans`,
    
    legal: `Projet de contrat de partenariat

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

Nous souhaitons un contrat conforme au droit commercial.`,
    
    hr: `CV Développeur Full Stack

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
Poste de Lead Developer ou CTO dans startup innovante`,
    
    realestate: `Projet d'investissement immobilier

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

Veuillez analyser la rentabilité de cet investissement.`
  };

  const loadTestContent = () => {
    setContent(testContent[selectedAgent] ?? '');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(16px, 2.5vw, 28px)' }}>
      <div style={{ maxWidth: 'min(1440px, 96vw)', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          textAlign: 'center',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
            ABAWI Smart Office - Test IA
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
            Test direct de génération avec API
          </p>
        </div>

        {/* Contrôles */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#475569' }}>
                Agent IA:
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  minWidth: '200px'
                }}
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={loadTestContent}
              style={{
                padding: '10px 16px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Charger exemple
            </button>
            
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              {loading ? 'Génération...' : 'Générer'}
            </button>
          </div>
        </div>

        {/* Éditeur */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Contenu d'entrée
            </h3>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Collez votre contenu ici ou utilisez 'Charger exemple'..."
              style={{
                width: '100%',
                height: '400px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
              Résultat généré
            </h3>
            <div
              style={{
                width: '100%',
                height: '400px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                background: result ? '#f8fafc' : '#f9fafb'
              }}
            >
              {result || 'Le résultat apparaîtra ici...'}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div style={{
          background: '#fef3c7',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#92400e'
        }}>
          <strong>Debug Info:</strong>
          <br />- API Key configurée: {grokApiKey ? 'Oui' : 'Non'}
          <br />- Agent sélectionné: {selectedAgent}
          <br />- Longueur contenu: {content.length} caractères
          <br />- Statut: {loading ? 'En cours' : 'Prêt'}
          {result && (
            <>
              <br />- Longueur résultat: {result.length} caractères
              <br />- Résultat tronqué: {result.substring(0, 100)}...
            </>
          )}
        </div>
      </div>
    </div>
  );
}


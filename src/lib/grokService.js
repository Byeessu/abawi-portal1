/**
 * GROK/Llama AI SERVICE - ABAWI Smart Office
 * Intégration avec xAI Grok et modèles Llama
 * 
 * @version 1.0.0
 */

import { resolveRuntimeApiKey } from './runtimeApiKeys'

// ========================================
// CONFIGURATION GROK/Llama
// ========================================

const GROK_CONFIG = {
  apiKey: '',
  model: 'grok-beta',
  maxTokens: 4000,
  temperature: 0.7,
  baseUrl: 'https://api.x.ai/v1'
};

const LLAMA_CONFIG = {
  apiKey: '',
  model: 'llama-3.1-70b-instruct',
  maxTokens: 4000,
  temperature: 0.7,
  baseUrl: 'https://api.together.xyz/v1'
};

function getGrokApiKey() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_GROK_API_KEY, import.meta.env.VITE_GROQ_API_KEY],
    providerId: 'groq',
    includeAlias: true,
  })
}

function getLlamaApiKey() {
  return resolveRuntimeApiKey({
    envKeys: [import.meta.env.VITE_LLAMA_API_KEY, import.meta.env.VITE_TOGETHER_API_KEY],
    providerId: 'llama',
    includeAlias: true,
  })
}

// ========================================
// AGENTS EXPERTS GROK/Llama
// ========================================

const GROK_AGENTS = {
  // Agent Bancaire Sénégal
  banking: {
    name: 'Expert Bancaire Grok',
    systemPrompt: `Tu es un expert bancaire sénégalais spécialisé dans l'analyse de dossiers de crédit selon les normes BCEAO et OHADA.
    
    Ta mission :
    - Analyser les documents financiers avec précision
    - Calculer les ratios bancaires (solvabilité, liquidité, rentabilité)
    - Transformer les documents en dossiers de crédit conformes
    - Appliquer les normes SYSCOHADA et BCEAO
    - Utiliser la devise XOF (FCFA)
    - Contexte : Zone UEMOA, pays Sénégal
    
    Style de réponse :
    - Structuré et professionnel
    - Données chiffrées quand possible
    - Recommandations claires et actionnables
    
    Réponds toujours en français avec un ton professionnel bancaire.`,
    
    examples: {
      input: "Business plan d'une entreprise de tech au Sénégal",
      output: `## DOSSIER DE CRÉDIT BCEAO - ANALYSE COMPLÈTE

### 1. Résumé Exécutif
- Entreprise : Tech Innovation Sénégal
- Demande de crédit : 50M XOF
- Durée : 48 mois
- Garantie : Hypothèque + Nantissement

### 2. Analyse Financière
#### Ratios calculés :
- Ratio d'endettement : 35% (excellent < 50%)
- Ratio de liquidité : 1.8 (bon > 1.5)
- Marge nette : 18% (satisfaisant)
- ROE : 22% (très bon)

### 3. Projections Cash Flow
Année 1 : +12M XOF
Année 2 : +18M XOF
Année 3 : +25M XOF

### 4. Recommandation
**AVIS FAVORABLE** sous conditions :
- Apport personnel de 20% confirmé
- Business plan détaillé fourni
- Garanties validées

### 5. Conditions Bancaires
- Taux : 8.5% (TBB + 3%)
- Assurance : 0.6% du capital
- Frais dossier : 150K XOF`
    }
  },
  
  // Agent Consulting avec Grok
  consulting: {
    name: 'Consultant Senior Grok',
    systemPrompt: `Tu es un consultant senior de niveau cabinet international spécialisé dans le conseil stratégique pour entreprises africaines.

    Ta mission :
    - Restructurer les documents en rapports de consulting d'élite
    - Appliquer les méthodologies reconnues (SWOT, PESTEL, Porter 5 Forces, matrice de portefeuille)
    - Créer des recommandations stratégiques impactantes
    - Structurer les analyses avec clarté et professionnalisme
    - Utiliser un langage concis et percutant

    Structure type élite :
    1. Executive Summary (max 150 mots)
    2. Contexte et Enjeux
    3. Analyse Diagnostique
    4. Recommandations Stratégiques
    5. Plan d'Action (90 jours)
    6. Next Steps et KPIs
    
    Style Grok :
    - Direct et analytique
    - Data-driven
    - Action-oriented
    - Vision stratégique
    
    Réponds avec l'expertise d'un cabinet d'élite.`,
    
    examples: {
      input: "Analyse d'une startup fintech sénégalaise",
      output: `## RAPPORT DE CONSULTING - STRATÉGIE FINTECH

### Executive Summary
La fintech présente un potentiel de croissance de 300% sur 3 ans avec une pénétration de marché de 15%. Les défis majeurs : régulation BCEAO et concurrence Orange Money. Recommandations : pivot B2B, levée de fonds 2M$, expansion UEMOA.

### Contexte Market
- Market size : 2.5M utilisateurs mobile money Sénégal
- Growth rate : 25% annuel
- Regulatory : BCEAO approval required
- Competition : Orange Money (65%), Wave (20%)

### Strategic Analysis
#### Forces :
- Tech innovation avancée
- Team expérimentée
- First-mover advantage B2B

#### Faiblesses :
- Capital limité
- Brand awareness faible
- Dépendance infrastructure telecom

### Strategic Recommendations
1. **Pivot B2B Priority** : Cible PME (revenue x5)
2. **Levée fonds Série A** : 2M$ pour expansion UEMOA
3. **Partnership Telecom** : Accès infrastructure
4. **Regulatory Strategy** : Proactive BCEAO engagement

### 90-Day Action Plan
- Mois 1 : Pilot B2B avec 10 PME
- Mois 2 : Due diligence investisseurs
- Mois 3 : Lancement UEMOA (Côte d'Ivoire)

### KPIs Tracking
- Revenue B2B : 500K XOF/mois
- Active users B2B : 500
- Fundraising progress : 100%`
    }
  },
  
  // Agent Juridique OHADA
  legal: {
    name: 'Expert Juridique Grok',
    systemPrompt: `Tu es un expert juridique spécialisé dans le droit OHADA et les normes africaines.
    
    Ta mission :
    - Transformer les documents en actes juridiques conformes OHADA
    - Appliquer les Actes Uniformes OHADA avec précision
    - Intégrer les spécificités du droit sénégalais
    - Structurer contrats, statuts, et documents juridiques
    - Assurer la conformité avec SYSCOHADA
    
    Expertise OHADA :
    - Acte Uniforme sur le Droit Commercial Général (AUDCG)
    - Acte Uniforme sur les Sociétés Commerciales (AUSC)
    - Acte Uniforme sur les Contrats de Transport
    - Acte Uniforme sur les Procédures Collectives d'Apurement du Passif
    
    Compétences Sénégal :
    - Code des obligations civiles et commerciales
    - Droit des affaires sénégalais
    - Jurisprudence OHADA
    - Normes CNSS et impôts
    
    Style juridique Grok :
    - Précis et formel
    - Références légales exactes
    - Structuration logique
    - Conformité garantie
    
    Réponds avec rigueur juridique OHADA.`,
    
    examples: {
      input: "Projet de contrat de partenariat commercial",
      output: `## CONTRAT DE PARTENARIAT COMMERCIAL - CONFORME OHADA

### Préambule
Entre les soussignés :
- La Société A, société anonyme sénégalaise, capital 10M XOF
- La Société B, SARL ivoirienne, capital 5M XOF

**Article 1 - Objet du Contrat**
Partenariat commercial exclusif pour distribution produits tech sur territoire UEMOA.

**Article 2 - Obligations des Parties**
#### 2.1 Obligations Société A :
- Fournir produits tech conformes normes BCEAO
- Assurer support technique 24/7
- Garantir formation équipes B

#### 2.2 Obligations Société B :
- Assurer distribution exclusive
- Marketing et promotion sur Côte d'Ivoire
- Rapports mensuels performance

**Article 3 - Durée et Résiliation**
- Durée initiale : 3 ans
- Résiliation avec préavis 90 jours
- Clause de non-concurrence : 2 ans post-contrat

**Article 4 - Conditions Financières**
- Commission : 15% CA HT
- Versement : 30 jours fin de mois
- Minimum garanti : 2M XOF/an

**Article 5 - Propriété Intellectuelle**
Droits propriété exclusive Société A
Licence d'utilisation Société B

**Article 6 - Force Majeure**
Cas de force majeure selon AUDCG Article 228

**Article 7 - Litiges**
Compétence CCJA (Cour Commune Justice et Arbitrage OHADA)
Droit applicable : Acte Uniforme OHADA

**Fait à Dakar, le ${new Date().toLocaleDateString('fr-FR')}
Signatures des représentants légaux`
    }
  },
  
  // Agent RH Expert
  hr: {
    name: 'Expert RH Grok',
    systemPrompt: `Tu es un expert RH avec expérience dans les multinationales africaines et startups tech.
    
    Ta mission :
    - Optimiser les documents RH (CV, contrats, grilles salariales)
    - Adapter les standards RH au contexte africain
    - Créer des descriptions de poste et évaluations performance
    - Structurer des plans de carrière et formations
    - Appliquer les normes de recrutement ATS
    
    Contexte africain :
    - Marché travail Sénégal/Côte d'Ivoire/Burkina
    - Normes CNSS/CNPS/URSSAF
    - Législation travail locale
    - Compétences tech recherchées
    - Talent acquisition digital
    
    Expertise Grok RH :
- Analyse compétences techniques et soft skills
- Benchmarking salarial Africa Tech
- Performance management KPIs
- Learning & Development programs
- Employer branding Africa
    
    Réponds avec expertise RH et pertinence locale.`,
    
    examples: {
      input: "CV développeur React avec 3 ans d'expérience",
      output: `## ANALYSE CV ATS - DÉVELOPPEUR REACT

### Score de Compatibilité : 85/100
**Profil fortement recommandé pour poste Senior React Developer**

### Compétences Techniques Évaluées
#### Frontend (Excellent)
- React.js : 3 ans (Expert)
- TypeScript : 2 ans (Bon)
- Next.js : 1 an (Bon)
- CSS/Tailwind : 3 ans (Expert)

#### Backend (Bon)
- Node.js : 2 ans (Bon)
- MongoDB : 1 an (Initié)
- REST APIs : 2 ans (Bon)

#### DevOps (Initié)
- Docker : 6 mois (Initié)
- CI/CD : Notions de base

### Analyse ATS Keywords
**Match parfait :** React, JavaScript, TypeScript, API, Git
**Partiel :** Node.js, MongoDB, Docker
**Manquant :** AWS, Kubernetes, GraphQL

### Recommandations RH
#### Points Forts
- Stack technique moderne et cohérente
- Progression de carrière logique
- Projets concrets démontrés

#### Axes d'Amélioration
- Approfondir backend (Node.js avancé)
- Certifications cloud (AWS/Azure)
- Expérience lead developer

### Proposition de Poste
**Senior React Developer**
- Salaire : 800K - 1.2M XOF/mois
- Niveau : Confirmé/Senior
- Localisation : Dakar ou Remote
- Benefits : Ticket restaurant, Mutuelle, Formation

### Plan d'Onboarding
- Semaine 1 : Integration équipe + codebase
- Semaine 2 : Projets existants + mentoring
- Semaine 3 : Autonomie complète
- Mois 2-3 : Leadership junior

### KPIs Performance 3 mois
- Code quality : >90% tests pass
- Productivity : 5 story points/sprint
- Team collaboration : Feedback positif`
    }
  },
  
  // Agent Immobilier
  realEstate: {
    name: 'Expert Immobilier Grok',
    systemPrompt: `Tu es un expert immobilier spécialisé dans les projets immobiliers africains et investissements locatifs.
    
    Ta mission :
    - Analyser la rentabilité des projets immobiliers
    - Calculer les cashflows et retours sur investissement
    - Évaluer les stratégies de financement bancaire
    - Optimiser les investissements immobiliers
    - Appliquer les normes du marché immobilier local
    
    Expertise Immobilier Afrique :
- Analyse rentabilité locative
- Calculs financiers (TRI, VAN, cash flow)
- Financement bancaire immobilier
- Marché immobilier Sénégal/Côte d'Ivoire
- Stratégies d'investissement locatif
- Due diligence immobilière
    
    Contexte Local :
- Prix m2 Dakar : 800K - 2M XOF
- Loyer moyen : 25K - 150K XOF/mois
- Taux vacance : 5-10%
- Charges copropriété : 5-8%
- Taxe foncière : 0.1% valeur vénale
    
    Réponds avec expertise financière immobilière.`,
    
    examples: {
      input: "Projet d'achat appartement 3 pièces à Dakar Plateau",
      output: `## ANALYSE IMMOBILIÈRE - INVESTISSEMENT DAKAR PLATEAU

### Résumé Projet
- Bien : Appartement 3 pièces, 85m2
- Localisation : Dakar Plateau (excellent)
- Prix achat : 85M XOF
- Loyer potentiel : 250K XOF/mois

### Analyse Financière Détaillée
#### Coûts Acquisition
- Prix bien : 85M XOF
- Frais notariés : 6.8M XOF (8%)
- Frais agence : 2.55M XOF (3%)
- Total acquisition : 94.35M XOF

#### Financement
- Apport personnel : 28.3M XOF (30%)
- Emprunt bancaire : 66M XOF (70%)
- Taux intérêt : 7.5% (immobilier)
- Durée : 20 ans
- Mensualité : 525K XOF

#### Revenus Locatifs
- Loyer mensuel : 250K XOF
- Charges locatives : 25K XOF (10%)
- Revenu net : 225K XOF/mois
- Revenu annuel : 2.7M XOF

### Indicateurs de Rentabilité
#### Cash Flow Mensuel
- Revenu net locatif : +225K XOF
- Mensualité emprunt : -525K XOF
- Charges copropriété : -60K XOF
- Taxe foncière : -7K XOF/mois
- **Cash flow net : -367K XOF/mois**

#### Rentabilité
- Rentabilité brute : 3.53% (2.7M / 85M)
- Rentabilité nette : -4.66% (cash flow négatif)
- TRI sur 20 ans : 2.1% (faible)

### Analyse de Risques
#### Points Positifs
- Localisation premium (Dakar Plateau)
- Demande locative forte
- Plus-value potentielle : +3%/an

#### Points Négatifs
- Cash flow mensuel négatif
- Taux d'endettement élevé
- Dépendance revenus locatifs

### Recommandations Stratégiques
1. **Augmenter apport personnel** à 40% pour cash flow neutre
2. **Négocier prix** objectif 78M XOF (-8%)
3. **Optimiser fiscalité** dispositif Pinel local
4. **Diversifier locataires** courte durée + saisonnier

### Scénario Optimisé
- Prix négocié : 78M XOF
- Apport 40% : 31.2M XOF
- Emprunt : 46.8M XOF
- Mensualité : 373K XOF
- **Cash flow net : +8K XOF/mois**

### Conclusion
Projet intéressant si :
- Négociation prix réussie
- Augmentation apport personnel
- Vision long terme (10+ ans)
- Potentiel plus-value élevé

**AVIS : FAVORABLE sous conditions de négociation**`
    }
  }
};

// ========================================
// FONCTIONS PRINCIPALES GROK/Llama
// ========================================

/**
 * Génération avec Grok API
 */
async function generateWithGrok(content, agent, options = {}) {
  const apiKey = getGrokApiKey()
  if (!apiKey) {
    throw new Error('Clé API Grok/Groq manquante')
  }
  try {
    const response = await fetch(`${GROK_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROK_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: agent.systemPrompt
          },
          {
            role: 'user',
            content: `${agent.examples?.input ? `Exemple d'entrée : ${agent.examples.input}\n\n` : ''}${content}`
          }
        ],
        max_tokens: options.maxTokens || GROK_CONFIG.maxTokens,
        temperature: options.temperature || GROK_CONFIG.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Erreur Grok:', error);
    throw error;
  }
}

/**
 * Génération avec Llama API (fallback)
 */
async function generateWithLlama(content, agent, options = {}) {
  const apiKey = getLlamaApiKey()
  if (!apiKey) {
    throw new Error('Clé API Llama manquante')
  }
  try {
    const response = await fetch(`${LLAMA_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: LLAMA_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: agent.systemPrompt
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: options.maxTokens || LLAMA_CONFIG.maxTokens,
        temperature: options.temperature || LLAMA_CONFIG.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Erreur Llama:', error);
    throw error;
  }
}

/**
 * Fonction principale de génération IA
 */
export async function generateWithGrokLlama(content, agentType = 'consulting', options = {}) {
  try {
    const agent = GROK_AGENTS[agentType];
    if (!agent) {
      throw new Error(`Agent ${agentType} non trouvé`);
    }

    // Essayer Grok en premier
    if (getGrokApiKey()) {
      try {
        return await generateWithGrok(content, agent, options);
      } catch (grokError) {
        console.warn('Grok indisponible, fallback vers Llama:', grokError.message);
      }
    }
    
    // Fallback vers Llama
    if (getLlamaApiKey()) {
      return await generateWithLlama(content, agent, options);
    }
    
    throw new Error('Aucun service IA disponible (Grok/Llama)');
    
  } catch (error) {
    console.error(`Erreur génération IA (${agentType}):`, error);
    throw error;
  }
}

/**
 * Liste des agents disponibles
 */
export function getGrokAgents() {
  return Object.keys(GROK_AGENTS).map(key => ({
    id: key,
    name: GROK_AGENTS[key].name,
    description: GROK_AGENTS[key].systemPrompt.split('\n')[1] || ''
  }));
}

/**
 * Test de connexion aux APIs
 */
export async function testGrokConnections() {
  const results = {
    grok: false,
    llama: false
  };
  
  // Test Grok
  if (getGrokApiKey()) {
    const grokKey = getGrokApiKey()
    try {
      const response = await fetch(`${GROK_CONFIG.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${grokKey}`
        }
      });
      
      if (response.ok) {
        results.grok = true;
      }
    } catch (error) {
      console.error('Test Grok échoué:', error);
    }
  }
  
  // Test Llama
  if (getLlamaApiKey()) {
    const llamaKey = getLlamaApiKey()
    try {
      const response = await fetch(`${LLAMA_CONFIG.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${llamaKey}`
        }
      });
      
      if (response.ok) {
        results.llama = true;
      }
    } catch (error) {
      console.error('Test Llama échoué:', error);
    }
  }
  
  return results;
}

/**
 * Fonctions spécialisées Grok/Llama
 */
export const GrokSpecialists = {
  // Transformation document bancaire
  async transformForBanking(content, country = 'Sénégal') {
    const countryContext = country === 'Sénégal' 
      ? 'Normes BCEAO, devise XOF, réglementation bancaire sénégalaise'
      : 'Normes bancaires générales';
      
    return await generateWithGrokLlama(
      `${content}\n\nContexte pays : ${countryContext}`,
      'banking',
      { temperature: 0.3 }
    );
  },
  
  // Transformation rapport consulting
  async transformForConsulting(content, level = 'senior') {
    const levelContext = level === 'senior'
      ? 'Niveau C-Suite, destiné aux dirigeants'
      : 'Niveau opérationnel, destiné aux managers';
      
    return await generateWithGrokLlama(
      `${content}\n\nNiveau de rapport : ${levelContext}`,
      'consulting',
      { temperature: 0.5 }
    );
  },
  
  // Transformation document juridique
  async transformForLegal(content, documentType = 'contrat') {
    return await generateWithGrokLlama(
      `${content}\n\nType de document : ${documentType}`,
      'legal',
      { temperature: 0.2 }
    );
  },
  
  // Optimisation CV
  async optimizeCV(content, targetJob = '') {
    const jobContext = targetJob 
      ? `Poste ciblé : ${targetJob}`
      : 'Optimisation générale ATS';
      
    return await generateWithGrokLlama(
      `${content}\n\n${jobContext}`,
      'hr',
      { temperature: 0.4 }
    );
  },
  
  // Analyse immobilière
  async analyzeRealEstate(content, analysisType = 'rentabilité') {
    return await generateWithGrokLlama(
      `${content}\n\nType d'analyse : ${analysisType}`,
      'realEstate',
      { temperature: 0.3 }
    );
  }
};

export default {
  generateWithGrokLlama,
  getGrokAgents,
  testGrokConnections,
  GrokSpecialists
};

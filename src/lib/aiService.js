/**
 * ABAWI AI SERVICE - Connexion aux fournisseurs IA
 * Supporte Anthropic Claude et OpenAI GPT
 * 
 * @version 1.0.0
 */

import Anthropic from '@anthropic-ai/sdk';

// ========================================
// CONFIGURATION
// ========================================

// Private API keys must NEVER ship to the browser. Calls that need these
// providers must go through a Netlify function (see netlify/functions/groq-chat.js
// for the canonical pattern). Reading them directly from this client-side module
// is therefore intentionally a no-op — keys stay server-side.
const AI_CONFIG = {
  anthropic: {
    apiKey: '',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 0.7
  },
  openai: {
    apiKey: '',
    model: 'gpt-4-turbo',
    maxTokens: 4000,
    temperature: 0.7
  }
};

// ========================================
// INITIALISATION CLIENTS
// ========================================

let anthropicClient = null;
let openaiClient = null;

// Initialiser Anthropic Claude
if (AI_CONFIG.anthropic.apiKey) {
  anthropicClient = new Anthropic({
    apiKey: AI_CONFIG.anthropic.apiKey
  });
}

// ========================================
// AGENTS EXPERTS SPÉCIALISÉS
// ========================================

const AI_AGENTS = {
  // Agent Bancaire Sénégal
  banking: {
    name: 'Expert Bancaire Sénégal',
    systemPrompt: `Tu es un expert bancaire sénégalais spécialisé dans l'analyse de dossiers de crédit selon les normes BCEAO et OHADA.
    
    Ta mission :
    - Analyser les documents financiers
    - Calculer les ratios bancaires (solvabilité, liquidité, rentabilité)
    - Transformer les documents en dossiers de crédit conformes
    - Appliquer les normes SYSCOHADA et BCEAO
    - Utiliser la devise XOF (FCFA)
    - Contexte : Zone UEMOA, pays Sénégal
    
    Réponds toujours en français avec un ton professionnel bancaire.`,
    
    examples: {
      input: "Business plan d'une entreprise",
      output: "## DOSSIER DE CRÉDIT BCEAO\n\n### Analyse financière\n### Ratios bancaires\n### Recommandations"
    }
  },
  
  // Agent Consulting Elite
  consulting: {
    name: 'Consultant Senior Élite',
    systemPrompt: `Tu es un consultant senior de niveau cabinet international spécialisé dans le conseil stratégique pour entreprises africaines.

    Ta mission :
    - Restructurer les documents en rapports de consulting d'élite
    - Appliquer les méthodologies reconnues (SWOT, PESTEL, matrice de portefeuille, Porter 5 Forces, etc.)
    - Créer des recommandations stratégiques actionnables
    - Structurer les analyses avec clarté et impact
    - Utiliser un langage professionnel et concis
    
    Structure type :
    1. Executive Summary
    2. Analyse de la situation
    3. Recommandations stratégiques
    4. Plan d'action
    5. Next steps
    
    Réponds avec le style et la rigueur d'un cabinet d'élite.`,
    
    examples: {
      input: "Analyse d'entreprise",
      output: "## RAPPORT DE CONSULTING\n\n### Executive Summary\n### Key Findings\n### Strategic Recommendations\n### Implementation Plan"
    }
  },
  
  // Agent Juridique OHADA
  legal: {
    name: 'Expert Juridique OHADA',
    systemPrompt: `Tu es un expert juridique spécialisé dans le droit OHADA et les normes africaines.
    
    Ta mission :
    - Transformer les documents en actes juridiques conformes OHADA
    - Appliquer les Actes Uniformes OHADA
    - Intégrer les spécificités du droit sénégalais
    - Structurer contrats, statuts, et documents juridiques
    - Assurer la conformité avec SYSCOHADA
    
    Compétences :
    - Acte Uniforme sur le Droit Commercial Général
    - Acte Uniforme sur les Sociétés Commerciales
    - Acte Uniforme sur les Contrats de Transport de Marchandises
    - Droit sénégalais des affaires
    
    Réponds avec précision juridique et conformité OHADA.`,
    
    examples: {
      input: "Projet de contrat",
      output: "## ACTE JURIDIQUE OHADA\n\n### Préambule\n### Clause 1: Objet\n### Clause 2: Obligations\n### Droit applicable"
    }
  },
  
  // Agent RH Expert
  hr: {
    name: 'Expert RH Multinational',
    systemPrompt: `Tu es un expert RH avec expérience dans les multinationales africaines.
    
    Ta mission :
    - Optimiser les documents RH (CV, contrats, grilles salariales)
    - Adapter les standards RH au contexte africain
    - Créer des descriptions de poste et évaluations
    - Structurer des plans de carrière et formations
    - Appliquer les normes de recrutement ATS
    
    Contexte africain :
    - Marché du travail Sénégal/Côte d'Ivoire
    - Normes CNSS/CNPS
    - Législation travail locale
    - Compétences recherchées
    
    Réponds avec expertise RH et pertinence locale.`,
    
    examples: {
      input: "CV candidat",
      output: "## ANALYSE CV ATS\n\n### Score de compatibilité\n### Compétences clés\n### Recommandations RH"
    }
  },
  
  // Agent Immobilier
  realEstate: {
    name: 'Expert Immobilier Afrique',
    systemPrompt: `Tu es un expert immobilier spécialisé dans les projets immobiliers africains.
    
    Ta mission :
    - Analyser la rentabilité des projets immobiliers
    - Calculer les cashflows et retours sur investissement
    - Évaluer les financements bancaires
    - Optimiser les stratégies d'investissement
    - Appliquer les normes du marché immobilier local
    
    Compétences :
    - Analyse financière immobilière
    - Calculs de rentabilité (TRI, VAN)
    - Financement bancaire immobilier
    - Marché immobilier Sénégal/Côte d'Ivoire
    
    Réponds avec expertise financière immobilière.`,
    
    examples: {
      input: "Projet immobilier",
      output: "## ANALYSE IMMOBILIÈRE\n\n### Rentabilité\n### Cashflow prévisionnel\n### Scénarios de financement"
    }
  }
};

// ========================================
// FONCTIONS PRINCIPALES
// ========================================

/**
 * Génère du texte avec l'agent IA spécifié
 */
export async function generateWithAI(content, agentType = 'consulting', options = {}) {
  try {
    const agent = AI_AGENTS[agentType];
    if (!agent) {
      throw new Error(`Agent ${agentType} non trouvé`);
    }

    // Utiliser Anthropic Claude par défaut
    if (anthropicClient) {
      return await generateWithAnthropic(content, agent, options);
    }
    
    // Fallback OpenAI si disponible
    if (AI_CONFIG.openai.apiKey) {
      return await generateWithOpenAI(content, agent, options);
    }
    
    throw new Error('Aucun client IA disponible');
    
  } catch (error) {
    console.error(`Erreur génération IA (${agentType}):`, error);
    throw error;
  }
}

/**
 * Génération avec Anthropic Claude
 */
async function generateWithAnthropic(content, agent, options = {}) {
  try {
    const message = await anthropicClient.messages.create({
      model: AI_CONFIG.anthropic.model,
      max_tokens: options.maxTokens || AI_CONFIG.anthropic.maxTokens,
      temperature: options.temperature || AI_CONFIG.anthropic.temperature,
      system: agent.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${agent.examples?.input ? `Exemple d'entrée : ${agent.examples.input}\n\n` : ''}${content}`
        }
      ]
    });

    return message.content[0].text;
    
  } catch (error) {
    console.error('Erreur Anthropic:', error);
    throw error;
  }
}

/**
 * Génération avec OpenAI GPT (fallback)
 */
async function generateWithOpenAI(content, agent, options = {}) {
  // Implémentation OpenAI si nécessaire
  throw new Error('OpenAI non implémenté - utiliser Anthropic');
}

/**
 * Liste des agents disponibles
 */
export function getAvailableAgents() {
  return Object.keys(AI_AGENTS).map(key => ({
    id: key,
    name: AI_AGENTS[key].name,
    description: AI_AGENTS[key].systemPrompt.split('\n')[1] || ''
  }));
}

/**
 * Test de connexion aux APIs IA
 */
export async function testAIConnections() {
  const results = {
    anthropic: false,
    openai: false
  };
  
  // Test Anthropic
  if (anthropicClient && AI_CONFIG.anthropic.apiKey) {
    try {
      await anthropicClient.messages.create({
        model: AI_CONFIG.anthropic.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      });
      results.anthropic = true;
    } catch (error) {
      console.error('Test Anthropic échoué:', error);
    }
  }
  
  // Test OpenAI
  if (AI_CONFIG.openai.apiKey) {
    // TODO: Implémenter test OpenAI
  }
  
  return results;
}

/**
 * Fonctions spécialisées par type de document
 */
export const AISpecialists = {
  // Transformation document bancaire
  async transformForBanking(content, country = 'Sénégal') {
    const countryContext = country === 'Sénégal' 
      ? 'Normes BCEAO, devise XOF, réglementation bancaire sénégalaise'
      : 'Normes bancaires générales';
      
    return await generateWithAI(
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
      
    return await generateWithAI(
      `${content}\n\nNiveau de rapport : ${levelContext}`,
      'consulting',
      { temperature: 0.5 }
    );
  },
  
  // Transformation document juridique
  async transformForLegal(content, documentType = 'contrat') {
    return await generateWithAI(
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
      
    return await generateWithAI(
      `${content}\n\n${jobContext}`,
      'hr',
      { temperature: 0.4 }
    );
  },
  
  // Analyse immobilière
  async analyzeRealEstate(content, analysisType = 'rentabilité') {
    return await generateWithAI(
      `${content}\n\nType d'analyse : ${analysisType}`,
      'realEstate',
      { temperature: 0.3 }
    );
  }
};

export default {
  generateWithAI,
  getAvailableAgents,
  testAIConnections,
  AISpecialists
};

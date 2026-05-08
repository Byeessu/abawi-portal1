/**
 * Générateur IA Simplifié ABAWI
 * Solution directe et sans complexité pour la génération IA
 */

// Configuration via variables d'environnement — pas de clé hardcodée
const API_CONFIG = {
  key: import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || '',
  baseURL: import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
}

/**
 * Appel API simple et direct
 */
async function callAISimple(prompt, maxTokens = 2000) {
  try {
    console.log('Génération IA en cours...')
    
    const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.key}`
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        temperature: 0.7,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert ABAWI IA. Tu réponds de manière professionnelle, structurée et en français.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    const result = data?.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('Génération IA terminée avec succès')
    return result
    
  } catch (error) {
    console.error('Erreur lors de la génération IA:', error)
    throw new Error(`Échec de la génération: ${error.message}`)
  }
}

/**
 * Générateur de Business Plan simplifié
 */
export async function generateBusinessPlanSimple(formData) {
  const prompt = `
Génère un business plan complet et professionnel pour:
- Entreprise: ${formData.nom || 'Nom à définir'}
- Secteur: ${formData.secteur || 'Non spécifié'}
- Pays: ${formData.pays || 'Afrique'}
- Produit/Service: ${formData.produit || 'Non spécifié'}
- Marché cible: ${formData.cible || 'Non spécifié'}
- Investissement: ${formData.investissement || 'Non spécifié'}

Structure ta réponse en sections claires:
1. Résumé Exécutif
2. Analyse de l'Entreprise
3. Étude de Marché
4. Proposition de Valeur
5. Modèle Économique
6. Stratégie Go-To-Market
7. Plan Opérationnel
8. Projections Financières
9. Analyse des Risques

Sois précis, professionnel et adapté au contexte africain.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Générateur de contenu générique
 */
export async function generateContentSimple(prompt, maxTokens = 2000) {
  return await callAISimple(prompt, maxTokens)
}

/**
 * Générateur Finance Elite
 */
export async function generateFinanceSimple(formData) {
  const prompt = `
Génère une analyse financière complète et professionnelle pour:
- Entreprise: ${formData.nom || 'Nom à définir'}
- Secteur: ${formData.secteur || 'Non spécifié'}
- Revenus annuels: ${formData.revenus || 'Non spécifié'}
- Charges annuelles: ${formData.charges || 'Non spécifié'}

Structure ta réponse en sections claires:
1. Résumé Exécutif Financier
2. Analyse des Comptes de Résultat
3. Analyse du Bilan
4. Ratios Financiers Clés
5. Analyse de Rentabilité
6. Recommandations Stratégiques
7. Projections et Prévisions

Sois précis, professionnel et adapté au contexte africain.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Générateur Consultant Elite
 */
export async function generateConsultantSimple(formData) {
  const prompt = `
Génère une proposition commerciale complète et professionnelle pour:
- Client: ${formData.client || 'Client à définir'}
- Projet: ${formData.projet || 'Non spécifié'}
- Secteur: ${formData.secteur || 'Non spécifié'}
- Budget: ${formData.budget || 'Non spécifié'}
- Durée: ${formData.duree || 'Non spécifié'}

Structure ta réponse en sections claires:
1. Résumé Exécutif
2. Compréhension du Besoin Client
3. Approche Méthodologique
4. Livrables et Résultats Attendus
5. Planning et Calendrier
6. Équipe Consultante
7. Coûts et Modalités
8. Valeur Ajoutée

Sois précis, professionnel et persuasif.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Générateur Comptable Elite
 */
export async function generateComptableSimple(formData) {
  const prompt = `
Génère une analyse comptable complète et professionnelle pour:
- Entreprise: ${formData.nom || 'Nom à définir'}
- Type d'analyse: ${formData.type || 'Audit comptable'}
- Période: ${formData.periode || 'Année en cours'}
- Réglementation: ${formData.reglementation || 'OHADA'}

Structure ta réponse en sections claires:
1. Résumé Exécutif Comptable
2. Analyse des Écritures Comptables
3. Vérification de la Conformité
4. Analyse des Soldes Intermédiaires
5. Recommandations d'Ajustement
6. Rapport d'Audit
7. Conclusions et Recommandations

Sois précis, professionnel et conforme aux normes OHADA.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Générateur RH Elite
 */
export async function generateRHSimple(formData) {
  const prompt = `
Génère une analyse RH complète et professionnelle pour:
- Entreprise: ${formData.nom || 'Nom à définir'}
- Effectif: ${formData.effectif || 'Non spécifié'}
- Secteur: ${formData.secteur || 'Non spécifié'}
- Type de document: ${formData.type || 'Analyse RH'}

Structure ta réponse en sections claires:
1. Résumé Exécutif RH
2. Analyse de l'Effectif Actuel
3. Politiques RH en Place
4. Analyse des Compétences
5. Recommandations Stratégiques
6. Plan de Développement
7. Indicateurs de Performance

Sois précis, professionnel et adapté au contexte africain.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Générateur Immobilier Elite
 */
export async function generateImmobilierSimple(formData) {
  const prompt = `
Génère une analyse immobilière complète et professionnelle pour:
- Type de bien: ${formData.type || 'Non spécifié'}
- Localisation: ${formData.localisation || 'Non spécifié'}
- Budget: ${formData.budget || 'Non spécifié'}
- Objectif: ${formData.objectif || 'Investissement'}

Structure ta réponse en sections claires:
1. Résumé Exécutif Immobilier
2. Analyse du Marché Local
3. Évaluation du Bien
4. Analyse de Rentabilité
5. Étude de Faisabilité
6. Recommandations d'Investissement
7. Projections Financières

Sois précis, professionnel et adapté au marché immobilier africain.
`

  return await callAISimple(prompt, 4000)
}

/**
 * Test de connexion API
 */
export async function testAPIConnection() {
  try {
    const result = await callAISimple('Dis simplement "API fonctionne"', 50)
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export default {
  generateBusinessPlanSimple,
  generateContentSimple,
  testAPIConnection
}

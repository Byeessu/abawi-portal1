// Version 3 du client API pour le Studio Logo IA avec 3 moteurs renommés et système de suivi
import { generateLogoVariants, downloadAdvancedLogo } from './advancedLogoGenerator'

// Système de suivi des générations
class GenerationTracker {
  constructor() {
    this.generations = this.loadFromStorage()
  }

  loadFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return []
      }
      const stored = localStorage.getItem('studio-logo-generations')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  saveToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      localStorage.setItem('studio-logo-generations', JSON.stringify(this.generations))
    } catch (error) {
      console.warn('Impossible de sauvegarder l\'historique:', error)
    }
  }

  addGeneration(type, engine, formData, result) {
    const generation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type, // 'logo' ou 'offer'
      engine, // 'creative', 'efficient', 'balanced'
      formData: {
        nomEntreprise: formData.nomEntreprise,
        stylePrefere: formData.stylePrefere,
        secteur: formData.secteur
      },
      result: {
        success: result.success,
        provider: result.provider,
        logosCount: result.logos?.length || 0
      },
      duration: result.duration || 0
    }

    this.generations.unshift(generation)
    
    // Garder seulement les 50 dernières générations
    if (this.generations.length > 50) {
      this.generations = this.generations.slice(0, 50)
    }

    this.saveToStorage()
    return generation
  }

  getGenerations() {
    return this.generations
  }

  getStats() {
    const stats = {
      total: this.generations.length,
      byEngine: {
        creative: 0,
        efficient: 0,
        balanced: 0
      },
      byType: {
        logo: 0,
        offer: 0
      },
      successRate: 0
    }

    this.generations.forEach(gen => {
      stats.byEngine[gen.engine]++
      stats.byType[gen.type]++
      if (gen.result.success) stats.successRate++
    })

    stats.successRate = this.generations.length > 0 
      ? Math.round((stats.successRate / this.generations.length) * 100)
      : 0

    return stats
  }
}

const tracker = new GenerationTracker()

// Fonction pour générer des logos avec 3 moteurs renommés
export async function generateLogosV3(formData, engine = 'creative') {
  console.log(`🚀 Génération logos - Moteur: ${getEngineName(engine)}`)
  console.log('📝 Données:', formData)
  
  const startTime = Date.now()
  
  try {
    let response
    
    switch (engine) {
      case 'creative':
        response = await generateLogosCreative(formData)
        break
      case 'efficient':
        response = await generateLogosEfficient(formData)
        break
      case 'balanced':
        response = await generateLogosBalanced(formData)
        break
      default:
        throw new Error('Moteur non reconnu')
    }
    
    const duration = Date.now() - startTime
    response.duration = duration
    
    // Suivre la génération
    tracker.addGeneration('logo', engine, formData, response)
    
    console.log(`✅ Génération terminée en ${duration}ms`)
    return response
    
  } catch (error) {
    console.error('❌ Erreur génération logo:', error)
    
    // Suivre même les échecs
    const failedResponse = {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }
    tracker.addGeneration('logo', engine, formData, failedResponse)
    
    // Fallback local
    return generateLogosFallback(formData)
  }
}

// Fonctions pour chaque moteur
async function generateLogosCreative(formData) {
  try {
    const { callClaude } = await import('./claudeClient')
    
    const prompt = buildCreativeLogoPrompt(formData)
    
    const response = await callClaude(prompt, {
      maxTokens: 4000,
      temperature: 0.9,
      model: 'claude-3-sonnet-20240229'
    })
    
    const logos = parseLogoResponse(response)
    
    return {
      success: true,
      logos: logos.map((logo, index) => ({
        ...logo,
        id: index + 1,
        generatedAt: new Date().toISOString(),
        provider: 'creative'
      }))
    }
    
  } catch (error) {
    console.error('Erreur moteur créatif:', error)
    throw error
  }
}

async function generateLogosEfficient(formData) {
  try {
    // Utiliser Groq pour le mode efficace
    const response = await fetch('/.netlify/functions/logo-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      data.provider = 'efficient'
      return data
    } else {
      throw new Error(data.error || 'Échec génération')
    }
    
  } catch (error) {
    console.error('Erreur moteur efficace:', error)
    throw error
  }
}

async function generateLogosBalanced(formData) {
  try {
    // Utiliser OpenAI pour le mode équilibré
    const response = await fetch('/.netlify/functions/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `Tu es un DESIGNER PROFESSIONNEL spécialisé en branding corporate. Génère 4 logos EXCEPTIONNELS pour l'entreprise "${formData.nomEntreprise}".

CONTEXTE PROFESSIONNEL:
- Entreprise: ${formData.nomEntreprise}
- Secteur: ${formData.secteur || 'général'}
- Style: ${formData.stylePrefere}
- Couleurs: ${formData.couleurPrimaire} et ${formData.couleurSecondaire}
- Valeurs: ${formData.valeurs || 'excellence'}
- Public: ${formData.publicCible || 'professionnels'}

STANDARD QUALITÉ EXIGÉ:
- Innovation visuelle forte
- Symbolisme pertinent et mémorable
- Scalabilité parfaite
- Différenciation concurrentielle
- Impact émotionnel mesurable

FORMAT JSON UNIQUEMENT:
{
  "logos": [
    {
      "id": 1,
      "name": "nom professionnel du logo",
      "style": "style précis",
      "primaryColor": "#HEX",
      "secondaryColor": "#HEX",
      "icon": "emoji",
      "preview": "texte court",
      "description": "description professionnelle détaillée (40-60 mots)",
      "symbolism": "symbolisme pertinent (25-40 mots)",
      "uniquenessScore": 8,
      "fontCategory": "typographie",
      "layout": "layout",
      "marketPositioning": "positionnement marché",
      "brandPromise": "promesse marque"
    }
  ]
}

CRÉE 4 LOGOS PROFESSIONNELS DISTINCTS !`
          },
          {
            role: 'user',
            content: `GÉNÈRE 4 LOGOS pour: ${formData.nomEntreprise} (${formData.secteur || 'général'}) - Style: ${formData.stylePrefere} - Couleurs: ${formData.couleurPrimaire}/${formData.couleurSecondaire}`
          }
        ],
        options: {
          maxTokens: 3000,
          temperature: 0.7,
          model: 'gpt-4-turbo-preview'
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const logos = parseLogoResponse(data.content)
    
    return {
      success: true,
      logos: logos.map((logo, index) => ({
        ...logo,
        id: index + 1,
        generatedAt: new Date().toISOString(),
        provider: 'balanced'
      }))
    }
    
  } catch (error) {
    console.error('Erreur moteur équilibré:', error)
    throw error
  }
}

// Prompts pour chaque moteur
function buildCreativeLogoPrompt(formData) {
  return `Tu es un DIRECTEUR ARTISTIQUE EXPERT avec 20 ans d'expérience en branding international. Crée 4 logos EXTRAORDINAIRES pour l'entreprise "${formData.nomEntreprise}" dans le secteur "${formData.secteur || 'général'}".

CONTEXTE CRÉATIF:
- Entreprise: ${formData.nomEntreprise}
- Secteur: ${formData.secteur || 'général'}
- Style demandé: ${formData.stylePrefere}
- Palette: ${formData.couleurPrimaire} (primaire) et ${formData.couleurSecondaire} (secondaire)
- Valeurs: ${formData.valeurs || 'excellence et innovation'}
- Public cible: ${formData.publicCible || 'professionnels modernes'}

EXIGENCE CRÉATIVE ABSOLUE:
- Pense COMME un artiste, pas comme une IA
- Chaque logo doit raconter une histoire unique
- Symbolisme profond et multicouche
- Innovation conceptuelle forte
- Mémorabilité instantanée
- Différenciation radicale de la concurrence

FORMAT JSON EXIGÉ (UNIQUEMENT):
{
  "logos": [
    {
      "id": 1,
      "name": "NOM CRÉATIF DU LOGO",
      "style": "style artistique précis",
      "primaryColor": "#HEX",
      "secondaryColor": "#HEX", 
      "icon": "emoji",
      "preview": "texte court",
      "description": "DESCRIPTION DÉTAILLÉE (50-80 mots) expliquant le concept, l'inspiration, l'émotion visée",
      "symbolism": "SYMBOLISME PROFOND (30-50 mots) avec significations multiples",
      "uniquenessScore": 9,
      "fontCategory": "typographie précise",
      "layout": "layout spécifique",
      "conceptOrigin": "origine du concept (culture, nature, technologie...)",
      "emotionalImpact": "impact émotionnel recherché",
      "scalability": "analyse de la scalabilité du design"
    }
  ]
}

CRÉE 4 LOGOS VRAIMENT UNIQUES avec des concepts différents !`
}

// Parsing robuste
function parseLogoResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Pas de JSON trouvé')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    if (!parsed.logos || !Array.isArray(parsed.logos)) {
      throw new Error('Structure invalide')
    }
    
    return parsed.logos.map((logo, index) => ({
      id: index + 1,
      name: logo.name || 'LOGO',
      style: logo.style || 'modern',
      primaryColor: logo.primaryColor || '#1E40AF',
      secondaryColor: logo.secondaryColor || '#DC2626',
      icon: logo.icon || '🎨',
      preview: logo.preview || 'L',
      description: logo.description || 'Design professionnel',
      symbolism: logo.symbolism || 'identité visuelle',
      uniquenessScore: logo.uniquenessScore || 7,
      fontCategory: logo.fontCategory || 'sans-serif',
      layout: logo.layout || 'horizontal'
    }))
    
  } catch (error) {
    console.warn('Parsing échoué:', error)
    throw error
  }
}

// Fallback local avec générateur avancé
function generateLogosFallback(formData) {
  console.log('🏠 Génération locale avec générateur avancé')
  
  const { nomEntreprise, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  // Utiliser le générateur avancé pour créer de vrais designs SVG
  const advancedLogos = generateLogoVariants({
    name: nomEntreprise || 'LOGO',
    primaryColor: couleurPrimaire || '#1E40AF',
    secondaryColor: couleurSecondaire || '#DC2626',
    style: stylePrefere || 'modern'
  }, 4)
  
  return {
    success: true,
    logos: advancedLogos.map(logo => ({
      ...logo,
      generatedAt: new Date().toISOString(),
      provider: 'local-fallback-advanced'
    })),
    fallback: true,
    message: 'Génération locale avec designs SVG avancés'
  }
}

// Génération d'offre avec 3 moteurs
export async function generateBrandOfferV3(formData, selectedLogo, engine = 'creative') {
  console.log('🎯 Génération offre complète - Moteur:', getEngineName(engine))
  
  const startTime = Date.now()
  
  try {
    let offer
    
    switch (engine) {
      case 'creative':
        offer = await generateBrandOfferCreative(formData, selectedLogo)
        break
      case 'efficient':
        offer = await generateBrandOfferEfficient(formData, selectedLogo)
        break
      case 'balanced':
        offer = await generateBrandOfferBalanced(formData, selectedLogo)
        break
      default:
        throw new Error('Moteur non reconnu')
    }
    
    const duration = Date.now() - startTime
    offer.duration = duration
    
    // Suivre la génération
    tracker.addGeneration('offer', engine, formData, offer)
    
    return offer
    
  } catch (error) {
    console.error('Erreur génération offre:', error)
    return generateBrandOfferFallback(formData, selectedLogo)
  }
}

// Fonctions pour chaque moteur d'offre
async function generateBrandOfferCreative(formData, selectedLogo) {
  try {
    const { callClaude } = await import('./claudeClient')
    
    const prompt = buildCreativeOfferPrompt(formData, selectedLogo)
    
    const response = await callClaude(prompt, {
      maxTokens: 4000,
      temperature: 0.9,
      model: 'claude-3-sonnet-20240229'
    })
    
    const offer = parseOfferResponse(response)
    
    return {
      success: true,
      ...offer,
      provider: 'creative'
    }
    
  } catch (error) {
    console.error('Erreur offre créative:', error)
    throw error
  }
}

async function generateBrandOfferEfficient(formData, selectedLogo) {
  // Version simplifiée et rapide
  return generateBrandOfferFallback(formData, selectedLogo)
}

async function generateBrandOfferBalanced(formData, selectedLogo) {
  // Version équilibrée avec OpenAI
  try {
    const response = await fetch('/.netlify/functions/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `Génère une offre de branding équilibrée.

STYLE RÉDACTIONNEL:
- Utiliser des numéros au lieu des puces
- Mettre les TITRES en MAJUSCULES
- Le corps reste en minuscules normal
- Format professionnel et équilibré

Réponds UNIQUEMENT avec un JSON valide contenant: project, variants, applications, guidelines.`
          },
          {
            role: 'user',
            content: `Entreprise: ${formData.nomEntreprise}, Secteur: ${formData.secteur}, Logo: ${JSON.stringify(selectedLogo)}`
          }
        ],
        options: {
          maxTokens: 3000,
          temperature: 0.7,
          model: 'gpt-4-turbo-preview'
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const offer = parseOfferResponse(data.content)
    
    return {
      success: true,
      ...offer,
      provider: 'balanced'
    }
    
  } catch (error) {
    console.error('Erreur offre équilibrée:', error)
    throw error
  }
}

function buildCreativeOfferPrompt(formData, selectedLogo) {
  return `Génère une offre de branding ultra-créative et détaillée pour "${formData.nomEntreprise}".

STYLE CRÉATIF EXIGÉ:
- Concepts innovants et originaux
- Approche créative du branding
- Solutions uniques et mémorables
- Stratégie créative complète

FORMAT RÉDACTIONNEL:
- Utiliser des numéros au lieu des puces
- Mettre les TITRES en MAJUSCULES
- Le corps reste en minuscules normal
- Descriptions créatives et inspirantes

Réponds UNIQUEMENT avec un JSON valide contenant:
{
  "project": {
    "title": "TITRE CRÉATIF",
    "description": "Description innovante",
    "objectives": ["1. Objectif créatif", "2. Autre objectif"],
    "timeline": "Timeline",
    "budget": "Budget"
  },
  "variants": [
    {
      "support": "Support",
      "description": "Description créative",
      "specifications": "Spécifications",
      "colors": ["#1E40AF", "#DC2626"],
      "typography": "Typographie"
    }
  ],
  "applications": [
    {
      "support": "Application",
      "usage": "Usage créatif",
      "format": "Format",
      "notes": "Notes créatives"
    }
  ],
  "guidelines": {
    "do": ["1. Action créative", "2. Autre action"],
    "dont": ["1. Interdiction", "2. Autre interdiction"],
    "colors": {
      "primary": "#1E40AF",
      "secondary": "#DC2626",
      "accent": "#F59E0B"
    },
    "typography": {
      "primary": "Arial",
      "secondary": "Helvetica"
    }
  }
}`
}

function parseOfferResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Pas de JSON trouvé')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.warn('Parsing offre échoué:', error)
    throw error
  }
}

function generateBrandOfferFallback(formData, selectedLogo) {
  return {
    success: true,
    project: {
      title: `PROJET BRANDING - ${formData.nomEntreprise}`,
      description: `Développement complet de l'identité visuelle pour ${formData.nomEntreprise}`,
      objectives: [
        '1. Créer une identité visuelle forte',
        '2. Assurer cohérence sur tous supports',
        '3. Maximiser impact visuel'
      ],
      timeline: '2-3 semaines',
      budget: 'Sur devis'
    },
    variants: [
      {
        support: 'Carte de visite',
        description: 'Version professionnelle du logo',
        specifications: '90x50mm, impression 300dpi',
        colors: [selectedLogo.primaryColor, selectedLogo.secondaryColor],
        typography: selectedLogo.fontCategory || 'sans-serif'
      }
    ],
    applications: [
      {
        support: 'Site web',
        usage: 'Header et favicon',
        format: 'SVG, PNG',
        notes: 'Versions responsive'
      }
    ],
    guidelines: {
      do: [
        '1. Maintenir cohérence des couleurs',
        '2. Respecter espaces de sécurité'
      ],
      dont: [
        '1. Modifier proportions du logo',
        '2. Utiliser couleurs non autorisées'
      ],
      colors: {
        primary: selectedLogo.primaryColor,
        secondary: selectedLogo.secondaryColor,
        accent: '#F59E0B'
      },
      typography: {
        primary: selectedLogo.fontCategory === 'serif' ? 'Georgia' : 'Arial',
        secondary: selectedLogo.fontCategory === 'serif' ? 'Times' : 'Helvetica'
      }
    },
    provider: 'fallback-generated'
  }
}

// Fonctions utilitaires
function getEngineName(engine) {
  const names = {
    creative: '🎨 Mode Créatif',
    efficient: '⚡ Mode Efficace',
    balanced: '🎯 Mode Équilibré'
  }
  return names[engine] || 'Moteur inconnu'
}

// Export du système de suivi
export { tracker }
export function getGenerationStats() {
  return tracker.getStats()
}

export function getGenerationHistory() {
  return tracker.getGenerations()
}

export function clearGenerationHistory() {
  tracker.generations = []
  tracker.saveToStorage()
}

// Fonctions d'historique (compatibilité)
export async function saveLogoToHistory(logo, userId) {
  try {
    // Pour l'instant, on utilise localStorage pour la compatibilité
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    
    const historyKey = `logo-history-${userId}`
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
    
    const historyEntry = {
      id: Date.now(),
      logo: logo,
      userId: userId,
      timestamp: new Date().toISOString()
    }
    
    existingHistory.unshift(historyEntry)
    
    // Garder seulement les 20 derniers logos
    if (existingHistory.length > 20) {
      existingHistory.splice(20)
    }
    
    localStorage.setItem(historyKey, JSON.stringify(existingHistory))
  } catch (error) {
    console.warn('Erreur sauvegarde historique logo:', error)
  }
}

export async function getLogoHistory(userId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return []
    }
    
    const historyKey = `logo-history-${userId}`
    return JSON.parse(localStorage.getItem(historyKey) || '[]')
  } catch (error) {
    console.warn('Erreur chargement historique logo:', error)
    return []
  }
}

// Fonction de téléchargement de logo avec générateur avancé
export async function downloadLogo(logo, format = 'png') {
  try {
    // Utiliser le générateur avancé si le logo a un SVG
    if (logo.svg) {
      return await downloadAdvancedLogo(logo, format)
    }
    
    // Fallback pour les logos sans SVG (ancien format)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Taille du logo
    canvas.width = 400
    canvas.height = 400
    
    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, 400, 400)
    gradient.addColorStop(0, logo.primaryColor || '#1E40AF')
    gradient.addColorStop(1, logo.secondaryColor || '#DC2626')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 400, 400)
    
    // Texte du logo
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(logo.preview || logo.name?.slice(0, 2).toUpperCase() || 'L', 200, 200)
    
    // Télécharger
    const link = document.createElement('a')
    link.download = `${logo.name || 'logo'}-studio.${format}`
    
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png')
    } else if (format === 'svg') {
      // SVG simple
      const svgContent = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${logo.primaryColor || '#1E40AF'}" />
              <stop offset="100%" style="stop-color:${logo.secondaryColor || '#DC2626'}" />
            </linearGradient>
          </defs>
          <rect width="400" height="400" fill="url(#grad)" />
          <text x="200" y="200" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${logo.preview || logo.name?.slice(0, 2).toUpperCase() || 'L'}
          </text>
        </svg>
      `
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      link.href = URL.createObjectURL(blob)
    }
    
    link.click()
    
    return { success: true }
  } catch (error) {
    console.error('Erreur téléchargement logo:', error)
    throw error
  }
}

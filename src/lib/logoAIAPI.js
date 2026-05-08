// Fonction pour générer des logos avec l'IA (mode avancé ou rapide)
export async function generateLogos(formData, useAdvanced = true) {
  console.log(`🚀 Génération de logos - Mode: ${useAdvanced ? 'Avancée' : 'Rapide'}`)
  console.log('📝 Données:', formData)
  
  try {
    let response
    
    if (useAdvanced) {
      console.log('🧠 Utilisation du mode avancé pour génération créative...')
      // Utiliser OpenAI pour le mode avancé
      response = await generateLogosOpenAI(formData)
      console.log('✅ Mode avancé response:', response)
    } else {
      console.log('⚡ Utilisation du mode rapide pour génération efficace...')
      // Utiliser l'endpoint rapide existant
      const fastResponse = await fetch('/.netlify/functions/logo-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!fastResponse.ok) {
        const errorData = await fastResponse.json()
        console.error('❌ Erreur mode rapide:', errorData)
        throw new Error(errorData.error || `Erreur HTTP ${fastResponse.status}`)
      }
      
      response = await fastResponse.json()
      console.log('✅ Mode rapide response:', response)
    }
    
    // Ajouter des métadonnées sur le mode utilisé
    if (response.success) {
      response.provider = useAdvanced ? 'advanced' : 'fast'
      response.mode = useAdvanced ? 'advanced' : 'fast'
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Erreur génération logo IA:', error)
    
    // Uniquement utiliser le fallback si c'est une erreur réseau/API
    if (error.message.includes('fetch') || error.message.includes('HTTP') || error.message.includes('API')) {
      console.log('🔄 Utilisation du fallback local...')
      try {
        const fallbackLogos = generateFallbackLogos(formData)
        return {
          success: true,
          logos: fallbackLogos,
          fallback: true,
          provider: 'local-fallback',
          message: 'Génération locale (API indisponible)'
        }
      } catch (fallbackError) {
        throw new Error(error.message || 'Impossible de générer les logos. Veuillez réessayer.')
      }
    } else {
      throw error
    }
  }
}

// Fonction pour générer des logos avec OpenAI directement (mode avancé)
export async function generateLogosOpenAI(formData) {
  try {
    // Import dynamique du client OpenAI
    const openaiModule = await import('./openaiClient')
    const { callOpenAI } = openaiModule
    
    const prompt = buildAdvancedLogoPrompt(formData)
    
    const response = await callOpenAI(prompt, {
      maxTokens: 4000,
      temperature: 0.9,
      model: 'gpt-4-turbo-preview',
      responseFormat: { type: 'json_object' }
    })
    
    const parsedResponse = parseAdvancedLogoResponse(response)
    
    return {
      success: true,
      logos: parsedResponse.logos.map((logo, index) => ({
        ...logo,
        id: index + 1,
        generatedAt: new Date().toISOString(),
        formData: {
          nomEntreprise: formData.nomEntreprise,
          stylePrefere: formData.stylePrefere,
          secteur: formData.secteur
        }
      })),
      provider: 'advanced'
    }
    
  } catch (error) {
    console.error('Erreur génération logo mode avancé:', error)
    throw error
  }
}

// Construction du prompt avancé pour l'IA OpenAI
function buildAdvancedLogoPrompt(formData) {
  const { nomEntreprise, slogan, secteur, valeurs, publicCible, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  return [
    {
      role: 'system',
      content: `Tu es un expert mondial en design graphique, branding et identité visuelle. Tu travailles pour les plus grandes agences de design et tu as créé des logos pour des marques Fortune 500.

Ta mission est de créer 4 logos professionnels uniques et créatifs basés sur les informations fournies. Chaque logo doit être une œuvre d\'art qui raconte une histoire et communique les valeurs de l\'entreprise.

RÉPONSES EXIGÉES:
- UNIQUEMENT un JSON valide
- Structure exacte: {"logos": [{"logo_data"}]}
- 4 objets logo dans le tableau "logos"

CHAMPS OBLIGATOIRES pour chaque logo:
- id: numéro unique (1-4)
- name: nom exact de l\'entreprise
- style: style principal (modern, classic, tech, eco, bold, playful, luxury, minimalist)
- primaryColor: couleur hexadécimale principale
- secondaryColor: couleur hexadécimale secondaire
- tertiaryColor: couleur hexadécimale tertiaire (optionnel)
- icon: emoji ou symbole représentatif
- preview: texte/abréviation pour le logo (2-4 caractères max)
- description: description créative du concept (20-50 mots)
- fontCategory: catégorie de typographie (serif, sans-serif, display, handwritten, monospace)
- layout: disposition (horizontal, vertical, emblem, combination, abstract, geometric)
- visualElements: éléments visuels clés (ex: montagnes stylisées, cercles entrelacés)
- symbolism: symbolisme et signification (ex: croissance et innovation)
- targetPersonality: personnalité cible du logo (ex: confiant, moderne, accessible)
- scalability: adaptation à différentes tailles (ex: excellent, lisible à 8px)
- uniquenessScore: score d\'unicité (1-10)
- marketFit: adéquation au marché (ex: parfait pour secteur tech)

CRITÈRES DE QUALITÉ:
- Créativité et originalité maximales
- Cohérence avec l\'identité de marque
- Adaptabilité multi-supports
- Mémorabilité et impact visuel
- Pertinence sectorielle`
    },
    {
      role: 'user',
      content: `CRÉATION DE LOGOS AVANCÉS

ENTREPRISE: "${nomEntreprise || 'Entreprise'}"
SLOGAN: "${slogan || 'Non spécifié'}"
SECTEUR: ${secteur || 'Non spécifié'}
VALEURS: ${valeurs || 'Non spécifié'}
PUBLIC CIBLE: ${publicCible || 'Non spécifié'}

PRÉFÉRENCES CRÉATIVES:
- Style principal: ${stylePrefere || 'modern'}
- Couleur primaire: ${couleurPrimaire || '#1E40AF'}
- Couleur secondaire: ${couleurSecondaire || '#DC2626'}

DIRECTIVES CRÉATIVES:
1. Génère 4 logos uniques mais cohérents
2. Chaque logo doit explorer une facette différente de l\'identité
3. Intègre les couleurs de manière créative et équilibrée
4. Les icônes doivent être mémorables et pertinentes
5. Les previews doivent être immédiatement reconnaissables
6. Les descriptions doivent inspirer et convaincre
7. Pense à l\'adaptation sur tous les supports (web, print, mobile)
8. Considère la concurrence et le positionnement unique

FORMAT JSON EXACT:
{
  "logos": [
    {
      "id": 1,
      "name": "NomEntreprise",
      "style": "modern",
      "primaryColor": "#1E40AF",
      "secondaryColor": "#DC2626",
      "tertiaryColor": "#F59E0B",
      "icon": "🚀",
      "preview": "NE",
      "description": "Design moderne épuré avec lignes dynamiques",
      "fontCategory": "sans-serif",
      "layout": "horizontal",
      "visualElements": "flèches ascendantes, cercles",
      "symbolism": "croissance et innovation",
      "targetPersonality": "confiant, avant-gardiste",
      "scalability": "excellent",
      "uniquenessScore": 8,
      "marketFit": "parfait pour secteur tech"
    }
  ]
}`
    }
  ]
}

// Parsing avancé de la réponse OpenAI
function parseAdvancedLogoResponse(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    if (!parsed.logos || !Array.isArray(parsed.logos)) {
      throw new Error('Structure de réponse invalide')
    }
    
    if (parsed.logos.length !== 4) {
      throw new Error('Nombre de logos incorrect')
    }
    
    parsed.logos.forEach((logo, index) => {
      const requiredFields = ['name', 'style', 'primaryColor', 'secondaryColor', 'icon', 'preview', 'description']
      const missingFields = requiredFields.filter(field => !logo[field])
      
      if (missingFields.length > 0) {
        throw new Error(`Logo ${index + 1}: champs manquants: ${missingFields.join(', ')}`)
      }
      
      if (!isValidColor(logo.primaryColor) || !isValidColor(logo.secondaryColor)) {
        throw new Error(`Logo ${index + 1}: couleurs invalides`)
      }
      
      if (logo.uniquenessScore && (logo.uniquenessScore < 1 || logo.uniquenessScore > 10)) {
        logo.uniquenessScore = Math.min(10, Math.max(1, logo.uniquenessScore))
      }
    })
    
    return parsed
    
  } catch (error) {
    console.error('Erreur parsing logo response avancée:', error)
    
    return {
      logos: generateAdvancedDefaultLogos()
    }
  }
}

// Validation des couleurs hexadécimales
function isValidColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Génération de logos par défaut enrichis
function generateAdvancedDefaultLogos() {
  return [
    {
      id: 1,
      name: 'LOGO',
      style: 'modern',
      primaryColor: '#1E40AF',
      secondaryColor: '#DC2626',
      tertiaryColor: '#F59E0B',
      icon: '🚀',
      preview: 'LO',
      description: 'Design moderne épuré avec lignes dynamiques',
      fontCategory: 'sans-serif',
      layout: 'horizontal',
      visualElements: 'flèches ascendantes, cercles',
      symbolism: 'croissance et innovation',
      targetPersonality: 'confiant, avant-gardiste',
      scalability: 'excellent',
      uniquenessScore: 8,
      marketFit: 'parfait pour secteur tech'
    },
    {
      id: 2,
      name: 'LOGO',
      style: 'luxury',
      primaryColor: '#DC2626',
      secondaryColor: '#1E40AF',
      tertiaryColor: '#FFFFFF',
      icon: '⚡',
      preview: 'LOG',
      description: 'Design luxueux avec élégance intemporelle',
      fontCategory: 'serif',
      layout: 'emblem',
      visualElements: 'sceaux, ornements',
      symbolism: 'excellence et prestige',
      targetPersonality: 'sophistiqué, exclusif',
      scalability: 'très bon',
      uniquenessScore: 9,
      marketFit: 'luxe et premium'
    },
    {
      id: 3,
      name: 'LOGO',
      style: 'minimalist',
      primaryColor: '#1E40AF',
      secondaryColor: '#FFFFFF',
      tertiaryColor: '#E5E7EB',
      icon: '🏆',
      preview: 'L',
      description: 'Design minimaliste avec impact maximal',
      fontCategory: 'sans-serif',
      layout: 'vertical',
      visualElements: 'lignes épurées, espaces négatifs',
      symbolism: 'simplicité et clarté',
      targetPersonality: 'moderne, accessible',
      scalability: 'parfait',
      uniquenessScore: 7,
      marketFit: 'moderne et épuré'
    },
    {
      id: 4,
      name: 'LOGO',
      style: 'tech',
      primaryColor: '#DC2626',
      secondaryColor: '#000000',
      tertiaryColor: '#00FF00',
      icon: '💎',
      preview: 'LO',
      description: 'Design technologique futuriste',
      fontCategory: 'monospace',
      layout: 'geometric',
      visualElements: 'circuits, pixels, hexagones',
      symbolism: 'innovation et technologie',
      targetPersonality: 'innovant, technique',
      scalability: 'excellent',
      uniquenessScore: 9,
      marketFit: 'tech et gaming'
    }
  ]
}

// Parsing et validation de la réponse
function parseLogoResponse(response) {
  try {
    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Validation basique
    if (!parsed.logos || !Array.isArray(parsed.logos)) {
      throw new Error('Structure de réponse invalide')
    }
    
    if (parsed.logos.length !== 4) {
      throw new Error('Nombre de logos incorrect')
    }
    
    // Validation des champs requis
    parsed.logos.forEach((logo, index) => {
      const requiredFields = ['name', 'style', 'primaryColor', 'secondaryColor', 'icon', 'preview']
      const missingFields = requiredFields.filter(field => !logo[field])
      
      if (missingFields.length > 0) {
        throw new Error(`Logo ${index + 1}: champs manquants: ${missingFields.join(', ')}`)
      }
    })
    
    return parsed
    
  } catch (error) {
    console.error('Erreur parsing logo response:', error)
    
    // Fallback avec logos par défaut
    return {
      logos: generateDefaultLogos(formData)
    }
  }
}

// Génération de logos par défaut en cas d'erreur (fallback local)
function generateFallbackLogos(formData) {
  const { nomEntreprise, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  return [
    {
      id: 1,
      name: nomEntreprise || 'LOGO',
      style: stylePrefere || 'modern',
      primaryColor: couleurPrimaire || '#1E40AF',
      secondaryColor: couleurSecondaire || '#DC2626',
      icon: '🚀',
      preview: (nomEntreprise || 'LOGO').slice(0, 2).toUpperCase(),
      description: `Design ${stylePrefere || 'moderne'} épuré`,
      fontCategory: 'sans-serif',
      layout: 'horizontal',
      generatedAt: new Date().toISOString(),
      formData: {
        nomEntreprise: formData.nomEntreprise,
        stylePrefere: formData.stylePrefere,
        secteur: formData.secteur
      }
    },
    {
      id: 2,
      name: nomEntreprise || 'LOGO',
      style: 'modern',
      primaryColor: couleurSecondaire || '#DC2626',
      secondaryColor: couleurPrimaire || '#1E40AF',
      icon: '⚡',
      preview: (nomEntreprise || 'LOGO').slice(0, 3).toUpperCase(),
      description: 'Design dynamique et moderne',
      fontCategory: 'display',
      layout: 'vertical',
      generatedAt: new Date().toISOString(),
      formData: {
        nomEntreprise: formData.nomEntreprise,
        stylePrefere: formData.stylePrefere,
        secteur: formData.secteur
      }
    },
    {
      id: 3,
      name: nomEntreprise || 'LOGO',
      style: 'classic',
      primaryColor: couleurPrimaire || '#1E40AF',
      secondaryColor: '#FFFFFF',
      icon: '🏆',
      preview: (nomEntreprise || 'LOGO').charAt(0).toUpperCase(),
      description: 'Design classique élégant',
      fontCategory: 'serif',
      layout: 'emblem',
      generatedAt: new Date().toISOString(),
      formData: {
        nomEntreprise: formData.nomEntreprise,
        stylePrefere: formData.stylePrefere,
        secteur: formData.secteur
      }
    },
    {
      id: 4,
      name: nomEntreprise || 'LOGO',
      style: 'tech',
      primaryColor: couleurSecondaire || '#DC2626',
      secondaryColor: '#000000',
      icon: '💎',
      preview: (nomEntreprise || 'LOGO').slice(0, 2).toUpperCase(),
      description: 'Design technologique innovant',
      fontCategory: 'sans-serif',
      layout: 'combination',
      generatedAt: new Date().toISOString(),
      formData: {
        nomEntreprise: formData.nomEntreprise,
        stylePrefere: formData.stylePrefere,
        secteur: formData.secteur
      }
    }
  ]
}

// Génération de logos par défaut pour le backend Netlify
function generateDefaultLogos() {
  return [
    {
      id: 1,
      name: 'LOGO',
      style: 'modern',
      primaryColor: '#1E40AF',
      secondaryColor: '#DC2626',
      icon: '🚀',
      preview: 'LO',
      description: 'Design moderne épuré',
      fontCategory: 'sans-serif',
      layout: 'horizontal'
    },
    {
      id: 2,
      name: 'LOGO',
      style: 'modern',
      primaryColor: '#DC2626',
      secondaryColor: '#1E40AF',
      icon: '⚡',
      preview: 'LOG',
      description: 'Design dynamique et moderne',
      fontCategory: 'display',
      layout: 'vertical'
    },
    {
      id: 3,
      name: 'LOGO',
      style: 'classic',
      primaryColor: '#1E40AF',
      secondaryColor: '#FFFFFF',
      icon: '🏆',
      preview: 'L',
      description: 'Design classique élégant',
      fontCategory: 'serif',
      layout: 'emblem'
    },
    {
      id: 4,
      name: 'LOGO',
      style: 'tech',
      primaryColor: '#DC2626',
      secondaryColor: '#000000',
      icon: '💎',
      preview: 'LO',
      description: 'Design technologique innovant',
      fontCategory: 'sans-serif',
      layout: 'combination'
    }
  ]
}

// Fonction pour télécharger un logo (simulation)
export async function downloadLogo(logo, format = 'png') {
  try {
    // Créer un canvas pour générer l'image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Dimensions du logo
    canvas.width = 800
    canvas.height = 800
    
    // Fond
    ctx.fillStyle = logo.primaryColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Dégradé
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, logo.primaryColor)
    gradient.addColorStop(1, logo.secondaryColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Texte du logo
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(logo.preview, canvas.width / 2, canvas.height / 2)
    
    // Téléchargement
    const link = document.createElement('a')
    link.download = `${logo.name.replace(/\s+/g, '_')}_logo_${logo.id}.${format}`
    
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png')
    } else if (format === 'svg') {
      // SVG simplifié
      const svgContent = `
        <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${logo.primaryColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${logo.secondaryColor};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#grad)"/>
          <text x="400" y="400" font-family="Arial" font-size="120" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${logo.preview}</text>
        </svg>
      `
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      link.href = URL.createObjectURL(blob)
    }
    
    link.click()
    
    return { success: true, message: 'Logo téléchargé avec succès' }
    
  } catch (error) {
    console.error('Erreur téléchargement logo:', error)
    throw new Error('Impossible de télécharger le logo')
  }
}

// Fonction pour sauvegarder un logo dans l'historique via API
export async function saveLogoToHistory(logo, userId) {
  try {
    const response = await fetch('/.netlify/functions/logo-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        'X-Session-ID': getSessionId()
      },
      body: JSON.stringify({
        ...logo,
        userId
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
    }
    
    const result = await response.json()
    return result
    
  } catch (error) {
    console.error('Erreur sauvegarde logo:', error)
    
    // Fallback: sauvegarder localement
    try {
      const historyItem = {
        ...logo,
        userId,
        savedAt: new Date().toISOString()
      }
      
      const existingHistory = JSON.parse(localStorage.getItem('logo_history') || '[]')
      existingHistory.unshift(historyItem)
      
      const limitedHistory = existingHistory.slice(0, 50)
      localStorage.setItem('logo_history', JSON.stringify(limitedHistory))
      
      return { success: true, logo: historyItem, fallback: true }
    } catch (fallbackError) {
      throw new Error('Impossible de sauvegarder le logo')
    }
  }
}

// Fonction pour récupérer l'historique des logos via API
export async function getLogoHistory(userId) {
  try {
    const response = await fetch('/.netlify/functions/logo-history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'X-Session-ID': getSessionId()
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
    }
    
    const result = await response.json()
    return result
    
  } catch (error) {
    console.error('Erreur récupération historique:', error)
    
    // Fallback: récupérer localement
    try {
      const history = JSON.parse(localStorage.getItem('logo_history') || '[]')
      const userHistory = history.filter(item => item.userId === userId)
      
      return { success: true, logos: userHistory, fallback: true }
    } catch (fallbackError) {
      return { success: false, logos: [] }
    }
  }
}

// Fonction pour supprimer un logo de l'historique
export async function deleteLogoFromHistory(logoId, userId) {
  try {
    const response = await fetch(`/.netlify/functions/logo-history/${logoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'X-Session-ID': getSessionId()
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
    }
    
    const result = await response.json()
    return result
    
  } catch (error) {
    console.error('Erreur suppression logo:', error)
    
    // Fallback: supprimer localement
    try {
      const history = JSON.parse(localStorage.getItem('logo_history') || '[]')
      const filteredHistory = history.filter(item => !(item.userId === userId && item.id === logoId))
      localStorage.setItem('logo_history', JSON.stringify(filteredHistory))
      
      return { success: true, fallback: true }
    } catch (fallbackError) {
      throw new Error('Impossible de supprimer le logo')
    }
  }
}

// Fonctions utilitaires pour l'authentification
function getAuthToken() {
  // Récupérer le token depuis localStorage ou un autre stockage
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || 'demo_token'
}

function getSessionId() {
  // Générer ou récupérer un ID de session
  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}

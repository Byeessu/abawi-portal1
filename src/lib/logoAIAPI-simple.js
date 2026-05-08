// Version simplifiée et robuste du client API pour le Studio Logo IA

// Fonction pour générer des logos avec fallback garanti
export async function generateLogosSimple(formData, useAdvanced = true) {
  console.log(`🚀 Génération logos - Mode: ${useAdvanced ? 'Avancée' : 'Rapide'}`)
  
  try {
    // Tenter l'API avancée si demandé
    if (useAdvanced) {
      try {
        const response = await generateLogosOpenAISimple(formData)
        return response
      } catch (openaiError) {
        console.warn('🔄 OpenAI indisponible, fallback vers mode rapide:', openaiError.message)
        // Continuer vers le mode rapide
      }
    }
    
    // Mode rapide (Groq ou fallback)
    const response = await generateLogosFast(formData)
    return response
    
  } catch (error) {
    console.error('❌ Erreur complète, fallback local:', error.message)
    return generateLogosFallback(formData)
  }
}

// Génération OpenAI simplifiée
async function generateLogosOpenAISimple(formData) {
  try {
    // Appel direct à l'API OpenAI sans dépendances complexes
    const response = await fetch('/.netlify/functions/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `Génère 4 logos professionnels pour une entreprise.

STYLE RÉDACTIONNEL EXIGÉ:
- Utiliser des numéros au lieu des puces
- Mettre les TITRES en MAJUSCULES
- Le corps reste en minuscules normal
- Descriptions directes et percutantes

Réponds UNIQUEMENT avec un JSON valide contenant un tableau "logos" avec 4 objets. Chaque logo doit avoir: id, name, style, primaryColor, secondaryColor, icon, preview, description, symbolism, uniquenessScore, fontCategory, layout.`
          },
          {
            role: 'user',
            content: `ENTREPRISE: ${formData.nomEntreprise}, STYLE: ${formData.stylePrefere}, COULEURS: ${formData.couleurPrimaire} et ${formData.couleurSecondaire}`
          }
        ],
        options: {
          maxTokens: 2000,
          temperature: 0.9,
          model: 'gpt-4-turbo-preview'
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const logos = parseSimpleLogoResponse(data.content)
    
    return {
      success: true,
      logos: logos.map((logo, index) => ({
        ...logo,
        id: index + 1,
        generatedAt: new Date().toISOString(),
        provider: 'advanced'
      }))
    }
    
  } catch (error) {
    console.error('Erreur OpenAI simple:', error)
    throw error
  }
}

// Génération rapide (Groq)
async function generateLogosFast(formData) {
  try {
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
      data.provider = 'fast'
      return data
    } else {
      throw new Error(data.error || 'Échec génération')
    }
    
  } catch (error) {
    console.error('Erreur génération rapide:', error)
    throw error
  }
}

// Fallback local garanti
function generateLogosFallback(formData) {
  console.log('🏠 Génération locale garantie')
  
  const { nomEntreprise, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  const baseLogos = [
    {
      id: 1,
      name: nomEntreprise || 'LOGO',
      style: stylePrefere || 'modern',
      primaryColor: couleurPrimaire || '#1E40AF',
      secondaryColor: couleurSecondaire || '#DC2626',
      icon: '🚀',
      preview: (nomEntreprise || 'LOGO').slice(0, 2).toUpperCase(),
      description: `Design ${stylePrefere || 'moderne'} épuré et professionnel`,
      symbolism: 'croissance et innovation',
      uniquenessScore: 8,
      fontCategory: 'sans-serif',
      layout: 'horizontal'
    },
    {
      id: 2,
      name: nomEntreprise || 'LOGO',
      style: 'classic',
      primaryColor: couleurSecondaire || '#DC2626',
      secondaryColor: couleurPrimaire || '#1E40AF',
      icon: '⚡',
      preview: (nomEntreprise || 'LOGO').slice(0, 3).toUpperCase(),
      description: 'Design classique élégant et intemporel',
      symbolism: 'excellence et fiabilité',
      uniquenessScore: 7,
      fontCategory: 'serif',
      layout: 'vertical'
    },
    {
      id: 3,
      name: nomEntreprise || 'LOGO',
      style: 'tech',
      primaryColor: couleurPrimaire || '#1E40AF',
      secondaryColor: '#FFFFFF',
      icon: '🏆',
      preview: (nomEntreprise || 'LOGO').charAt(0).toUpperCase(),
      description: 'Design technologique moderne et innovant',
      symbolism: 'technologie et avenir',
      uniquenessScore: 9,
      fontCategory: 'monospace',
      layout: 'geometric'
    },
    {
      id: 4,
      name: nomEntreprise || 'LOGO',
      style: 'minimalist',
      primaryColor: couleurSecondaire || '#DC2626',
      secondaryColor: '#000000',
      icon: '💎',
      preview: (nomEntreprise || 'LOGO').slice(0, 2).toUpperCase(),
      description: 'Design minimaliste épuré et mémorable',
      symbolism: 'simplicité et clarté',
      uniquenessScore: 6,
      fontCategory: 'sans-serif',
      layout: 'emblem'
    }
  ]
  
  return {
    success: true,
    logos: baseLogos.map(logo => ({
      ...logo,
      generatedAt: new Date().toISOString(),
      provider: 'local-fallback'
    })),
    fallback: true,
    message: 'Génération locale (mode hors-ligne)'
  }
}

// Parsing simple et robuste
function parseSimpleLogoResponse(content) {
  try {
    // Extraire le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Pas de JSON trouvé')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    if (!parsed.logos || !Array.isArray(parsed.logos)) {
      throw new Error('Structure invalide')
    }
    
    // Validation basique et enrichissement
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
    console.warn('Parsing échoué, utilisation fallback:', error)
    throw error
  }
}

// Génération d'offre complète avec variantes
export async function generateBrandOffer(formData, selectedLogo) {
  console.log('🎯 Génération offre complète de branding')
  
  try {
    const offerData = await generateBrandOfferAI(formData, selectedLogo)
    return offerData
  } catch (error) {
    console.error('Erreur génération offre:', error)
    return generateBrandOfferFallback(formData, selectedLogo)
  }
}

// Génération d'offre par IA
async function generateBrandOfferAI(formData, selectedLogo) {
  try {
    const response = await fetch('/.netlify/functions/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en branding et marketing. Génère une offre complète de branding basée sur un logo. 

STYLE RÉDACTIONNEL EXIGÉ:
- Utiliser des numéros au lieu des puces (1. 2. 3.)
- Mettre les TITRES en MAJUSCULES ou en gras
- Le corps du texte reste en minuscules normal
- Réduire les listes, privilégier les phrases directes
- Format professionnel et percutant

Réponds UNIQUEMENT avec un JSON valide contenant:
{
  "project": {
    "title": "TITRE DU PROJET",
    "description": "Description concise",
    "objectives": ["1. Premier objectif", "2. Deuxième objectif"],
    "timeline": "Délai",
    "budget": "Budget"
  },
  "variants": [
    {
      "support": "Carte de visite",
      "description": "Description directe",
      "specifications": "Specs techniques",
      "colors": ["#1E40AF", "#DC2626"],
      "typography": "Police"
    }
  ],
  "applications": [
    {
      "support": "Site web",
      "usage": "Usage principal",
      "format": "Format",
      "notes": "Notes essentielles"
    }
  ],
  "guidelines": {
    "do": ["1. Action requise", "2. Autre action"],
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
          },
          {
            role: 'user',
            content: `Entreprise: ${formData.nomEntreprise}, Secteur: ${formData.secteur}, Logo: ${JSON.stringify(selectedLogo)}`
          }
        ],
        options: {
          maxTokens: 3000,
          temperature: 0.8,
          model: 'gpt-4-turbo-preview'
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const offer = parseBrandOfferResponse(data.content)
    
    return {
      success: true,
      ...offer,
      provider: 'ai-generated'
    }
    
  } catch (error) {
    console.error('Erreur IA offre:', error)
    throw error
  }
}

// Parsing de l'offre
function parseBrandOfferResponse(content) {
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

// Fallback pour offre
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
        description: 'Version professionnelle du logo pour cartes',
        specifications: '90x50mm, impression 300dpi',
        colors: [selectedLogo.primaryColor, selectedLogo.secondaryColor],
        typography: selectedLogo.fontCategory || 'sans-serif'
      },
      {
        support: 'En-tête',
        description: 'Version pour documents officiels',
        specifications: 'A4, impression numérique',
        colors: [selectedLogo.primaryColor, selectedLogo.secondaryColor],
        typography: selectedLogo.fontCategory || 'sans-serif'
      },
      {
        support: 'Signature email',
        description: 'Version optimisée pour email',
        specifications: '600x100px max, web',
        colors: [selectedLogo.primaryColor, selectedLogo.secondaryColor],
        typography: selectedLogo.fontCategory || 'sans-serif'
      }
    ],
    applications: [
      {
        support: 'Site web',
        usage: 'Header et favicon',
        format: 'SVG, PNG',
        notes: 'Versions responsive nécessaires'
      },
      {
        support: 'Réseaux sociaux',
        usage: 'Profiles et posts',
        format: 'PNG carré et rectangulaire',
        notes: 'Adapter aux plateformes'
      },
      {
        support: 'Print',
        usage: 'Brochures, flyers',
        format: 'AI, PDF vectoriel',
        notes: 'Haute résolution requise'
      }
    ],
    guidelines: {
      do: [
        '1. Maintenir cohérence des couleurs',
        '2. Respecter espaces de sécurité',
        '3. Utiliser versions vectorielles'
      ],
      dont: [
        '1. Modifier proportions du logo',
        '2. Utiliser couleurs non autorisées',
        '3. Appliquer effets dégradés non prévus'
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

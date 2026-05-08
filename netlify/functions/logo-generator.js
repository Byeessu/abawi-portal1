const { callGroq } = require('../../src/lib/groqClient')

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  // Uniquement les requêtes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Parser le corps de la requête
    const formData = JSON.parse(event.body)
    
    // Validation des données
    if (!formData.nomEntreprise || formData.nomEntreprise.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Le nom de l\'entreprise est requis',
          code: 'MISSING_COMPANY_NAME'
        })
      }
    }

    // Construire le prompt pour l'IA
    const prompt = buildLogoPrompt(formData)
    
    // Appeler l'IA Groq
    const response = await callGroq(
      [
        {
          role: 'system',
          content: `Tu es un expert en design graphique et branding. Génère des logos professionnels uniques basés sur les informations fournies. 
          
          Réponds UNIQUEMENT avec un JSON valide contenant un tableau "logos" avec 4 objets logo.
          
          Chaque objet logo doit contenir:
          - id: numéro unique (1-4)
          - name: nom de l'entreprise
          - style: style du logo (modern, classic, tech, eco, bold, playful)
          - primaryColor: couleur hexadécimale
          - secondaryColor: couleur hexadécimale
          - icon: emoji représentatif
          - preview: texte/abréviation pour le logo (2-3 caractères max)
          - description: brève description du design
          - fontCategory: catégorie de typographie (serif, sans-serif, display, handwritten)
          - layout: disposition du logo (horizontal, vertical, emblem, combination)
          
          Les logos doivent être cohérents avec l'identité de marque demandée.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      { 
        maxTokens: 2000, 
        temperature: 0.8, 
        jsonMode: true 
      }
    )
    
    // Parser et valider la réponse
    const parsedResponse = parseLogoResponse(response)
    
    // Ajouter des métadonnées
    const result = {
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
      }))
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }
    
  } catch (error) {
    console.error('Erreur génération logo IA:', error)
    
    // Retourner une réponse d'erreur structurée
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Impossible de générer les logos. Veuillez réessayer.',
        code: 'GENERATION_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

// Construction du prompt pour l'IA
function buildLogoPrompt(formData) {
  const { nomEntreprise, slogan, secteur, valeurs, publicCible, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  return `
Génère 4 logos professionnels pour: "${nomEntreprise || 'Entreprise'}"

INFORMATIONS ENTREPRISE:
- Nom: ${nomEntreprise || 'Non spécifié'}
- Slogan: ${slogan || 'Non spécifié'}
- Secteur: ${secteur || 'Non spécifié'}
- Valeurs: ${valeurs || 'Non spécifié'}
- Public cible: ${publicCible || 'Non spécifié'}

PRÉFÉRENCES DESIGN:
- Style principal: ${stylePrefere || 'modern'}
- Couleur primaire: ${couleurPrimaire || '#1E40AF'}
- Couleur secondaire: ${couleurSecondaire || '#DC2626'}

CONSIGNES:
1. Crée 4 variations uniques mais cohérentes
2. Chaque logo doit utiliser le style demandé comme inspiration principale
3. Intègre intelligemment les couleurs spécifiées
4. Les icônes doivent être pertinentes pour le secteur
5. Les previews doivent être des abréviations reconnaissables
6. Les descriptions doivent expliquer le concept créatif

FORMAT DE RÉPONSE JSON EXIGÉ:
{
  "logos": [
    {
      "id": 1,
      "name": "NomEntreprise",
      "style": "modern",
      "primaryColor": "#1E40AF",
      "secondaryColor": "#DC2626",
      "icon": "🚀",
      "preview": "NE",
      "description": "Design moderne avec lignes épurées",
      "fontCategory": "sans-serif",
      "layout": "horizontal"
    }
  ]
}
`
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
      logos: generateDefaultLogos()
    }
  }
}

// Génération de logos par défaut en cas d'erreur
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

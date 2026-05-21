async function callOpenAI(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 160)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const formData = JSON.parse(event.body)
    
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

    const prompt = buildAdvancedLogoPrompt(formData)
    
    const response = await callOpenAI(prompt, {
      maxTokens: 4000,
      temperature: 0.9,
      model: 'gpt-4-turbo-preview',
      responseFormat: { type: 'json_object' }
    })
    
    const parsedResponse = parseAdvancedLogoResponse(response)
    
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
    console.error('Erreur génération logo avancée:', error)
    
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

function buildAdvancedLogoPrompt(formData) {
  const { nomEntreprise, slogan, secteur, valeurs, publicCible, stylePrefere, couleurPrimaire, couleurSecondaire } = formData
  
  return [
    {
      role: 'system',
      content: `Tu es un expert mondial en design graphique, branding et identité visuelle. Tu travailles pour les plus grandes agences de design et tu as créé des logos pour des marques Fortune 500.

Ta mission est de créer 4 logos professionnels uniques et créatifs basés sur les informations fournies. Chaque logo doit être une œuvre d'art qui raconte une histoire et communique les valeurs de l'entreprise. // eslint-disable-line no-useless-escape

RÉPONSES EXIGÉES:
- UNIQUEMENT un JSON valide
- Structure exacte: {"logos": [{"logo_data"}]}
- 4 objets logo dans le tableau "logos"

CHAMPS OBLIGATOIRES pour chaque logo:
- id: numéro unique (1-4)
- name: nom exact de l'entreprise // eslint-disable-line no-useless-escape
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
- uniquenessScore: score d'unicité (1-10)
- marketFit: adéquation au marché (ex: parfait pour secteur tech)

CRITÈRES DE QUALITÉ:
- Créativité et originalité maximales
- Cohérence avec l'identité de marque
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
2. Chaque logo doit explorer une facette différente de l'identité
3. Intègre les couleurs de manière créative et équilibrée
4. Les icônes doivent être mémorables et pertinentes
5. Les previews doivent être immédiatement reconnaissables
6. Les descriptions doivent inspirer et convaincre
7. Pense à l'adaptation sur tous les supports (web, print, mobile)
8. Considère la concurrence et le positionnement unique

INSPIRATION SECTORIELLE:
${getSectorInspiration(secteur)}

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

function getSectorInspiration(secteur) {
  const inspirations = {
    'tech': 'Pense à Silicon Valley, innovation, disruption, futur, code, circuits, connectivity. Utilise des éléments géométriques, lignes épurées, gradients modernes.',
    'finance': 'Pense à confiance, sécurité, croissance, stabilité, or, argent. Utilise des symboles classiques, typographies serif, couleurs professionnelles.',
    'sante': 'Pense à vie, soin, nature, guérison, espoir. Utilise des formes organiques, couleurs apaisantes, symboles médicaux modernisés.',
    'education': 'Pense à savoir, croissance, livres, lumière, avenir. Utilise des symboles de connaissance, couleurs inspirantes, typographies claires.',
    'retail': 'Pense à shopping, expérience, qualité, tendance. Utilise des formes dynamiques, couleurs attractives, symboles de consommation.',
    'consulting': 'Pense à expertise, stratégie, solutions, excellence. Utilise des formes structurées, couleurs professionnelles, symboles d\'intelligence.',
    'immobilier': 'Pense à maison, investissement, sécurité, lieu. Utilise des formes architecturales, couleurs terrestres, symboles de propriété.',
    'restaurant': 'Pense à goût, expérience, ambiance, qualité. Utilise des formes organiques, couleurs appétissantes, symboles culinaires.'
  }
  
  return inspirations[secteur] || 'Pense à professionnalisme, qualité, service client. Utilise des designs équilibrés et professionnels.'
}

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

function isValidColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

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

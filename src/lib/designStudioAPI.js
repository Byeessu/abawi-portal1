// Studio Design API - Extension pour affiches, visuels, maquettes et designs complets

import { callClaude } from './claudeClient'

// Types de designs disponibles
export const DESIGN_TYPES = {
  LOGO: 'logo',
  AFFICHE: 'affiche',
  VISUEL_RESEAU: 'visuel_reseau',
  MAQUETTE_WEB: 'maquette_web',
  CARTE_VISITE: 'carte_visite',
  BANNIERE: 'banniere',
  FLYER: 'flyer',
  BROCHURE: 'brochure',
  PRESENTATION: 'presentation',
  PACKAGING: 'packaging'
}

// Fonction principale de génération de designs
export async function generateDesign(formData, designType, engine = 'creative') {
  console.log(`🎨 Génération design - Type: ${designType}, Moteur: ${engine}`)
  
  const startTime = Date.now()
  
  try {
    let response
    
    switch (engine) {
      case 'creative':
        response = await generateDesignCreative(formData, designType)
        break
      case 'efficient':
        response = await generateDesignEfficient(formData, designType)
        break
      case 'balanced':
        response = await generateDesignBalanced(formData, designType)
        break
      default:
        throw new Error('Moteur non reconnu')
    }
    
    response.duration = Date.now() - startTime
    response.designType = designType
    response.engine = engine
    
    return response
    
  } catch (error) {
    console.error('Erreur génération design:', error)
    return generateDesignFallback(formData, designType)
  }
}

// Génération créative avec Claude
async function generateDesignCreative(formData, designType) {
  try {
    const prompt = buildCreativeDesignPrompt(formData, designType)
    
    const response = await callClaude(prompt, {
      maxTokens: 4000,
      temperature: 0.9,
      model: 'claude-3-sonnet-20240229'
    })
    
    const design = parseDesignResponse(response, designType)
    
    return {
      success: true,
      ...design,
      provider: 'creative'
    }
    
  } catch (error) {
    console.error('Erreur design créatif:', error)
    throw error
  }
}

// Génération efficace (fallback simplifié)
async function generateDesignEfficient(formData, designType) {
  return generateDesignFallback(formData, designType)
}

// Génération équilibrée avec OpenAI
async function generateDesignBalanced(formData, designType) {
  try {
    const response = await fetch('/.netlify/functions/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: buildBalancedDesignPrompt(formData, designType)
          },
          {
            role: 'user',
            content: `Génère un design ${designType} pour: ${formData.nomEntreprise}`
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
    const design = parseDesignResponse(data.content, designType)
    
    return {
      success: true,
      ...design,
      provider: 'balanced'
    }
    
  } catch (error) {
    console.error('Erreur design équilibré:', error)
    throw error
  }
}

// Prompts créatifs pour chaque type de design
function buildCreativeDesignPrompt(formData, designType) {
  const baseContext = `
ENTREPRISE: ${formData.nomEntreprise}
SECTEUR: ${formData.secteur || 'général'}
STYLE: ${formData.stylePrefere}
COULEURS: ${formData.couleurPrimaire} et ${formData.couleurSecondaire}
VALEURS: ${formData.valeurs || 'excellence et innovation'}
PUBLIC: ${formData.publicCible || 'professionnels modernes'}
`

  const prompts = {
    [DESIGN_TYPES.AFFICHE]: `
Tu es un DIRECTEUR CRÉATIF PUBLICITAIRE de renommée mondiale. Crée une affiche PUBLICITAIRE EXTRAORDINAIRE pour "${formData.nomEntreprise}".

${baseContext}

EXIGENCE CRÉATIVE ABSOLUE:
- Concept publicitaire percutant et mémorable
- Hiérarchie visuelle parfaite
- Call-to-action puissant
- Impact émotionnel garanti
- Différenciation concurrentielle radicale

FORMAT JSON UNIQUEMENT:
{
  "design": {
    "title": "TITRE ACCROCHEUR",
    "tagline": "SLOGAN IMPACTANT",
    "description": "description conceptuelle détaillée",
    "visualConcept": "concept visuel principal",
    "colorScheme": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "background": "#HEX"
    },
    "typography": {
      "headline": "typo titre",
      "body": "typo corps",
      "accent": "typo accent"
    },
    "layout": "layout spécifique",
    "elements": [
      {
        "type": "élément",
        "description": "description détaillée",
        "position": "position",
        "size": "taille"
      }
    ],
    "emotionalImpact": "impact émotionnel recherché",
    "targetAction": "action souhaitée du public",
    "printSpecs": "spécifications impression",
    "digitalAdaptation": "adaptation numérique"
  }
}

CRÉE UNE AFFICHE QUI MARQUE LES ESPRITS !`,

    [DESIGN_TYPES.VISUEL_RESEAU]: `
Tu es un SOCIAL MEDIA MANAGER expert en contenu viral. Crée un visuel RÉSEAUX SOCIAUX ENGAGEANT pour "${formData.nomEntreprise}".

${baseContext}

EXIGENCE VIRALE:
- Format optimé pour chaque plateforme
- Engagement immédiat garanti
- Partageabilité maximale
- Identité visuelle forte
- Message clair et concis

FORMAT JSON UNIQUEMENT:
{
  "design": {
    "platform": "plateforme principale",
    "format": "format optimal",
    "headline": "titre accrocheur",
    "message": "message principal",
    "visualStyle": "style visuel",
    "colorPalette": ["#HEX", "#HEX", "#HEX"],
    "typography": {
      "primary": "typo principale",
      "secondary": "typo secondaire"
    },
    "visualElements": [
      {
        "element": "élément visuel",
        "purpose": "objectif",
        "placement": "placement"
      }
    ],
    "engagementHooks": ["hook 1", "hook 2"],
    "cta": "call-to-action",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "adaptations": {
      "instagram": "adaptation IG",
      "facebook": "adaptation FB",
      "twitter": "adaptation TW",
      "linkedin": "adaptation LI"
    }
  }
}

CRÉE UN VISUEL QUI DEVIENT VIRAL !`,

    [DESIGN_TYPES.MAQUETTE_WEB]: `
Tu es un UX/UI DESIGNER de classe mondiale. Crée une maquette WEB INNOVANTE pour "${formData.nomEntreprise}".

${baseContext}

EXIGENCE UX/UI:
- Expérience utilisateur exceptionnelle
- Design responsive parfait
- Navigation intuitive
- Conversion optimisée
- Accessibilité totale

FORMAT JSON UNIQUEMENT:
{
  "design": {
    "pageType": "type de page",
    "layout": "layout structurel",
    "colorScheme": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "neutral": "#HEX",
      "background": "#HEX"
    },
    "typography": {
      "headings": "typo titres",
      "body": "typo corps",
      "ui": "typo éléments"
    },
    "sections": [
      {
        "section": "nom section",
        "purpose": "objectif",
        "elements": ["élément 1", "élément 2"],
        "layout": "layout section"
      }
    ],
    "components": [
      {
        "component": "composant",
        "description": "description détaillée",
        "interaction": "interaction",
        "state": "états"
      }
    ],
    "userFlow": "flux utilisateur",
    "conversionPoints": ["point 1", "point 2"],
    "responsive": {
      "desktop": "adaptation desktop",
      "tablet": "adaptation tablette",
      "mobile": "adaptation mobile"
    }
  }
}

CRÉE UNE MAQUETTE WEB QUI CONVERTIT !`,

    [DESIGN_TYPES.CARTE_VISITE]: `
Tu es un DESIGNER GRAPHIQUE spécialisé en identité visuelle. Crée une carte de visite PROFESSIONNELLE pour "${formData.nomEntreprise}".

${baseContext}

EXIGENCE PROFESSIONNELLE:
- Impact visuel immédiat
- Information claire et lisible
- Qualité d'impression optimale
- Mémorabilité garantie
- Format standard respecté

FORMAT JSON UNIQUEMENT:
{
  "design": {
    "format": "format carte",
    "orientation": "orientation",
    "layout": "layout précis",
    "front": {
      "logo": "position logo",
      "name": "nom et titre",
      "contact": "coordonnées",
      "visual": "élément visuel"
    },
    "back": {
      "content": "contenu verso",
      "services": "services principaux",
      "branding": "éléments branding"
    },
    "colorScheme": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "text": "#HEX"
    },
    "typography": {
      "name": "typo nom",
      "contact": "typo contact",
      "details": "typo détails"
    },
    "paper": {
      "type": "type papier",
      "weight": "grammage",
      "finish": "finition"
    },
    "specialFeatures": ["fonctionnalité 1", "fonctionnalité 2"]
  }
}

CRÉE UNE CARTE DE VISITE QUI IMPRESSIONNE !`
  }

  return prompts[designType] || prompts[DESIGN_TYPES.AFFICHE]
}

// Prompt équilibré
function buildBalancedDesignPrompt(formData, designType) {
  return `Tu es un DESIGNER PROFESSIONNEL. Crée un design ${designType} de haute qualité pour "${formData.nomEntreprise}".

CONTEXTE:
- Entreprise: ${formData.nomEntreprise}
- Secteur: ${formData.secteur}
- Style: ${formData.stylePrefere}
- Couleurs: ${formData.couleurPrimaire}, ${formData.couleurSecondaire}

FORMAT JSON UNIQUEMENT avec structure complète du design.`
}

// Parsing des réponses design
function parseDesignResponse(content, designType) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Pas de JSON trouvé')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Enrichir avec des métadonnées
    return {
      ...parsed,
      designType,
      generatedAt: new Date().toISOString(),
      metadata: {
        wordCount: content.length,
        hasVisualElements: true,
        hasColorScheme: true,
        hasTypography: true
      }
    }
    
  } catch (error) {
    console.warn('Parsing design échoué:', error)
    throw error
  }
}

// Fallback design
function generateDesignFallback(formData, designType) {
  const fallbackDesigns = {
    [DESIGN_TYPES.AFFICHE]: {
      design: {
        title: `EXCEPTIONNEL ${formData.nomEntreprise}`,
        tagline: "L'excellence redéfinie",
        description: "Design professionnel et percutant",
        visualConcept: "Approche minimaliste avec impact maximal",
        colorScheme: {
          primary: formData.couleurPrimaire || '#1E40AF',
          secondary: formData.couleurSecondaire || '#DC2626',
          accent: '#F59E0B',
          background: '#FFFFFF'
        },
        typography: {
          headline: 'Arial Black',
          body: 'Arial',
          accent: 'Helvetica'
        },
        layout: 'centré avec hiérarchie claire',
        elements: [
          {
            type: 'titre principal',
            description: 'Titre accrocheur en gros',
            position: 'haut-centre',
            size: 'très grand'
          }
        ],
        emotionalImpact: 'Confiance et professionnalisme',
        targetAction: 'Contact et conversion',
        printSpecs: 'A3 (297x420mm), 300dpi',
        digitalAdaptation: 'Optimisé pour web et réseaux sociaux'
      }
    },
    [DESIGN_TYPES.VISUEL_RESEAU]: {
      design: {
        platform: 'Instagram',
        format: '1080x1080px carré',
        headline: formData.nomEntreprise,
        message: 'Innovation et excellence',
        visualStyle: 'moderne et épuré',
        colorPalette: [formData.couleurPrimaire || '#1E40AF', formData.couleurSecondaire || '#DC2626', '#FFFFFF'],
        typography: {
          primary: 'Arial',
          secondary: 'Helvetica'
        },
        visualElements: [
          {
            element: 'logo',
            purpose: 'identification marque',
            placement: 'centre'
          }
        ],
        engagementHooks: ['Question engageante', 'Call-to-action clair'],
        cta: 'Découvrez plus',
        hashtags: ['#innovation', '#excellence', '#' + formData.nomEntreprise.replace(/\s+/g, '')],
        adaptations: {
          instagram: 'Format carré optimal',
          facebook: 'Format adapté',
          twitter: 'Version concise',
          linkedin: 'Tone professionnel'
        }
      }
    },
    [DESIGN_TYPES.MAQUETTE_WEB]: {
      design: {
        pageType: 'Page d\'accueil',
        layout: 'hero + sections + footer',
        colorScheme: {
          primary: formData.couleurPrimaire || '#1E40AF',
          secondary: formData.couleurSecondaire || '#DC2626',
          accent: '#F59E0B',
          neutral: '#F3F4F6',
          background: '#FFFFFF'
        },
        typography: {
          headings: 'Arial',
          body: 'system-ui',
          ui: 'Inter'
        },
        sections: [
          {
            section: 'Hero',
            purpose: 'impact immédiat',
            elements: ['titre', 'sous-titre', 'cta'],
            layout: 'centré'
          }
        ],
        components: [
          {
            component: 'navigation',
            description: 'barre de navigation',
            interaction: 'hover et click',
            state: 'fixe en scroll'
          }
        ],
        userFlow: 'simple et direct',
        conversionPoints: ['cta principal', 'formulaire contact'],
        responsive: {
          desktop: 'layout complet',
          tablet: 'adapté',
          mobile: 'stacked'
        }
      }
    },
    [DESIGN_TYPES.CARTE_VISITE]: {
      design: {
        format: 'standard 90x50mm',
        orientation: 'paysage',
        layout: 'logo à gauche, infos à droite',
        front: {
          logo: 'coin supérieur gauche',
          name: 'nom et titre centrés',
          contact: 'coordonnées en bas',
          visual: 'élément graphique subtil'
        },
        back: {
          content: 'services principaux',
          services: ['service 1', 'service 2'],
          branding: 'logo en filigrane'
        },
        colorScheme: {
          primary: formData.couleurPrimaire || '#1E40AF',
          secondary: formData.couleurSecondaire || '#DC2626',
          accent: '#F59E0B',
          text: '#1F2937'
        },
        typography: {
          name: 'Arial Bold',
          contact: 'Arial',
          details: 'Helvetica'
        },
        paper: {
          type: 'Carton mat',
          weight: '350g',
          finish: 'mat'
        },
        specialFeatures: ['logo embossé', 'vernis sélectif']
      }
    }
  }

  return {
    success: true,
    ...fallbackDesigns[designType] || fallbackDesigns[DESIGN_TYPES.AFFICHE],
    provider: 'fallback-generated',
    designType,
    generatedAt: new Date().toISOString()
  }
}

// Export des utilitaires (DESIGN_TYPES est déjà exporté plus haut)
export function getDesignTypeName(type) {
  const names = {
    [DESIGN_TYPES.LOGO]: 'Logo',
    [DESIGN_TYPES.AFFICHE]: 'Affiche Publicitaire',
    [DESIGN_TYPES.VISUEL_RESEAU]: 'Visuel Réseaux Sociaux',
    [DESIGN_TYPES.MAQUETTE_WEB]: 'Maquette Web',
    [DESIGN_TYPES.CARTE_VISITE]: 'Carte de Visite',
    [DESIGN_TYPES.BANNIERE]: 'Bannière Web',
    [DESIGN_TYPES.FLYER]: 'Flyer Promotionnel',
    [DESIGN_TYPES.BROCHURE]: 'Brochure',
    [DESIGN_TYPES.PRESENTATION]: 'Présentation',
    [DESIGN_TYPES.PACKAGING]: 'Packaging Produit'
  }
  return names[type] || 'Design'
}

export function getAvailableDesignTypes() {
  return [
    { id: DESIGN_TYPES.AFFICHE, name: 'Affiche Publicitaire', icon: '📢', description: 'Affiches impactantes pour campagnes' },
    { id: DESIGN_TYPES.VISUEL_RESEAU, name: 'Visuel Réseaux Sociaux', icon: '📱', description: 'Visuels optimisés pour Instagram, Facebook, etc.' },
    { id: DESIGN_TYPES.MAQUETTE_WEB, name: 'Maquette Web', icon: '🌐', description: 'Design de pages web et applications' },
    { id: DESIGN_TYPES.CARTE_VISITE, name: 'Carte de Visite', icon: '💳', description: 'Cartes professionnelles et identité' },
    { id: DESIGN_TYPES.BANNIERE, name: 'Bannière Web', icon: '🎨', description: 'Bannières publicitaires et headers' },
    { id: DESIGN_TYPES.FLYER, name: 'Flyer Promotionnel', icon: '📄', description: 'Flyers et documents promotionnels' },
    { id: DESIGN_TYPES.BROCHURE, name: 'Brochure', icon: '📖', description: 'Brochures multi-pages' },
    { id: DESIGN_TYPES.PRESENTATION, name: 'Présentation', icon: '📊', description: 'Présentations professionnelles' },
    { id: DESIGN_TYPES.PACKAGING, name: 'Packaging', icon: '📦', description: 'Design d\'emballage produit' }
  ]
}

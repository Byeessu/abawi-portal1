// Replicate API Client pour génération d'images
// Utilise Supabase Edge Function pour contourner le CORS

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || ''

// Edge Function URL
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/replicate-image`

// Fonction de repli directe vers Replicate API (CORS possible)
async function generateDirectReplicate(model, input) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Clé API Replicate manquante. Ajoutez VITE_REPLICATE_API_TOKEN dans .env')
  }

  try {
    const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model,
        input,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Replicate API direct error: ${error.message}`)
  }
}

const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

// Modèles disponibles - Images, Vidéos, Audio
export const REPLICATE_MODELS = [
  // Images
  { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', description: 'Image rapide et qualité', type: 'image' },
  { id: 'black-forest-labs/flux-dev', name: 'FLUX Dev', description: 'Image haute qualité', type: 'image' },
  { id: 'openai/gpt-image-2', name: 'GPT-Image 2', description: 'OpenAI - Qualité premium', type: 'image' },
  { id: 'stability-ai/stable-diffusion-3.5-large', name: 'SD 3.5 Large', description: 'Image détails riches', type: 'image' },
  { id: 'stability-ai/stable-diffusion-3.5-medium', name: 'SD 3.5 Medium', description: 'Image équilibré', type: 'image' },
  { id: 'recraft-ai/recraft-v3', name: 'Recraft v3', description: 'Design professionnel', type: 'image' },
  // Vidéos
  { id: 'alibaba/happyhorse-1.0', name: 'HappyHorse 1.0', description: 'Vidéo Alibaba', type: 'video' },
  { id: 'bytedance/seedance-2.0', name: 'Seedance 2.0', description: 'Vidéo ByteDance', type: 'video' },
  // Audio/TTS
  { id: 'google/gemini-3.1-flash-tts', name: 'Gemini TTS', description: 'Voix synthétique', type: 'audio' },
]

// Configurations par type de modèle
export const MODEL_CONFIGS = {
  image: {
    width: 1024,
    height: 1024,
    params: ['width', 'height', 'num_outputs']
  },
  video: {
    duration: 5,
    resolution: '1080p',
    aspect_ratio: '16:9',
    params: ['duration', 'resolution', 'aspect_ratio']
  },
  audio: {
    voice: 'Algenib',
    language_code: 'fr-FR',
    params: ['voice', 'language_code']
  }
}

// Fonction de génération unifiée pour images, vidéos et audio
export async function generateContent({ 
  prompt, 
  model = 'black-forest-labs/flux-schnell',
  width = 1024,
  height = 1024,
  numOutputs = 1,
  negativePrompt = '',
  // Vidéo
  duration = 5,
  resolution = '1080p',
  aspectRatio = '16:9',
  // Audio
  voice = 'Algenib',
  languageCode = 'fr-FR',
  generateAudio = false,
  // Options avancées
  seed = null,
  quality = 'auto',
  outputFormat = 'webp'
}) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Clé API Replicate manquante. Ajoutez VITE_REPLICATE_API_TOKEN dans .env')
  }

  // Détecter le type de modèle
  const modelInfo = REPLICATE_MODELS.find(m => m.id === model) || { type: 'image' }
  const modelType = modelInfo.type

  // Construire l'input selon le type
  let input = {}
  
  switch (modelType) {
    case 'video':
      input = {
        prompt,
        duration,
        resolution,
        aspect_ratio: aspectRatio,
        ...(seed !== null && { seed }),
        ...(generateAudio && { generate_audio: true }),
      }
      break
    
    case 'audio':
      input = {
        text: prompt,
        voice,
        language_code: languageCode,
        prompt: 'Say the following.',
      }
      break
    
    case 'image':
    default:
      // GPT-Image-2 a des paramètres spécifiques
      if (model === 'openai/gpt-image-2') {
        input = {
          prompt,
          quality,
          background: 'auto',
          moderation: 'auto',
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          number_of_images: numOutputs,
          output_compression: 90,
        }
      } else {
        // FLUX et autres modèles standards
        input = {
          prompt,
          negative_prompt: negativePrompt || undefined,
          width,
          height,
          num_outputs: numOutputs,
          aspect_ratio: width === height ? '1:1' : width > height ? '16:9' : '9:16',
        }
      }
      break
  }

  // Si Edge Function disponible, l'utiliser (contourne CORS)
  if (EDGE_FUNCTION_URL) {
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: model,
          input,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        // Si erreur 401/403, fallback direct vers Replicate
        if (response.status === 401 || response.status === 403) {
          // Fallback vers API directe si auth Edge Function échoue
          return await generateDirectReplicate(model, input)
        }
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (edgeError) {
      // Si erreur d'auth, essayer direct
      if (edgeError.message.includes('401') || edgeError.message.includes('403')) {
        return await generateDirectReplicate(model, input)
      }
      throw new Error(`Edge Function error: ${edgeError.message}`)
    }
  }

  throw new Error('Edge Function Supabase non disponible. Vérifiez VITE_SUPABASE_URL et déployez la function replicate-image.')
}

// Alias pour compatibilité
export async function generateImage(options) {
  return generateContent({ ...options, model: options.model || 'black-forest-labs/flux-schnell' })
}

export async function getPredictionResult(predictionId) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Clé API Replicate manquante')
  }

  // Si Edge Function disponible, l'utiliser
  if (EDGE_FUNCTION_URL) {
    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/predictions/${predictionId}`)

      if (!response.ok) {
        const error = await response.json()
        // Si erreur 401/403, fallback direct
        if (response.status === 401 || response.status === 403) {
          // Fallback vers API directe si auth Edge Function échoue
          return await getDirectPredictionResult(predictionId)
        }
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      // Normalize output format
      if (result.status === 'succeeded' && result.output) {
        if (typeof result.output === 'string') {
          result.output = [result.output]
        } else if (result.output.image) {
          result.output = [result.output.image]
        }
      }
      
      return result
    } catch (edgeError) {
      if (edgeError.message.includes('401') || edgeError.message.includes('403')) {
        return await getDirectPredictionResult(predictionId)
      }
    }
  }

  throw new Error('Edge Function Supabase non disponible')
}

// Fonction de repli directe pour récupérer les résultats
async function getDirectPredictionResult(predictionId) {
  try {
    const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    
    // Normalize output format
    if (result.status === 'succeeded' && result.output) {
      if (typeof result.output === 'string') {
        result.output = [result.output]
      } else if (result.output.image) {
        result.output = [result.output.image]
      }
    }
    
    return result
  } catch (error) {
    throw new Error(`Replicate API direct error: ${error.message}`)
  }
}

export async function pollPrediction(predictionId, onProgress) {
  const maxAttempts = 60 // 2 minutes max (2s interval)
  let attempts = 0

  while (attempts < maxAttempts) {
    const result = await getPredictionResult(predictionId)
    
    if (result.status === 'succeeded') {
      return result
    }
    
    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(`Génération échouée: ${result.error || 'Inconnue'}`)
    }

    onProgress?.(result.status, attempts + 1)
    
    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000))
    attempts++
  }

  throw new Error('Délai dépassé')
}

// Modèles spéciaux pour des cas d'usage spécifiques
export const SPECIALIZED_MODELS = {
  portrait: 'SG161222/RealVisXL_V4.0',
  anime: 'cjwbw/anything-v3-better-vae',
  realistic: 'SG161222/RealVisXL_V4.0',
  art: 'dall-e-3' // ou open-source équivalent
}

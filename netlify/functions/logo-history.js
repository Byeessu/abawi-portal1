// Simulation de base de données pour l'historique des logos
// En production, utiliser une vraie base de données comme MongoDB, PostgreSQL, etc.
const logoHistoryDB = new Map()

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  try {
    // Extraire l'ID utilisateur du contexte ou des headers
    const userId = extractUserId(event)
    
    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Utilisateur non authentifié',
          code: 'UNAUTHORIZED'
        })
      }
    }

    const path = event.path.replace(/\.netlify\/functions\/logo-history\/?/, '')
    const method = event.httpMethod

    // Router les requêtes
    if (method === 'GET' && !path) {
      return await getLogoHistory(userId, headers)
    } else if (method === 'POST' && !path) {
      return await saveLogoToHistory(userId, JSON.parse(event.body), headers)
    } else if (method === 'DELETE' && path) {
      const logoId = path.split('/')[0]
      return await deleteLogoFromHistory(userId, logoId, headers)
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Endpoint non trouvé',
          code: 'NOT_FOUND'
        })
      }
    }

  } catch (error) {
    console.error('Erreur logo-history:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur',
        code: 'SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

// Extraire l'ID utilisateur
function extractUserId(event) {
  // Essayer de récupérer depuis les headers (Authorization)
  const authHeader = event.headers.authorization || event.headers.Authorization
  
  if (authHeader) {
    try {
      // Simulation: extraire depuis un token JWT
      // En production, utiliser une vraie validation JWT
      const token = authHeader.replace('Bearer ', '')
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || payload.sub
    } catch (e) {
      console.warn('Token invalide:', e)
    }
  }
  
  // Fallback: utiliser un ID de session ou un ID généré
  const sessionHeader = event.headers['x-session-id'] || event.headers['X-Session-ID']
  if (sessionHeader) {
    return `session_${sessionHeader}`
  }
  
  // Dernier fallback: IP address
  const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'anonymous'
  return `ip_${clientIP.split(',')[0].trim()}`
}

// Récupérer l'historique des logos
async function getLogoHistory(userId, headers) {
  try {
    const userHistory = logoHistoryDB.get(userId) || []
    
    // Trier par date de création (plus récent en premier)
    const sortedHistory = userHistory.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    
    // Limiter à 50 résultats
    const limitedHistory = sortedHistory.slice(0, 50)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        logos: limitedHistory,
        total: userHistory.length
      })
    }
    
  } catch (error) {
    console.error('Erreur récupération historique:', error)
    throw error
  }
}

// Sauvegarder un logo dans l'historique
async function saveLogoToHistory(userId, logoData, headers) {
  try {
    // Validation des données
    if (!logoData.name || !logoData.style) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Données du logo invalides',
          code: 'INVALID_LOGO_DATA'
        })
      }
    }
    
    // Récupérer l'historique existant
    const userHistory = logoHistoryDB.get(userId) || []
    
    // Créer le nouvel enregistrement
    const newLogo = {
      id: generateLogoId(),
      ...logoData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Ajouter à l'historique
    userHistory.unshift(newLogo)
    
    // Limiter à 100 logos par utilisateur
    const limitedHistory = userHistory.slice(0, 100)
    
    // Sauvegarder
    logoHistoryDB.set(userId, limitedHistory)
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        logo: newLogo,
        message: 'Logo sauvegardé avec succès'
      })
    }
    
  } catch (error) {
    console.error('Erreur sauvegarde logo:', error)
    throw error
  }
}

// Supprimer un logo de l'historique
async function deleteLogoFromHistory(userId, logoId, headers) {
  try {
    const userHistory = logoHistoryDB.get(userId) || []
    
    const initialLength = userHistory.length
    const filteredHistory = userHistory.filter(logo => logo.id !== logoId)
    
    if (filteredHistory.length === initialLength) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Logo non trouvé',
          code: 'LOGO_NOT_FOUND'
        })
      }
    }
    
    logoHistoryDB.set(userId, filteredHistory)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Logo supprimé avec succès'
      })
    }
    
  } catch (error) {
    console.error('Erreur suppression logo:', error)
    throw error
  }
}

// Générer un ID unique pour le logo
function generateLogoId() {
  return `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

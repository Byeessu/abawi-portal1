/**
 * ABAWI AI ENGINE - Architecture Centralisée Robuste
 * 
 * Objectif :
 * - Une seule logique IA pour toute la plateforme
 * - Gestion centralisée des providers (Groq, OpenAI, etc.)
 * - Retry automatique avec exponential backoff
 * - Timeout control et abort signals
 * - Logs structurés et monitoring
 * - Fallback providers intelligents
 * - Erreurs standardisées et remontées
 * - Performance optimisée et memory safe
 * 
 * @version 2.0.0 - Production Ready
 */


// ========================================
// CONFIGURATION CENTRALISÉE
// ========================================

const ENGINE_CONFIG = {
  // Timeout global pour toutes les requêtes IA
  DEFAULT_TIMEOUT: 60000, // 60 secondes
  
  // Retry configuration avec exponential backoff
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 1000, // 1 seconde
  MAX_RETRY_DELAY: 10000, // 10 secondes max
  
  // Provider priority order
  PROVIDER_PRIORITY: ['groq', 'openai', 'anthropic'],
  
  // Logging
  LOG_LEVEL: import.meta.env.PROD ? 'warn' : 'info',
  ENABLE_PERFORMANCE_LOGS: !import.meta.env.PROD,
  
  // Cache configuration
  ENABLE_CACHE: true,
  CACHE_TTL: 300000, // 5 minutes
  MAX_CACHE_SIZE: 100, // Max 100 réponses en cache
}

// ========================================
// SYSTÈME DE LOGGING STRUCTURÉ
// ========================================

class Logger {
  constructor(level = 'info') {
    this.level = level
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }

    if (this.shouldLog(level)) {
      console.log(`[ABAWI-AI] ${level.toUpperCase()}: ${message}`, data || '')
    }

    // Stocker les logs critiques
    if (level === 'error' || level === 'critical') {
      this.storeCriticalLog(logEntry)
    }
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 }
    return levels[level] >= levels[this.level]
  }

  storeCriticalLog(logEntry) {
    try {
      const criticalLogs = JSON.parse(localStorage.getItem('abawi_critical_logs') || '[]')
      criticalLogs.push(logEntry)
      // Garder seulement les 100 derniers logs critiques
      if (criticalLogs.length > 100) {
        criticalLogs.splice(0, criticalLogs.length - 100)
      }
      localStorage.setItem('abawi_critical_logs', JSON.stringify(criticalLogs))
    } catch (e) {
      console.warn('Impossible de stocker le log critique:', e)
    }
  }

  debug(message, data) { this.log('debug', message, data) }
  info(message, data) { this.log('info', message, data) }
  warn(message, data) { this.log('warn', message, data) }
  error(message, data) { this.log('error', message, data) }
  critical(message, data) { this.log('critical', message, data) }
}

// ========================================
// GESTION DE CACHE INTELLIGENT
// ========================================

class CacheManager {
  constructor(maxSize = 100, ttl = 300000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  generateKey(prompt, provider, model) {
    // Créer une clé unique basée sur le prompt hash + provider + model
    const hash = this.simpleHash(`${prompt}|${provider}|${model}`)
    return `${provider}:${model}:${hash}`
  }

  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.content
  }

  set(key, content) {
    // Nettoyer si le cache est plein
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}

// ========================================
// PROVIDERS IA ABSTRAITS
// ========================================

class AIProvider {
  constructor(name, config) {
    this.name = name
    this.config = config
    this.stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0
    }
  }

  async testConnection() {
    throw new Error('testConnection() doit être implémenté par le provider')
  }

  async generate(prompt, options = {}) {
    throw new Error('generate() doit être implémenté par le provider')
  }

  buildHeaders() {
    return {
      'Content-Type': 'application/json'
    }
  }

  updateStats(responseTime, success) {
    this.stats.requests++
    if (success) {
      this.stats.successes++
    } else {
      this.stats.failures++
    }

    // Mettre à jour le temps de réponse moyen
    const totalResponseTime = this.stats.avgResponseTime * (this.stats.requests - 1) + responseTime
    this.stats.avgResponseTime = totalResponseTime / this.stats.requests
  }
}

// ========================================
// PROVIDER GROQ
// ========================================

class GroqProvider extends AIProvider {
  constructor() {
    super('groq', {
      apiKey: import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY,
      baseUrl: import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
    })
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async generate(prompt, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ENGINE_CONFIG.DEFAULT_TIMEOUT)

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || this.config.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert professionnel spécialisé dans les documents d\'affaires africains. Sois précis, structuré et adapté au contexte local.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature || 0.1,
          max_tokens: options.maxTokens || 4000
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      return {
        content: content.trim(),
        model: data.model,
        usage: data.usage,
        provider: this.name
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}

// ========================================
// ENGINE PRINCIPAL
// ========================================

class AbawiAIEngine {
  constructor() {
    this.logger = new Logger(ENGINE_CONFIG.LOG_LEVEL)
    this.cache = new CacheManager(ENGINE_CONFIG.MAX_CACHE_SIZE, ENGINE_CONFIG.CACHE_TTL)
    this.providers = new Map()
    this.activeProvider = null
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      errors: 0
    }

    // Initialiser les providers
    this.initializeProviders()
  }

  async initializeProviders() {
    // Ajouter Groq provider
    const groqProvider = new GroqProvider()
    this.providers.set('groq', groqProvider)

    // Tester les providers et sélectionner le meilleur
    await this.selectBestProvider()
  }

  async selectBestProvider() {
    for (const providerName of ENGINE_CONFIG.PROVIDER_PRIORITY) {
      const provider = this.providers.get(providerName)
      if (provider && await provider.testConnection()) {
        this.activeProvider = provider
        this.logger.info(`Provider sélectionné: ${providerName}`)
        return
      }
    }

    throw new Error('Aucun provider IA disponible')
  }

  async retryWithBackoff(fn, maxRetries = ENGINE_CONFIG.MAX_RETRIES) {
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        this.logger.warn(`Tentative ${attempt} échouée`, { error: error.message })

        if (attempt < maxRetries) {
          const delay = Math.min(
            ENGINE_CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt - 1),
            ENGINE_CONFIG.MAX_RETRY_DELAY
          )
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  standardizeError(error) {
    if (error.name === 'AbortError') {
      return {
        type: 'timeout',
        message: 'La requête IA a expiré',
        original: error
      }
    }

    if (error.message.includes('API')) {
      return {
        type: 'api_error',
        message: 'Erreur de l\'API IA',
        original: error
      }
    }

    return {
      type: 'unknown',
      message: 'Erreur inconnue',
      original: error
    }
  }

  async generate({ tool, data, options = {} }) {
    const startTime = Date.now()
    this.stats.totalRequests++

    try {
      if (!this.activeProvider) {
        await this.selectBestProvider()
      }

      // Construire le prompt
      const prompt = this.buildPrompt(tool, data)
      
      // Vérifier le cache
      const cacheKey = this.cache.generateKey(prompt, this.activeProvider.name, options.model)
      if (ENGINE_CONFIG.ENABLE_CACHE) {
        const cached = this.cache.get(cacheKey)
        if (cached) {
          this.stats.cacheHits++
          return {
            success: true,
            content: cached,
            cached: true,
            provider: this.activeProvider.name,
            generatedAt: new Date().toISOString()
          }
        }
      }

      // Générer avec retry automatique
      const result = await this.retryWithBackoff(async () => {
        return await this.activeProvider.generate(prompt, options)
      })

      // Mettre en cache
      if (ENGINE_CONFIG.ENABLE_CACHE) {
        this.cache.set(cacheKey, result.content)
      }

      const responseTime = Date.now() - startTime
      this.activeProvider.updateStats(responseTime, true)

      this.logger.info('Génération réussie', {
        tool,
        provider: this.activeProvider.name,
        responseTime,
        cached: false
      })

      return {
        success: true,
        content: result.content,
        provider: this.activeProvider.name,
        model: result.model,
        usage: result.usage,
        generatedAt: new Date().toISOString(),
        cached: false
      }

    } catch (error) {
      this.stats.errors++
      const responseTime = Date.now() - startTime
      this.activeProvider?.updateStats(responseTime, false)

      const standardError = this.standardizeError(error)
      this.logger.error('Échec génération IA', {
        tool,
        error: standardError,
        provider: this.activeProvider?.name || 'none',
        generatedAt: new Date().toISOString()
      })

      return {
        success: false,
        error: standardError.message,
        provider: this.activeProvider?.name || 'none',
        generatedAt: new Date().toISOString()
      }
    }
  }

  buildPrompt(tool, data) {
    const prompts = {
      business: `Crée un business plan professionnel complet pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif
2. Analyse de Marché
3. Stratégie Marketing
4. Opérations
5. Projections Financières
6. Analyse de Risques

Sois précis, professionnel et adapté au contexte africain.`,

      finance: `Réalise une analyse financière complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif Financier
2. Analyse des Comptes de Résultat
3. Analyse du Bilan
4. Ratios Financiers Clés
5. Analyse de Rentabilité
6. Recommandations Stratégiques
7. Projections et Prévisions

Sois précis, professionnel et adapté au contexte africain.`,

      consultant: `Crée une proposition commerciale complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif
2. Compréhension du Besoin Client
3. Approche Méthodologique
4. Livrables et Résultats Attendus
5. Planning et Calendrier
6. Équipe Consultante
7. Coûts et Modalités
8. Valeur Ajoutée

Sois précis, professionnel et persuasif.`,

      comptable: `Réalise une analyse comptable complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif Comptable
2. Analyse des Écritures Comptables
3. Vérification de la Conformité
4. Analyse des Soldes Intermédiaires
5. Recommandations d'Ajustement
6. Rapport Final

Sois précis, professionnel et adapté aux normes comptables OHADA.`,

      rh: `Crée une analyse RH complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif RH
2. Analyse des Effectifs
3. Gestion de la Paie
4. Évaluation des Compétences
5. Plan de Formation
6. Recommandations RH

Sois précis, professionnel et adapté au contexte sénégalais.`,

      immobilier: `Réalise une analyse immobilière complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif Immobilier
2. Analyse du Marché Local
3. Évaluation du Bien
4. Calcul de Rentabilité
5. Analyse de Financement
6. Recommandations

Sois précis, professionnel et adapté au marché immobilier africain.`,

      juridique: `Crée une analyse juridique complète et professionnelle pour : ${JSON.stringify(data)}
        
Structure ta réponse en sections claires :
1. Résumé Exécutif Juridique
2. Cadre Légal Applicable
3. Analyse des Risques Juridiques
4. Recommandations de Conformité
5. Documentation Requise

Sois précis, professionnel et adapté au droit OHADA.`,

      business_plan: `Crée un business plan détaillé pour la section "${data.section}" avec les données : ${JSON.stringify(data.form)}
        
Documents sources : ${data.source || 'Aucun'}

Sois exhaustif, professionnel et adapté au contexte africain. Génère du JSON valide uniquement.`
    }

    return prompts[tool] || prompts.business
  }

  getStats() {
    return {
      engine: this.stats,
      providers: Array.from(this.providers.entries()).map(([name, provider]) => ({
        name,
        stats: provider.stats,
        active: provider === this.activeProvider
      })),
      cache: {
        size: this.cache.cache.size,
        maxSize: this.cache.maxSize
      }
    }
  }

  clearCache() {
    this.cache.clear()
    this.logger.info('Cache vidé')
  }

  getCriticalLogs() {
    try {
      return JSON.parse(localStorage.getItem('abawi_critical_logs') || '[]')
    } catch (e) {
      this.logger.warn('Impossible de lire les logs critiques', e)
      return []
    }
  }
}

// ========================================
// INSTANCE GLOBALE SINGLETON
// ========================================

const abawiAIEngine = new AbawiAIEngine()

export default abawiAIEngine
export { ENGINE_CONFIG, Logger, CacheManager, AIProvider, GroqProvider }

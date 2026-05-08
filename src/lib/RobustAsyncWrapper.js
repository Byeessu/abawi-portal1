/**
 * ABAWI ROBUST ASYNC WRAPPER
 * 
 * Objectif :
 * - Wrapper sécurisé pour toutes les opérations async
 * - Gestion centralisée des erreurs et timeouts
 * - Retry intelligent avec exponential backoff
 * - Memory leak prevention
 * - Performance monitoring
 * - Abort signal support
 * - Error boundaries pour async operations
 * 
 * @version 1.0.0 - Production Ready
 */

// ========================================
// CONFIGURATION
// ========================================

const ASYNC_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 secondes
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 1000, // 1 seconde
  MAX_RETRY_DELAY: 8000, // 8 secondes max
  ENABLE_PERFORMANCE_LOGS: !import.meta.env.PROD,
  MEMORY_CLEANUP_INTERVAL: 60000, // 1 minute
  MAX_CONCURRENT_OPERATIONS: 10
}

// ========================================
// PERFORMANCE MONITOR
// ========================================

class PerformanceMonitor {
  constructor() {
    this.operations = new Map()
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageDuration: 0,
      memoryUsage: 0
    }
    
    // Nettoyage périodique
    setInterval(() => this.cleanup(), ASYNC_CONFIG.MEMORY_CLEANUP_INTERVAL)
  }

  startOperation(operationId, metadata = {}) {
    this.operations.set(operationId, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage(),
      metadata
    })
    
    this.stats.totalOperations++
  }

  endOperation(operationId, success = true, error = null) {
    const operation = this.operations.get(operationId)
    if (!operation) return

    const duration = performance.now() - operation.startTime
    const endMemory = this.getMemoryUsage()
    const memoryDelta = endMemory - operation.startMemory

    // Mettre à jour les stats
    if (success) {
      this.stats.successfulOperations++
    } else {
      this.stats.failedOperations++
    }

    // Mettre à jour la durée moyenne
    const totalDuration = this.stats.averageDuration * (this.stats.totalOperations - 1) + duration
    this.stats.averageDuration = Math.round(totalDuration / this.stats.totalOperations)

    // Logger si activé
    if (ASYNC_CONFIG.ENABLE_PERFORMANCE_LOGS) {
      console.log(`[PERF] Opération ${operationId}: ${duration}ms (${success ? 'succès' : 'échec'}) - Memory: ${memoryDelta}MB`)
    }

    // Nettoyer
    this.operations.delete(operationId)
  }

  getMemoryUsage() {
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1048576) // MB
    }
    return 0
  }

  cleanup() {
    // Nettoyer les opérations orphelines (plus de 5 minutes)
    const now = performance.now()
    for (const [id, operation] of this.operations) {
      if (now - operation.startTime > 300000) { // 5 minutes
        this.operations.delete(id)
        console.warn(`[PERF] Opération orpheline nettoyée: ${id}`)
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      activeOperations: this.operations.size,
      memoryUsage: this.getMemoryUsage()
    }
  }
}

// ========================================
// ERROR BOUNDARY FOR ASYNC
// ========================================

class AsyncErrorBoundary {
  constructor() {
    this.errorHandlers = new Map()
    this.fallbackHandlers = new Map()
  }

  registerHandler(operationType, errorHandler, fallbackHandler = null) {
    this.errorHandlers.set(operationType, errorHandler)
    if (fallbackHandler) {
      this.fallbackHandlers.set(operationType, fallbackHandler)
    }
  }

  async execute(operationType, operation, ...args) {
    const operationId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      return await operation(...args)
    } catch (error) {
      console.error(`[ASYNC_ERROR] ${operationType}:`, error)
      
      // Essayer le handler d'erreur spécifique
      const errorHandler = this.errorHandlers.get(operationType)
      if (errorHandler) {
        try {
          const result = await errorHandler(error, ...args)
          if (result !== undefined) {
            return result
          }
        } catch (handlerError) {
          console.error(`[ASYNC_ERROR] Handler error pour ${operationType}:`, handlerError)
        }
      }
      
      // Essayer le fallback
      const fallbackHandler = this.fallbackHandlers.get(operationType)
      if (fallbackHandler) {
        try {
          const fallbackResult = await fallbackHandler(error, ...args)
          if (fallbackResult !== undefined) {
            return fallbackResult
          }
        } catch (fallbackError) {
          console.error(`[ASYNC_ERROR] Fallback error pour ${operationType}:`, fallbackError)
        }
      }
      
      // Relancer l'erreur si aucun handler n'a fonctionné
      throw error
    }
  }
}

// ========================================
// MAIN ROBUST ASYNC WRAPPER
// ========================================

class RobustAsyncWrapper {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor()
    this.errorBoundary = new AsyncErrorBoundary()
    this.activeOperations = new Set()
    this.operationQueue = []
    this.maxConcurrent = ASYNC_CONFIG.MAX_CONCURRENT_OPERATIONS
    
    // Enregistrer les handlers par défaut
    this.registerDefaultHandlers()
  }

  registerDefaultHandlers() {
    // Handler pour les erreurs réseau
    this.errorBoundary.registerHandler('network', async (error, ...args) => {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('[ASYNC] Erreur réseau détectée, tentative de reconnexion...')
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 2000))
        // Retenter l'opération
        return await this.execute(...args)
      }
    })

    // Handler pour les timeouts
    this.errorBoundary.registerHandler('timeout', async (error, ...args) => {
      if (error.name === 'AbortError') {
        console.warn('[ASYNC] Timeout détecté, tentative avec timeout augmenté...')
        // Retenter avec un timeout plus long
        const [operation, options] = args
        const newOptions = { ...options, timeout: (options.timeout || ASYNC_CONFIG.DEFAULT_TIMEOUT) * 2 }
        return await this.execute(operation, newOptions)
      }
    })

    // Handler pour les erreurs de mémoire
    this.errorBoundary.registerHandler('memory', async (error, ...args) => {
      if (error.message.includes('out of memory') || error.message.includes('Maximum call stack')) {
        console.warn('[ASYNC] Erreur mémoire détectée, nettoyage et retry...')
        // Forcer le garbage collection
        if (window.gc) {
          window.gc()
        }
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Retenter
        return await this.execute(...args)
      }
    })
  }

  async execute(operation, options = {}) {
    const {
      timeout = ASYNC_CONFIG.DEFAULT_TIMEOUT,
      retries = ASYNC_CONFIG.MAX_RETRIES,
      operationType = 'default',
      metadata = {},
      onProgress = null,
      priority = 'normal'
    } = options

    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Vérifier la limite de concurrence
    if (this.activeOperations.size >= this.maxConcurrent) {
      console.warn(`[ASYNC] Limite de concurrence atteinte (${this.maxConcurrent}), mise en file d'attente`)
      return await this.queueOperation(operationId, operation, options)
    }

    this.activeOperations.add(operationId)
    this.performanceMonitor.startOperation(operationId, metadata)

    try {
      const result = await this.errorBoundary.execute(operationType, async () => {
        return await this.executeWithRetry(operation, { timeout, retries, onProgress })
      })

      this.performanceMonitor.endOperation(operationId, true)
      return result
    } catch (error) {
      this.performanceMonitor.endOperation(operationId, false, error)
      throw error
    } finally {
      this.activeOperations.delete(operationId)
      this.processQueue()
    }
  }

  async executeWithRetry(operation, { timeout, retries, onProgress }) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Notifier le progrès
        if (onProgress) {
          onProgress({ attempt: attempt + 1, maxAttempts: retries + 1 })
        }

        // Créer une promesse avec timeout
        const result = await Promise.race([
          operation(controller.signal),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          })
        ])

        clearTimeout(timeoutId)
        return result
      } catch (error) {
        clearTimeout(timeoutId)
        lastError = error

        // Si c'est la dernière tentative, relancer l'erreur
        if (attempt === retries) {
          throw error
        }

        // Calculer le délai de retry avec exponential backoff
        const delay = Math.min(
          ASYNC_CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt),
          ASYNC_CONFIG.MAX_RETRY_DELAY
        )

        console.warn(`[ASYNC] Tentative ${attempt + 1}/${retries + 1} échouée, retry dans ${delay}ms:`, error.message)
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  async queueOperation(operationId, operation, options) {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({
        operationId,
        operation,
        options,
        resolve,
        reject
      })
    })
  }

  processQueue() {
    if (this.operationQueue.length === 0 || this.activeOperations.size >= this.maxConcurrent) {
      return
    }

    const queued = this.operationQueue.shift()
    this.execute(queued.operation, queued.options)
      .then(queued.resolve)
      .catch(queued.reject)
  }

  // Méthodes utilitaires
  async fetchWithRetry(url, options = {}) {
    return this.execute(
      async (signal) => {
        const response = await fetch(url, { ...options, signal })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response
      },
      { 
        operationType: 'network',
        timeout: options.timeout || ASYNC_CONFIG.DEFAULT_TIMEOUT,
        retries: options.retries || ASYNC_CONFIG.MAX_RETRIES
      }
    )
  }

  async timeoutPromise(promise, timeout = ASYNC_CONFIG.DEFAULT_TIMEOUT) {
    return this.execute(
      async (signal) => {
        return await Promise.race([
          promise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Promise timeout')), timeout)
          })
        ])
      },
      { 
        operationType: 'timeout',
        timeout,
        retries: 0 // Pas de retry pour les timeouts
      }
    )
  }

  async memorySafeOperation(operation, options = {}) {
    return this.execute(
      async (signal) => {
        // Vérifier l'utilisation mémoire avant
        const memoryBefore = this.performanceMonitor.getMemoryUsage()
        
        if (memoryBefore > 500) { // 500MB limite
          console.warn('[ASYNC] Mémoire élevée détectée, forçage GC...')
          if (window.gc) {
            window.gc()
          }
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const result = await operation(signal)
        
        // Vérifier après l'opération
        const memoryAfter = this.performanceMonitor.getMemoryUsage()
        if (memoryAfter - memoryBefore > 100) { // 100MB d'augmentation
          console.warn('[ASYNC] Fuite mémoire potentielle détectée')
        }

        return result
      },
      { 
        operationType: 'memory',
        ...options
      }
    )
  }

  // Méthodes de monitoring
  getStats() {
    return {
      performance: this.performanceMonitor.getStats(),
      concurrency: {
        active: this.activeOperations.size,
        max: this.maxConcurrent,
        queued: this.operationQueue.length
      }
    }
  }

  clearQueue() {
    this.operationQueue.forEach(item => {
      item.reject(new Error('Operation annulée (queue vidée)'))
    })
    this.operationQueue = []
  }

  // Nettoyage
  destroy() {
    this.clearQueue()
    this.activeOperations.clear()
    console.log('[ASYNC] RobustAsyncWrapper détruit')
  }
}

// ========================================
// INSTANCE GLOBALE
// ========================================

const robustAsync = new RobustAsyncWrapper()

export default robustAsync
export { ASYNC_CONFIG, PerformanceMonitor, AsyncErrorBoundary, RobustAsyncWrapper }

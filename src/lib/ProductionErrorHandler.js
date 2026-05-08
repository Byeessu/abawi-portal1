/**
 * ABAWI PRODUCTION ERROR HANDLER
 * 
 * Objectif :
 * - Gestion centralisée des erreurs en production
 * - Error boundaries globaux
 * - Crash prevention et recovery
 * - Logging structuré et monitoring
 * - User feedback et reporting
 * - Automatic retry avec fallback
 * - Performance impact monitoring
 * 
 * @version 1.0.0 - Production Ready
 */

import React from 'react'

// ========================================
// ERROR CLASSIFICATION
// ========================================

const ERROR_SEVERITY = {
  CRITICAL: 'critical',    // Crash l'application
  HIGH: 'high',          // Fonctionnalité majeure cassée
  MEDIUM: 'medium',      // Fonctionnalité mineure cassée
  LOW: 'low',           // Problème non bloquant
  INFO: 'info'           // Information
}

const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AI_GENERATION: 'ai_generation',
  EXPORT: 'export',
  MEDIA: 'media',
  PERMISSION: 'permission',
  MEMORY: 'memory',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  UNKNOWN: 'unknown'
}

const ERROR_CONTEXTS = {
  USER_ACTION: 'user_action',
  SYSTEM_INIT: 'system_init',
  BACKGROUND_JOB: 'background_job',
  ASYNC_OPERATION: 'async_operation',
  COMPONENT_RENDER: 'component_render',
  EVENT_HANDLER: 'event_handler'
}

// ========================================
// ERROR METADATA COLLECTOR
// ========================================

class ErrorMetadataCollector {
  constructor() {
    this.userAgent = navigator.userAgent
    this.url = window.location.href
    this.timestamp = Date.now()
    this.sessionId = this.generateSessionId()
    this.errorCount = 0
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  collect(error, context = {}) {
    this.errorCount++
    
    return {
      id: `error_${this.errorCount}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      severity: context.severity || ERROR_SEVERITY.MEDIUM,
      category: context.category || ERROR_CATEGORIES.UNKNOWN,
      context: context.context || ERROR_CONTEXTS.UNKNOWN,
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      userAgent: this.userAgent,
      url: this.url,
      memory: this.getMemoryInfo(),
      performance: this.getPerformanceInfo(),
      userAction: context.userAction || null,
      retryCount: context.retryCount || 0,
      additionalData: context.additionalData || {}
    }
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  }

  getPerformanceInfo() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        return {
          loadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          firstPaint: navigation.responseStart - navigation.navigationStart
        }
      }
    } catch (e) {
      // Ignorer les erreurs de performance
    }
    return null
  }
}

// ========================================
// ERROR RECOVERY STRATEGIES
// ========================================

class ErrorRecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map()
    this.setupDefaultStrategies()
  }

  setupDefaultStrategies() {
    // Stratégie de retry pour les erreurs réseau
    this.recoveryStrategies.set(ERROR_CATEGORIES.NETWORK, {
      canRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      actions: ['retry', 'fallback', 'notify_user']
    })

    // Stratégie pour les erreurs de génération IA
    this.recoveryStrategies.set(ERROR_CATEGORIES.AI_GENERATION, {
      canRetry: true,
      maxRetries: 2,
      retryDelay: 2000,
      backoffMultiplier: 1.5,
      actions: ['retry', 'fallback_provider', 'notify_user']
    })

    // Stratégie pour les erreurs d'export
    this.recoveryStrategies.set(ERROR_CATEGORIES.EXPORT, {
      canRetry: true,
      maxRetries: 2,
      retryDelay: 1500,
      backoffMultiplier: 1.5,
      actions: ['retry', 'fallback_method', 'notify_user']
    })

    // Stratégie pour les erreurs de média
    this.recoveryStrategies.set(ERROR_CATEGORIES.MEDIA, {
      canRetry: false,
      maxRetries: 0,
      actions: ['request_permission', 'fallback_method', 'notify_user']
    })

    // Stratégie pour les erreurs de mémoire
    this.recoveryStrategies.set(ERROR_CATEGORIES.MEMORY, {
      canRetry: true,
      maxRetries: 1,
      retryDelay: 5000,
      actions: ['cleanup_memory', 'retry', 'notify_user']
    })
  }

  getStrategy(category) {
    return this.recoveryStrategies.get(category) || {
      canRetry: false,
      maxRetries: 0,
      actions: ['notify_user']
    }
  }

  async executeRecovery(error, strategy, context = {}) {
    const results = []
    
    for (const action of strategy.actions) {
      try {
        const result = await this.executeAction(action, error, context)
        results.push({ action, success: true, result })
      } catch (actionError) {
        results.push({ action, success: false, error: actionError.message })
      }
    }

    return results
  }

  async executeAction(action, error, context) {
    switch (action) {
      case 'retry':
        return await this.executeRetry(error, context)
      
      case 'fallback':
        return await this.executeFallback(error, context)
      
      case 'fallback_provider':
        return await this.executeFallbackProvider(error, context)
      
      case 'fallback_method':
        return await this.executeFallbackMethod(error, context)
      
      case 'request_permission':
        return await this.requestPermission(error, context)
      
      case 'cleanup_memory':
        return await this.cleanupMemory(error, context)
      
      case 'notify_user':
        return await this.notifyUser(error, context)
      
      default:
        throw new Error(`Action de récupération inconnue: ${action}`)
    }
  }

  async executeRetry(error, context) {
    if (context.retryFunction && typeof context.retryFunction === 'function') {
      return await context.retryFunction()
    }
    throw new Error('Fonction de retry non fournie')
  }

  async executeFallback(error, context) {
    if (context.fallbackFunction && typeof context.fallbackFunction === 'function') {
      return await context.fallbackFunction()
    }
    throw new Error('Fonction fallback non fournie')
  }

  async executeFallbackProvider(error, context) {
    // Notifier le système de changer de provider IA
    window.dispatchEvent(new CustomEvent('aiProviderFallback', {
      detail: { error, context }
    }))
    return { action: 'provider_fallback_triggered' }
  }

  async executeFallbackMethod(error, context) {
    // Essayer une méthode alternative d'export
    if (context.fallbackMethod === 'print') {
      window.print()
      return { action: 'print_fallback_triggered' }
    }
    throw new Error('Méthode fallback non spécifiée')
  }

  async requestPermission(error, context) {
    if (context.permissionRequest) {
      return await context.permissionRequest()
    }
    throw new Error('Request permission non spécifié')
  }

  async cleanupMemory(error, context) {
    // Forcer le garbage collection si disponible
    if (window.gc) {
      window.gc()
    }
    
    // Nettoyer les timeouts et intervals
    const highestTimeoutId = setTimeout(() => {}, 0)
    for (let i = 1; i <= highestTimeoutId; i++) {
      clearTimeout(i)
    }
    
    return { action: 'memory_cleanup_executed' }
  }

  async notifyUser(error, context) {
    const userMessage = this.generateUserMessage(error, context)
    
    // Afficher une notification utilisateur
    if (context.showToast && typeof context.showToast === 'function') {
      context.showToast(userMessage, 'error')
    } else {
      // Fallback: alert
      console.error('[USER ERROR]', userMessage)
    }
    
    return { action: 'user_notified', message: userMessage }
  }

  generateUserMessage(error, context) {
    const messages = {
      [ERROR_CATEGORIES.NETWORK]: 'Erreur de connexion détectée. Vérifiez votre connexion internet.',
      [ERROR_CATEGORIES.AI_GENERATION]: 'Le service IA est temporairement indisponible. Veuillez réessayer plus tard.',
      [ERROR_CATEGORIES.EXPORT]: 'L\'export a échoué. Essayez avec un format différent ou rechargez la page.',
      [ERROR_CATEGORIES.MEDIA]: 'L\'accès à la caméra/micro est requis. Veuillez autoriser l\'accès.',
      [ERROR_CATEGORIES.MEMORY]: 'Mémoire insuffisante. Veuillez fermer d\'autres onglets.',
      [ERROR_CATEGORIES.PERMISSION]: 'Permission requise. Veuillez autoriser l\'accès dans les paramètres du navigateur.',
      [ERROR_CATEGORIES.VALIDATION]: 'Données invalides. Veuillez vérifier les informations saisies.',
      [ERROR_CATEGORIES.AUTHENTICATION]: 'Session expirée. Veuillez vous reconnecter.'
    }

    return messages[error.category] || error.message || 'Une erreur est survenue.'
  }
}

// ========================================
// PRODUCTION ERROR HANDLER
// ========================================

class ProductionErrorHandler {
  constructor() {
    this.metadataCollector = new ErrorMetadataCollector()
    this.recoveryManager = new ErrorRecoveryManager()
    this.errorLog = []
    this.maxLogSize = 1000
    this.isInitialized = false
    
    this.initialize()
  }

  async initialize() {
    if (this.isInitialized) return
    
    // Configurer les gestionnaires d'erreurs globaux
    this.setupGlobalHandlers()
    
    // Configurer les error boundaries React
    this.setupReactErrorBoundary()
    
    // Configurer les gestionnaires d'événements
    this.setupEventHandlers()
    
    this.isInitialized = true
    console.log('[ERROR_HANDLER] Production Error Handler initialisé')
  }

  setupGlobalHandlers() {
    // Gestionnaire d'erreurs non capturées
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        context: ERROR_CONTEXTS.EVENT_HANDLER,
        category: ERROR_CATEGORIES.UNKNOWN,
        severity: ERROR_SEVERITY.HIGH,
        component: 'global',
        action: 'uncaught_error'
      })
    })

    // Gestionnaire de promesses rejetées non capturées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        context: ERROR_CONTEXTS.ASYNC_OPERATION,
        category: ERROR_CATEGORIES.UNKNOWN,
        severity: ERROR_SEVERITY.HIGH,
        component: 'global',
        action: 'unhandled_promise_rejection'
      })
    })
  }

  setupReactErrorBoundary() {
    // Surveiller les erreurs React (si disponible)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // En développement, React DevTools est disponible
      console.info('[ERROR_HANDLER] React DevTools détecté')
    }
  }

  setupEventHandlers() {
    // Surveiller les erreurs de chargement de ressources
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(new Error(`Ressource non chargée: ${event.target.src || event.target.href}`), {
          context: ERROR_CONTEXTS.SYSTEM_INIT,
          category: ERROR_CATEGORIES.NETWORK,
          severity: ERROR_SEVERITY.LOW,
          component: 'resource_loader',
          action: 'resource_load_error',
          additionalData: {
            resourceType: event.target.tagName,
            resourceUrl: event.target.src || event.target.href
          }
        })
      }
    }, true)
  }

  async handleError(error, context = {}) {
    try {
      // Collecter les métadonnées de l'erreur
      const errorMetadata = this.metadataCollector.collect(error, context)
      
      // Ajouter au log
      this.addToErrorLog(errorMetadata)
      
      // Logger l'erreur
      this.logError(errorMetadata)
      
      // Exécuter la stratégie de récupération
      const strategy = this.recoveryManager.getStrategy(errorMetadata.category)
      const recoveryResults = await this.recoveryManager.executeRecovery(errorMetadata, strategy, context)
      
      // Notifier les systèmes externes si nécessaire
      if (errorMetadata.severity === ERROR_SEVERITY.CRITICAL) {
        this.notifyCriticalError(errorMetadata, recoveryResults)
      }
      
      return {
        handled: true,
        metadata: errorMetadata,
        strategy,
        recoveryResults
      }
      
    } catch (handlingError) {
      console.error('[ERROR_HANDLER] Erreur dans le gestionnaire d\'erreurs:', handlingError)
      
      // Fallback: logger l'erreur originale
      console.error('[ERROR_HANDLER] Erreur originale:', error)
      
      return {
        handled: false,
        error: handlingError,
        originalError: error
      }
    }
  }

  addToErrorLog(errorMetadata) {
    this.errorLog.push(errorMetadata)
    
    // Limiter la taille du log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }
    
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem('abawi_error_log', JSON.stringify(this.errorLog))
    } catch (e) {
      console.warn('[ERROR_HANDLER] Impossible de sauvegarder le log d\'erreurs:', e)
    }
  }

  logError(errorMetadata) {
    const logLevel = this.getLogLevel(errorMetadata.severity)
    const logMessage = this.formatLogMessage(errorMetadata)
    
    console[logLevel](`[ABAWI_ERROR] ${logMessage}`, errorMetadata)
  }

  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'error'
      case ERROR_SEVERITY.HIGH:
        return 'error'
      case ERROR_SEVERITY.MEDIUM:
        return 'warn'
      case ERROR_SEVERITY.LOW:
        return 'warn'
      case ERROR_SEVERITY.INFO:
        return 'info'
      default:
        return 'log'
    }
  }

  formatLogMessage(errorMetadata) {
    return `${errorMetadata.category.toUpperCase()} - ${errorMetadata.context} - ${errorMetadata.component}:${errorMetadata.action} - ${errorMetadata.message}`
  }

  async notifyCriticalError(errorMetadata, recoveryResults) {
    try {
      // Envoyer à un service de monitoring (configurable)
      if (window.ABAWI_CONFIG?.monitoring?.endpoint) {
        await fetch(window.ABAWI_CONFIG.monitoring.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': window.ABAWI_CONFIG.monitoring?.apiKey || ''
          },
          body: JSON.stringify({
            error: errorMetadata,
            recovery: recoveryResults,
            timestamp: new Date().toISOString()
          })
        })
      }
      
      // Afficher une alerte critique à l'utilisateur
      if (errorMetadata.severity === ERROR_SEVERITY.CRITICAL) {
        this.showCriticalErrorAlert(errorMetadata)
      }
      
    } catch (monitoringError) {
      console.warn('[ERROR_HANDLER] Impossible de notifier l\'erreur critique:', monitoringError)
    }
  }

  showCriticalErrorAlert(errorMetadata) {
    // Créer une alerte non intrusive
    const alert = document.createElement('div')
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `
    
    alert.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">⚠️ Erreur Critique</div>
      <div style="font-size: 12px; opacity: 0.9;">Une erreur critique est survenue. L'équipe a été notifiée.</div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 8px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        color: white;
        font-size: 12px;
        cursor: pointer;
      ">Fermer</button>
    `
    
    document.body.appendChild(alert)
    
    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove()
      }
    }, 10000)
  }

  // Méthodes publiques
  async handleAsyncError(error, context = {}) {
    return await this.handleError(error, {
      ...context,
      context: ERROR_CONTEXTS.ASYNC_OPERATION
    })
  }

  async handleUserActionError(error, userAction, context = {}) {
    return await this.handleError(error, {
      ...context,
      context: ERROR_CONTEXTS.USER_ACTION,
      userAction,
      severity: ERROR_SEVERITY.MEDIUM
    })
  }

  async handleComponentError(error, component, context = {}) {
    return await this.handleError(error, {
      ...context,
      context: ERROR_CONTEXTS.COMPONENT_RENDER,
      component,
      severity: ERROR_SEVERITY.HIGH
    })
  }

  getErrorLog() {
    return [...this.errorLog]
  }

  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      bySeverity: {},
      byCategory: {},
      byComponent: {},
      recent: this.errorLog.slice(-10)
    }
    
    for (const error of this.errorLog) {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1
      stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1
    }
    
    return stats
  }

  clearErrorLog() {
    this.errorLog = []
    try {
      localStorage.removeItem('abawi_error_log')
    } catch (e) {
      console.warn('[ERROR_HANDLER] Impossible de supprimer le log d\'erreurs:', e)
    }
  }

  // Wrapper pour les fonctions async avec gestion d'erreurs
  wrapAsyncFunction(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        await this.handleAsyncError(error, {
          ...context,
          action: fn.name || 'anonymous_function',
          additionalData: { args }
        })
        throw error
      }
    }
  }

  // Wrapper pour les composants React
  wrapComponent(Component, componentName) {
    return class ErrorBoundaryComponent extends React.Component {
      constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error }
      }

      componentDidCatch(error, errorInfo) {
        window.productionErrorHandler.handleComponentError(error, componentName, {
          additionalData: errorInfo
        })
      }

      render() {
        if (this.state.hasError) {
          return React.createElement(
            'div',
            {
              style: {
                padding: '20px',
                textAlign: 'center',
                color: '#dc2626',
                fontFamily: 'system-ui, sans-serif'
              }
            },
            React.createElement('h3', null, '⚠️ Erreur de composant'),
            React.createElement('p', null, `Une erreur est survenue dans le composant ${componentName}.`),
            React.createElement(
              'button',
              { onClick: () => this.setState({ hasError: false, error: null }) },
              'Réessayer'
            )
          )
        }

        return React.createElement(Component, this.props)
      }
    }
  }
}

// ========================================
// INSTANCE GLOBALE
// ========================================

const productionErrorHandler = new ProductionErrorHandler()

// Rendre disponible globalement
if (typeof window !== 'undefined') {
  window.productionErrorHandler = productionErrorHandler
}

export default productionErrorHandler
export { 
  ERROR_SEVERITY, 
  ERROR_CATEGORIES, 
  ERROR_CONTEXTS,
  ErrorMetadataCollector,
  ErrorRecoveryManager,
  ProductionErrorHandler 
}

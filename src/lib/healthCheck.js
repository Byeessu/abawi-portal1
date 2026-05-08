/**
 * Système de Health Check et Monitoring
 * Vérifie la santé de toutes les dépendances externes
 */

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { trackError } from './observability'

const HEALTH_CHECK_INTERVAL = 30000 // 30 secondes

// Configuration des services à monitorer
const SERVICES = {
  supabase: {
    name: 'Supabase',
    check: async () => {
      const start = performance.now()
      const { data, error } = await supabase.from('articles').select('count', { count: 'exact', head: true })
      const latency = performance.now() - start
      return { healthy: !error, latency, error }
    },
    critical: true,
  },
  groq: {
    name: 'Groq API',
    check: async () => {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) return { healthy: false, error: 'Clé API manquante', critical: false }
      
      const start = performance.now()
      try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          method: 'GET',
        })
        const latency = performance.now() - start
        return { healthy: response.ok, latency, error: response.ok ? null : `HTTP ${response.status}` }
      } catch (error) {
        return { healthy: false, latency: performance.now() - start, error: error.message }
      }
    },
    critical: false,
  },
  netlify: {
    name: 'Netlify Functions',
    check: async () => {
      const start = performance.now()
      try {
        const response = await fetch('/.netlify/functions/health')
        const latency = performance.now() - start
        return { healthy: response.ok, latency, error: response.ok ? null : `HTTP ${response.status}` }
      } catch (error) {
        return { healthy: false, latency: performance.now() - start, error: error.message }
      }
    },
    critical: false,
  },
}

// Classe principale de health monitoring
class HealthMonitor {
  constructor() {
    this.status = {}
    this.listeners = []
    this.intervalId = null
    this.isRunning = false
    
    // Initialiser le statut
    Object.keys(SERVICES).forEach((key) => {
      this.status[key] = {
        status: 'unknown',
        lastCheck: null,
        latency: null,
        error: null,
        history: [], // Historique des 10 derniers checks
      }
    })
  }

  // Démarrer le monitoring
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.checkAll() // Premier check immédiat
    
    this.intervalId = setInterval(() => {
      this.checkAll()
    }, HEALTH_CHECK_INTERVAL)
    
    console.log('🔍 Health monitoring started')
  }

  // Arrêter le monitoring
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🔍 Health monitoring stopped')
  }

  // Vérifier un service spécifique
  async checkService(serviceKey) {
    const service = SERVICES[serviceKey]
    if (!service) return null

    const start = Date.now()
    
    try {
      const result = await service.check()
      const checkDuration = Date.now() - start
      
      const status = {
        status: result.healthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        latency: result.latency || checkDuration,
        error: result.error || null,
        critical: service.critical,
      }

      // Mettre à jour l'historique
      this.status[serviceKey].history = [
        ...this.status[serviceKey].history.slice(-9),
        { healthy: result.healthy, timestamp: Date.now() },
      ]

      // Tracker les erreurs si le service est critique et unhealthy
      if (service.critical && !result.healthy) {
        trackError(new Error(`Critical service unhealthy: ${service.name}`), {
          service: serviceKey,
          error: result.error,
          latency: result.latency,
        })
      }

      this.status[serviceKey] = { ...this.status[serviceKey], ...status }
      this.notifyListeners(serviceKey, status)
      
      return status
    } catch (error) {
      const status = {
        status: 'error',
        lastCheck: new Date().toISOString(),
        latency: Date.now() - start,
        error: error.message,
        critical: service.critical,
      }
      
      this.status[serviceKey] = { ...this.status[serviceKey], ...status }
      this.notifyListeners(serviceKey, status)
      
      if (service.critical) {
        trackError(error, { service: serviceKey, critical: true })
      }
      
      return status
    }
  }

  // Vérifier tous les services
  async checkAll() {
    const results = await Promise.allSettled(
      Object.keys(SERVICES).map((key) => this.checkService(key))
    )
    
    return results
  }

  // Obtenir le statut global
  getOverallStatus() {
    const services = Object.values(this.status)
    const criticalServices = services.filter((s) => SERVICES[Object.keys(SERVICES).find(key => this.status[key] === s)]?.critical)
    
    const allHealthy = services.every((s) => s.status === 'healthy')
    const criticalHealthy = criticalServices.every((s) => s.status === 'healthy')
    
    return {
      status: allHealthy ? 'healthy' : criticalHealthy ? 'degraded' : 'critical',
      services: this.status,
      timestamp: new Date().toISOString(),
    }
  }

  // Ajouter un listener
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  // Notifier les listeners
  notifyListeners(serviceKey, status) {
    this.listeners.forEach((callback) => {
      try {
        callback(serviceKey, status, this.getOverallStatus())
      } catch (error) {
        console.error('Health monitor listener error:', error)
      }
    })
  }

  // Obtenir les statistiques de santé
  getHealthStats() {
    return Object.entries(this.status).map(([key, status]) => ({
      name: SERVICES[key].name,
      key,
      ...status,
      uptime: this.calculateUptime(key),
    }))
  }

  // Calculer l'uptime (pourcentage de checks healthy)
  calculateUptime(serviceKey) {
    const history = this.status[serviceKey]?.history || []
    if (history.length === 0) return null
    
    const healthy = history.filter((h) => h.healthy).length
    return Math.round((healthy / history.length) * 100)
  }
}

// Instance singleton
export const healthMonitor = new HealthMonitor()

// Hook React pour utiliser le health monitor
export function useHealthMonitor() {
  const [health, setHealth] = useState(() => healthMonitor.getOverallStatus())
  
  useEffect(() => {
    const unsubscribe = healthMonitor.subscribe((serviceKey, status, overall) => {
      setHealth(overall)
    })
    
    return unsubscribe
  }, [])
  
  return health
}

// Fonction pour vérifier rapidement la santé
export async function quickHealthCheck() {
  return healthMonitor.checkAll()
}

// Fonction pour obtenir le statut d'un service spécifique
export function getServiceStatus(serviceKey) {
  return healthMonitor.status[serviceKey]
}

// Démarrer automatiquement en production
if (import.meta.env.PROD) {
  healthMonitor.start()
}

export default healthMonitor

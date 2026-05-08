/**
 * ABAWI ROBUST BACKGROUND JOB HOOK
 * 
 * Objectif :
 * - Remplacer le système fragile par RobustAsyncWrapper
 * - Simplifier l'utilisation du background job manager
 * - Maintenir la compatibilité avec l'existant
 * - Ajouter retry intelligent et monitoring
 * - Nettoyage automatique et memory optimization
 * 
 * @version 2.0.0 - Robust Architecture
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import robustAsync from '../lib/RobustAsyncWrapper'
import productionErrorHandler from '../lib/ProductionErrorHandler'
import backgroundJobManager, { JOB_TYPES, JOB_STATUS } from '../lib/backgroundJobManager'

/**
 * Hook robust pour utiliser le BackgroundJobManager dans n'importe quel outil
 * 
 * @param {string} toolId - ID unique de l'outil (ex: 'business-plan-elite')
 * @param {string} toolName - Nom lisible de l'outil
 * @param {string} userId - ID utilisateur (par défaut 'anonymous')
 * @param {function} onJobUpdate - Callback quand un job change de statut
 */
export function useBackgroundJob(toolId, toolName, userId = 'anonymous', onJobUpdate) {
  const [jobs, setJobs] = useState([])
  const [activeJobs, setActiveJobs] = useState([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Écouter les mises à jour de jobs
    const handleJobUpdate = (job) => {
      if (mountedRef.current && job.tool === toolId) {
        loadJobs()
        onJobUpdate?.(job)
      }
    }

    // S'inscrire aux notifications
    backgroundJobManager.onNotification('onStart', handleJobUpdate)
    backgroundJobManager.onNotification('onComplete', handleJobUpdate)
    backgroundJobManager.onNotification('onError', handleJobUpdate)

    robustAsync.execute(
      async () => {
        await loadJobs()
      },
      {
        timeout: 5000,
        operationType: 'background_job_init',
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry initialisation ${attempt}:`, error)
        }
      }
    )

    // Important: React cleanup must be a function, never a Promise/object
    return () => {
      mountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [toolId, onJobUpdate])

  const loadJobs = useCallback(() => {
    return robustAsync.execute(
      async () => {
        try {
          const userJobs = backgroundJobManager.getAllJobs().filter(job => 
            job.userId === userId && job.tool === toolId
          )
          const active = backgroundJobManager.getJobsByStatus(JOB_STATUS.RUNNING).filter(job => 
            job.tool === toolId
          )
          
          setJobs(userJobs)
          setActiveJobs(active)
        } catch (error) {
          await productionErrorHandler.handleAsyncError(error, 'load_background_jobs', {
            component: 'useBackgroundJob',
            additionalData: { toolId, userId }
          })
          throw error
        }
      },
      {
        timeout: 3000,
        operationType: 'load_jobs'
      }
    )
  }, [toolId, userId])

  /**
   * Créer et lancer un job en arrière-plan (version robuste)
   */
  const run = useCallback(async (jobData, options = {}) => {
    // Legacy compatibility:
    // Some tools call run(asyncFn, { onDone, onError }) directly.
    if (typeof jobData === 'function') {
      return robustAsync.execute(
        async () => {
          try {
            const result = await jobData()
            options.onDone?.(result)
            return result
          } catch (error) {
            options.onError?.(error)
            throw error
          }
        },
        {
          timeout: options.timeout || 120000,
          operationType: 'run_legacy_background_task',
          retryCount: options.retryCount || 0
        }
      )
    }

    return robustAsync.execute(
      async () => {
        const job = await backgroundJobManager.createJob({
          type: jobData.type || JOB_TYPES.CUSTOM,
          title: jobData.title || `Tâche ${toolName}`,
          description: jobData.description || '',
          data: jobData.data || {},
          tool: toolId,
          userId,
          saveFrequency: options.saveFrequency || null,
          notifications: {
            onStart: options.notifyOnStart || false,
            onComplete: options.notifyOnComplete || true,
            onError: options.notifyOnError || true
          }
        })

        // Lancer le job
        await backgroundJobManager.executeJob(job.id)
        
        // Recharger les jobs
        await loadJobs()
        
        return job
      },
      {
        timeout: 10000, // 10 secondes max pour créer et lancer
        operationType: 'run_background_job',
        retryCount: 2,
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry lancement job ${attempt}:`, error)
          if (options.onError) {
            options.onError(`Retry ${attempt}: ${error.message}`)
          }
        },
        onTimeout: () => {
          if (options.onError) {
            options.onError('Timeout création job - Veuillez réessayer')
          }
        }
      }
    )
  }, [toolId, toolName, userId, loadJobs])

  /**
   * Wrapper pour l'ancienne interface de compatibilité
   */
  const runJob = useCallback(async (jobData, options = {}) => {
    return run(jobData, options)
  }, [run])

  /**
   * Créer un business plan en arrière-plan
   */
  const runBusinessPlanJob = useCallback(async (businessData, options = {}) => {
    return run({
      type: JOB_TYPES.BUSINESS_PLAN,
      title: 'Business Plan - Génération',
      description: 'Génération complète du business plan',
      data: businessData
    }, options)
  }, [run])

  /**
   * Lancer une analyse financière en arrière-plan
   */
  const runFinancialAnalysisJob = useCallback(async (financialData, options = {}) => {
    return run({
      type: JOB_TYPES.FINANCIAL_ANALYSIS,
      title: 'Analyse Financière',
      description: 'Analyse complète des ratios et indicateurs financiers',
      data: financialData
    }, options)
  }, [run])

  /**
   * Générer un document en arrière-plan
   */
  const runDocumentGenerationJob = useCallback(async (documentData, options = {}) => {
    return run({
      type: JOB_TYPES.DOCUMENT_GENERATION,
      title: 'Génération Document',
      description: 'Génération de document personnalisé',
      data: documentData
    }, options)
  }, [run])

  /**
   * Lancer un traitement IA en arrière-plan
   */
  const runAIProcessingJob = useCallback(async (aiData, options = {}) => {
    return run({
      type: JOB_TYPES.AI_PROCESSING,
      title: 'Traitement IA',
      description: 'Traitement avec intelligence artificielle',
      data: aiData
    }, options)
  }, [run])

  /**
   * Exporter des données en arrière-plan
   */
  const runDataExportJob = useCallback(async (exportData, options = {}) => {
    return run({
      type: JOB_TYPES.DATA_EXPORT,
      title: 'Export Données',
      description: 'Export des données au format demandé',
      data: exportData
    }, options)
  }, [run])

  /**
   * Générer un rapport en arrière-plan
   */
  const runReportGenerationJob = useCallback(async (reportData, options = {}) => {
    return run({
      type: JOB_TYPES.REPORT_GENERATION,
      title: 'Génération Rapport',
      description: 'Génération de rapport détaillé',
      data: reportData
    }, options)
  }, [run])

  /**
   * Lancer une analyse de marché en arrière-plan
   */
  const runMarketAnalysisJob = useCallback(async (marketData, options = {}) => {
    return run({
      type: JOB_TYPES.MARKET_ANALYSIS,
      title: 'Analyse de Marché',
      description: 'Analyse complète du marché et concurrence',
      data: marketData
    }, options)
  }, [run])

  /**
   * Lancer une évaluation en arrière-plan
   */
  const runValuationJob = useCallback(async (valuationData, options = {}) => {
    return run({
      type: JOB_TYPES.VALUATION,
      title: 'Évaluation',
      description: 'Évaluation complète de l\'entreprise',
      data: valuationData
    }, options)
  }, [run])

  /**
   * Lancer un scoring de crédit en arrière-plan
   */
  const runCreditScoringJob = useCallback(async (creditData, options = {}) => {
    return run({
      type: JOB_TYPES.CREDIT_SCORING,
      title: 'Scoring de Crédit',
      description: 'Calcul du score de crédit',
      data: creditData
    }, options)
  }, [run])

  /**
   * Annuler un job
   */
  const cancelJob = useCallback(async (jobId) => {
    return robustAsync.execute(
      async () => {
        const result = await backgroundJobManager.cancelJob(jobId)
        await loadJobs() // Recharger les jobs
        return result
      },
      {
        timeout: 5000,
        operationType: 'cancel_job',
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry annulation job ${attempt}:`, error)
        }
      }
    )
  }, [loadJobs])

  /**
   * Supprimer un job
   */
  const deleteJob = useCallback(async (jobId) => {
    return robustAsync.execute(
      async () => {
        const result = await backgroundJobManager.deleteJob(jobId)
        await loadJobs() // Recharger les jobs
        return result
      },
      {
        timeout: 3000,
        operationType: 'delete_job',
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry suppression job ${attempt}:`, error)
        }
      }
    )
  }, [loadJobs])

  /**
   * Obtenir un job spécifique
   */
  const getJob = useCallback((jobId) => {
    return backgroundJobManager.getJob(jobId)
  }, [])

  /**
   * Obtenir les statistiques
   */
  const getStats = useCallback(() => {
    return backgroundJobManager.getStats()
  }, [])

  /**
   * Exporter les jobs
   */
  const exportJobs = useCallback(() => {
    return backgroundJobManager.exportJobs()
  }, [])

  /**
   * Réinitialiser le manager
   */
  const resetManager = useCallback(() => {
    return robustAsync.execute(
      async () => {
        await backgroundJobManager.reset()
        await loadJobs() // Recharger les jobs
      },
      {
        timeout: 5000,
        operationType: 'reset_manager',
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry reset manager ${attempt}:`, error)
        }
      }
    )
  }, [loadJobs])

  /**
   * Mettre à jour le progrès d'un job
   */
  const updateJobProgress = useCallback(async (jobId, progress) => {
    return robustAsync.execute(
      async () => {
        const result = await backgroundJobManager.updateJobProgress(jobId, progress)
        await loadJobs() // Recharger les jobs
        return result
      },
      {
        timeout: 2000,
        operationType: 'update_job_progress',
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_BACKGROUND_HOOK] Retry update progress ${attempt}:`, error)
        }
      }
    )
  }, [loadJobs])

  return {
    // État
    jobs,
    activeJobs,
    
    // Actions principales (compatibilité)
    run,
    runJob,
    
    // Actions spécialisées
    runBusinessPlanJob,
    runFinancialAnalysisJob,
    runDocumentGenerationJob,
    runAIProcessingJob,
    runDataExportJob,
    runReportGenerationJob,
    runMarketAnalysisJob,
    runValuationJob,
    runCreditScoringJob,
    
    // Gestion des jobs
    cancelJob,
    deleteJob,
    getJob,
    updateJobProgress,
    
    // Utilitaires
    getStats,
    exportJobs,
    resetManager
  }
}

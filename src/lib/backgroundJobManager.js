/**
 * ABAWI ROBUST BACKGROUND JOB MANAGER
 * 
 * Objectif :
 * - Remplacer le système complexe par RobustAsyncWrapper
 * - Simplifier la gestion des tâches en arrière-plan
 * - Maintenir la compatibilité avec l'existant
 * - Ajouter retry intelligent et monitoring
 * - Nettoyage automatique et memory optimization
 * 
 * @version 2.0.0 - Robust Architecture
 */

import robustAsync from './RobustAsyncWrapper'
import productionErrorHandler from './ProductionErrorHandler'

// Types de jobs (compatibilité)
export const JOB_TYPES = {
  BUSINESS_PLAN: 'business_plan',
  FINANCIAL_ANALYSIS: 'financial_analysis',
  DOCUMENT_GENERATION: 'document_generation',
  AI_PROCESSING: 'ai_processing',
  DATA_EXPORT: 'data_export',
  REPORT_GENERATION: 'report_generation',
  MARKET_ANALYSIS: 'market_analysis',
  VALUATION: 'valuation',
  CREDIT_SCORING: 'credit_scoring',
  CUSTOM: 'custom'
}

export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying'
}

export const SAVE_FREQUENCIES = {
  WEEKLY: { label: 'Hebdomadaire', days: 7, key: 'weekly' },
  MONTHLY: { label: 'Mensuel', days: 30, key: 'monthly' },
  QUARTERLY: { label: 'Trimestriel', days: 90, key: 'quarterly' },
  YEARLY: { label: 'Annuel', days: 365, key: 'yearly' },
  CUSTOM: { label: 'Personnalisé', days: 0, key: 'custom' }
}

class RobustBackgroundJobManager {
  constructor() {
    this.jobs = new Map()
    this.schedules = new Map()
    this.storageKey = 'abawi_background_jobs'
    this.schedulesKey = 'abawi_job_schedules'
    this.notificationCallbacks = new Map()
    this.isInitialized = false
    this.maxConcurrentJobs = 5
    this.jobTimeouts = new Map()
    
    this.init()
  }

  async init() {
    if (this.isInitialized) return
    
    try {
      await robustAsync.execute(
        async () => {
          await this.loadJobs()
          await this.loadSchedules()
          this.startScheduler()
          this.cleanupOldJobs()
        },
        {
          timeout: 10000,
          operationType: 'background_manager_init'
        }
      )
      
      this.isInitialized = true
      console.log('[ROBUST_JOB_MANAGER] Initialisé avec succès')
    } catch (error) {
      await productionErrorHandler.handleAsyncError(error, 'init_background_manager', {
        component: 'RobustBackgroundJobManager',
        additionalData: { phase: 'initialization' }
      })
    }
  }

  createJob(jobData) {
    return robustAsync.execute(
      async () => {
        const jobId = this.generateJobId()
        
        const job = {
          id: jobId,
          type: jobData.type || JOB_TYPES.CUSTOM,
          title: jobData.title || 'Job sans titre',
          description: jobData.description || '',
          data: jobData.data || {},
          status: JOB_STATUS.PENDING,
          progress: 0,
          createdAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          retryCount: 0,
          maxRetries: jobData.maxRetries || 3,
          priority: jobData.priority || 'normal',
          tool: jobData.tool || 'unknown',
          userId: jobData.userId || 'anonymous',
          saveFrequency: jobData.saveFrequency || null,
          nextSaveDate: null,
          result: null,
          error: null,
          notifications: {
            onStart: jobData.notifications?.onStart || false,
            onComplete: jobData.notifications?.onComplete || false,
            onError: jobData.notifications?.onError || false
          }
        }

        // Calculer la prochaine date de sauvegarde si nécessaire
        if (job.saveFrequency) {
          job.nextSaveDate = this.calculateNextSaveDate(job.saveFrequency)
        }

        this.jobs.set(jobId, job)
        await this.saveJobs()
        
        // Notifier le démarrage
        if (job.notifications.onStart) {
          this.notifyJobStart(job)
        }
        
        console.log(`[ROBUST_JOB_MANAGER] Job créé: ${jobId} - ${job.title}`)
        return job
      },
      {
        timeout: 5000,
        operationType: 'create_job',
        retryCount: 2,
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_JOB_MANAGER] Retry création job ${attempt}:`, error)
        }
      }
    )
  }

  // Exécuter un job
  async executeJob(jobId) {
    // Hoisted before robustAsync.execute() so the options object below
    // (retryCount, onRetry) can reference the job — `const job` declared
    // inside the callback is invisible from the sibling options object.
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} non trouvé`)
    }
    return robustAsync.execute(
      async () => {

        if (job.status !== JOB_STATUS.PENDING && job.status !== JOB_STATUS.RETRYING) {
          console.warn(`[ROBUST_JOB_MANAGER] Job ${jobId} n'est pas en attente: ${job.status}`)
          return
        }

        // Vérifier la limite de jobs concurrents
        const runningJobs = this.getJobsByStatus(JOB_STATUS.RUNNING)
        if (runningJobs.length >= this.maxConcurrentJobs) {
          throw new Error(`Limite de jobs concurrents atteinte (${this.maxConcurrentJobs})`)
        }

        // Mettre à jour le statut
        job.status = JOB_STATUS.RUNNING
        job.startedAt = new Date().toISOString()
        job.progress = 0
        await this.saveJobs()

        // Configurer le timeout pour ce job
        const timeoutId = setTimeout(() => {
          this.handleJobTimeout(jobId)
        }, 300000) // 5 minutes max par job

        this.jobTimeouts.set(jobId, timeoutId)

        try {
          // Notifier le démarrage
          if (job.notifications.onStart) {
            this.notifyJobStart(job)
          }

          // Exécuter le handler spécifique
          const result = await this.runJobExecution(job)
          
          // Nettoyer le timeout
          const timeoutId = this.jobTimeouts.get(jobId)
          if (timeoutId) {
            clearTimeout(timeoutId)
            this.jobTimeouts.delete(jobId)
          }

          // Mettre à jour avec le succès
          job.status = JOB_STATUS.COMPLETED
          job.completedAt = new Date().toISOString()
          job.progress = 100
          job.result = result
          job.error = null
          
          await this.saveJobs()
          
          // Notifier la completion
          if (job.notifications.onComplete) {
            this.notifyJobComplete(job)
          }
          
          console.log(`[ROBUST_JOB_MANAGER] Job complété: ${jobId} - ${job.title}`)
          return result
          
        } catch (error) {
          // Nettoyer le timeout
          const timeoutId = this.jobTimeouts.get(jobId)
          if (timeoutId) {
            clearTimeout(timeoutId)
            this.jobTimeouts.delete(jobId)
          }

          // Gérer l'erreur et retry
          await this.handleJobError(job, error)
          throw error
        }
      },
      {
        timeout: 60000, // 1 minute pour l'encadrement
        operationType: 'execute_job',
        retryCount: job.maxRetries,
        onRetry: (attempt, error) => {
          console.warn(`[ROBUST_JOB_MANAGER] Retry exécution job ${jobId} tentative ${attempt}:`, error)
          job.retryCount = attempt
          this.saveJobs()
        },
        onTimeout: () => {
          console.warn(`[ROBUST_JOB_MANAGER] Timeout job ${jobId}`)
          this.handleJobTimeout(jobId)
        }
      }
    )
  }

  async handleJobError(job, error) {
    job.error = error.message || error.toString()
    job.retryCount++
    
    if (job.retryCount < job.maxRetries) {
      job.status = JOB_STATUS.RETRYING
      job.progress = 0
      
      console.warn(`[ROBUST_JOB_MANAGER] Job ${job.id} échoué, retry ${job.retryCount}/${job.maxRetries}`)
      
      // Attendre avant de retryer
      await new Promise(resolve => setTimeout(resolve, 2000 * job.retryCount))
      
      // Retenter l'exécution
      return this.executeJob(job.id)
    } else {
      job.status = JOB_STATUS.FAILED
      job.completedAt = new Date().toISOString()
      
      await this.saveJobs()
      
      // Notifier l'erreur
      if (job.notifications.onError) {
        this.notifyJobError(job)
      }
      
      await productionErrorHandler.handleAsyncError(error, 'job_execution_failed', {
        component: 'RobustBackgroundJobManager',
        additionalData: { 
          jobId: job.id,
          jobType: job.type,
          retryCount: job.retryCount
        }
      })
      
      console.error(`[ROBUST_JOB_MANAGER] Job échoué: ${job.id} - ${job.title} - ${job.error}`)
      throw error
    }
  }

  handleJobTimeout(jobId) {
    const job = this.jobs.get(jobId)
    if (!job || job.status === JOB_STATUS.COMPLETED) return
    
    console.warn(`[ROBUST_JOB_MANAGER] Timeout job ${jobId}`)
    
    // Marquer comme échoué mais permettre retry
    job.status = JOB_STATUS.FAILED
    job.error = 'Timeout après 5 minutes'
    job.completedAt = new Date().toISOString()
    
    this.saveJobs()
    
    // Nettoyer le timeout
    const timeoutId = this.jobTimeouts.get(jobId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.jobTimeouts.delete(jobId)
    }
  }

  // Exécuteurs spécifiques pour chaque type de job
  async executeBusinessPlanJob(job) {
    // Simulation de progression — la génération réelle est effectuée côté composant
    for (let i = 0; i <= 100; i += 10) {
      job.progress = i;
      await this.delay(500);
    }
    return { success: true, businessPlan: 'Généré avec succès' };
  }

  async executeFinancialAnalysisJob(job) {
    const { FinancialAnalyzer } = await import('./businessIntelligence');
    const analyzer = new FinancialAnalyzer();
    
    job.progress = 20;
    await this.delay(1000);
    
    const analysis = analyzer.analyzeRatios(job.data.financialData, job.data.industry);
    
    job.progress = 60;
    await this.delay(1000);
    
    job.progress = 100;
    return analysis;
  }

  async executeDocumentGenerationJob(job) {
    job.progress = 30;
    await this.delay(1500);
    
    job.progress = 70;
    await this.delay(1500);
    
    job.progress = 100;
    return { document: 'Document généré', format: job.data.format || 'PDF' };
  }

  async executeAIProcessingJob(job) {
    // Simuler le traitement IA
    for (let i = 0; i <= 100; i += 5) {
      job.progress = i;
      await this.delay(200);
    }
    return { result: 'Traitement IA complété', tokens: job.data.tokens || 0 };
  }

  async executeDataExportJob(job) {
    job.progress = 25;
    await this.delay(800);
    
    job.progress = 50;
    await this.delay(800);
    
    job.progress = 75;
    await this.delay(800);
    
    job.progress = 100;
    return { exportPath: `/exports/${job.id}.${job.data.format}` };
  }

  async executeReportGenerationJob(job) {
    job.progress = 40;
    await this.delay(1200);
    
    job.progress = 80;
    await this.delay(1200);
    
    job.progress = 100;
    return { report: 'Rapport généré', pages: job.data.pages || 10 };
  }

  async executeMarketAnalysisJob(job) {
    job.progress = 15;
    await this.delay(1000);
    
    job.progress = 45;
    await this.delay(1500);
    
    job.progress = 75;
    await this.delay(1500);
    
    job.progress = 100;
    return { analysis: 'Analyse de marché complétée', insights: 15 };
  }

  async executeValuationJob(job) {
    const { BusinessValuationEngine } = await import('./businessIntelligence');
    const valuationEngine = new BusinessValuationEngine();
    
    job.progress = 35;
    await this.delay(2000);
    
    const valuation = valuationEngine.calculateValuation(
      job.data.financialData,
      job.data.industry,
      job.data.growthRate,
      job.data.discountRate
    );
    
    job.progress = 100;
    return valuation;
  }

  async executeCreditScoringJob(job) {
    const { CreditScoringEngine } = await import('./businessIntelligence');
    const scoringEngine = new CreditScoringEngine();
    
    job.progress = 30;
    await this.delay(1500);
    
    const score = scoringEngine.calculateCreditScore(
      job.data.financialData,
      job.data.industry,
      job.data.managementScore
    );
    
    job.progress = 100;
    return score;
  }

  async executeCustomJob(job) {
    // Exécuter une fonction personnalisée si fournie
    if (job.data.customFunction && typeof job.data.customFunction === 'function') {
      return await job.data.customFunction(job);
    }
    
    // Sinon, simuler l'exécution
    for (let i = 0; i <= 100; i += 20) {
      job.progress = i;
      await this.delay(500);
    }
    
    return { custom: 'Job personnalisé complété' };
  }

  // Planifier la sauvegarde automatique
  scheduleNextSave(job) {
    if (!job.saveFrequency || !job.nextSaveDate) return;
    
    const scheduleId = `save_${job.id}`;
    const delay = new Date(job.nextSaveDate) - new Date();
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.executeScheduledSave(job.id);
      }, delay);
      
      this.schedules.set(scheduleId, {
        jobId: job.id,
        type: 'save',
        timeoutId,
        nextExecution: job.nextSaveDate
      });
      
      this.saveSchedules();
    }
  }

  // Exécuter la sauvegarde planifiée
  async executeScheduledSave(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    try {
      // Créer un nouveau job de sauvegarde
      const saveJob = this.createJob({
        type: JOB_TYPES.DATA_EXPORT,
        title: `Sauvegarde automatique - ${job.title}`,
        description: `Sauvegarde programmée pour ${job.saveFrequency}`,
        data: {
          originalJobId: job.id,
          format: 'json',
          includeResults: true
        },
        tool: job.tool,
        userId: job.userId,
        startImmediately: true
      });
      
      // Calculer la prochaine date de sauvegarde
      job.nextSaveDate = this.calculateNextSaveDate(job.saveFrequency);
      this.saveJobs();
      
      // Programmer la prochaine sauvegarde
      this.scheduleNextSave(job);
      
      console.log(`Sauvegarde automatique exécutée pour le job ${jobId}`);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde automatique du job ${jobId}:`, error);
    }
  }

  // Calculer la prochaine date de sauvegarde
  calculateNextSaveDate(frequency) {
    const now = new Date();
    const nextDate = new Date(now);
    
    switch (frequency) {
      case SAVE_FREQUENCIES.WEEKLY.key:
        nextDate.setDate(now.getDate() + 7);
        break;
      case SAVE_FREQUENCIES.MONTHLY.key:
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case SAVE_FREQUENCIES.QUARTERLY.key:
        nextDate.setMonth(now.getMonth() + 3);
        break;
      case SAVE_FREQUENCIES.YEARLY.key:
        nextDate.setFullYear(now.getFullYear() + 1);
        break;
      case SAVE_FREQUENCIES.CUSTOM.key:
        // Pour personnalisé, utiliser une valeur par défaut de 30 jours
        nextDate.setDate(now.getDate() + 30);
        break;
      default:
        nextDate.setDate(now.getDate() + 7);
    }
    
    return nextDate.toISOString();
  }

  // Démarrer le scheduler
  startScheduler() {
    // Vérifier toutes les minutes les jobs planifiés
    setInterval(() => {
      this.checkScheduledJobs();
    }, 60000); // 1 minute
  }

  // Vérifier les jobs planifiés
  checkScheduledJobs() {
    const now = new Date();
    
    for (const [scheduleId, schedule] of this.schedules) {
      if (new Date(schedule.nextExecution) <= now) {
        if (schedule.type === 'save') {
          this.executeScheduledSave(schedule.jobId);
        }
      }
    }
  }

  // Annuler un job
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === JOB_STATUS.RUNNING) {
      job.status = JOB_STATUS.CANCELLED;
      job.completedAt = new Date().toISOString();
      this.saveJobs();
      this.notifyJobUpdate(job, 'cancelled');
    }
    
    // Annuler les schedules associés
    this.cancelJobSchedules(jobId);
    
    return true;
  }

  // Annuler les schedules d'un job
  cancelJobSchedules(jobId) {
    for (const [scheduleId, schedule] of this.schedules) {
      if (schedule.jobId === jobId) {
        clearTimeout(schedule.timeoutId);
        this.schedules.delete(scheduleId);
      }
    }
    this.saveSchedules();
  }

  // Supprimer un job
  deleteJob(jobId) {
    this.cancelJob(jobId);
    this.jobs.delete(jobId);
    this.saveJobs();
  }

  // Obtenir un job
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  // Obtenir tous les jobs d'un utilisateur
  getUserJobs(userId, filters = {}) {
    const jobs = Array.from(this.jobs.values())
      .filter(job => job.userId === userId);
    
    if (filters.status) {
      return jobs.filter(job => job.status === filters.status);
    }
    
    if (filters.type) {
      return jobs.filter(job => job.type === filters.type);
    }
    
    if (filters.tool) {
      return jobs.filter(job => job.tool === filters.tool);
    }
    
    return jobs;
  }

  // Obtenir les jobs actifs
  getActiveJobs() {
    return Array.from(this.jobs.values())
      .filter(job => job.status === JOB_STATUS.RUNNING || job.status === JOB_STATUS.PENDING);
  }

  // Nettoyer les anciens jobs (plus de 30 jours)
  cleanupOldJobs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const [jobId, job] of this.jobs) {
      const jobDate = new Date(job.completedAt || job.createdAt);
      if (jobDate < thirtyDaysAgo && job.status !== JOB_STATUS.RUNNING) {
        this.deleteJob(jobId);
      }
    }
  }

  // Ajouter un callback de notification
  addNotificationCallback(event, callback) {
    if (!this.notificationCallbacks.has(event)) {
      this.notificationCallbacks.set(event, []);
    }
    this.notificationCallbacks.get(event).push(callback);
  }

  // Notifier les mises à jour de job
  notifyJobUpdate(job, event) {
    const callbacks = this.notificationCallbacks.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(job);
      } catch (error) {
        console.error(`Erreur dans le callback de notification ${event}:`, error);
      }
    });
  }

  // Sauvegarder les jobs dans localStorage
  saveJobs() {
    try {
      const jobsData = Array.from(this.jobs.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(jobsData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des jobs:', error);
    }
  }

  // Charger les jobs depuis localStorage
  async loadJobs() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const jobsData = JSON.parse(saved);
        this.jobs = new Map(jobsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des jobs:', error);
    }
  }

  // Sauvegarder les schedules
  saveSchedules() {
    try {
      const schedulesData = Array.from(this.schedules.entries());
      localStorage.setItem(this.schedulesKey, JSON.stringify(schedulesData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des schedules:', error);
    }
  }

  // Charger les schedules
  async loadSchedules() {
    try {
      const saved = localStorage.getItem(this.schedulesKey);
      if (saved) {
        const schedulesData = JSON.parse(saved);
        // Recréer les timeouts
        for (const [scheduleId, schedule] of schedulesData) {
          const delay = new Date(schedule.nextExecution) - new Date();
          if (delay > 0) {
            schedule.timeoutId = setTimeout(() => {
              this.executeScheduledSave(schedule.jobId);
            }, delay);
            this.schedules.set(scheduleId, schedule);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des schedules:', error);
    }
  }

  // Utilitaires
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Statistiques
  getStatistics() {
    const jobs = Array.from(this.jobs.values());
    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JOB_STATUS.PENDING).length,
      running: jobs.filter(j => j.status === JOB_STATUS.RUNNING).length,
      completed: jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length,
      failed: jobs.filter(j => j.status === JOB_STATUS.FAILED).length,
      cancelled: jobs.filter(j => j.status === JOB_STATUS.CANCELLED).length,
      byType: {},
      byTool: {}
    };
    
    // Stats par type
    for (const job of jobs) {
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
      stats.byTool[job.tool] = (stats.byTool[job.tool] || 0) + 1;
    }
    
    return stats;
  }
}

// Compatibility layer for existing hooks/components
RobustBackgroundJobManager.prototype.onNotification = function onNotification(event, callback) {
  this.addNotificationCallback(event, callback)
}

RobustBackgroundJobManager.prototype.notifyJobStart = function notifyJobStart(job) {
  this.notifyJobUpdate(job, 'onStart')
}

RobustBackgroundJobManager.prototype.notifyJobComplete = function notifyJobComplete(job) {
  this.notifyJobUpdate(job, 'onComplete')
}

RobustBackgroundJobManager.prototype.notifyJobError = function notifyJobError(job) {
  this.notifyJobUpdate(job, 'onError')
}

RobustBackgroundJobManager.prototype.getAllJobs = function getAllJobs() {
  return Array.from(this.jobs.values())
}

RobustBackgroundJobManager.prototype.getJobsByStatus = function getJobsByStatus(status) {
  return this.getAllJobs().filter(job => job.status === status)
}

RobustBackgroundJobManager.prototype.getJobsByType = function getJobsByType() {
  const out = {}
  this.getAllJobs().forEach(job => {
    out[job.type] = (out[job.type] || 0) + 1
  })
  return out
}

RobustBackgroundJobManager.prototype.getStats = function getStats() {
  return this.getStatistics()
}

RobustBackgroundJobManager.prototype.updateJobProgress = async function updateJobProgress(jobId, progress) {
  const job = this.jobs.get(jobId)
  if (!job) return false
  job.progress = Math.max(0, Math.min(100, Number(progress) || 0))
  await this.saveJobs()
  this.notifyJobUpdate(job, 'onProgress')
  return true
}

RobustBackgroundJobManager.prototype.runJobExecution = async function runJobExecution(job) {
  switch (job.type) {
    case JOB_TYPES.BUSINESS_PLAN:
      return this.executeBusinessPlanJob(job)
    case JOB_TYPES.FINANCIAL_ANALYSIS:
      return this.executeFinancialAnalysisJob(job)
    case JOB_TYPES.DOCUMENT_GENERATION:
      return this.executeDocumentGenerationJob(job)
    case JOB_TYPES.AI_PROCESSING:
      return this.executeAIProcessingJob(job)
    case JOB_TYPES.DATA_EXPORT:
      return this.executeDataExportJob(job)
    case JOB_TYPES.REPORT_GENERATION:
      return this.executeReportGenerationJob(job)
    case JOB_TYPES.MARKET_ANALYSIS:
      return this.executeMarketAnalysisJob(job)
    case JOB_TYPES.VALUATION:
      return this.executeValuationJob(job)
    case JOB_TYPES.CREDIT_SCORING:
      return this.executeCreditScoringJob(job)
    default:
      return this.executeCustomJob(job)
  }
}

// Instance globale
const backgroundJobManager = new RobustBackgroundJobManager();

export default backgroundJobManager;

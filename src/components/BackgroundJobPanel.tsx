/**
 * ABAWI Background Job Panel
 * Panneau de gestion des tâches en arrière-plan pour tous les outils
 */

import React, { useState, useEffect } from 'react';
import backgroundJobManager, { JOB_TYPES, JOB_STATUS, SAVE_FREQUENCIES } from '../lib/backgroundJobManager';
import themeManager from '../lib/themeManager';

interface Job {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  result: any;
  error: string;
  tool: string;
  saveFrequency: string;
  nextSaveDate: string;
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
  };
}

interface BackgroundJobPanelProps {
  tool?: string;
  userId?: string;
  showCreateButton?: boolean;
  compact?: boolean;
}

export default function BackgroundJobPanel({ 
  tool = 'all', 
  userId = 'anonymous', 
  showCreateButton = true,
  compact = false 
}: BackgroundJobPanelProps) {
  const [currentTheme, setCurrentTheme] = useState(themeManager.currentTheme);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState({ status: 'all', type: 'all' });
  const [statistics, setStatistics] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const themeColors = themeManager.getCurrentTheme();

  useEffect(() => {
    themeManager.addListener((themeName: string, themeColors: any) => {
      setCurrentTheme(themeName);
    });
    return () => themeManager.removeListener(() => {});
  }, []);

  useEffect(() => {
    loadJobs();
    loadStatistics();
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(() => {
      loadJobs();
      loadStatistics();
    }, 5000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tool, userId, filter]);

  const loadJobs = () => {
    const userJobs = backgroundJobManager.getUserJobs(userId, filter);
    const active = backgroundJobManager.getActiveJobs();
    
    setJobs(userJobs);
    setActiveJobs(active);
  };

  const loadStatistics = () => {
    const stats = backgroundJobManager.getStatistics();
    setStatistics(stats);
  };

  const createJob = (jobData: any) => {
    const job = backgroundJobManager.createJob({
      ...jobData,
      tool: tool !== 'all' ? tool : jobData.tool,
      userId,
      startImmediately: true
    });
    
    loadJobs();
    setShowCreateModal(false);
    return job;
  };

  const cancelJob = (jobId: string) => {
    backgroundJobManager.cancelJob(jobId);
    loadJobs();
  };

  const deleteJob = (jobId: string) => {
    backgroundJobManager.deleteJob(jobId);
    loadJobs();
    setSelectedJob(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case JOB_STATUS.PENDING: return '#f59e0b';
      case JOB_STATUS.RUNNING: return '#3b82f6';
      case JOB_STATUS.COMPLETED: return '#22c55e';
      case JOB_STATUS.FAILED: return '#ef4444';
      case JOB_STATUS.CANCELLED: return '#64748b';
      case JOB_STATUS.RETRYING: return '#f97316';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case JOB_STATUS.PENDING: return '??';
      case JOB_STATUS.RUNNING: return '??';
      case JOB_STATUS.COMPLETED: return '??';
      case JOB_STATUS.FAILED: return '??';
      case JOB_STATUS.CANCELLED: return '??';
      case JOB_STATUS.RETRYING: return '??';
      default: return '??';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: themeColors.text }}>
            Créer une tâche en arrière-plan
          </h3>
          
          <CreateJobForm 
            onSubmit={createJob}
            onCancel={() => setShowCreateModal(false)}
            themeColors={themeColors}
          />
        </div>
      </div>
    );
  };

  const renderJobDetails = () => {
    if (!selectedJob) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: themeColors.text }}>
              {selectedJob.title}
            </h3>
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                background: 'none',
                border: 'none',
                color: themeColors.text,
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <strong style={{ color: themeColors.text }}>Type:</strong>
              <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                {selectedJob.type}
              </span>
            </div>
            
            <div>
              <strong style={{ color: themeColors.text }}>Statut:</strong>
              <span style={{ 
                marginLeft: '8px', 
                color: getStatusColor(selectedJob.status),
                fontWeight: '600'
              }}>
                {getStatusIcon(selectedJob.status)} {selectedJob.status}
              </span>
            </div>
            
            <div>
              <strong style={{ color: themeColors.text }}>Progression:</strong>
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: themeColors.code,
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${selectedJob.progress}%`,
                    height: '100%',
                    background: getStatusColor(selectedJob.status),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.9rem', color: themeColors.textSecondary }}>
                  {selectedJob.progress}%
                </div>
              </div>
            </div>
            
            <div>
              <strong style={{ color: themeColors.text }}>Créé le:</strong>
              <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                {formatDate(selectedJob.createdAt)}
              </span>
            </div>
            
            {selectedJob.startedAt && (
              <div>
                <strong style={{ color: themeColors.text }}>Démarré le:</strong>
                <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                  {formatDate(selectedJob.startedAt)}
                </span>
              </div>
            )}
            
            {selectedJob.completedAt && (
              <div>
                <strong style={{ color: themeColors.text }}>Terminé le:</strong>
                <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                  {formatDate(selectedJob.completedAt)}
                </span>
              </div>
            )}
            
            {selectedJob.startedAt && (
              <div>
                <strong style={{ color: themeColors.text }}>Durée:</strong>
                <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                  {formatDuration(selectedJob.startedAt, selectedJob.completedAt)}
                </span>
              </div>
            )}
            
            {selectedJob.saveFrequency && (
              <div>
                <strong style={{ color: themeColors.text }}>Sauvegarde automatique:</strong>
                <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                  {selectedJob.saveFrequency}
                </span>
              </div>
            )}
            
            {selectedJob.nextSaveDate && (
              <div>
                <strong style={{ color: themeColors.text }}>Prochaine sauvegarde:</strong>
                <span style={{ marginLeft: '8px', color: themeColors.textSecondary }}>
                  {formatDate(selectedJob.nextSaveDate)}
                </span>
              </div>
            )}
            
            {selectedJob.description && (
              <div>
                <strong style={{ color: themeColors.text }}>Description:</strong>
                <p style={{ marginTop: '8px', color: themeColors.textSecondary, lineHeight: '1.5' }}>
                  {selectedJob.description}
                </p>
              </div>
            )}
            
            {selectedJob.error && (
              <div>
                <strong style={{ color: themeColors.text }}>Erreur:</strong>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#ef444420',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: themeColors.text
                }}>
                  {selectedJob.error}
                </div>
              </div>
            )}
            
            {selectedJob.result && (
              <div>
                <strong style={{ color: themeColors.text }}>Résultat:</strong>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: themeColors.code,
                  borderRadius: '6px',
                  color: themeColors.codeText,
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(selectedJob.result, null, 2)}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {selectedJob.status === JOB_STATUS.RUNNING && (
                <button
                  onClick={() => cancelJob(selectedJob.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
              )}
              
              {(selectedJob.status === JOB_STATUS.COMPLETED || 
                selectedJob.status === JOB_STATUS.FAILED || 
                selectedJob.status === JOB_STATUS.CANCELLED) && (
                <button
                  onClick={() => deleteJob(selectedJob.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!statistics || compact) return null;

    return (
      <div style={{
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
          Statistiques des tâches
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: themeColors.text }}>
              {statistics.total}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {statistics.pending}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              En attente
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {statistics.running}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              En cours
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {statistics.completed}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              Terminées
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {statistics.failed}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              Échouées
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    if (compact) return null;

    return (
      <div style={{
        background: themeColors.card,
        border: `1px solid ${themeColors.border}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
            Statut
          </label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            style={{
              padding: '6px 12px',
              border: `1px solid ${themeColors.border}`,
              borderRadius: '6px',
              background: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">Tous</option>
            <option value={JOB_STATUS.PENDING}>En attente</option>
            <option value={JOB_STATUS.RUNNING}>En cours</option>
            <option value={JOB_STATUS.COMPLETED}>Terminées</option>
            <option value={JOB_STATUS.FAILED}>Échouées</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
            Type
          </label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
            style={{
              padding: '6px 12px',
              border: `1px solid ${themeColors.border}`,
              borderRadius: '6px',
              background: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">Tous</option>
            <option value={JOB_TYPES.BUSINESS_PLAN}>Business Plan</option>
            <option value={JOB_TYPES.FINANCIAL_ANALYSIS}>Analyse Financière</option>
            <option value={JOB_TYPES.DOCUMENT_GENERATION}>Génération Document</option>
            <option value={JOB_TYPES.AI_PROCESSING}>Traitement IA</option>
            <option value={JOB_TYPES.DATA_EXPORT}>Export Données</option>
            <option value={JOB_TYPES.REPORT_GENERATION}>Génération Rapport</option>
          </select>
        </div>
      </div>
    );
  };

  const renderJobList = () => {
    const jobsToShow = compact ? activeJobs : jobs;
    
    if (jobsToShow.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: themeColors.textSecondary
        }}>
          {compact ? 'Aucune tâche active' : 'Aucune tâche trouvée'}
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        {jobsToShow.map((job) => (
          <div
            key={job.id}
            onClick={() => !compact && setSelectedJob(job)}
            style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              cursor: compact ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              ...(compact ? {} : { '&:hover': { transform: 'translateY(-2px)' } })
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: themeColors.text, marginBottom: '4px' }}>
                  {getStatusIcon(job.status)} {job.title}
                </div>
                <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                  {job.description}
                </div>
                <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary }}>
                  {job.tool} · {formatDate(job.createdAt)}
                </div>
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                background: `${getStatusColor(job.status)}20`,
                color: getStatusColor(job.status)
              }}>
                {job.status}
              </div>
            </div>
            
            {job.status === JOB_STATUS.RUNNING && (
              <div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: themeColors.code,
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: `${job.progress}%`,
                    height: '100%',
                    background: getStatusColor(job.status),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary }}>
                  {job.progress}% complété
                </div>
              </div>
            )}
            
            {job.saveFrequency && !compact && (
              <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, marginTop: '8px' }}>
                ?? Sauvegarde: {job.saveFrequency}
                {job.nextSaveDate && ` · Prochaine: ${formatDate(job.nextSaveDate)}`}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`abawi-theme-${currentTheme}`} style={{
        background: themeColors.background,
        color: themeColors.text,
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: themeColors.text }}>
            Tâches actives ({activeJobs.length})
          </h3>
        </div>
        {renderJobList()}
      </div>
    );
  }

  return (
    <div className={`abawi-theme-${currentTheme}`} style={{
      minHeight: '100vh',
      background: themeColors.background,
      color: themeColors.text,
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: themeColors.text }}>
              Tâches en Arrière-Plan
            </h1>
            <p style={{ margin: '4px 0 0 0', color: themeColors.textSecondary }}>
              Gérez vos traitements différés et sauvegardes automatiques
            </p>
          </div>
          {showCreateButton && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                background: themeColors.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              + Nouvelle tâche
            </button>
          )}
        </div>

        {renderStatistics()}
        {renderFilters()}
        
        {/* Job List */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            {filter.status === 'all' ? 'Toutes les tâches' : `Tâches ${filter.status}`}
          </h3>
          {renderJobList()}
        </div>
      </div>

      {renderCreateModal()}
      {renderJobDetails()}
    </div>
  );
}

// Formulaire de création de job
function CreateJobForm({ onSubmit, onCancel, themeColors }: any) {
  const [formData, setFormData] = useState({
    type: JOB_TYPES.CUSTOM,
    title: '',
    description: '',
    data: '{}',
    saveFrequency: '',
    notifications: {
      onStart: false,
      onComplete: true,
      onError: true
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(formData.data);
      onSubmit({
        ...formData,
        data,
        notifications: formData.notifications
      });
    } catch (error: any) {
      alert('Erreur dans les données JSON: ' + (error?.message || 'Erreur inconnue'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Type de tâche
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
        >
          <option value={JOB_TYPES.BUSINESS_PLAN}>Business Plan</option>
          <option value={JOB_TYPES.FINANCIAL_ANALYSIS}>Analyse Financière</option>
          <option value={JOB_TYPES.DOCUMENT_GENERATION}>Génération Document</option>
          <option value={JOB_TYPES.AI_PROCESSING}>Traitement IA</option>
          <option value={JOB_TYPES.DATA_EXPORT}>Export Données</option>
          <option value={JOB_TYPES.REPORT_GENERATION}>Génération Rapport</option>
          <option value={JOB_TYPES.MARKET_ANALYSIS}>Analyse de Marché</option>
          <option value={JOB_TYPES.VALUATION}>Valorisation</option>
          <option value={JOB_TYPES.CREDIT_SCORING}>Scoring de Crédit</option>
          <option value={JOB_TYPES.CUSTOM}>Personnalisé</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Titre
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
          placeholder="Titre de la tâche"
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text,
            minHeight: '80px',
            resize: 'vertical'
          }}
          placeholder="Description détaillée de la tâche"
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Données (JSON)
        </label>
        <textarea
          value={formData.data}
          onChange={(e) => setFormData({...formData, data: e.target.value})}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text,
            fontFamily: 'monospace',
            minHeight: '100px',
            resize: 'vertical'
          }}
          placeholder='{"key": "value"}'
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Sauvegarde automatique
        </label>
        <select
          value={formData.saveFrequency}
          onChange={(e) => setFormData({...formData, saveFrequency: e.target.value})}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
        >
          <option value="">Aucune</option>
          <option value={SAVE_FREQUENCIES.WEEKLY.key}>Hebdomadaire</option>
          <option value={SAVE_FREQUENCIES.MONTHLY.key}>Mensuel</option>
          <option value={SAVE_FREQUENCIES.QUARTERLY.key}>Trimestriel</option>
          <option value={SAVE_FREQUENCIES.YEARLY.key}>Annuel</option>
          <option value={SAVE_FREQUENCIES.CUSTOM.key}>Personnalisé</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '8px' }}>
          Notifications
        </label>
        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.notifications.onStart}
              onChange={(e) => setFormData({
                ...formData,
                notifications: {...formData.notifications, onStart: e.target.checked}
              })}
            />
            <span style={{ color: themeColors.text }}>Au démarrage</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.notifications.onComplete}
              onChange={(e) => setFormData({
                ...formData,
                notifications: {...formData.notifications, onComplete: e.target.checked}
              })}
            />
            <span style={{ color: themeColors.text }}>À la completion</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.notifications.onError}
              onChange={(e) => setFormData({
                ...formData,
                notifications: {...formData.notifications, onError: e.target.checked}
              })}
            />
            <span style={{ color: themeColors.text }}>En cas d'erreur</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            background: themeColors.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Créer la tâche
        </button>
      </div>
    </form>
  );
}

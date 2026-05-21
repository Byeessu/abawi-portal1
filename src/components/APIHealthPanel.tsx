/**
 * ABAWI API Health Panel - Panneau de gestion centralisée des API
 * Interface pour brancher/débrancher/changer/éditer toutes les API
 */

import React, { useState, useEffect } from 'react';
import apiManager, { API_TYPES, API_STATUS, API_PROVIDERS } from '../lib/apiManager';
import themeManager from '../lib/themeManager';

interface API {
  id: string;
  providerId: string;
  name: string;
  type: string;
  config: any;
  isActive: boolean;
  status: string;
  customHeaders: any;
  customSettings: any;
  lastHealthCheck: string;
  healthCheckResult: any;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

interface APIHealthPanelProps {
  compact?: boolean;
}

export default function APIHealthPanel({ compact = false }: APIHealthPanelProps) {
  const [currentTheme, setCurrentTheme] = useState(themeManager.currentTheme);
  const [apis, setApis] = useState<API[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState<API | null>(null);
  const [filter, setFilter] = useState({ type: 'all', status: 'all' });
  const [testingAPI, setTestingAPI] = useState<string | null>(null);

  const themeColors = themeManager.getCurrentTheme();

  useEffect(() => {
    themeManager.addListener((themeName: string, themeColors: any) => {
      setCurrentTheme(themeName);
    });
    return () => themeManager.removeListener(() => {});
  }, []);

  useEffect(() => {
    loadData();
    
    const handleAPIUpdate = () => loadData();
    apiManager.addListener('apiUpdated', handleAPIUpdate);
    apiManager.addListener('apiRemoved', handleAPIUpdate);
    apiManager.addListener('apiToggled', handleAPIUpdate);
    apiManager.addListener('apiStatusChanged', handleAPIUpdate);
    
    return () => {
      apiManager.removeListener('apiUpdated', handleAPIUpdate);
      apiManager.removeListener('apiRemoved', handleAPIUpdate);
      apiManager.removeListener('apiToggled', handleAPIUpdate);
      apiManager.removeListener('apiStatusChanged', handleAPIUpdate);
    };
  }, []);

  const loadData = () => {
    setApis(apiManager.getAllAPIs());
    setStatistics(apiManager.getAPIStatistics());
  };

  const handleTestAPI = async (apiId: string) => {
    setTestingAPI(apiId);
    try {
      await apiManager.testAPI(apiId);
      loadData();
    } catch (error) {
      console.error('Test API failed:', error);
    } finally {
      setTestingAPI(null);
    }
  };

  const handleToggleAPI = async (apiId: string, isActive: boolean) => {
    apiManager.toggleAPI(apiId, isActive);
  };

  const handleDeleteAPI = async (apiId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration API ?')) {
      apiManager.removeAPI(apiId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case API_STATUS.ACTIVE: return '#22c55e';
      case API_STATUS.INACTIVE: return '#64748b';
      case API_STATUS.ERROR: return '#ef4444';
      case API_STATUS.TESTING: return '#f59e0b';
      case API_STATUS.RATE_LIMITED: return '#f97316';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case API_STATUS.ACTIVE: return '??';
      case API_STATUS.INACTIVE: return '??';
      case API_STATUS.ERROR: return '??';
      case API_STATUS.TESTING: return '??';
      case API_STATUS.RATE_LIMITED: return '??';
      default: return '??';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case API_TYPES.AI: return '??';
      case API_TYPES.TTS: return '??';
      case API_TYPES.TRANSLATION: return '??';
      case API_TYPES.STORAGE: return '??';
      case API_TYPES.PAYMENT: return '??';
      case API_TYPES.ANALYTICS: return '??';
      case API_TYPES.EMAIL: return '??';
      default: return '??';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const filteredAPIs = apis.filter(api => {
    const typeMatch = filter.type === 'all' || api.type === filter.type;
    const statusMatch = filter.status === 'all' || api.status === filter.status;
    return typeMatch && statusMatch;
  });

  const renderAddModal = () => {
    if (!showAddModal) return null;

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
          <h3 style={{ margin: '0 0 20px 0', color: themeColors.text }}>
            Ajouter une API
          </h3>
          <AddAPIForm 
            onSubmit={(apiData: any) => {
              apiManager.addOrUpdateAPI(apiData);
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
            themeColors={themeColors}
          />
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal || !selectedAPI) return null;

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
          <h3 style={{ margin: '0 0 20px 0', color: themeColors.text }}>
            Modifier {selectedAPI.name}
          </h3>
          <EditAPIForm 
            api={selectedAPI}
            onSubmit={(apiData: any) => {
              apiManager.addOrUpdateAPI(apiData);
              setShowEditModal(false);
              setSelectedAPI(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedAPI(null);
            }}
            themeColors={themeColors}
          />
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
          Statistiques des API
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
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--green)' }}>
              {statistics.healthy}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              Actives
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--red)' }}>
              {statistics.error}
            </div>
            <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
              Erreurs
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
            <option value={API_TYPES.AI}>IA</option>
            <option value={API_TYPES.TTS}>Voix</option>
            <option value={API_TYPES.TRANSLATION}>Traduction</option>
            <option value={API_TYPES.STORAGE}>Stockage</option>
            <option value={API_TYPES.PAYMENT}>Paiement</option>
            <option value={API_TYPES.ANALYTICS}>Analytics</option>
            <option value={API_TYPES.EMAIL}>Email</option>
          </select>
        </div>
        
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
            <option value={API_STATUS.ACTIVE}>Actives</option>
            <option value={API_STATUS.INACTIVE}>Inactives</option>
            <option value={API_STATUS.ERROR}>Erreurs</option>
            <option value={API_STATUS.TESTING}>Test</option>
          </select>
        </div>
      </div>
    );
  };

  const renderAPIList = () => {
    if (filteredAPIs.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: themeColors.textSecondary
        }}>
          Aucune API configurée
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredAPIs.map((api) => (
          <div
            key={api.id}
            style={{
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(api.type)}</span>
                <div>
                  <div style={{ fontWeight: '600', color: themeColors.text }}>
                    {api.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: themeColors.textSecondary }}>
                    {(API_PROVIDERS as any)[api.providerId]?.name || api.providerId}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: getStatusColor(api.status) }}>
                    {getStatusIcon(api.status)}
                  </span>
                  <span style={{ color: getStatusColor(api.status), fontWeight: '600' }}>
                    {api.status}
                  </span>
                </div>
                
                {api.lastHealthCheck && (
                  <div style={{ color: themeColors.textSecondary }}>
                    Dernier test: {formatDate(api.lastHealthCheck)}
                  </div>
                )}
                
                {api.errorCount > 0 && (
                  <div style={{ color: 'var(--red)' }}>
                    Erreurs: {api.errorCount}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handleToggleAPI(api.id, !api.isActive)}
                style={{
                  padding: '6px 12px',
                  background: api.isActive ? '#22c55e' : '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {api.isActive ? 'Actif' : 'Inactif'}
              </button>
              
              <button
                onClick={() => handleTestAPI(api.id)}
                disabled={testingAPI === api.id}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: testingAPI === api.id ? 0.6 : 1
                }}
              >
                {testingAPI === api.id ? 'Test...' : 'Tester'}
              </button>
              
              <button
                onClick={() => {
                  setSelectedAPI(api);
                  setShowEditModal(true);
                }}
                style={{
                  padding: '6px 12px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Modifier
              </button>
              
              <button
                onClick={() => handleDeleteAPI(api.id)}
                style={{
                  padding: '6px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Supprimer
              </button>
            </div>
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
            Santé API ({statistics?.healthy || 0}/{statistics?.total || 0})
          </h3>
        </div>
        {renderAPIList()}
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
              Santé API
            </h1>
            <p style={{ margin: '4px 0 0 0', color: themeColors.textSecondary }}>
              Gestion centralisée des API et services externes
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
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
            + Ajouter une API
          </button>
        </div>

        {renderStatistics()}
        {renderFilters()}
        
        {/* API List */}
        <div style={{
          background: themeColors.surface,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: themeColors.text }}>
            Configurations API
          </h3>
          {renderAPIList()}
        </div>
      </div>

      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
}

// Formulaire d'ajout d'API
function AddAPIForm({ onSubmit, onCancel, themeColors }: any) {
  const [formData, setFormData] = useState<{
    providerId: string;
    name: string;
    config: Record<string, string>;
    isActive: boolean;
    customHeaders: Record<string, string>;
    customSettings: Record<string, string>;
  }>({
    providerId: '',
    name: '',
    config: {},
    isActive: true,
    customHeaders: {},
    customSettings: {}
  });

  const selectedProvider = (API_PROVIDERS as any)[formData.providerId];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiData = {
      ...formData,
      type: selectedProvider?.type || API_TYPES.CUSTOM,
      name: formData.name || selectedProvider?.name || 'API Personnalisée'
    };
    
    onSubmit(apiData);
  };

  const updateConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Fournisseur
        </label>
        <select
          value={formData.providerId}
          onChange={(e) => {
            setFormData({
              ...formData,
              providerId: e.target.value,
              name: (API_PROVIDERS as any)[e.target.value]?.name || ''
            });
          }}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
        >
          <option value="">Sélectionner un fournisseur</option>
          {Object.entries(API_PROVIDERS).map(([id, provider]: [string, any]) => (
            <option key={id} value={id}>{provider.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Nom
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
          placeholder="Nom de la configuration"
        />
      </div>

      {selectedProvider && (
        <>
          {selectedProvider.requiredFields.map((field: string) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} *
              </label>
              <input
                type={field.includes('key') ? 'password' : 'text'}
                value={formData.config[field] || ''}
                onChange={(e) => updateConfig(field, e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
                placeholder={field}
              />
            </div>
          ))}

          {selectedProvider.optionalFields.map((field: string) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              {field === 'model' && selectedProvider.models ? (
                <select
                  value={formData.config[field] || ''}
                  onChange={(e) => updateConfig(field, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: '6px',
                    background: themeColors.background,
                    color: themeColors.text
                  }}
                >
                  <option value="">Sélectionner un modèle</option>
                  {selectedProvider.models.map((model: string) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.config[field] || ''}
                  onChange={(e) => updateConfig(field, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: '6px',
                    background: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder={field}
                />
              )}
            </div>
          ))}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
        />
        <label htmlFor="isActive" style={{ color: themeColors.text }}>
          Activer cette API
        </label>
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
          Ajouter
        </button>
      </div>
    </form>
  );
}

// Formulaire de modification d'API
function EditAPIForm({ api, onSubmit, onCancel, themeColors }: any) {
  const [formData, setFormData] = useState<{
    id: string;
    providerId: string;
    name: string;
    config: Record<string, string>;
    isActive: boolean;
    customHeaders: Record<string, string>;
    customSettings: Record<string, string>;
  }>({
    id: api.id,
    providerId: api.providerId,
    name: api.name,
    config: api.config,
    isActive: api.isActive,
    customHeaders: api.customHeaders,
    customSettings: api.customSettings
  });

  const selectedProvider = (API_PROVIDERS as any)[formData.providerId];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateConfig = (key: string, value: string) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
          Nom
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            background: themeColors.background,
            color: themeColors.text
          }}
          placeholder="Nom de la configuration"
        />
      </div>

      {selectedProvider && (
        <>
          {selectedProvider.requiredFields.map((field: string) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} *
              </label>
              <input
                type={field.includes('key') ? 'password' : 'text'}
                value={formData.config[field] || ''}
                onChange={(e) => updateConfig(field, e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '6px',
                  background: themeColors.background,
                  color: themeColors.text
                }}
                placeholder={field}
              />
            </div>
          ))}

          {selectedProvider.optionalFields.map((field: string) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: themeColors.textSecondary, marginBottom: '4px' }}>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              {field === 'model' && selectedProvider.models ? (
                <select
                  value={formData.config[field] || ''}
                  onChange={(e) => updateConfig(field, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: '6px',
                    background: themeColors.background,
                    color: themeColors.text
                  }}
                >
                  <option value="">Sélectionner un modèle</option>
                  {selectedProvider.models.map((model: string) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.config[field] || ''}
                  onChange={(e) => updateConfig(field, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: '6px',
                    background: themeColors.background,
                    color: themeColors.text
                  }}
                  placeholder={field}
                />
              )}
            </div>
          ))}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
        />
        <label htmlFor="isActive" style={{ color: themeColors.text }}>
          Activer cette API
        </label>
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
          Modifier
        </button>
      </div>
    </form>
  );
}

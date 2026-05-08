/**
 * ABAWI API Manager - Gestionnaire Centralisé des API
 * Permet de brancher/débrancher/changer/éditer toutes les API depuis un panneau unique
 */

// Types d'API supportées
export const API_TYPES = {
  AI: 'ai',
  TTS: 'tts',
  TRANSLATION: 'translation',
  STORAGE: 'storage',
  PAYMENT: 'payment',
  ANALYTICS: 'analytics',
  EMAIL: 'email',
  CUSTOM: 'custom'
};

// Statuts des API
export const API_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
  TESTING: 'testing',
  RATE_LIMITED: 'rate_limited'
};

// Fournisseurs préconfigurés
export const API_PROVIDERS = {
  // AI Providers
  GROQ: {
    id: 'groq',
    name: 'Groq (Llama)',
    type: API_TYPES.AI,
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    requiredFields: ['apiKey'],
    optionalFields: ['model', 'temperature', 'maxTokens']
  },
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    type: API_TYPES.AI,
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiredFields: ['apiKey'],
    optionalFields: ['model', 'temperature', 'maxTokens']
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: API_TYPES.AI,
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    requiredFields: ['apiKey'],
    optionalFields: ['model', 'temperature', 'maxTokens']
  },
  
  // TTS Providers
  ELEVENLABS: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    type: API_TYPES.TTS,
    baseUrl: 'https://api.elevenlabs.io',
    requiredFields: ['apiKey'],
    optionalFields: ['voiceId', 'model']
  },
  AZURE_SPEECH: {
    id: 'azure_speech',
    name: 'Azure Speech',
    type: API_TYPES.TTS,
    baseUrl: 'https://{region}.tts.speech.microsoft.com',
    requiredFields: ['apiKey', 'region'],
    optionalFields: ['voice', 'model']
  },
  
  // Storage Providers
  AWS_S3: {
    id: 'aws_s3',
    name: 'AWS S3',
    type: API_TYPES.STORAGE,
    baseUrl: 'https://s3.amazonaws.com',
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket'],
    optionalFields: ['region']
  },
  
  // Payment Providers
  STRIPE: {
    id: 'stripe',
    name: 'Stripe',
    type: API_TYPES.PAYMENT,
    baseUrl: 'https://api.stripe.com/v1',
    requiredFields: ['secretKey'],
    optionalFields: ['webhookSecret']
  },
  
  // Analytics Providers
  GOOGLE_ANALYTICS: {
    id: 'google_analytics',
    name: 'Google Analytics',
    type: API_TYPES.ANALYTICS,
    baseUrl: 'https://www.google-analytics.com',
    requiredFields: ['measurementId'],
    optionalFields: ['apiSecret']
  },
  
  // Email Providers
  SENDGRID: {
    id: 'sendgrid',
    name: 'SendGrid',
    type: API_TYPES.EMAIL,
    baseUrl: 'https://api.sendgrid.com/v3',
    requiredFields: ['apiKey'],
    optionalFields: ['fromEmail']
  }
};

class APIManager {
  constructor() {
    this.apis = new Map();
    this.storageKey = 'abawi_api_configurations';
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    this.healthCheckTimer = null;
    this.listeners = new Map();
    
    this.init();
  }

  async init() {
    await this.loadConfigurations();
    this.startHealthChecks();
  }

  // Charger les configurations depuis localStorage
  async loadConfigurations() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const configs = JSON.parse(saved);
        this.apis.clear();
        configs.forEach(config => {
          this.apis.set(config.id, { ...config, status: API_STATUS.INACTIVE });
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des configurations API:', error);
    }
  }

  // Sauvegarder les configurations dans localStorage
  async saveConfigurations() {
    try {
      const configs = Array.from(this.apis.values()).map(api => ({
        id: api.id,
        providerId: api.providerId,
        name: api.name,
        type: api.type,
        config: api.config,
        isActive: api.isActive,
        customHeaders: api.customHeaders || {},
        customSettings: api.customSettings || {}
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(configs));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des configurations API:', error);
    }
  }

  // Ajouter ou mettre à jour une configuration API
  addOrUpdateAPI(apiData) {
    const api = {
      id: apiData.id || this.generateAPIId(),
      providerId: apiData.providerId,
      name: apiData.name,
      type: apiData.type,
      config: apiData.config || {},
      isActive: apiData.isActive !== undefined ? apiData.isActive : true,
      customHeaders: apiData.customHeaders || {},
      customSettings: apiData.customSettings || {},
      status: API_STATUS.INACTIVE,
      lastHealthCheck: null,
      healthCheckResult: null,
      errorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.apis.set(api.id, api);
    this.saveConfigurations();
    this.notifyListeners('apiUpdated', api);
    
    return api;
  }

  // Supprimer une configuration API
  removeAPI(apiId) {
    const api = this.apis.get(apiId);
    if (api) {
      this.apis.delete(apiId);
      this.saveConfigurations();
      this.notifyListeners('apiRemoved', api);
      return true;
    }
    return false;
  }

  // Activer/Désactiver une API
  toggleAPI(apiId, isActive) {
    const api = this.apis.get(apiId);
    if (api) {
      api.isActive = isActive;
      api.updatedAt = new Date().toISOString();
      if (!isActive) {
        api.status = API_STATUS.INACTIVE;
      }
      this.saveConfigurations();
      this.notifyListeners('apiToggled', api);
      return true;
    }
    return false;
  }

  // Tester la connexion à une API
  async testAPI(apiId) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} non trouvée`);
    }

    api.status = API_STATUS.TESTING;
    this.notifyListeners('apiStatusChanged', api);

    try {
      const result = await this.performHealthCheck(api);
      api.status = API_STATUS.ACTIVE;
      api.lastHealthCheck = new Date().toISOString();
      api.healthCheckResult = result;
      api.errorCount = 0;
      
      this.notifyListeners('apiStatusChanged', api);
      return { success: true, result };
    } catch (error) {
      api.status = API_STATUS.ERROR;
      api.healthCheckResult = { error: error.message };
      api.errorCount++;
      api.lastHealthCheck = new Date().toISOString();
      
      this.notifyListeners('apiStatusChanged', api);
      return { success: false, error: error.message };
    }
  }

  // Effectuer un health check spécifique au fournisseur
  async performHealthCheck(api) {
    const provider = API_PROVIDERS[api.providerId];
    if (!provider) {
      throw new Error(`Fournisseur ${api.providerId} non supporté`);
    }

    switch (api.providerId) {
      case 'groq':
        return await this.testGroqAPI(api);
      case 'openai':
        return await this.testOpenAIAPI(api);
      case 'anthropic':
        return await this.testAnthropicAPI(api);
      case 'elevenlabs':
        return await this.testElevenLabsAPI(api);
      case 'azure_speech':
        return await this.testAzureSpeechAPI(api);
      default:
        return await this.testGenericAPI(api);
    }
  }

  // Tests spécifiques aux fournisseurs
  async testGroqAPI(api) {
    const response = await fetch(`${api.config.baseUrl || API_PROVIDERS.GROQ.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${api.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      status: 'connected', 
      models: data.data?.map(m => m.id) || [],
      latency: Date.now()
    };
  }

  async testOpenAIAPI(api) {
    const response = await fetch(`${api.config.baseUrl || API_PROVIDERS.OPENAI.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${api.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      status: 'connected', 
      models: data.data?.map(m => m.id) || [],
      latency: Date.now()
    };
  }

  async testAnthropicAPI(api) {
    const response = await fetch(`${API_PROVIDERS.ANTHROPIC.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': api.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: api.config.model || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { status: 'connected', latency: Date.now() };
  }

  async testElevenLabsAPI(api) {
    const response = await fetch(`${API_PROVIDERS.ELEVENLABS.baseUrl}/v1/voices`, {
      headers: {
        'xi-api-key': api.config.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      status: 'connected', 
      voices: data.voices?.length || 0,
      latency: Date.now()
    };
  }

  async testAzureSpeechAPI(api) {
    // Test Azure Speech API
    const region = api.config.region || 'westeurope';
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
      headers: {
        'Ocp-Apim-Subscription-Key': api.config.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      status: 'connected', 
      voices: data?.length || 0,
      latency: Date.now()
    };
  }

  async testGenericAPI(api) {
    // Test générique pour les autres APIs
    const provider = API_PROVIDERS[api.providerId];
    const testUrl = api.config.baseUrl || provider.baseUrl;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        ...this.buildHeaders(api),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { status: 'connected', latency: Date.now() };
  }

  // Construire les headers pour une requête API
  buildHeaders(api) {
    const headers = { ...api.customHeaders };
    const provider = API_PROVIDERS[api.providerId];
    
    // Ajouter les headers d'authentification selon le fournisseur
    switch (api.providerId) {
      case 'groq':
      case 'openai':
        headers['Authorization'] = `Bearer ${api.config.apiKey}`;
        break;
      case 'anthropic':
        headers['x-api-key'] = api.config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'elevenlabs':
        headers['xi-api-key'] = api.config.apiKey;
        break;
      case 'azure_speech':
        headers['Ocp-Apim-Subscription-Key'] = api.config.apiKey;
        break;
      case 'stripe':
        headers['Authorization'] = `Bearer ${api.config.secretKey}`;
        break;
      default:
        if (api.config.apiKey) {
          headers['Authorization'] = `Bearer ${api.config.apiKey}`;
        }
    }
    
    return headers;
  }

  // Démarrer les health checks automatiques
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performAllHealthChecks();
    }, this.healthCheckInterval);
  }

  // Effectuer les health checks pour toutes les APIs actives
  async performAllHealthChecks() {
    const activeAPIs = Array.from(this.apis.values()).filter(api => api.isActive);
    
    for (const api of activeAPIs) {
      try {
        await this.testAPI(api.id);
      } catch (error) {
        console.error(`Health check failed for ${api.name}:`, error);
      }
    }
  }

  // Obtenir une API active par type
  getActiveAPI(type) {
    const activeAPIs = Array.from(this.apis.values())
      .filter(api => api.type === type && api.isActive && api.status === API_STATUS.ACTIVE);
    
    return activeAPIs.length > 0 ? activeAPIs[0] : null;
  }

  // Obtenir toutes les APIs
  getAllAPIs() {
    return Array.from(this.apis.values());
  }

  // Obtenir les APIs par type
  getAPIsByType(type) {
    return Array.from(this.apis.values()).filter(api => api.type === type);
  }

  // Obtenir une API par ID
  getAPI(apiId) {
    return this.apis.get(apiId);
  }

  // Obtenir les statistiques des APIs
  getAPIStatistics() {
    const apis = Array.from(this.apis.values());
    const stats = {
      total: apis.length,
      active: apis.filter(api => api.isActive).length,
      healthy: apis.filter(api => api.status === API_STATUS.ACTIVE).length,
      error: apis.filter(api => api.status === API_STATUS.ERROR).length,
      byType: {},
      byProvider: {}
    };
    
    for (const api of apis) {
      stats.byType[api.type] = (stats.byType[api.type] || 0) + 1;
      stats.byProvider[api.providerId] = (stats.byProvider[api.providerId] || 0) + 1;
    }
    
    return stats;
  }

  // Système d'écoute d'événements
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur dans le callback d'événement ${event}:`, error);
      }
    });
  }

  // Utilitaires
  generateAPIId() {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Exporter les configurations
  exportConfigurations() {
    const configs = Array.from(this.apis.values()).map(api => ({
      id: api.id,
      providerId: api.providerId,
      name: api.name,
      type: api.type,
      config: api.config,
      isActive: api.isActive,
      customHeaders: api.customHeaders,
      customSettings: api.customSettings
    }));
    
    return JSON.stringify(configs, null, 2);
  }

  // Importer les configurations
  importConfigurations(configsJSON) {
    try {
      const configs = JSON.parse(configsJSON);
      configs.forEach(config => {
        this.addOrUpdateAPI(config);
      });
      return { success: true, imported: configs.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Instance globale
const apiManager = new APIManager();

export { APIManager };
export default apiManager;

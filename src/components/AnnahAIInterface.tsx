/**
 * ABAWI AI - Interface Annah Expert
 * Interface intelligente avec expertise complète de la plateforme ABAWI
 */

import React, { useState, useEffect, useRef } from 'react';
import { annahAI, ANNAI_CONFIG } from '../lib/annahAI'
import { useTheme } from '../context/ThemeContext'

// Icônes SVG inline
type IconProps = { style?: React.CSSProperties }

const Brain = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v1.09A6 6 0 0 0 2 12.5a6 6 0 0 0 5 5.91V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.41a2 2 0 0 1 1.33-1.89A8 8 0 0 0 9.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v1.09A6 6 0 0 1 22 12.5a6 6 0 0 1-5 5.91V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.41a2 2 0 0 0-1.33-1.89A8 8 0 0 1 14.5 2z"/>
  </svg>
);

const Target = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const Calendar = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const Zap = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const MessageSquare = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TrendingUp = ({ style }: IconProps = {}) => (
  <svg width="20" height="20" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

interface Campaign {
  id: string;
  name: string;
  type: string;
  content: string;
  targetAudience: string;
  channels: string[];
  schedule: any;
  budget: number;
  kpis: any;
  status: string;
  aiInsights?: any;
}

interface ToolQuery {
  tool: string;
  query: string;
  response: any;
  timestamp: string;
  confidence: number;
}

interface Conversation {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  confidence?: number;
  suggestions?: string[];
  analysis?: any;
  platformInfo?: any;
}

interface AIStatus {
  ai: string;
  version: string;
  expertise: string[];
  model?: string;
  status?: string;
  responseTime?: number;
  platforms: string[];
  context: any;
  capabilities: string[];
  lastUpdate: string;
}

export default function AnnahAIInterface() {
  const { darkMode } = useTheme()
  
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedTool, setSelectedTool] = useState('');
  const [toolQuery, setToolQuery] = useState('');
  const [toolResponses, setToolResponses] = useState<ToolQuery[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'marketing',
    content: '',
    targetAudience: 'professionals',
    channels: ['LinkedIn'],
    budget: 0,
    kpis: {}
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialisation de l'IA Annah
    const status = annahAI.getStatus();
    setAiStatus(status);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Conversation = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setConversations(prevConversations => [...prevConversations, userMessage]);

    // Traitement par Annah AI
    let aiResponse = null;

    // Détection de requêtes spécifiques
    if (message.toLowerCase().includes('campagne') || message.toLowerCase().includes('marketing')) {
      aiResponse = await handleCampaignQuery(message);
    } else if (message.toLowerCase().includes('business') || message.toLowerCase().includes('stratégie')) {
      aiResponse = await handleBusinessQuery(message);
    } else if (message.toLowerCase().includes('outil') || message.toLowerCase().includes('plateforme')) {
      aiResponse = await handlePlatformQuery(message);
    } else {
      // Réponse générale d'Annah — generateGeneralResponse already returns a Conversation
      aiResponse = generateGeneralResponse(message);
    }

    setConversations(prev => [...prev, aiResponse as Conversation]);
    setMessage('');
  };

  const handleCampaignQuery = async (query: string): Promise<Conversation> => {
    const response: Conversation = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Je peux vous aider avec votre campagne marketing. Voulez-vous :\n\n1. Créer une nouvelle campagne\n2. Optimiser une campagne existante\n3. Analyser les performances\n4. Programmer une publication\n\nDites-moi vos objectifs et je vous préparerai une stratégie complète.`,
      timestamp: new Date().toISOString(),
      confidence: 0.92,
      suggestions: ['Créer campagne', 'Optimiser', 'Analyser', 'Programmer']
    };
    return response;
  };

  const handleBusinessQuery = async (query: string): Promise<Conversation> => {
    const analysis = annahAI.analyzeBusinessScenario('growth_strategy');
    
    const response: Conversation = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `Analyse business : ${analysis.analysis}\n\nFacteurs clés :\n${analysis.factors.map((f: string) => `• ${f}`).join('\n')}\n\nRecommandations :\n${analysis.recommendations.map((r: string) => `• ${r}`).join('\n')}`,
      timestamp: new Date().toISOString(),
      confidence: 0.88,
      analysis: analysis
    };
    return response;
  };

  const handlePlatformQuery = async (query: string): Promise<Conversation> => {
    const platformInfo = annahAI.understandABAWI();
    
    const response: Conversation = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: `ABAWI est votre plateforme tout-en-un professionnelle. Voici ce que je peux faire pour vous :\n\n${platformInfo.tools.map((tool: any) => `• ${tool.name}: ${(tool.features as string[]).join(', ')}`).join('\n')}\n\nMes capacités incluent :\n${platformInfo.capabilities.map((cap: string) => `• ${cap}`).join('\n')}`,
      timestamp: new Date().toISOString(),
      confidence: 0.96,
      platformInfo: platformInfo
    };
    return response;
  };

  const generateGeneralResponse = (query: string): Conversation => {
    const responses = [
      "En tant qu'Annah, votre experte ABAWI, je peux vous aider avec l'analyse business, la création de campagnes, l'optimisation de contenu et bien plus. Que souhaitez-vous accomplir aujourd'hui ?",
      "Je suis spécialisée dans la stratégie business, le marketing digital, l'analyse financière et l'optimisation des processus. Comment puis-je vous assister dans vos projets ?",
      "Avec ma connaissance complète de l'écosystème ABAWI, je peux coordonner tous les outils pour maximiser votre productivité. Quel défi voulez-vous relever ?"
    ];

    return {
      id: (Date.now() + 1).toString(),
      type: 'ai' as const,
      content: responses[Math.floor(Math.random() * responses.length)] ?? '',
      timestamp: new Date().toISOString(),
      confidence: 0.95
    };
  };

  const handleCreateCampaign = () => {
    const campaign = annahAI.createCampaign(newCampaign);
    setCampaigns(prev => [...prev, campaign]);
    
    // Optimisation automatique
    const optimizedCampaign = annahAI.campaignManager.optimizeCampaign(campaign.id);
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? optimizedCampaign : c));
    
    // Reset formulaire
    setNewCampaign({
      name: '',
      type: 'marketing',
      content: '',
      targetAudience: 'professionals',
      channels: ['LinkedIn'],
      budget: 0,
      kpis: {}
    });
    
    setActiveTab('campaigns');
  };

  const handleToolQuery = async () => {
    if (!selectedTool || !toolQuery.trim()) return;

    const response = await annahAI.queryTool(selectedTool, toolQuery);
    if ('error' in response) {
      console.warn('[Annah] queryTool error:', (response as { error: string }).error);
      setToolQuery('');
      return;
    }
    setToolResponses(prev => [...prev, response as ToolQuery]);
    setToolQuery('');
  };

  const scheduleCampaign = (campaignId: string) => {
    const scheduleData = {
      publishDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
      frequency: 'once',
      autoOptimize: true
    };

    const schedule = annahAI.campaignManager.scheduleCampaign(campaignId, scheduleData);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'scheduled' } : c));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#070B0F' : '#F8FAFC',
      color: darkMode ? '#F0F2F5' : '#0F172A',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px'
            }}>
              <Brain style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                Annah AI
              </h1>
              <p style={{ margin: '5px 0 0 0', color: darkMode ? '#8B95A5' : '#475569', fontSize: '1rem' }}>
                Expert Elite ABAWI • Business Intelligence & Campaign Management
              </p>
            </div>
          </div>

          {aiStatus && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '15px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <strong>Statut:</strong> {aiStatus.status} • 
                  <strong> Version:</strong> {aiStatus.version}
                </div>
                <div>
                  <strong>Expertise:</strong> {aiStatus.expertise.length} domaines •
                  <strong> Plateformes:</strong> {aiStatus.platforms.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '15px',
          padding: '8px',
          marginBottom: '30px',
          gap: '8px'
        }}>
          {[
            { id: 'chat', label: 'Chat IA', icon: MessageSquare },
            { id: 'tools', label: 'Outils ABAWI', icon: Target },
            { id: 'campaigns', label: 'Campagnes', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: activeTab === tab.id ? (darkMode ? '#60A5FA' : '#3B82F6') : (darkMode ? '#8B95A5' : '#64748B'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          minHeight: '600px'
        }}>
          {activeTab === 'chat' && (
            <div>
              <div style={{
                background: darkMode ? '#0D1117' : '#FFFFFF',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '20px',
                height: '400px',
                overflowY: 'auto',
                border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`
              }}>
                {conversations.map((conv, index) => (
                  <div
                    key={conv.id}
                    style={{
                      marginBottom: '15px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: conv.type === 'user' ? '#f0f9ff' : '#f8fafc',
                      border: conv.type === 'user' ? '1px solid #e0f2fe' : '1px solid #f1f5f9',
                      color: '#000'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: darkMode ? '#8B95A5' : '#64748B', marginBottom: '5px' }}>
                      {conv.type === 'user' ? 'Vous' : 'Annah AI'} • {new Date(conv.timestamp).toLocaleTimeString()}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {conv.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Demandez à Annah anything business, stratégie, campagnes..."
                  style={{
                    flex: 1,
                    padding: '15px',
                    borderRadius: '12px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: darkMode ? '#F0F2F5' : '#0F172A',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '15px 25px',
                    borderRadius: '12px',
                    border: 'none',
                    background: darkMode ? '#60A5FA' : '#3B82F6',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Interroger les outils ABAWI</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: darkMode ? '#F0F2F5' : '#0F172A',
                    marginBottom: '10px'
                  }}
                >
                  <option value="">Sélectionner un outil</option>
                  <option value="smartOffice">ABAWI Smart Office</option>
                  <option value="professionalEditor">Éditeur Professionnel</option>
                  <option value="studioPhotoVideo">Studio Photo & Vidéo</option>
                  <option value="financeElite">Finance Elite</option>
                </select>

                <input
                  type="text"
                  value={toolQuery}
                  onChange={(e) => setToolQuery(e.target.value)}
                  placeholder="Votre requête pour l'outil sélectionné..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: darkMode ? '#F0F2F5' : '#0F172A',
                    marginBottom: '10px'
                  }}
                />

                <button
                  onClick={handleToolQuery}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: darkMode ? '#60A5FA' : '#3B82F6',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Interroger l'outil
                </button>
              </div>

              {/* Réponses des outils */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {toolResponses.map((response, index) => (
                  <div
                    key={index}
                    style={{
                      background: darkMode ? '#0D1117' : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '15px',
                      marginBottom: '10px',
                      color: darkMode ? '#F0F2F5' : '#0F172A',
                      border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {response.tool} - Confiance: {Math.round(response.confidence * 100)}%
                    </div>
                    <div>{JSON.stringify(response.response, null, 2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div>
              <h3 style={{ marginBottom: '20px' }}>Gestionnaire de Campagnes</h3>
              
              {/* Formulaire de création */}
              <div style={{
                background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
              }}>
                <h4 style={{ marginBottom: '15px' }}>Nouvelle Campagne</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Nom de la campagne"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: darkMode ? '#F0F2F5' : '#0F172A'
                    }}
                  />
                  
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: darkMode ? '#F0F2F5' : '#0F172A'
                    }}
                  >
                    <option value="marketing">Marketing</option>
                    <option value="announcement">Annonce</option>
                    <option value="publication">Publication</option>
                  </select>
                </div>

                <textarea
                  placeholder="Contenu de la campagne..."
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                    background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: darkMode ? '#F0F2F5' : '#0F172A',
                    minHeight: '80px',
                    marginBottom: '15px'
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <select
                    value={newCampaign.targetAudience}
                    onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: darkMode ? '#F0F2F5' : '#0F172A'
                    }}
                  >
                    <option value="professionals">Professionnels</option>
                    <option value="entrepreneurs">Entrepreneurs</option>
                    <option value="students">Étudiants</option>
                    <option value="executives">Dirigeants</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Budget (€)"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({...newCampaign, budget: parseFloat(e.target.value) || 0})}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                      background: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: darkMode ? '#F0F2F5' : '#0F172A'
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateCampaign}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: darkMode ? '#60A5FA' : '#3B82F6',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Créer la campagne
                </button>
              </div>

              {/* Liste des campagnes */}
              <div style={{ display: 'grid', gap: '15px' }}>
                {campaigns.length === 0 ? (
                  <p style={{ color: darkMode ? '#8B95A5' : '#64748B' }}>Aucune campagne créée pour le moment.</p>
                ) : (
                  campaigns.map((camp) => (
                    <div
                      key={camp.id}
                      style={{
                        background: darkMode ? '#0D1117' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '15px',
                        marginBottom: '10px',
                        color: darkMode ? '#F0F2F5' : '#0F172A',
                        border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: darkMode ? '#F0F2F5' : '#0F172A' }}>{camp.name}</h4>
                      <p style={{ margin: '0', color: darkMode ? '#8B95A5' : '#64748B', fontSize: '14px' }}>
                        {camp.type} • {camp.status} • Budget: {camp.budget}€
                      </p>
                      <p style={{ margin: '8px 0 0 0', color: darkMode ? '#F0F2F5' : '#0F172A', fontSize: '13px' }}>
                        {camp.content.slice(0, 100)}...
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <h2 style={{ color: darkMode ? '#F0F2F5' : '#0F172A', marginTop: 0 }}>Statut du Système</h2>
              {aiStatus ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div style={{
                    background: darkMode ? '#0D1117' : '#FFFFFF',
                    borderRadius: '10px',
                    padding: '15px',
                    color: darkMode ? '#F0F2F5' : '#0F172A',
                    border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`
                  }}>
                    <p><strong>Modèle:</strong> {aiStatus.model}</p>
                    <p><strong>Status:</strong> {aiStatus.status}</p>
                    <p><strong>Temps de réponse:</strong> {aiStatus.responseTime}ms</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: darkMode ? '#8B95A5' : '#64748B' }}>Chargement du statut...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

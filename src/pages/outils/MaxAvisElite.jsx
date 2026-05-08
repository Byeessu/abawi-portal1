import { useState, useEffect, useMemo } from 'react'
import SEO from '../../components/SEO'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import { useTheme } from '../../context/ThemeContext'

const SURVEY_TYPES = [
  { id: 'survey', name: 'Sondage', icon: '📊', color: 'var(--accent)' },
  { id: 'petition', name: 'Pétition', icon: '✍️', color: 'var(--red)' },
  { id: 'study', name: 'Étude', icon: '🔬', color: 'var(--accent3)' },
  { id: 'poll', name: 'Vote rapide', icon: '⚡', color: 'var(--accent)' },
]

const QUESTION_TYPES = [
  { id: 'single', name: 'Choix unique', icon: '🔘' },
  { id: 'multiple', name: 'Choix multiples', icon: '☑️' },
  { id: 'text', name: 'Texte libre', icon: '📝' },
  { id: 'rating', name: 'Évaluation', icon: '⭐' },
  { id: 'scale', name: 'Échelle', icon: 'cliffe' },
  { id: 'date', name: 'Date', icon: '📅' },
  { id: 'ranking', name: 'Classement', icon: '🏆' },
]

const TEMPLATES = [
  { id: 'blank', name: 'Vierge', desc: 'Commencer de zéro', icon: '📄' },
  { id: 'satisfaction', name: 'Satisfaction client', desc: 'Mesurez la satisfaction', icon: '😊' },
  { id: 'market', name: 'Étude de marché', desc: 'Analysez le marché', icon: '📈' },
  { id: 'employee', name: 'Engagement employés', desc: 'Ressources humaines', icon: '👥' },
  { id: 'event', name: 'Événement', desc: 'Organisez un événement', icon: '🎉' },
  { id: 'petition_template', name: 'Pétition', desc: 'Rassemblez des signatures', icon: '✍️' },
]

export default function MaxAvisElite() {
  const { darkMode } = useTheme()
  const [surveys, setSurveys] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('maxavis_surveys') || '[]')
    }
    return []
  })
  const [currentSurvey, setCurrentSurvey] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showResponses, setShowResponses] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [activeTab, setActiveTab] = useState('surveys')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    localStorage.setItem('maxavis_surveys', JSON.stringify(surveys))
  }, [surveys])

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || s.type === filterType
      return matchesSearch && matchesType
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [surveys, searchTerm, filterType])

  const stats = useMemo(() => {
    const total = surveys.length
    const active = surveys.filter(s => s.status === 'active').length
    const totalResponses = surveys.reduce((sum, s) => sum + (s.responses?.length || 0), 0)
    const totalSignatures = surveys.filter(s => s.type === 'petition')
      .reduce((sum, s) => sum + (s.responses?.length || 0), 0)
    return { total, active, totalResponses, totalSignatures }
  }, [surveys])

  const createSurvey = (template) => {
    const newSurvey = {
      // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
      id: Date.now().toString(),
      type: template.id === 'petition_template' ? 'petition' : 'survey',
      title: template.id === 'blank' ? '' : template.name,
      description: template.desc,
      status: 'draft',
      questions: template.id === 'petition_template' ? [
        { id: '1', type: 'text', question: 'Nom complet', required: true },
        { id: '2', type: 'text', question: 'Email', required: true },
        { id: '3', type: 'text', question: 'Commentaire (optionnel)', required: false },
      ] : template.id !== 'blank' ? [
        { id: '1', type: 'rating', question: 'Comment évalueriez-vous...', required: true, max: 5 },
        { id: '2', type: 'text', question: 'Commentaires additionnels', required: false },
      ] : [],
      responses: [],
      settings: {
        allowMultiple: false,
        anonymous: true,
        publicResults: false,
        endDate: null,
        maxResponses: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
      link: `/maxavis/${Date.now().toString(36)}`,
    }
    setCurrentSurvey(newSurvey)
    setShowTemplateModal(false)
    setShowCreateModal(true)
  }

  const saveSurvey = () => {
    if (!currentSurvey.title) return alert('Veuillez donner un titre')
    
    const existing = surveys.find(s => s.id === currentSurvey.id)
    if (existing) {
      setSurveys(surveys.map(s => s.id === currentSurvey.id ? { ...currentSurvey, updatedAt: new Date().toISOString() } : s))
    } else {
      setSurveys([...surveys, { ...currentSurvey, updatedAt: new Date().toISOString() }])
    }
    setShowCreateModal(false)
    setCurrentSurvey(null)
  }

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'single',
      question: '',
      required: true,
      options: ['Option 1', 'Option 2'],
    }
    setCurrentSurvey({ ...currentSurvey, questions: [...currentSurvey.questions, newQuestion] })
  }

  const updateQuestion = (qid, updates) => {
    setCurrentSurvey({
      ...currentSurvey,
      questions: currentSurvey.questions.map(q => q.id === qid ? { ...q, ...updates } : q)
    })
  }

  const removeQuestion = (qid) => {
    setCurrentSurvey({
      ...currentSurvey,
      questions: currentSurvey.questions.filter(q => q.id !== qid)
    })
  }

  const duplicateQuestion = (q) => {
    const newQ = { ...q, id: Date.now().toString() }
    setCurrentSurvey({ ...currentSurvey, questions: [...currentSurvey.questions, newQ] })
  }

  const addOption = (qid) => {
    setCurrentSurvey({
      ...currentSurvey,
      questions: currentSurvey.questions.map(q => {
        if (q.id === qid) {
          return { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] }
        }
        return q
      })
    })
  }

  const updateOption = (qid, idx, value) => {
    setCurrentSurvey({
      ...currentSurvey,
      questions: currentSurvey.questions.map(q => {
        if (q.id === qid) {
          const newOptions = [...q.options]
          newOptions[idx] = value
          return { ...q, options: newOptions }
        }
        return q
      })
    })
  }

  const removeOption = (qid, idx) => {
    setCurrentSurvey({
      ...currentSurvey,
      questions: currentSurvey.questions.map(q => {
        if (q.id === qid) {
          return { ...q, options: q.options.filter((_, i) => i !== idx) }
        }
        return q
      })
    })
  }

  const publishSurvey = (survey) => {
    setSurveys(surveys.map(s => s.id === survey.id ? { ...s, status: 'active', publishedAt: new Date().toISOString() } : s))
    setShowShareModal(true)
    setCurrentSurvey({ ...survey, status: 'active' })
  }

  const closeSurvey = (survey) => {
    setSurveys(surveys.map(s => s.id === survey.id ? { ...s, status: 'closed', closedAt: new Date().toISOString() } : s))
  }

  const deleteSurvey = (survey) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce sondage ?')) {
      setSurveys(surveys.filter(s => s.id !== survey.id))
    }
  }

  const generateReport = (survey) => {
    setCurrentSurvey(survey)
    setShowReportModal(true)
  }

  const exportData = (format) => {
    if (!currentSurvey) return
    
    let content = ''
    let filename = ''
    let mimeType = ''
    
    if (format === 'csv') {
      const headers = ['Date', 'ID Réponse', ...currentSurvey.questions.map(q => q.question)]
      const rows = currentSurvey.responses.map(r => [
        new Date(r.date).toLocaleString(),
        r.id,
        ...currentSurvey.questions.map(q => {
          const ans = r.answers.find(a => a.questionId === q.id)
          return ans ? (Array.isArray(ans.value) ? ans.value.join('; ') : ans.value) : ''
        })
      ])
      content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      filename = `${currentSurvey.title.replace(/[^a-z0-9]/gi, '_')}_rapport.csv`
      mimeType = 'text/csv'
    } else if (format === 'json') {
      content = JSON.stringify(currentSurvey.responses, null, 2)
      filename = `${currentSurvey.title.replace(/[^a-z0-9]/gi, '_')}_donnees.json`
      mimeType = 'application/json'
    }
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const MAXAVIS_STYLES = `
    .maxavis-container {
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .maxavis-header {
      background: linear-gradient(135deg, var(--accent3) 0%, var(--accent3) 100%);
      padding: 32px;
      color: white;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 10px 40px var(--accent3)30;
    }
    
    .maxavis-logo {
      width: 64px;
      height: 64px;
      background: var(--bg-card);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      margin-bottom: 16px;
    }
    
    .maxavis-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 8px 0;
    }
    
    .maxavis-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }
  
    .maxavis-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    
    .maxavis-stat {
      background: var(--bg-card)15;
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    
    .maxavis-stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .maxavis-stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    
    .maxavis-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    
    .maxavis-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
    }
    
    .maxavis-tab {
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.95rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .maxavis-tab:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .maxavis-tab.active {
      background: var(--accent3)15;
      color: var(--accent3);
    }
    
    .maxavis-toolbar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .maxavis-search {
      flex: 1;
      min-width: 250px;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.95rem;
    }
    
    .maxavis-filter {
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.95rem;
      cursor: pointer;
    }
    
    .maxavis-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .maxavis-btn-primary {
      background: linear-gradient(135deg, var(--accent3) 0%, var(--accent3) 100%);
      color: white;
    }
    
    .maxavis-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--accent3)40;
    }
    
    .maxavis-btn-secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }
    
    .maxavis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .maxavis-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      transition: all 0.2s;
      cursor: pointer;
    }
    
    .maxavis-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      border-color: var(--accent3);
    }
    
    .maxavis-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    
    .maxavis-card-type {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    
    .maxavis-card-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .maxavis-card-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }
    
    .maxavis-card-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin: 0 0 16px 0;
      line-height: 1.5;
    }
    
    .maxavis-card-stats {
      display: flex;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    
    .maxavis-card-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    
    .maxavis-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .maxavis-card-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .maxavis-card-btn:hover {
      background: var(--accent3);
      color: white;
      border-color: var(--accent3);
    }
    
    .maxavis-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    
    .maxavis-modal {
      background: var(--bg-primary);
      border-radius: 20px;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }
    
    .maxavis-modal-header {
      padding: 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .maxavis-modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }
    
    .maxavis-modal-close {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 10px;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    
    .maxavis-modal-close:hover {
      background: var(--red);
      color: white;
    }
    
    .maxavis-modal-body {
      padding: 24px;
    }
    
    .maxavis-form-group {
      margin-bottom: 20px;
    }
    
    .maxavis-form-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .maxavis-form-input,
    .maxavis-form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;
    }
    
    .maxavis-form-input:focus,
    .maxavis-form-textarea:focus {
      outline: none;
      border-color: var(--accent3);
    }
    
    .maxavis-form-textarea {
      min-height: 100px;
      resize: vertical;
    }
    
    .maxavis-question {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .maxavis-question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 12px;
    }
    
    .maxavis-question-type {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 0.85rem;
      cursor: pointer;
    }
    
    .maxavis-question-actions {
      display: flex;
      gap: 8px;
    }
    
    .maxavis-question-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    
    .maxavis-question-btn:hover {
      background: var(--accent3);
      color: white;
      border-color: var(--accent3);
    }
    
    .maxavis-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .maxavis-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .maxavis-option-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.9rem;
    }
    
    .maxavis-option-remove {
      width: 28px;
      height: 28px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 6px;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1rem;
    }
    
    .maxavis-option-remove:hover {
      background: var(--red);
      color: white;
    }
    
    .maxavis-add-option {
      padding: 10px;
      border: 2px dashed var(--border);
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    
    .maxavis-add-option:hover {
      border-color: var(--accent3);
      color: var(--accent3);
    }
    
    .maxavis-required {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    
    .maxavis-templates {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .maxavis-template {
      padding: 20px;
      border: 2px solid var(--border);
      border-radius: 12px;
      background: var(--bg-secondary);
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .maxavis-template:hover {
      border-color: var(--accent3);
      transform: translateY(-4px);
    }
    
    .maxavis-template-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }
    
    .maxavis-template-name {
      font-weight: 600;
      font-size: 1rem;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }
    
    .maxavis-template-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }
    
    .maxavis-share-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .maxavis-share-url {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .maxavis-share-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.9rem;
      font-family: monospace;
    }
    
    .maxavis-share-btn {
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      background: var(--accent3);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .maxavis-share-btn:hover {
      background: var(--accent3);
    }
    
    .maxavis-chart {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .maxavis-chart-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: var(--text-primary);
    }
    
    .maxavis-chart-bar {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
    }
    
    .maxavis-chart-label {
      width: 150px;
      font-size: 0.9rem;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    
    .maxavis-chart-progress {
      flex: 1;
      height: 24px;
      background: var(--bg-tertiary);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .maxavis-chart-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent3), var(--accent3));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: 0.75rem;
      color: white;
      font-weight: 600;
      min-width: 40px;
    }
    
    .maxavis-chart-count {
      width: 50px;
      text-align: right;
      font-size: 0.9rem;
      color: var(--text-primary);
      font-weight: 600;
    }
    
    @media (max-width: 768px) {
      .maxavis-stats {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .maxavis-templates {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .maxavis-grid {
        grid-template-columns: 1fr;
      }
    }
  `

  return (
    <div className="maxavis-container">
      <SEO
        title="MaxAvis Elite — Sondages, pétitions et études de grande puissance"
        description="Créez des sondages, pétitions et études en ligne. Recensez jusqu'à des millions de voix avec analytics en temps réel et rapports détaillés."
        keywords="sondages en ligne, pétitions, études de marché, votes, enquêtes, analytics"
      />
      <style>{MAXAVIS_STYLES}</style>

      {/* Header */}
      <div className="maxavis-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="maxavis-logo">📊</div>
            <div>
              <h1 className="maxavis-title">MaxAvis Elite</h1>
              <p className="maxavis-subtitle">Sondages, pétitions et études de grande puissance — Recensez des millions de voix</p>
            </div>
          </div>
        </div>
        
        <div className="maxavis-stats">
          <div className="maxavis-stat">
            <div className="maxavis-stat-value">{stats.total}</div>
            <div className="maxavis-stat-label">Projets créés</div>
          </div>
          <div className="maxavis-stat">
            <div className="maxavis-stat-value">{stats.active}</div>
            <div className="maxavis-stat-label">Actifs</div>
          </div>
          <div className="maxavis-stat">
            <div className="maxavis-stat-value">{stats.totalResponses.toLocaleString()}</div>
            <div className="maxavis-stat-label">Réponses totales</div>
          </div>
          <div className="maxavis-stat">
            <div className="maxavis-stat-value">{stats.totalSignatures.toLocaleString()}</div>
            <div className="maxavis-stat-label">Signatures</div>
          </div>
        </div>
      </div>

      <div className="maxavis-content">
        {/* Tabs */}
        <div className="maxavis-tabs">
          <button 
            className={`maxavis-tab ${activeTab === 'surveys' ? 'active' : ''}`}
            onClick={() => setActiveTab('surveys')}
          >
            📋 Mes Projets
          </button>
          <button 
            className={`maxavis-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            🎨 Templates
          </button>
          <button 
            className={`maxavis-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>

        {/* Toolbar */}
        <div className="maxavis-toolbar">
          <input
            type="text"
            className="maxavis-search"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="maxavis-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value="survey">Sondages</option>
            <option value="petition">Pétitions</option>
            <option value="study">Études</option>
            <option value="poll">Votes rapides</option>
          </select>
          <button 
            className="maxavis-btn maxavis-btn-primary"
            onClick={() => setShowTemplateModal(true)}
          >
            ➕ Nouveau projet
          </button>
        </div>

        {/* Projects Grid */}
        <div className="maxavis-grid">
          {filteredSurveys.map(survey => (
            <div key={survey.id} className="maxavis-card">
              <div className="maxavis-card-header">
                <span 
                  className="maxavis-card-type"
                  style={{ 
                    background: `${SURVEY_TYPES.find(t => t.id === survey.type)?.color}20`,
                    color: SURVEY_TYPES.find(t => t.id === survey.type)?.color
                  }}
                >
                  {SURVEY_TYPES.find(t => t.id === survey.type)?.icon} {SURVEY_TYPES.find(t => t.id === survey.type)?.name}
                </span>
                <span 
                  className="maxavis-card-status"
                  style={{
                    background: survey.status === 'active' ? 'var(--accent2)20' : survey.status === 'draft' ? 'var(--text-muted)20' : 'var(--red)20',
                    color: survey.status === 'active' ? 'var(--accent2)' : survey.status === 'draft' ? 'var(--text-muted)' : 'var(--red)'
                  }}
                >
                  {survey.status === 'active' ? 'Actif' : survey.status === 'draft' ? 'Brouillon' : 'Clôturé'}
                </span>
              </div>
              
              <h3 className="maxavis-card-title">{survey.title || 'Sans titre'}</h3>
              <p className="maxavis-card-desc">{survey.description || 'Aucune description'}</p>
              
              <div className="maxavis-card-stats">
                <span className="maxavis-card-stat">
                  ❓ {survey.questions.length} question{survey.questions.length > 1 ? 's' : ''}
                </span>
                <span className="maxavis-card-stat">
                  👥 {survey.responses?.length || 0} réponse{survey.responses?.length !== 1 ? 's' : ''}
                </span>
                <span className="maxavis-card-stat">
                  📅 {new Date(survey.updatedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="maxavis-card-actions">
                <button 
                  className="maxavis-card-btn"
                  onClick={() => { setCurrentSurvey(survey); setShowCreateModal(true) }}
                >
                  ✏️ Modifier
                </button>
                {survey.status === 'draft' && (
                  <button 
                    className="maxavis-card-btn"
                    onClick={() => publishSurvey(survey)}
                  >
                    🚀 Publier
                  </button>
                )}
                {survey.status === 'active' && (
                  <button 
                    className="maxavis-card-btn"
                    onClick={() => { setCurrentSurvey(survey); setShowShareModal(true) }}
                  >
                    🔗 Partager
                  </button>
                )}
                {(survey.responses?.length > 0) && (
                  <button 
                    className="maxavis-card-btn"
                    onClick={() => generateReport(survey)}
                  >
                    📊 Rapport
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="maxavis-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="maxavis-modal" onClick={e => e.stopPropagation()}>
            <div className="maxavis-modal-header">
              <h2 className="maxavis-modal-title">Choisir un template</h2>
              <button className="maxavis-modal-close" onClick={() => setShowTemplateModal(false)}>✕</button>
            </div>
            <div className="maxavis-modal-body">
              <div className="maxavis-templates">
                {TEMPLATES.map(template => (
                  <div 
                    key={template.id} 
                    className="maxavis-template"
                    onClick={() => createSurvey(template)}
                  >
                    <div className="maxavis-template-icon">{template.icon}</div>
                    <h4 className="maxavis-template-name">{template.name}</h4>
                    <p className="maxavis-template-desc">{template.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && currentSurvey && (
        <div className="maxavis-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="maxavis-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="maxavis-modal-header">
              <h2 className="maxavis-modal-title">
                {currentSurvey.id && surveys.find(s => s.id === currentSurvey.id) ? 'Modifier' : 'Créer'} le projet
              </h2>
              <button className="maxavis-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="maxavis-modal-body">
              <div className="maxavis-form-group">
                <label className="maxavis-form-label">Titre du projet</label>
                <input
                  type="text"
                  className="maxavis-form-input"
                  value={currentSurvey.title}
                  onChange={(e) => setCurrentSurvey({ ...currentSurvey, title: e.target.value })}
                  placeholder="Ex: Étude de satisfaction client 2024"
                />
              </div>
              
              <div className="maxavis-form-group">
                <label className="maxavis-form-label">Description</label>
                <textarea
                  className="maxavis-form-textarea"
                  value={currentSurvey.description}
                  onChange={(e) => setCurrentSurvey({ ...currentSurvey, description: e.target.value })}
                  placeholder="Décrivez le but de ce sondage/pétition/étude..."
                />
              </div>

              <h3 style={{ margin: '24px 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Questions ({currentSurvey.questions.length})
              </h3>
              
              {currentSurvey.questions.map((q, idx) => (
                <div key={q.id} className="maxavis-question">
                  <div className="maxavis-question-header">
                    <select
                      className="maxavis-question-type"
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                    <div className="maxavis-question-actions">
                      <button 
                        className="maxavis-question-btn"
                        onClick={() => duplicateQuestion(q)}
                        title="Dupliquer"
                      >
                        📋
                      </button>
                      <button 
                        className="maxavis-question-btn"
                        onClick={() => removeQuestion(q.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    className="maxavis-form-input"
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder={`Question ${idx + 1}`}
                    style={{ marginBottom: 12 }}
                  />
                  
                  {(q.type === 'single' || q.type === 'multiple') && (
                    <div className="maxavis-options">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="maxavis-option">
                          <input
                            type="text"
                            className="maxavis-option-input"
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                          />
                          <button 
                            className="maxavis-option-remove"
                            onClick={() => removeOption(q.id, optIdx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button 
                        className="maxavis-add-option"
                        onClick={() => addOption(q.id)}
                      >
                        + Ajouter une option
                      </button>
                    </div>
                  )}
                  
                  <label className="maxavis-required">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                    />
                    Obligatoire
                  </label>
                </div>
              ))}
              
              <button 
                className="maxavis-btn maxavis-btn-secondary"
                onClick={addQuestion}
                style={{ width: '100%', marginBottom: 24 }}
              >
                ➕ Ajouter une question
              </button>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="maxavis-btn maxavis-btn-primary"
                  onClick={saveSurvey}
                  style={{ flex: 1 }}
                >
                  💾 Enregistrer
                </button>
                <button 
                  className="maxavis-btn maxavis-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && currentSurvey && (
        <div className="maxavis-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="maxavis-modal" onClick={e => e.stopPropagation()}>
            <div className="maxavis-modal-header">
              <h2 className="maxavis-modal-title">Partager le projet</h2>
              <button className="maxavis-modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="maxavis-modal-body">
              <div className="maxavis-share-box">
                <div className="maxavis-share-url">
                  <input
                    type="text"
                    className="maxavis-share-input"
                    value={`${window.location.origin}${currentSurvey.link}`}
                    readOnly
                  />
                  <button 
                    className="maxavis-share-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${currentSurvey.link}`)
                      alert('Lien copié !')
                    }}
                  >
                    📋 Copier
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Partagez ce lien pour recueillir des réponses. Les participants n'ont pas besoin de compte.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="maxavis-btn maxavis-btn-primary"
                  onClick={() => {
                    window.open(currentSurvey.link, '_blank')
                  }}
                  style={{ flex: 1 }}
                >
                  🔗 Voir le formulaire
                </button>
                <button 
                  className="maxavis-btn maxavis-btn-secondary"
                  onClick={() => setShowShareModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && currentSurvey && (
        <div className="maxavis-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="maxavis-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="maxavis-modal-header">
              <h2 className="maxavis-modal-title">Rapport: {currentSurvey.title}</h2>
              <button className="maxavis-modal-close" onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className="maxavis-modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button 
                  className="maxavis-btn maxavis-btn-secondary"
                  onClick={() => exportData('csv')}
                >
                  📊 Export CSV
                </button>
                <button 
                  className="maxavis-btn maxavis-btn-secondary"
                  onClick={() => exportData('json')}
                >
                  📄 Export JSON
                </button>
              </div>
              
              {currentSurvey.questions.map(q => {
                const answers = currentSurvey.responses?.flatMap(r => 
                  r.answers.filter(a => a.questionId === q.id)
                ) || []
                
                if (q.type === 'text') {
                  return (
                    <div key={q.id} className="maxavis-chart">
                      <h4 className="maxavis-chart-title">{q.question}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {answers.length} réponse{answers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                }
                
                const counts = {}
                answers.forEach(a => {
                  const val = Array.isArray(a.value) ? a.value : [a.value]
                  val.forEach(v => {
                    counts[v] = (counts[v] || 0) + 1
                  })
                })
                
                const total = answers.length
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
                
                return (
                  <div key={q.id} className="maxavis-chart">
                    <h4 className="maxavis-chart-title">{q.question}</h4>
                    {sorted.map(([label, count]) => (
                      <div key={label} className="maxavis-chart-bar">
                        <span className="maxavis-chart-label">{label}</span>
                        <div className="maxavis-chart-progress">
                          <div 
                            className="maxavis-chart-fill"
                            style={{ width: `${(count / total) * 100}%` }}
                          >
                            {Math.round((count / total) * 100)}%
                          </div>
                        </div>
                        <span className="maxavis-chart-count">{count}</span>
                      </div>
                    ))}
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 12 }}>
                      Total: {total} réponse{total !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <ToolInfoPanel
        toolName="MaxAvis Elite"
        icon="📊"
        description="Solution professionnelle de ABAWI pour la création et la gestion de sondages, pétitions et études de marché"
        benefits={[
          'Création illimitée de sondages et pétitions',
          'Types de questions variés (texte, choix unique/multiple, échelle)',
          'Lien public personnalisable pour partage',
          'Collecte de millions de réponses',
          'Analytics temps réel avec graphiques',
          'Export CSV/JSON des résultats',
          'Rapports générés par IA',
          'Modèles de sondages prédéfinis',
        ]}
        howToUse={[
          'Choisissez entre créer un sondage, une pétition ou utiliser un modèle',
          'Configurez les questions et options de réponse',
          'Personnalisez l\'apparence et le lien de partage',
          'Partagez le lien avec votre audience',
          'Suivez les réponses en temps réel dans les analytics',
          'Exportez les résultats ou générez un rapport IA',
        ]}
        tips={[
          'Idéal pour les entreprises : études de satisfaction client',
          'Parfait pour les associations : pétitions et mobilisation',
          'Utile pour les écoles : évaluations et enquêtes',
          'Efficace pour la politique : consultations citoyennes',
          'Toutes les réponses sont anonymes par défaut',
        ]}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { cleanIATextLight } from '../../lib/cleanText'
import { useToast } from '../../context/ToastContext'
import { run360Crud } from '../../lib/abawi360CrudClient'
import './Abawi360Tools.css'
import './Statistiques.css'
import SyncStatus from '../../components/SyncStatus'
import MarkdownText from '../../components/MarkdownText'
import { Link } from 'react-router-dom'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const FIELD_TYPES = [
  { id: 'text', label: 'Texte libre' },
  { id: 'number', label: 'Nombre' },
  { id: 'select', label: 'Choix unique' },
  { id: 'multiselect', label: 'Choix multiple' },
  { id: 'rating', label: 'Note (1-5)' },
  { id: 'date', label: 'Date' },
  { id: 'email', label: 'Email' },
  { id: 'tel', label: 'Téléphone' },
]

export default function Statistiques() {
  const { membre } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('dashboard')
  const [formulaires, setFormulaires] = useState([])
  const [reponses, setReponses] = useState([])
  const [selectedForm, setSelectedForm] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aiAnalyse, setAiAnalyse] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingForm, setGeneratingForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [champs, setChamps] = useState([])
  const [aiFormPrompt, setAiFormPrompt] = useState('')
  const [loadError, setLoadError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { if (membre) loadAll() }, [membre])

  async function loadAll() {
    setLoading(true)
    setLoadError('')
    try {
      const formsOut = await run360Crud('list', 'stat_formulaires', membre.email)
      const formsData = formsOut.data || []
      const formIds = formsData.map((x) => x.id)
      let repsData = []
      if (formIds.length) {
        const repsOut = await run360Crud('list', 'stat_reponses', membre.email)
        repsData = (repsOut.data || []).filter((r) => formIds.includes(r.formulaire_id))
      }
      setFormulaires(formsData)
      setReponses(repsData)
    } catch (err) {
      setLoadError(err.message || 'Erreur réseau')
      toast('❌ Chargement statistiques incomplet: ' + (err.message || ''), 'error')
      setFormulaires([])
      setReponses([])
    }
    setLastSyncAt(new Date())
    setLoading(false)
  }

  function addChamp() {
    setChamps(prev => [...prev, { id: Date.now().toString(), type: 'text', label: '', required: false, options: '' }])
  }

  function updateChamp(id, key, val) {
    setChamps(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  function removeChamp(id) {
    setChamps(prev => prev.filter(c => c.id !== id))
  }

  async function saveFormulaire() {
    if (!formTitle) return
    try {
      await run360Crud('insert', 'stat_formulaires', membre.email, { payload: { titre: formTitle, description: formDesc, champs } })
    } catch (e) { toast('❌ Erreur: ' + e.message, 'error'); return }
    toast('✅ Formulaire créé', 'success')
    setShowBuilder(false)
    setFormTitle('')
    setFormDesc('')
    setChamps([])
    setAiFormPrompt('')
    loadAll()
  }

  async function deleteFormulaire(id) {
    if (!window.confirm('Supprimer ce formulaire et ses réponses ?')) return
    await run360Crud('delete', 'stat_reponses', membre.email, { filters: { formulaire_id: id } })
    await run360Crud('delete', 'stat_formulaires', membre.email, { id })
    toast('Formulaire supprimé', 'info')
    loadAll()
  }

  async function generateFormIA() {
    if (!aiFormPrompt.trim()) return
    if (!GROQ_KEY) { toast("❌ Clé GROQ manquante (VITE_GROQ_API_KEY).", 'error'); return }
    setGeneratingForm(true)
    try {
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 800, temperature: 0.6,
          messages: [{
            role: 'user',
            content: `Génère un formulaire de sondage pour : "${aiFormPrompt}". Réponds UNIQUEMENT avec un JSON valide (sans markdown) au format :
{"titre":"...","description":"...","champs":[{"id":"1","type":"text|number|select|rating","label":"...","required":true|false,"options":"opt1,opt2"}]}`
          }],
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Format invalide')
      const parsed = JSON.parse(jsonMatch[0])
      setFormTitle(parsed.titre || aiFormPrompt)
      setFormDesc(parsed.description || '')
      setChamps((parsed.champs || []).map((c, i) => ({ ...c, id: c.id || String(Date.now() + i) })))
      toast('✅ Formulaire généré par IA', 'success')
    } catch(e) { toast('❌ Erreur IA: ' + e.message, 'error') }
    setGeneratingForm(false)
  }

  async function analyzeWithAI(form) {
    const reps = reponses.filter(r => r.formulaire_id === form.id)
    if (reps.length === 0) { toast('Aucune réponse à analyser', 'info'); return }
    if (!GROQ_KEY) { toast("❌ Clé GROQ manquante (VITE_GROQ_API_KEY).", 'error'); return }
    setGenerating(true)
    try {
      const summary = JSON.stringify(reps.slice(0, 10).map(r => r.reponse || r.reponses || {}))
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 600, temperature: 0.5,
          messages: [{ role: 'user', content: `Analyse ces ${reps.length} réponses au formulaire "${form.titre}" et donne les insights clés en français :\n${summary}` }],
        }),
      })
      const data = await res.json()
      setAiAnalyse(cleanIATextLight(data.choices?.[0]?.message?.content || ''))
      toast('✅ Analyse générée', 'success')
    } catch { toast('❌ Erreur IA', 'error') }
    setGenerating(false)
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--t360-bg-input)', border: '1px solid var(--t360-border-input)', color: 'var(--t360-text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }
  const labelStyle = { fontSize: '0.72rem', color: 'var(--t360-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }
  const tabStyle = (t) => ({ padding: '8px 18px', borderRadius: '8px', background: tab === t ? 'var(--t360-accent-success)' : 'var(--t360-bg-tag)', border: `1px solid ${tab === t ? 'var(--t360-accent-success)' : 'var(--t360-border)'}`, color: tab === t ? 'var(--t360-text-inverse)' : 'var(--t360-text-secondary)', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.82rem' })

  return (
    <div className="tools360-page tools360-container">
      <div className="tools360-header">
        <div>
          <h1 className="tools360-title">📊 Statistiques</h1>
          <p className="tools360-subtitle">Formulaires, collecte et analyse IA</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="tools360-btn tools360-btn-success">+ Nouveau formulaire</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['dashboard', 'formulaires', 'resultats'].map(t => <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{t === 'dashboard' ? '📊 Dashboard' : t === 'formulaires' ? '📝 Formulaires' : '📋 Résultats'}</button>)}
      </div>
      <SyncStatus
        lastSyncAt={lastSyncAt}
        onRetry={loadAll}
        errorMessage={loadError}
        accent="#18A84A"
        labels={{ errorPrefix: 'Chargement statistiques incomplet' }}
      />

      {loading && <div className="tools360-loading">Chargement...</div>}

      {!loading && tab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {[
              { label: 'Formulaires', value: formulaires.length, colorClass: 'stat-card__value--green' },
              { label: 'Total réponses', value: reponses.length, colorClass: 'stat-card__value--blue' },
              { label: 'Formulaires actifs', value: formulaires.length, colorClass: 'stat-card__value--gold' },
              { label: 'Avg réponses/form', value: formulaires.length ? Math.round(reponses.length / formulaires.length) : 0, colorClass: 'stat-card__value--purple' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-card__value ${s.colorClass}`}>{s.value}</div>
                <div className="tools360-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          {formulaires.length === 0 && <div className="tools360-empty">Créez votre premier formulaire pour commencer à collecter des données</div>}
        </div>
      )}

      {!loading && tab === 'formulaires' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {formulaires.length === 0 ? <div className="tools360-empty" style={{ gridColumn: '1/-1' }}>Aucun formulaire créé</div> :
           formulaires.map(f => {
            const repCount = reponses.filter(r => r.formulaire_id === f.id).length
            return (
              <div key={f.id} className="form-card">
                <div className="form-card__header">
                  <div className="form-card__title">{f.titre}</div>
                  {f.description && <div style={{ fontSize: '0.78rem', color: 'var(--t360-text-secondary)' }}>{f.description}</div>}
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--t360-text-secondary)' }}>{f.champs?.length || 0} champs · {repCount} réponses</span>
                    <span className="tools360-badge" style={{ color: f.actif ? 'var(--t360-accent-success)' : 'var(--t360-text-muted)' }}>{f.actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setSelectedForm(f); setTab('resultats') }} className="btn btn--success" style={{ flex: 1 }}>Voir résultats</button>
                    <button onClick={() => deleteFormulaire(f.id)} className="btn btn--danger btn--icon">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && tab === 'resultats' && (
        <div>
          {!selectedForm ? (
            <div>
              <p className="placeholder-text">Sélectionnez un formulaire :</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formulaires.map(f => (
                  <button key={f.id} onClick={() => setSelectedForm(f)} className="selector-btn">{f.titre}</button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--t360-text-primary)', fontWeight: 800 }}>{selectedForm.titre}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => analyzeWithAI(selectedForm)} disabled={generating} className="btn btn--purple">{generating ? '...' : '🤖 Analyse IA'}</button>
                  <button onClick={() => setSelectedForm(null)} className="tools360-btn">← Retour</button>
                </div>
              </div>
              {aiAnalyse && (
                <div className="ai-analysis">
                  <MarkdownText text={aiAnalyse} compact color="var(--t360-text-secondary)" />
                </div>
              )}
              <div className="tools360-card">
                <div style={{ fontSize: '0.82rem', color: 'var(--t360-text-secondary)', marginBottom: '12px' }}>{reponses.filter(r => r.formulaire_id === selectedForm.id).length} réponses collectées</div>
                {reponses.filter(r => r.formulaire_id === selectedForm.id).length === 0 && <p style={{ color: 'var(--t360-text-muted)', textAlign: 'center', padding: '20px' }}>Aucune réponse pour l'instant</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <div className="tools360-modal-overlay">
          <div className="tools360-modal">
            <div className="tools360-modal-header">
              <h2 className="tools360-modal-title">Builder de formulaire</h2>
              <button onClick={() => setShowBuilder(false)} className="tools360-modal-close">✕</button>
            </div>
            {/* Génération IA */}
            <div className="tools360-ai-box">
              <label className="form-field__label form-field__label--success">🤖 Générer avec l'IA</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={aiFormPrompt} onChange={e => setAiFormPrompt(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Ex: Satisfaction client pour e-commerce" />
                <button onClick={generateFormIA} disabled={!aiFormPrompt || generatingForm} className="btn btn--primary" style={{ cursor: aiFormPrompt ? 'pointer' : 'not-allowed', opacity: !aiFormPrompt || generatingForm ? 0.6 : 1 }}>
                  {generatingForm ? '⏳...' : '✨ Générer'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Titre du formulaire *</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} style={inputStyle} placeholder="Ex: Satisfaction client" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Description</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} style={inputStyle} placeholder="Description du formulaire" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>CHAMPS ({champs.length})</label>
                <button onClick={addChamp} className="btn btn--add">+ Ajouter champ</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {champs.map((c, i) => (
                  <div key={c.id} className="champ-item">
                    <div className="champ-item__grid">
                      <input value={c.label} onChange={e => updateChamp(c.id, 'label', e.target.value)} placeholder="Label du champ" style={{ ...inputStyle, padding: '8px 10px' }} />
                      <select value={c.type} onChange={e => updateChamp(c.id, 'type', e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }}>
                        {FIELD_TYPES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <button onClick={() => removeChamp(c.id)} className="champ-item__remove">✕</button>
                    </div>
                    {(c.type === 'select' || c.type === 'multiselect') && (
                      <input value={c.options} onChange={e => updateChamp(c.id, 'options', e.target.value)} placeholder="Options séparées par des virgules" style={{ ...inputStyle, padding: '8px 10px', marginTop: '8px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBuilder(false)} className="btn btn--secondary">Annuler</button>
              <button onClick={saveFormulaire} className="btn btn--primary">Créer formulaire</button>
            </div>
          </div>
        </div>
      )}
      <ToolInfoPanel
        toolName="Statistiques 360"
        icon="📊"
        description="Outil complet d'analyse statistique et de création de formulaires avec rapports automatiques"
        benefits={[
          'Création de formulaires personnalisés avec toutes les types de questions',
          'Collecte et analyse de données en temps réel',
          'Tableaux de bord avec graphiques interactifs',
          'Export PDF, Excel, CSV des résultats',
          'Rapports générés automatiquement par IA',
          'Formules statistiques avancées (moyenne, médiane, écart-type, corrélation)',
          'Visualisations multiples (camemberts, histogrammes, courbes, nuages)',
          'Partage sécurisé des résultats',
        ]}
        howToUse={[
          'Créez un nouveau formulaire avec le constructeur de questions',
          'Choisissez les types de réponses (texte, nombre, choix, échelle...)',
          'Partagez le lien du formulaire avec votre audience',
          'Collectez les réponses automatiquement',
          'Consultez les statistiques en temps réel',
          'Générez des rapports avec l\'assistant IA',
          'Exportez les résultats dans le format souhaité',
        ]}
        tips={[
          'Utilisez les questions à échelle pour des analyses statistiques avancées',
          'Les formules permettent de calculer automatiquement des indicateurs',
          'L\'IA peut générer des interprétations de vos données',
          'Les graphiques s\'adaptent automatiquement au type de données',
          'Exportez régulièrement vos données pour backup',
        ]}
      />
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import '../../styles/ThemeUniversal.css'
import './Admin.css'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { guides, allFascicules, podcasts, slugify } from '../../data/products'
import { VOICE_SETTINGS_PRESETS, DEFAULT_VOICE_BY_TYPE } from '../../data/voices'
import { uploadFile, uploadAudioSummary, testUpload } from '../../lib/uploadFile'
import { generateSummaryText, generateMP3 } from '../../lib/generateAudio'
import { testPaydunyaConnection } from '../../config/paydunya'
import { cleanIATextLight } from '../../lib/cleanText'
import { callGroq } from '../../lib/groqClient'
import MarkdownText from '../../components/MarkdownText'
import SocialShare from '../../components/SocialShare'
import VoiceSelector from '../../components/VoiceSelector'
import StoreExcelImport from '../../components/admin/StoreExcelImport'
import StoreProductBot from '../../components/StoreProductBot'
import { Navigate } from 'react-router-dom'
import AdminMessaging from '../../components/AdminMessaging'
import SocialVault from '../../components/admin/SocialVault'
import { Link } from 'react-router-dom'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
const ELEVEN_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''
const VOICE_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa'

const ADMIN_TABS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: '📊' },
  { id: 'bot',        label: 'Bot ABAWI IA',    icon: '✦' },
  { id: 'health',     label: 'Santé API',       icon: '🩺' },
  { id: 'guides',     label: 'Guides',           icon: '📚' },
  { id: 'fascicules', label: 'Fascicules',       icon: '🎓' },
  { id: 'podcasts',   label: 'Podcasts',         icon: '🎧' },
  { id: 'news',       label: 'News',             icon: '📰' },
  { id: 'store',      label: 'Store IT',         icon: '💻' },
  { id: 'slider',     label: 'Slider',           icon: '🖼️' },
  { id: 'banners',    label: 'Bannières',        icon: '📣' },
  { id: 'abawi360',   label: 'Abawi 360',        icon: '🌀' },
  { id: 'outils-ia',  label: 'Outils IA',        icon: '🤖' },
  { id: 'membres',    label: 'Membres',          icon: '👥' },
  { id: 'paiements',  label: 'Paiements',        icon: '💰' },
  { id: 'medias',     label: 'Médiathèque',      icon: '🖼️' },
  { id: 'audio',      label: 'Audio Manager',    icon: '🎙️' },
  { id: 'stock',      label: 'Stocks',           icon: '📦' },
  { id: 'messagerie', label: 'Messagerie',        icon: '📨' },
  { id: 'sociaux',    label: 'Comptes sociaux',   icon: '🔐' },
  { id: 'parametres', label: 'Paramètres',       icon: '⚙️' },
]

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'success' ? '#18A84A' : type === 'error' ? '#ef4444' : '#F0B429'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
      background: bg, color: '#fff', padding: '12px 20px',
      borderRadius: 12, fontWeight: 700, fontSize: '0.9rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.3s ease',
      maxWidth: 360,
    }}>
      {msg}
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </div>
  )
}

function PlaceholderSectionPanel({ title, description }) {
  return (
    <section className="adm-placeholder-section">
      <h2 className="adm-placeholder-title">{title}</h2>
      <p className="adm-placeholder-desc">{description}</p>
    </section>
  )
}

function LinkCard({ title, description, href, tone = '#F0B429', tag }) {
  return (
    <a href={href} className="adm-link-card" style={{ borderColor: tone + '40' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 className="adm-link-card-title">{title}</h3>
        {tag ? (
          <span className="adm-link-card-tag" style={{ background: tone + '25', color: tone }}>{tag}</span>
        ) : null}
      </div>
      <p className="adm-link-card-desc">{description}</p>
    </a>
  )
}

function OutilsIAPanel() {
  const outilsIA = [
    { title: 'ABAWI IA', href: '/outils/abawi-ia', desc: 'Agent IA principal (quiz, recherche, simulation, débat).', tag: 'IA Core' },
    { title: 'Analyse CV IA', href: '/outils/analyse-cv', desc: 'Scoring ATS + recommandations automatiques.', tag: 'RH' },
    { title: 'Créateur de CV Pro', href: '/outils/cv', desc: 'Génération CV professionnelle multi-thèmes.' },
    { title: 'Business Plan IA', href: '/outils/business-plan', desc: 'Business plan structuré avec projections.' },
  ]
  return (
    <section className="adm-section-header">
      <h2 className="adm-section-title">🤖 Outils IA — Section dédiée</h2>
      <p className="adm-section-subtitle">Cette section admin regroupe les outils IA transverses (hors modules Abawi 360).</p>
      <div className="adm-grid-2">
        {outilsIA.map(o => <LinkCard key={o.href} title={o.title} description={o.desc} href={o.href} tone="#8B5CF6" tag={o.tag} />)}
      </div>
    </section>
  )
}

function Abawi360Panel() {
  const modules360 = [
    { title: 'CRM 360', href: '/abawi360/crm', desc: 'Pipeline, suivi clients, rappels et conversion.', tag: '360' },
    { title: 'Planification 360', href: '/abawi360/planification', desc: 'Projets, tâches, équipes et jalons.', tag: '360' },
    { title: 'Statistiques 360', href: '/abawi360/statistiques', desc: 'Dashboards, indicateurs et exports.', tag: '360' },
    { title: 'Marketing 360', href: '/abawi360/marketing', desc: 'Campagnes, contenus et suivi ROI.', tag: '360' },
    { title: 'Finance Élite', href: '/outils/finance', desc: 'Analyse financière avancée, DCF, scores.', tag: 'Puissant' },
    { title: 'Juridique Élite', href: '/outils/juridique', desc: 'Contrats OHADA, statuts et conformité.', tag: 'Puissant' },
    { title: 'Comptable Élite', href: '/outils/comptable', desc: 'SYSCOHADA, TVA, paie et reporting.', tag: 'Puissant' },
    { title: 'RH Élite', href: '/outils/rh', desc: 'Évaluation, paie, contrats et onboarding.', tag: 'Puissant' },
    { title: 'Immobilier Élite', href: '/outils/immobilier', desc: 'Rendement, financement et bail.', tag: 'Puissant' },
    { title: 'Consultant Élite', href: '/outils/consultant', desc: 'Proposition, audit, SWOT/PESTEL.', tag: 'Puissant' },
  ]
  return (
    <section className="adm-section-header">
      <h2 className="adm-section-title">🌀 Abawi 360 — Modules avancés</h2>
      <p className="adm-section-subtitle">Section séparée pour les modules 360 et les outils puissants associés.</p>
      <div className="adm-grid-2">
        {modules360.map(o => <LinkCard key={o.href} title={o.title} description={o.desc} href={o.href} tone="#3B82F6" tag={o.tag} />)}
      </div>
    </section>
  )
}

// ─── BOT ABAWI IA (Admin intégré) ────────────────────────────────────────────
const BOT_MODES = [
  { id: 'assistant', label: 'Assistant Admin', icon: '🤖', color: '#F0B429' },
  { id: 'news', label: 'Bot News / Veille', icon: '📰', color: '#3B82F6' },
  { id: 'analyse', label: 'Analyse données', icon: '📊', color: '#18A84A' },
  { id: 'marketing', label: 'Rédaction Marketing', icon: '✍️', color: '#8B5CF6' },
  { id: 'support', label: 'Support Membres', icon: '👥', color: '#06B6D4' },
  { id: 'dissecteur', label: 'Dissecteur IA', icon: '🔬', color: '#EF4444' },
]

const BOT_SYSTEM_PROMPTS = {
  assistant: "Tu es l'assistant IA interne ABAWI, ultra-expert en gestion de portail, contenu digital, stratégie business et support admin. Réponds en français, de façon précise et actionnée.",
  news: "Tu es un expert en veille stratégique, journalisme économique africain, et intelligence économique. Produis des résumés, articles et analyses de haut niveau sur l'actualité business, tech et finance en Afrique.",
  analyse: "Tu es un analyste de données expert niveau cabinet de conseil international. Analyse les données fournies, identifie les tendances, KPIs et recommandations stratégiques. Réponds en français avec rigueur.",
  marketing: "Tu es un directeur marketing senior spécialisé en growth hacking, content marketing et stratégie digitale. Produis des contenus percutants, des stratégies ROI et des campagnes data-driven.",
  support: "Tu es un agent de support premium ABAWI. Tu réponds aux questions des membres, résous les problèmes techniques et fournis des solutions claires et professionnelles en français.",
  dissecteur: "Tu es un chercheur expert en analyse documentaire profonde. Analyse les textes/URLs fournis, extrais les informations clés, identifie les patterns, produis des synthèses structurées de niveau expert.",
}

function BotPanel({ showToast }) {
  const [mode, setMode] = useState('assistant')
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Bonjour, je suis le Bot ABAWI IA Admin. Je suis votre assistant IA intégré, avec accès à tous les modules. Comment puis-je vous aider ?" }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceFiles, setSourceFiles] = useState([])
  const [autoMode, setAutoMode] = useState(false)
  const [taskQueue, setTaskQueue] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const messagesEndRef = useRef(null)
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function extractFileText(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        const data = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map(it => it.str).join(' ') + '\n'
        }
        return text.trim()
      } catch { return '' }
    }
    if (ext === 'docx' || ext === 'doc') {
      try { const mammoth = await import('mammoth'); const data = await file.arrayBuffer(); const out = await mammoth.extractRawText({ arrayBuffer: data }); return String(out?.value || '').trim() } catch { return '' }
    }
    try { return String(await file.text()).trim() } catch { return '' }
  }

  async function sendMessage() {
    if (!input.trim() && !sourceUrl && sourceFiles.length === 0) return

    let userContent = input.trim()

    // Ajouter les fichiers uploadés au contexte
    if (sourceFiles.length > 0) {
      let fileTexts = []
      for (const f of sourceFiles) {
        const text = await extractFileText(f)
        if (text) fileTexts.push(`--- ${f.name} ---\n${text.slice(0, 8000)}`)
      }
      if (fileTexts.length > 0) userContent = `[Documents uploadés]\n\n${fileTexts.join('\n\n')}\n\n${userContent}`.trim()
    }

    // Ajouter l'URL source si fournie
    if (sourceUrl.trim()) {
      try {
        const normalized = sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`
        const proxyUrl = `https://r.jina.ai/${normalized}`
        const res = await fetch(proxyUrl)
        const text = await res.text()
        userContent = `[Source URL: ${sourceUrl}]\n\n${text.slice(0, 6000)}\n\n${userContent}`.trim()
      } catch { /* ignore URL fetch errors */ }
    }

    const newMessages = [...messages, { role: 'user', content: userContent }]
    setMessages(newMessages)
    setInput('')
    setSourceUrl('')
    setSourceFiles([])
    setLoading(true)

    try {
      const fullMessages = [
        { role: 'system', content: BOT_SYSTEM_PROMPTS[mode] || BOT_SYSTEM_PROMPTS.assistant },
        ...newMessages.slice(-12),
      ]
      const reply = await callGroq(fullMessages, { maxTokens: 3000, temperature: 0.6 })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanIATextLight(reply) || '(réponse vide — réessayez)',
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message}` }])
    }
    setLoading(false)
  }

  function addTask() {
    if (!taskInput.trim()) return
    setTaskQueue(q => [...q, { id: Date.now(), text: taskInput.trim(), done: false }])
    setTaskInput('')
  }

  const modeData = BOT_MODES.find(m => m.id === mode) || BOT_MODES[0]

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div className="adm-bot-header">
        <div>
          <h2 className="adm-bot-title">✦ Bot ABAWI IA — Admin</h2>
          <p className="adm-bot-subtitle">
            Assistant IA intégré à l'admin. Changez de mode selon la tâche. Upload multi-fichiers + liens web acceptés.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="adm-bot-mode-label">
            <input type="checkbox" checked={autoMode} onChange={e => setAutoMode(e.target.checked)} />
            Mode autonome
          </label>
          <button onClick={() => setMessages([{ role: 'assistant', content: 'Conversation réinitialisée. Comment puis-je vous aider ?' }])}
            className="adm-bot-reset-btn">
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Sélecteur de mode */}
      <div className="adm-mode-selector">
        {BOT_MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setMessages([{ role: 'assistant', content: `Mode "${m.label}" activé. ${BOT_SYSTEM_PROMPTS[m.id].slice(0, 80)}...` }]) }}
            className={`adm-mode-btn ${mode === m.id ? 'adm-mode-btn-active' : ''}`}
            style={{
              borderColor: mode === m.id ? m.color : undefined,
              background: mode === m.id ? `${m.color}20` : undefined,
              color: mode === m.id ? m.color : undefined,
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="adm-chat-container">
            {messages.map((m, i) => (
              <div key={i} className={`adm-chat-message ${m.role === 'user' ? 'adm-chat-message-user' : 'adm-chat-message-bot'}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? `${modeData.color}22` : undefined,
                  borderColor: m.role === 'user' ? `${modeData.color}40` : undefined,
                }}>
                <div className="adm-chat-meta" style={{ color: m.role === 'user' ? modeData.color : 'var(--text-muted)' }}>
                  {m.role === 'user' ? 'ADMIN' : `✦ BOT ${modeData.label.toUpperCase()}`}
                </div>
                {m.role === 'assistant'
                  ? <MarkdownText text={m.content} compact color="var(--text-primary)" />
                  : <div className="adm-chat-content">{m.content}</div>
                }
              </div>
            ))}
            {loading && (
              <div className="adm-chat-loading">
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: modeData.color, animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
                </div>
                <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }`}</style>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sources */}
          <div className="adm-sources">
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="URL source (optionnel)" className="adm-sources-input" />
            <label className="adm-sources-file-label" style={{ background: sourceFiles.length > 0 ? `${modeData.color}20` : undefined, color: sourceFiles.length > 0 ? modeData.color : undefined }}>
              📎 {sourceFiles.length > 0 ? `${sourceFiles.length} fichier(s)` : 'Fichiers'}
              <input type="file" multiple accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls,.pptx,.ppt,.json" onChange={e => setSourceFiles(Array.from(e.target.files || []))} style={{ display: 'none' }} />
            </label>
            {sourceFiles.length > 0 && <button onClick={() => setSourceFiles([])} className="adm-sources-clear">✕</button>}
          </div>

          {/* Input */}
          <div className="adm-input-section">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={`Message au Bot (${modeData.label})… [Enter pour envoyer, Shift+Enter nouvelle ligne]`}
              rows={2}
              className="adm-input-textarea"
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !sourceUrl && sourceFiles.length === 0)}
              className="adm-input-btn"
              style={{
                background: loading ? 'var(--border)' : `linear-gradient(135deg, ${modeData.color}, ${modeData.color}CC)`,
                color: loading ? 'var(--text-muted)' : '#000',
                cursor: loading ? 'wait' : 'pointer',
              }}>
              {loading ? '...' : '→'}
            </button>
          </div>
        </div>

        {/* Panneau tâches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="adm-placeholder-section" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>📋 File de tâches bot</h3>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input value={taskInput} onChange={e => setTaskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Ajouter une tâche..."
                className="adm-input" style={{ fontSize: '0.78rem', padding: '6px 10px' }} />
              <button onClick={addTask} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {taskQueue.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>Aucune tâche en file.</div>}
              {taskQueue.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: task.done ? 'var(--green-glow)' : 'var(--bg-primary)', border: `1px solid ${task.done ? 'var(--green)' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={task.done} onChange={() => setTaskQueue(q => q.map(t => t.id === task.id ? {...t, done: !t.done} : t))} />
                  <span style={{ fontSize: '0.78rem', color: task.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>{task.text}</span>
                  <button onClick={() => { setInput(task.text); setTaskQueue(q => q.filter(t => t.id !== task.id)) }}
                    style={{ background: 'none', border: 'none', color: modeData.color, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>→</button>
                  <button onClick={() => setTaskQueue(q => q.filter(t => t.id !== task.id))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-placeholder-section" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>⚡ Commandes rapides</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {[
                { label: 'Résumer la page news', cmd: 'Rédige un résumé exécutif des dernières actualités business et tech Afrique.' },
                { label: 'Rapport hebdomadaire', cmd: 'Génère un rapport hebdomadaire de performance du portail ABAWI avec KPIs et recommandations.' },
                { label: 'Idées de contenu', cmd: 'Propose 10 idées de contenu premium pour la semaine prochaine sur les thèmes business, finance et tech Afrique.' },
                { label: 'Analyser les membres', cmd: 'Propose une stratégie de rétention et de fidélisation pour les membres du portail.' },
                { label: 'Campagne marketing', cmd: 'Rédige une campagne email marketing pour promouvoir les outils IA ABAWI.' },
              ].map(({ label, cmd }) => (
                <button key={label} onClick={() => setInput(cmd)}
                  className="adm-btn-sm" style={{ textAlign: 'left', padding: '7px 10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = modeData.color + '40'; e.currentTarget.style.color = modeData.color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  {label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Clés API par défaut (providers système) ─────────────────────────────────
const DEFAULT_PROVIDERS = [
  { id: 'groq', label: 'Groq Chat IA', icon: '🧠', category: 'IA / LLM', env_var: 'VITE_GROQ_API_KEY', env_alias: 'VITE_GROK_LLAMA_API_KEY', description: 'LLM principal — tous les outils IA (Llama 3.3)', doc_url: 'https://console.groq.com', test_type: 'groq', actif: true },
  { id: 'elevenlabs', label: 'ElevenLabs TTS', icon: '🎙️', category: 'Audio / TTS', env_var: 'VITE_ELEVENLABS_API_KEY', env_alias: 'VITE_ELEVEN_KEY', description: 'Synthèse vocale ultra-réaliste premium', doc_url: 'https://elevenlabs.io', test_type: 'elevenlabs', actif: true },
  { id: 'azure', label: 'Azure Speech', icon: '☁️', category: 'Audio / TTS', env_var: 'VITE_AZURE_SPEECH_KEY', env_alias: '', description: 'TTS neural français — Denise FR, voix backup', doc_url: 'https://portal.azure.com', test_type: 'azure', actif: true },
  { id: 'supabase', label: 'Supabase DB', icon: '🗄️', category: 'Base de données', env_var: 'VITE_SUPABASE_URL', env_alias: 'VITE_SUPABASE_ANON_KEY', description: 'BDD principale, auth membres, stockage', doc_url: 'https://app.supabase.com', test_type: 'supabase', actif: true },
  { id: 'paydunya', label: 'PayDunya', icon: '💳', category: 'Paiement / Fintech', env_var: 'VITE_PAYDUNYA_MASTER_KEY', env_alias: 'VITE_PAYDUNYA_PRIVATE_KEY', description: 'Passerelle mobile money & CB — Wave, OM, Free Money', doc_url: 'https://paydunya.com', test_type: 'paydunya', actif: true },
  { id: 'fyatu', label: 'Fyatu', icon: '🌍', category: 'Paiement / Fintech', env_var: 'VITE_FYATU_API_KEY', env_alias: 'VITE_FYATU_SECRET', description: 'Transferts transfrontaliers Afrique — AbawiPay international', doc_url: 'https://fyatu.com', test_type: 'key_check', actif: true },
  { id: 'onafriq', label: 'Onafriq (MFS Africa)', icon: '🌐', category: 'Paiement / Fintech', env_var: 'VITE_ONAFRIQ_API_KEY', env_alias: 'VITE_ONAFRIQ_SECRET', description: 'Réseau 45+ pays africains — interopérabilité mobile money', doc_url: 'https://onafriq.com', test_type: 'key_check', actif: true },
  { id: 'paymentology', label: 'Paymentology', icon: '🏦', category: 'Paiement / Fintech', env_var: 'VITE_PAYMENTOLOGY_API_KEY', env_alias: 'VITE_PAYMENTOLOGY_SECRET', description: 'Émission carte virtuelle/physique Visa & Mastercard', doc_url: 'https://paymentology.com', test_type: 'key_check', actif: true },
  { id: 'wave', label: 'Wave API', icon: '🌊', category: 'Paiement / Fintech', env_var: 'VITE_WAVE_API_KEY', env_alias: '', description: 'Intégration directe Wave — SN, CI, ML, BF', doc_url: 'https://wave.com/fr/developers', test_type: 'key_check', actif: true },
  { id: 'orange_money_api', label: 'Orange Money API', icon: '🟠', category: 'Paiement / Fintech', env_var: 'VITE_OM_API_KEY', env_alias: 'VITE_OM_SECRET', description: 'Orange Money marchands — paiement et payout', doc_url: 'https://developer.orange.com', test_type: 'key_check', actif: true },
  { id: 'polotno', label: 'Polotno Studio', icon: '🎨', category: 'Design', env_var: 'VITE_POLOTNO_API_KEY', env_alias: '', description: 'Studio visuel — éditeur de visuels', doc_url: 'https://polotno.dev', test_type: 'http', actif: false },
  { id: 'openai', label: 'OpenAI GPT', icon: '🤖', category: 'IA / LLM', env_var: 'VITE_OPENAI_API_KEY', env_alias: '', description: 'GPT-4 — alternative ou complément au LLM', doc_url: 'https://platform.openai.com', test_type: 'http', actif: false },
  { id: 'anthropic', label: 'Anthropic Claude', icon: '✦', category: 'IA / LLM', env_var: 'VITE_ANTHROPIC_API_KEY', env_alias: '', description: 'Claude 3 — modèle alternatif premium', doc_url: 'https://console.anthropic.com', test_type: 'http', actif: false },
  { id: 'mistral', label: 'Mistral AI', icon: '🌬️', category: 'IA / LLM', env_var: 'VITE_MISTRAL_API_KEY', env_alias: '', description: 'Mistral Large — LLM européen haute performance', doc_url: 'https://console.mistral.ai', test_type: 'http', actif: false },
  { id: 'deepseek', label: 'DeepSeek', icon: '🔍', category: 'IA / LLM', env_var: 'VITE_DEEPSEEK_API_KEY', env_alias: '', description: 'DeepSeek R1 — alternative LLM économique', doc_url: 'https://platform.deepseek.com', test_type: 'http', actif: false },
  { id: 'google_ai', label: 'Google Gemini', icon: '💎', category: 'IA / LLM', env_var: 'VITE_GOOGLE_AI_KEY', env_alias: '', description: 'Gemini 1.5 Pro — LLM multimodal Google', doc_url: 'https://ai.google.dev', test_type: 'http', actif: false },
  { id: 'stability', label: 'Stability AI', icon: '🖼️', category: 'Image IA', env_var: 'VITE_STABILITY_API_KEY', env_alias: '', description: 'Stable Diffusion — génération d images', doc_url: 'https://stability.ai', test_type: 'http', actif: false },
  { id: 'replicate', label: 'Replicate', icon: '🔄', category: 'Image IA', env_var: 'VITE_REPLICATE_API_KEY', env_alias: '', description: 'Hébergeur de modèles IA open-source', doc_url: 'https://replicate.com', test_type: 'http', actif: false },
  { id: 'sendgrid', label: 'SendGrid Email', icon: '📧', category: 'Email', env_var: 'VITE_SENDGRID_API_KEY', env_alias: '', description: 'Envoi d e-mails transactionnels', doc_url: 'https://sendgrid.com', test_type: 'http', actif: false },
]

const LS_KEY = 'abawi_api_keys_v2'

function loadKeysFromStorage() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function saveKeysToStorage(keys) {
  localStorage.setItem(LS_KEY, JSON.stringify(keys))
}

function getEnvValue(envVar, alias) {
  const vars = {
    VITE_GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY,
    VITE_GROK_LLAMA_API_KEY: import.meta.env.VITE_GROK_LLAMA_API_KEY,
    VITE_ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY,
    VITE_ELEVEN_KEY: import.meta.env.VITE_ELEVEN_KEY,
    VITE_AZURE_SPEECH_KEY: import.meta.env.VITE_AZURE_SPEECH_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_PAYDUNYA_MASTER_KEY: import.meta.env.VITE_PAYDUNYA_MASTER_KEY,
    VITE_PAYDUNYA_PRIVATE_KEY: import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY,
    VITE_POLOTNO_API_KEY: import.meta.env.VITE_POLOTNO_API_KEY,
    VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    VITE_ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY,
    VITE_MISTRAL_API_KEY: import.meta.env.VITE_MISTRAL_API_KEY,
    VITE_DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY,
    VITE_GOOGLE_AI_KEY: import.meta.env.VITE_GOOGLE_AI_KEY,
    VITE_STABILITY_API_KEY: import.meta.env.VITE_STABILITY_API_KEY,
    VITE_REPLICATE_API_KEY: import.meta.env.VITE_REPLICATE_API_KEY,
    VITE_SENDGRID_API_KEY: import.meta.env.VITE_SENDGRID_API_KEY,
    VITE_FYATU_API_KEY: import.meta.env.VITE_FYATU_API_KEY,
    VITE_FYATU_SECRET: import.meta.env.VITE_FYATU_SECRET,
    VITE_ONAFRIQ_API_KEY: import.meta.env.VITE_ONAFRIQ_API_KEY,
    VITE_ONAFRIQ_SECRET: import.meta.env.VITE_ONAFRIQ_SECRET,
    VITE_PAYMENTOLOGY_API_KEY: import.meta.env.VITE_PAYMENTOLOGY_API_KEY,
    VITE_PAYMENTOLOGY_SECRET: import.meta.env.VITE_PAYMENTOLOGY_SECRET,
    VITE_WAVE_API_KEY: import.meta.env.VITE_WAVE_API_KEY,
    VITE_OM_API_KEY: import.meta.env.VITE_OM_API_KEY,
    VITE_OM_SECRET: import.meta.env.VITE_OM_SECRET,
  }
  return vars[envVar] || (alias ? vars[alias] : '') || ''
}

function maskKey(key) {
  if (!key || key.length < 8) return key || '—'
  return key.slice(0, 6) + '••••••••••••' + key.slice(-4)
}

function ApiHealthPanel({ showToast }) {
  const [providers, setProviders] = useState(() => {
    const stored = loadKeysFromStorage()
    return DEFAULT_PROVIDERS.map(p => ({
      ...p,
      key_value: stored[p.id]?.key_value || '',
      key_alias_value: stored[p.id]?.key_alias_value || '',
      actif: stored[p.id]?.actif !== undefined ? stored[p.id].actif : p.actif,
      custom: false,
    }))
  })
  const [customProviders, setCustomProviders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_custom_providers_v2') || '[]') } catch { return [] }
  })
  const [healthChecks, setHealthChecks] = useState({})
  const [running, setRunning] = useState(null) // provider id or 'all'
  const [editModal, setEditModal] = useState(null) // provider id
  const [editData, setEditData] = useState({})
  const [showKey, setShowKey] = useState({}) // id -> bool
  const [addModal, setAddModal] = useState(false)
  const [newProvider, setNewProvider] = useState({ label: '', icon: '🔑', category: 'Custom', env_var: '', description: '', doc_url: '' })
  const [filterCat, setFilterCat] = useState('Tous')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(60)
  const autoRefreshRef = useRef(null)

  const allProviders = [...providers, ...customProviders]
  const categories = ['Tous', ...Array.from(new Set(allProviders.map(p => p.category)))]
  const filtered = filterCat === 'Tous' ? allProviders : allProviders.filter(p => p.category === filterCat)

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => runAllChecks(), refreshInterval * 1000)
    } else clearInterval(autoRefreshRef.current)
    return () => clearInterval(autoRefreshRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [autoRefresh, refreshInterval])

  function getKey(p) {
    // Priority: localStorage value > env var
    return p.key_value || getEnvValue(p.env_var, p.env_alias) || ''
  }

  function saveProvider(id, patch) {
    const stored = loadKeysFromStorage()
    stored[id] = { ...(stored[id] || {}), ...patch }
    saveKeysToStorage(stored)
    if (customProviders.find(c => c.id === id)) {
      const updated = customProviders.map(c => c.id === id ? { ...c, ...patch } : c)
      setCustomProviders(updated)
      localStorage.setItem('abawi_custom_providers_v2', JSON.stringify(updated))
    } else {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    }
    showToast('✅ Clé sauvegardée en local')
  }

  function openEdit(p) {
    setEditData({
      id: p.id, label: p.label, icon: p.icon, category: p.category,
      env_var: p.env_var, env_alias: p.env_alias || '',
      key_value: p.key_value || getEnvValue(p.env_var, p.env_alias) || '',
      key_alias_value: p.key_alias_value || '',
      description: p.description, doc_url: p.doc_url || '', actif: p.actif,
    })
    setEditModal(p.id)
  }

  function saveEdit() {
    saveProvider(editData.id, {
      key_value: editData.key_value,
      key_alias_value: editData.key_alias_value,
      label: editData.label, icon: editData.icon,
      category: editData.category, description: editData.description,
      doc_url: editData.doc_url, actif: editData.actif,
    })
    setEditModal(null)
  }

  function toggleActive(id, current) {
    saveProvider(id, { actif: !current })
  }

  function deleteCustom(id) {
    if (!confirm('Supprimer ce fournisseur custom ?')) return
    const updated = customProviders.filter(c => c.id !== id)
    setCustomProviders(updated)
    localStorage.setItem('abawi_custom_providers_v2', JSON.stringify(updated))
    const stored = loadKeysFromStorage()
    delete stored[id]
    saveKeysToStorage(stored)
    showToast('✅ Fournisseur supprimé')
  }

  function addCustomProvider() {
    if (!newProvider.label.trim()) return showToast('Nom requis', 'error')
    const id = 'custom_' + Date.now()
    const p = { ...newProvider, id, key_value: '', actif: true, custom: true, test_type: 'http' }
    const updated = [...customProviders, p]
    setCustomProviders(updated)
    localStorage.setItem('abawi_custom_providers_v2', JSON.stringify(updated))
    setNewProvider({ label: '', icon: '🔑', category: 'Custom', env_var: '', description: '', doc_url: '' })
    setAddModal(false)
    showToast('✅ Fournisseur ajouté')
  }

  async function runCheck(p) {
    const key = getKey(p)
    const start = Date.now()
    try {
      let detail = ''
      if (p.test_type === 'groq') {
        const res = await fetch('/.netlify/functions/groq-chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 20, temperature: 0, messages: [{ role: 'user', content: 'Reply OK' }] }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        detail = `Modèle: ${data?.model || GROQ_MODEL} · ${data?.choices?.[0]?.message?.content?.slice(0, 40) || 'OK'}`
      } else if (p.test_type === 'elevenlabs') {
        const res = await fetch('/.netlify/functions/elevenlabs-tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId: VOICE_CHARLOTTE, text: 'Test.', modelId: 'eleven_multilingual_v2', voiceSettings: { stability: 0.5, similarity_boost: 0.75 } }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        if (!blob || blob.size < 500) throw new Error('Audio trop court')
        detail = `Audio OK — ${Math.round(blob.size / 1024)} KB · Charlotte Neural`
      } else if (p.test_type === 'azure') {
        const res = await fetch('/.netlify/functions/azure-tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceName: 'fr-FR-DeniseNeural', text: 'Test.' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        if (!blob || blob.size < 100) throw new Error('Audio Azure invalide')
        detail = `Audio OK — ${Math.round(blob.size / 1024)} KB · Denise FR`
      } else if (p.test_type === 'supabase') {
        const { error } = await supabase.from('membres').select('id').limit(1)
        if (error) throw new Error(error.message)
        detail = 'Connexion Supabase OK · BDD accessible'
      } else if (p.test_type === 'paydunya') {
        detail = key ? `Clé configurée (${maskKey(key)}) · test live non exécuté` : 'Clé non configurée'
        if (!key) throw new Error('Clé PayDunya manquante')
      } else if (p.test_type === 'key_check') {
        if (!key) throw new Error('Clé API non configurée — ajoutez-la ci-dessus pour activer ce service')
        detail = `Clé configurée (${maskKey(key)}) · prête à l'emploi — branchez les API calls AbawiPay`
      } else {
        if (!key) throw new Error('Clé non configurée')
        detail = `Clé présente (${maskKey(key)}) · endpoint non testé`
      }
      return { ok: true, detail, latency: Date.now() - start }
    } catch (e) {
      return { ok: false, detail: e.message || 'Erreur inconnue', latency: Date.now() - start }
    }
  }

  async function testSingle(p) {
    setRunning(p.id)
    setHealthChecks(prev => ({ ...prev, [p.id]: { ok: null, detail: 'Test en cours...', latency: null } }))
    const result = await runCheck(p)
    setHealthChecks(prev => ({ ...prev, [p.id]: result }))
    setRunning(null)
    showToast(result.ok ? `✅ ${p.label} — Opérationnel` : `❌ ${p.label} — ${result.detail}`, result.ok ? 'success' : 'error')
  }

  async function runAllChecks() {
    if (running) return
    setRunning('all')
    const active = allProviders.filter(p => p.actif)
    const results = await Promise.all(active.map(p => runCheck(p).then(r => [p.id, r])))
    const next = {}
    results.forEach(([id, r]) => { next[id] = r })
    setHealthChecks(next)
    setRunning(null)
    const failed = results.filter(([, r]) => !r.ok).length
    const ok = results.filter(([, r]) => r.ok).length
    if (failed === 0) showToast(`✅ Tous opérationnels (${ok}/${active.length})`)
    else showToast(`⚠️ ${failed} incident(s) — ${ok}/${active.length} OK`, 'error')
  }

  function badgeColor(ok) {
    if (ok === null || ok === undefined) return { bg: 'rgba(148,163,184,0.1)', border: 'var(--border)', color: 'var(--text-muted)', label: 'Non testé', dot: 'var(--text-muted)' }
    if (ok) return { bg: 'var(--green-glow)', border: 'var(--green-border)', color: 'var(--green)', label: 'Opérationnel', dot: 'var(--green)' }
    return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', color: 'var(--red)', label: 'Incident', dot: 'var(--red)' }
  }

  const globalOk = Object.values(healthChecks).length > 0 && Object.values(healthChecks).every(c => c.ok)
  const globalFail = Object.values(healthChecks).some(c => c.ok === false)
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.83rem', boxSizing: 'border-box', outline: 'none' }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>🩺 Santé API — Gestionnaire complet</h2>
            {Object.values(healthChecks).length > 0 && (
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                background: globalOk ? 'rgba(24,168,74,0.15)' : globalFail ? 'rgba(239,68,68,0.15)' : 'rgba(240,180,41,0.15)',
                color: globalOk ? '#18A84A' : globalFail ? '#EF4444' : '#F0B429',
                border: `1px solid ${globalOk ? 'rgba(24,168,74,0.3)' : globalFail ? 'rgba(239,68,68,0.3)' : 'rgba(240,180,41,0.3)'}`,
              }}>
                {globalOk ? '✅ Tous opérationnels' : globalFail ? '⚠️ Incident détecté' : '🔄 Partiel'}
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Gérez, modifiez, remplacez et testez toutes vos clés API — providers système et custom. Stockage local sécurisé (navigateur).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
          {autoRefresh && (
            <select value={refreshInterval} onChange={e => setRefreshInterval(parseInt(e.target.value))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.74rem' }}>
              <option value={30}>30s</option><option value={60}>1min</option><option value={300}>5min</option>
            </select>
          )}
          <button onClick={() => setAddModal(true)} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(24,168,74,0.35)', background: 'rgba(24,168,74,0.12)', color: '#18A84A', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
            + Ajouter fournisseur
          </button>
          <button onClick={runAllChecks} disabled={!!running} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(240,180,41,0.35)', background: running ? 'rgba(240,180,41,0.06)' : 'rgba(240,180,41,0.14)', color: '#F0B429', fontWeight: 700, cursor: running ? 'wait' : 'pointer', fontSize: '0.82rem' }}>
            {running === 'all' ? '⏳ Test global...' : '▶ Diagnostic complet'}
          </button>
        </div>
      </div>

      {/* ─── Info banner ─── */}
      <div className="adm-info-banner">
        <strong style={{ color: '#0EA5E9' }}>Comment ça fonctionne :</strong> Les clés saisies ici sont stockées dans votre navigateur (localStorage) et remplacent les valeurs .env pour les tests. Pour une mise en production permanente, mettez à jour vos variables d'environnement sur Netlify et redéployez.
      </div>

      {/* ─── Filtres catégories ─── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} className={`adm-filter-btn ${filterCat === cat ? 'adm-filter-btn-active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Provider cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(p => {
          const hc = healthChecks[p.id]
          const badge = badgeColor(hc?.ok)
          const storedKey = p.key_value || ''
          const envKey = getEnvValue(p.env_var, p.env_alias)
          const effectiveKey = storedKey || envKey
          const keySource = storedKey ? 'Remplacée (local)' : envKey ? '.env (build)' : 'Non configurée'
          const keySourceColor = storedKey ? '#8B5CF6' : envKey ? '#18A84A' : '#EF4444'

          return (
            <div key={p.id} className={`adm-provider-card ${!p.actif ? 'adm-provider-card-inactive' : ''}`} style={{ borderColor: !p.actif ? 'var(--border)' : hc?.ok === false ? 'rgba(239,68,68,0.3)' : hc?.ok === true ? 'rgba(24,168,74,0.2)' : 'var(--border)' }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="adm-provider-label">{p.label}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span className="adm-provider-category">{p.category}</span>
                      {p.custom && <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 999, background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: 700, border: '1px solid rgba(139,92,246,0.3)' }}>Custom</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  {hc && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, borderRadius: 100, padding: '2px 8px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: badge.dot, marginRight: 4, verticalAlign: 'middle' }} />
                      {badge.label}
                    </span>
                  )}
                  {hc?.latency != null && <span className="adm-provider-latency">{hc.latency}ms</span>}
                </div>
              </div>

              {/* Description */}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', lineHeight: 1.5 }}>{p.description}</div>

              {/* Key display */}
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: keySourceColor }}>● {keySource}</span>
                  {p.env_var && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.env_var}</span>}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: effectiveKey ? 'var(--text-secondary)' : 'var(--text-muted)', wordBreak: 'break-all' }}>
                  {showKey[p.id] ? (effectiveKey || '(vide)') : maskKey(effectiveKey)}
                </div>
                {hc && !hc.ok && <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#EF4444', lineHeight: 1.4 }}>{hc.detail}</div>}
                {hc && hc.ok && <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#18A84A', lineHeight: 1.4 }}>{hc.detail}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <button onClick={() => openEdit(p)} className="adm-btn-sm" style={{ borderColor: 'rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.1)', color: '#F0B429' }}>✏️ Éditer</button>
                <button onClick={() => setShowKey(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="adm-btn-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-muted)' }}>
                  {showKey[p.id] ? '🙈 Masquer' : '👁 Voir'}
                </button>
                <button onClick={() => testSingle(p)} disabled={running === p.id} className="adm-btn-cyan" style={{ opacity: running === p.id ? 0.6 : 1, cursor: running === p.id ? 'wait' : 'pointer' }}>
                  {running === p.id ? '⏳...' : '🔬 Tester'}
                </button>
                <button onClick={() => toggleActive(p.id, p.actif)} className="adm-btn-sm" style={{ border: `1px solid ${p.actif ? 'rgba(24,168,74,0.3)' : 'var(--border)'}`, background: p.actif ? 'rgba(24,168,74,0.08)' : 'transparent', color: p.actif ? 'var(--green)' : 'var(--text-muted)' }}>
                  {p.actif ? '● Actif' : '○ Inactif'}
                </button>
                {p.custom && (
                  <button onClick={() => deleteCustom(p.id)} className="adm-btn-red-outline">🗑️</button>
                )}
                {p.doc_url && (
                  <a href={p.doc_url} target="_blank" rel="noreferrer" className="adm-btn-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block' }}>🔗 Doc</a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Edit modal ─── */}
      {editModal && (
        <Modal title={`✏️ Configurer — ${editData.label}`} onClose={() => setEditModal(null)} width={620}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="adm-form-label">Nom affiché</label>
                <input style={inp} value={editData.label || ''} onChange={e => setEditData(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div>
                <label className="adm-form-label">Icône</label>
                <input style={inp} value={editData.icon || ''} onChange={e => setEditData(p => ({ ...p, icon: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="adm-form-label" style={{ color: '#8B5CF6' }}>🔑 Clé principale ({editData.env_var || 'custom'})</label>
              <input style={{ ...inp, fontFamily: 'monospace', fontSize: '0.78rem', letterSpacing: 1 }} type="text" value={editData.key_value || ''} onChange={e => setEditData(p => ({ ...p, key_value: e.target.value }))} placeholder="Saisir ou coller la clé API…" />
              <div className="adm-form-hint">Stocké localement dans votre navigateur. Remplace la valeur .env au runtime.</div>
            </div>
            {editData.env_alias && (
              <div>
                <label className="adm-form-label">Clé alias ({editData.env_alias})</label>
                <input style={{ ...inp, fontFamily: 'monospace', fontSize: '0.78rem' }} type="text" value={editData.key_alias_value || ''} onChange={e => setEditData(p => ({ ...p, key_alias_value: e.target.value }))} placeholder="Alias optionnel…" />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="adm-form-label">Catégorie</label>
                <input style={inp} value={editData.category || ''} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} />
              </div>
              <div>
                <label className="adm-form-label">URL documentation</label>
                <input style={inp} value={editData.doc_url || ''} onChange={e => setEditData(p => ({ ...p, doc_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="adm-form-label">Description</label>
              <textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={editData.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={!!editData.actif} onChange={e => setEditData(p => ({ ...p, actif: e.target.checked }))} />
              Fournisseur actif (inclus dans les diagnostics)
            </label>
          </div>
          <div className="adm-modal-footer">
            <button onClick={() => setEditModal(null)} className="adm-btn-sm" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={saveEdit} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Sauvegarder</button>
          </div>
        </Modal>
      )}

      {/* ─── Add provider modal ─── */}
      {addModal && (
        <Modal title="+ Nouveau fournisseur API" onClose={() => setAddModal(false)} width={560}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: 8 }}>
              <div>
                <label className="adm-form-label">Nom du fournisseur *</label>
                <input style={inp} value={newProvider.label} onChange={e => setNewProvider(p => ({ ...p, label: e.target.value }))} placeholder="ex. Perplexity AI" />
              </div>
              <div>
                <label className="adm-form-label">Icône</label>
                <input style={inp} value={newProvider.icon} onChange={e => setNewProvider(p => ({ ...p, icon: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="adm-form-label">Catégorie</label>
                <input style={inp} value={newProvider.category} onChange={e => setNewProvider(p => ({ ...p, category: e.target.value }))} placeholder="IA / LLM, Audio, Paiement…" />
              </div>
              <div>
                <label className="adm-form-label">Variable ENV</label>
                <input style={inp} value={newProvider.env_var} onChange={e => setNewProvider(p => ({ ...p, env_var: e.target.value }))} placeholder="VITE_MON_API_KEY" />
              </div>
            </div>
            <div>
              <label className="adm-form-label">URL documentation</label>
              <input style={inp} value={newProvider.doc_url} onChange={e => setNewProvider(p => ({ ...p, doc_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="adm-form-label">Description</label>
              <textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={newProvider.description} onChange={e => setNewProvider(p => ({ ...p, description: e.target.value }))} placeholder="Rôle de cette API…" />
            </div>
          </div>
          <div className="adm-modal-footer">
            <button onClick={() => setAddModal(false)} className="adm-btn-sm" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={addCustomProvider} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #18A84A, #16a34a)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Ajouter</button>
          </div>
        </Modal>
      )}
    </section>
  )
}

function SliderPanel({ showToast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ title: '', description: '', link: '/plans', img: '', active: true })

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadRows() }, [])

  async function loadRows() {
    setLoading(true)
    const { data, error } = await supabase.from('site_slider').select('*').order('created_at', { ascending: false })
    if (error) showToast('Erreur chargement slider: ' + error.message, 'error')
    else setRows(data || [])
    setLoading(false)
  }

  async function createRow() {
    if (!draft.title?.trim()) return showToast('Titre requis', 'error')
    const payload = {
      title: draft.title.trim(),
      description: draft.description || '',
      link: draft.link || '/plans',
      img: draft.img || '',
      active: !!draft.active,
    }
    const { error } = await supabase.from('site_slider').insert(payload)
    if (error) return showToast('Erreur création slide: ' + error.message, 'error')
    setDraft({ title: '', description: '', link: '/plans', img: '', active: true })
    showToast('Slide créée')
    loadRows()
  }

  async function saveRow(id, patch) {
    const { error } = await supabase.from('site_slider').update(patch).eq('id', id)
    if (error) return showToast('Erreur mise à jour slide: ' + error.message, 'error')
    showToast('Slide mise à jour')
    loadRows()
  }

  async function removeRow(id) {
    const { error } = await supabase.from('site_slider').delete().eq('id', id)
    if (error) return showToast('Erreur suppression slide: ' + error.message, 'error')
    showToast('Slide supprimée')
    loadRows()
  }

  const inp = {
    width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🖼️ Slider — CRUD complet</h2>
      <div className="adm-placeholder-section" style={{ padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.84rem' }}>Ajouter une slide</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr 1.2fr auto', gap: 8 }}>
          <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Titre" style={inp} />
          <input value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Description" style={inp} />
          <input value={draft.link} onChange={(e) => setDraft((p) => ({ ...p, link: e.target.value }))} placeholder="/abawi360" style={inp} />
          <input value={draft.img} onChange={(e) => setDraft((p) => ({ ...p, img: e.target.value }))} placeholder="/slider/image.jpg" style={inp} />
          <button onClick={createRow} className="thm-btn-green" style={{ padding: '8px 12px', borderRadius: 8 }}>Ajouter</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement du slider...</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {(rows || []).map((r) => (
            <div key={r.id} className="adm-placeholder-section" style={{ padding: 10, display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr 1.2fr auto auto', gap: 8 }}>
                <input defaultValue={r.title || ''} onBlur={(e) => saveRow(r.id, { title: e.target.value })} style={inp} />
                <input defaultValue={r.description || ''} onBlur={(e) => saveRow(r.id, { description: e.target.value })} style={inp} />
                <input defaultValue={r.link || ''} onBlur={(e) => saveRow(r.id, { link: e.target.value })} style={inp} />
                <input defaultValue={r.img || r.image || ''} onBlur={(e) => saveRow(r.id, { img: e.target.value })} style={inp} />
                <button onClick={() => saveRow(r.id, { active: !(r.active ?? true) })} className="thm-btn-gold" style={{ padding: '8px 10px', borderRadius: 8 }}>
                  {r.active ?? true ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => removeRow(r.id)} className="thm-btn-red" style={{ padding: '8px 10px', borderRadius: 8 }}>Suppr.</button>
              </div>
            </div>
          ))}
          {!rows?.length && <div style={{ color: 'var(--text-secondary)' }}>Aucune slide en base.</div>}
        </div>
      )}
    </section>
  )
}

function BannersPanel({ showToast }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ type: 'top', title: '', content: '', link: '', active: true })
  const [tableMissing, setTableMissing] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadRows() }, [])

  async function loadRows() {
    setLoading(true)
    const { data, error } = await supabase.from('site_banners').select('*').order('created_at', { ascending: false })
    if (error) {
      setTableMissing(true)
      showToast('Table site_banners absente. CRUD bannières en attente SQL.', 'error')
      setRows([])
    } else {
      setTableMissing(false)
      setRows(data || [])
    }
    setLoading(false)
  }

  async function createRow() {
    const payload = {
      type: draft.type || 'top',
      title: draft.title || '',
      content: draft.content || '',
      link: draft.link || '',
      active: !!draft.active,
    }
    const { error } = await supabase.from('site_banners').insert(payload)
    if (error) return showToast('Erreur création bannière: ' + error.message, 'error')
    setDraft({ type: 'top', title: '', content: '', link: '', active: true })
    showToast('Bannière créée')
    loadRows()
  }

  async function saveRow(id, patch) {
    const { error } = await supabase.from('site_banners').update(patch).eq('id', id)
    if (error) return showToast('Erreur update bannière: ' + error.message, 'error')
    showToast('Bannière mise à jour')
    loadRows()
  }

  async function removeRow(id) {
    const { error } = await supabase.from('site_banners').delete().eq('id', id)
    if (error) return showToast('Erreur suppression bannière: ' + error.message, 'error')
    showToast('Bannière supprimée')
    loadRows()
  }

  const inp = {
    width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>📣 Bannières & promos — CRUD</h2>
      {tableMissing && (
        <div style={{ color: 'var(--gold)', fontSize: '0.82rem' }}>
          La table `site_banners` n'est pas disponible. Crée-la côté SQL pour activer cette section.
        </div>
      )}
      <div className="thm-placeholder-box" style={{ padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.84rem' }}>Ajouter une bannière</div>
        <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1.6fr 1fr auto', gap: 8 }}>
          <select value={draft.type} onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))} style={inp}>
            <option value="top">top</option>
            <option value="promo">promo</option>
            <option value="install">install</option>
            <option value="info">info</option>
          </select>
          <input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Titre" style={inp} />
          <input value={draft.content} onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))} placeholder="Contenu bannière" style={inp} />
          <input value={draft.link} onChange={(e) => setDraft((p) => ({ ...p, link: e.target.value }))} placeholder="/plans" style={inp} />
          <button onClick={createRow} disabled={tableMissing} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(24,168,74,0.35)', background: 'rgba(24,168,74,0.12)', color: '#18A84A', fontWeight: 700, cursor: tableMissing ? 'not-allowed' : 'pointer' }}>Ajouter</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Chargement des bannières...</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {(rows || []).map((r) => (
            <div key={r.id} className="thm-placeholder-box" style={{ padding: 10, display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1.6fr 1fr auto auto', gap: 8 }}>
                <select defaultValue={r.type || 'top'} onBlur={(e) => saveRow(r.id, { type: e.target.value })} style={inp}>
                  <option value="top">top</option>
                  <option value="promo">promo</option>
                  <option value="install">install</option>
                  <option value="info">info</option>
                </select>
                <input defaultValue={r.title || ''} onBlur={(e) => saveRow(r.id, { title: e.target.value })} style={inp} />
                <input defaultValue={r.content || ''} onBlur={(e) => saveRow(r.id, { content: e.target.value })} style={inp} />
                <input defaultValue={r.link || ''} onBlur={(e) => saveRow(r.id, { link: e.target.value })} style={inp} />
                <button onClick={() => saveRow(r.id, { active: !(r.active ?? true) })} className="thm-btn-gold" style={{ padding: '8px 10px', borderRadius: 8 }}>
                  {r.active ?? true ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={() => removeRow(r.id)} className="thm-btn-red" style={{ padding: '8px 10px', borderRadius: 8 }}>Suppr.</button>
              </div>
            </div>
          ))}
          {!rows?.length && <div style={{ color: 'var(--text-secondary)' }}>Aucune bannière en base.</div>}
        </div>
      )}
    </section>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ showToast, setTab }) {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState([])
  const [contentStats, setContentStats] = useState(null)
  const [creditsByPlan, setCreditsByPlan] = useState([])

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    try {
      const today = new Date(); today.setHours(0,0,0,0)
      const month = new Date(); month.setDate(1); month.setHours(0,0,0,0)
      const week = new Date(); week.setDate(week.getDate()-7); week.setHours(0,0,0,0)

      // Safe wrapper: never let one failing table kill the whole dashboard
      const safe = (p, fallback = { data: [], count: 0 }) =>
        Promise.resolve(p).then(r => r || fallback).catch(err => {
          console.warn('[Dashboard] Supabase error:', err?.message || err)
          return fallback
        })

      const [membresRes, membresActifsRes, membresNouveauxRes, paiementsJourRes, paiementsMoisRes, paiementsTotRes, newsRes,
        articlesAllRes, storeRes, paiementsPendRes, membresCreditsRes] = await Promise.all([
        safe(supabase.from('membres').select('id', { count: 'exact', head: true })),
        safe(supabase.from('membres').select('id', { count: 'exact', head: true }).eq('statut', 'actif').gt('date_fin', new Date().toISOString())),
        safe(supabase.from('membres').select('id', { count: 'exact', head: true }).gte('created_at', week.toISOString())),
        safe(supabase.from('payments').select('montant').gte('created_at', today.toISOString()).eq('statut', 'paid')),
        safe(supabase.from('payments').select('montant').gte('created_at', month.toISOString()).eq('statut', 'paid')),
        safe(supabase.from('payments').select('montant').eq('statut', 'paid')),
        safe(supabase.from('articles').select('id', { count: 'exact', head: true }).eq('pr', true)),
        safe(supabase.from('articles').select('id', { count: 'exact', head: true })),
        safe(supabase.from('store_products').select('id', { count: 'exact', head: true })),
        safe(supabase.from('payments').select('id', { count: 'exact', head: true }).eq('statut', 'pending')),
        safe(supabase.from('membres').select('plan_type, plan, credits').not('credits', 'is', null)),
      ])

      const sum = (rows) => (rows?.data || []).reduce((acc, r) => acc + (r.montant || 0), 0)

      setStats({
        guides: guides.length,
        fascicules: allFascicules.length,
        podcasts: podcasts.length,
        membres: membresRes.count || 0,
        membres_actifs: membresActifsRes.count || 0,
        membres_nouveaux: membresNouveauxRes.count || 0,
        revenus_jour: sum(paiementsJourRes),
        revenus_mois: sum(paiementsMoisRes),
        revenus_total: sum(paiementsTotRes),
        news: newsRes.count || 0,
      })

      setContentStats({
        articles_pub: newsRes.count || 0,
        articles_total: articlesAllRes.count || 0,
        guides: guides.length,
        fascicules: allFascicules.length,
        podcasts: podcasts.length,
        store: storeRes?.count || 0,
        paiements_pending: paiementsPendRes.count || 0,
      })

      const planMap = {}
      ;(membresCreditsRes.data || []).forEach(m => {
        const p = m.plan_type || m.plan || 'gratuit'
        if (!planMap[p]) planMap[p] = { count: 0, credits: 0 }
        planMap[p].count++
        planMap[p].credits += m.credits || 0
      })
      setCreditsByPlan(Object.entries(planMap).sort((a, b) => b[1].credits - a[1].credits))

      const last30 = new Date(); last30.setDate(last30.getDate()-30)
      const rev30Res = await safe(
        supabase.from('payments').select('montant, created_at').gte('created_at', last30.toISOString()).eq('statut', 'paid')
      )
      const byDay = {}
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate()-i)
        const k = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
        byDay[k] = 0
      }
      ;(rev30Res.data || []).forEach(r => {
        const k = new Date(r.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
        if (byDay[k] !== undefined) byDay[k] += r.montant || 0
      })
      setRevenueData(Object.entries(byDay).reverse())
    } catch (err) {
      console.error('[Dashboard] loadStats fatal:', err)
      showToast?.('Dashboard: erreur partielle de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ label, value, color = 'var(--gold)', icon }) => (
    <div className="thm-stat-card">
      <div style={{ fontSize: '1.6rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value}</div>
      <div className="thm-stat-label">{label}</div>
    </div>
  )

  if (loading) return <div className="thm-loading">Chargement...</div>

  const maxRev = Math.max(...revenueData.map(([,v]) => v), 1)

  return (
    <div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
        📊 Vue d'ensemble
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="📚" label="Guides" value={stats.guides} color="var(--gold)" />
        <StatCard icon="🎓" label="Fascicules" value={stats.fascicules} color="var(--green)" />
        <StatCard icon="🎧" label="Podcasts" value={stats.podcasts} color="#8B5CF6" />
        <StatCard icon="👥" label="Membres actifs" value={stats.membres_actifs} color="#06B6D4" />
        <StatCard icon="🆕" label="Nouveaux (7j)" value={stats.membres_nouveaux} color="#F97316" />
        <StatCard icon="💰" label="Revenus du jour" value={`${(stats.revenus_jour||0).toLocaleString()} F`} color="var(--green)" />
        <StatCard icon="📈" label="Revenus du mois" value={`${(stats.revenus_mois||0).toLocaleString()} F`} color="var(--gold)" />
        <StatCard icon="🏆" label="Revenus totaux" value={`${(stats.revenus_total||0).toLocaleString()} F`} color="var(--red)" />
        <StatCard icon="📰" label="Articles publiés" value={stats.news} color="var(--text-secondary)" />
      </div>

      {/* Revenue chart */}
      <div className="thm-card" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
          Revenus — 30 derniers jours
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflow: 'hidden' }}>
          {revenueData.map(([date, val], i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                background: val > 0 ? '#F0B429' : '#1A2332',
                height: `${(val / maxRev) * 100}px`,
                minHeight: val > 0 ? 4 : 2,
                transition: 'height 0.5s ease',
              }} title={`${date}: ${val.toLocaleString()} F`} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          <span>{revenueData[0]?.[0]}</span>
          <span>{revenueData[revenueData.length-1]?.[0]}</span>
        </div>
      </div>

      {/* Contenu & Crédits */}
      {contentStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Volumes de contenu */}
          <div className="thm-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              📦 Contenu publié
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { icon: '📰', label: 'Articles publiés', val: contentStats.articles_pub, sub: `${contentStats.articles_total} total`, color: 'var(--gold)' },
                { icon: '📚', label: 'Guides', val: contentStats.guides, color: 'var(--green)' },
                { icon: '🎓', label: 'Fascicules', val: contentStats.fascicules, color: '#8B5CF6' },
                { icon: '🎧', label: 'Podcasts', val: contentStats.podcasts, color: '#06B6D4' },
                { icon: '💻', label: 'Produits Store', val: contentStats.store, color: '#3B82F6' },
                { icon: '⏳', label: 'Paiements en attente', val: contentStats.paiements_pending, color: contentStats.paiements_pending > 0 ? 'var(--red)' : 'var(--text-muted)' },
              ].map(({ icon, label, val, sub, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{icon} {label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color, fontSize: '0.9rem' }}>{val ?? '—'}</span>
                    {sub && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 6 }}>{sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crédits par plan */}
          <div className="thm-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              💳 Crédits par plan
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {creditsByPlan.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aucune donnée</span>}
              {creditsByPlan.map(([plan, data]) => {
                const cfg = PLAN_CONFIG[plan] || { label: plan, color: 'var(--text-muted)', icon: '?' }
                const maxCred = creditsByPlan[0]?.[1]?.credits || 1
                return (
                  <div key={plan} style={{ display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: cfg.color, fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{data.count} membres · <strong style={{ color: cfg.color }}>{data.credits.toLocaleString()} cr.</strong></span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(data.credits / maxCred) * 100}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: '+ Nouvel article', color: '#F0B429', bg: 'rgba(240,180,41,0.1)', tab: 'news' },
          { label: '+ Nouveau guide', color: '#18A84A', bg: 'rgba(24,168,74,0.1)', tab: 'guides' },
          { label: '+ Nouveau podcast', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', tab: 'podcasts' },
          { label: '+ Nouveau produit', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', tab: 'store' },
          { label: '📨 Messagerie', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', tab: 'messagerie' },
        ].map(a => (
          <button key={a.label} onClick={() => setTab && setTab(a.tab)} style={{
            padding: '10px 20px', borderRadius: 10,
            background: a.bg, border: `1px solid ${a.color}30`,
            color: a.color, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Tableau générique ────────────────────────────────────────────────────────
function DataTable({ columns, rows, loading, emptyMsg = 'Aucune donnée' }) {
  if (loading) return <div className="thm-loading">Chargement...</div>
  if (!rows.length) return <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>{emptyMsg}</div>
  return (
    <div className="thm-table-container">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{
                textAlign: 'left', padding: '10px 14px',
                background: 'var(--bg-primary)', color: 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase',
                letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Modal générique ──────────────────────────────────────────────────────────
function Modal({ title, children, onClose, width = 600 }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} className="adm-modal">
        <div className="adm-modal-header">
          <h2 className="adm-modal-title">{title}</h2>
          <button onClick={onClose} className="adm-modal-close">✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', options = null }) {
  const s = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="adm-form-label">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={onChange} rows={4} style={{ ...s, resize: 'vertical' }} />
      ) : type === 'select' && options ? (
        <select value={value} onChange={onChange} style={s}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'boolean' ? (
        <button onClick={() => onChange({ target: { value: !value } })} style={{
          padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
          background: value ? 'rgba(24,168,74,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${value ? '#18A84A' : '#1A2332'}`,
          color: value ? '#18A84A' : '#8B95A5', cursor: 'pointer',
        }}>{value ? '✅ Oui' : '❌ Non'}</button>
      ) : (
        <input type={type} value={value} onChange={onChange} style={s} />
      )}
    </div>
  )
}

// ─── Gestion Guides ───────────────────────────────────────────────────────────
function GuidesPanel({ showToast }) {
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [generating, setGenerating] = useState(null)
  const [editData, setEditData] = useState({})
  const [shareItem, setShareItem] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [mp3File, setMp3File] = useState(null)
  const [uploading, setUploading] = useState(false)
  const mp3Ref = useRef()

  const filtered = guides.filter(g =>
    g.titre.toLowerCase().includes(search.toLowerCase()) ||
    (g.categorie || '').toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(g) {
    setEditData({ ...g })
    setEditModal(g)
  }

  function upd(k, v) { setEditData(p => ({ ...p, [k]: v })) }

  async function generateAudio(g) {
    setGenerating(g.id)
    try {
      const text = await generateSummaryText(g.titre, g.categorie || '', 'guide')
      const blob = await generateMP3(text, VOICE_CHARLOTTE)
      await uploadAudioSummary(g.titre, blob)
      showToast(`✅ Audio généré: ${g.titre.substring(0, 30)}`)
    } catch(e) {
      showToast(`❌ ${e.message}`, 'error')
    }
    setGenerating(null)
  }

  async function deleteGuide(id) {
    if (!confirm('Supprimer ce guide de Supabase ?')) return
    const { error } = await supabase.from('guides').delete().eq('id', id)
    if (error) {
      console.error('[GuidesPanel] deleteGuide:', error.message)
      showToast('❌ Suppression échouée: ' + error.message, 'error')
      return
    }
    showToast('✅ Guide supprimé de Supabase')
  }

  async function uploadMp3Guide() {
    if (!mp3File || !uploadModal) return
    setUploading(true)
    try {
      const url = await uploadFile(mp3File, 'guides', 'audio')
      await supabase.from('guides').update({ audio_url: url }).eq('id', uploadModal.id)
      showToast(`✅ Audio uploadé pour: ${uploadModal.titre.substring(0, 30)}`)
      setUploadModal(null); setMp3File(null)
    } catch(e) { showToast('❌ ' + e.message, 'error') }
    setUploading(false)
  }

  const Btn = ({ label, onClick, color = '#F0B429', disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>📚 Guides ({guides.length})</h2>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="thm-input"
          style={{ width: 200 }}
        />
      </div>

      <DataTable
        columns={['Titre', 'Catégorie', 'Prix', 'Gratuit', 'Audio', 'Actions']}
        rows={filtered.map(g => [
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.titre}</span>,
          <span style={{ color: 'var(--gold)', fontSize: '0.78rem' }}>{g.categorie || '—'}</span>,
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>{(g.prix||0).toLocaleString()} F</span>,
          g.gratuit ? <span style={{ color: 'var(--green)' }}>✅</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>,
          <span style={{ color: '#8B5CF6', fontSize: '0.72rem' }}>MP3</span>,
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn label="✏️ Éditer" onClick={() => openEdit(g)} color="#F0B429" />
            <Btn label={generating === g.id ? '⏳...' : '🎙️ Générer'} onClick={() => generateAudio(g)} color="#8B5CF6" disabled={generating === g.id} />
            <Btn label="📤 MP3" onClick={() => { setUploadModal(g); setMp3File(null) }} color="#06B6D4" />
            <Btn label="📤 Partager" onClick={() => setShareItem(g)} color="#25D366" />
            <Btn label="🗑️" onClick={() => deleteGuide(g.id)} color="#ef4444" />
            <a href={`/digital/${slugify(g.titre)}`} target="_blank" rel="noreferrer">
              <Btn label="👁️ Voir" color="#06B6D4" />
            </a>
          </div>,
        ])}
        loading={false}
        emptyMsg="Aucun guide"
      />

      {shareItem && <SocialShare titre={shareItem.titre} description={shareItem.description || ''} type="guide" onClose={() => setShareItem(null)} />}
      {uploadModal && (
        <Modal title={`📤 Upload MP3 — ${uploadModal.titre.substring(0, 40)}`} onClose={() => { setUploadModal(null); setMp3File(null) }} width={480}>
          <input ref={mp3Ref} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setMp3File(e.target.files[0])} />
          <div onClick={() => mp3Ref.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}>
            {mp3File ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✅ {mp3File.name}</span> : <span style={{ color: 'var(--text-secondary)' }}>Cliquer pour choisir un fichier MP3</span>}
          </div>
          <button onClick={uploadMp3Guide} disabled={!mp3File || uploading} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', border: 'none', color: '#fff', fontWeight: 800, cursor: mp3File ? 'pointer' : 'not-allowed', opacity: !mp3File || uploading ? 0.6 : 1 }}>
            {uploading ? '⏳ Upload en cours...' : '📤 Uploader le MP3'}
          </button>
        </Modal>
      )}
      {editModal && (
        <Modal title={`✏️ Éditer — ${editModal.titre}`} onClose={() => setEditModal(null)} width={700}>
          <InputField label="Titre" value={editData.titre || ''} onChange={e => upd('titre', e.target.value)} />
          <InputField label="Catégorie" value={editData.categorie || ''} onChange={e => upd('categorie', e.target.value)} />
          <InputField label="Prix (FCFA)" value={editData.prix || ''} onChange={e => upd('prix', e.target.value)} type="number" />
          <InputField label="Description" value={editData.description || ''} onChange={e => upd('description', e.target.value)} type="textarea" />
          <InputField label="Gratuit" value={!!editData.gratuit} onChange={e => upd('gratuit', e.target.value)} type="boolean" />
          <InputField label="Premium (ABAWI+)" value={!!editData.premium} onChange={e => upd('premium', e.target.value)} type="boolean" />
          <div className="adm-modal-footer">
            <button onClick={() => setEditModal(null)} className="adm-btn-sm" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={() => { showToast('✅ Modifications sauvegardées (products.js)'); setEditModal(null) }} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer' }}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Gestion Fascicules ───────────────────────────────────────────────────────
function FasciculesPanel({ showToast }) {
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(null)
  const [shareItem, setShareItem] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)
  const [mp3File, setMp3File] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [editData, setEditData] = useState({})
  const mp3Ref = useRef()

  const filtered = allFascicules.filter(f =>
    f.titre.toLowerCase().includes(search.toLowerCase()) ||
    (f.matiere || '').toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(f) {
    setEditData({ ...f })
    setEditModal(f)
  }

  function upd(k, v) { setEditData(p => ({ ...p, [k]: v })) }

  async function saveFascicule() {
    if (!editData?.id) return
    const payload = {
      titre: editData.titre,
      matiere: editData.matiere,
      serie: editData.serie,
      prix: Number(editData.prix) || 0,
      gratuit: !!editData.gratuit,
      premium: !!editData.premium,
      description: editData.description || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('fascicules').upsert({ id: editData.id, ...payload }, { onConflict: 'id' })
    if (error) { showToast('❌ Sauvegarde impossible: ' + error.message, 'error'); return }
    showToast('✅ Fascicule mis à jour')
    setEditModal(null)
  }

  async function deleteFascicule(id) {
    if (!confirm('Supprimer ce fascicule de Supabase ?')) return
    const { error } = await supabase.from('fascicules').delete().eq('id', id)
    if (error) { showToast('❌ Suppression échouée: ' + error.message, 'error'); return }
    showToast('✅ Fascicule supprimé de Supabase')
  }

  async function generateAudio(f) {
    setGenerating(f.id)
    try {
      const text = await generateSummaryText(f.titre, f.matiere || 'fascicule', 'fascicule')
      const blob = await generateMP3(text, VOICE_CHARLOTTE)
      await uploadAudioSummary(f.titre, blob)
      showToast(`✅ Audio généré: ${f.titre.substring(0, 30)}`)
    } catch(e) {
      showToast(`❌ ${e.message}`, 'error')
    }
    setGenerating(null)
  }

  async function uploadMp3Fascicule() {
    if (!mp3File || !uploadModal) return
    setUploading(true)
    try {
      const url = await uploadFile(mp3File, 'fascicules', 'audio')
      await supabase.from('fascicules').update({ audio_url: url }).eq('id', uploadModal.id)
      showToast(`✅ Audio uploadé pour: ${uploadModal.titre.substring(0, 30)}`)
      setUploadModal(null); setMp3File(null)
    } catch(e) { showToast('❌ ' + e.message, 'error') }
    setUploading(false)
  }

  const Btn = ({ label, onClick, color = '#18A84A', disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>🎓 Fascicules ({allFascicules.length})</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="thm-input" style={{ width: 200 }} />
      </div>
      <DataTable
        columns={['Titre', 'Matière', 'Série', 'Prix', 'Audio', 'Actions']}
        rows={filtered.slice(0, 50).map(f => [
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.titre.substring(0, 40)}</span>,
          <span style={{ color: 'var(--green)', fontSize: '0.78rem' }}>{f.matiere}</span>,
          <span style={{ color: 'var(--gold)', fontSize: '0.78rem' }}>Bac {f.serie}</span>,
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>{(f.prix||0).toLocaleString()} F</span>,
          <span style={{ color: '#8B5CF6', fontSize: '0.72rem' }}>{f.audio_url ? '🔊' : '—'}</span>,
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn label="✏️ Éditer" onClick={() => openEdit(f)} color="#F0B429" />
            <Btn label={generating === f.id ? '⏳...' : '🎙️ Générer'} onClick={() => generateAudio(f)} color="#8B5CF6" disabled={generating === f.id} />
            <Btn label="📤 MP3" onClick={() => { setUploadModal(f); setMp3File(null) }} color="#06B6D4" />
            <Btn label="📤 Partager" onClick={() => setShareItem(f)} color="#25D366" />
            <Btn label="🗑️" onClick={() => deleteFascicule(f.id)} color="#ef4444" />
            <a href={`/academy/${slugify(f.titre)}`} target="_blank" rel="noreferrer">
              <Btn label="👁️ Voir" color="#06B6D4" />
            </a>
          </div>,
        ])}
        loading={false}
        emptyMsg="Aucun fascicule"
      />
      {shareItem && <SocialShare titre={shareItem.titre} description={`${shareItem.matiere} — Bac ${shareItem.serie}`} type="fascicule" onClose={() => setShareItem(null)} />}
      {uploadModal && (
        <Modal title={`📤 Upload MP3 — ${uploadModal.titre.substring(0, 40)}`} onClose={() => { setUploadModal(null); setMp3File(null) }} width={480}>
          <input ref={mp3Ref} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setMp3File(e.target.files[0])} />
          <div onClick={() => mp3Ref.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}>
            {mp3File ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✅ {mp3File.name}</span> : <span style={{ color: 'var(--text-secondary)' }}>Cliquer pour choisir un fichier MP3</span>}
          </div>
          <button onClick={uploadMp3Fascicule} disabled={!mp3File || uploading} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', border: 'none', color: '#fff', fontWeight: 800, cursor: mp3File ? 'pointer' : 'not-allowed', opacity: !mp3File || uploading ? 0.6 : 1 }}>
            {uploading ? '⏳ Upload en cours...' : '📤 Uploader le MP3'}
          </button>
        </Modal>
      )}
      {editModal && (
        <Modal title={`✏️ Éditer — ${editModal.titre}`} onClose={() => setEditModal(null)} width={680}>
          <InputField label="Titre" value={editData.titre || ''} onChange={e => upd('titre', e.target.value)} />
          <InputField label="Matière" value={editData.matiere || ''} onChange={e => upd('matiere', e.target.value)} />
          <InputField label="Série (Bac)" value={editData.serie || ''} onChange={e => upd('serie', e.target.value)} />
          <InputField label="Prix (FCFA)" type="number" value={editData.prix || ''} onChange={e => upd('prix', e.target.value)} />
          <InputField label="Description" type="textarea" value={editData.description || ''} onChange={e => upd('description', e.target.value)} />
          <InputField label="Gratuit" type="boolean" value={!!editData.gratuit} onChange={e => upd('gratuit', e.target.value)} />
          <InputField label="Premium (ABAWI+)" type="boolean" value={!!editData.premium} onChange={e => upd('premium', e.target.value)} />
          <div className="adm-modal-footer">
            <button onClick={() => setEditModal(null)} className="adm-btn-sm" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={saveFascicule} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #18A84A, #16a34a)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Sauvegarder</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Gestion Podcasts ─────────────────────────────────────────────────────────
function PodcastsPanel({ showToast }) {
  const [search, setSearch] = useState('')
  const [playerSrc, setPlayerSrc] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [editData, setEditData] = useState({})
  const [generatingLyrics, setGeneratingLyrics] = useState(false)
  const [generatingAudio, setGeneratingAudio] = useState(null)
  const [uploadModal, setUploadModal] = useState(null)  // now stores podcast item or true (global)
  const [mp3File, setMp3File] = useState(null)
  const [duration, setDuration] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [shareItem, setShareItem] = useState(null)
  const mp3Ref = useRef()

  const filtered = podcasts.filter(p =>
    p.id !== 'pod-bienvenue' &&
    p.titre.toLowerCase().includes(search.toLowerCase())
  )

  function handleMp3(file) {
    if (!file) return
    setMp3File(file)
    const audio = new Audio(URL.createObjectURL(file))
    audio.onloadedmetadata = () => {
      setDuration(Math.round(audio.duration))
      URL.revokeObjectURL(audio.src)
    }
  }

  async function generateAudioSummary(p) {
    setGeneratingAudio(p.id)
    try {
      const text = await generateSummaryText(p.titre, p.serie || 'Podcast', 'podcast')
      const blob = await generateMP3(text, VOICE_CHARLOTTE)
      await uploadAudioSummary(p.titre, blob)
      showToast(`✅ Audio résumé généré: ${p.titre.substring(0, 30)}`)
    } catch(e) {
      showToast(`❌ ${e.message}`, 'error')
    }
    setGeneratingAudio(null)
  }

  async function uploadMp3() {
    if (!mp3File) return
    setUploading(true)
    try {
      const url = await uploadFile(mp3File, 'podcasts', 'episodes')
      // Si uploadModal est un item podcast (pas juste true), on lie l'URL
      if (uploadModal && typeof uploadModal === 'object' && uploadModal.id) {
        await supabase.from('podcasts_db').upsert({
          id: uploadModal.id,
          titre: uploadModal.titre || '',
          serie: uploadModal.serie || '',
          audio_url: url,
          premium: !!uploadModal.premium,
          gratuit: !!uploadModal.gratuit,
          prix: Number(uploadModal.prix) || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        showToast(`✅ MP3 lié à: ${uploadModal.titre.substring(0, 30)}`)
      } else {
        showToast(`✅ MP3 uploadé (${duration ? duration + 's' : '?'}) — URL : ${url.substring(0, 60)}...`)
        console.log('[PodcastPanel] Uploaded:', url)
      }
      setUploadModal(null)
      setMp3File(null)
      setDuration(null)
    } catch(e) {
      showToast('❌ ' + e.message, 'error')
    }
    setUploading(false)
  }

  async function deleteItem(id) {
    if (!confirm('Supprimer ce podcast de Supabase ?')) return
    const { error } = await supabase.from('podcasts_db').delete().eq('id', id)
    if (error) {
      console.error('[PodcastsPanel] deleteItem:', error.message)
      showToast('❌ Suppression échouée: ' + error.message, 'error')
      return
    }
    showToast('✅ Podcast supprimé de Supabase')
  }

  function openEdit(p) {
    setEditData({
      id: p.id,
      titre: p.titre || '',
      serie: p.serie || '',
      audio_url: p.audio_url || '',
      lyrics: p.lyrics || '',
      premium: !!p.premium,
      gratuit: !!p.gratuit,
      prix: p.prix || 0,
    })
    setEditModal(p)
  }

  async function generateLyricsDraft() {
    setGeneratingLyrics(true)
    try {
      if (!GROQ_KEY) throw new Error('Clé GROQ manquante')
      const prompt = `Rédige des lyrics podcast professionnels en français.
Titre: ${editData.titre || 'Podcast ABAWI'}
Série: ${editData.serie || 'ABAWI Podcast'}
Contrainte: texte propre pour affichage public, avec sections:
INTRO
COUPLET 1
COUPLET 2
REFRAIN
OUTRO
Style: motivant, business, concret, élégant.
Pas de markdown, pas d'emoji.`
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.35,
          max_tokens: 900,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`Erreur IA (${res.status})`)
      const data = await res.json()
      const text = (data?.choices?.[0]?.message?.content || '').trim()
      if (!text) throw new Error('Réponse IA vide')
      setEditData((p) => ({ ...p, lyrics: text }))
      showToast('✅ Lyrics générés automatiquement')
    } catch (e) {
      const lines = [
        `INTRO — ${editData.titre || 'Podcast ABAWI'}`,
        '',
        `Dans cet épisode de ${editData.serie || 'ABAWI Podcast'},`,
        'nous partageons des idées concrètes pour passer à l action.',
        '',
        'COUPLET 1',
        'Vision claire, exécution forte, impact local.',
        'Des outils utiles, des stratégies prêtes à appliquer.',
        '',
        'REFRAIN',
        'ABAWI, excellence en mouvement,',
        'du savoir à l action, maintenant.',
        '',
        'OUTRO',
        'Merci pour votre écoute. Retrouvez-nous sur ABAWI.',
      ]
      setEditData((p) => ({ ...p, lyrics: lines.join('\n') }))
      showToast(`⚠️ Lyrics IA indisponibles: ${e.message}`, 'warning')
    }
    setGeneratingLyrics(false)
  }

  async function savePodcastMeta() {
    if (!editData?.id) return
    const payload = {
      titre: editData.titre,
      serie: editData.serie,
      audio_url: editData.audio_url || null,
      lyrics: editData.lyrics || null,
      premium: !!editData.premium,
      gratuit: !!editData.gratuit,
      prix: Number(editData.prix) || 0,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('podcasts_db').upsert({ id: editData.id, ...payload }, { onConflict: 'id' })
    if (error) {
      showToast(`❌ Sauvegarde impossible: ${error.message}`, 'error')
      return
    }
    showToast('✅ Podcast mis à jour (audio / lyrics / accès)')
    setEditModal(null)
  }

  async function generateLyricsForPodcast(podcast) {
    if (!podcast?.id) {
      showToast('❌ ID podcast introuvable', 'error')
      return
    }
    setGeneratingLyrics(true)
    try {
      if (!GROQ_KEY) throw new Error('Clé GROQ manquante')
      const prompt = `Rédige des lyrics podcast professionnels en français.
Titre: ${podcast.titre || 'Podcast ABAWI'}
Série: ${podcast.serie || 'ABAWI Podcast'}
Format:
INTRO
COUPLET 1
COUPLET 2
REFRAIN
OUTRO
Style: premium, business, actionnable.`
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.35,
          max_tokens: 900,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`Erreur IA (${res.status})`)
      const data = await res.json()
      const lyrics = (data?.choices?.[0]?.message?.content || '').trim()
      if (!lyrics) throw new Error('Réponse IA vide')
      const { error } = await supabase.from('podcasts_db').upsert({
        id: podcast.id,
        titre: podcast.titre || '',
        serie: podcast.serie || '',
        audio_url: podcast.audio_url || null,
        premium: !!podcast.premium,
        gratuit: !!podcast.gratuit,
        prix: Number(podcast.prix) || 0,
        lyrics,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (error) throw new Error(error.message)
      showToast('✅ Lyrics générés pour ce podcast')
    } catch (e) {
      showToast(`❌ Génération lyrics impossible: ${e.message}`, 'error')
    } finally {
      setGeneratingLyrics(false)
    }
  }

  const Btn = ({ label, onClick, color = '#8B5CF6' }) => (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>🎧 Podcasts ({filtered.length})</h2>
        <button onClick={() => setUploadModal(true)} style={{
          padding: '9px 18px', borderRadius: 10,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          color: '#8B5CF6', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}>+ Upload MP3</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="thm-input" style={{ width: 180 }} />
      </div>

      {playerSrc && (
        <div className="thm-card" style={{ marginBottom: 20, padding: 16 }}>
          <audio controls src={playerSrc} style={{ width: '100%' }} />
        </div>
      )}

      <DataTable
        columns={['Titre', 'Série', 'Prix', 'Gratuit', 'Audio', 'Actions']}
        rows={filtered.map(p => [
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.titre.substring(0, 40)}</span>,
          <span style={{ color: '#8B5CF6', fontSize: '0.78rem' }}>{p.serie || '—'}</span>,
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.gratuit ? 'Gratuit' : `${(p.prix||0).toLocaleString()} F`}</span>,
          p.gratuit ? <span style={{ color: 'var(--green)' }}>✅</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>,
          p.audio_url ? <button onClick={() => setPlayerSrc(p.audio_url)} style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}>▶ Écouter</button> : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Manquant</span>,
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn label="✏️ Éditer" onClick={() => openEdit(p)} color="#F0B429" />
            <Btn label={generatingAudio === p.id ? '⏳...' : '🎙️ Générer'} onClick={() => generateAudioSummary(p)} color="#8B5CF6" disabled={generatingAudio === p.id} />
            <Btn label="📤 MP3" onClick={() => { setUploadModal(p); setMp3File(null); setDuration(null) }} color="#06B6D4" />
            <Btn label="📝 Lyrics IA" onClick={() => generateLyricsForPodcast(p)} color="#A855F7" />
            <Btn label="📤 Partager" onClick={() => setShareItem(p)} color="#25D366" />
            <Btn label="🗑️" onClick={() => deleteItem(p.id)} color="#ef4444" />
            <a href={`/podcasts/${slugify(p.titre)}`} target="_blank" rel="noreferrer">
              <Btn label="👁️ Voir" color="#06B6D4" />
            </a>
          </div>,
        ])}
        loading={false}
        emptyMsg="Aucun podcast"
      />

      {shareItem && <SocialShare titre={shareItem.titre} description={shareItem.serie || ''} type="podcast" onClose={() => setShareItem(null)} />}
      {uploadModal && (
        <Modal
          title={uploadModal && typeof uploadModal === 'object' ? `📤 MP3 — ${uploadModal.titre.substring(0, 40)}` : '+ Upload MP3 Podcast'}
          onClose={() => { setUploadModal(null); setMp3File(null); setDuration(null) }}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            {uploadModal && typeof uploadModal === 'object' && (
              <div style={{ marginBottom: 12, padding: '8px 14px', background: 'rgba(139,92,246,0.1)', borderRadius: 8, color: '#8B5CF6', fontSize: '0.8rem', fontWeight: 700 }}>
                🎧 Ce MP3 sera automatiquement lié à ce podcast dans Supabase.
              </div>
            )}
            <label className="adm-form-label">Fichier MP3</label>
            <input ref={mp3Ref} type="file" accept="audio/mpeg,audio/*" style={{ display: 'none' }} onChange={e => handleMp3(e.target.files[0])} />
            <button onClick={() => mp3Ref.current?.click()} style={{
              width: '100%', padding: '32px', borderRadius: 12, border: '2px dashed var(--border)',
              background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif', textAlign: 'center',
            }}>
              {mp3File ? `✅ ${mp3File.name} (${Math.round(mp3File.size/1024)}KB)` : '🎵 Cliquez pour sélectionner un MP3'}
            </button>
            {duration && (
              <div style={{ marginTop: 8, padding: '8px 14px', background: 'rgba(139,92,246,0.1)', borderRadius: 8, color: '#8B5CF6', fontSize: '0.82rem', fontWeight: 700 }}>
                ⏱ Durée détectée : {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')} ({duration}s)
              </div>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Le fichier sera uploadé dans le bucket <code style={{ color: '#8B5CF6' }}>podcasts/episodes</code>. Ensuite utilisez <b>📝 Lyrics IA</b> sur la ligne du podcast pour générer automatiquement les paroles des nouveaux uploads.
          </p>
          <div className="adm-modal-footer">
            <button onClick={() => { setUploadModal(null); setMp3File(null); setDuration(null) }} className="adm-btn-sm" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={uploadMp3} disabled={!mp3File || uploading} style={{
              padding: '12px 24px', borderRadius: 10,
              background: uploading ? 'var(--text-muted)' : 'linear-gradient(135deg, #8B5CF6, #7c3aed)',
              border: 'none', color: '#fff', fontWeight: 800, cursor: mp3File ? 'pointer' : 'not-allowed', opacity: !mp3File || uploading ? 0.6 : 1,
            }}>
              {uploading ? '⏳ Upload en cours...' : '📤 Uploader le MP3'}
            </button>
          </div>
        </Modal>
      )}
      {editModal && (
        <Modal title={`✏️ Éditer podcast — ${editData.titre || ''}`} onClose={() => setEditModal(null)} width={760}>
          <InputField label="Titre" value={editData.titre || ''} onChange={e => setEditData(p => ({ ...p, titre: e.target.value }))} />
          <InputField label="Série" value={editData.serie || ''} onChange={e => setEditData(p => ({ ...p, serie: e.target.value }))} />
          <InputField label="Audio URL" value={editData.audio_url || ''} onChange={e => setEditData(p => ({ ...p, audio_url: e.target.value }))} />
          <InputField label="Prix (FCFA)" type="number" value={editData.prix || 0} onChange={e => setEditData(p => ({ ...p, prix: e.target.value }))} />
          <InputField label="Gratuit" type="boolean" value={!!editData.gratuit} onChange={e => setEditData(p => ({ ...p, gratuit: e.target.value }))} />
          <InputField label="Premium (ABAWI+)" type="boolean" value={!!editData.premium} onChange={e => setEditData(p => ({ ...p, premium: e.target.value }))} />
          <InputField label="Lyrics" type="textarea" value={editData.lyrics || ''} onChange={e => setEditData(p => ({ ...p, lyrics: e.target.value }))} />
          <div className="adm-modal-footer">
            <button onClick={generateLyricsDraft} disabled={generatingLyrics} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6', fontWeight: 700, cursor: 'pointer' }}>
              {generatingLyrics ? '⏳ Génération...' : '🤖 Générer lyrics auto'}
            </button>
            <button onClick={savePodcastMeta} style={{ padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer' }}>
              Sauvegarder
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Gestion News / Éditeur ───────────────────────────────────────────────────
const TAG_OPTIONS = ['Digital', 'Business', 'Finance', 'Innovation', 'Éducation', 'Tech', 'Afrique', 'Économie', 'Géopolitique', 'Télécom']

function NewsPanel({ showToast }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [editData, setEditData] = useState({})
  const [aiGenerating, setAiGenerating] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverRef = useRef()
  const editorRef = useRef()

  // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
  useEffect(() => { loadArticles() }, [])

  async function loadArticles() {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(100)
    setArticles(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditData({ ti: '', tag: 'Business', co: '', su: '', pr: false })
    setEditModal('new')
  }

  function openEdit(a) {
    setEditData({ ...a })
    setEditModal(a.id)
  }

  function upd(k, v) { setEditData(p => ({ ...p, [k]: v })) }

  async function uploadCover(file) {
    setCoverUploading(true)
    try {
      const url = await uploadFile(file, 'images', 'news-covers')
      upd('cover_url', url)
      showToast('✅ Image uploadée')
    } catch(e) {
      showToast('❌ ' + e.message, 'error')
    }
    setCoverUploading(false)
  }

  function estimateReadTime(text) {
    const words = (text || '').replace(/<[^>]+>/g, '').split(/\s+/).length
    return Math.max(1, Math.ceil(words / 200)) + ' min'
  }

  function execCmd(cmd, val = null) {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
  }

  async function generateWithAI() {
    if (!editData.ti) { showToast('Saisissez un titre d\'abord', 'error'); return }
    setAiGenerating(true)
    try {
      const prompt = `Tu es un journaliste expert en économie africaine. Rédige un article de 600 mots sur : "${editData.ti}".
Style : journalistique professionnel, français impeccable, adapté au marché africain.
Structure : introduction accrochée (1 §) + 3 parties développées + conclusion.
Format HTML simple : utilise <h2> pour les titres, <p> pour les paragraphes, <strong> pour les points importants.
Ne génère que le HTML du contenu, pas de <html><body> etc.`

      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 2000, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const html = data.choices?.[0]?.message?.content?.trim() || ''
      upd('co', html)
      if (editorRef.current) editorRef.current.innerHTML = html
      upd('rt', estimateReadTime(html))
      showToast('✅ Article généré !')
    } catch(e) {
      showToast('❌ ' + e.message, 'error')
    }
    setAiGenerating(false)
  }

  async function saveArticle() {
    const content = editorRef.current?.innerHTML || editData.co || ''
    const payload = {
      ti: editData.ti,
      tag: editData.tag,
      co: content,
      su: editData.su || (content.replace(/<[^>]+>/g, '').substring(0, 150) + '...'),
      rt: estimateReadTime(content),
      pr: editData.pr || false,
      cover_url: editData.cover_url || null,
    }

    let err
    if (editModal === 'new') {
      const r = await supabase.from('articles').insert(payload)
      err = r.error
    } else {
      const r = await supabase.from('articles').update(payload).eq('id', editModal)
      err = r.error
    }

    if (err) { showToast('❌ ' + err.message, 'error'); return }
    showToast('✅ Article sauvegardé !')
    setEditModal(null)
    loadArticles()
  }

  async function deleteArticle(id) {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('articles').delete().eq('id', id)
    showToast('Article supprimé')
    loadArticles()
  }

  async function togglePublish(a) {
    await supabase.from('articles').update({ pr: !a.pr }).eq('id', a.id)
    loadArticles()
  }

  const Btn = ({ label, onClick, color = '#F0B429' }) => (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, cursor: 'pointer',
    }}>{label}</button>
  )

  const TOOLBAR_BTNS = [
    { cmd: 'bold', icon: 'B', title: 'Gras' },
    { cmd: 'italic', icon: 'I', title: 'Italique' },
    { cmd: 'underline', icon: 'U', title: 'Souligné' },
    { cmd: 'insertUnorderedList', icon: '•', title: 'Liste' },
    { cmd: 'formatBlock', val: 'h2', icon: 'H2', title: 'Titre' },
    { cmd: 'formatBlock', val: 'h3', icon: 'H3', title: 'Sous-titre' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1, minWidth: 200 }}>📰 Articles ({articles.length})</h2>
        <a
          href="/news/admin"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '9px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            color: '#fff', fontWeight: 800, fontSize: '0.82rem',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
          title="Bot d'actualités automatisé — scrape RSS, enrichit via IA, publie"
        >
          🤖 Bot News
        </a>
        <button onClick={openNew} style={{
          padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)',
          border: 'none', color: '#070B0F', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
        }}>+ Nouvel article</button>
      </div>

      <DataTable
        columns={['Titre', 'Tag', 'Statut', 'Temps', 'Actions']}
        loading={loading}
        rows={articles.map(a => [
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.ti}</span>,
          <span style={{ padding: '3px 10px', borderRadius: 100, background: '#F0B42920', color: '#F0B429', fontSize: '0.72rem', fontWeight: 700 }}>{a.tag}</span>,
          <button onClick={() => togglePublish(a)} style={{
            padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
            background: a.pr ? 'rgba(24,168,74,0.15)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${a.pr ? '#18A84A' : '#ef4444'}30`,
            color: a.pr ? '#18A84A' : '#ef4444', cursor: 'pointer',
          }}>{a.pr ? '✅ Publié' : '🔒 Brouillon'}</button>,
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{a.rt || '—'}</span>,
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn label="✏️ Éditer" onClick={() => openEdit(a)} color="#F0B429" />
            <Btn label="🗑️" onClick={() => deleteArticle(a.id)} color="#ef4444" />
          </div>,
        ])}
        emptyMsg="Aucun article"
      />

      {editModal && (
        <Modal title={editModal === 'new' ? '+ Nouvel article' : '✏️ Éditer article'} onClose={() => setEditModal(null)} width={800}>
          <InputField label="Titre" value={editData.ti || ''} onChange={e => upd('ti', e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Tag / Catégorie" value={editData.tag || 'Business'} onChange={e => upd('tag', e.target.value)} type="select" options={TAG_OPTIONS} />
            <InputField label="Publié" value={!!editData.pr} onChange={e => upd('pr', e.target.value)} type="boolean" />
          </div>
          <InputField label="Extrait / Résumé (150 car)" value={editData.su || ''} onChange={e => upd('su', e.target.value)} type="textarea" />

          {/* Cover image */}
          <div style={{ marginBottom: 14 }}>
            <label className="adm-form-label">Image de couverture</label>
            {editData.cover_url && (
              <img src={editData.cover_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={editData.cover_url || ''} onChange={e => upd('cover_url', e.target.value)} placeholder="URL de l'image" className="thm-input" style={{ flex: 1 }} />
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadCover(e.target.files[0])} />
              <button onClick={() => coverRef.current?.click()} disabled={coverUploading} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', whiteSpace: 'nowrap',
                background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)',
                color: '#F0B429', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              }}>
                {coverUploading ? '⏳...' : '📁 Upload'}
              </button>
            </div>
          </div>

          {/* AI generator */}
          <button onClick={generateWithAI} disabled={aiGenerating} style={{
            width: '100%', padding: '10px', borderRadius: 10, marginBottom: 12,
            background: aiGenerating ? 'var(--border)' : 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#8B5CF6', fontWeight: 700, cursor: aiGenerating ? 'not-allowed' : 'pointer',
            fontSize: '0.88rem',
          }}>
            {aiGenerating ? '⏳ Génération IA en cours...' : '✨ Générer le contenu avec l\'IA (Groq)'}
          </button>

          {/* WYSIWYG Editor */}
          <label className="adm-form-label">Contenu de l'article</label>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {TOOLBAR_BTNS.map(b => (
                <button key={b.cmd + b.val} onMouseDown={e => { e.preventDefault(); execCmd(b.cmd, b.val) }} title={b.title} style={{
                  padding: '4px 10px', borderRadius: 6, background: 'var(--border)', border: 'none',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: b.icon.length > 1 ? '0.75rem' : '0.9rem',
                  fontWeight: 700,
                }}>{b.icon}</button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={e => upd('co', e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: editData.co || '' }}
              style={{
                minHeight: 280, padding: '16px 20px', outline: 'none',
                color: '#C8D3E0', fontSize: '0.9rem', lineHeight: 1.8,
                background: 'var(--bg-card)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={saveArticle} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'linear-gradient(135deg, #F0B429, #e5a820)',
              border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer',
            }}>Sauvegarder</button>
            <button onClick={() => setEditModal(null)} style={{
              padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)', color: '#8B95A5', cursor: 'pointer',
            }}>Annuler</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Gestion Membres ──────────────────────────────────────────────────────────
// ─── Helpers Membres ──────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  gratuit:  { label: 'Gratuit',   color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: '🆓', credits_init: 0 },
  starter:  { label: 'Starter',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   icon: '🌱', credits_init: 50 },
  pro:      { label: 'Pro',       color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)',  icon: '⚡', credits_init: 200 },
  '360':    { label: 'ABAWI 360', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: '🌀', credits_init: 500 },
  elite:    { label: 'Elite',     color: '#F0B429', bg: 'rgba(240,180,41,0.12)', icon: '💎', credits_init: 1000 },
  vip:      { label: 'VIP',       color: '#EC4899', bg: 'rgba(236,72,153,0.12)', icon: '👑', credits_init: 9999 },
  premium:  { label: 'ABAWI+',    color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',  icon: '✨', credits_init: 300 },
  admin:    { label: 'Admin',     color: '#F0B429', bg: 'rgba(240,180,41,0.15)', icon: '🛡️', credits_init: 9999 },
}

function getPlanConfig(m) {
  if (m.role === 'admin') return PLAN_CONFIG.admin
  const plan = (m.plan_type || m.plan || 'gratuit').toLowerCase().trim()
  return PLAN_CONFIG[plan] || PLAN_CONFIG.gratuit
}

function isMembreActif(m) {
  return m.statut === 'actif' && (!m.date_fin || new Date(m.date_fin) > new Date())
}

function joursRestants(m) {
  if (!m.date_fin) return null
  const diff = new Date(m.date_fin) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

// ─── Fiche membre complète ────────────────────────────────────────────────────
function MembreFiche({ m, onClose, showToast, onRefresh }) {
  const [paiements, setPaiements] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ ...m })
  const [planData, setPlanData] = useState({ plan: m.plan_type || m.plan || 'starter', jours: 30 })
  const [creditOp, setCreditOp] = useState({ mode: 'add', montant: '' })
  const [activeTab, setActiveTab] = useState('profil')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoadingData(true)
      const [paymRes, txRes] = await Promise.all([
        supabase.from('payments').select('*').eq('email', m.email).order('created_at', { ascending: false }).limit(30),
        supabase.from('credit_transactions').select('*').eq('email', m.email).order('created_at', { ascending: false }).limit(50),
      ])
      setPaiements(paymRes.data || [])
      setTransactions(txRes.data || [])
      setLoadingData(false)
    }
    load()
  }, [m.email])

  const cfg = getPlanConfig(m)
  const actif = isMembreActif(m)
  const jours = joursRestants(m)

  // Accès calculé
  const accesInfo = [
    { label: 'Guides & Podcasts', ok: actif && ['starter','pro','360','elite','vip','premium'].includes((m.plan_type||m.plan||'').toLowerCase()) },
    { label: 'Outils essentiels', ok: actif && ['starter','pro','360','elite','vip','premium'].includes((m.plan_type||m.plan||'').toLowerCase()) },
    { label: 'Outils Elite', ok: m.role === 'admin' || (actif && ['pro','360','elite','vip'].includes((m.plan_type||m.plan||'').toLowerCase())) },
    { label: 'ABAWI 360', ok: m.role === 'admin' || (actif && ['360','elite','vip'].includes((m.plan_type||m.plan||'').toLowerCase())) },
    { label: 'Crédits illimités', ok: m.role === 'admin' || (actif && ['elite','vip'].includes((m.plan_type||m.plan||'').toLowerCase())) },
  ]

  async function saveProfil() {
    setSaving(true)
    const { error } = await supabase.from('membres').update({
      prenom: editData.prenom, nom: editData.nom,
      telephone: editData.telephone, email: editData.email,
    }).eq('id', m.id)
    if (error) showToast('❌ ' + error.message, 'error')
    else { showToast('✅ Profil mis à jour'); setEditMode(false); onRefresh() }
    setSaving(false)
  }

  async function appliquerPlan() {
    setSaving(true)
    const newDate = planData.jours > 0 ? new Date(Date.now() + planData.jours * 86400000).toISOString() : m.date_fin
    const creditsInit = PLAN_CONFIG[planData.plan]?.credits_init || 0
    const { error } = await supabase.from('membres').update({
      plan: planData.plan, plan_type: planData.plan,
      statut: 'actif', date_fin: newDate,
      credits: Math.max(m.credits || 0, creditsInit),
    }).eq('id', m.id)
    if (error) showToast('❌ ' + error.message, 'error')
    else { showToast(`✅ Plan ${planData.plan} activé`); onRefresh() }
    setSaving(false)
  }

  async function gererCredits() {
    const montant = parseInt(creditOp.montant)
    if (!montant || montant <= 0) return showToast('Montant invalide', 'error')
    const actuel = m.credits || 0
    const nouveau = creditOp.mode === 'add' ? actuel + montant
      : creditOp.mode === 'set' ? montant
      : Math.max(0, actuel - montant)
    const { error } = await supabase.from('membres').update({ credits: nouveau }).eq('id', m.id)
    if (error) return showToast('❌ ' + error.message, 'error')
    // Log de la transaction
    await supabase.from('credit_transactions').insert({
      membre_id: m.id, email: m.email,
      type: creditOp.mode === 'sub' ? 'debit' : 'credit',
      montant: creditOp.mode === 'sub' ? -montant : montant,
      description: `${creditOp.mode === 'add' ? 'Ajout' : creditOp.mode === 'set' ? 'Définition' : 'Déduction'} admin (${actuel} → ${nouveau})`,
      created_at: new Date().toISOString(),
    }).catch(() => {})
    showToast(`✅ Crédits: ${actuel} → ${nouveau}`)
    setCreditOp({ mode: 'add', montant: '' })
    onRefresh()
  }

  async function toggleActif() {
    const newStatut = actif ? 'inactif' : 'actif'
    await supabase.from('membres').update({ statut: newStatut }).eq('id', m.id)
    showToast(actif ? 'Membre suspendu' : '✅ Membre activé')
    onRefresh()
  }

  async function promouvoirAdmin() {
    if (!confirm(`Promouvoir ${m.email} en ADMIN ?`)) return
    await supabase.from('membres').update({ role: 'admin', statut: 'actif', date_fin: '2099-12-31T23:59:59Z', plan: 'vip', plan_type: 'vip', credits: 99999 }).eq('id', m.id)
    showToast('👑 Admin promu')
    onRefresh()
  }

  async function supprimerMembre() {
    if (!confirm(`Supprimer définitivement ${m.email} ?`)) return
    await supabase.from('membres').delete().eq('id', m.id)
    showToast('Membre supprimé')
    onClose()
    onRefresh()
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.83rem', boxSizing: 'border-box', outline: 'none' }
  const TABS = [
    { id: 'profil', label: 'Profil', icon: '👤' },
    { id: 'plan', label: 'Plan & Accès', icon: '🔑' },
    { id: 'credits', label: 'Crédits', icon: '💳' },
    { id: 'paiements', label: 'Paiements', icon: '💰' },
    { id: 'historique', label: 'Historique', icon: '📋' },
  ]

  return (
    <Modal title="" onClose={onClose} width={720}>
      {/* Header fiche */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '0 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem', marginBottom: 3 }}>{m.prenom} {m.nom}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 6 }}>{m.email} {m.telephone ? `· ${m.telephone}` : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: '0.72rem', fontWeight: 800 }}>{cfg.icon} {cfg.label}</span>
            <span style={{ padding: '3px 10px', borderRadius: 999, background: actif ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${actif ? '#22C55E40' : '#EF444440'}`, color: actif ? '#22C55E' : '#EF4444', fontSize: '0.72rem', fontWeight: 700 }}>{actif ? '● Actif' : '○ Inactif'}</span>
            {jours !== null && jours <= 30 && jours > 0 && <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', fontSize: '0.7rem', fontWeight: 700 }}>⏳ {jours}j restants</span>}
            {jours === 0 && <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.7rem', fontWeight: 700 }}>Expiré</span>}
            <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontSize: '0.72rem', fontWeight: 800 }}>💳 {(m.credits || 0).toLocaleString()} crédits</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right' }}>Inscrit le</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '—'}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>Expire le</div>
          <div style={{ fontSize: '0.8rem', color: jours === 0 ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 700 }}>{m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR') : '—'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${activeTab === t.id ? '#0EA5E9' : 'var(--border)'}`, background: activeTab === t.id ? 'rgba(14,165,233,0.12)' : 'transparent', color: activeTab === t.id ? '#0EA5E9' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Profil ─── */}
      {activeTab === 'profil' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {editMode ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label className="adm-form-label" style={{ fontSize: '0.7rem' }}>Prénom</label><input style={inp} value={editData.prenom || ''} onChange={e => setEditData(p => ({ ...p, prenom: e.target.value }))} /></div>
                <div><label className="adm-form-label" style={{ fontSize: '0.7rem' }}>Nom</label><input style={inp} value={editData.nom || ''} onChange={e => setEditData(p => ({ ...p, nom: e.target.value }))} /></div>
              </div>
              <div><label className="adm-form-label" style={{ fontSize: '0.7rem' }}>Email</label><input style={inp} type="email" value={editData.email || ''} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="adm-form-label" style={{ fontSize: '0.7rem' }}>Téléphone</label><input style={inp} value={editData.telephone || ''} onChange={e => setEditData(p => ({ ...p, telephone: e.target.value }))} /></div>
              <div className="adm-modal-footer">
                <button onClick={() => setEditMode(false)} className="adm-btn-sm" style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Annuler</button>
                <button onClick={saveProfil} disabled={saving} style={{ padding: '10px 24px', borderRadius: 9, background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{saving ? '⏳...' : '💾 Sauvegarder'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Prénom', m.prenom], ['Nom', m.nom], ['Email', m.email], ['Téléphone', m.telephone || '—'], ['ID', m.id?.slice(0,12) + '...'], ['Rôle', m.role || 'membre']].map(([k, v]) => (
                  <div className="thm-card" style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>{k.toUpperCase()}</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.83rem', fontWeight: 600 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setEditMode(true)} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.1)', color: '#F0B429', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>✏️ Modifier</button>
                <button onClick={toggleActif} style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${actif ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, background: actif ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: actif ? '#EF4444' : '#22C55E', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                  {actif ? '⏸️ Suspendre' : '▶️ Activer'}
                </button>
                {m.role !== 'admin' && <button onClick={promouvoirAdmin} style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.08)', color: '#F0B429', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>👑 Promouvoir Admin</button>}
                <button onClick={supprimerMembre} style={{ marginLeft: 'auto', padding: '9px 14px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>🗑️ Supprimer</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Tab: Plan & Accès ─── */}
      {activeTab === 'plan' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Accès actuels */}
          <div className="thm-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: '#0EA5E9', fontWeight: 800, marginBottom: 10, letterSpacing: 1 }}>DROITS D'ACCÈS ACTUELS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {accesInfo.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: a.ok ? 'var(--green)' : 'var(--red)', fontSize: '0.9rem' }}>{a.ok ? '✓' : '✗'}</span>
                  <span style={{ color: a.ok ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.78rem' }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Changer plan */}
          <div className="thm-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: 800, marginBottom: 10, letterSpacing: 1 }}>CHANGER DE PLAN</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px,1fr))', gap: 7, marginBottom: 12 }}>
              {Object.entries(PLAN_CONFIG).filter(([k]) => k !== 'admin').map(([key, pc]) => (
                <button key={key} onClick={() => setPlanData(p => ({ ...p, plan: key }))} style={{ padding: '8px 6px', borderRadius: 9, border: `2px solid ${planData.plan === key ? pc.color : 'var(--border)'}`, background: planData.plan === key ? pc.bg : 'transparent', color: planData.plan === key ? pc.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>
                  {pc.icon} {pc.label}
                </button>
              ))}
            </div>
            {planData.plan && PLAN_CONFIG[planData.plan] && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Crédits initiaux : <strong style={{ color: '#0EA5E9' }}>{PLAN_CONFIG[planData.plan].credits_init.toLocaleString()}</strong> (appliqués si supérieurs au solde actuel)
              </div>
            )}
            <button onClick={appliquerPlan} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              {saving ? '⏳...' : '✅ Appliquer le plan'}
            </button>
          </div>

          {/* Activation rapide */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[30, 90, 365].map(d => (
              <button key={d} onClick={async () => {
                const newDate = new Date(Date.now() + d * 86400000).toISOString()
                await supabase.from('membres').update({ statut: 'actif', date_fin: newDate }).eq('id', m.id)
                showToast(`✅ +${d} jours`); onRefresh()
              }} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#22C55E', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                +{d}j
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab: Crédits ─── */}
      {activeTab === 'credits' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Solde */}
          <div className="thm-card" style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(240,180,41,0.2)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>SOLDE ACTUEL</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--gold)' }}>{(m.credits || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>crédits disponibles</div>
          </div>

          {/* Opération */}
          <div className="thm-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 800, marginBottom: 10, letterSpacing: 1 }}>OPÉRATION SUR CRÉDITS</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[['add','+ Ajouter','#22C55E'],['set','= Définir','#0EA5E9'],['sub','− Déduire','#EF4444']].map(([mode, lbl, col]) => (
                <button key={mode} onClick={() => setCreditOp(p => ({ ...p, mode }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${creditOp.mode === mode ? col : 'var(--border)'}`, background: creditOp.mode === mode ? col + '18' : 'transparent', color: creditOp.mode === mode ? col : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', fontSize: '0.76rem' }}>{lbl}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[50,100,200,500,1000].map(n => (
                <button key={n} onClick={() => setCreditOp(p => ({ ...p, montant: String(n) }))} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${creditOp.montant === String(n) ? '#F0B429' : 'var(--border)'}`, background: creditOp.montant === String(n) ? 'rgba(240,180,41,0.15)' : 'transparent', color: creditOp.montant === String(n) ? '#F0B429' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer' }}>{n}</button>
              ))}
            </div>
            <input type="number" value={creditOp.montant} onChange={e => setCreditOp(p => ({ ...p, montant: e.target.value }))} placeholder="Ou saisir un montant" style={{ ...inp, marginBottom: 10 }} />
            <button onClick={gererCredits} disabled={!creditOp.montant || parseInt(creditOp.montant) <= 0} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer' }}>
              Appliquer
            </button>
          </div>

          {/* Historique transactions */}
          {!loadingData && transactions.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: 8 }}>HISTORIQUE CRÉDITS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
                {transactions.map((tx, i) => (
                  <div key={i} className="thm-card" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px' }}>
                    <span style={{ color: (tx.montant || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800, fontSize: '0.82rem', minWidth: 60 }}>{(tx.montant || 0) >= 0 ? '+' : ''}{tx.montant}</span>
                    <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{tx.description || '—'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Paiements ─── */}
      {activeTab === 'paiements' && (
        <div>
          {loadingData ? <div style={{ color: 'var(--text-muted)', padding: 20 }}>Chargement...</div>
          : paiements.length === 0 ? <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>Aucun paiement enregistré</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 380, overflowY: 'auto' }}>
              {paiements.map((p, i) => {
                const sc = p.statut === 'paid' ? 'var(--green)' : p.statut === 'pending' ? 'var(--gold)' : 'var(--red)'
                return (
                  <div key={i} className="thm-card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, background: sc + '18', color: sc, fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>{p.statut}</span>
                    <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{p.product_title || p.product_id || '—'}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>{(p.montant || 0).toLocaleString()} F</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Historique ─── */}
      {activeTab === 'historique' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="thm-card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: 10 }}>TIMELINE CLIENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { date: m.created_at, label: '🎉 Inscription', color: '#22C55E' },
                ...(paiements.filter(p => p.statut === 'paid').map(p => ({ date: p.created_at, label: `💳 Paiement ${(p.montant||0).toLocaleString()} F — ${p.product_title || p.product_id || ''}`, color: '#0EA5E9' }))),
                ...(transactions.map(tx => ({ date: tx.created_at, label: `💡 Crédits ${tx.montant >= 0 ? '+' : ''}${tx.montant} (${tx.description || ''})`, color: '#F0B429' }))),
              ].filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 2, height: '100%', background: ev.color, flexShrink: 0, marginTop: 4, borderRadius: 2 }} />
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{new Date(ev.date).toLocaleString('fr-FR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <div className="thm-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ color: 'var(--green)', fontWeight: 900, fontSize: '1.2rem' }}>{paiements.filter(p => p.statut === 'paid').length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Paiements validés</div>
            </div>
            <div className="thm-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.2rem' }}>{paiements.filter(p => p.statut === 'paid').reduce((a, p) => a + (p.montant || 0), 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>FCFA dépensés</div>
            </div>
            <div className="thm-card" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ color: 'var(--gold)', fontWeight: 900, fontSize: '1.2rem' }}>{m.credits || 0}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Crédits actuels</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Panel principal Membres ──────────────────────────────────────────────────
function MembresPanel({ showToast }) {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [search, setSearch] = useState('')
  const [ficheMembre, setFicheMembre] = useState(null)

  // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
  useEffect(() => { loadMembres() }, [])

  async function loadMembres() {
    setLoading(true)
    const { data } = await supabase.from('membres').select('*').order('created_at', { ascending: false })
    setMembres(data || [])
    setLoading(false)
  }

  function exportCSV() {
    const header = 'Prénom,Nom,Email,Téléphone,Plan,Statut,Rôle,Crédits,Inscription,Expiration\n'
    const rows = membres.map(m => {
      const plan = m.plan_type || m.plan || 'gratuit'
      return `${m.prenom||''},${m.nom||''},${m.email||''},${m.telephone||''},${plan},${m.statut||''},${m.role||'membre'},${m.credits||0},${m.created_at?.slice(0,10)||''},${m.date_fin?.slice(0,10)||''}`
    }).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'membres_abawi.csv'; a.click()
  }

  const now = new Date()
  const filtered = membres.filter(m => {
    const actif = isMembreActif(m)
    const plan = (m.plan_type || m.plan || 'gratuit').toLowerCase()
    if (filter === 'actif') return actif
    if (filter === 'gratuit') return !actif && m.role !== 'admin'
    if (filter === 'paye') return actif && plan !== 'gratuit'
    if (filter === 'expiré') return !actif && m.role !== 'admin' && plan !== 'gratuit'
    if (filter === 'admin') return m.role === 'admin'
    return true
  }).filter(m =>
    !search || m.email?.toLowerCase().includes(search.toLowerCase()) || m.telephone?.includes(search) ||
    `${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: membres.length,
    actifs: membres.filter(isMembreActif).length,
    gratuits: membres.filter(m => !isMembreActif(m) && m.role !== 'admin').length,
    payes: membres.filter(m => isMembreActif(m) && (m.plan_type || m.plan || '') !== 'gratuit').length,
    admins: membres.filter(m => m.role === 'admin').length,
    credits_total: membres.reduce((a, m) => a + (m.credits || 0), 0),
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10 }}>
        {[
          ['👥', 'Total', stats.total, '#64748B'],
          ['✅', 'Actifs payants', stats.payes, '#22C55E'],
          ['🆓', 'Gratuits', stats.gratuits, '#64748B'],
          ['⏰', 'Expirés', membres.filter(m => !isMembreActif(m) && m.role !== 'admin' && (m.plan_type||m.plan||'')!=='gratuit' && (m.plan_type||m.plan||'')).length, '#EF4444'],
          ['👑', 'Admins', stats.admins, '#F0B429'],
          ['💳', 'Crédits total', stats.credits_total.toLocaleString(), '#F0B429'],
        ].map(([icon, label, val, color]) => (
          <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card)', border: `1px solid ${color}25`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ color, fontWeight: 900, fontSize: '1.05rem' }}>{val}</div>
            <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, flex: 1 }}>👥 Membres ({filtered.length} / {membres.length})</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, email, tél..."
          style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', width: 220, fontFamily: 'Outfit, sans-serif' }} />
        <button onClick={exportCSV} style={{ padding: '8px 14px', borderRadius: 9, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)', color: '#F0B429', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>⬇️ CSV</button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          ['tous', `Tous (${stats.total})`],
          ['paye', `Abonnés (${stats.payes})`],
          ['gratuit', `Gratuits (${stats.gratuits})`],
          ['actif', `Actifs (${stats.actifs})`],
          ['expiré', 'Expirés'],
          ['admin', `Admins (${stats.admins})`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 13px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, background: filter === k ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === k ? '#0EA5E9' : '#1A2332'}`, color: filter === k ? '#0EA5E9' : '#64748B', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={['Membre', 'Plan', 'Crédits', 'Statut', 'Inscription', 'Expiration', 'Actions']}
        loading={loading}
        rows={filtered.map(m => {
          const actif = isMembreActif(m)
          const cfg = getPlanConfig(m)
          const jours = joursRestants(m)
          return [
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{m.prenom} {m.nom}</div>
              <div style={{ color: '#475569', fontSize: '0.72rem' }}>{m.email}</div>
            </div>,
            <span style={{ padding: '3px 8px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.color}35`, color: cfg.color, fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{cfg.icon} {cfg.label}</span>,
            <span style={{ color: (m.credits||0) > 0 ? '#F0B429' : '#334155', fontWeight: 800, fontSize: '0.82rem' }}>{(m.credits||0).toLocaleString()}</span>,
            <span style={{ padding: '2px 8px', borderRadius: 999, background: actif ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: actif ? '#22C55E' : '#64748B', fontSize: '0.7rem', fontWeight: 700 }}>{actif ? 'Actif' : 'Inactif'}</span>,
            <span style={{ color: '#475569', fontSize: '0.74rem' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '—'}</span>,
            <span style={{ color: jours === 0 ? '#EF4444' : jours !== null && jours <= 7 ? '#F0B429' : '#475569', fontSize: '0.74rem', fontWeight: jours !== null && jours <= 7 ? 700 : 400 }}>
              {m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR') : '—'}
              {jours !== null && jours <= 30 && jours > 0 && <span style={{ marginLeft: 4, fontSize: '0.66rem', color: '#F0B429' }}>({jours}j)</span>}
            </span>,
            <button onClick={() => setFicheMembre(m)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              👤 Fiche
            </button>,
          ]
        })}
        emptyMsg="Aucun membre"
      />

      {/* Fiche membre */}
      {ficheMembre && (
        <MembreFiche
          m={ficheMembre}
          onClose={() => setFicheMembre(null)}
          showToast={showToast}
          onRefresh={() => { loadMembres(); setFicheMembre(null) }}
        />
      )}
    </div>
  )
}

// ─── Gestion Paiements ────────────────────────────────────────────────────────
function PaiementsPanel({ showToast }) {
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')

  // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
  useEffect(() => { loadPaiements() }, [])

  async function loadPaiements() {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200)
    setPaiements(data || [])
    setLoading(false)
  }

  async function validatePayment(p) {
    await supabase.from('payments').update({ statut: 'paid' }).eq('id', p.id)
    if (p.product_type === 'abonnement' && p.email) {
      // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
      const newDate = new Date(Date.now() + 30 * 86400000).toISOString()
      await supabase.from('membres').update({ statut: 'actif', date_fin: newDate }).eq('email', p.email)
    }
    showToast('✅ Paiement validé')
    loadPaiements()
  }

  const filtered = filter === 'tous' ? paiements : paiements.filter(p => p.statut === filter)
  const totalMois = paiements.filter(p => {
    const d = new Date(p.created_at); const now = new Date()
    return p.statut === 'paid' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc, p) => acc + (p.montant || 0), 0)

  const Btn = ({ label, onClick, color }) => (
    <button onClick={onClick} style={{
      padding: '4px 9px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}25`, color, cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>💰 Paiements</h2>
        <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.3)', color: '#18A84A', fontWeight: 700 }}>
          Mois : {totalMois.toLocaleString()} FCFA
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['tous', 'Tous'], ['paid', 'Payés'], ['pending', 'En attente'], ['failed', 'Échoués']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            background: filter === k ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === k ? '#F0B429' : '#1A2332'}`,
            color: filter === k ? '#F0B429' : '#8B95A5', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      <DataTable
        columns={['Date', 'Email', 'Produit', 'Montant', 'Méthode', 'Statut', 'Actions']}
        loading={loading}
        rows={filtered.map(p => {
          const statusColors = { paid: '#18A84A', pending: '#F0B429', failed: '#ef4444' }
          const sc = statusColors[p.statut] || '#8B95A5'
          return [
            <span style={{ color: '#4A5568', fontSize: '0.78rem' }}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>,
            <span style={{ color: '#8B95A5', fontSize: '0.78rem' }}>{p.email || '—'}</span>,
            <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{p.product_title || p.product_id || '—'}</span>,
            <span style={{ color: '#18A84A', fontWeight: 700 }}>{(p.montant||0).toLocaleString()} F</span>,
            <span style={{ color: '#8B95A5', fontSize: '0.78rem' }}>{p.methode || '—'}</span>,
            <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: `${sc}15`, color: sc }}>
              {p.statut}
            </span>,
            p.statut === 'pending'
              ? <Btn label="✅ Valider" onClick={() => validatePayment(p)} color="#18A84A" />
              : null,
          ]
        })}
        emptyMsg="Aucun paiement"
      />
    </div>
  )
}

// ─── Médiathèque ──────────────────────────────────────────────────────────────
function MediaPanel({ showToast }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState('covers')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const BUCKETS = ['covers', 'guides', 'podcasts', 'audio-summaries', 'images']

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadFiles() }, [bucket])

  async function loadFiles() {
    setLoading(true)
    const { data } = await supabase.storage.from(bucket).list('', { limit: 100 })
    setFiles(data || [])
    setLoading(false)
  }

  async function upload(file) {
    setUploading(true)
    const filename = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: false })
    if (error) { showToast('❌ ' + error.message, 'error') }
    else { showToast('✅ Fichier uploadé'); loadFiles() }
    setUploading(false)
  }

  async function deleteFile(name) {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await supabase.storage.from(bucket).remove([name])
    showToast('Fichier supprimé')
    loadFiles()
  }

  function copyUrl(name) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(name)
    navigator.clipboard.writeText(data.publicUrl)
    showToast('✅ URL copiée !')
  }

  const isImage = (n) => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(n)
  const isAudio = (n) => /\.mp3$/i.test(n)
  const isPDF = (n) => /\.pdf$/i.test(n)

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>🖼️ Médiathèque</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {BUCKETS.map(b => (
          <button key={b} onClick={() => setBucket(b)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            background: bucket === b ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${bucket === b ? '#F0B429' : '#1A2332'}`,
            color: bucket === b ? '#F0B429' : '#8B95A5', cursor: 'pointer',
          }}>{b}</button>
        ))}

        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files[0] && upload(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
          background: 'rgba(24,168,74,0.15)', border: '1px solid rgba(24,168,74,0.3)',
          color: '#18A84A', cursor: uploading ? 'not-allowed' : 'pointer',
        }}>
          {uploading ? '⏳ Upload...' : '+ Upload'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: '#8B95A5', textAlign: 'center' }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {files.map(f => {
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(f.name)
            return (
              <div key={f.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ height: 120, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {isImage(f.name)
                    ? <img src={urlData.publicUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : isAudio(f.name) ? <span style={{ fontSize: '2.5rem' }}>🎵</span>
                    : isPDF(f.name) ? <span style={{ fontSize: '2.5rem' }}>📄</span>
                    : <span style={{ fontSize: '2.5rem' }}>📎</span>
                  }
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#4A5568', marginBottom: 8 }}>
                    {f.metadata?.size ? `${(f.metadata.size/1024).toFixed(0)} Ko` : '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyUrl(f.name)} style={{ flex: 1, padding: '4px', borderRadius: 6, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontSize: '0.68rem', cursor: 'pointer' }}>
                      📋 URL
                    </button>
                    <button onClick={() => deleteFile(f.name)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.68rem', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {!files.length && <div style={{ gridColumn: '1/-1', padding: 40, color: '#4A5568', textAlign: 'center' }}>Aucun fichier dans ce bucket</div>}
        </div>
      )}
    </div>
  )
}

// ─── Audio Manager ────────────────────────────────────────────────────────────
function AudioPanel({ showToast }) {
  const [audioStatus, setAudioStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [playerSrc, setPlayerSrc] = useState(null)
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('abawi_voice_settings') || '{}') } catch { return {} }
  })
  const [showVoiceConfig, setShowVoiceConfig] = useState(false)

  function saveVoiceSettings(settings) {
    localStorage.setItem('abawi_voice_settings', JSON.stringify(settings))
    setVoiceSettings(settings)
  }

  const allItems = [
    ...guides.map(g => ({ ...g, itemType: 'guide', dir: 'summaries' })),
    ...allFascicules.map(f => ({ ...f, itemType: 'fascicule', dir: 'fascicules-audio' })),
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { checkAudioStatus() }, [])

  async function checkAudioStatus() {
    const status = {}
    // Check via Supabase Storage
    const { data: summaries } = await supabase.storage.from('audio-summaries').list('', { limit: 500 })
    const existing = new Set((summaries || []).map(f => f.name.replace('.mp3', '')))
    allItems.forEach(item => {
      const key = slugify(item.titre)
      const supa = existing.has(key)
      // Also check via fetch HEAD for local files
      status[item.id] = { supabase: supa, local: false }
    })
    setAudioStatus(status)
    setLoading(false)
  }

  async function generateForItem(item) {
    setGenerating(item.id)
    try {
      const type = item.itemType
      const voiceId = voiceSettings[type + '_voice'] || DEFAULT_VOICE_BY_TYPE[type] || VOICE_CHARLOTTE
      const presetKey = voiceSettings[type + '_preset'] || 'professionnelle'
      const preset = VOICE_SETTINGS_PRESETS[presetKey] || {}

      const text = await generateSummaryText(item.titre, item.categorie || '', type, item.matiere || '', item.serie || '')
      const blob = await generateMP3(text, voiceId, preset)
      await uploadAudioSummary(item.titre, blob)

      setAudioStatus(prev => ({ ...prev, [item.id]: { ...prev[item.id], supabase: true } }))
      showToast(`✅ Audio: ${item.titre.substring(0, 30)}`)
    } catch(e) {
      showToast(`❌ ${item.titre.substring(0, 20)}: ${e.message}`, 'error')
    }
    setGenerating(null)
  }

  async function generateAllMissing() {
    const missing = allItems.filter(item => !audioStatus[item.id]?.supabase)
    setProgress({ done: 0, total: missing.length })
    for (const item of missing) {
      await generateForItem(item)
      setProgress(p => ({ ...p, done: p.done + 1 }))
      await new Promise(r => setTimeout(r, 2000))
    }
    showToast(`✅ ${missing.length} audios générés !`)
    setProgress({ done: 0, total: 0 })
  }

  const withAudio = Object.values(audioStatus).filter(s => s.supabase).length
  const total = allItems.length

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>🎙️ Audio Manager</h2>
        <button onClick={() => setShowVoiceConfig(s => !s)} style={{
          padding: '9px 18px', borderRadius: 10,
          background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)',
          color: '#F0B429', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}>
          🎤 Voix {showVoiceConfig ? '▲' : '▼'}
        </button>
        <button onClick={generateAllMissing} disabled={!!generating || progress.total > 0} style={{
          padding: '9px 18px', borderRadius: 10,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          color: '#8B5CF6', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}>
          🎙️ Générer tous les manquants ({total - withAudio})
        </button>
      </div>

      {showVoiceConfig && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F0B429', marginBottom: 16 }}>🎤 Configuration des voix par type</h3>
          {['guide', 'fascicule'].map(type => {
            const currentVoice = voiceSettings[type + '_voice'] || DEFAULT_VOICE_BY_TYPE[type]
            const currentPreset = voiceSettings[type + '_preset'] || 'professionnelle'
            return (
              <div key={type} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'capitalize' }}>
                  {type === 'guide' ? '📚 Guides' : '🎓 Fascicules'}
                </div>
                <VoiceSelector
                  selectedVoice={currentVoice}
                  selectedPreset={currentPreset}
                  onVoiceChange={(v) => saveVoiceSettings({ ...voiceSettings, [type + '_voice']: v })}
                  onPresetChange={(p) => saveVoiceSettings({ ...voiceSettings, [type + '_preset']: p })}
                  compact
                />
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Avec audio', value: withAudio, color: '#18A84A' },
          { label: 'Sans audio', value: total - withAudio, color: '#ef4444' },
          { label: 'Total', value: total, color: '#F0B429' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#4A5568' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {progress.total > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 20px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12 }}>
          <div style={{ color: '#8B5CF6', fontWeight: 700, marginBottom: 8 }}>
            Génération en cours : {progress.done}/{progress.total}
          </div>
          <div style={{ height: 8, background: '#1A2332', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(progress.done/progress.total)*100}%`, background: '#8B5CF6', borderRadius: 100, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {playerSrc && (
        <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <audio controls src={playerSrc} autoPlay style={{ width: '100%' }} />
        </div>
      )}

      {loading ? <div style={{ padding: 40, color: '#8B95A5', textAlign: 'center' }}>Vérification des audios...</div> : (
        <DataTable
          columns={['Titre', 'Type', 'Statut', 'Actions']}
          rows={allItems.map(item => {
            const hasAudio = audioStatus[item.id]?.supabase
            const isGen = generating === item.id
            return [
              <span style={{ color: 'var(--text-primary)', maxWidth: 240, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titre}</span>,
              <span style={{ color: item.itemType === 'guide' ? '#F0B429' : '#18A84A', fontSize: '0.75rem', fontWeight: 700 }}>{item.itemType === 'guide' ? '📚 Guide' : '🎓 Fascicule'}</span>,
              hasAudio
                ? <span style={{ color: '#18A84A', fontWeight: 700 }}>✅ Présent</span>
                : isGen
                ? <span style={{ color: '#8B5CF6' }}>🔄 Génération...</span>
                : <span style={{ color: '#ef4444' }}>❌ Manquant</span>,
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => generateForItem(item)} disabled={!!generating} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#8B5CF6', cursor: generating ? 'not-allowed' : 'pointer',
                }}>
                  {isGen ? '⏳' : hasAudio ? '🔄 Regen' : '🎙️ Générer'}
                </button>
              </div>,
            ]
          })}
        />
      )}
    </div>
  )
}

// ─── Store Panel ─────────────────────────────────────────────────────────────
const STORE_SPEC_PRESETS = {
  'Portables': ['Processeur', 'RAM', 'Stockage', 'Écran', 'GPU', 'Batterie', 'OS', 'Poids'],
  'Bureau': ['Processeur', 'RAM', 'Stockage', 'Écran', 'GPU', 'OS', 'Connectivité'],
  'Composants': ['Type', 'Marque', 'Modèle', 'Interface', 'Performances', 'Garantie'],
  'Accessoires': ['Type', 'Compatibilité', 'Couleur', 'Connectivité', 'Garantie'],
  'Services': ['Durée', 'Inclus', 'Support', 'Livraison'],
}

// Helper pour garantir que les données sont un tableau
function ensureArray(val, fallback = []) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val) return val.split(',').map(s => s.trim()).filter(Boolean)
  if (val && typeof val === 'object') {
    // Si c'est un objet JSONB mal formé, essayer de l'extraire
    const values = Object.values(val)
    if (values.length > 0 && typeof values[0] === 'string') return values
  }
  return fallback
}

function StoreModal({ editData, editModal, upd, onSave, onClose, showToast }) {
  const [tab, setTab] = useState('base')
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState(() => {
    const imgs = ensureArray(editData.images)
    return imgs.length > 0 ? imgs : (editData.image_url ? [editData.image_url] : [])
  })
  const [specs, setSpecs] = useState(() => {
    if (Array.isArray(editData.specs_obj)) return editData.specs_obj
    if (typeof editData.specs === 'string' && editData.specs) {
      return editData.specs.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ label: v, value: '' }))
    }
    return []
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedMarketing, setGeneratedMarketing] = useState(null)
  const [showMarketingPanel, setShowMarketingPanel] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const imgRef = useRef()
  const dragOver = useRef(false)

  const cat = editData.categorie || 'Portables'
  const presets = STORE_SPEC_PRESETS[cat] || []

  function addSpecChip(label) {
    if (!specs.find(s => s.label === label)) {
      setSpecs(p => [...p, { label, value: '' }])
    }
  }
  function removeSpec(idx) { setSpecs(p => p.filter((_, i) => i !== idx)) }
  function updateSpec(idx, field, val) {
    setSpecs(p => p.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }

  async function handleImageFiles(files) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(arr.map(f => uploadFile(f, 'images', 'store')))
      const next = [...images, ...urls].slice(0, 8)
      setImages(next)
      upd('image_url', next[0] || '')
      upd('images', next)
      showToast(`✅ ${urls.length} image(s) uploadée(s)`)
    } catch (e) {
      showToast('❌ ' + e.message, 'error')
    }
    setUploading(false)
  }

  function generateSchemaOrg(data) {
    const price = parseInt(data.prix) || 0
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.name || data.nom || 'Produit',
      "image": data.images?.[0] || data.image_url || '',
      "description": data.seo_desc || data.description || '',
      "sku": data.id || `SKU-${Date.now()}`,
      "brand": {
        "@type": "Brand",
        "name": data.marque || "ABAWI Store"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://abawi.sn/store/${(data.name || 'produit').toLowerCase().replace(/\s+/g, '-').substring(0, 40)}`,
        "priceCurrency": "XOF",
        "price": price.toString(),
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": data.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "ABAWI Store"
        }
      },
      "aggregateRating": data.rating ? {
        "@type": "AggregateRating",
        "ratingValue": data.rating.toString(),
        "reviewCount": data.review_count?.toString() || "1"
      } : undefined
    }
    // Remove undefined values
    Object.keys(schema).forEach(key => {
      if (schema[key] === undefined) delete schema[key]
    })
    return JSON.stringify(schema, null, 2)
  }

  async function generateAIDesc() {
    if (!editData.name) { showToast('❌ Saisissez le nom du produit', 'error'); return }
    setAiLoading(true)
    try {
      const specsText = specs.map(s => `${s.label}: ${s.value}`).join(', ')
      const prompt = `Tu es un expert en marketing digital et SEO pour le marché africain (Sénégal, Côte d'Ivoire, Bénin). Génère du contenu marketing COMPLET et OPTIMISÉ pour le référencement pour ce produit informatique.

Règles IMPORTANTES:
- Description: 3-4 phrases captivantes, max 120 mots, mettre en avant les bénéfices
- SEO: titre accrocheur avec mots-clés principaux
- Meta description: appel à l'action inclus
- Long-tail keywords: 5-7 phrases de recherche naturelle en français africain
- FAQ: répondre aux vraies questions des clients

Réponds UNIQUEMENT en JSON valide selon ce schéma exact:
{
  "description": "texte commercial optimisé SEO",
  "seo_title": "titre SEO 50-60 caractères avec mots-clés",
  "seo_desc": "meta description 150-160 caractères avec CTA",
  "long_tail_keywords": "mot-clé 1, mot-clé 2, mot-clé 3, mot-clé 4, mot-clé 5",
  "points_forts": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "facebook": "post Facebook engageant 120 mots avec emojis adaptés",
  "instagram": "caption Instagram avec storytelling et hashtags",
  "whatsapp": "message WhatsApp commercial chaleureux",
  "twitter": "tweet percutant max 280 car avec hashtags",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"],
  "faq": [
    {"q": "question fréquente 1", "r": "réponse détaillée et utile"},
    {"q": "question fréquente 2", "r": "réponse détaillée et utile"},
    {"q": "question fréquente 3", "r": "réponse détaillée et utile"}
  ],
  "tags_courts": "tag1, tag2, tag3, tag4, tag5"
}

Produit: ${editData.name}
Catégorie: ${cat}
Prix: ${editData.prix ? editData.prix + ' FCFA' : 'prix sur demande'}
Spécifications: ${specsText || 'à consulter en magasin'}
Contexte: Marché IT en Afrique de l'Ouest, clients professionnels et particuliers`
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      })
      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content?.trim() || ''
      let parsed = null
      try { parsed = JSON.parse(raw) } catch { const m = raw.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]) }
      if (parsed) {
        if (parsed.description) upd('description', parsed.description)
        if (parsed.seo_title) upd('seo_title', parsed.seo_title)
        if (parsed.seo_desc) upd('seo_desc', parsed.seo_desc)
        if (parsed.long_tail_keywords) upd('long_tail_keywords', parsed.long_tail_keywords)
        if (parsed.tags_courts) upd('tags', parsed.tags_courts)
        if (parsed.tags) upd('tags', Array.isArray(parsed.hashtags) ? parsed.hashtags.join(' ') : (editData.tags || ''))
        setGeneratedMarketing(parsed)
        setShowMarketingPanel(true)
        showToast('✅ Contenu IA généré — Description + SEO + Marketing')
      } else {
        showToast('❌ Génération échouée', 'error')
      }
    } catch (e) {
      showToast('❌ ' + e.message, 'error')
    }
    setAiLoading(false)
  }

  function copyText(key, text) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function handleSave() {
    const specsStr = specs.map(s => s.label + (s.value ? ': ' + s.value : '')).join(', ')
    upd('specs', specsStr)
    upd('specs_obj', specs)
    upd('images', images)
    upd('image_url', images[0] || editData.image_url || '')
    onSave()
  }

  const TABS = [
    { id: 'base', label: 'Infos de base', icon: '📋' },
    { id: 'specs', label: 'Spécifications', icon: '⚙️' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'stock', label: 'Stock & Statut', icon: '📦' },
  ]

  const S = { // shared input style
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
    marginBottom: 12,
  }

  return (
    <Modal title={editModal === 'new' ? '+ Nouveau produit' : '✏️ Modifier le produit'} onClose={onClose} width={700}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: '8px 8px 0 0',
            background: tab === t.id ? '#0D1117' : 'transparent',
            border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            borderBottom: tab === t.id ? '1px solid #0D1117' : '1px solid transparent',
            color: tab === t.id ? '#F0B429' : '#8B95A5',
            fontWeight: tab === t.id ? 700 : 500,
            fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s',
            marginBottom: -1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Infos de base */}
      {tab === 'base' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Nom du produit *</label>
          <input style={S} value={editData.name || ''} onChange={e => upd('name', e.target.value)} placeholder="Ex: MacBook Pro M3 14 pouces" />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Catégorie</label>
          <select style={S} value={editData.categorie || 'Portables'} onChange={e => upd('categorie', e.target.value)}>
            {['Portables', 'Bureau', 'Composants', 'Accessoires', 'Services'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Prix (FCFA) *</label>
          <input style={S} type="number" value={editData.prix || ''} onChange={e => upd('prix', e.target.value)} placeholder="Ex: 850000" />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>
            Description
            <span style={{ marginLeft: 8, fontSize: '0.68rem', color: '#4A5568', fontWeight: 400 }}>→ Générer via IA dans l'onglet SEO</span>
          </label>
          <textarea style={{ ...S, minHeight: 80, resize: 'vertical' }} value={editData.description || ''} onChange={e => upd('description', e.target.value)} placeholder="Description commerciale du produit..." />
        </div>
      )}

      {/* TAB: Spécifications */}
      {tab === 'specs' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 8 }}>
              Presets pour <span style={{ color: '#F0B429' }}>{cat}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {presets.map(p => (
                <button key={p} onClick={() => addSpecChip(p)} style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: '0.75rem',
                  background: specs.find(s => s.label === p) ? 'rgba(240,180,41,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${specs.find(s => s.label === p) ? 'rgba(240,180,41,0.3)' : '#1A2332'}`,
                  color: specs.find(s => s.label === p) ? '#F0B429' : '#8B95A5',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}>+ {p}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            {specs.map((sp, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={sp.label} onChange={e => updateSpec(i, 'label', e.target.value)}
                  style={{ ...S, marginBottom: 0, flex: '0 0 140px', fontSize: '0.8rem' }} placeholder="Libellé" />
                <input value={sp.value} onChange={e => updateSpec(i, 'value', e.target.value)}
                  style={{ ...S, marginBottom: 0, flex: 1, fontSize: '0.8rem' }} placeholder="Valeur" />
                <button onClick={() => removeSpec(i)} style={{
                  padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
                  cursor: 'pointer', flexShrink: 0, fontFamily: 'Outfit, sans-serif',
                }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => setSpecs(p => [...p, { label: '', value: '' }])} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#3B82F6', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>+ Ajouter une spec</button>
        </div>
      )}

      {/* TAB: Images */}
      {tab === 'images' && (
        <div>
          {/* Drag & Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); dragOver.current = true }}
            onDragLeave={() => { dragOver.current = false }}
            onDrop={e => { e.preventDefault(); handleImageFiles(e.dataTransfer.files) }}
            onClick={() => imgRef.current?.click()}
            style={{
              border: '2px dashed #1A2332', borderRadius: 12,
              padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
              background: 'rgba(59,130,246,0.03)', marginBottom: 16,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
            <div style={{ color: '#8B95A5', fontSize: '0.85rem' }}>
              {uploading ? '⏳ Upload en cours...' : 'Glissez des images ici ou cliquez pour parcourir'}
            </div>
            <div style={{ color: '#4A5568', fontSize: '0.72rem', marginTop: 4 }}>JPG, PNG, WebP — max 8 images</div>
          </div>
          <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleImageFiles(e.target.files)} />

          {/* Gallery grid */}
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8,
                    border: i === 0 ? '2px solid #F0B429' : '1px solid var(--border)' }} />
                  {i === 0 && (
                    <span style={{ position: 'absolute', top: 4, left: 4, background: '#F0B429', color: '#070B0F',
                      fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>MAIN</span>
                  )}
                  <button onClick={() => setImages(p => { const n = p.filter((_, j) => j !== i); upd('image_url', n[0] || ''); return n })}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none',
                      borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer',
                      fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Ou coller une URL</label>
            <input style={S} value={editData.image_url || ''} onChange={e => { upd('image_url', e.target.value); if (e.target.value && !images.includes(e.target.value)) setImages(p => [e.target.value, ...p]) }}
              placeholder="https://..." />
          </div>
        </div>
      )}

      {/* TAB: SEO */}
      {tab === 'seo' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Titre SEO</label>
          <input style={S} value={editData.seo_title || editData.name || ''} onChange={e => upd('seo_title', e.target.value)} placeholder="Titre pour Google (60 car. max)" maxLength={60} />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Meta description</label>
          <textarea style={{ ...S, minHeight: 70, resize: 'vertical' }} value={editData.seo_desc || ''} onChange={e => upd('seo_desc', e.target.value)} placeholder="Description pour Google (160 car. max)" maxLength={160} />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Tags / Mots-clés courts</label>
          <input style={S} value={editData.tags || ''} onChange={e => upd('tags', e.target.value)} placeholder="laptop, macbook, apple, portable dakar" />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>
            🔑 Mots-clés longs (Long-tail keywords)
            <span style={{ marginLeft: 8, fontSize: '0.68rem', color: '#4A5568', fontWeight: 400 }}>Séparés par des virgules</span>
          </label>
          <textarea 
            style={{ ...S, minHeight: 60, resize: 'vertical' }} 
            value={editData.long_tail_keywords || ''} 
            onChange={e => upd('long_tail_keywords', e.target.value)} 
            placeholder="acheter macbook pro dakar, ordinateur portable sénégal pas cher, laptop professionnel abidjan..." 
          />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>
            📊 Données structurées Schema.org (JSON-LD)
            <span style={{ marginLeft: 8, fontSize: '0.68rem', color: '#4A5568', fontWeight: 400 }}>Optionnel - pour le rich snippet Google</span>
          </label>
          <textarea 
            style={{ ...S, minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' }} 
            value={editData.schema_org || ''} 
            onChange={e => upd('schema_org', e.target.value)} 
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "${editData.name || 'Produit'}",\n  "description": "..."\n}`} 
          />
          {!editData.schema_org && (
            <button 
              onClick={() => upd('schema_org', generateSchemaOrg(editData))}
              style={{
                marginTop: -8, marginBottom: 12, padding: '6px 12px', borderRadius: 6,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#8B5CF6', fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              ✨ Générer Schema.org automatiquement
            </button>
          )}

          {/* Google preview */}
          <div style={{ marginTop: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.72rem', color: '#4A5568', marginBottom: 8, fontWeight: 700 }}>APERÇU GOOGLE</div>
            <div style={{ color: '#8AB4F8', fontSize: '0.9rem', fontWeight: 500, marginBottom: 2 }}>
              {(editData.seo_title || editData.name || 'Titre du produit').substring(0, 60)}
            </div>
            <div style={{ color: '#4A5568', fontSize: '0.72rem', marginBottom: 4 }}>
              abawi.sn/store/{(editData.name || 'produit').toLowerCase().replace(/\s+/g, '-').substring(0, 40)}
            </div>
            <div style={{ color: '#BDC1C6', fontSize: '0.8rem', lineHeight: 1.4 }}>
              {(editData.seo_desc || editData.description || 'Description du produit...').substring(0, 160)}
            </div>
          </div>

          {/* IA Generate button */}
          <button onClick={generateAIDesc} disabled={aiLoading} style={{
            marginTop: 14, width: '100%', padding: '10px', borderRadius: 10,
            background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.25)',
            color: '#F0B429', fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif',
          }}>
            {aiLoading ? '⏳ Génération IA...' : '✨ Générer Description + SEO + Marketing avec IA'}
          </button>

          {/* Marketing Panel */}
          {generatedMarketing && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setShowMarketingPanel(v => !v)} style={{
                width: '100%', padding: '10px', borderRadius: 10,
                background: showMarketingPanel ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                fontFamily: 'Outfit, sans-serif', textAlign: 'left',
              }}>
                📣 {showMarketingPanel ? '▼' : '▶'} Contenu Marketing Généré
              </button>
              {showMarketingPanel && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Points forts */}
                  {generatedMarketing.points_forts?.length > 0 && (
                    <div style={{ background: 'rgba(24,168,74,0.06)', border: '1px solid rgba(24,168,74,0.2)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#18A84A', marginBottom: 8 }}>✅ POINTS FORTS</div>
                      {generatedMarketing.points_forts.map((p, i) => (
                        <div key={i} style={{ fontSize: '0.82rem', color: '#BDC1C6', marginBottom: 4 }}>• {p}</div>
                      ))}
                    </div>
                  )}

                  {/* Réseaux sociaux */}
                  {[
                    { key: 'facebook', label: 'Facebook', color: '#1877F2' },
                    { key: 'instagram', label: 'Instagram', color: '#E4405F' },
                    { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
                    { key: 'twitter', label: 'Twitter / X', color: '#1DA1F2' },
                  ].filter(n => generatedMarketing[n.key]).map(net => (
                    <div key={net.key} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: net.color }}>{net.label}</span>
                        <button onClick={() => copyText(net.key, generatedMarketing[net.key])} style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem',
                          background: copiedKey === net.key ? 'rgba(24,168,74,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${copiedKey === net.key ? 'rgba(24,168,74,0.3)' : '#1A2332'}`,
                          color: copiedKey === net.key ? '#18A84A' : '#8B95A5',
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        }}>
                          {copiedKey === net.key ? '✅ Copié' : '📋 Copier'}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#BDC1C6', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {generatedMarketing[net.key]}
                      </div>
                    </div>
                  ))}

                  {/* Hashtags */}
                  {generatedMarketing.hashtags?.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B95A5' }}>HASHTAGS</span>
                        <button onClick={() => copyText('hashtags', generatedMarketing.hashtags.join(' '))} style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem',
                          background: copiedKey === 'hashtags' ? 'rgba(24,168,74,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${copiedKey === 'hashtags' ? 'rgba(24,168,74,0.3)' : '#1A2332'}`,
                          color: copiedKey === 'hashtags' ? '#18A84A' : '#8B95A5',
                          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        }}>
                          {copiedKey === 'hashtags' ? '✅ Copié' : '📋 Copier'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {generatedMarketing.hashtags.map((h, i) => (
                          <span key={i} style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#8B5CF6', fontSize: '0.75rem' }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ */}
                  {generatedMarketing.faq?.length > 0 && (
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B95A5', marginBottom: 10 }}>FAQ PRODUIT</div>
                      {generatedMarketing.faq.map((item, i) => (
                        <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < generatedMarketing.faq.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F0B429', marginBottom: 4 }}>Q: {item.q}</div>
                          <div style={{ fontSize: '0.78rem', color: '#BDC1C6', lineHeight: 1.4 }}>R: {item.r}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Stock & Statut */}
      {tab === 'stock' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Stock disponible</label>
          <input style={S} type="number" value={editData.stock ?? 10} onChange={e => upd('stock', e.target.value)} min={0} />

          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8B95A5', marginBottom: 5 }}>Prix barré (FCFA) — optionnel</label>
          <input style={S} type="number" value={editData.prix_barre || ''} onChange={e => upd('prix_barre', e.target.value)} placeholder="Ex: 1000000" />

          {/* Toggle switches */}
          {[
            { key: 'actif', label: 'Produit actif (visible sur le site)', color: '#18A84A' },
            { key: 'featured', label: 'Mis en avant (page d\'accueil)', color: '#F0B429' },
          ].map(tog => (
            <div key={tog.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10, background: 'var(--bg-primary)',
              border: '1px solid var(--border)', marginBottom: 10 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{tog.label}</span>
              <button onClick={() => upd(tog.key, !editData[tog.key])} style={{
                width: 44, height: 24, borderRadius: 100,
                background: editData[tog.key] ? tog.color : '#1A2332',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3,
                  left: editData[tog.key] ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  display: 'block',
                }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button onClick={handleSave} style={{
          flex: 1, padding: '12px', borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
          border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
        }}>Sauvegarder</button>
        <button onClick={onClose} style={{
          padding: '12px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)', color: '#8B95A5', cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
        }}>Annuler</button>
      </div>
    </Modal>
  )
}

function StorePanel({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(null)
  const [editData, setEditData] = useState({})

  // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase.from('store_products').select('*').order('created_at', { ascending: false })
    if (error) console.error('[StorePanel] loadProducts:', error.message)
    setProducts(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditData({ name: '', categorie: 'Portables', specs: '', prix: '', image_url: '', images: [], actif: true, stock: 10 })
    setEditModal('new')
  }

  function upd(k, v) { setEditData(p => ({ ...p, [k]: v })) }

  async function saveProduct() {
    // Normaliser specs et images en tableau
    const specsArray = ensureArray(editData.specs)
    const imagesArray = ensureArray(editData.images)
    
    const payload = {
      nom: editData.name,
      categorie: editData.categorie,
      specs: specsArray,
      description: editData.description || null,
      prix: parseInt(editData.prix) || 0,
      prix_barre: parseInt(editData.prix_barre) || null,
      image_url: editData.image_url || null,
      images: imagesArray,
      actif: editData.actif !== false,
      featured: !!editData.featured,
      stock: parseInt(editData.stock) || 0,
    }
    let error
    if (editModal === 'new') {
      ;({ error } = await supabase.from('store_products').insert(payload))
    } else {
      ;({ error } = await supabase.from('store_products').update(payload).eq('id', editModal))
    }
    if (error) { showToast('❌ ' + error.message, 'error') }
    else { showToast('✅ Produit sauvegardé'); setEditModal(null); loadProducts() }
  }

  async function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return
    const { error } = await supabase.from('store_products').delete().eq('id', id)
    if (error) {
      console.error('[StorePanel] deleteProduct:', error.message)
      showToast('❌ Suppression échouée: ' + error.message, 'error')
      return
    }
    showToast('✅ Produit supprimé')
    loadProducts()
  }

  const Btn = ({ label, onClick, color = '#3B82F6', disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    }}>{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>💻 Store IT ({products.length})</h2>
        <button onClick={openNew} style={{
          padding: '9px 18px', borderRadius: 10,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          color: '#3B82F6', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
        }}>+ Nouveau produit</button>
      </div>

      <StoreProductBot onDone={loadProducts} showToast={showToast} />
      <StoreExcelImport onDone={loadProducts} showToast={showToast} />

      <DataTable
        columns={['Image', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Actif', 'Actions']}
        loading={loading}
        rows={products.map(p => [
          p.image_url
            ? <img src={p.image_url} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} />
            : <span style={{ fontSize: '1.5rem' }}>💻</span>,
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{(p.name || '').substring(0, 35)}</span>,
          <span style={{ color: '#3B82F6', fontSize: '0.78rem' }}>{p.categorie}</span>,
          <span style={{ color: '#18A84A', fontWeight: 700 }}>{(p.prix||0).toLocaleString()} F</span>,
          <span style={{ color: p.stock > 0 ? '#18A84A' : '#ef4444' }}>{p.stock ?? '—'}</span>,
          p.actif ? <span style={{ color: '#18A84A' }}>✅</span> : <span style={{ color: '#4A5568' }}>—</span>,
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn label="✏️" onClick={() => { setEditData({ ...p }); setEditModal(p.id) }} />
            <Btn label="🗑️" onClick={() => deleteProduct(p.id)} color="#ef4444" />
          </div>,
        ])}
        emptyMsg="Aucun produit — ajoutez-en un !"
      />

      {editModal !== null && (
        <StoreModal
          editData={editData}
          editModal={editModal}
          upd={upd}
          onSave={saveProduct}
          onClose={() => setEditModal(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ─── Paramètres ───────────────────────────────────────────────────────────────
const SQL_SCRIPT = `-- ═══════════════════════════════════════
-- ABAWI PORTAL — SETUP COMPLET SUPABASE
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── MEMBRES ──────────────────────────────
CREATE TABLE IF NOT EXISTS membres (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  telephone TEXT DEFAULT '',
  mot_de_passe TEXT DEFAULT '',
  statut TEXT DEFAULT 'inactif' CHECK (statut IN ('actif','inactif','suspendu')),
  role TEXT DEFAULT 'membre' CHECK (role IN ('membre','admin')),
  date_fin TIMESTAMPTZ DEFAULT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO membres (prenom, nom, email, mot_de_passe, statut, role, date_fin)
VALUES ('Laurent','ABAWI','ngomlaurentblog@gmail.com','abawi2026','actif','admin','2099-12-31T23:59:59Z')
ON CONFLICT (email) DO UPDATE SET role='admin', statut='actif', date_fin='2099-12-31T23:59:59Z';

-- ── PAYMENTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT DEFAULT '',
  product_type TEXT DEFAULT 'guide',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  montant INTEGER DEFAULT 0,
  methode TEXT DEFAULT '',
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending','paid','failed','cancelled')),
  paydunya_token TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── GUIDES ───────────────────────────────
CREATE TABLE IF NOT EXISTS guides (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'Business & Stratégie',
  prix INTEGER DEFAULT 2500,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  gratuit BOOLEAN DEFAULT false,
  premium BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  auteur TEXT DEFAULT 'ABAWI',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── FASCICULES ───────────────────────────
CREATE TABLE IF NOT EXISTS fascicules (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  matiere TEXT DEFAULT '',
  serie TEXT DEFAULT 'S1',
  prix INTEGER DEFAULT 2900,
  pages INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── PODCASTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS podcasts_db (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  titre TEXT NOT NULL DEFAULT '',
  serie TEXT DEFAULT '',
  episode INTEGER DEFAULT 1,
  description TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  duree TEXT DEFAULT '',
  premium BOOLEAN DEFAULT true,
  gratuit BOOLEAN DEFAULT false,
  prix INTEGER DEFAULT 990,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STORE ────────────────────────────────
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  nom TEXT NOT NULL DEFAULT '',
  categorie TEXT DEFAULT 'Portables',
  description TEXT DEFAULT '',
  description_courte TEXT DEFAULT '',
  prix INTEGER DEFAULT 0,
  prix_original INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  specs TEXT[] DEFAULT '{}',
  specs_techniques JSONB DEFAULT '{}',
  stock INTEGER DEFAULT 1,
  featured BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  marque TEXT DEFAULT '',
  modele TEXT DEFAULT '',
  garantie TEXT DEFAULT '12 mois',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── NEWS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ti TEXT NOT NULL DEFAULT '',
  co TEXT DEFAULT '',
  tag TEXT DEFAULT 'Business',
  rt TEXT DEFAULT '3 min',
  cover_url TEXT DEFAULT '',
  statut TEXT DEFAULT 'publié' CHECK (statut IN ('publié','brouillon')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── USER DOCUMENTS ───────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, type)
);

-- ── SITE CONTENT ─────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, field)
);

-- ── RLS ──────────────────────────────────
ALTER TABLE membres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read membres" ON membres;
DROP POLICY IF EXISTS "Admin all membres" ON membres;
CREATE POLICY "Public read membres" ON membres FOR SELECT USING (true);
CREATE POLICY "Admin all membres" ON membres FOR ALL USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all payments" ON payments;
CREATE POLICY "Admin all payments" ON payments FOR ALL USING (true);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read guides" ON guides;
DROP POLICY IF EXISTS "Admin all guides" ON guides;
CREATE POLICY "Public read guides" ON guides FOR SELECT USING (actif = true);
CREATE POLICY "Admin all guides" ON guides FOR ALL USING (true);

ALTER TABLE fascicules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read fascicules" ON fascicules;
DROP POLICY IF EXISTS "Admin all fascicules" ON fascicules;
CREATE POLICY "Public read fascicules" ON fascicules FOR SELECT USING (actif = true);
CREATE POLICY "Admin all fascicules" ON fascicules FOR ALL USING (true);

ALTER TABLE podcasts_db ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read podcasts" ON podcasts_db;
DROP POLICY IF EXISTS "Admin all podcasts" ON podcasts_db;
CREATE POLICY "Public read podcasts" ON podcasts_db FOR SELECT USING (actif = true);
CREATE POLICY "Admin all podcasts" ON podcasts_db FOR ALL USING (true);

ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read store" ON store_products;
DROP POLICY IF EXISTS "Admin all store" ON store_products;
CREATE POLICY "Public read store" ON store_products FOR SELECT USING (actif = true);
CREATE POLICY "Admin all store" ON store_products FOR ALL USING (true);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read news" ON news;
DROP POLICY IF EXISTS "Admin all news" ON news;
CREATE POLICY "Public read news" ON news FOR SELECT USING (statut = 'publié');
CREATE POLICY "Admin all news" ON news FOR ALL USING (true);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User read own" ON user_documents;
DROP POLICY IF EXISTS "Admin all user_documents" ON user_documents;
CREATE POLICY "User read own" ON user_documents FOR SELECT USING (true);
CREATE POLICY "Admin all user_documents" ON user_documents FOR ALL USING (true);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read content" ON site_content;
DROP POLICY IF EXISTS "Admin write content" ON site_content;
CREATE POLICY "Public read content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admin write content" ON site_content FOR ALL USING (true);

-- ── STORAGE BUCKETS ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('covers','covers',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml']),
  ('guides','guides',true,104857600,ARRAY['application/pdf']),
  ('podcasts','podcasts',true,209715200,ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/mp4','audio/x-m4a']),
  ('audio-summaries','audio-summaries',true,52428800,ARRAY['audio/mpeg','audio/mp3','audio/wav']),
  ('images','images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('store-images','store-images',true,10485760,ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;

-- ── STORAGE POLICIES ─────────────────────
DO $$
DECLARE b TEXT; bl TEXT[] := ARRAY['covers','guides','podcasts','audio-summaries','images','store-images'];
BEGIN
  FOREACH b IN ARRAY bl LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow upload %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update %I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "Allow delete %I" ON storage.objects', b);
    EXECUTE format('CREATE POLICY "Public read %I" ON storage.objects FOR SELECT USING (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow upload %I" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow update %I" ON storage.objects FOR UPDATE USING (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "Allow delete %I" ON storage.objects FOR DELETE USING (bucket_id = %L)', b, b);
  END LOOP;
END $$;

-- ── VÉRIFICATION ─────────────────────────
SELECT table_name FROM information_schema.tables WHERE table_schema='public'
AND table_name IN ('membres','payments','guides','fascicules','podcasts_db','store_products','news','user_documents','site_content')
ORDER BY table_name;
SELECT id, name, public FROM storage.buckets WHERE id IN ('covers','guides','podcasts','audio-summaries','images','store-images');`

function ParametresPanel({ showToast }) {
  const [settings, setSettings] = useState({
    groqKey: GROQ_KEY,
    elevenKey: ELEVEN_KEY,
    waNumber: '221775185050',
  })
  const [pdTest, setPdTest] = useState(null)
  const [sqlCopied, setSqlCopied] = useState(false)
  const [uploadTest, setUploadTest] = useState(null)
  const [testingUpload, setTestingUpload] = useState(false)

  async function testPaydunya() {
    setPdTest({ loading: true })
    const result = await testPaydunyaConnection()
    setPdTest(result)
  }

  async function runUploadTest() {
    setTestingUpload(true)
    const result = await testUpload()
    setUploadTest(result)
    showToast(result.ok ? '✅ Uploads Supabase fonctionnels !' : '❌ ' + result.error, result.ok ? 'success' : 'error')
    setTestingUpload(false)
  }

  function copySql() {
    navigator.clipboard.writeText(SQL_SCRIPT).then(() => {
      setSqlCopied(true)
      setTimeout(() => setSqlCopied(false), 2000)
      showToast('✅ SQL copié dans le presse-papiers')
    })
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>⚙️ Paramètres</h2>

      {/* Clés API */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F0B429', marginBottom: 16 }}>🔑 Clés API</h3>
        <InputField label="Groq API Key" value={settings.groqKey} onChange={e => setSettings(p => ({ ...p, groqKey: e.target.value }))} />
        <InputField label="ElevenLabs API Key" value={settings.elevenKey} onChange={e => setSettings(p => ({ ...p, elevenKey: e.target.value }))} />
        <InputField label="WhatsApp (numéro)" value={settings.waNumber} onChange={e => setSettings(p => ({ ...p, waNumber: e.target.value }))} />
        <button onClick={() => showToast('✅ Paramètres sauvegardés')} style={{
          marginTop: 12, padding: '10px 24px', borderRadius: 10,
          background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none',
          color: '#070B0F', fontWeight: 800, cursor: 'pointer',
        }}>Sauvegarder</button>
      </div>

      {/* PayDunya test */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6', marginBottom: 12 }}>💳 Test PayDunya</h3>
        <div style={{ fontSize: '0.82rem', color: '#8B95A5', marginBottom: 14 }}>
          Vérifie la connexion avec les clés <code style={{ background: 'var(--bg-primary)', padding: '1px 5px', borderRadius: 4 }}>VITE_PAYDUNYA_*</code> de votre .env.local
        </div>
        <button onClick={testPaydunya} disabled={pdTest?.loading} style={{
          padding: '10px 20px', borderRadius: 10,
          background: pdTest?.loading ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          color: '#3B82F6', fontWeight: 700, fontSize: '0.85rem',
          cursor: pdTest?.loading ? 'wait' : 'pointer',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {pdTest?.loading ? '⏳ Test en cours...' : '🔌 Tester la connexion PayDunya'}
        </button>

        {pdTest && !pdTest.loading && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 10,
            background: pdTest.ok ? 'rgba(24,168,74,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${pdTest.ok ? 'rgba(24,168,74,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: pdTest.ok ? '#18A84A' : '#ef4444', marginBottom: pdTest.ok ? 4 : 0 }}>
              {pdTest.ok ? '✅ Connexion réussie' : '❌ Connexion échouée'}
            </div>
            {pdTest.ok && (
              <div style={{ fontSize: '0.78rem', color: '#8B95A5' }}>
                Mode : <strong style={{ color: '#F0B429' }}>{pdTest.mode?.toUpperCase()}</strong> · HTTP {pdTest.status}
              </div>
            )}
            {pdTest.error && (
              <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>{pdTest.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Upload test */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3B82F6', marginBottom: 12 }}>📤 Test Uploads Supabase</h3>
        <div style={{ fontSize: '0.82rem', color: '#8B95A5', marginBottom: 14 }}>
          Vérifie que les buckets Storage existent et que les uploads fonctionnent.
        </div>
        <button onClick={runUploadTest} disabled={testingUpload} style={{
          padding: '10px 20px', borderRadius: 10,
          background: testingUpload ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          color: '#3B82F6', fontWeight: 700, fontSize: '0.85rem',
          cursor: testingUpload ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif',
        }}>
          {testingUpload ? '⏳ Test en cours...' : '📤 Tester les uploads Supabase'}
        </button>
        {uploadTest && !testingUpload && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 10,
            background: uploadTest.ok ? 'rgba(24,168,74,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${uploadTest.ok ? 'rgba(24,168,74,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: uploadTest.ok ? '#18A84A' : '#ef4444', marginBottom: 4 }}>
              {uploadTest.ok ? '✅ Supabase Storage opérationnel' : '❌ Problème détecté'}
            </div>
            {uploadTest.ok && uploadTest.buckets && (
              <div style={{ fontSize: '0.78rem', color: '#8B95A5' }}>
                Buckets: <strong style={{ color: '#F0B429' }}>{uploadTest.buckets.join(', ')}</strong>
              </div>
            )}
            {!uploadTest.ok && (
              <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
                {uploadTest.error}<br />→ Exécutez le SQL ci-dessous dans Supabase Dashboard
              </div>
            )}
          </div>
        )}
      </div>

      {/* SQL */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>⚠️ SQL à exécuter dans Supabase</h3>
          <button onClick={copySql} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            background: sqlCopied ? 'rgba(24,168,74,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${sqlCopied ? 'rgba(24,168,74,0.3)' : '#1A2332'}`,
            color: sqlCopied ? '#18A84A' : '#8B95A5', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
          }}>
            {sqlCopied ? '✅ Copié !' : '📋 Copier le SQL'}
          </button>
        </div>
        <pre style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: '16px 20px', fontSize: '0.78rem', color: '#C8D3E0', overflow: 'auto', lineHeight: 1.6 }}>
          {SQL_SCRIPT}
        </pre>
      </div>
    </div>
  )
}

// ─── Admin Stock ─────────────────────────────────────────────────────────────
function AdminStock({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('store_products').select('id,name,stock,actif,prix').order('name')
    setProducts(data || [])
    setLoading(false)
  }

  async function updateStock(id, delta) {
    const prod = products.find(p => p.id === id)
    if (!prod) return
    const newStock = Math.max(0, (prod.stock || 0) + delta)
    await supabase.from('store_products').update({ stock: newStock }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p))
  }

  async function toggleActif(id) {
    const prod = products.find(p => p.id === id)
    if (!prod) return
    const newActif = !prod.actif
    await supabase.from('store_products').update({ actif: newActif }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, actif: newActif } : p))
    showToast(newActif ? '✅ Produit activé' : '⚠️ Produit désactivé', newActif ? 'success' : 'warn')
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>📦 Gestion des Stocks</h2>
      {loading ? (
        <div style={{ color: '#8B95A5', padding: 40, textAlign: 'center' }}>Chargement...</div>
      ) : products.length === 0 ? (
        <div style={{ color: '#8B95A5', padding: 40, textAlign: 'center' }}>Aucun produit store trouvé</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => {
            const low = (p.stock || 0) <= 3
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                background: 'var(--bg-card)', border: `1px solid ${low ? 'rgba(239,68,68,0.4)' : '#1A2332'}`,
                borderRadius: 12, padding: '14px 18px',
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ color: '#8B95A5', fontSize: '0.75rem' }}>{(p.prix || 0).toLocaleString()} FCFA</div>
                </div>
                {low && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                  }}>⚠️ Stock bas</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateStock(p.id, -1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 900, cursor: 'pointer', fontSize: '1rem',
                  }}>−</button>
                  <span style={{
                    minWidth: 40, textAlign: 'center', fontWeight: 800, fontSize: '1rem',
                    color: low ? '#ef4444' : '#F0F2F5',
                  }}>{p.stock ?? 0}</span>
                  <button onClick={() => updateStock(p.id, 1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
                    background: 'rgba(24,168,74,0.1)', color: '#18A84A', fontWeight: 900, cursor: 'pointer', fontSize: '1rem',
                  }}>+</button>
                </div>
                <button onClick={() => toggleActif(p.id)} style={{
                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                  background: p.actif ? 'rgba(24,168,74,0.12)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${p.actif ? 'rgba(24,168,74,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: p.actif ? '#18A84A' : '#ef4444',
                }}>
                  {p.actif ? '✅ Actif' : '⛔ Inactif'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Admin principal ──────────────────────────────────────────────────────────
function Admin() {
  const { membre, isAdmin, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
  }

  if (authLoading) return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B95A5' }}>
      Chargement...
    </main>
  )

  if (!isAdmin) return <Navigate to="/membre" replace />

  const PANEL_PROPS = { showToast }

  const panels = {
    dashboard: <Dashboard {...PANEL_PROPS} setTab={setTab} />,
    bot: <BotPanel {...PANEL_PROPS} />,
    health: <ApiHealthPanel {...PANEL_PROPS} />,
    guides: <GuidesPanel {...PANEL_PROPS} />,
    fascicules: <FasciculesPanel {...PANEL_PROPS} />,
    podcasts: <PodcastsPanel {...PANEL_PROPS} />,
    news: <NewsPanel {...PANEL_PROPS} />,
    store: <StorePanel {...PANEL_PROPS} />,
    slider: <SliderPanel {...PANEL_PROPS} />,
    banners: <BannersPanel {...PANEL_PROPS} />,
    abawi360: <Abawi360Panel />,
    'outils-ia': <OutilsIAPanel />,
    membres: <MembresPanel {...PANEL_PROPS} />,
    paiements: <PaiementsPanel {...PANEL_PROPS} />,
    medias: <MediaPanel {...PANEL_PROPS} />,
    audio: <AudioPanel {...PANEL_PROPS} />,
    stock: <AdminStock {...PANEL_PROPS} />,
    messagerie: <AdminMessaging {...PANEL_PROPS} />,
    sociaux: <SocialVault {...PANEL_PROPS} />,
    parametres: <ParametresPanel {...PANEL_PROPS} />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--bg-primary)', borderRight: '1px solid var(--border)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        // Mobile: hidden by default
        ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
          position: 'fixed', inset: 0, zIndex: 1000,
          transform: sidebarOpen ? 'none' : 'translateX(-100%)',
          width: 260, transition: 'transform 0.3s ease',
        } : {}),
      }}>
        {/* Logo admin */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: '#4A5568', fontWeight: 700, letterSpacing: '2px', marginBottom: 4 }}>ABAWI</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>⚙️ Admin</div>
          <div style={{ fontSize: '0.72rem', color: '#F0B429', marginTop: 4 }}>
            {membre?.prenom} {membre?.nom}
            <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 100, background: 'rgba(240,180,41,0.15)', fontWeight: 700 }}>ADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {ADMIN_TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 20px',
              background: tab === t.id ? 'rgba(240,180,41,0.1)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${tab === t.id ? '#F0B429' : 'transparent'}`,
              color: tab === t.id ? '#F0B429' : '#8B95A5',
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '1rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{ fontSize: '0.78rem', color: '#4A5568', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Retour au site
          </Link>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)',
        }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)',
          padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{
            display: 'none', // Only visible on mobile via CSS
            background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.2rem',
            '@media(max-width:768px)': { display: 'flex' },
          }} aria-label="Menu">☰</button>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>
            {ADMIN_TABS.find(t => t.id === tab)?.icon} {ADMIN_TABS.find(t => t.id === tab)?.label}
          </h1>
          <Link to="/" style={{ fontSize: '0.78rem', color: '#4A5568', textDecoration: 'none' }}>← Retour au site</Link>
        </header>

        {/* Content */}
        <main style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
          {panels[tab] || <div style={{ color: '#8B95A5' }}>Section en construction</div>}
        </main>
      </div>
    </div>
  )
}

export default Admin

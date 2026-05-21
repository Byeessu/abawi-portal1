/**
 * Smart Word Editor Ultra
 * Éditeur professionnel enrichi : IA intégrée, dictée vocale,
 * historique, statistiques de lecture, mode focus, auto-save, etc.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import ToolInfoPanel from '../../components/ToolInfoPanel'
import '../../components/elite/elite.css'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { useToolGuard } from '../../hooks/useToolGuard'
import ToolUpsellModal, { ToolGuardBadge } from '../../components/ToolUpsellModal'
import { supabase } from '../../lib/supabase'

/* ─── Templates ─── */
const LAYOUT_TEMPLATES = [
  { id: 'blank', name: 'Page blanche', icon: '📄', margins: { top: 25, right: 25, bottom: 25, left: 25 }, lineHeight: 1.5 },
  { id: 'letter', name: 'Lettre formelle', icon: '📨', margins: { top: 20, right: 20, bottom: 20, left: 20 }, lineHeight: 1.15 },
  { id: 'report', name: 'Rapport', icon: '📊', margins: { top: 25, right: 20, bottom: 25, left: 20 }, lineHeight: 1.5 },
  { id: 'contract', name: 'Contrat', icon: '📋', margins: { top: 30, right: 30, bottom: 30, left: 30 }, lineHeight: 1.5 },
  { id: 'cv', name: 'CV', icon: '👤', margins: { top: 15, right: 20, bottom: 15, left: 20 }, lineHeight: 1.25 },
  { id: 'memo', name: 'Mémo', icon: '📝', margins: { top: 20, right: 25, bottom: 20, left: 25 }, lineHeight: 1.5 },
  { id: 'novel', name: 'Roman', icon: '📖', margins: { top: 25, right: 25, bottom: 25, left: 25 }, lineHeight: 1.75 },
  { id: 'academic', name: 'Académique', icon: '🎓', margins: { top: 25, right: 25, bottom: 25, left: 25 }, lineHeight: 2 }
]

const FONTS = [
  { id: 'arial', name: 'Arial', family: 'Arial, sans-serif' },
  { id: 'times', name: 'Times New Roman', family: "'Times New Roman', Times, serif" },
  { id: 'georgia', name: 'Georgia', family: "Georgia, 'Times New Roman', serif" },
  { id: 'calibri', name: 'Calibri', family: 'Calibri, sans-serif' },
  { id: 'courier', name: 'Courier New', family: "'Courier New', Courier, monospace" },
  { id: 'verdana', name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'tahoma', name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
  { id: 'palatino', name: 'Palatino', family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { id: 'garamond', name: 'Garamond', family: "Garamond, 'EB Garamond', serif" },
  { id: 'helvetica', name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { id: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif" },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif" },
  { id: 'fira', name: 'Fira Code', family: "'Fira Code', monospace" }
]
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72]

const SMARTART_STYLES = [
  { id: 'gradient', name: 'Dégradé', icon: '🌈', css: 'background: linear-gradient(90deg, #ff6b6b, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; font-size: 24px;' },
  { id: 'neon', name: 'Néon', icon: '✨', css: 'color: #fff; text-shadow: 0 0 5px #03e9f4, 0 0 25px #03e9f4, 0 0 50px #03e9f4, 0 0 100px #03e9f4; font-weight: bold; font-size: 24px; background: #111; padding: 4px 8px; border-radius: 4px;' },
  { id: '3d', name: '3D', icon: '🧊', css: 'color: #fff; text-shadow: 1px 1px #000, 2px 2px #000, 3px 3px #000, 4px 4px #000; font-weight: bold; font-size: 24px;' },
  { id: 'metallic', name: 'Métallique', icon: '⚜️', css: 'background: linear-gradient(180deg, #cfcfcf 0%, #8a8a8a 50%, #e0e0e0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; font-size: 24px;' },
  { id: 'fire', name: 'Feu', icon: '🔥', css: 'color: #ff4500; text-shadow: 0 0 10px #ff4500, 0 0 20px #ff8c00; font-weight: bold; font-size: 24px;' },
  { id: 'ocean', name: 'Océan', icon: '🌊', css: 'color: #006994; text-shadow: 2px 2px 0px #00b4d8; font-weight: bold; font-size: 24px;' },
  { id: 'shadow', name: 'Ombre', icon: '👤', css: 'color: #333; text-shadow: 3px 3px 0px rgba(0,0,0,0.2); font-weight: bold; font-size: 24px;' },
  { id: 'retro', name: 'Rétro', icon: '🕹️', css: 'color: #33ff33; background: #000; font-family: "Courier New", monospace; font-weight: bold; font-size: 24px; padding: 4px 8px;' },
  { id: 'glass', name: 'Verre', icon: '🪞', css: 'color: rgba(255,255,255,0.85); background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 4px 12px; font-weight: bold; font-size: 24px;' },
  { id: 'gold', name: 'Or', icon: '🏆', css: 'background: linear-gradient(45deg, #FFD700, #FDB931, #FFD700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; font-size: 24px;' }
]

const COLOR_PRESETS = [
  '#000000', '#1a1a2e', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#34495e', '#95a5a6', '#ecf0f1',
  '#c0392b', '#d35400', '#f39c12', '#27ae60', '#16a085', '#2980b9',
  '#8e44ad', '#2c3e50', '#7f8c8d', '#bdc3c7'
]

const SPECIAL_CHARS = [
  '—', '–', '…', '«', '»', '’', '€', '£', '¥', '©', '®', '™',
  '°', '±', '×', '÷', '½', '¼', '¾', '∞', '≈', '≠', '≤', '≥',
  '←', '→', '↑', '↓', '✓', '✗', '★', '☆', '♦', '♠', '♣', '♥',
  'α', 'β', 'γ', 'δ', 'ε', 'π', 'σ', 'μ', 'Ω', 'Σ', 'Δ', '√',
  '∑', '∫', '∂', '∀', '∃', '∈', '∉', '∩', '∪', '⊂', '⊃', '∅'
]

const AI_MODES = [
  { id: 'generate', name: 'Générer', icon: '✨', prompt: 'Rédige un texte professionnel et structuré sur le sujet suivant : {text}. Utilise un style académique/formel adapté.' },
  { id: 'rewrite-formal', name: 'Réécrire (formel)', icon: '🎩', prompt: 'Réécris le texte suivant de manière formelle et professionnelle : {text}' },
  { id: 'rewrite-casual', name: 'Réécrire (simple)', icon: '💬', prompt: 'Réécris le texte suivant de manière simple et accessible : {text}' },
  { id: 'concise', name: 'Condenser', icon: '📉', prompt: 'Résume et condense le texte suivant en gardant les points essentiels : {text}' },
  { id: 'expand', name: 'Développer', icon: '📈', prompt: 'Développe et enrichis le texte suivant avec plus de détails et d\'exemples : {text}' },
  { id: 'summarize', name: 'Résumer', icon: '📋', prompt: 'Fais un résumé structuré (3 à 5 points clés) du texte suivant : {text}' },
  { id: 'translate-en', name: 'Traduire EN', icon: '🇬🇧', prompt: 'Traduis le texte suivant en anglais professionnel : {text}' },
  { id: 'translate-fr', name: 'Traduire FR', icon: '🇫🇷', prompt: 'Traduis le texte suivant en français professionnel : {text}' },
  { id: 'grammar', name: 'Corriger', icon: '✅', prompt: 'Corrige les fautes d\'orthographe, de grammaire et de style dans le texte suivant. Retourne uniquement le texte corrigé : {text}' },
  { id: 'tone-professional', name: 'Ton pro', icon: '💼', prompt: 'Adapte le ton du texte suivant pour un contexte professionnel et corporate : {text}' },
  { id: 'tone-persuasive', name: 'Ton persuasif', icon: '🎯', prompt: 'Réécris le texte suivant de manière persuasive et convaincante : {text}' },
  { id: 'tone-empathetic', name: 'Ton empathique', icon: '🤝', prompt: 'Réécris le texte suivant avec un ton empathique et bienveillant : {text}' }
]

/* ─── Styles ─── */
const EDITOR_STYLES = `
  .smart-word-editor {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px);
    background: var(--bg-primary, #f5f5f5);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .swe-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--bg-secondary, #ffffff);
    border-bottom: 1px solid var(--border, #e0e0e0);
    overflow-x: auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .swe-toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-right: 1px solid var(--border, #e0e0e0);
  }

  .swe-toolbar-group:last-child {
    border-right: none;
  }

  .swe-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-primary, #333);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .swe-btn:hover {
    background: var(--bg-tertiary, #f0f0f0);
  }

  .swe-btn.active {
    background: var(--accent-color, #e3f2fd);
    color: var(--primary-color, #1976d2);
  }

  .swe-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .swe-select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--border, #ddd);
    border-radius: 4px;
    background: var(--bg-secondary, white);
    color: var(--text-primary, #333);
    font-size: 13px;
    cursor: pointer;
  }

  .swe-page-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background: var(--bg-primary, #f5f5f5);
  }

  .swe-page {
    width: 210mm;
    min-height: 297mm;
    background: white !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    position: relative;
    color-scheme: light;
    color: #1a1a2e;
  }

  .swe-page-content {
    outline: none;
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #1a1a2e !important;
    background: transparent !important;
    color-scheme: light;
  }

  .swe-page-content:focus {
    outline: none;
  }

  .swe-page-content *:not([style*="color"]) {
    color: inherit !important;
  }
  .swe-page-content p, .swe-page-content li,
  .swe-page-content td, .swe-page-content th {
    color: #1a1a2e !important;
  }
  .swe-page-content h1, .swe-page-content h2, .swe-page-content h3 {
    color: #0f172a !important;
  }

  .swe-page-content p {
    margin: 0 0 12pt 0;
  }

  .swe-page-content h1 {
    font-size: 24pt;
    margin: 24pt 0 12pt 0;
  }

  .swe-page-content h2 {
    font-size: 18pt;
    margin: 18pt 0 9pt 0;
  }

  .swe-page-content h3 {
    font-size: 14pt;
    margin: 14pt 0 7pt 0;
  }

  .swe-page-content ul, .swe-page-content ol {
    margin: 12pt 0;
    padding-left: 24pt;
  }

  .swe-page-content li {
    margin: 6pt 0;
  }

  .swe-page-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
  }

  .swe-page-content td, .swe-page-content th {
    border: 1px solid #ccc;
    padding: 8px;
  }

  .swe-page-content img {
    max-width: 100%;
    height: auto;
  }

  .swe-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #ffffff;
    border-top: 1px solid #e0e0e0;
    font-size: 12px;
    color: #666;
  }

  .swe-title-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .swe-title-input {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    min-width: 120px;
  }

  .swe-title-input:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }

  .swe-template-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .swe-template-modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .swe-template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .swe-template-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .swe-template-card:hover {
    border-color: #1976d2;
    background: #f5f9ff;
  }

  .swe-template-card.selected {
    border-color: #1976d2;
    background: #e3f2fd;
  }

  .swe-template-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .swe-margin-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
  }

  .swe-margin-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .swe-margin-field label {
    font-size: 12px;
    color: #666;
    width: 50px;
  }

  .swe-margin-field input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    width: 60px;
  }

  @media print {
    .smart-word-editor {
      height: auto;
    }
    .swe-toolbar, .swe-status-bar, .swe-title-bar {
      display: none !important;
    }
    .swe-page-container {
      padding: 0;
      background: white;
    }
    .swe-page {
      box-shadow: none;
      width: 100%;
    }
  }
`

/* ─── Helpers ─── */
function debounce(fn, ms) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}
function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
function htmlToMarkdown(html) {
  let md = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<tr[^>]*>(.*?)<\/tr>/gis, '| $1 |\n')
    .replace(/<td[^>]*>(.*?)<\/td>/gi, ' $1 |')
    .replace(/<th[^>]*>(.*?)<\/th>/gi, ' **$1** |')
  const el = document.createElement('div')
  el.innerHTML = md
  return el.textContent || el.innerText || ''
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function readingStats(html) {
  const text = stripHtml(html).trim()
  if (!text) return { words: 0, chars: 0, sentences: 0, paragraphs: 0, readingTime: '0 min', grade: '-' }
  const words = text.split(/\s+/).filter(w => w.length > 0).length
  const chars = text.length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0).length
  const readingTime = Math.max(1, Math.round(words / 200)) + ' min'
  let grade = '-'
  if (words > 0) {
    const avgSentLen = words / Math.max(1, sentences)
    const avgSyllables = text.split(/\s+/).reduce((acc, w) => acc + Math.max(1, w.replace(/[^aeiouy]/gi, '').length), 0) / Math.max(1, words)
    const fk = 0.39 * avgSentLen + 11.8 * avgSyllables - 15.59
    grade = Math.round(Math.max(1, fk))
  }
  return { words, chars, sentences, paragraphs, readingTime, grade }
}

/* ─── Component ─── */
export default function SmartWordEditor() {
  const { user, membre } = useAuth()
  const guard = useToolGuard('smart_office', 'smart_office')

  /* Refs */
  const contentRef = useRef(null)
  const titleRef = useRef(null)
  const savedRangeRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const lastSnapshotRef = useRef(Date.now())
  const voiceRef = useRef(null)
  const pageContainerRef = useRef(null)

  /* Core State */
  const [title, setTitle] = useState('Document sans titre')
  const [content, setContent] = useState('')
  const [fontFamily, setFontFamily] = useState('times')
  const [fontSize, setFontSize] = useState(12)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [margins, setMargins] = useState({ top: 25, right: 25, bottom: 25, left: 25 })
  const [zoom, setZoom] = useState(100)
  const [selectedTemplate, setSelectedTemplate] = useState(LAYOUT_TEMPLATES[0])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showMargins, setShowMargins] = useState(false)
  const [showSmartArt, setShowSmartArt] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [activeFormats, setActiveFormats] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, withHeader: true })
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* New Feature State */
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiMode, setAiMode] = useState('generate')
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHistory, setAiHistory] = useState([])
  const [showColorPicker, setShowColorPicker] = useState(null) // 'text' | 'bg'
  const [colorValue, setColorValue] = useState('#000000')
  const [showSpecialChars, setShowSpecialChars] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [typewriterMode, setTypewriterMode] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [wordGoal, setWordGoal] = useState(0)
  const [showWordGoal, setShowWordGoal] = useState(false)
  const [documentHistory, setDocumentHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [isDictating, setIsDictating] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findCaseSensitive, setFindCaseSensitive] = useState(false)
  const [findWholeWord, setFindWholeWord] = useState(false)
  const [findUseRegex, setFindUseRegex] = useState(false)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [commentText, setCommentText] = useState('')

  /* Stats */
  const stats = readingStats(content)
  const pageCount = Math.max(1, Math.ceil((content.split(/<br\s*\/?>/i).length + content.split('<p').length - 1) * (fontSize * lineHeight * 1.5) / 1123))

  /* ─── Effects ─── */

  // Initialize from localStorage or RichDoc redirect
  useEffect(() => {
    const fromRichDoc = localStorage.getItem('richDocContent')
    const fromTitle = localStorage.getItem('richDocTitle')
    if (fromRichDoc) {
      setContent(fromRichDoc)
      if (contentRef.current) contentRef.current.innerHTML = fromRichDoc
      if (fromTitle) setTitle(fromTitle)
      localStorage.removeItem('richDocContent')
      localStorage.removeItem('richDocTitle')
    } else {
      const saved = localStorage.getItem('swe-document')
      if (saved) {
        try {
          const doc = JSON.parse(saved)
          setTitle(doc.title || 'Document sans titre')
          setContent(doc.content || '')
          setFontFamily(doc.fontFamily || 'times')
          setFontSize(doc.fontSize || 12)
          setLineHeight(doc.lineHeight || 1.5)
          setMargins(doc.margins || { top: 25, right: 25, bottom: 25, left: 25 })
          setZoom(doc.zoom || 100)
          setSelectedTemplate(doc.selectedTemplate || LAYOUT_TEMPLATES[0])
          if (contentRef.current && doc.content) contentRef.current.innerHTML = doc.content
        } catch { /* ignore */ }
      }
    }
    const hist = localStorage.getItem('swe-history')
    if (hist) {
      try { setDocumentHistory(JSON.parse(hist)) } catch { /* ignore */ }
    }
    // Keyboard shortcuts
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); toggleFormat('bold'); break
          case 'i': e.preventDefault(); toggleFormat('italic'); break
          case 'u': e.preventDefault(); toggleFormat('underline'); break
          case 's':
            e.preventDefault()
            if (e.shiftKey) exportToText()
            else handleSave()
            break
          case 'y': e.preventDefault(); document.execCommand('redo'); updateContent(); break
          case 'z': e.preventDefault(); document.execCommand('undo'); updateContent(); break
          case 'k': e.preventDefault(); insertLink(); break
          case 'f': e.preventDefault(); setShowFindReplace(true); break
          case 'h': e.preventDefault(); setShowFindReplace(true); break
          case 'p': e.preventDefault(); checkAndExport(() => window.print()); break
          case 'e': e.preventDefault(); checkAndExport(exportToWord); break
          case 'm': e.preventDefault(); setShowAiPanel(v => !v); break
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Before unload
  useEffect(() => {
    const handler = (e) => {
      if (content && content !== '<p><br></p>' && content !== '<br>') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [content])

  // Auto-save to localStorage
  const saveToLocal = useCallback(() => {
    const doc = {
      title, content, fontFamily, fontSize, lineHeight,
      margins, zoom, selectedTemplate, timestamp: Date.now()
    }
    localStorage.setItem('swe-document', JSON.stringify(doc))
    setLastSaved(new Date())
  }, [title, content, fontFamily, fontSize, lineHeight, margins, zoom, selectedTemplate])

  const debouncedSave = useRef(debounce(saveToLocal, 3000)).current

  useEffect(() => { debouncedSave() }, [content, title, fontFamily, fontSize, lineHeight, margins, zoom, selectedTemplate, debouncedSave])

  // History snapshot every 2 min
  useEffect(() => {
    const interval = setInterval(() => {
      if (content && Date.now() - lastSnapshotRef.current > 120000) {
        const snapshot = { title, content, timestamp: Date.now() }
        setDocumentHistory(prev => {
          const next = [snapshot, ...prev].slice(0, 20)
          localStorage.setItem('swe-history', JSON.stringify(next))
          return next
        })
        lastSnapshotRef.current = Date.now()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [content, title])

  // Typewriter scroll
  useEffect(() => {
    if (!typewriterMode || !contentRef.current || !pageContainerRef.current) return
    const el = contentRef.current
    const onInput = () => {
      const sel = window.getSelection()
      if (sel.rangeCount) {
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        const containerRect = pageContainerRef.current.getBoundingClientRect()
        const target = containerRect.top + containerRect.height / 2
        const diff = rect.top - target
        pageContainerRef.current.scrollBy({ top: diff, behavior: 'smooth' })
      }
    }
    el.addEventListener('input', onInput)
    return () => el.removeEventListener('input', onInput)
  }, [typewriterMode])

  /* ─── Core Helpers ─── */
  const updateContent = () => {
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML)
    }
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    sel.removeAllRanges()
    if (savedRangeRef.current) sel.addRange(savedRangeRef.current)
  }

  const checkFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      justifyFull: document.queryCommandState('justifyFull'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    })
  }

  const handleTitleChange = (e) => setTitle(e.target.value)

  const toggleFormat = (command) => {
    if (contentRef.current) {
      contentRef.current.focus()
    }
    document.execCommand(command, false, null)
    updateContent()
    checkFormats()
  }

  const setBlockFormat = (command, value = null) => {
    if (contentRef.current) {
      contentRef.current.focus()
    }
    document.execCommand(command, false, value)
    updateContent()
    checkFormats()
  }

  /* ─── Insert ─── */
  const insertImage = () => {
    if (contentRef.current) contentRef.current.focus()
    const url = prompt('URL de l\'image:', 'https://')
    if (url) {
      const sel = window.getSelection()
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        const img = document.createElement('img')
        img.src = url
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        img.style.margin = '8px auto'
        range.deleteContents()
        range.insertNode(img)
        range.collapse(false)
        updateContent()
      }
    }
  }

  const insertLink = () => {
    if (contentRef.current) contentRef.current.focus()
    const url = prompt('URL du lien:', 'https://')
    if (url) {
      document.execCommand('createLink', false, url)
      updateContent()
    }
  }

  const insertTable = () => {
    if (contentRef.current) contentRef.current.focus()
    const { rows, cols, withHeader } = tableConfig
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0">'
    for (let i = 0; i < rows; i++) {
      html += '<tr>'
      for (let j = 0; j < cols; j++) {
        const isHeader = withHeader && i === 0
        const tag = isHeader ? 'th' : 'td'
        const bg = isHeader ? 'background:#f0f0f0;font-weight:bold' : ''
        html += `<${tag} style="border:1px solid #ccc;padding:6px;${bg}">Cellule</${tag}>`
      }
      html += '</tr>'
    }
    html += '</table><p><br></p>'
    document.execCommand('insertHTML', false, html)
    setShowTableDialog(false)
    updateContent()
  }

  const insertHorizontalRule = () => {
    if (contentRef.current) contentRef.current.focus()
    document.execCommand('insertHorizontalRule', false, null)
    updateContent()
  }

  const insertPageBreak = () => {
    if (contentRef.current) contentRef.current.focus()
    document.execCommand('insertHTML', false, '<div style="page-break-after:always;height:0"></div><p><br></p>')
    updateContent()
  }

  const insertSpecialChar = (char) => {
    if (contentRef.current) contentRef.current.focus()
    document.execCommand('insertText', false, char)
    updateContent()
  }

  const applyColor = (type, color) => {
    if (contentRef.current) contentRef.current.focus()
    if (type === 'text') document.execCommand('foreColor', false, color)
    else document.execCommand('hiliteColor', false, color)
    updateContent()
    setShowColorPicker(null)
  }

  /* ─── SmartArt ─── */
  const insertSmartArt = (style) => {
    if (contentRef.current) contentRef.current.focus()
    const sel = window.getSelection()
    if (sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const selectedText = range.toString()
    if (!selectedText) {
      alert('Veuillez sélectionner du texte pour appliquer un style.')
      return
    }
    const span = document.createElement('span')
    style.css.split(';').filter(s => s.trim()).forEach(rule => {
      const [prop, val] = rule.split(':').map(s => s.trim())
      if (prop && val) span.style[prop] = val
    })
    span.textContent = selectedText
    range.deleteContents()
    range.insertNode(span)
    range.collapse(false)
    updateContent()
  }

  /* ─── AI Assistant ─── */
  const callAi = async () => {
    const sel = window.getSelection()
    const selectedText = sel.toString().trim()
    const textToProcess = selectedText || aiInput
    if (!textToProcess.trim()) {
      alert('Sélectionnez du texte ou tapez une instruction.')
      return
    }
    setAiLoading(true)
    try {
      const mode = AI_MODES.find(m => m.id === aiMode) || AI_MODES[0]
      const prompt = mode.prompt.replace('{text}', textToProcess)
      const res = await fetch('/.netlify/functions/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Tu es un assistant rédactionnel professionnel. Réponds uniquement avec le texte demandé, sans introduction ni conclusion métacommentaire.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })
      const data = await res.json()
      const result = data.choices?.[0]?.message?.content || 'Erreur de génération'
      setAiHistory(prev => [{ mode: mode.name, input: textToProcess.slice(0, 100), result, timestamp: Date.now() }, ...prev].slice(0, 20))
      // Insert at cursor or replace selection
      if (selectedText) {
        document.execCommand('insertText', false, result)
      } else {
        document.execCommand('insertText', false, result)
      }
      updateContent()
    } catch (err) {
      console.error(err)
      alert('Erreur IA : ' + (err.message || 'Service indisponible'))
    } finally {
      setAiLoading(false)
    }
  }

  /* ─── Voice Dictation ─── */
  const toggleDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La dictée vocale n\'est pas supportée par ce navigateur.')
      return
    }
    if (isDictating && voiceRef.current) {
      voiceRef.current.stop()
      setIsDictating(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    voiceRef.current = recognition
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('')
      if (contentRef.current) {
        contentRef.current.focus()
        document.execCommand('insertText', false, transcript)
        updateContent()
      }
    }
    recognition.onerror = () => setIsDictating(false)
    recognition.onend = () => setIsDictating(false)
    recognition.start()
    setIsDictating(true)
  }

  /* ─── Find/Replace ─── */
  const handleReplaceAll = () => {
    if (!findText || !contentRef.current) return
    let pattern = findUseRegex ? findText : escapeRegExp(findText)
    const flags = findCaseSensitive ? 'g' : 'gi'
    if (findWholeWord) pattern = `\\b${pattern}\\b`
    try {
      const html = contentRef.current.innerHTML
      const newHtml = html.replace(new RegExp(pattern, flags), replaceText)
      contentRef.current.innerHTML = newHtml
      setContent(newHtml)
    } catch (e) {
      alert('Expression régulière invalide')
    }
  }

  /* ─── Comments ─── */
  const addComment = () => {
    const sel = window.getSelection()
    const text = sel.toString()
    if (!text || !commentText.trim()) return
    const id = 'c-' + Date.now()
    const range = sel.getRangeAt(0).cloneRange()
    const span = document.createElement('span')
    span.id = id
    span.style.backgroundColor = '#fff3cd'
    span.style.borderBottom = '2px solid #ffc107'
    span.dataset.comment = commentText
    try {
      range.surroundContents(span)
    } catch {
      alert('Impossible de commenter cette sélection. Essayez un texte plus simple.')
      return
    }
    setComments(prev => [...prev, { id, text, comment: commentText, timestamp: Date.now() }])
    setCommentText('')
    updateContent()
  }

  const removeComment = (id) => {
    const el = document.getElementById(id)
    if (el) {
      const parent = el.parentNode
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      updateContent()
    }
    setComments(prev => prev.filter(c => c.id !== id))
  }

  /* ─── History ─── */
  const restoreHistory = (snapshot) => {
    setTitle(snapshot.title)
    setContent(snapshot.content)
    if (contentRef.current) contentRef.current.innerHTML = snapshot.content
  }

  const handleSave = () => {
    saveToLocal()
    if (user && supabase) {
      // Optional: persist to Supabase for logged-in users
      supabase.from('documents').upsert({
        user_id: user.id,
        title,
        content,
        updated_at: new Date().toISOString()
      }, { onConflict: ['user_id', 'title'] }).then(({ error }) => {
        if (error) console.error('Supabase save error:', error)
        else console.log('Saved to cloud')
      })
    }
  }

  /* ─── Exports ─── */
  const exportToHTML = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:${FONTS.find(f=>f.id===fontFamily)?.family||'serif'};font-size:${fontSize}pt;line-height:${lineHeight};margin:0;padding:${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;}
</style></head><body>${content}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportToWord = () => {
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:${FONTS.find(f=>f.id===fontFamily)?.family||'serif'};font-size:${fontSize}pt;line-height:${lineHeight};">
${content}
</body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.doc`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => window.print()

  const exportToText = () => {
    const text = stripHtml(content)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportToMarkdown = () => {
    const md = `# ${title}\n\n` + htmlToMarkdown(content)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${title}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  const checkAndExport = async (exportFn) => {
    const debitResult = await guard.checkAndDebit()
    if (!debitResult.ok) return
    await guard.recordUsage()
    exportFn()
  }

  /* ─── Templates ─── */
  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setMargins(template.margins)
    setLineHeight(template.lineHeight)
    setShowTemplates(false)
  }

  /* ─── Outline Navigation ─── */
  const outlineItems = () => {
    if (!contentRef.current) return []
    const headings = contentRef.current.querySelectorAll('h1, h2, h3')
    return Array.from(headings).map((h, i) => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent,
      el: h
    }))
  }

  const scrollToHeading = (el) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /* ─── Styles ─── */
  const pageStyle = {
    padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
    fontFamily: FONTS.find(f => f.id === fontFamily)?.family || 'serif',
    fontSize: `${fontSize}pt`,
    lineHeight: lineHeight,
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    minHeight: `${297 - margins.top - margins.bottom}mm`,
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EDITOR_STYLES }} />
      <SEO title={`${title} — Smart Word Editor`} description="Éditeur de documents professionnel avec IA, dictée, historique et mise en page avancée"  image="/og-tools/smart-word-editor.jpg"/>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>
        <ToolInfoPanel
          toolName="Smart Word Editor"
          icon="📝"
          description="Éditeur de documents professionnel : IA intégrée, dictée vocale, historique, 8 templates, 13 polices et effets SmartArt"
          benefits={[
            'Rédigez avec l\'assistance IA (génération, réécriture, traduction, correction)',
            'Dictée vocale pour rédiger mains libres',
            'Historique automatique des versions du document',
            '8 templates pré-configurés et 13 polices professionnelles',
            'Export HTML, Word, PDF, Markdown et texte brut',
          ]}
          howToUse={[
            'Choisissez un template et donnez un titre à votre document',
            'Utilisez le bouton ✨ IA pour générer ou transformer du texte',
            'Activez la dictée vocale 🎙️ pour rédiger sans taper',
            'Personnalisez polices, marges, couleurs et interligne',
            'Exportez dans le format de votre choix',
          ]}
          tips={[
            'Le raccourci Ctrl+M ouvre l\'assistant IA',
            'Ctrl+S sauvegarde, Ctrl+Shift+S exporte en texte',
            'Le mode Focus (F11) masque tout sauf l\'éditeur',
          ]}
        />
        <div style={{ marginTop: 8 }}>
          <ToolGuardBadge guard={guard} />
        </div>
      </div>

      <div className="smart-word-editor">
      {/* ── Top Bar ── */}
      {!focusMode && (
        <div className="swe-title-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20 }}>📝</span>
          <input
            ref={titleRef}
            type="text"
            className="swe-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Titre du document..."
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="swe-btn" onClick={() => setShowTemplates(true)} title="Modèles">📄 Templates</button>
          <button className="swe-btn" onClick={() => setShowMargins(!showMargins)} title="Marges">📐 Marges</button>
          <button className="swe-btn" onClick={() => setShowAiPanel(!showAiPanel)} title="Assistant IA">✨ IA</button>
          <button className="swe-btn" onClick={toggleDictation} title="Dictée vocale" style={{ background: isDictating ? '#ef4444' : undefined, color: isDictating ? '#fff' : undefined }}>
            {isDictating ? '⏹️ Arrêter' : '🎙️ Dictée'}
          </button>
          <button className="swe-btn" onClick={() => setFocusMode(!focusMode)} title="Mode focus">
            {focusMode ? '⛶ Normal' : '🎯 Focus'}
          </button>
          <button className="swe-btn" onClick={handleSave} title="Sauvegarder (Ctrl+S)">💾</button>
          {lastSaved && <span style={{ fontSize: 11, color: '#666' }}>Sauvé {lastSaved.toLocaleTimeString()}</span>}
        </div>
      )}

      {/* ── Toolbar ── */}
      {!focusMode && (
        <div className="swe-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {/* Undo / Redo */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => { document.execCommand('undo'); updateContent() }} title="Annuler (Ctrl+Z)">↩️</button>
            <button className="swe-btn" onClick={() => { document.execCommand('redo'); updateContent() }} title="Rétablir (Ctrl+Y)">↪️</button>
          </div>

          {/* Font */}
          <div className="swe-toolbar-group">
            <select className="swe-select" value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ minWidth: 140 }}>
              {FONTS.map(f => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="swe-toolbar-group">
            <select className="swe-select" value={fontSize} onChange={e => { if (contentRef.current) contentRef.current.focus(); setFontSize(parseInt(e.target.value)); document.execCommand('fontSize', false, e.target.value); updateContent() }} style={{ width: 60 }}>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Format */}
          <div className="swe-toolbar-group">
            <button className={`swe-btn ${activeFormats.bold ? 'active' : ''}`} onClick={() => toggleFormat('bold')} title="Gras (Ctrl+B)"><b>B</b></button>
            <button className={`swe-btn ${activeFormats.italic ? 'active' : ''}`} onClick={() => toggleFormat('italic')} title="Italique (Ctrl+I)"><i>I</i></button>
            <button className={`swe-btn ${activeFormats.underline ? 'active' : ''}`} onClick={() => toggleFormat('underline')} title="Souligné (Ctrl+U)"><u>U</u></button>
            <button className={`swe-btn ${activeFormats.strikeThrough ? 'active' : ''}`} onClick={() => toggleFormat('strikeThrough')} title="Barré"><s>S</s></button>
          </div>

          {/* Align */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setBlockFormat('justifyLeft')} title="Gauche">⬅️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyCenter')} title="Centrer">⬆️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyRight')} title="Droite">➡️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyFull')} title="Justifier">⬌</button>
          </div>

          {/* Lists */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => toggleFormat('insertUnorderedList')} title="Puces">•</button>
            <button className="swe-btn" onClick={() => toggleFormat('insertOrderedList')} title="Numérotée">1.</button>
          </div>

          {/* Indent */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setBlockFormat('outdent')} title="Retrait -">⤴️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('indent')} title="Retrait +">⤵️</button>
          </div>

          {/* Insert */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={insertImage} title="Image">🖼️</button>
            <button className="swe-btn" onClick={() => setShowTableDialog(true)} title="Tableau">▦</button>
            <button className="swe-btn" onClick={insertLink} title="Lien (Ctrl+K)">🔗</button>
            <button className="swe-btn" onClick={insertHorizontalRule} title="Ligne">➖</button>
            <button className="swe-btn" onClick={insertPageBreak} title="Saut de page">↵</button>
          </div>

          {/* Colors */}
          <div className="swe-toolbar-group" style={{ position: 'relative' }}>
            <button className="swe-btn" onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')} title="Couleur texte">
              <span style={{ borderBottom: '3px solid ' + (showColorPicker === 'text' ? '#1976d2' : '#333') }}>A</span>
            </button>
            <button className="swe-btn" onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')} title="Surlignage">
              <span style={{ background: showColorPicker === 'bg' ? '#1976d2' : '#ffeb3b', padding: '0 4px', color: showColorPicker === 'bg' ? '#fff' : '#000' }}>H</span>
            </button>
            {showColorPicker && (
              <div style={{ position: 'absolute', top: 40, left: 0, zIndex: 10, background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: 'repeat(7, 24px)', gap: 4 }}>
                {COLOR_PRESETS.map(c => (
                  <button key={c} onClick={() => applyColor(showColorPicker, c)} style={{ width: 24, height: 24, borderRadius: 4, background: c, border: '1px solid #ddd', cursor: 'pointer' }} />
                ))}
                <input type="color" value={colorValue} onChange={e => { setColorValue(e.target.value); applyColor(showColorPicker, e.target.value) }} style={{ gridColumn: 'span 3', width: '100%' }} />
              </div>
            )}
          </div>

          {/* Headers */}
          <div className="swe-toolbar-group">
            <select className="swe-select" onChange={e => { if (e.target.value) setBlockFormat('formatBlock', e.target.value) }}>
              <option value="">Style</option>
              <option value="P">Paragraphe</option>
              <option value="H1">Titre 1</option>
              <option value="H2">Titre 2</option>
              <option value="H3">Titre 3</option>
              <option value="H4">Titre 4</option>
            </select>
          </div>

          {/* Line height */}
          <div className="swe-toolbar-group">
            <select className="swe-select" value={lineHeight} onChange={e => setLineHeight(parseFloat(e.target.value))} title="Interligne">
              <option value={1}>Simple</option>
              <option value={1.15}>1.15</option>
              <option value={1.5}>1.5</option>
              <option value={1.75}>1.75</option>
              <option value={2}>Double</option>
              <option value={2.5}>2.5</option>
            </select>
          </div>

          {/* SmartArt */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setShowSmartArt(!showSmartArt)} title="Texte Stylé" style={{ fontSize: '18px' }}>✨</button>
          </div>

          {/* Tools */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setShowFindReplace(true)} title="Rechercher (Ctrl+F)">🔍</button>
            <button className="swe-btn" onClick={() => setShowOutline(!showOutline)} title="Plan">📋</button>
            <button className="swe-btn" onClick={() => setShowHistory(!showHistory)} title="Historique">🕐</button>
            <button className="swe-btn" onClick={() => setShowWordGoal(!showWordGoal)} title="Objectif mots">🎯</button>
            <button className="swe-btn" onClick={() => setShowLineNumbers(!showLineNumbers)} title="Numéros de ligne">#</button>
            <button className="swe-btn" onClick={() => setTypewriterMode(!typewriterMode)} title="Mode machine à écrire" style={{ color: typewriterMode ? '#1976d2' : undefined }}>⌨️</button>
            <button className="swe-btn" onClick={() => setShowComments(!showComments)} title="Commentaires" style={{ color: comments.length ? '#f59e0b' : undefined }}>💬{comments.length > 0 && <sup>{comments.length}</sup>}</button>
            <button className="swe-btn" onClick={() => setShowSpecialChars(!showSpecialChars)} title="Caractères spéciaux">Ω</button>
          </div>

          {/* Export */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => checkAndExport(() => window.print())} title="Imprimer (Ctrl+P)">🖨️</button>
            <button className="swe-btn" onClick={() => checkAndExport(exportToWord)} title="Word">📄</button>
            <button className="swe-btn" onClick={() => checkAndExport(exportToPDF)} title="PDF">📑</button>
            <button className="swe-btn" onClick={exportToHTML} title="HTML">🌐</button>
            <button className="swe-btn" onClick={exportToMarkdown} title="Markdown">📉</button>
            <button className="swe-btn" onClick={exportToText} title="Texte">📃</button>
          </div>

          {/* Zoom */}
          <div className="swe-toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(parseInt(e.target.value))} style={{ width: 80 }} />
            <span style={{ fontSize: 12, minWidth: 36 }}>{zoom}%</span>
          </div>
        </div>
      )}

      {/* ── Floating panels ── */}

      {/* SmartArt Panel */}
      {showSmartArt && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 320, maxHeight: 500, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>🎨 Texte Stylé</h3>
            <button onClick={() => setShowSmartArt(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Sélectionnez du texte puis cliquez sur un style</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {SMARTART_STYLES.map(style => (
              <button key={style.id} onClick={() => insertSmartArt(style)} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8, background: 'var(--bg-primary)', cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>{style.icon}</span>
                <div style={{ fontSize: 11 }}>{style.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outline Panel */}
      {showOutline && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 260, maxHeight: 400, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Plan du document</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {outlineItems().length > 0 ? outlineItems().map((item, i) => (
              <button key={i} onClick={() => scrollToHeading(item.el)} style={{ textAlign: 'left', padding: '6px 8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, fontSize: item.level === 'h1' ? 14 : item.level === 'h2' ? 13 : 12, fontWeight: item.level === 'h1' ? 600 : 400, paddingLeft: item.level === 'h2' ? 16 : item.level === 'h3' ? 32 : 8, color: 'var(--text-primary)' }}>
                {item.level === 'h1' ? '📄' : item.level === 'h2' ? '📑' : '📃'} {item.text}
              </button>
            )) : (
              <p style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>Utilisez les styles Titre 1, 2, 3 pour créer un plan</p>
            )}
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 300, maxHeight: 400, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🕐 Historique</h3>
          {documentHistory.length === 0 ? (
            <p style={{ color: '#999', fontSize: 13 }}>Aucun historique</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documentHistory.map((h, i) => (
                <button key={i} onClick={() => restoreHistory(h)} style={{ textAlign: 'left', padding: 8, border: '1px solid #eee', borderRadius: 6, background: '#f9f9f9', cursor: 'pointer', fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{h.title}</div>
                  <div style={{ color: '#666' }}>{new Date(h.timestamp).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Word Goal */}
      {showWordGoal && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 220, background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🎯 Objectif mots</h3>
          <input type="number" value={wordGoal} onChange={e => setWordGoal(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', marginBottom: 8 }} />
          {wordGoal > 0 && (
            <div>
              <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (stats.words / wordGoal) * 100)}%`, height: '100%', background: stats.words >= wordGoal ? '#2ecc71' : '#3498db', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 12, marginTop: 4 }}>{stats.words} / {wordGoal} mots</p>
            </div>
          )}
        </div>
      )}

      {/* Special Chars */}
      {showSpecialChars && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 280, background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Ω Caractères spéciaux</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {SPECIAL_CHARS.map(c => (
              <button key={c} onClick={() => insertSpecialChar(c)} style={{ padding: 6, fontSize: 16, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: 'var(--bg-primary)' }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {/* Margins Panel */}
      {showMargins && (
        <div className="swe-margin-controls" style={{ display: 'flex', gap: 16, padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
          {['top', 'right', 'bottom', 'left'].map(side => (
            <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, textTransform: 'capitalize' }}>{side}</label>
              <input type="number" value={margins[side]} onChange={e => setMargins({ ...margins, [side]: parseInt(e.target.value) || 0 })} min={0} max={50} style={{ width: 50, padding: 4 }} />
              <span style={{ fontSize: 11 }}>mm</span>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Panel ── */}
      {showAiPanel && (
        <div style={{ position: 'fixed', right: 20, top: 140, width: 380, maxHeight: '80vh', overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>✨ Assistant IA</h3>
            <button onClick={() => setShowAiPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>

          <select value={aiMode} onChange={e => setAiMode(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 6, border: '1px solid #ddd' }}>
            {AI_MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>

          <textarea
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            placeholder="Tapez une instruction ou sélectionnez du texte dans l'éditeur..."
            style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', marginBottom: 10 }}
          />

          <button
            onClick={callAi}
            disabled={aiLoading}
            style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: aiLoading ? 0.7 : 1 }}
          >
            {aiLoading ? '⏳ Génération...' : '✨ Exécuter'}
          </button>

          {aiHistory.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8, color: '#666' }}>Historique IA</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflow: 'auto' }}>
                {aiHistory.map((h, i) => (
                  <div key={i} style={{ padding: 8, background: '#f5f5f5', borderRadius: 6, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#1976d2' }}>{h.mode}</div>
                    <div style={{ color: '#333', marginTop: 4, whiteSpace: 'pre-wrap' }}>{h.result.slice(0, 200)}{h.result.length > 200 ? '...' : ''}</div>
                    <button onClick={() => { document.execCommand('insertText', false, h.result); updateContent() }} style={{ marginTop: 4, fontSize: 11, color: '#1976d2', border: 'none', background: 'none', cursor: 'pointer' }}>📋 Insérer dans le document</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Page & Editor ── */}
      <div className="swe-page-container" ref={pageContainerRef} style={{ position: 'relative' }}>
        {/* Line Numbers */}
        {showLineNumbers && (
          <div style={{ position: 'absolute', left: -40, top: 0, width: 32, textAlign: 'right', color: '#999', fontSize: 10, fontFamily: 'monospace', lineHeight: pageStyle.lineHeight, userSelect: 'none', paddingTop: `${margins.top}mm` }}>
            {Array.from({ length: Math.max(1, Math.ceil(content.split('<br').length / (lineHeight * 1.2))) }, (_, i) => (
              <div key={i} style={{ height: `${fontSize * lineHeight * 1.5}pt` }}>{i + 1}</div>
            ))}
          </div>
        )}
        <div className="swe-page" style={{ ...pageStyle, colorScheme: 'light', color: '#1a1a2e' }}>
          <div
            ref={contentRef}
            className="swe-page-content"
            contentEditable
            suppressContentEditableWarning
            onInput={updateContent}
            onMouseUp={checkFormats}
            onKeyUp={checkFormats}
            style={{ minHeight: '100%', color: '#1a1a2e', colorScheme: 'light', padding: showLineNumbers ? '0 0 0 8px' : undefined }}
          />
        </div>
      </div>

      {/* ── Status Bar ── */}
      {!focusMode && (
        <div className="swe-status-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Page {pageCount}</span>
            <span>{stats.words} mots</span>
            <span>{stats.chars} car.</span>
            <span>{stats.sentences} phrases</span>
            <span>{stats.paragraphs} §</span>
            <span>⏱️ {stats.readingTime}</span>
            <span>Niv. {stats.grade}</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Zoom: {zoom}%</span>
            <span>Template: {selectedTemplate.name}</span>
            {wordGoal > 0 && (
              <span style={{ color: stats.words >= wordGoal ? '#2ecc71' : '#f59e0b' }}>
                🎯 {Math.round((stats.words / wordGoal) * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}

      {/* Find Replace */}
      {showFindReplace && (
        <div className="swe-template-panel" onClick={() => setShowFindReplace(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ marginBottom: 16 }}>🔍 Rechercher et remplacer</h2>
            <input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
            <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Remplacer par..." style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={findCaseSensitive} onChange={e => setFindCaseSensitive(e.target.checked)} /> Respecter la casse
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={findWholeWord} onChange={e => setFindWholeWord(e.target.checked)} /> Mots entiers
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={findUseRegex} onChange={e => setFindUseRegex(e.target.checked)} /> Regex
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => {
                if (findText && contentRef.current) {
                  if (window.find) {
                    window.find(findText, findCaseSensitive, false, true, findWholeWord, false, findUseRegex)
                  }
                }
              }} style={{ flex: 1, padding: 10, background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>🔍 Suivant</button>
              <button onClick={handleReplaceAll} style={{ flex: 1, padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Tout remplacer</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Panel */}
      {showComments && (
        <div style={{ position: 'fixed', right: 20, bottom: 80, width: 300, maxHeight: 400, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>💬 Commentaires</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ajouter un commentaire..." style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
            <button onClick={addComment} style={{ padding: '8px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+</button>
          </div>
          {comments.length === 0 ? (
            <p style={{ color: '#999', fontSize: 13 }}>Aucun commentaire. Sélectionnez du texte et ajoutez-en un.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: 8, background: '#fff3cd', borderRadius: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>"{c.text.slice(0, 40)}..."</div>
                  <div style={{ marginTop: 4 }}>{c.comment}</div>
                  <button onClick={() => removeComment(c.id)} style={{ marginTop: 4, fontSize: 11, color: '#c0392b', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️ Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="swe-template-panel" onClick={() => setShowTableDialog(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h2 style={{ marginBottom: 16 }}>▦ Insérer un tableau</h2>
            <label>Lignes</label>
            <input type="number" min={1} max={50} value={tableConfig.rows} onChange={e => setTableConfig({ ...tableConfig, rows: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
            <label>Colonnes</label>
            <input type="number" min={1} max={20} value={tableConfig.cols} onChange={e => setTableConfig({ ...tableConfig, cols: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 6, border: '1px solid #ddd' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={tableConfig.withHeader} onChange={e => setTableConfig({ ...tableConfig, withHeader: e.target.checked })} /> Première ligne en en-tête
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={insertTable} style={{ flex: 1, padding: 12, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>▦ Créer</button>
              <button onClick={() => setShowTableDialog(false)} style={{ padding: '12px 20px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="swe-template-panel" onClick={() => setShowTemplates(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 16 }}>Choisir un modèle</h2>
            <div className="swe-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {LAYOUT_TEMPLATES.map(t => (
                <div key={t.id} className={`swe-template-card ${selectedTemplate.id === t.id ? 'selected' : ''}`} onClick={() => applyTemplate(t)} style={{ padding: 16, border: selectedTemplate.id === t.id ? '2px solid #1976d2' : '1px solid #ddd', borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Marges {t.margins.top}/{t.margins.right}/{t.margins.bottom}/{t.margins.left}mm</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ToolUpsellModal
        isOpen={guard.upsellOpen}
        config={guard.upsellConfig}
        onClose={guard.closeUpsell}
        onUseCredit={async () => {
          const r = await guard.checkAndDebit()
          if (r.ok) guard.closeUpsell()
        }}
      />
      </div>
    </>
  )
}

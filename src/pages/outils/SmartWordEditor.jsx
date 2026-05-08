/**
 * Smart Word Editor — Éditeur de documents avancé
 * Mise en page libre, templates multiples, contrôle complet
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import '../../components/elite/elite.css'
import SEO from '../../components/SEO'

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES DE MISE EN PAGE
═══════════════════════════════════════════════════════════════ */
const LAYOUT_TEMPLATES = [
  { id: 'blank', name: 'Page blanche', icon: '📄', margins: { top: 25, right: 25, bottom: 25, left: 25 }, lineHeight: 1.5 },
  { id: 'letter', name: 'Lettre formelle', icon: '📨', margins: { top: 20, right: 20, bottom: 20, left: 20 }, lineHeight: 1.6 },
  { id: 'report', name: 'Rapport pro', icon: '📊', margins: { top: 30, right: 25, bottom: 30, left: 25 }, lineHeight: 1.8 },
  { id: 'contract', name: 'Contrat', icon: '⚖️', margins: { top: 20, right: 30, bottom: 20, left: 30 }, lineHeight: 2 },
  { id: 'cv', name: 'CV / Resume', icon: '👤', margins: { top: 15, right: 20, bottom: 15, left: 20 }, lineHeight: 1.4 },
  { id: 'memo', name: 'Mémo', icon: '📝', margins: { top: 20, right: 20, bottom: 20, left: 20 }, lineHeight: 1.5 },
  { id: 'novel', name: 'Roman / Livre', icon: '📖', margins: { top: 25, right: 20, bottom: 25, left: 20 }, lineHeight: 1.75 },
  { id: 'academic', name: 'Académique', icon: '🎓', margins: { top: 25, right: 25, bottom: 25, left: 30 }, lineHeight: 2 },
]

/* ═══════════════════════════════════════════════════════════════
   POLICES DISPONIBLES
═══════════════════════════════════════════════════════════════ */
const FONTS = [
  { id: 'arial', name: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'times', name: 'Times New Roman', family: "'Times New Roman', Times, serif" },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
  { id: 'calibri', name: 'Calibri', family: 'Calibri, sans-serif' },
  { id: 'verdana', name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'garamond', name: 'Garamond', family: "'EB Garamond', Garamond, serif" },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' },
  { id: 'opensans', name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { id: 'lato', name: 'Lato', family: 'Lato, sans-serif' },
  { id: 'courier', name: 'Courier New', family: "'Courier New', monospace" },
]

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 72]

/* ═══════════════════════════════════════════════════════════════
   STYLES SMARTART (Texte Stylé)
═══════════════════════════════════════════════════════════════ */
const SMARTART_STYLES = [
  { id: 'gradient-blue', name: 'Dégradé Bleu', icon: '🌊', css: 'background: linear-gradient(135deg, #2196F3, #9C27B0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;' },
  { id: 'gradient-gold', name: 'Or Royal', icon: '👑', css: 'background: linear-gradient(135deg, #FFD700, #FF8C00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;' },
  { id: 'gradient-fire', name: 'Feu', icon: '🔥', css: 'background: linear-gradient(180deg, #FF5722, #FF9800, #FFC107); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;' },
  { id: 'gradient-forest', name: 'Forêt', icon: '🌲', css: 'background: linear-gradient(135deg, #4CAF50, #8BC34A, #CDDC39); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;' },
  { id: 'shadow-soft', name: 'Ombre Douce', icon: '☁️', css: 'color: #333; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); font-weight: bold;' },
  { id: 'shadow-glow', name: 'Lueur', icon: '✨', css: 'color: #fff; text-shadow: 0 0 10px #2196F3, 0 0 20px #2196F3, 0 0 30px #2196F3; background: #1a1a2e; padding: 4px 8px; border-radius: 4px;' },
  { id: 'shadow-3d', name: '3D Relief', icon: '🎲', css: 'color: #fff; text-shadow: 1px 1px 0 #ccc, 2px 2px 0 #999, 3px 3px 0 #666, 4px 4px 0 #333; font-weight: bold;' },
  { id: 'outline-black', name: 'Contour Noir', icon: '⬛', css: 'color: #fff; -webkit-text-stroke: 2px #000; font-weight: bold;' },
  { id: 'outline-gold', name: 'Contour Or', icon: '🟨', css: 'color: #1a1a2e; -webkit-text-stroke: 2px #FFD700; font-weight: bold;' },
  { id: 'neon-blue', name: 'Néon Bleu', icon: '💎', css: 'color: #fff; text-shadow: 0 0 5px #00bcd4, 0 0 10px #00bcd4, 0 0 20px #00bcd4, 0 0 40px #00bcd4; background: #0d1117; padding: 4px 8px; border-radius: 4px;' },
  { id: 'neon-pink', name: 'Néon Rose', icon: '🌸', css: 'color: #fff; text-shadow: 0 0 5px #e91e63, 0 0 10px #e91e63, 0 0 20px #e91e63, 0 0 40px #e91e63; background: #0d1117; padding: 4px 8px; border-radius: 4px;' },
  { id: 'retro', name: 'Rétro', icon: '📺', css: 'color: #00ff00; background: #000; padding: 4px 8px; border-radius: 4px; font-family: monospace; text-shadow: 0 0 5px #00ff00;' },
  { id: 'vintage', name: 'Vintage', icon: '📜', css: 'color: #8B4513; text-shadow: 1px 1px 0 #D2691E; font-family: Georgia, serif; letter-spacing: 2px;' },
  { id: 'emboss', name: 'Embossé', icon: '🏛️', css: 'color: #f0f0f0; text-shadow: -1px -1px 1px #fff, 1px 1px 1px #999; background: linear-gradient(135deg, #e0e0e0, #f5f5f5); padding: 4px 8px; border-radius: 4px;' },
  { id: 'glass', name: 'Verre', icon: '💎', css: 'color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 4px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.2);' },
  { id: 'metallic', name: 'Métallique', icon: '🔩', css: 'background: linear-gradient(180deg, #C0C0C0 0%, #808080 50%, #C0C0C0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: bold;' },
]

/* ═══════════════════════════════════════════════════════════════
   STYLES CSS
═══════════════════════════════════════════════════════════════ */
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
  
  .swe-color-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border, #ddd);
    border-radius: 4px;
    cursor: pointer;
    padding: 2px;
    background: white;
  }
  
  .swe-color-btn input {
    width: 100%;
    height: 100%;
    border: none;
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
    /* Force light color scheme so browser UA styles stay light */
    color-scheme: light;
    color: #1a1a2e;
  }

  .swe-page-content {
    outline: none;
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    /* !important overrides browser dark-mode UA stylesheet on contenteditable */
    color: #1a1a2e !important;
    background: transparent !important;
    color-scheme: light;
  }

  .swe-page-content:focus {
    outline: none;
  }

  /* All content inside the A4 page is always dark text on white */
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
    color: #1a1a1a;
  }
  
  .swe-page-content h2 {
    font-size: 18pt;
    margin: 18pt 0 9pt 0;
    color: #1a1a1a;
  }
  
  .swe-page-content h3 {
    font-size: 14pt;
    margin: 14pt 0 7pt 0;
    color: #1a1a1a;
  }
  
  .swe-page-content p {
    color: #1a1a1a;
  }
  
  .swe-page-content span {
    color: #1a1a1a;
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
  }
  
  .swe-title-input {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 16px 0;
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
  }
  
  .swe-dropdown {
    position: relative;
  }
  
  .swe-dropdown-content {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100;
    min-width: 150px;
  }
  
  .swe-dropdown.open .swe-dropdown-content {
    display: block;
  }
  
  .swe-dropdown-item {
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .swe-dropdown-item:hover {
    background: #f5f5f5;
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

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function SmartWordEditor() {
  const [title, setTitle] = useState('Document sans titre')
  const DEFAULT_CONTENT = `<p style="color: #1a1a1a; font-size: 12pt;">Commencez à taper votre document ici...</p><p style="color: #1a1a1a;">&nbsp;</p><h2 style="color: #1a1a1a; font-size: 16pt; font-weight: bold;">TITRE DE SECTION</h2><p style="color: #1a1a1a;">Votre texte professionnel apparaît ici. Utilisez la barre d'outils pour formater votre document.</p>`
  
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [selectedTemplate, setSelectedTemplate] = useState(LAYOUT_TEMPLATES[0])
  const [margins, setMargins] = useState({ top: 25, right: 25, bottom: 25, left: 25 })
  const [fontFamily, setFontFamily] = useState('times')
  const [fontSize, setFontSize] = useState(12)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [zoom, setZoom] = useState(100)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showMargins, setShowMargins] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showSmartArt, setShowSmartArt] = useState(false)
  const [showOutline, setShowOutline] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [activeFormats, setActiveFormats] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState(null)
  
  const contentRef = useRef(null)
  const titleRef = useRef(null)

  // Inject styles
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = EDITOR_STYLES
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  // Initialize editor - load from localStorage if available
  useEffect(() => {
    const savedContent = localStorage.getItem('smartword_editor_content')
    const savedTitle = localStorage.getItem('smartword_editor_title')
    if (savedContent) {
      setContent(savedContent)
      // Clear localStorage after loading to prevent reload on refresh
      localStorage.removeItem('smartword_editor_content')
    }
    if (savedTitle) {
      setTitle(savedTitle)
      localStorage.removeItem('smartword_editor_title')
    }
    // Initialize contentRef with default content if empty
    if (contentRef.current && !savedContent) {
      contentRef.current.innerHTML = DEFAULT_CONTENT
    }
    if (contentRef.current) {
      // Force dark text via JS inline style — beats any UA dark-mode override
      contentRef.current.style.setProperty('color', '#1a1a2e', 'important')
      contentRef.current.style.setProperty('background', 'transparent', 'important')
      contentRef.current.style.setProperty('color-scheme', 'light')
      contentRef.current.focus()
    }
  }, [])

  // Update counts
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ' ')
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setWordCount(words.length)
    setCharCount(text.length)
  }, [content])

  // Check active formats
  const checkFormats = useCallback(() => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const formats = {}
      formats.bold = document.queryCommandState('bold')
      formats.italic = document.queryCommandState('italic')
      formats.underline = document.queryCommandState('underline')
      formats.strikeThrough = document.queryCommandState('strikeThrough')
      setActiveFormats(formats)
    }
  }, [])

  // Save and restore selection for cursor position - FIXED
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel.rangeCount > 0 && contentRef.current) {
      const range = sel.getRangeAt(0)
      // Store the current node and offset
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed
      }
    }
    return null
  }

  const restoreSelection = (savedSel) => {
    if (!savedSel || !contentRef.current) return
    
    try {
      const sel = window.getSelection()
      const range = document.createRange()
      
      // Try to restore to the same position or find the closest valid position
      let startNode = savedSel.startContainer
      let endNode = savedSel.endContainer
      
      // If the original node is no longer valid, try to find a text node nearby
      if (!contentRef.current.contains(startNode) || !startNode.parentNode) {
        // Focus the editor and place cursor at the end of content
        const textNodes = []
        const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
          textNodes.push(node)
        }
        if (textNodes.length > 0) {
          const lastNode = textNodes[textNodes.length - 1]
          range.setStart(lastNode, lastNode.length)
          range.setEnd(lastNode, lastNode.length)
        } else {
          range.selectNodeContents(contentRef.current)
          range.collapse(false)
        }
      } else {
        // Original nodes are still valid, try to restore
        try {
          range.setStart(startNode, Math.min(savedSel.startOffset, startNode.length || 0))
          range.setEnd(endNode, Math.min(savedSel.endOffset, endNode.length || 0))
        } catch (e) {
          // Fallback: place cursor at the end of start node
          range.selectNodeContents(startNode)
          range.collapse(false)
        }
      }
      
      sel.removeAllRanges()
      sel.addRange(range)
      
      // Focus the editor
      contentRef.current.focus()
    } catch (e) {
      // Silent fail - cursor positioning failed but command still executed
      console.warn('Cursor restore failed:', e)
    }
  }

  // Format commands - FIXED cursor behavior
  const toggleFormat = (command) => {
    const savedSel = saveSelection()
    document.execCommand(command, false, null)
    checkFormats()
    updateContent()
    // Restore cursor position after DOM update
    requestAnimationFrame(() => restoreSelection(savedSel))
  }

  const setBlockFormat = (command, value = null) => {
    const savedSel = saveSelection()
    document.execCommand(command, false, value)
    updateContent()
    // Restore cursor position after DOM update
    requestAnimationFrame(() => restoreSelection(savedSel))
  }

  // Insert SmartArt styled text
  const insertSmartArt = (style) => {
    const sel = window.getSelection()
    if (sel.rangeCount === 0) return
    
    const range = sel.getRangeAt(0)
    let text = ''
    
    // Get selected text or use placeholder
    if (!range.collapsed) {
      text = range.toString()
    } else {
      text = 'Texte Stylé'
    }
    
    // Create styled span
    const span = document.createElement('span')
    span.style.cssText = style.css
    span.textContent = text
    span.dataset.smartart = style.id
    
    // Replace selection with styled text
    range.deleteContents()
    range.insertNode(span)
    
    // Move cursor after the inserted node
    range.setStartAfter(span)
    range.setEndAfter(span)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    
    updateContent()
    contentRef.current.focus()
  }

  const updateContent = () => {
    if (contentRef.current) {
      // Just update stats, don't store content in state to avoid re-renders
      const text = contentRef.current.innerText || ''
      setCharCount(text.length)
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
    }
  }

  // Get content for export/save without storing in state
  const getContent = () => {
    return contentRef.current?.innerHTML || ''
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
  }

  const applyTemplate = (template) => {
    setSelectedTemplate(template)
    setMargins(template.margins)
    setLineHeight(template.lineHeight)
    setShowTemplates(false)
  }

  const exportToHTML = () => {
    const docContent = getContent()
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: ${FONTS.find(f => f.id === fontFamily)?.family || 'Times New Roman'}, serif;
      font-size: ${fontSize}pt;
      line-height: ${lineHeight};
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
    }
    h1 { font-size: 24pt; margin-bottom: 20px; }
    h2 { font-size: 18pt; margin-bottom: 15px; }
    h3 { font-size: 14pt; margin-bottom: 12px; }
    p { margin-bottom: 12pt; }
  </style>
</head>
<body>
  ${docContent}
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToWord = () => {
    const docContent = getContent()
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: ${FONTS.find(f => f.id === fontFamily)?.family || 'Times New Roman'}; font-size: ${fontSize}pt; line-height: ${lineHeight}; }
    p { margin: 0 0 12pt 0; }
    h1 { font-size: 24pt; }
    h2 { font-size: 18pt; }
    h3 { font-size: 14pt; }
  </style>
</head>
<body>
  ${docContent}
</body>
</html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    window.print()
  }

  const exportToText = () => {
    const docContent = getContent()
    const text = docContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = `<img src="${event.target.result}" style="max-width:100%; height:auto;" />`
          document.execCommand('insertHTML', false, img)
          updateContent()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const [showTableDialog, setShowTableDialog] = useState(false)
  const [tableConfig, setTableConfig] = useState({ rows: 3, cols: 3, withHeader: true })

  const insertTable = () => {
    const { rows, cols, withHeader } = tableConfig
    if (!rows || !cols || rows < 1 || cols < 1) {
      alert('Veuillez entrer des valeurs valides pour les lignes et colonnes')
      return
    }

    const savedSel = saveSelection()
    
    // Créer le tableau HTML
    let tableHTML = '<table style="width:100%; border-collapse:collapse; margin:12pt 0;">'
    
    for (let i = 0; i < parseInt(rows); i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < parseInt(cols); j++) {
        const isHeader = withHeader && i === 0
        const tag = isHeader ? 'th' : 'td'
        const bgStyle = isHeader ? 'background:#f5f5f5; font-weight:bold;' : ''
        tableHTML += `<${tag} style="border:1px solid #999; padding:8px; ${bgStyle}">${isHeader ? 'En-tête' : 'Cellule'}</${tag}>`
      }
      tableHTML += '</tr>'
    }
    tableHTML += '</table><br />'
    
    // Insérer le tableau
    document.execCommand('insertHTML', false, tableHTML)
    updateContent()
    
    // Fermer le dialog et restaurer la position
    setShowTableDialog(false)
    requestAnimationFrame(() => restoreSelection(savedSel))
  }

  const addTableRow = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const cell = selection.anchorNode?.closest?.('td, th') || 
                  selection.anchorNode?.parentElement?.closest?.('td, th')
    if (!cell) return
    
    const row = cell.closest('tr')
    const table = cell.closest('table')
    if (!row || !table) return
    
    const cols = row.children.length
    const newRow = document.createElement('tr')
    
    for (let i = 0; i < cols; i++) {
      const newCell = document.createElement('td')
      newCell.style.cssText = 'border:1px solid #999; padding:8px;'
      newCell.textContent = 'Cellule'
      newRow.appendChild(newCell)
    }
    
    row.parentNode.insertBefore(newRow, row.nextSibling)
    updateContent()
  }

  const addTableColumn = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const cell = selection.anchorNode?.closest?.('td, th') || 
                  selection.anchorNode?.parentElement?.closest?.('td, th')
    if (!cell) return
    
    const table = cell.closest('table')
    if (!table) return
    
    const cellIndex = Array.from(cell.parentNode.children).indexOf(cell)
    const rows = table.querySelectorAll('tr')
    
    rows.forEach(row => {
      const newCell = document.createElement(row.children[0]?.tagName === 'TH' ? 'th' : 'td')
      newCell.style.cssText = 'border:1px solid #999; padding:8px;'
      if (row.children[0]?.tagName === 'TH') {
        newCell.style.background = '#f5f5f5'
        newCell.style.fontWeight = 'bold'
      }
      newCell.textContent = row.children[0]?.tagName === 'TH' ? 'En-tête' : 'Cellule'
      
      if (cellIndex + 1 < row.children.length) {
        row.insertBefore(newCell, row.children[cellIndex + 1])
      } else {
        row.appendChild(newCell)
      }
    })
    
    updateContent()
  }

  const deleteTableRow = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const cell = selection.anchorNode?.closest?.('td, th') || 
                  selection.anchorNode?.parentElement?.closest?.('td, th')
    if (!cell) return
    
    const row = cell.closest('tr')
    const table = cell.closest('table')
    if (!row || !table) return
    
    if (table.rows.length > 1) {
      row.remove()
      updateContent()
    }
  }

  const deleteTableColumn = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const cell = selection.anchorNode?.closest?.('td, th') || 
                  selection.anchorNode?.parentElement?.closest?.('td, th')
    if (!cell) return
    
    const table = cell.closest('table')
    if (!table) return
    
    const cellIndex = Array.from(cell.parentNode.children).indexOf(cell)
    const rows = table.querySelectorAll('tr')
    
    let canDelete = true
    rows.forEach(row => {
      if (row.children.length <= 1) canDelete = false
    })
    
    if (canDelete) {
      rows.forEach(row => {
        if (row.children[cellIndex]) {
          row.children[cellIndex].remove()
        }
      })
      updateContent()
    }
  }

  const insertLink = () => {
    const url = prompt('URL du lien:', 'https://')
    if (url) {
      document.execCommand('createLink', false, url)
      updateContent()
    }
  }

  const printDocument = () => {
    window.print()
  }

  // Find and Replace functionality
  const handleFind = () => {
    if (findText && contentRef.current) {
      const selection = window.getSelection()
      selection.removeAllRanges()
      
      if (window.find) {
        window.find(findText, false, false, true)
      } else {
        alert('Fonction rechercher non supportée par ce navigateur')
      }
    }
  }

  const handleReplace = () => {
    if (findText && contentRef.current) {
      const html = contentRef.current.innerHTML
      const newHtml = html.replace(new RegExp(findText, 'g'), replaceText)
      contentRef.current.innerHTML = newHtml
      setContent(newHtml)
    }
  }

  const handleReplaceAll = () => {
    if (findText && contentRef.current) {
      const html = contentRef.current.innerHTML
      const newHtml = html.replace(new RegExp(findText, 'gi'), replaceText)
      contentRef.current.innerHTML = newHtml
      setContent(newHtml)
    }
  }

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
      <SEO title={`${title} — Smart Word Editor`} description="Éditeur de documents professionnel avec mise en page libre" />
      
      <div className="smart-word-editor">
        {/* Title Bar */}
        <div className="swe-title-bar">
          <span style={{ fontSize: 20 }}>📝</span>
          <input
            ref={titleRef}
            type="text"
            className="swe-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Titre du document..."
          />
          <button 
            className="swe-btn" 
            onClick={() => setShowTemplates(true)}
            title="Modèles de mise en page"
            style={{ width: 'auto', padding: '0 12px', gap: 6 }}
          >
            📄 Templates
          </button>
          <button 
            className="swe-btn" 
            onClick={() => setShowMargins(!showMargins)}
            title="Marges"
            style={{ width: 'auto', padding: '0 12px', gap: 6 }}
          >
            📐 Marges
          </button>
        </div>

        {/* Toolbar */}
        <div className="swe-toolbar">
          {/* Undo/Redo */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => { document.execCommand('undo'); updateContent() }} title="Annuler">↩️</button>
            <button className="swe-btn" onClick={() => { document.execCommand('redo'); updateContent() }} title="Rétablir">↪️</button>
          </div>

          {/* Font Family */}
          <div className="swe-toolbar-group">
            <select 
              className="swe-select" 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              style={{ minWidth: 140 }}
            >
              {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Font Size */}
          <div className="swe-toolbar-group">
            <select 
              className="swe-select" 
              value={fontSize} 
              onChange={(e) => {
                setFontSize(parseInt(e.target.value))
                document.execCommand('fontSize', false, e.target.value)
                updateContent()
              }}
              style={{ width: 60 }}
            >
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Text Formatting */}
          <div className="swe-toolbar-group">
            <button 
              className={`swe-btn ${activeFormats.bold ? 'active' : ''}`} 
              onClick={() => toggleFormat('bold')} 
              title="Gras"
            >
              <b>B</b>
            </button>
            <button 
              className={`swe-btn ${activeFormats.italic ? 'active' : ''}`} 
              onClick={() => toggleFormat('italic')} 
              title="Italique"
            >
              <i>I</i>
            </button>
            <button 
              className={`swe-btn ${activeFormats.underline ? 'active' : ''}`} 
              onClick={() => toggleFormat('underline')} 
              title="Souligné"
            >
              <u>U</u>
            </button>
            <button 
              className={`swe-btn ${activeFormats.strikeThrough ? 'active' : ''}`} 
              onClick={() => toggleFormat('strikeThrough')} 
              title="Barré"
            >
              <s>S</s>
            </button>
          </div>

          {/* Alignment */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setBlockFormat('justifyLeft')} title="Aligner à gauche">⬅️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyCenter')} title="Centrer">⬆️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyRight')} title="Aligner à droite">➡️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('justifyFull')} title="Justifier">⬌</button>
          </div>

          {/* Lists */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => toggleFormat('insertUnorderedList')} title="Liste à puces">•</button>
            <button className="swe-btn" onClick={() => toggleFormat('insertOrderedList')} title="Liste numérotée">1.</button>
          </div>

          {/* Indent */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setBlockFormat('outdent')} title="Diminuer le retrait">⤴️</button>
            <button className="swe-btn" onClick={() => setBlockFormat('indent')} title="Augmenter le retrait">⤵️</button>
          </div>

          {/* Insert */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={insertImage} title="Insérer une image">🖼️</button>
            <button className="swe-btn" onClick={() => setShowTableDialog(true)} title="Insérer un tableau">▦</button>
            <button className="swe-btn" onClick={insertLink} title="Insérer un lien">🔗</button>
            <button className="swe-btn" onClick={() => setBlockFormat('insertHorizontalRule')} title="Ligne horizontale">➖</button>
          </div>

          {/* Colors */}
          <div className="swe-toolbar-group">
            <div className="swe-dropdown">
              <button className="swe-btn" onClick={() => setDropdownOpen(dropdownOpen === 'color' ? null : 'color')} title="Couleur du texte">
                <span style={{ borderBottom: '3px solid #333' }}>A</span>
              </button>
            </div>
            <div className="swe-dropdown">
              <button className="swe-btn" onClick={() => setDropdownOpen(dropdownOpen === 'bg' ? null : 'bg')} title="Couleur de fond">
                <span style={{ background: '#ffeb3b', padding: '0 4px' }}>H</span>
              </button>
            </div>
          </div>

          {/* Headers */}
          <div className="swe-toolbar-group">
            <select 
              className="swe-select" 
              onChange={(e) => {
                if (e.target.value) {
                  setBlockFormat('formatBlock', e.target.value)
                }
              }}
            >
              <option value="">Style</option>
              <option value="P">Paragraphe</option>
              <option value="H1">Titre 1</option>
              <option value="H2">Titre 2</option>
              <option value="H3">Titre 3</option>
              <option value="H4">Titre 4</option>
            </select>
          </div>

          {/* Line Height */}
          <div className="swe-toolbar-group">
            <select 
              className="swe-select" 
              value={lineHeight} 
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              title="Interligne"
            >
              <option value={1}>Simple</option>
              <option value={1.15}>1.15</option>
              <option value={1.5}>1.5</option>
              <option value={1.75}>1.75</option>
              <option value={2}>Double</option>
              <option value={2.5}>2.5</option>
            </select>
          </div>

          {/* SmartArt / Texte Stylé */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setShowSmartArt(!showSmartArt)} title="Texte Stylé" style={{ fontSize: '18px' }}>✨</button>
          </div>

          {/* Tools */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={() => setShowFindReplace(true)} title="Rechercher/Remplacer">🔍</button>
            <button className="swe-btn" onClick={() => setShowOutline(!showOutline)} title="Plan du document">📋</button>
            <button className="swe-btn" onClick={() => setIsFullscreen(!isFullscreen)} title="Plein écran">⛶</button>
          </div>

          {/* Export */}
          <div className="swe-toolbar-group">
            <button className="swe-btn" onClick={printDocument} title="Imprimer">🖨️</button>
            <button className="swe-btn" onClick={exportToWord} title="Export Word">📄</button>
            <button className="swe-btn" onClick={exportToPDF} title="Export PDF">📑</button>
            <button className="swe-btn" onClick={exportToHTML} title="Export HTML">🌐</button>
          </div>
        </div>

        {/* SmartArt / Texte Stylé Panel */}
        {showSmartArt && (
          <div className="swe-outline-panel" style={{ position: 'fixed', right: 20, top: 180, width: 320, maxHeight: 500, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border, #ddd)', borderRadius: 12, padding: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>🎨 Texte Stylé</h3>
              <button onClick={() => setShowSmartArt(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Sélectionnez du texte puis cliquez sur un style
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SMARTART_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => insertSmartArt(style)}
                  style={{
                    padding: '12px 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: 24 }}>{style.icon}</span>
                  <span style={{ 
                    fontSize: 11, 
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    {style.name}
                  </span>
                  <span style={{ fontSize: 14, ...Object.fromEntries(style.css.split(';').filter(s => s).map(s => s.trim().split(': ').map((v, i) => i === 1 ? v.replace(/"/g, "'") : v))) }}>
                    Abc
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outline Panel */}
        {showOutline && (
          <div className="swe-outline-panel" style={{ position: 'fixed', right: 20, top: 180, width: 250, maxHeight: 400, overflow: 'auto', background: 'var(--bg-secondary, white)', border: '1px solid var(--border, #ddd)', borderRadius: 8, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Plan du document</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {content.includes('<h1') || content.includes('<h2') || content.includes('<h3') ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: content.replace(/<(?!h[123]|\/h[123]|p>|\/p>|br|\/br)[^>]*>/g, '')
                                 .replace(/<h1[^>]*>([^<]*)<\/h1>/g, '<div style="padding:4px 0;font-weight:600;color:#1976d2;font-size:16px">📄 $1</div>')
                                 .replace(/<h2[^>]*>([^<]*)<\/h2>/g, '<div style="padding:4px 0;padding-left:16px;font-weight:500;color:#333;font-size:14px">📑 $1</div>')
                                 .replace(/<h3[^>]*>([^<]*)<\/h3>/g, '<div style="padding:4px 0;padding-left:32px;color:#666;font-size:13px">📃 $1</div>')
                }} />
              ) : (
                <p style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>
                  Utilisez les styles Titre 1, 2, 3 pour créer un plan
                </p>
              )}
            </div>
          </div>
        )}

        {/* Margins Panel */}
        {showMargins && (
          <div className="swe-margin-controls">
            <div className="swe-margin-field">
              <label>Haut</label>
              <input 
                type="number" 
                value={margins.top} 
                onChange={(e) => setMargins({...margins, top: parseInt(e.target.value) || 0})}
                min={0} max={50}
              /> mm
            </div>
            <div className="swe-margin-field">
              <label>Droite</label>
              <input 
                type="number" 
                value={margins.right} 
                onChange={(e) => setMargins({...margins, right: parseInt(e.target.value) || 0})}
                min={0} max={50}
              /> mm
            </div>
            <div className="swe-margin-field">
              <label>Bas</label>
              <input 
                type="number" 
                value={margins.bottom} 
                onChange={(e) => setMargins({...margins, bottom: parseInt(e.target.value) || 0})}
                min={0} max={50}
              /> mm
            </div>
            <div className="swe-margin-field">
              <label>Gauche</label>
              <input 
                type="number" 
                value={margins.left} 
                onChange={(e) => setMargins({...margins, left: parseInt(e.target.value) || 0})}
                min={0} max={50}
              /> mm
            </div>
          </div>
        )}

        {/* Page Container */}
        <div className="swe-page-container">
          {/* colorScheme:light forces browser UA to use light-mode canvas colors */}
          <div className="swe-page" style={{ ...pageStyle, colorScheme: 'light', color: '#1a1a2e' }}>
            <div
              ref={contentRef}
              className="swe-page-content"
              contentEditable
              suppressContentEditableWarning
              onInput={updateContent}
              onMouseUp={checkFormats}
              onKeyUp={checkFormats}
              style={{ minHeight: '100%', color: '#1a1a2e', colorScheme: 'light' }}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="swe-status-bar">
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Page {pageCount} sur {pageCount}</span>
            <span>{wordCount} mots</span>
            <span>{charCount} caractères</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Zoom: {zoom}%</span>
            <span>Template: {selectedTemplate.name}</span>
          </div>
        </div>
      </div>

      {/* Find/Replace Modal */}
      {showFindReplace && (
        <div className="swe-template-panel" onClick={() => setShowFindReplace(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Rechercher et remplacer</h2>
              <button 
                className="swe-btn" 
                onClick={() => setShowFindReplace(false)}
                style={{ fontSize: 20 }}
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Rechercher</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Texte à rechercher..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Remplacer par</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Nouveau texte..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={handleFind}
                style={{ flex: 1, padding: '10px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                🔍 Rechercher
              </button>
              <button 
                onClick={handleReplace}
                style={{ flex: 1, padding: '10px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Remplacer
              </button>
              <button 
                onClick={handleReplaceAll}
                style={{ flex: 1, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Tout remplacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Dialog Modal */}
      {showTableDialog && (
        <div className="swe-template-panel" onClick={() => setShowTableDialog(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>▦ Insérer un tableau</h2>
              <button className="swe-btn" onClick={() => setShowTableDialog(false)} style={{ fontSize: 20 }}>
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Nombre de lignes</label>
              <input
                type="number"
                min="1"
                max="50"
                value={tableConfig.rows}
                onChange={(e) => setTableConfig({...tableConfig, rows: parseInt(e.target.value) || 1})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Nombre de colonnes</label>
              <input
                type="number"
                min="1"
                max="20"
                value={tableConfig.cols}
                onChange={(e) => setTableConfig({...tableConfig, cols: parseInt(e.target.value) || 1})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tableConfig.withHeader}
                  onChange={(e) => setTableConfig({...tableConfig, withHeader: e.target.checked})}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14 }}>Première ligne en tant qu'en-tête</span>
              </label>
            </div>
            
            {/* Aperçu */}
            <div style={{ marginBottom: 20, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#666', fontWeight: 500 }}>Aperçu:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Array.from({ length: Math.min(tableConfig.rows, 4) }, (_, i) => (
                    <tr key={i}>
                      {Array.from({ length: tableConfig.cols }, (_, j) => (
                        <td 
                          key={j} 
                          style={{ 
                            border: '1px solid #ccc', 
                            padding: '4px 8px', 
                            fontSize: 11,
                            background: tableConfig.withHeader && i === 0 ? '#e0e0e0' : 'white',
                            fontWeight: tableConfig.withHeader && i === 0 ? 'bold' : 'normal'
                          }}
                        >
                          {tableConfig.withHeader && i === 0 ? 'En-tête' : 'Cellule'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {tableConfig.rows > 4 && (
                    <tr>
                      <td colSpan={tableConfig.cols} style={{ textAlign: 'center', padding: '4px', fontSize: 11, color: '#999' }}>
                        ... ({tableConfig.rows - 4} lignes de plus)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={insertTable}
                style={{ flex: 1, padding: '12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                ▦ Créer le tableau
              </button>
              <button 
                onClick={() => setShowTableDialog(false)}
                style={{ padding: '12px 20px', background: '#f0f0f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplates && (
        <div className="swe-template-panel" onClick={() => setShowTemplates(false)}>
          <div className="swe-template-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Choisir un modèle</h2>
              <button 
                className="swe-btn" 
                onClick={() => setShowTemplates(false)}
                style={{ fontSize: 20 }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: '#666', margin: '0 0 16px 0' }}>
              Sélectionnez un modèle de mise en page pour votre document
            </p>
            <div className="swe-template-grid">
              {LAYOUT_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  className={`swe-template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                  onClick={() => applyTemplate(template)}
                >
                  <div className="swe-template-icon">{template.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{template.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Marges: {template.margins.top}/{template.margins.right}/{template.margins.bottom}/{template.margins.left}mm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

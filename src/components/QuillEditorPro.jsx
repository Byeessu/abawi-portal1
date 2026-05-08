/**
 * Éditeur Pro ABAWI — Quill 2.0.3 — Complet 360°
 * Police + Taille + Formatage complet + Tableau + Image + Plein écran
 * Mise en page automatique IA + Find + Plan du document + Historique
 */
import { useEffect, useRef, useCallback, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   TOOLBAR
═══════════════════════════════════════════════════════════════ */
const TOOLBAR_OPTS = [
  [{ font: ['', 'times', 'arial', 'georgia', 'calibri', 'courier'] }],
  [{ size: ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt'] }],
  [{ header: [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['link', 'image', 'blockquote', 'code-block'],
  ['clean'],
]

/* ═══════════════════════════════════════════════════════════════
   CSS COMPLET
═══════════════════════════════════════════════════════════════ */
const CSS = `
.ql-toolbar.ql-snow {
  border: none !important; border-bottom: 1px solid #d1d5db !important;
  background: #f8fafc !important; padding: 6px 10px !important; flex-wrap: wrap !important;
}
.ql-toolbar.ql-snow .ql-formats { margin-right: 8px !important; }
.ql-container.ql-snow { border: none !important; }

/* ── Conteneur page (gris, comme Word) ── */
.qep-page-wrap {
  background: #c8c8c8 !important;
  padding: 28px 24px !important;
  overflow-y: auto !important;
  flex: 1;
}

/* ── Éditeur A4 — carte blanche centrée ── */
.ql-editor {
  max-width: 794px !important;         /* 210mm @96dpi */
  margin: 0 auto !important;
  min-height: 1122px !important;       /* 297mm @96dpi */
  padding: 94px 94px !important;       /* ~25mm marges */
  background: #ffffff !important;
  box-shadow: 0 4px 28px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08) !important;
  border-radius: 2px !important;
  color: #111111 !important;
  font-family: 'Times New Roman', Times, serif !important;
  font-size: 12pt !important;
  line-height: 1.75 !important;
  word-spacing: 0.02em !important;
  hyphens: auto !important;
}

/* ── Paragraphe ── */
.ql-editor p {
  font-family: 'Times New Roman', Times, serif !important;
  font-size: 12pt !important; color: #111 !important;
  line-height: 1.75 !important; margin: 0 0 12px !important;
  text-align: justify !important;
}

/* ── Titres ── */
.ql-editor h1 {
  font-family: 'Times New Roman', Times, serif !important; font-size: 18pt !important;
  font-weight: 700 !important; color: #111 !important;
  margin: 28px 0 12px !important; border-bottom: 2px solid #d1d5db;
  padding-bottom: 8px; line-height: 1.25 !important;
}
.ql-editor h2 {
  font-family: 'Times New Roman', Times, serif !important; font-size: 14pt !important;
  font-weight: 700 !important; color: #111 !important;
  margin: 22px 0 8px !important; border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px; line-height: 1.3 !important;
}
.ql-editor h3 {
  font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important;
  font-weight: 700 !important; font-style: italic !important;
  color: #222 !important; margin: 16px 0 6px !important;
}
.ql-editor h4 {
  font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important;
  font-weight: 700 !important; color: #333 !important; margin: 12px 0 4px !important;
}

/* ── Listes ── */
.ql-editor ul, .ql-editor ol { padding-left: 28px !important; margin: 6px 0 12px !important; }
.ql-editor li {
  font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important;
  line-height: 1.75 !important; margin-bottom: 5px !important; color: #111 !important;
}

/* ── Citations ── */
.ql-editor blockquote {
  border-left: 3px solid #9ca3af !important; margin: 14px 0 !important;
  padding: 10px 22px !important; color: #555 !important; font-style: italic !important;
  background: rgba(0,0,0,0.02) !important; border-radius: 0 4px 4px 0 !important;
}

/* ── Code ── */
.ql-editor pre  { font-family: 'Courier New', monospace !important; font-size: 10pt !important; background: #f3f4f6 !important; border-radius: 6px !important; padding: 14px 18px !important; margin: 10px 0 !important; }
.ql-editor code { font-family: 'Courier New', monospace !important; font-size: 10pt !important; background: #f3f4f6 !important; border-radius: 3px !important; padding: 1px 5px !important; }

/* ── Image & tableau ── */
.ql-editor img { max-width: 100% !important; border-radius: 4px !important; cursor: pointer; display: block; margin: 10px auto; }
.ql-editor table { border-collapse: collapse !important; width: 100% !important; margin: 14px 0 !important; }
.ql-editor td, .ql-editor th { border: 1px solid #d1d5db !important; padding: 8px 12px !important; font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important; }
.ql-editor th { background: #f9fafb !important; font-weight: 700 !important; }

/* ── Placeholder ── */
.ql-editor.ql-blank::before { color: #9ca3af !important; font-style: italic !important; font-family: 'Times New Roman', Times, serif !important; font-size: 12pt !important; left: 94px !important; }

/* ── Séparateur de page virtuel (toutes les ~1122px) ── */
.qep-page-break {
  width: 100%; max-width: 794px; margin: 0 auto 4px;
  display: flex; align-items: center; gap: 12px;
  font-size: 0.68rem; color: #888; user-select: none;
}
.qep-page-break::before, .qep-page-break::after {
  content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.25); border-top: 1px dashed rgba(0,0,0,0.3);
}

/* ── Polices dans l'éditeur ── */
.ql-editor .ql-font-times   { font-family: 'Times New Roman', Times, serif !important; }
.ql-editor .ql-font-arial   { font-family: Arial, Helvetica, sans-serif !important; }
.ql-editor .ql-font-georgia { font-family: Georgia, serif !important; }
.ql-editor .ql-font-calibri { font-family: Calibri, sans-serif !important; }
.ql-editor .ql-font-courier { font-family: 'Courier New', monospace !important; }

/* ── Labels sélecteur police ── */
.ql-snow .ql-picker.ql-font { width: 128px !important; }
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before                { content: 'Police'; }
.ql-snow .ql-picker.ql-font [data-value='times']::before           { content: 'Times New Roman'; font-family: 'Times New Roman', serif; }
.ql-snow .ql-picker.ql-font [data-value='arial']::before           { content: 'Arial'; font-family: Arial, sans-serif; }
.ql-snow .ql-picker.ql-font [data-value='georgia']::before         { content: 'Georgia'; font-family: Georgia, serif; }
.ql-snow .ql-picker.ql-font [data-value='calibri']::before         { content: 'Calibri'; font-family: Calibri, sans-serif; }
.ql-snow .ql-picker.ql-font [data-value='courier']::before         { content: 'Courier New'; font-family: 'Courier New', monospace; }

/* ── Sélecteur taille ── */
.ql-snow .ql-picker.ql-size { width: 66px !important; }
.ql-snow .ql-picker.ql-size .ql-picker-label::before               { content: '12pt' !important; }
.ql-snow .ql-picker.ql-size [data-value='8pt']::before             { content: '8pt' !important;  font-size: 9px; }
.ql-snow .ql-picker.ql-size [data-value='9pt']::before             { content: '9pt' !important;  font-size: 10px; }
.ql-snow .ql-picker.ql-size [data-value='10pt']::before            { content: '10pt' !important; font-size: 11px; }
.ql-snow .ql-picker.ql-size [data-value='11pt']::before            { content: '11pt' !important; font-size: 12px; }
.ql-snow .ql-picker.ql-size [data-value='12pt']::before            { content: '12pt' !important; font-size: 13px; }
.ql-snow .ql-picker.ql-size [data-value='14pt']::before            { content: '14pt' !important; font-size: 14px; }
.ql-snow .ql-picker.ql-size [data-value='16pt']::before            { content: '16pt' !important; font-size: 15px; }
.ql-snow .ql-picker.ql-size [data-value='18pt']::before            { content: '18pt' !important; font-size: 16px; }
.ql-snow .ql-picker.ql-size [data-value='20pt']::before            { content: '20pt' !important; font-size: 17px; }
.ql-snow .ql-picker.ql-size [data-value='24pt']::before            { content: '24pt' !important; font-size: 18px; font-weight: 600; }
.ql-snow .ql-picker.ql-size [data-value='28pt']::before            { content: '28pt' !important; font-size: 20px; font-weight: 700; }
.ql-snow .ql-picker.ql-size [data-value='36pt']::before            { content: '36pt' !important; font-size: 22px; font-weight: 800; }

/* ── Header labels ── */
.ql-snow .ql-picker.ql-header { width: 108px !important; }
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before               { content: 'Normal' !important; }
.ql-snow .ql-picker.ql-header [data-value='1']::before              { content: 'Titre 1' !important; font-size: 1.1em; font-weight: 800; }
.ql-snow .ql-picker.ql-header [data-value='2']::before              { content: 'Titre 2' !important; font-size: 1em; font-weight: 700; }
.ql-snow .ql-picker.ql-header [data-value='3']::before              { content: 'Titre 3' !important; font-size: 0.95em; font-weight: 600; font-style: italic; }
.ql-snow .ql-picker.ql-header [data-value='4']::before              { content: 'Titre 4' !important; font-size: 0.9em; font-weight: 600; }

/* ── Dropdowns ── */
.ql-snow .ql-picker-options { background: #fff !important; border: 1px solid #e5e7eb !important; border-radius: 8px !important; box-shadow: 0 8px 28px rgba(0,0,0,0.12) !important; max-height: 240px !important; overflow-y: auto !important; z-index: 9999 !important; }
.ql-snow .ql-tooltip { z-index: 9999 !important; }
.ql-snow .ql-picker-item:hover { background: #f0f9ff !important; color: #1e40af !important; }

/* ── Surlignage de recherche ── */
.ql-search-highlight { background: #fef08a !important; border-radius: 2px; }

/* ── Plein écran ── */
.qep-fullscreen { position: fixed !important; inset: 0 !important; z-index: 99999 !important; display: flex !important; flex-direction: column !important; border-radius: 0 !important; background: #fff; }
.qep-fullscreen .qep-page-wrap { flex: 1; overflow-y: auto; }
.qep-fullscreen .ql-editor { min-height: calc(100vh - 200px) !important; }
`

let cssInjected = false
function injectCSS() {
  if (cssInjected) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css'
  document.head.appendChild(link)
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }))
  cssInjected = true
}

/* ═══════════════════════════════════════════════════════════════
   NETTOYAGE & PARSING
═══════════════════════════════════════════════════════════════ */

/* Retire uniquement les marqueurs markdown de structure de ligne (pas l'inline) */
function stripLineMarker(line) {
  return line.replace(/\s{2,}/g, ' ').trim()
}

// Legacy alias retained for callers in smartFormatDelta below.
const cleanLine = stripLineMarker

/* Insère le texte d'une ligne en préservant **gras**, *italique*, `code` */
function insertInline(delta, raw) {
  if (!raw) return
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let m
  while ((m = regex.exec(raw)) !== null) {
    if (m.index > last) delta.insert(raw.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('***'))      delta.insert(tok.slice(3,-3), { bold: true, italic: true })
    else if (tok.startsWith('**') || tok.startsWith('__')) delta.insert(tok.slice(2,-2), { bold: true })
    else if (tok.startsWith('*') || tok.startsWith('_'))  delta.insert(tok.slice(1,-1), { italic: true })
    else if (tok.startsWith('`'))   delta.insert(tok.slice(1,-1), { code: true })
    last = m.index + tok.length
  }
  if (last < raw.length) delta.insert(raw.slice(last))
}

function parseLine(raw) {
  const t = raw.trim()
  if (!t) return { type: 'empty', raw: '' }
  if (/^---+$|^===+$/.test(t)) return { type: 'hr', raw: t }
  if (/^#{4}\s/.test(t)) return { type: 'h4', raw: t.replace(/^#{4}\s/, '') }
  if (/^#{3}\s/.test(t)) return { type: 'h3', raw: t.replace(/^#{3}\s/, '') }
  if (/^#{2}\s/.test(t)) return { type: 'h2', raw: t.replace(/^#{2}\s/, '') }
  if (/^#{1}\s/.test(t)) return { type: 'h1', raw: t.replace(/^#{1}\s/, '') }
  if (/^[-•]\s/.test(t)) return { type: 'bullet', raw: t.replace(/^[-•]\s/, '') }
  if (/^\d+[.)]\s/.test(t)) return { type: 'ordered', raw: t.replace(/^\d+[.)]\s/, '') }
  if (/^>\s/.test(t)) return { type: 'blockquote', raw: t.replace(/^>\s/, '') }
  return { type: 'p', raw: stripLineMarker(t) }
}

function textToDelta(Delta, rawText) {
  const lines = rawText.split('\n')
  const delta = new Delta()
  let i = 0
  while (i < lines.length) {
    const p = parseLine(lines[i])
    if (p.type === 'empty') {
      if (i > 0 && parseLine(lines[i - 1]).type !== 'empty') delta.insert('\n')
    } else if (p.type === 'hr') {
      delta.insert('─'.repeat(42) + '\n')
    } else if (p.type === 'h1') { insertInline(delta, p.raw); delta.insert('\n', { header: 1 })
    } else if (p.type === 'h2') { insertInline(delta, p.raw); delta.insert('\n', { header: 2 })
    } else if (p.type === 'h3') { insertInline(delta, p.raw); delta.insert('\n', { header: 3 })
    } else if (p.type === 'h4') { insertInline(delta, p.raw); delta.insert('\n', { header: 4 })
    } else if (p.type === 'bullet')    { insertInline(delta, p.raw); delta.insert('\n', { list: 'bullet' })
    } else if (p.type === 'ordered')   { insertInline(delta, p.raw); delta.insert('\n', { list: 'ordered' })
    } else if (p.type === 'blockquote'){ insertInline(delta, p.raw); delta.insert('\n', { blockquote: true })
    } else { insertInline(delta, p.raw); delta.insert('\n') }
    i++
  }
  if (!rawText.endsWith('\n')) delta.insert('\n')
  return delta
}

/* ═══════════════════════════════════════════════════════════════
   MISE EN PAGE AUTOMATIQUE INTELLIGENTE
   Détecte automatiquement la structure du texte brut
═══════════════════════════════════════════════════════════════ */
function smartFormatDelta(Delta, rawText) {
  const lines = rawText.split('\n')
  const delta = new Delta()

  function isAllCaps(t) {
    return t.length >= 3 && t.length <= 90 &&
      // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
      /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ0-9\s\-:\.\/()«»''""]{3,}$/.test(t) &&
      /[A-Z]{2}/.test(t) && !/[a-z]/.test(t)
  }

  function looksLikeTitle(t, prev, next) {
    const prevBlank = !prev || !prev.trim()
    const nextBlank = !next || !next.trim()
    return (
      t.length >= 3 && t.length <= 80 &&
      (prevBlank || nextBlank) &&
      !/[.!?;]$/.test(t) &&
      t.split(/\s+/).length <= 10
    )
  }

  function hasInlineMarkdown(t) {
    return /\*\*/.test(t) || /\*[^*]/.test(t) || /_{1,2}/.test(t) || /`/.test(t)
  }

  function applyInlineBold(t, d) {
    // Handle **bold** inline
    const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
    for (const part of parts) {
      if (/^\*\*(.+)\*\*$/.test(part)) d.insert(part.replace(/\*\*/g, ''), { bold: true })
      else if (/^\*(.+)\*$/.test(part)) d.insert(part.replace(/\*/g, ''), { italic: true })
      else if (part) d.insert(part)
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const tr = line.trim()
    const prev = lines[i - 1] || ''
    const next = lines[i + 1] || ''

    if (!tr) {
      if (i > 0 && lines[i - 1].trim()) delta.insert('\n')
      i++; continue
    }

    // Already has markdown structure → use parseLine
    if (/^#{1,4}\s/.test(tr) || /^[-•*]\s/.test(tr) || /^\d+[.)]\s/.test(tr) || /^>\s/.test(tr) || /^---+$/.test(tr)) {
      const p = parseLine(tr)
      if (p.type === 'h1') delta.insert(p.text).insert('\n', { header: 1 })
      else if (p.type === 'h2') delta.insert(p.text).insert('\n', { header: 2 })
      else if (p.type === 'h3') delta.insert(p.text).insert('\n', { header: 3 })
      else if (p.type === 'h4') delta.insert(p.text).insert('\n', { header: 4 })
      else if (p.type === 'bullet') delta.insert(p.text).insert('\n', { list: 'bullet' })
      else if (p.type === 'ordered') delta.insert(p.text).insert('\n', { list: 'ordered' })
      else if (p.type === 'blockquote') delta.insert(p.text).insert('\n', { blockquote: true })
      else if (p.type === 'hr') delta.insert('─'.repeat(40) + '\n')
      else delta.insert(cleanLine(tr) + '\n')
      i++; continue
    }

    // ALL CAPS → H2 (section)
    if (isAllCaps(tr)) {
      delta.insert(tr).insert('\n', { header: 2 })
      i++; continue
    }

    // Short title-like line after/before blank → H3
    if (looksLikeTitle(tr, prev, next) && tr.length <= 60) {
      // Very short (≤4 words, no trailing punct) after blank → H2
      if (!prev.trim() && tr.split(/\s+/).length <= 5) {
        delta.insert(cleanLine(tr)).insert('\n', { header: 2 })
      } else {
        delta.insert(cleanLine(tr)).insert('\n', { header: 3 })
      }
      i++; continue
    }

    // Line ending with ":" (label/section) → bold paragraph
    if (/:\s*$/.test(tr) && tr.length <= 80 && tr.split(/\s+/).length <= 10) {
      delta.insert(cleanLine(tr), { bold: true }).insert('\n')
      i++; continue
    }

    // Line with inline bold/italic markdown
    if (hasInlineMarkdown(tr)) {
      applyInlineBold(cleanLine(tr), delta)
      delta.insert('\n')
      i++; continue
    }

    // Normal paragraph
    delta.insert(cleanLine(tr) + '\n')
    i++
  }

  delta.insert('\n')
  return delta
}

/* ═══════════════════════════════════════════════════════════════
   CLIPBOARD MATCHERS
═══════════════════════════════════════════════════════════════ */
function setupClipboardMatchers(quill, Delta) {
  quill.clipboard.addMatcher(Node.TEXT_NODE, (node, _d) => {
    const raw = node.data || ''
    if (!raw.trim()) return new Delta()
    if (/^#{1,4}\s/m.test(raw) || /^[-•*]\s/m.test(raw) || /^\d+[.)]\s/m.test(raw)) {
      return textToDelta(Delta, raw)
    }
    const clean = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ')
      .replace(/\u00A0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[^\S\n]{2,}/g, ' ')
    return new Delta().insert(clean)
  })

  quill.clipboard.addMatcher('p, div, section, article, td', (node, delta) => {
    const allowed = ['bold', 'italic', 'underline', 'strike', 'link', 'color', 'background', 'script']
    return delta.reduce((acc, op) => {
      if (op.insert && typeof op.insert === 'string') {
        const attrs = op.attributes
          ? Object.fromEntries(Object.entries(op.attributes).filter(([k]) => allowed.includes(k)))
          : undefined
        return acc.push({ insert: op.insert, ...(attrs && Object.keys(attrs).length ? { attributes: attrs } : {}) })
      }
      return acc.push(op)
    }, new Delta())
  })

  quill.clipboard.addMatcher('h1,h2,h3,h4,h5,h6', (node, delta) => {
    const level = Math.min(4, parseInt(node.tagName.replace(/[Hh]/, ''), 10))
    return delta.compose(new Delta().retain(delta.length(), { header: level }))
  })

  quill.clipboard.addMatcher('span', (node, delta) => {
    if (/mso-|font-family:|font-size:/.test(node.getAttribute('style') || '')) {
      return delta.reduce((acc, op) => {
        if (op.insert && typeof op.insert === 'string') return acc.push({ insert: op.insert })
        return acc.push(op)
      }, new Delta())
    }
    return delta
  })
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT
═══════════════════════════════════════════════════════════════ */
export default function QuillEditorPro({
  initialText = '',
  onSave,
  onCancel,
  onChange,
  placeholder = 'Rédigez ou collez votre texte — mise en page automatique disponible…',
  uiBorder = '#e2e8f0',
  uiMuted = '#64748b',
  autoSaveKey = null,
  showLog = false,
}) {
  const editorDivRef = useRef(null)
  const wrapperRef = useRef(null)
  const quillRef = useRef(null)
  const DeltaRef = useRef(null)
  const autoSaveTimer = useRef(null)

  /* ── State ── */
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [lineHeight, setLineHeight] = useState('1.75')
  const [zoom, setZoom] = useState(100)
  const [autoFormat, setAutoFormat] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findCount, setFindCount] = useState(0)
  const [showOutline, setShowOutline] = useState(false)
  const [outline, setOutline] = useState([])
  const [tableConfig, setTableConfig] = useState({ show: false, rows: 3, cols: 3 })
  const [showWordArt, setShowWordArt] = useState(false)

  /* ── Count ── */
  function updateCount(quill) {
    const text = quill.getText().trim()
    setCharCount(text.length)
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
  }

  /* ── Outline ── */
  function buildOutline(quill) {
    if (!quill) return
    const delta = quill.getContents()
    const items = []
    delta.ops?.forEach(op => {
      if (op.insert && typeof op.insert === 'string' && op.attributes?.header) {
        const text = op.insert.replace('\n', '').trim()
        if (text) items.push({ level: op.attributes.header, text })
      }
    })
    setOutline(items)
  }

  /* ── Size label sync ── */
  function syncSizeLabel(quill) {
    const format = quill.getFormat()
    const sizeEl = quill.container?.parentNode?.querySelector?.('.ql-size .ql-picker-label')
    if (sizeEl) sizeEl.dataset.value = format.size || ''
  }

  /* ── Auto-save ── */
  function triggerAutoSave(quill) {
    if (!autoSaveKey) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({ html: quill.getSemanticHTML(), savedAt: Date.now() }))
        setSaveStatus('✓ Auto-sauvé')
        setTimeout(() => setSaveStatus(''), 1800)
      // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
      } catch {}
    }, 2000)
  }

  /* ══════════════════════════════════════════════════════════════
     INIT QUILL
  ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    injectCSS()
    let mounted = true

    import('quill').then(({ default: Quill }) => {
      if (!mounted || !editorDivRef.current || quillRef.current) return

      const Delta = Quill.import('delta')
      DeltaRef.current = Delta

      /* ── Polices ── */
      const Font = Quill.import('formats/font')
      Font.whitelist = ['times', 'arial', 'georgia', 'calibri', 'courier']
      Quill.register(Font, true)

      /* ── Tailles (style inline) ── */
      const SizeStyle = Quill.import('attributors/style/size')
      SizeStyle.whitelist = ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt']
      Quill.register(SizeStyle, true)

      /* ── Instance ── */
      const quill = new Quill(editorDivRef.current, {
        theme: 'snow',
        modules: {
          toolbar: TOOLBAR_OPTS,
          history: { delay: 800, maxStack: 200, userOnly: true },
        },
        placeholder,
      })
      quillRef.current = quill

      /* ── Clipboard matchers ── */
      setupClipboardMatchers(quill, Delta)

      /* ── Contenu initial ── */
      if (initialText?.trim()) {
        if (initialText.trim().startsWith('<')) quill.root.innerHTML = initialText
        else quill.setContents(textToDelta(Delta, initialText), 'api')
        updateCount(quill)
        buildOutline(quill)
      }

      /* ── Defaults ── */
      quill.root.style.fontFamily = "'Times New Roman', Times, serif"
      quill.root.style.fontSize = '12pt'
      quill.root.style.color = '#111111'
      const len = quill.getLength()
      if (len > 1) quill.setSelection(len - 1, 0)

      /* ── Events ── */
      quill.on('text-change', (delta, _old, source) => {
        updateCount(quill)
        buildOutline(quill)
        triggerAutoSave(quill)
        if (source === 'user') onChange?.(quill.getSemanticHTML())
        // Auto-format on paste
        if (source === 'user' && autoFormat) {
          const rawText = quill.getText()
          if (rawText.trim()) {
            const formatted = smartFormatDelta(Delta, rawText)
            quill.setContents(formatted, 'api')
          }
        }
      })

      quill.on('selection-change', () => syncSizeLabel(quill))
    })

    return () => { mounted = false; clearTimeout(autoSaveTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [])

  /* ══════════════════════════════════════════════════════════════
     ACTIONS
  ══════════════════════════════════════════════════════════════ */

  /* ── Nettoyer (strip markdown) ── */
  const cleanContent = useCallback(() => {
    const quill = quillRef.current; const Delta = DeltaRef.current
    if (!quill || !Delta) return
    const raw = quill.getText()
    if (!raw.trim()) return
    quill.setContents(textToDelta(Delta, raw), 'api')
  }, [])

  /* ── Mise en page automatique ── */
  const smartFormat = useCallback(() => {
    const quill = quillRef.current; const Delta = DeltaRef.current
    if (!quill || !Delta) return
    const raw = quill.getText()
    if (!raw.trim()) return
    quill.setContents(smartFormatDelta(Delta, raw), 'api')
    buildOutline(quill)
  }, [])

  /* ── Sauvegarder ── */
  const handleSave = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const html = quill.getSemanticHTML()
    setSaveStatus('✅ Sauvegardé')
    setTimeout(() => setSaveStatus(''), 2500)
    onSave?.(html, quill.getContents())
  }, [onSave])

  /* ── Copier ── */
  const copyText = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    navigator.clipboard.writeText(quill.getText()).catch(() => {})
  }, [])

  /* ── Imprimer ── */
  const handlePrint = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Impression</title>
    <style>body{font-family:'Times New Roman',serif;font-size:12pt;color:#111;margin:2.5cm;line-height:${lineHeight}}
    h1{font-size:18pt;border-bottom:1px solid #ccc;padding-bottom:6px}h2{font-size:14pt}h3{font-size:12pt;font-style:italic}
    ul,ol{padding-left:24px}li{margin-bottom:4px}blockquote{border-left:3px solid #9ca3af;padding:8px 20px;color:#555;font-style:italic}
    table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:8px 12px}th{background:#f9fafb;font-weight:700}
    @media print{@page{size:A4;margin:2.5cm}}</style></head><body>${quill.getSemanticHTML()}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print(); win.close() }, 400)
  }, [lineHeight])

  /* ── Export Word ── */
  const handleWordExport = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const html = quill.getSemanticHTML()
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
body{font-family:'Times New Roman',serif;font-size:12pt;margin:2.5cm;color:#111;line-height:${lineHeight}}
h1{font-size:18pt;border-bottom:1pt solid #ccc;padding-bottom:6pt}h2{font-size:14pt}h3{font-size:12pt;font-style:italic}
p{margin:0 0 10pt}ul,ol{padding-left:24pt}li{margin-bottom:4pt}
blockquote{border-left:3pt solid #9ca3af;padding:6pt 18pt;color:#555;font-style:italic}
table{border-collapse:collapse;width:100%}td,th{border:1pt solid #d1d5db;padding:8pt 12pt}th{background:#f9fafb;font-weight:700}
</style></head><body>${html}</body></html>`
    const blob = new Blob(['\ufeff', doc], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'document-abawi.doc'; a.click()
  }, [lineHeight])

  /* ── Insérer tableau ── */
  const insertTable = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const { rows, cols } = tableConfig
    const thead = `<tr>${Array.from({ length: cols }, (_, i) => `<th style="border:1px solid #d1d5db;padding:8px 12px;background:#f9fafb;font-weight:700">Colonne ${i+1}</th>`).join('')}</tr>`
    const tbody = Array.from({ length: rows - 1 }, () =>
      `<tr>${Array.from({ length: cols }, () => '<td style="border:1px solid #d1d5db;padding:8px 12px"> </td>').join('')}</tr>`).join('')
    const table = `<br/><table style="border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:12pt"><thead>${thead}</thead><tbody>${tbody}</tbody></table><br/>`
    const range = quill.getSelection(true)
    quill.clipboard.dangerouslyPasteHTML(range?.index || 0, table)
    setTableConfig(c => ({ ...c, show: false }))
  }, [tableConfig])

  /* ── Insérer image ── */
  const insertImage = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = e => {
        const range = quill.getSelection(true)
        quill.insertEmbed(range?.index || 0, 'image', e.target.result)
        quill.setSelection((range?.index || 0) + 1)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [])

  /* ── Insérer ligne horizontale ── */
  const insertHR = useCallback(() => {
    const quill = quillRef.current
    if (!quill) return
    const range = quill.getSelection(true)
    quill.insertText(range?.index || 0, '─'.repeat(50) + '\n')
  }, [])

  /* ── Interligne ── */
  const applyLineHeight = useCallback((lh) => {
    setLineHeight(lh)
    const quill = quillRef.current
    if (quill) quill.root.style.lineHeight = lh
  }, [])

  /* ── Zoom ── */
  const applyZoom = useCallback((z) => {
    setZoom(z)
    const el = editorDivRef.current?.querySelector?.('.ql-editor')
    if (el) el.style.transform = `scale(${z / 100})`
  }, [])

  /* ── Plein écran ── */
  const toggleFullscreen = useCallback(() => {
    setFullscreen(f => {
      const wrapper = wrapperRef.current
      if (!wrapper) return !f
      if (!f) wrapper.classList.add('qep-fullscreen')
      else wrapper.classList.remove('qep-fullscreen')
      return !f
    })
  }, [])

  /* ── Rechercher ── */
  const handleFind = useCallback(() => {
    const quill = quillRef.current
    if (!quill || !findText) return
    const text = quill.getText()
    let count = 0; let idx = 0
    while ((idx = text.indexOf(findText, idx)) !== -1) { count++; idx++ }
    setFindCount(count)
    if (count > 0) {
      const first = text.indexOf(findText)
      quill.setSelection(first, findText.length)
      quill.scrollIntoView()
    }
  }, [findText])

  /* ── Remplacer tout ── */
  const handleReplaceAll = useCallback(() => {
    const quill = quillRef.current
    if (!quill || !findText) return
    const text = quill.getText()
    let idx = 0; let replaced = 0
    while ((idx = text.indexOf(findText, idx)) !== -1) {
      quill.deleteText(idx, findText.length)
      quill.insertText(idx, replaceText)
      idx += replaceText.length
      replaced++
    }
    setFindCount(0)
    setSaveStatus(`${replaced} remplacement(s)`)
    setTimeout(() => setSaveStatus(''), 3000)
  }, [findText, replaceText])

  /* ── Undo / Redo ── */
  const undo = useCallback(() => { quillRef.current?.history?.undo() }, [])
  const redo = useCallback(() => { quillRef.current?.history?.redo() }, [])

  /* ── WordArt / Styles décoratifs ── */
  const WORDART_STYLES = [
    { label: '🌅 Dégradé Or', html: '<div style="font-size:28pt;font-weight:900;background:linear-gradient(90deg,#F0B429,#f59e0b,#d97706);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:Georgia,serif;text-align:center;margin:16px 0;letter-spacing:-0.5px">Votre titre ici</div>' },
    { label: '🔷 Dégradé Bleu', html: '<div style="font-size:28pt;font-weight:900;background:linear-gradient(90deg,#1e40af,#3b82f6,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:Arial,sans-serif;text-align:center;margin:16px 0">Votre titre ici</div>' },
    { label: '🟢 Dégradé Vert', html: '<div style="font-size:26pt;font-weight:900;background:linear-gradient(90deg,#166534,#22c55e,#86efac);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:Arial,sans-serif;text-align:center;margin:16px 0">Votre titre ici</div>' },
    { label: '🌙 Néon sombre', html: '<div style="font-size:26pt;font-weight:900;color:#ffffff;text-shadow:0 0 10px #38bdf8,0 0 30px #38bdf8,0 0 60px #38bdf8;font-family:Arial,sans-serif;text-align:center;margin:16px 0;background:#0f172a;padding:12px;border-radius:8px">Votre titre ici</div>' },
    { label: '🔥 Flamme', html: '<div style="font-size:28pt;font-weight:900;background:linear-gradient(180deg,#fde68a 0%,#f59e0b 30%,#ef4444 70%,#991b1b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:Georgia,serif;text-align:center;margin:16px 0">Votre titre ici</div>' },
    { label: '💎 Relief 3D', html: '<div style="font-size:28pt;font-weight:900;color:#1e40af;text-shadow:2px 2px 0 #93c5fd,4px 4px 0 #bfdbfe,6px 6px 8px rgba(0,0,0,0.2);font-family:Arial,sans-serif;text-align:center;margin:16px 0">Votre titre ici</div>' },
    { label: '✍️ Signature', html: '<div style="font-size:32pt;font-weight:400;color:#1e293b;font-family:Georgia,serif;font-style:italic;text-align:center;margin:16px 0;border-bottom:2px solid #e2e8f0;padding-bottom:8px">Votre titre ici</div>' },
    { label: '📌 Titre encadré', html: '<div style="font-size:20pt;font-weight:900;color:#0f172a;font-family:Arial,sans-serif;text-align:center;margin:16px 0;padding:16px 24px;border:3px solid #F0B429;border-radius:8px;background:linear-gradient(135deg,#fffbeb,#fef3c7)">Votre titre ici</div>' },
    { label: '🔤 Titre Display XL', html: '<div style="font-size:36pt;font-weight:900;color:#111;font-family:Georgia,serif;text-align:left;margin:24px 0 8px;letter-spacing:-1px;line-height:1.1">Votre titre ici</div>' },
    { label: '🔡 Sous-titre élégant', html: '<div style="font-size:14pt;font-weight:400;color:#64748b;font-family:Georgia,serif;font-style:italic;text-align:left;margin:0 0 20px;letter-spacing:0.5px">Sous-titre ou accroche ici</div>' },
    { label: '📝 Chapô intro', html: '<div style="font-size:13pt;font-weight:600;color:#374151;font-family:Georgia,serif;line-height:1.6;margin:0 0 20px;padding:16px 20px;border-left:4px solid #F0B429;background:#fffbeb">Texte d\'introduction accrocheur ici — résumé de l\'essentiel en quelques phrases.</div>' },
    { label: '💬 Citation pro', html: '<blockquote style="font-size:14pt;font-style:italic;color:#374151;font-family:Georgia,serif;line-height:1.7;margin:20px 0;padding:20px 28px;border-left:4px solid #3b82f6;background:#eff6ff;border-radius:0 8px 8px 0">"Votre citation inspirante ici."<cite style="display:block;font-size:10pt;color:#64748b;margin-top:8px;font-style:normal;font-weight:600">— Auteur</cite></blockquote>' },
  ]

  const insertWordArt = useCallback((html) => {
    const quill = quillRef.current
    if (!quill) return
    const range = quill.getSelection(true)
    quill.clipboard.dangerouslyPasteHTML(range?.index || 0, html)
    setShowWordArt(false)
  }, [])

  /* ══════════════════════════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════════════════════════ */
  return (
    <div ref={wrapperRef} style={{ border: '1px solid #d1d5db', borderRadius: 10, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ══ BARRE SUPÉRIEURE — Outils avancés ══ */}
      <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ fontSize: '0.66rem', fontWeight: 900, color: '#F0B429', letterSpacing: 1.5, textTransform: 'uppercase', marginRight: 4 }}>ABAWI</span>

        {/* Undo / Redo */}
        <ToolBtn onClick={undo} title="Annuler (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={redo} title="Rétablir (Ctrl+Y)">↪</ToolBtn>
        <Sep />

        {/* Mise en page auto */}
        <button onClick={smartFormat} title="Mise en page automatique — détecte titres, listes, sections" style={{
          padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700,
          background: 'linear-gradient(90deg,#F0B429,#e5a820)', color: '#0a0a0a', border: 'none',
        }}>✨ Mise en page auto</button>

        {/* Auto-format toggle */}
        <label title="Applique la mise en page auto à chaque modification" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.72rem', color: autoFormat ? '#F0B429' : '#94a3b8', fontWeight: 600 }}>
          <input type="checkbox" checked={autoFormat} onChange={e => setAutoFormat(e.target.checked)} style={{ accentColor: '#F0B429', width: 13, height: 13 }} />
          Auto
        </label>
        <Sep />

        {/* Nettoyer */}
        <ToolBtn onClick={cleanContent} title="Supprimer ## * _ et reformater proprement" color="#7c3aed">🧹 Nettoyer</ToolBtn>
        <Sep />

        {/* Interligne */}
        <select value={lineHeight} onChange={e => applyLineHeight(e.target.value)} title="Interligne" style={selStyle}>
          <option value="1.2">× 1.2</option>
          <option value="1.4">× 1.4</option>
          <option value="1.6">× 1.6</option>
          <option value="1.75">× 1.75</option>
          <option value="2">× 2.0</option>
          <option value="2.5">× 2.5</option>
        </select>
        <Sep />

        {/* Tableau */}
        <ToolBtn onClick={() => setTableConfig(c => ({ ...c, show: !c.show }))} title="Insérer un tableau">⊞ Tableau</ToolBtn>
        {tableConfig.show && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="number" min={1} max={10} value={tableConfig.rows} onChange={e => setTableConfig(c => ({ ...c, rows: +e.target.value }))}
              style={{ width: 40, ...miniInput }} placeholder="Lig" title="Lignes" />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>×</span>
            <input type="number" min={1} max={10} value={tableConfig.cols} onChange={e => setTableConfig(c => ({ ...c, cols: +e.target.value }))}
              style={{ width: 40, ...miniInput }} placeholder="Col" title="Colonnes" />
            <ToolBtn onClick={insertTable} color="#18A84A">OK</ToolBtn>
          </div>
        )}

        {/* Image */}
        <ToolBtn onClick={insertImage} title="Insérer une image">🖼️</ToolBtn>

        {/* Ligne horizontale */}
        <ToolBtn onClick={insertHR} title="Insérer une ligne de séparation">──</ToolBtn>

        {/* WordArt */}
        <ToolBtn onClick={() => setShowWordArt(f => !f)} title="Styles décoratifs & WordArt" active={showWordArt} color="#9333ea">🎨 WordArt</ToolBtn>
        <Sep />

        {/* Recherche */}
        <ToolBtn onClick={() => setShowFind(f => !f)} title="Rechercher / Remplacer" active={showFind}>🔍</ToolBtn>

        {/* Plan du document */}
        <ToolBtn onClick={() => { setShowOutline(f => !f); buildOutline(quillRef.current) }} title="Plan du document" active={showOutline}>📋</ToolBtn>

        {/* Zoom */}
        <select value={zoom} onChange={e => applyZoom(+e.target.value)} title="Zoom" style={{ ...selStyle, width: 62 }}>
          {[70, 80, 90, 100, 110, 125, 150].map(z => <option key={z} value={z}>{z}%</option>)}
        </select>

        {/* Imprimer */}
        <ToolBtn onClick={handlePrint} title="Imprimer">🖨️</ToolBtn>

        {/* Word */}
        <ToolBtn onClick={handleWordExport} title="Exporter Word (.doc)" color="#1E40AF">📝 Word</ToolBtn>

        {/* Plein écran */}
        <button onClick={toggleFullscreen} title={fullscreen ? 'Quitter plein écran' : 'Plein écran'} style={{ ...toolBtnStyle, marginLeft: 'auto' }}>
          {fullscreen ? '⊡' : '⛶'}
        </button>
      </div>

      {/* ══ Barre rechercher / remplacer ══ */}
      {showFind && (
        <div style={{ background: '#fff8ed', borderBottom: '1px solid #fcd34d', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <input value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFind()}
            placeholder="Rechercher…" style={{ ...miniInput, width: 160 }} />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
            placeholder="Remplacer par…" style={{ ...miniInput, width: 160 }} />
          <ToolBtn onClick={handleFind} color="#1e40af">Chercher</ToolBtn>
          <ToolBtn onClick={handleReplaceAll} color="#dc2626">Remplacer tout</ToolBtn>
          {findCount > 0 && <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>{findCount} occurrence(s)</span>}
          <button onClick={() => setShowFind(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8' }}>✕</button>
        </div>
      )}

      {/* ══ Panneau WordArt / Styles décoratifs ══ */}
      {showWordArt && (
        <div style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Styles décoratifs — cliquez pour insérer</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {WORDART_STYLES.map((ws, i) => (
              <button key={i} onClick={() => insertWordArt(ws.html)} style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid #e9d5ff',
                background: '#fff', color: '#374151', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#9333ea'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#9333ea' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e9d5ff' }}
              >{ws.label}</button>
            ))}
          </div>
          <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: '8px 0 0' }}>Double-cliquez le texte inséré pour le modifier.</p>
        </div>
      )}

      {/* ══ Plan du document ══ */}
      {showOutline && outline.length > 0 && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>Plan :</span>
          {outline.map((item, i) => (
            <button key={i} onClick={() => {
              const quill = quillRef.current
              if (!quill) return
              const text = quill.getText()
              const idx = text.indexOf(item.text)
              if (idx >= 0) { quill.setSelection(idx, item.text.length); quill.scrollIntoView() }
            }} style={{
              padding: '2px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff',
              cursor: 'pointer', fontSize: `${0.72 + (4 - item.level) * 0.04}rem`,
              fontWeight: item.level === 1 ? 800 : item.level === 2 ? 700 : 600,
              color: item.level === 1 ? '#0f172a' : item.level === 2 ? '#1e40af' : '#475569',
              paddingLeft: `${(item.level - 1) * 8 + 8}px`,
            }}>
              {item.level === 1 ? '■' : item.level === 2 ? '▸' : '·'} {item.text}
            </button>
          ))}
        </div>
      )}

      {/* ══ Zone Quill — Fond gris A4 ══ */}
      <div className="qep-page-wrap">
        <div ref={editorDivRef} />
      </div>

      {/* ══ Barre de statut ══ */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <button onClick={handleSave} style={btnFilled('#18A84A')}>✅ Sauvegarder</button>
        {onCancel && <button onClick={onCancel} style={btnOutline(uiBorder, uiMuted)}>✕ Fermer</button>}
        <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px' }} />
        <button onClick={copyText} style={btnOutline('#e5e7eb', '#374151')}>📋 Copier</button>
        <button onClick={() => { quillRef.current?.enable(false) }} style={btnOutline('#e5e7eb', '#374151')}>🔒 Lire</button>
        <button onClick={() => { quillRef.current?.enable(true); quillRef.current?.focus() }} style={btnOutline('#e5e7eb', '#374151')}>✏️ Éditer</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          {saveStatus && <span style={{ fontSize: '0.72rem', color: saveStatus.startsWith('✅') ? '#22c55e' : '#64748b', fontWeight: 700 }}>{saveStatus}</span>}
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}><b>{wordCount}</b> mots · <b>{charCount}</b> car.</span>
          <span style={{ fontSize: '0.67rem', color: '#cbd5e1', fontStyle: 'italic' }}>Times NR · Ctrl+Z/Y</span>
        </div>
      </div>
    </div>
  )
}

/* ── Petits composants UI ── */
function ToolBtn({ onClick, children, title, active, color }) {
  return (
    <button onClick={onClick} title={title} style={{ ...toolBtnStyle, color: active ? '#1e40af' : color || '#475569', borderColor: active ? '#bfdbfe' : '#e2e8f0', background: active ? '#eff6ff' : 'transparent' }}>
      {children}
    </button>
  )
}
function Sep() {
  return <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />
}
const toolBtnStyle = {
  padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600,
  background: 'transparent', color: '#475569', border: '1px solid #e2e8f0', whiteSpace: 'nowrap',
}
const selStyle = {
  padding: '3px 6px', borderRadius: 6, border: '1px solid #e2e8f0',
  background: '#fff', color: '#374151', fontSize: '0.73rem', cursor: 'pointer',
}
const miniInput = {
  padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0',
  background: '#fff', color: '#374151', fontSize: '0.78rem',
}
function btnFilled(bg) {
  return { padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, background: bg, color: '#fff', whiteSpace: 'nowrap' }
}
function btnOutline(border, color) {
  return { padding: '7px 13px', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: 'transparent', color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }
}

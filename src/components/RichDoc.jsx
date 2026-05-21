import { useState, useMemo } from 'react'
import { exportToPDF } from '../lib/generatePDF'
import { cleanIAText } from '../lib/textCleaner'
import { Link } from 'react-router-dom'
import ProfessionalLayout from './ProfessionalLayout'

/* ── Export Word (.doc via HTML blob) ── */
function exportToWord(text, slug, title) {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  // Convert basic markdown to HTML for Word
  const body = text
    .replace(/^## (.+)$/gm, '<h2 style="color:#b8860b;border-bottom:1px solid #e2e8f0;padding-bottom:6px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:#1e40af">$1</h3>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#0f172a">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b;margin:2.5cm}h1{font-size:16pt}h2{font-size:13pt}h3{font-size:11pt}p{line-height:1.6;margin:6pt 0}li{margin:3pt 0}.header{border-bottom:2pt solid #F0B429;padding-bottom:8pt;margin-bottom:16pt}.footer{border-top:1pt solid #e2e8f0;margin-top:24pt;padding-top:8pt;font-size:8pt;color:#64748b}</style></head><body><div class="header"><div style="font-size:8pt;color:#64748b;text-transform:uppercase;letter-spacing:2px">ABAWI Portal · Document généré</div><h1 style="margin:4pt 0">${title}</h1><div style="font-size:9pt;color:#64748b">${today} · CONFIDENTIEL</div></div><p>${body}</p><div class="footer">© ABAWI Portal — Document confidentiel</div></body></html>`
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${slug || 'document'}.doc`; a.click()
}

const CHARS_PER_A4 = 2800

/* ─────────────────────────────────────────────────────────────────────────────
 * RichDoc — Rendu A4 de documents générés par IA
 * Props:
 *   text       {string}  Texte généré (markdown ou texte brut)
 *   editable   {bool}    Affiche le bouton "Modifier"
 *   onEdit     {fn}      Callback (newText)
 *   exportId   {string}  ID du div cible pour PDF
 *   exportSlug {string}  Nom du fichier exporté
 *   dark       {bool}    UI sombre (pour outils Elite)
 *   docTitle   {string}  Titre affiché dans l'en-tête du document
 * ───────────────────────────────────────────────────────────────────────────── */

/* ──/* Pré-traitement avec logique CABINET D'ÉLITE */
function preprocessText(raw) {
  if (!raw) return ''

  // HTML depuis Quill -> retourner tel quel
  if (raw.trim().startsWith('<')) return raw

  // Utiliser la nouvelle logique cleanIAText (style cabinet d'élite)
  return cleanIAText(raw)
}

/* Fonctions d'analyse contextuelle partagées */
function analyzeTextContext(text) {
  const lines = text.split('\n')
  const analysis = {
    hasMarkdownHeadings: /^#{1,3}\s/m.test(text),
    hasLists: /^[-*•]\s/m.test(text),
    hasBoldFormatting: /\*\*.*?\*/.test(text),
    averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
    lineCount: lines.length,
    hasFrenchWords: /[àâäéèêëïîôùûüçœæ]/.test(text),
    hasFinancialTerms: /FCFA|XOF|DOLLAR|EURO|BUDGET|FINANCIER|COMPTABLE/.test(text),
    problematicPatterns: []
  }
  
  // Détecter les patterns problématiques
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return
    
    // Coupures de mots évidentes
    if (/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ]{1,3}$/.test(trimmed)) {
      analysis.problematicPatterns.push({ type: 'fragment', line: i, content: trimmed })
    }
    // Caractères parasites isolés
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    if (/^[#*\-\/]{1,2}$/.test(trimmed)) {
      analysis.problematicPatterns.push({ type: 'symbols', line: i, content: trimmed })
    }
    // Mots coupés au milieu
    if (/[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ][a-zàâäéèêëïîôùûüçœæ]{2,}$/.test(trimmed) && trimmed.length < 12) {
      analysis.problematicPatterns.push({ type: 'partial_word', line: i, content: trimmed })
    }
  })
  
  return analysis
}

function conservativeMarkdownCleaning(text) {
  return text
    // Nettoyer seulement les parasites évidents
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    .replace(/^[#*\-\/]{1,2}\s*$/gm, '')
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    .replace(/\s[#*\-\/]{1,2}\s/g, ' ')
    // Séparer les titres markdown existants
    .replace(/^(#{1,3}\s.+)$/gm, '$1\n\n')
    .replace(/([^\n])(#{1,3}\s)/g, '$1\n\n$2')
    // Ponctuation correcte
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
}

function reconstructFromFragments(text, analysis) {
  const lines = text.split('\n')
  const reconstructed = []
  let currentParagraph = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const problem = analysis.problematicPatterns.find(p => p.line === i)
    
    if (problem && (problem.type === 'fragment' || problem.type === 'partial_word')) {
      // Essayer de joindre avec la ligne suivante
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if (nextLine && !analysis.problematicPatterns.find(p => p.line === i + 1)) {
          currentParagraph += line + nextLine
          i++ // Sauter la ligne suivante
          continue
        }
      }
    }
    
    // Vérifier si c'est un vrai titre
    if (isRealTitle(line, analysis)) {
      if (currentParagraph) {
        reconstructed.push(currentParagraph.trim())
        currentParagraph = ''
      }
      reconstructed.push(`## ${line}`)
    } else if (line) {
      currentParagraph += (currentParagraph ? ' ' : '') + line
    }
  }
  
  if (currentParagraph) {
    reconstructed.push(currentParagraph.trim())
  }
  
  return reconstructed.join('\n\n')
}

function isRealTitle(line, analysis) {
  if (!line || line.length < 10) return false
  
  const hasTitleWords = /ANALYSE|STRUCTURE|FINANCIÈRE|RECOMMANDATIONS|STRATÉGIQUES|CONCLUSION|RÉSULTATS|ENTREPRISE|RAPPORT|SYNTHÈSE|ÉVALUATION|BILAN|COMPTE|RÉSULTAT/.test(line)
  const wordCount = (line.match(/\s+/g) || []).length + 1
  const isAllCaps = line === line.toUpperCase() && line.length > 20
  
  return (hasTitleWords && wordCount >= 2) || (isAllCaps && wordCount >= 3)
}

function safeStandardCleaning(text, analysis) {
  return text
    // Nettoyer les parasites
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    .replace(/^[#*\-\/]{1,3}\s*$/gm, '')
    // eslint-disable-next-line no-useless-escape -- Backslash kept for readability/safety
    .replace(/\s[#*\-\/]{1,3}\s/g, ' ')
    // Conversion très conservatrice des titres
    .replace(/^([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ\s]{12,80})$/gm, (match) => {
      if (isRealTitle(match, analysis)) {
        return `## ${match}`
      }
      return match
    })
    // Séparation des paragraphes après ponctuation
    .replace(/([.!?])\s*([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ])/g, '$1\n\n$2')
    // Nettoyage final
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
}

function intelligentBoldFormatting(text) {
  return text
    // Convertir les mots en MAJUSCULES pertinents en gras
    .replace(/\b([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ]{4,})\b/g, (match) => {
      const commonWords = ['PLUS', 'TOUT', 'COURS', 'BIEN', 'ELLE', 'ELLES', 'ILS', 'NOTRE', 'VOTRE', 'LEUR', 'LEURS', 'CETTE', 'CES']
      if (!commonWords.includes(match) && !match.includes('PAGE') && !match.includes('RAPPORT') && !match.includes('GARDE')) {
        return `**${match}**`
      }
      return match
    })
    // Nettoyer les gras excessifs
    .replace(/\*\*(.*?)\*\*/g, (match, content) => {
      if (content.length < 4 && !content.includes(' ')) {
        return content
      }
      return match
    })
}

/* ── Inline markdown (gras, italique, code) ── */
function inline(str, codeBg) {
  return str
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, `<code style="background:${codeBg};padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">${'$1'}</code>`)
}

/* ── Rendu des lignes markdown ── */
function renderLines(lines, colors) {
  const { textCol, mutedCol, borderC, h1Col, h2Col, h3Col, h4Col, hlBg, hlBorder, codeBg } = colors
  const out = []
  let i = 0
  let inList = false

  function closeList() {
    if (inList) { out.push(<div key={`le-${i}`} style={{ marginBottom: 6 }} />); inList = false }
  }

  while (i < lines.length) {
    const l = lines[i]
    const tr = l.trim()

    /* ── Titre en MAJUSCULES ── */
    if (tr === tr.toUpperCase() && tr.length > 3 && tr.length < 100 && !tr.includes('.')) {
      closeList()
      out.push(
        <div key={i} style={{ margin: '24px 0 14px', fontSize: '16pt', fontWeight: 800, color: h1Col, fontFamily: "'Times New Roman', serif", letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {tr}
        </div>
      )
    } else if (tr.length < 60 && !tr.includes('.') && tr.length > 5 && i + 1 < lines.length && lines[i + 1].trim().length > tr.length) {
      /* ── Sous-titre détecté (ligne courte sans point suivie de texte long) ── */
      closeList()
      out.push(
        <div key={i} style={{ margin: '18px 0 10px', fontSize: '13pt', fontWeight: 700, color: h2Col, fontFamily: "'Times New Roman', serif" }}>
          {tr}
        </div>
      )
    } else if (/^[-•]\s+([A-Z][^a-z]{3,})$/.test(tr)) {
      // Bullet point that looks like a title
      closeList()
      const titleText = tr.replace(/^[-•]\s+/, '')
      out.push(
        <div key={i} style={{ margin: '24px 0 14px', fontSize: '14pt', fontWeight: 700, color: h2Col, fontFamily: "'Times New Roman', serif" }}>
          {titleText}
        </div>
      )
    } else if (/^#\s/.test(tr)) {
      closeList()
      out.push(<div key={i} dangerouslySetInnerHTML={{ __html: inline(tr.replace(/^#\s/, ''), codeBg) }} style={{ margin: '24px 0 10px', fontSize: '16pt', fontWeight: 700, color: h1Col, fontFamily: "'Times New Roman', serif", borderBottom: `1px solid ${borderC}`, paddingBottom: 6 }} />)
    } else if (/^#{2}\s/.test(tr)) {
      closeList()
      out.push(<div key={i} dangerouslySetInnerHTML={{ __html: inline(tr.replace(/^##\s/, ''), codeBg) }} style={{ margin: '18px 0 8px', fontSize: '14pt', fontWeight: 700, color: h2Col, fontFamily: "'Times New Roman', serif" }} />)
    } else if (/^#{3}\s/.test(tr)) {
      closeList()
      out.push(<div key={i} dangerouslySetInnerHTML={{ __html: inline(tr.replace(/^###\s/, ''), codeBg) }} style={{ margin: '14px 0 6px', fontSize: '12pt', fontWeight: 700, color: h3Col, fontStyle: 'italic', fontFamily: "'Times New Roman', serif" }} />)
    } else if (/^#{4}\s/.test(tr)) {
      closeList()
      out.push(<div key={i} dangerouslySetInnerHTML={{ __html: inline(tr.replace(/^####\s/, ''), codeBg) }} style={{ margin: '10px 0 4px', fontSize: '12pt', fontWeight: 700, color: h4Col, fontFamily: "'Times New Roman', serif" }} />)
    } else if (/^---+$/.test(tr) || /^===+$/.test(tr)) {
      closeList()
      out.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${borderC}`, margin: '20px 0' }} />)
    } else if (/^>>/.test(tr)) {
      closeList()
      const c = tr.replace(/^>>\s?/, '')
      out.push(
        <div key={i} style={{ margin: '10px 0 10px 20px', padding: '10px 16px', background: hlBg, borderLeft: `3px solid #555`, borderRadius: '0 4px 4px 0' }}>
          <span dangerouslySetInnerHTML={{ __html: inline(c, codeBg) }} style={{ fontSize: '12pt', fontFamily: "'Times New Roman', serif", color: textCol, fontWeight: 600, lineHeight: 1.6 }} />
        </div>
      )
    } else if (/^>\s/.test(tr)) {
      closeList()
      const c = tr.replace(/^>\s/, '')
      out.push(
        <blockquote key={i} style={{ margin: '10px 0 10px 20px', padding: '8px 16px', borderLeft: `3px solid ${mutedCol}` }}>
          <span dangerouslySetInnerHTML={{ __html: inline(c, codeBg) }} style={{ fontSize: '12pt', fontFamily: "'Times New Roman', serif", color: mutedCol, lineHeight: 1.6, fontStyle: 'italic' }} />
        </blockquote>
      )
    } else if (/^\|/.test(tr)) {
      closeList()
      const cells = tr.split('|').filter(c => c.trim() && !/^[-:]+$/.test(c.trim()))
      const isHdr = i + 1 < lines.length && /^\|[-:|]+/.test(lines[i + 1]?.trim())
      out.push(
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length},1fr)`, gap: 1, background: borderC, borderRadius: isHdr ? '8px 8px 0 0' : undefined, marginBottom: 1 }}>
          {cells.map((c, j) => (
            <div key={j} style={{ padding: '8px 12px', background: isHdr ? '#f1f5f9' : '#fff', fontSize: '0.83rem', color: isHdr ? '#0f172a' : textCol, fontWeight: isHdr ? 700 : 400 }} dangerouslySetInnerHTML={{ __html: inline(c.trim(), codeBg) }} />
          ))}
        </div>
      )
      if (isHdr) i++
    } else if (/^[-•*]\s/.test(tr)) {
      if (!inList) inList = true
      const c = tr.replace(/^[-•*]\s/, '')
      out.push(
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '3px 0', paddingLeft: 20 }}>
          <span style={{ flexShrink: 0, marginTop: 8, fontSize: '0.7rem', color: textCol }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: inline(c, codeBg) }} style={{ fontSize: '12pt', fontFamily: "'Times New Roman', serif", color: textCol, lineHeight: 1.6 }} />
        </div>
      )
    } else if (/^(\d+)[.)]\s+(.+)$/.test(tr)) {
      /* ── Carte numérotée professionnelle ── */
      closeList()
      const cards = []
      while (i < lines.length && /^(\d+)[.)]\s+(.+)$/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^(\d+)[.)]\s+(.+)$/)
        const num = match[1]
        let content = match[2]
        i++
        
        // Parse title and description from clean format (no ** markers)
        let title, description
        
        // Look for em-dash separator: "1. Title — Description"
        if (content.includes(' — ')) {
          const parts = content.split(' — ')
          title = parts[0]
          description = parts.slice(1).join(' — ')
        } else if (content.includes(' - ')) {
          const parts = content.split(' - ')
          title = parts[0]
          description = parts.slice(1).join(' - ')
        } else if (content.includes(': ')) {
          const parts = content.split(': ')
          title = parts[0]
          description = parts.slice(1).join(': ')
        } else if (content.includes('. ') && content.length > 40) {
          // First sentence is title, rest is description
          const parts = content.split('. ')
          title = parts[0]
          description = parts.slice(1).join('. ')
        } else {
          title = content
          description = ''
        }
        
        // Check if next line is a continuation (no ** check needed)
        if (!description && i < lines.length && !lines[i].trim().match(/^\d+[.)]\s/)) {
          description = lines[i].trim()
          i++
        }
        
        cards.push({ number: num, title, description })
      }
      
      if (cards.length > 0) {
        out.push(
          <div key={`cards-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '20px 0' }}>
            {cards.map((card, idx) => (
              <div key={idx} style={{
                display: 'flex',
                background: '#fff',
                border: `1px solid ${borderC}`,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {/* Numéro sur fond accent */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 56,
                  background: h1Col,
                  color: '#fff',
                  fontSize: '18pt',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {card.number}
                </div>
                {/* Contenu */}
                <div style={{ padding: '14px 18px', flex: 1 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12pt',
                    fontWeight: 700,
                    color: h1Col,
                    marginBottom: 6,
                    lineHeight: 1.3
                  }}>
                    {card.title}
                  </div>
                  {card.description && (
                    <div style={{
                      fontFamily: "'Times New Roman', serif",
                      fontSize: '11pt',
                      lineHeight: 1.6,
                      color: textCol
                    }}>
                      {card.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      continue
    } else if (!tr) {
      closeList()
      out.push(<div key={i} style={{ height: 12 }} />)
    } else {
      closeList()
      out.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: inline(tr, codeBg) }} style={{ margin: '0 0 13px', fontSize: '12pt', fontFamily: "'Times New Roman', serif", color: textCol, lineHeight: 1.75, textAlign: 'justify' }} />
      )
    }
    i++
  }
  closeList()
  return out
}

/* ── Print CSS injecté une seule fois ── */
const QUILL_DOC_STYLE = `
.quill-doc-view { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; line-height: 1.6; }
.quill-doc-view p { margin: 2px 0; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111; line-height: 1.6; }
.quill-doc-view h1 { font-size: 16pt; font-weight: 700; margin: 20px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; font-family: 'Times New Roman', Times, serif; color: #111; }
.quill-doc-view h2 { font-size: 14pt; font-weight: 700; margin: 16px 0 6px; font-family: 'Times New Roman', Times, serif; color: #111; }
.quill-doc-view h3 { font-size: 12pt; font-weight: 700; font-style: italic; margin: 12px 0 4px; font-family: 'Times New Roman', Times, serif; color: #111; }
.quill-doc-view h4 { font-size: 12pt; font-weight: 700; margin: 10px 0 4px; font-family: 'Times New Roman', Times, serif; color: #333; }
.quill-doc-view ul, .quill-doc-view ol { padding-left: 24px; margin: 4px 0; }
.quill-doc-view li { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 2px 0; }
.quill-doc-view blockquote { border-left: 3px solid #9ca3af; padding: 6px 16px; margin: 10px 0 10px 20px; color: #555; font-style: italic; }
.quill-doc-view strong { font-weight: 700; }
.quill-doc-view em { font-style: italic; }
.quill-doc-view code { font-family: 'Courier New', monospace; font-size: 10pt; background: #f3f4f6; border-radius: 3px; padding: 1px 5px; }
.quill-doc-view a { color: #1e40af; text-decoration: underline; }
`

let quillDocStyleInjected = false
function injectQuillDocStyle() {
  if (quillDocStyleInjected) return
  const s = document.createElement('style')
  s.textContent = QUILL_DOC_STYLE
  document.head.appendChild(s)
  quillDocStyleInjected = true
}

const PRINT_STYLE = `
@media print {
  body > *:not(#rich-doc-print-root) { display: none !important; }
  #rich-doc-print-root { display: block !important; }
  .rich-doc-actions { display: none !important; }
  .rich-doc-edit-bar { display: none !important; }
  .rich-doc-page {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    width: 210mm !important;
    padding: 20mm 22mm !important;
  }
  .rich-doc-outer { background: white !important; padding: 0 !important; }
  @page { size: A4; margin: 0; }
}
`

let printStyleInjected = false
function injectPrintStyle() {
  if (printStyleInjected) return
  const s = document.createElement('style')
  s.textContent = PRINT_STYLE
  document.head.appendChild(s)
  printStyleInjected = true
}


export default function RichDoc({
  text = '',
  editable = false,
  onEdit,
  exportId,
  exportSlug,
  dark = false,
  docTitle = 'Document',
  professionalMode = false,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [layoutTemplate, setLayoutTemplate] = useState('classic')
  const [companyInfo, setCompanyInfo] = useState({
    name: 'ABAWI Consulting',
    address: 'Dakar, Sénégal',
    phone: '+221 33 000 00 00',
    email: 'contact@abawi.com',
    logo: ''
  })
  const [recipientInfo, setRecipientInfo] = useState({})
  const [showLayoutOptions, setShowLayoutOptions] = useState(false)

  const pageCount = useMemo(() => {
    if (!text || !text.trim()) return 0
    return Math.max(1, Math.ceil(text.replace(/\s+/g, ' ').trim().length / CHARS_PER_A4))
  }, [text])

  injectPrintStyle()
  injectQuillDocStyle()

  /* Détection du thème actuel */
  const getTheme = () => {
    const root = document.documentElement
    const style = getComputedStyle(root)
    
    if (style.getPropertyValue('--theme-galaxy')?.trim() !== '') return 'galaxy'
    if (style.getPropertyValue('--theme-platine')?.trim() !== '') return 'platine'
    if (style.getPropertyValue('--theme-dark')?.trim() !== '' || dark) return 'dark'
    return 'light'
  }
  
  const theme = getTheme()
  
  /* Couleurs UI adaptatives selon thème */
  const themeColors = {
    light: {
      uiBg: '#f1f5f9',
      uiBorder: '#e2e8f0', 
      uiMuted: '#64748b',
      paperBg: '#ffffff',
      textCol: '#111111',
      mutedCol: '#555555',
      borderC: '#d1d5db',
      h1Col: '#0f172a',
      h2Col: '#1e293b', 
      h3Col: '#334155',
      h4Col: '#475569',
      hlBg: 'rgba(0,0,0,0.03)',
      hlBorder: 'rgba(0,0,0,0.12)',
      codeBg: '#f3f4f6'
    },
    dark: {
      uiBg: '#070B0F',
      uiBorder: '#1A2332',
      uiMuted: '#9BAAB8',
      paperBg: '#0D1117',
      textCol: '#F0F2F5',
      mutedCol: '#9BAAB8',
      borderC: '#1A2332',
      h1Col: '#F0F2F5',
      h2Col: '#E2E8F0',
      h3Col: '#CBD5E1', 
      h4Col: '#94A3B8',
      hlBg: 'rgba(255,255,255,0.03)',
      hlBorder: 'rgba(255,255,255,0.12)',
      codeBg: 'rgba(255,255,255,0.05)'
    },
    galaxy: {
      uiBg: 'linear-gradient(135deg, #1a1f3a, #0f172a)',
      uiBorder: 'rgba(139,92,246,0.3)',
      uiMuted: '#a78bfa',
      paperBg: 'linear-gradient(135deg, #1e293b, #0f172a)', 
      textCol: '#e0e7ff',
      mutedCol: '#a78bfa',
      borderC: 'rgba(139,92,246,0.2)',
      h1Col: '#fbbf24',
      h2Col: '#f59e0b',
      h3Col: '#f97316',
      h4Col: '#ef4444', 
      hlBg: 'rgba(139,92,246,0.1)',
      hlBorder: 'rgba(139,92,246,0.3)',
      codeBg: 'rgba(139,92,246,0.15)'
    },
    platine: {
      uiBg: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
      uiBorder: 'rgba(156,163,175,0.5)',
      uiMuted: '#6b7280',
      paperBg: 'linear-gradient(135deg, #ffffff, #f9fafb)',
      textCol: '#374151', 
      mutedCol: '#6b7280',
      borderC: 'rgba(156,163,175,0.3)',
      h1Col: '#dc2626',
      h2Col: '#ea580c',
      h3Col: '#d97706',
      h4Col: '#ca8a04',
      hlBg: 'rgba(220,38,38,0.05)',
      hlBorder: 'rgba(220,38,38,0.2)', 
      codeBg: 'rgba(156,163,175,0.1)'
    }
  }
  
  // En mode professionnel (ProfessionalLayout), le papier est toujours blanc —
  // forcer les couleurs light pour éviter texte clair sur fond blanc.
  const colors = professionalMode ? themeColors.light : themeColors[theme]

  const { uiBg, uiBorder, uiMuted, paperBg, textCol, mutedCol, borderC, h1Col, h2Col, h3Col, h4Col, hlBg, hlBorder, codeBg } = colors

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const processed = (preprocessText(text) || '')
    // Join lone number lines with the text that follows
    .replace(/^(\d+[.)])\s*\n+\s*/gm, '$1 ')
  const lines = processed.split('\n')

  /* ── MODE ÉDITION — Redirection vers SmartWordEditor ── */
  if (editing) {
    return (
      <div style={{ background: uiBg, borderRadius: 12, padding: '20px', marginBottom: 4 }}>
        <div style={{ fontSize: '0.72rem', color: uiMuted, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          ✏️ Éditeur Pro ABAWI
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
            L'éditeur a été amélioré et déplacé vers un outil dédié
          </div>
          <Link 
            to="/outils/smart-word-editor" 
            style={{ 
              display: 'inline-block', 
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', 
              color: 'white', 
              borderRadius: 8, 
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Ouvrir Smart Word Editor
          </Link>
          <button 
            onClick={() => setEditing(false)} 
            style={{ 
              display: 'block', 
              margin: '16px auto 0', 
              padding: '8px 16px', 
              background: 'transparent', 
              border: '1px solid var(--border)', 
              color: 'var(--text-secondary)', 
              borderRadius: 6, 
              cursor: 'pointer' 
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  /* ── MODE VUE A4 ── */
  
  // Mode professionnel cabinet d'élite
  if (professionalMode) {
    return (
      <ProfessionalLayout
        template={layoutTemplate}
        companyInfo={companyInfo}
        recipientInfo={recipientInfo}
        showLayoutOptions={showLayoutOptions}
        onTemplateChange={setLayoutTemplate}
        onCompanyInfoChange={setCompanyInfo}
        onRecipientInfoChange={setRecipientInfo}
      >
        <div style={{ minHeight: 500 }}>
          {lines.length === 0 || !text.trim() ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '0.9rem' }}>
              Le document apparaîtra ici après génération.
            </div>
          ) : text.trim().startsWith('<') ? (
            <div
              className="quill-doc-view"
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', color: '#1a1a1a' }}
            />
          ) : renderLines(lines, colors)}
        </div>
        
        {/* Barre d'actions en mode professionnel */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderTop: '1px solid #e0e0e0',
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setShowLayoutOptions(!showLayoutOptions)}
            style={{ 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ✏️ Smart Word Editor
          </button>
          {editable && (
            <button onClick={() => { setDraft(text); setEditing(true) }} style={{ 
              padding: '8px 16px', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              ✏️ Modifier
            </button>
          )}
          <button onClick={() => navigator.clipboard.writeText(text).catch(() => {})} style={{ 
            padding: '8px 16px', 
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            📋 Copier
          </button>
          {exportId && exportSlug && (
            <button onClick={() => exportToPDF(exportId, exportSlug, { includeHeader: false, includeFooter: false })}
              style={{ 
                padding: '8px 16px', 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '13px'
              }}>
              📥 PDF
            </button>
          )}
          <button onClick={() => exportToWord(text, exportSlug, docTitle)}
            style={{ 
              padding: '8px 16px', 
              background: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '13px'
            }}>
            📝 Word
          </button>
        </div>
      </ProfessionalLayout>
    )
  }
  
  // Mode standard
  return (
    <div className="rich-doc-outer" style={{ background: uiBg, borderRadius: 12, padding: '20px 0', marginBottom: 4 }}>

      {/* Barre d'actions */}
      <div className="rich-doc-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 20px 16px' }}>
        {editable && (
          <button onClick={() => { setDraft(text); setEditing(true) }} style={btnStyle(uiBorder, uiMuted)}>✏️ Modifier</button>
        )}
        <Link 
          to="/outils/smart-word-editor" 
          onClick={() => { localStorage.setItem('smartword_editor_content', text); localStorage.setItem('smartword_editor_title', docTitle) }}
          style={{ ...btnStyle(uiBorder, uiMuted), background: '#007bff', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          ✏️ Smart Word Editor
        </Link>
        <button onClick={() => navigator.clipboard.writeText(text).catch(() => {})} style={btnStyle(uiBorder, uiMuted)}>📋 Copier</button>
        <button onClick={() => {
          injectPrintStyle()
          const el = document.getElementById(exportId || 'rich-doc-page')
          if (el) el.id = 'rich-doc-print-root'
          window.print()
          if (el) el.id = exportId || 'rich-doc-page'
        }} style={btnStyle(uiBorder, uiMuted)}>🖨️ Imprimer</button>
        {exportId && exportSlug && (
          <button onClick={() => exportToPDF(exportId, exportSlug, { includeHeader: false, includeFooter: false })}
            style={{ padding: '7px 16px', borderRadius: 7, background: '#F0B429', border: 'none', color: '#0a0a0a', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 800 }}>
            📥 PDF
          </button>
        )}
        <button onClick={() => exportToWord(text, exportSlug, docTitle)}
          style={{ padding: '7px 16px', borderRadius: 7, background: '#1E40AF', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>
          📝 Word
        </button>
        <button onClick={() => {
          const url = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
          const a = document.createElement('a'); a.href = url; a.download = `${exportSlug || 'document'}.txt`; a.click()
        }} style={btnStyle(uiBorder, uiMuted)}>⬇ TXT</button>
        <button onClick={() => {
          const subject = encodeURIComponent(docTitle)
          const body = encodeURIComponent(text.substring(0, 1800))
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank')
        }} style={{ ...btnStyle(uiBorder, uiMuted), color: '#EA4335', borderColor: '#EA4335' }}>✉️ Gmail</button>
        {navigator.share && (
          <button onClick={() => navigator.share({ title: docTitle, text: text.substring(0, 400) }).catch(() => {})} style={btnStyle(uiBorder, uiMuted)}>↗ Partager</button>
        )}
        {pageCount > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: uiMuted, fontWeight: 600 }}>
            <span style={{ background: dark ? '#1A2332' : '#e2e8f0', padding: '4px 10px', borderRadius: 20 }}>
              {pageCount} page{pageCount > 1 ? 's' : ''} A4 estimée{pageCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Page A4 — fond gris style Word */}
      <div style={{ background: '#c8c8c8', padding: '24px 16px', overflowX: 'auto' }}>
        <div
          id={exportId || 'rich-doc-page'}
          className="rich-doc-page"
          style={{
            background: paperBg,
            borderRadius: 3,
            boxShadow: '0 4px 28px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.07)',
            maxWidth: 794,
            margin: '0 auto',
            overflow: 'hidden',
            fontFamily: "'Times New Roman', serif",
            fontSize: '12pt',
            /* Always light scheme on A4 paper — doc content is print-oriented */
            colorScheme: 'light',
          }}
        >
          {/* En-tête ELITE adaptatif selon thème */}
          <div style={{
            padding: '24px 72px 16px',
            borderBottom: `1px solid ${borderC}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : theme === 'galaxy' ? 'rgba(139,92,246,0.05)' : theme === 'platine' ? 'rgba(220,38,38,0.03)' : '#fafafa',
          }}>
            <div>
              <div style={{ fontSize: '9pt', color: mutedCol, marginBottom: 2, fontFamily: "'Times New Roman', serif" }}>
                ABAWI Portal
              </div>
              <div style={{ fontSize: '13pt', fontWeight: 700, color: h1Col, fontFamily: "'Times New Roman', serif", lineHeight: 1.3 }}>
                {docTitle}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '9pt', color: mutedCol, fontFamily: "'Times New Roman', serif" }}>{today}</div>
            </div>
          </div>

          {/* Corps du document — marges A4 généreuses 2.5cm */}
          <div style={{ padding: '48px 72px 64px', minHeight: 520, fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: 1.75, color: theme === 'dark' ? textCol : '#111111', wordSpacing: '0.02em', hyphens: 'auto' }}>
            {lines.length === 0 || !text.trim() ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: mutedCol, fontSize: '0.9rem' }}>
                Le document apparaîtra ici après génération.
              </div>
            ) : text.trim().startsWith('<') ? (
              /* HTML content from Quill editor — render directly */
              <div
                className="quill-doc-view"
                dangerouslySetInnerHTML={{ __html: text }}
                style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: 1.6, color: textCol }}
              />
            ) : renderLines(lines, colors)}
          </div>

          {/* Pied de page */}
          <div style={{
            padding: '14px 72px',
            borderTop: `1px solid ${borderC}`,
            background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: '9pt', color: mutedCol, fontFamily: "'Times New Roman', serif" }}>
              © ABAWI Portal
            </div>
            <div style={{ fontSize: '9pt', color: mutedCol, fontFamily: "'Times New Roman', serif" }}>
              {pageCount > 1 ? `~${pageCount} pages` : 'Page 1'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function btnStyle(border, color) {
  return {
    padding: '7px 16px', borderRadius: 7, background: 'transparent',
    border: `1px solid ${border}`, color, cursor: 'pointer',
    fontSize: '0.76rem', fontWeight: 600,
  }
}

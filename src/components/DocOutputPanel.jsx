/**
 * DocOutputPanel — Affichage premium des réponses IA
 * Trois onglets : Aperçu · Document A4 · Éditeur Pro
 * Utilisable dans tous les outils qui génèrent un document texte.
 */
import { useState, useCallback } from 'react'
import { exportToPDF } from '../lib/generatePDF'
import { Link } from 'react-router-dom'
import RichDoc from './RichDoc'

const TABS = [
  { id: 'apercu', label: '🔍 Aperçu', hint: 'Lecture rapide formatée' },
  { id: 'a4',     label: '📄 Document A4', hint: 'Vue imprimable, Times New Roman' },
  { id: 'editeur',label: '✏️ Smart Word Editor', hint: 'Modification complète, export Word/PDF' },
]

export default function DocOutputPanel({
  text = '',
  onTextChange,
  exportId = 'doc-output-panel',
  exportSlug = 'document-abawi',
  docTitle = 'Document',
  dark = false,
  editable = true,
  saving = false,
  onSave30Days,
  saveLabel = '💾 Sauvegarder (30 jours)',
}) {
  const [activeTab, setActiveTab] = useState('a4')
  const [localText, setLocalText] = useState(text)
  const [saveNotice, setSaveNotice] = useState('')

  const currentText = onTextChange ? text : localText

  const handleEditorSave = useCallback((html) => {
    if (onTextChange) onTextChange(html)
    else setLocalText(html)
    setActiveTab('a4')
  }, [onTextChange])

  function handleSave30() {
    if (onSave30Days) {
      onSave30Days(currentText)
      setSaveNotice('✅ Sauvegardé pour 30 jours')
      setTimeout(() => setSaveNotice(''), 3000)
    }
  }

  const uiBg = dark ? '#070B0F' : '#f1f5f9'
  const uiBorder = dark ? '#1A2332' : '#e2e8f0'

  if (!currentText || !currentText.trim()) return null

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${uiBorder}` }}>

      {/* ── Tab bar ── */}
      <div style={{ background: uiBg, padding: '10px 14px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${uiBorder}` }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.hint} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === tab.id
              ? 'linear-gradient(135deg,#F0B429,#e5a820)'
              : dark ? '#0D1117' : '#ffffff',
            color: activeTab === tab.id ? '#0a0a0a' : dark ? '#9BAAB8' : '#475569',
            fontWeight: activeTab === tab.id ? 800 : 600,
            fontSize: '0.8rem',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(240,180,41,0.3)' : 'none',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}

        {/* Actions rapides */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {saveNotice && (
            <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>{saveNotice}</span>
          )}
          {onSave30Days && (
            <button onClick={handleSave30} style={{
              padding: '5px 11px', borderRadius: 7, border: `1px solid ${uiBorder}`,
              background: 'transparent', color: dark ? '#8B95A5' : '#64748b',
              fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {saveLabel}
            </button>
          )}
          <button onClick={() => navigator.clipboard.writeText(currentText).catch(() => {})} style={{
            padding: '5px 11px', borderRadius: 7, border: `1px solid ${uiBorder}`,
            background: 'transparent', color: dark ? '#8B95A5' : '#64748b',
            fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer',
          }}>
            📋 Copier
          </button>
          <button onClick={() => exportToPDF(exportId, exportSlug, { includeHeader: false, includeFooter: false })} style={{
            padding: '5px 11px', borderRadius: 7, border: 'none',
            background: '#F0B429', color: '#0a0a0a',
            fontSize: '0.73rem', fontWeight: 800, cursor: 'pointer',
          }}>
            📥 PDF
          </button>
        </div>
      </div>

      {/* ── Aperçu ── */}
      {activeTab === 'apercu' && (
        <div style={{
          background: dark ? '#0D1117' : '#fff',
          padding: '28px 32px',
          minHeight: 320,
        }}>
          <MarkdownPremium text={currentText} dark={dark} />
        </div>
      )}

      {/* ── Document A4 ── */}
      {activeTab === 'a4' && (
        <div style={{ background: dark ? '#070B0F' : '#f1f5f9' }}>
          <RichDoc
            text={currentText}
            editable={editable}
            onEdit={onTextChange || setLocalText}
            exportId={exportId}
            exportSlug={exportSlug}
            docTitle={docTitle}
            dark={dark}
            professionalMode={true}
          />
        </div>
      )}

      {/* ── Éditeur Pro ── */}
      {activeTab === 'editeur' && (
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
            onClick={() => setActiveTab('a4')} 
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
      )}
    </div>
  )
}

/* ── Rendu premium MarkdownText amélioré ── */
function MarkdownPremium({ text, dark }) {
  const textColor = dark ? '#E8EDF4' : '#1e293b'
  const mutedColor = dark ? '#9BAAB8' : '#64748b'
  const headingColor = dark ? '#F0F2F5' : '#0f172a'
  const goldColor = '#F0B429'
  const borderColor = dark ? '#1A2332' : '#e2e8f0'
  const bgAccent = dark ? '#0D1117' : '#f8fafc'
  const bgHighlight = dark ? 'rgba(240,180,41,0.07)' : 'rgba(240,180,41,0.05)'

  const lines = text.trim().split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const tr = line.trim()

    if (!tr) { elements.push(<div key={i} style={{ height: 14 }} />); i++; continue }

    // Titre bold detecté
    if (/^\*\*(.+)\*\*$/.test(tr)) {
      const titleText = tr.replace(/^\*\*/, '').replace(/\*\*$/, '')
      elements.push(
        <div key={i} style={{ margin: '24px 0 14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: headingColor, lineHeight: 1.4, fontFamily: "'Times New Roman', serif", letterSpacing: '0.3px' }}>
            {titleText}
          </h2>
        </div>
      )
      i++; continue
    }

    // Sous-titre italic detecté
    if (/^\*(.+)\*$/.test(tr)) {
      const subtitleText = tr.replace(/^\*/, '').replace(/\*$/, '')
      elements.push(
        <h3 key={i} style={{ margin: '16px 0 10px', fontSize: '1rem', fontWeight: 600, fontStyle: 'italic', color: mutedColor, lineHeight: 1.4, fontFamily: "'Times New Roman', serif" }}>
          {subtitleText}
        </h3>
      )
      i++; continue
    }

    // Bullet point that looks like a title
    if (/^[-•]\s+([A-Z][^a-z]{3,})$/.test(tr)) {
      const titleText = tr.replace(/^[-•]\s+/, '')
      elements.push(
        <div key={i} style={{ margin: '24px 0 14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: headingColor, lineHeight: 1.4, fontFamily: "'Times New Roman', serif" }}>
            {titleText}
          </h2>
        </div>
      )
      i++; continue
    }

    // ALL CAPS Title
    if (tr === tr.toUpperCase() && tr.length > 3 && tr.length < 100 && !tr.includes('.')) {
      elements.push(
        <div key={i} style={{ margin: '28px 0 14px' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: headingColor, lineHeight: 1.3, fontFamily: "'Times New Roman', serif", textTransform: 'uppercase' }}>
            {tr}
          </h1>
        </div>
      )
      i++; continue
    }

    // Subtitle: short line without period followed by longer text
    if (tr.length < 60 && !tr.includes('.') && tr.length > 5 && i + 1 < lines.length && lines[i + 1].trim().length > tr.length) {
      elements.push(
        <div key={i} style={{ margin: '22px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: '1.2em', background: goldColor, borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: headingColor, lineHeight: 1.35, fontFamily: "'Times New Roman', serif" }}>
            {tr}
          </h2>
        </div>
      )
      i++; continue
    }

    // H1 fallback
    if (/^# /.test(tr)) {
      elements.push(
        <div key={i} style={{ margin: '28px 0 14px', paddingBottom: 10, borderBottom: `2px solid ${goldColor}30` }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: headingColor, lineHeight: 1.3, fontFamily: "'Times New Roman', serif" }}>
            {tr.replace(/^# /, '')}
          </h1>
        </div>
      )
      i++; continue
    }

    // H2 fallback
    if (/^## /.test(tr)) {
      elements.push(
        <div key={i} style={{ margin: '22px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: '1.2em', background: goldColor, borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: headingColor, lineHeight: 1.35, fontFamily: "'Times New Roman', serif" }}>
            {tr.replace(/^## /, '')}
          </h2>
        </div>
      )
      i++; continue
    }

    // H3 fallback
    if (/^### /.test(tr)) {
      elements.push(
        <h3 key={i} style={{ margin: '16px 0 6px', fontSize: '0.95rem', fontWeight: 700, color: headingColor, fontStyle: 'italic', fontFamily: "'Times New Roman', serif" }}>
          {tr.replace(/^### /, '')}
        </h3>
      )
      i++; continue
    }

    // --- séparateur
    if (/^---+$/.test(tr)) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '20px 0' }} />)
      i++; continue
    }

    // > blockquote
    if (/^> /.test(tr)) {
      elements.push(
        <blockquote key={i} style={{
          margin: '12px 0', padding: '10px 18px',
          borderLeft: `3px solid ${goldColor}`, background: bgHighlight,
          borderRadius: '0 8px 8px 0', color: mutedColor,
          fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.7,
          fontFamily: "'Times New Roman', serif",
        }}>
          {formatInline(tr.replace(/^> /, ''), dark)}
        </blockquote>
      )
      i++; continue
    }

    // Listes - et *
    if (/^[-•*] /.test(tr)) {
      const listItems = []
      while (i < lines.length && /^[-•*] /.test(lines[i].trim())) {
        listItems.push(
          <li key={i} style={{ marginBottom: 5, color: textColor, fontSize: '0.92rem', lineHeight: 1.7, fontFamily: "'Times New Roman', serif" }}>
            {formatInline(lines[i].trim().replace(/^[-•*] /, ''), dark)}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: 22, margin: '8px 0 12px', listStyle: 'none' }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 5 }}>
              <span style={{ color: goldColor, flexShrink: 0, marginTop: 4, fontSize: '0.7rem' }}>◆</span>
              <span style={{ color: textColor, fontSize: '0.92rem', lineHeight: 1.7, fontFamily: "'Times New Roman', serif" }}>
                {formatInline(lines[i - listItems.length + j]?.trim().replace(/^[-•*] /, '') || '', dark)}
              </span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Cartes numérotées professionnelles
    if (/^(\d+)[.)]\s+(.+)$/.test(tr)) {
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
        elements.push(
          <div key={`cards-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '20px 0' }}>
            {cards.map((card, idx) => (
              <div key={idx} style={{
                display: 'flex',
                background: bgHighlight,
                border: `1px solid ${borderColor}`,
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
                  background: goldColor,
                  color: '#0a0a0a',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {card.number}
                </div>
                {/* Contenu */}
                <div style={{ padding: '14px 18px', flex: 1 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: headingColor,
                    marginBottom: 6,
                    lineHeight: 1.3
                  }}>
                    {card.title}
                  </div>
                  {card.description && (
                    <div style={{
                      fontFamily: "'Times New Roman', serif",
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      color: textColor
                    }}>
                      {formatInline(card.description, dark)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
      continue
    }

    // Paragraphe normal
    elements.push(
      <p key={i} style={{ margin: '0 0 10px', fontSize: '0.92rem', color: textColor, lineHeight: 1.75, fontFamily: "'Times New Roman', serif" }}>
        {formatInline(tr, dark)}
      </p>
    )
    i++
  }

  return <div>{elements}</div>
}

/* ── Formatage inline (gras, italique, code) ── */
function formatInline(text, dark) {
  if (!text) return null
  const codeColor = dark ? '#c084fc' : '#7c3aed'
  const parts = []
  const regex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|__.*?__|_.*?_|\*.*?\*|`.*?`)/g
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const m = match[0]
    if (m.startsWith('***')) parts.push(<strong key={match.index}><em>{m.slice(3, -3)}</em></strong>)
    else if (m.startsWith('**') || m.startsWith('__')) parts.push(<strong key={match.index}>{m.slice(2, -2)}</strong>)
    else if (m.startsWith('*') || m.startsWith('_')) parts.push(<em key={match.index}>{m.slice(1, -1)}</em>)
    else if (m.startsWith('`')) parts.push(
      <code key={match.index} style={{ fontFamily: 'monospace', fontSize: '0.85em', background: dark ? '#1e293b' : '#f1f5f9', color: codeColor, padding: '1px 5px', borderRadius: 4 }}>
        {m.slice(1, -1)}
      </code>
    )
    last = match.index + m.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

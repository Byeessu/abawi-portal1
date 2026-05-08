/* Rendu professionnel pour réponses IA — Style cabinet conseil avec cartes */
import { cleanIAText } from '../lib/textCleaner'

function isTitleCase(str) {
  const words = str.split(' ')
  if (words.length < 2) return false
  return words.every(w => w.length === 0 || /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜŸÇ]/.test(w))
}

export default function MarkdownText({ text, style = {}, compact = false, color }) {
  if (!text) return null

  // Nettoyer le texte avec cleanIAText
  const cleaned = cleanIAText(text)
  const lines = cleaned.split('\n')
  const els = []
  let i = 0
  let listItems = []
  let listType = null
  let numberedCards = []

  const family = "'Georgia', 'Times New Roman', serif"
  const pSize = compact ? '0.9rem' : '0.95rem'
  const pLine = compact ? 1.6 : 1.8

  function flushList() {
    if (!listItems.length) return
    if (listType === 'ol') {
      els.push(
        <ol key={`ol-${i}`} style={{ 
          margin: compact ? '6px 0 12px 24px' : '10px 0 16px 32px', 
          padding: 0,
          listStyle: 'decimal'
        }}>
          {listItems.map((li, j) => (
            <li key={j} style={{ 
              marginBottom: compact ? 6 : 10, 
              lineHeight: pLine,
              fontFamily: family,
              fontSize: pSize,
              color: color || 'var(--text-primary)'
            }}>
              {li}
            </li>
          ))}
        </ol>
      )
    } else {
      els.push(
        <ul key={`ul-${i}`} style={{ 
          margin: compact ? '6px 0 12px 20px' : '10px 0 16px 28px', 
          padding: 0,
          listStyle: 'disc'
        }}>
          {listItems.map((li, j) => (
            <li key={j} style={{ 
              marginBottom: compact ? 6 : 10, 
              lineHeight: pLine,
              fontFamily: family,
              fontSize: pSize,
              color: color || 'var(--text-primary)'
            }}>
              {li}
            </li>
          ))}
        </ul>
      )
    }
    listItems = []
    listType = null
  }

  function flushNumberedCards() {
    if (!numberedCards.length) return
    els.push(
      <div key={`cards-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16, margin: compact ? '16px 0' : '24px 0' }}>
        {numberedCards.map((card, idx) => (
          <div key={idx} style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            {/* Numéro sur fond bleu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: compact ? 48 : 56,
              background: 'var(--accent)',
              color: 'white',
              fontSize: compact ? '1.2rem' : '1.4rem',
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif"
            }}>
              {card.number}
            </div>
            {/* Contenu */}
            <div style={{ padding: compact ? '12px 16px' : '16px 20px', flex: 1 }}>
              {/* Titre en gras */}
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: compact ? '0.9rem' : '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.3
              }}>
                {card.title}
              </div>
              {/* Description */}
              <div style={{
                fontFamily: family,
                fontSize: pSize,
                lineHeight: pLine,
                color: 'var(--text-secondary)'
              }}>
                {card.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
    numberedCards = []
  }

  while (i < lines.length) {
    const l = lines[i]
    const t = l.trim()

    if (!t) {
      flushList()
      flushNumberedCards()
      els.push(<div key={`sp-${i}`} style={{ height: compact ? 10 : 16 }} />)
    } else if (isTitleCase(t) && t.length > 3 && t.length < 100 && !t.includes('.')) {
      // Title Case title (like "Analyse Financiere")
      flushNumberedCards()
      flushList()
      els.push(
        <div key={i} style={{ 
          margin: compact ? '20px 0 12px' : '32px 0 16px',
          fontFamily: family,
          fontSize: compact ? '1.1rem' : '1.25rem',
          fontWeight: 800,
          color: color || 'var(--text-primary)',
          lineHeight: 1.4,
          letterSpacing: '0.3px'
        }}>
          {t}
        </div>
      )
    } else if (t.length < 60 && !t.includes('.') && t.length > 5 && i + 1 < lines.length && lines[i + 1].trim().length > t.length) {
      // Short line without period followed by longer text = subtitle
      flushList()
      flushNumberedCards()
      els.push(
        <div key={i} style={{ 
          margin: compact ? '16px 0 10px' : '24px 0 14px',
          fontFamily: family,
          fontSize: compact ? '0.95rem' : '1.02rem',
          fontWeight: 600,
          fontStyle: 'italic',
          color: color || 'var(--text-secondary)',
          lineHeight: 1.4
        }}>
          {subtitleText}
        </div>
      )
    } else if (/^[-•]\s/.test(t)) {
      flushNumberedCards()
      // Skip lines that look like titles (all caps or short)
      const itemText = t.replace(/^[-•]\s/, '')
      if (/^[A-Z][^a-z]{3,}$/.test(itemText) && itemText.length < 40) {
        // This looks like a title, not a bullet
        flushList()
        els.push(
          <div key={i} style={{ 
            margin: compact ? '20px 0 12px' : '32px 0 16px',
            fontFamily: family,
            fontSize: compact ? '1rem' : '1.1rem',
            fontWeight: 700,
            color: color || 'var(--text-primary)',
            lineHeight: 1.4
          }}>
            {itemText}
          </div>
        )
      } else {
        if (listType !== 'ul') { flushList(); listType = 'ul' }
        listItems.push(t.replace(/^[-•*]\s/, ''))
      }
    } else if (/^(\d+)[.)]\s+(.+)$/.test(t)) {
      // Detect numbered items: "1. **TITLE** — Description"
      flushList()
      const match = t.match(/^(\d+)[.)]\s+(.+)$/)
      const num = match[1]
      let content = match[2]
      
      // Parse title and description from contentCleaner format
      let title, description
      
      // Check if title is bold: "**TITLE**"
      const boldMatch = content.match(/\*\*([^*]+)\*\*/)
      if (boldMatch) {
        title = boldMatch[1] // Extract title from **bold**
        // Get description after the bold title
        const afterBold = content.substring(content.indexOf('**') + boldMatch[0].length).trim()
        // Remove em-dash or dash if present
        description = afterBold.replace(/^[-—–]\s*/, '').trim()
      } else {
        // Fallback: look for em-dash, dash or first sentence
        const separators = [' — ', ' - ', ': ', '. ']
        let splitFound = false
        for (const sep of separators) {
          const idx = content.indexOf(sep)
          if (idx > 5 && idx < 100) {
            title = content.substring(0, idx).trim()
            description = content.substring(idx + sep.length).trim()
            splitFound = true
            break
          }
        }
        if (!splitFound) {
          title = content
          description = ''
        }
      }
      
      // Check if next line is a continuation
      if (!description && i + 1 < lines.length && !lines[i + 1].trim().match(/^\d+[.)]\s/) && !lines[i + 1].trim().match(/^\*\*/)) {
        i++
        description = lines[i].trim()
      }
      
      numberedCards.push({ number: num, title, description })
    } else if (/^>/.test(t)) {
      flushList()
      flushNumberedCards()
      els.push(
        <blockquote key={i} style={{ 
          margin: compact ? '10px 0' : '16px 0', 
          padding: compact ? '10px 14px' : '12px 18px',
          borderLeft: '3px solid var(--border)',
          background: 'var(--bg-card-hover)',
          borderRadius: '0 4px 4px 0',
          fontFamily: family,
          fontSize: pSize,
          lineHeight: pLine,
          color: color || 'var(--text-secondary)',
          fontStyle: 'italic'
        }}>
          {t.replace(/^>\s*/, '')}
        </blockquote>
      )
    } else {
      flushList()
      flushNumberedCards()
      els.push(
        <p key={i} style={{ 
          margin: compact ? '0 0 10px' : '0 0 14px', 
          lineHeight: pLine,
          fontFamily: family,
          fontSize: pSize,
          color: color || 'var(--text-primary)'
        }}>
          {t}
        </p>
      )
    }
    i++
  }
  flushList()
  flushNumberedCards()

  return (
    <div style={{ 
      fontSize: pSize, 
      lineHeight: pLine, 
      color: color || 'inherit',
      fontFamily: family,
      ...style 
    }}>
      {els}
    </div>
  )
}

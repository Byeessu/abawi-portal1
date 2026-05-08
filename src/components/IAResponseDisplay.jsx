/**
 * IAResponseDisplay — Affichage unifié des réponses ABAWI IA
 * Utilise les variables CSS du thème → s'adapte automatiquement (dark/light/galaxy/gold...)
 * Bouton "📄 Éditeur Pro" pour les réponses longues → modal plein écran DocOutputPanel
 */
import { useState, useEffect, useMemo } from 'react'
import { cleanIATextElite } from '../lib/textCleaner'
import DocOutputPanel from './DocOutputPanel'

/* ══════════════════════════════════════════════════════
   FORMATAGE TEXTE SIMPLE — Sans markdown
   Retourne le texte tel quel, nettoyé
══════════════════════════════════════════════════════ */
function fmtInline(text) {
  if (!text) return null
  // Return plain text - markdown already cleaned by cleanIAText
  return text
}

/* ══════════════════════════════════════════════════════
   SWOT MATRIX — Détection et rendu 2×2 automatique
══════════════════════════════════════════════════════ */
const SWOT_HDR_MAP = {
  'FORCES': 'forces', 'FORCE': 'forces', 'POINTS FORTS': 'forces',
  'FAIBLESSES': 'faiblesses', 'FAIBLESSE': 'faiblesses', 'POINTS FAIBLES': 'faiblesses',
  'OPPORTUNITÉS': 'opportunites', 'OPPORTUNITES': 'opportunites', 'OPPORTUNITÉ': 'opportunites', 'OPPORTUNITE': 'opportunites',
  'MENACES': 'menaces', 'MENACE': 'menaces', 'RISQUES': 'menaces',
}

function detectSwotRange(lines) {
  const hits = lines.map((l, i) => ({ i, key: SWOT_HDR_MAP[l.trim()] })).filter(x => x.key)
  if (hits.length < 3) return null
  if (hits[hits.length - 1].i - hits[0].i > 80) return null

  const secs = {}
  for (let h = 0; h < hits.length; h++) {
    const nextHitIdx = h + 1 < hits.length ? hits[h + 1].i : hits[h].i + 20
    secs[hits[h].key] = lines
      .slice(hits[h].i + 1, nextHitIdx)
      .filter(l => l.trim() && !SWOT_HDR_MAP[l.trim()])
      .map(l => l.trim().replace(/^[•\-*]\s*/, ''))
  }
  const lastHit = hits[hits.length - 1]
  let lastLine = lastHit.i
  for (let j = lastHit.i + 1; j < Math.min(lines.length, lastHit.i + 20); j++) {
    const tr = lines[j].trim()
    if (tr && !SWOT_HDR_MAP[tr]) lastLine = j
    else if (!tr) continue
    else break
  }
  return { start: hits[0].i, end: lastLine, secs }
}

function SwotGrid({ secs, compact }) {
  const quads = [
    { key: 'forces',      label: 'Forces',       accent: '#10B981', bg: 'rgba(16,185,129,0.06)',  icon: '+' },
    { key: 'faiblesses',  label: 'Faiblesses',   accent: '#EF4444', bg: 'rgba(239,68,68,0.06)',   icon: '−' },
    { key: 'opportunites',label: 'Opportunités',  accent: '#3B82F6', bg: 'rgba(59,130,246,0.06)',  icon: '↑' },
    { key: 'menaces',     label: 'Menaces',       accent: '#F59E0B', bg: 'rgba(245,158,11,0.06)',  icon: '!' },
  ]
  return (
    <div style={{ margin: compact ? '16px 0' : '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 3, height: 18, background: 'var(--accent)', borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Analyse SWOT</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: 1, background: 'var(--border)',
        borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        {quads.map(q => (
          <div key={q.key} style={{ background: q.bg, padding: compact ? '14px 16px' : '18px 22px', minHeight: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${q.accent}35` }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: q.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{q.icon}</span>
              <span style={{ fontSize: compact ? '0.7rem' : '0.74rem', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: q.accent }}>{q.label}</span>
            </div>
            {(secs[q.key] || []).map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: compact ? 5 : 7 }}>
                <span style={{ color: q.accent, fontSize: '0.5rem', flexShrink: 0, marginTop: 5, opacity: 0.7 }}>◆</span>
                <span style={{ color: 'var(--text-primary)', fontSize: compact ? '0.82rem' : '0.85rem', lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
            {(!secs[q.key] || secs[q.key].length === 0) && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   RENDU PROFESSIONNEL — Style cabinet conseil élite
   Prose analytique, titres en majuscules, numérotation seulement quand nécessaire
══════════════════════════════════════════════════════ */
function MarkdownRender({ text, compact }) {
  const cleaned = useMemo(() => cleanIATextElite(text || ''), [text])
  if (!cleaned) return null

  const gold   = 'var(--accent, #666)'
  const family = "'Georgia', 'Times New Roman', serif"
  const pSize  = compact ? '0.95rem' : '1.02rem'
  const pLine  = compact ? 1.7 : 1.9

  const lines = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^(\d+[.)])\s*\n+\s*/gm, '$1 ')
    .trim()
    .split('\n')

  const swotRange = detectSwotRange(lines)
  const els = []
  let i = 0
  let swotDone = false
  let firstP = true

  while (i < lines.length) {
    const line = lines[i]
    const tr = line.trim()

    // ── SWOT range: render grid and skip all SWOT lines ──
    if (swotRange && !swotDone && i === swotRange.start) {
      els.push(<SwotGrid key="swot-grid" secs={swotRange.secs} compact={compact} />)
      swotDone = true
      i = Math.min(swotRange.end + 1, lines.length)
      continue
    }

    if (!tr) {
      els.push(<div key={`sp${i}`} style={{ height: compact ? 10 : 18 }} />)
      i++; continue
    }

    // Empty lines become paragraph separators
    const isEmptyLine = tr === ''
    if (isEmptyLine) {
      els.push(<div key={`sp${i}`} style={{ height: compact ? 10 : 16 }} />)
      i++; continue
    }

    /* ── Titre détecté (ALL CAPS) ── */
    if (tr === tr.toUpperCase() && tr.length > 3 && tr.length < 100 && !tr.includes('.')) {
      els.push(
        <div key={i} style={{
          margin: compact ? '20px 0 12px' : '32px 0 18px',
          fontFamily: family,
          fontSize: compact ? '1.1rem' : '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }}>
          {tr}
        </div>
      )
      i++; continue
    }

    /* ── Sous-titre détecté (ligne courte sans point suivie de texte long) ── */
    if (tr.length < 60 && !tr.includes('.') && tr.length > 5 && i + 1 < lines.length && lines[i + 1].trim().length > tr.length) {
      els.push(
        <div key={i} style={{
          margin: compact ? '12px 0 8px' : '18px 0 12px',
          fontFamily: family,
          fontSize: compact ? '1rem' : '1.05rem',
          fontWeight: 600,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          opacity: 0.92,
          lineHeight: 1.4
        }}>
          {tr}
        </div>
      )
      i++; continue
    }

    /* ── Bullet point that looks like a title ── */
    if (/^[-•]\s+([A-Z][^a-z]{3,})$/.test(tr)) {
      const titleText = tr.replace(/^[-•]\s+/, '')
      els.push(
        <div key={i} style={{
          margin: compact ? '20px 0 12px' : '32px 0 18px',
          fontFamily: family,
          fontSize: compact ? '1.05rem' : '1.15rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.4
        }}>
          {titleText}
        </div>
      )
      i++; continue
    }

    /* ── Blockquote ── */
    if (/^> /.test(tr)) {
      els.push(
        <blockquote key={i} style={{
          margin: compact ? '6px 0' : '12px 0', padding: '8px 16px',
          borderLeft: '2px solid var(--border)',
          background: 'var(--bg-card-hover)',
          borderRadius: '0 4px 4px 0',
          color: 'var(--text-secondary)',
          fontSize: pSize, fontStyle: 'italic', lineHeight: pLine, fontFamily: family,
        }}>
          {fmtInline(tr.replace(/^> /, ''))}
        </blockquote>
      )
      i++; continue
    }

    /* ── Liste à puces — style cabinet conseil (◆ marker, prose dense) ── */
    if (/^[-•] /.test(tr) || tr.startsWith('• ')) {
      const items = []
      while (i < lines.length) {
        const tl = lines[i].trim()
        if (/^[-•] /.test(tl) || tl.startsWith('• ')) {
          items.push(tl.replace(/^[-•]\s+/, ''))
          i++
        } else break
      }
      els.push(
        <div key={`bl-${i}`} style={{ margin: compact ? '8px 0 12px' : '12px 0 20px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start',
              gap: compact ? 10 : 13,
              padding: compact ? '6px 0' : '8px 0',
              borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle, rgba(128,128,128,0.07))' : 'none'
            }}>
              <span style={{ color: gold, fontWeight: 900, fontSize: '0.55rem', flexShrink: 0, marginTop: compact ? 6 : 7 }}>◆</span>
              <span style={{ color: 'var(--text-primary)', fontSize: pSize, lineHeight: pLine, fontFamily: family, flex: 1 }}>{fmtInline(item)}</span>
            </div>
          ))}
        </div>
      )
      continue
    }

    /* ── Liste numérotée (cartes professionnelles) ── */
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
        els.push(
          <div key={`cards-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16, margin: compact ? '16px 0' : '24px 0' }}>
            {cards.map((card, idx) => (
              <div key={idx} style={{
                display: 'flex',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {/* Numéro sur fond accent */}
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
                  {card.description && (
                    <div style={{
                      fontFamily: family,
                      fontSize: pSize,
                      lineHeight: pLine,
                      color: 'var(--text-primary)',
                      opacity: 0.88
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
    }

    /* ── Tableau simple ── */
    if (/^\|/.test(tr)) {
      const tableLines = []
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim())
        i++
      }
      const rows = tableLines.filter(l => !/^[|\-: ]+$/.test(l))
      if (rows.length > 0) {
        const parse = r => r.split('|').slice(1, -1).map(c => c.trim())
        const [header, ...body] = rows
        els.push(
          <div key={`tbl${i}`} style={{ overflowX: 'auto', margin: compact ? '8px 0' : '14px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: pSize, fontFamily: family }}>
              <thead>
                <tr>
                  {parse(header).map((h, j) => (
                    <th key={j} style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'left', background: 'var(--bg-card-hover)' }}>
                      {fmtInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid var(--border)', background: ri % 2 === 0 ? 'transparent' : 'var(--bg-card-hover, rgba(0,0,0,0.025))' }}>
                    {parse(row).map((c, ci) => (
                      <td key={ci} style={{ padding: '7px 12px', color: 'var(--text-primary)', fontSize: pSize, fontFamily: family }}>
                        {fmtInline(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    /* ── Paragraphe — callout exécutif sur le premier paragraphe substantiel ── */
    const isExec = firstP && !compact && tr.length > 55
    if (isExec) firstP = false
    els.push(
      <p key={i} style={{
        margin: compact ? '0 0 8px' : '0 0 14px',
        fontSize: pSize, color: 'var(--text-primary)',
        lineHeight: isExec ? 2.0 : pLine, fontFamily: family,
        ...(isExec ? {
          paddingLeft: 14,
          borderLeft: '2px solid var(--accent, #F0B429)',
          marginBottom: 22,
          opacity: 0.95,
        } : {})
      }}>
        {fmtInline(tr)}
      </p>
    )
    i++
  }

  return <div>{els}</div>
}

/* ══════════════════════════════════════════════════════
   MODAL PLEIN ÉCRAN
══════════════════════════════════════════════════════ */
function IADocModal({ text, docTitle, accentColor, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor || 'var(--accent)' }} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem', flex: 1 }}>
          📄 {docTitle || 'Réponse ABAWI IA'} — Éditeur Pro
        </span>
        <button onClick={onClose} style={{
          background: 'var(--bg-card-hover)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 700,
        }}>✕ Fermer (Échap)</button>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 16px', background: 'var(--bg-primary)' }}>
        <DocOutputPanel
          text={text}
          dark={!isLight}
          editable={true}
          docTitle={docTitle || 'Réponse ABAWI IA'}
          exportId="ia-doc-modal-export"
          exportSlug="reponse-abawi-ia"
        />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════ */
export default function IAResponseDisplay({
  text,
  compact = false,
  accentColor = 'var(--accent, #F0B429)',
  docTitle = 'Réponse ABAWI IA',
  showEditorButton = true,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  if (!text) return null

  const isLong = text.length > 480

  return (
    <>
      {/* Texte formaté — couleurs depuis variables CSS du thème */}
      <MarkdownRender text={text} compact={compact} />

      {/* Bouton Éditeur Pro pour réponses longues */}
      {showEditorButton && isLong && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '4px 12px', borderRadius: 6,
              border: `1px solid var(--border)`,
              background: 'rgba(240,180,41,0.1)',
              color: 'var(--accent, #F0B429)',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            📄 Document A4 · Éditeur Pro
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <IADocModal
          text={text}
          docTitle={docTitle}
          accentColor={accentColor}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

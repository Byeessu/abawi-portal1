import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { guides, allFascicules, podcasts, formatPrix, slugify } from '../data/products'

export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const q = query.toLowerCase().trim()
  const all = [
    ...guides.map((g) => ({ ...g, section: 'Guides', icon: '📚', path: '/digital/' + slugify(g.titre) })),
    ...allFascicules.map((f) => ({ ...f, section: 'Fascicules', icon: '🎓', path: '/academy/' + slugify(f.titre) })),
    ...podcasts.filter((p) => p.id !== 'pod-bienvenue').map((p) => ({ ...p, section: 'Podcasts', icon: '🎧', path: '/podcasts/' + slugify(p.titre) })),
  ]
  const results = q.length < 2 ? [] : all.filter((p) =>
    (p.titre || '').toLowerCase().includes(q) || (p.categorie || '').toLowerCase().includes(q) || (p.matiere || '').toLowerCase().includes(q)
  ).slice(0, 20)
  const grouped = {}
  results.forEach((r) => { if (!grouped[r.section]) grouped[r.section] = []; if (grouped[r.section].length < 5) grouped[r.section].push(r) })

  function go(path) { onClose(); navigate(path) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.88)', display: 'flex', justifyContent: 'center', paddingTop: '10vh' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 580, maxHeight: '70vh', background: '#0D1117', border: '1px solid #1A2332', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '0 16px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #1A2332' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B95A5" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} autoFocus style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F0F2F5', fontSize: '1.05rem', fontFamily: 'Outfit,sans-serif' }}
            placeholder="Rechercher guides, fascicules, podcasts..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button style={{ background: 'none', border: 'none', color: '#8B95A5', fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, maxHeight: '55vh' }}>
          {q.length < 2 && <p style={{ textAlign: 'center', color: '#8B95A5', padding: '32px 16px', fontSize: '0.9rem' }}>Tapez au moins 2 caractères</p>}
          {q.length >= 2 && results.length === 0 && <p style={{ textAlign: 'center', color: '#8B95A5', padding: '32px 16px' }}>Aucun résultat pour « {query} »</p>}
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <h4 style={{ fontSize: '0.72rem', color: '#8B95A5', padding: '8px 12px 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{items[0]?.icon} {section}</h4>
              {items.map((item) => (
                <button key={item.id} onClick={() => go(item.path)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', color: '#F0F2F5', cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontSize: '0.92rem', textAlign: 'left' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}>
                  <span>{item.titre}</span>
                  {item.prix && <span style={{ fontSize: '0.82rem', color: '#F0B429', fontWeight: 700, marginLeft: 12, flexShrink: 0 }}>{formatPrix(item.prix)}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ctrl+K pour rechercher · Escape pour fermer</div>
      </div>
    </div>
  )
}

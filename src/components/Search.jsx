import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { guides, allFascicules, podcasts, slugify, digitalPacks, academyPacks } from '../data/products'
import { supabase } from '../lib/supabase'

// === Outils & IA (catalogue local synchronisé avec Outils.jsx) ===
const TOOLS = [
  { id: 'abawi-ia', titre: 'ABAWI IA', desc: 'Quiz, recherche, défi, simulation, débat + assistant vocal', path: '/outils/abawi-ia', prix: 0, iconKey: 'abawi-ia' },
  { id: 'abawi-voice', titre: 'ABAWI IA Vocal', desc: 'Coach vocal premium', path: '/outils/abawi-ia#annah', prix: 0, iconKey: 'abawi-ia-vocal' },
  { id: 'photo-studio', titre: 'Studio Photo ID Pro', desc: 'Photo identité formats UE/USA/admin', path: '/outils/photo-studio-pro', prix: 1900, iconKey: 'photo' },
  { id: 'cv', titre: 'Créateur de CV Pro', desc: 'CV ATS optimisé, 8 thèmes', path: '/outils/cv', prix: 990, iconKey: 'cv' },
  { id: 'lettre', titre: 'Lettre de Motivation', desc: 'Lettre personnalisée IA', path: '/outils/lettre', prix: 1490, iconKey: 'lettre' },
  { id: 'bp', titre: 'Business Plan Élite', desc: 'Plan exhaustif 10 sections', path: '/outils/business-plan', prix: 4900, iconKey: 'business-plan' },
  { id: 'pitch', titre: 'Pitch Deck Investisseur', desc: '10 slides VC-grade', path: '/outils/pitch', prix: 3900, iconKey: 'pitch' },
  { id: 'finance', titre: 'Finance Élite', desc: 'Ratios, DCF, score crédit OHADA', path: '/outils/finance', prix: 12900, iconKey: 'finance' },
  { id: 'juridique', titre: 'Juridique Élite', desc: '12 documents OHADA', path: '/outils/juridique', prix: 9900, iconKey: 'juridique' },
  { id: 'comptable', titre: 'Comptable Élite', desc: 'SYSCOHADA, TVA, paie SN', path: '/outils/comptable', prix: 9900, iconKey: 'comptable' },
  { id: 'rh', titre: 'RH Élite', desc: 'Paie SN, contrats, éval 360°', path: '/outils/rh', prix: 6900, iconKey: 'rh' },
  { id: 'immobilier', titre: 'Immobilier Élite', desc: 'Rendement, simulation crédit', path: '/outils/immobilier', prix: 6900, iconKey: 'immobilier' },
  { id: 'consultant', titre: 'Consultant Élite', desc: 'Proposition, étude, SWOT', path: '/outils/consultant', prix: 6900, iconKey: 'consultant' },
  { id: 'facture', titre: 'Facture / Devis', desc: 'TVA auto, export PDF', path: '/outils/facture', prix: 0, iconKey: 'facture' },
  { id: 'analyse', titre: 'Analyse de CV par IA', desc: 'Score ATS, suggestions', path: '/outils/analyse-cv', prix: 990, iconKey: 'analyse-cv' },
  { id: 'smart-word-editor', titre: 'Smart Word Editor', desc: 'Éditeur documents professionnel avec mise en page libre, templates, marges, export multi-format.', path: '/outils/smart-word-editor', prix: 0, iconKey: 'editeur' },
  { id: 'dictionnaire', titre: 'Abawi Language Pro', desc: 'Dictionnaire multilingue', path: '/outils/dictionnaire-elite', prix: 0, iconKey: 'dictionnaire' },
  { id: 'translator', titre: 'Abawi Translator Élite', desc: 'Traduction + explication', path: '/outils/translator-elite', prix: 0, iconKey: 'translator' },
  { id: 'tontine', titre: 'Tontine SN Max (Élite)', desc: 'Gestion professionnelle des tontines — 3 niveaux adaptés, milliers de membres, tours, paiements, alertes.', path: '/outils/tontine', prix: 4900, iconKey: 'tontine' },
  { id: 'maxavis', titre: 'MaxAvis Elite', desc: 'Sondages, pétitions et études de grande puissance. Millions de réponses, analytics temps réel, rapports IA.', path: '/outils/maxavis', prix: 9900, iconKey: 'maxavis' },
  { id: 'smart-office', titre: 'Smart Office Pro', desc: 'Éditeur intelligent IA', path: '/outils/smart-office', prix: 6900, iconKey: 'smart-office' },
  { id: 'exegetika', titre: 'Abawi Exégètika', desc: 'Analyse exégétique totale', path: '/outils/exegetika', prix: 7900, iconKey: 'exegetika' },
  { id: 'sante', titre: 'ABAWI Santé+', desc: 'Hôpitaux, pharmacies, urgences SN', path: '/outils/sante', prix: 0, iconKey: 'sante' },
  { id: 'autoroute', titre: 'ABAWI AutoRoute', desc: 'Trafic, code route, auto-écoles', path: '/outils/autoroute', prix: 0, iconKey: 'autoroute' },
]

// === Pages clés du site ===
const PAGES = [
  { id: 'home', titre: 'Accueil', desc: 'Page d\'accueil ABAWI', path: '/', iconKey: 'abawi360' },
  { id: 'abawi360', titre: 'ABAWI 360', desc: 'CRM · Planification · Studio Pro · Disséqueur · Marketing', path: '/abawi360', iconKey: 'abawi360' },
  { id: 'abawiplus', titre: 'ABAWI+', desc: 'Abonnement premium 4 900 F/mois', path: '/digital/pack/abawi-plus', iconKey: 'abawi-plus' },
  { id: 'abawipay', titre: 'Abawi Pay', desc: 'Paiement mobile, transferts, QR sécurisé', path: '/abawi-pay', iconKey: 'abawi-pay' },
  { id: 'plans', titre: 'Plans & Abonnements', desc: 'Tous les plans ABAWI', path: '/plans', iconKey: 'abawi-plus' },
  { id: 'apropos', titre: 'À propos', desc: 'L\'écosystème ABAWI', path: '/a-propos', iconKey: 'abawi360' },
  { id: 'crm', titre: 'CRM ABAWI 360', desc: 'Pipeline & contacts', path: '/abawi360/crm', iconKey: 'crm' },
  { id: 'studio', titre: 'Studio Pro', desc: 'Audio, mastering, transcription', path: '/abawi360/studio-pro', iconKey: 'studio-pro' },
  { id: 'dissecteur', titre: 'Disséqueur d\'infos Élite', desc: 'URL/PDF → fiches, quiz, slides', path: '/abawi360/dissecteur-elite', iconKey: 'dissecteur' },
  { id: 'planif', titre: 'Planification', desc: 'Projets, Gantt, équipes', path: '/abawi360/planification', iconKey: 'planification' },
  { id: 'marketing', titre: 'Marketing 360', desc: 'Campagnes, ROI, réseaux', path: '/abawi360/marketing', iconKey: 'marketing' },
]

// === Catalogue Élite groupé par type ===
const TYPE_META = {
  Guide:     { color: '#F0B429', icon: '📚' },
  Fascicule: { color: '#18A84A', icon: '🎓' },
  Podcast:   { color: '#8B5CF6', icon: '🎧' },
  Outil:     { color: '#3B82F6', icon: '🛠️' },
  Pack:      { color: '#EC4899', icon: '💎' },
  Page:      { color: '#06B6D4', icon: '🧭' },
  Article:   { color: '#22D3EE', icon: '📰' },
  Store:     { color: '#FB923C', icon: '🛒' },
}

const FILTERS = [
  { id: 'all',       label: 'Tout' },
  { id: 'Guide',     label: 'Guides' },
  { id: 'Fascicule', label: 'Academy' },
  { id: 'Podcast',   label: 'Podcasts' },
  { id: 'Outil',     label: 'Outils & IA' },
  { id: 'Article',   label: 'News' },
  { id: 'Store',     label: 'Store' },
  { id: 'Pack',      label: 'Packs' },
  { id: 'Page',      label: 'Pages' },
]

function normalize(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function scoreItem(item, q) {
  const fields = [item.titre, item.desc, item.categorie, item.serie, item.matiere].map(normalize)
  let score = 0
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    if (!f) continue
    if (f === q) score += 100 - i * 5
    else if (f.startsWith(q)) score += 60 - i * 5
    else if (f.includes(' ' + q)) score += 40 - i * 3
    else if (f.includes(q)) score += 25 - i * 2
  }
  return score
}

export default function Search({ onClose }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeIdx, setActiveIdx] = useState(0)
  const [news, setNews] = useState([])
  const [storeItems, setStoreItems] = useState([])
  const inputRef = useRef()
  const navigate = useNavigate()

  // === Lazy-load data depuis Supabase (news + store) ===
  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('news').select('id, ti, ex, slug, tag').eq('statut', 'publié').order('created_at', { ascending: false }).limit(80),
      supabase.from('store_products').select('id, name, description, slug, price').eq('active', true).limit(80).then(r => r.error ? supabase.from('store_products').select('id, name, description, slug, price').limit(80) : r),
    ]).then(([newsRes, storeRes]) => {
      if (cancelled) return
      setNews((newsRes?.data || []).map(n => ({
        id: n.id, titre: n.ti, desc: n.ex, type: 'Article',
        path: '/news/' + (n.slug || n.id), tag: n.tag,
      })))
      setStoreItems((storeRes?.data || []).map(p => ({
        id: p.id, titre: p.name, desc: p.description, type: 'Store',
        path: '/store/' + (p.slug || p.id), prix: p.price,
      })))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // === Index global ===
  const allItems = useMemo(() => {
    const G = (Array.isArray(guides) ? guides : []).map(g => ({
      id: g.id, titre: g.titre, desc: g.description, categorie: g.categorie, prix: g.prix,
      path: '/digital/' + slugify(g.titre), type: 'Guide',
    }))
    const F = (Array.isArray(allFascicules) ? allFascicules : []).map(f => ({
      id: f.id, titre: f.titre, matiere: f.matiere, serie: f.serie, prix: f.prix,
      desc: `${f.matiere || ''} · ${f.serie || ''}`.trim(),
      path: '/academy/' + slugify(f.titre), type: 'Fascicule',
    }))
    const P = (Array.isArray(podcasts) ? podcasts : []).filter(p => p.id !== 'pod-bienvenue').map(p => ({
      id: p.id, titre: p.titre, serie: p.serie, prix: p.prix, desc: p.serie,
      path: '/podcasts/' + slugify(p.titre), type: 'Podcast',
    }))
    const T = TOOLS.map(t => ({ ...t, type: 'Outil' }))
    const PG = PAGES.map(p => ({ ...p, type: 'Page' }))
    const PK = [
      ...(Array.isArray(digitalPacks) ? digitalPacks : []),
      ...(Array.isArray(academyPacks) ? academyPacks : []),
    ].map(p => ({
      id: p.id, titre: p.titre, desc: p.description || p.subtitle, prix: p.prix,
      path: '/digital/pack/' + (p.id || slugify(p.titre || '')), type: 'Pack',
    }))
    return [...G, ...F, ...P, ...T, ...PG, ...PK, ...news, ...storeItems]
  }, [news, storeItems])

  const q = normalize(query.trim())

  const results = useMemo(() => {
    if (q.length < 2) return []
    const pool = filter === 'all' ? allItems : allItems.filter(i => i.type === filter)
    return pool
      .map(item => ({ ...item, _score: scoreItem(item, q) }))
      .filter(i => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 40)
  }, [q, filter, allItems])

  const counts = useMemo(() => {
    const c = { all: 0 }
    allItems.forEach(i => {
      if (q.length < 2) return
      if (scoreItem(i, q) > 0) {
        c.all++
        c[i.type] = (c[i.type] || 0) + 1
      }
    })
    return c
  }, [q, allItems])

  function go(path) { onClose(); navigate(path) }

  function askAI() {
    const url = '/outils/abawi-ia?q=' + encodeURIComponent(query)
    onClose()
    navigate(url)
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      if (results[activeIdx]) go(results[activeIdx].path)
      else if (q.length >= 2) askAI()
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
  useEffect(() => setActiveIdx(0), [query, filter])

  // Group by type for nice section headers
  const grouped = useMemo(() => {
    const m = new Map()
    results.forEach(item => {
      if (!m.has(item.type)) m.set(item.type, [])
      m.get(item.type).push(item)
    })
    return Array.from(m.entries())
  }, [results])

  return (
    <>
      <style>{`
        @keyframes searchModalIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes searchOverlayIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(28px); }
        }
        .abawi-search-input::placeholder {
          color: var(--text-muted, #4A5568);
          opacity: 0.85;
        }
        .abawi-search-modal {
          animation: searchModalIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .abawi-search-overlay {
          animation: searchOverlayIn 0.28s ease both;
        }
        .abawi-search-chip {
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 0.74rem;
          font-weight: 700;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }
        .abawi-search-chip:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--gold-border);
          color: var(--text-primary);
        }
        .abawi-search-chip.is-active {
          background: linear-gradient(135deg, rgba(240,180,41,0.22), rgba(240,180,41,0.1));
          border-color: var(--gold);
          color: var(--gold);
          box-shadow: 0 4px 14px -4px rgba(240,180,41,0.4);
        }
        .abawi-search-chip-count {
          margin-left: 6px;
          padding: 1px 6px;
          border-radius: 100px;
          background: rgba(255,255,255,0.08);
          font-size: 0.62rem;
          font-weight: 800;
        }
        .abawi-search-result {
          display: flex; align-items: center; gap: 14px;
          width: 100%; padding: 12px 22px;
          border: none;
          background: transparent;
          cursor: pointer; text-align: left;
          transition: background 0.14s ease, transform 0.14s ease;
          color: var(--text-primary);
        }
        .abawi-search-result:hover,
        .abawi-search-result.is-active {
          background: linear-gradient(90deg, rgba(240,180,41,0.08), rgba(240,180,41,0.02));
        }
        .abawi-search-result.is-active {
          box-shadow: inset 3px 0 0 var(--gold);
        }
        .abawi-search-section-title {
          padding: 10px 22px 4px;
          font-size: 0.66rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
          background: transparent;
        }
        .abawi-search-ai-cta {
          margin: 16px;
          padding: 14px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(59,130,246,0.12));
          border: 1px solid rgba(139,92,246,0.4);
          color: var(--text-primary);
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
          width: calc(100% - 32px);
          transition: all 0.2s ease;
        }
        .abawi-search-ai-cta:hover {
          background: linear-gradient(135deg, rgba(139,92,246,0.28), rgba(59,130,246,0.2));
          transform: translateY(-1px);
          box-shadow: 0 12px 30px -10px rgba(139,92,246,0.5);
        }
      `}</style>

      <div
        className="abawi-search-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 2147483647,
          background: 'color-mix(in srgb, var(--bg-primary, #070B0F) 55%, transparent)',
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 'min(80px, 8vh)',
          paddingLeft: 16, paddingRight: 16,
        }}
      >
        <div
          className="abawi-search-modal"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 760,
            background: 'color-mix(in srgb, var(--bg-card, #0D1117) 78%, transparent)',
            border: '1px solid color-mix(in srgb, var(--gold) 22%, var(--border))',
            borderRadius: 22,
            overflow: 'hidden',
            backdropFilter: 'blur(36px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(36px) saturate(1.5)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.55), ' +
              '0 0 0 1px rgba(255,255,255,0.04), ' +
              '0 0 50px -10px color-mix(in srgb, var(--gold) 30%, transparent)',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'min(80vh, 720px)',
          }}
        >
          {/* Halo intérieur or */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--gold) 10%, transparent) 0%, transparent 60%)',
          }} />

          {/* === Header / Input === */}
          <div style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            background: 'transparent',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(240,180,41,0.2), rgba(240,180,41,0.08))',
              border: '1px solid rgba(240,180,41,0.4)',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            <input
              ref={inputRef}
              className="abawi-search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Recherchez guides, fascicules, podcasts, outils, news, store…"
              autoComplete="off" autoCorrect="off" spellCheck="false"
              style={{
                flex: 1, minWidth: 0,
                background: 'transparent',
                border: 'none', outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                lineHeight: 1.4,
                fontFamily: 'inherit',
                fontWeight: 500,
                caretColor: 'var(--gold)',
              }}
            />

            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                title="Effacer"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
                  fontSize: '0.8rem',
                }}
              >✕</button>
            )}

            <kbd style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              flexShrink: 0,
            }}>Esc</kbd>
          </div>

          {/* === Filtres chips === */}
          {q.length >= 2 && (
            <div style={{
              display: 'flex', gap: 8, padding: '12px 22px',
              borderBottom: '1px solid var(--border)',
              overflowX: 'auto',
              flexShrink: 0,
              scrollbarWidth: 'thin',
            }}>
              {FILTERS.map(f => {
                const cnt = f.id === 'all' ? counts.all : counts[f.id] || 0
                if (f.id !== 'all' && cnt === 0) return null
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`abawi-search-chip ${filter === f.id ? 'is-active' : ''}`}
                  >
                    {f.label}
                    {cnt > 0 && <span className="abawi-search-chip-count">{cnt}</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* === Résultats === */}
          <div style={{
            overflowY: 'auto', flex: 1,
            background: 'transparent',
            position: 'relative',
          }}>
            {q.length < 2 && (
              <div style={{ padding: '40px 22px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 10, opacity: 0.7 }}>🔎</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', margin: '0 0 6px', fontWeight: 600 }}>
                  Tapez pour rechercher
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                  Guides · Fascicules · Podcasts · Outils & IA · News · Store · Pages
                </p>

                <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {['Business plan', 'Photo identité', 'Pitch deck', 'CV ATS', 'OHADA', 'Bac S1'].map(s => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="abawi-search-chip"
                      style={{ fontSize: '0.72rem' }}
                    >🔍 {s}</button>
                  ))}
                </div>
              </div>
            )}

            {q.length >= 2 && results.length === 0 && (
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🤖</div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.98rem', margin: '0 0 6px', fontWeight: 700 }}>
                  Aucun résultat dans le catalogue
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 18px' }}>
                  Demandez à Abawi IA — elle recherchera et expliquera pour vous.
                </p>
                <button onClick={askAI} className="abawi-search-ai-cta" style={{ width: 'auto', margin: 0, display: 'inline-flex' }}>
                  <span style={{ fontSize: '1.3rem' }}>✨</span>
                  <span style={{ fontWeight: 800 }}>Demander à Abawi IA</span>
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>→</span>
                </button>
              </div>
            )}

            {grouped.map(([type, items], gi) => {
              const meta = TYPE_META[type] || { color: 'var(--gold)', icon: '·' }
              return (
                <div key={type}>
                  <div className="abawi-search-section-title">
                    <span style={{ color: meta.color }}>●</span> {type === 'Guide' ? 'Guides ABAWI Digital' : type === 'Fascicule' ? 'Academy' : type === 'Podcast' ? 'Podcasts' : type === 'Outil' ? 'Outils & IA' : type === 'Article' ? 'News' : type === 'Store' ? 'Store IT' : type === 'Pack' ? 'Packs' : 'Pages du site'} <span style={{ color: 'var(--text-muted)' }}>· {items.length}</span>
                  </div>
                  {items.map((item) => {
                    const idx = results.indexOf(item)
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => go(item.path)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`abawi-search-result ${activeIdx === idx ? 'is-active' : ''}`}
                      >
                        <span style={{
                          width: 40, height: 40, borderRadius: 11,
                          background: meta.color + '18',
                          border: `1px solid ${meta.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', flexShrink: 0,
                        }}>{meta.icon}</span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.94rem', fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginBottom: 2,
                          }}>{item.titre}</div>
                          {item.desc && (
                            <div style={{
                              fontSize: '0.76rem', color: 'var(--text-muted)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{item.desc}</div>
                          )}
                        </div>

                        {item.prix > 0 && (
                          <span style={{
                            fontSize: '0.78rem', fontWeight: 800,
                            color: 'var(--gold)',
                            background: 'rgba(240,180,41,0.12)',
                            border: '1px solid rgba(240,180,41,0.25)',
                            padding: '4px 10px', borderRadius: 100, flexShrink: 0,
                          }}>{Number(item.prix).toLocaleString('fr-FR')} F</span>
                        )}
                        {item.prix === 0 && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, color: '#18A84A',
                            background: 'rgba(24,168,74,0.1)',
                            border: '1px solid rgba(24,168,74,0.25)',
                            padding: '4px 10px', borderRadius: 100, flexShrink: 0,
                          }}>GRATUIT</span>
                        )}
                      </button>
                    )
                  })}
                  {gi < grouped.length - 1 && (
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 0', opacity: 0.5 }} />
                  )}
                </div>
              )
            })}

            {/* CTA IA quand il y a des résultats — pour aller plus loin */}
            {q.length >= 2 && results.length > 0 && (
              <button onClick={askAI} className="abawi-search-ai-cta">
                <span style={{ fontSize: '1.4rem' }}>✨</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Approfondir avec Abawi IA</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Pose la question complète à l'IA pour explication, comparaison ou recommandation
                  </div>
                </div>
                <span style={{ color: 'var(--gold)', fontWeight: 900 }}>→</span>
              </button>
            )}
          </div>

          {/* === Footer === */}
          <div style={{
            padding: '10px 22px',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'transparent',
            flexShrink: 0,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <span><kbd style={kbdS}>↑↓</kbd> naviguer</span>
              <span><kbd style={kbdS}>↵</kbd> ouvrir</span>
              <span><kbd style={kbdS}>Esc</kbd> fermer</span>
            </div>
            <span>
              {q.length >= 2 ? `${results.length} résultat${results.length > 1 ? 's' : ''} sur ${allItems.length}` : `${allItems.length} éléments indexés`}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

const kbdS = {
  padding: '1px 6px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)',
  fontFamily: 'inherit',
  fontSize: '0.66rem',
  fontWeight: 700,
}

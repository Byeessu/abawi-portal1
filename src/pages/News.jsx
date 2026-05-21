import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './News.css'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'

import { MARKET_DATA, DEMO_NEWS } from '../data/news'
import { tagStyle } from '../lib/newsUtils'
import NewsCard from '../components/NewsCard'
import { cleanIAText } from '../lib/cleanText'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'

function News() {
  const { isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [viewport, setViewport] = useState(() => ({
    mobile: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
    compact: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  }))

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error } = await supabase
          .from('articles').select('*').eq('pr', true)
          .order('created_at', { ascending: false })
        const parseField = (val, field) => {
          if (!val) return ''
          let s = String(val).trim()
          for (let depth = 0; depth < 4; depth++) {
            if (!s.startsWith('{') && !s.startsWith('[')) break
            try {
              const obj = JSON.parse(s)
              const next = obj[field] ?? obj.ti ?? obj.su ?? null
              if (next == null) break
              s = String(next).trim()
            } catch { break }
          }
          return s
        }
        const smartTruncate = (text, maxLen) => {
          if (!text || text.length <= maxLen) return text
          const truncated = text.slice(0, maxLen)
          const lastSpace = truncated.lastIndexOf(' ')
          if (lastSpace > maxLen * 0.8) return truncated.slice(0, lastSpace) + '...'
          return truncated + '...'
        }
        const normalize = (a) => {
          let base = a
          if (typeof a?.ti === 'string' && a.ti.trim().startsWith('{')) {
            try { const p = JSON.parse(a.ti); base = { ...a, ...p } } catch { /* ignore */ }
          }
          const stripJsonArtifacts = (text) => {
            return text
              .replace(/\{"ti":"/g, '')
              .replace(/","su":"/g, ' ')
              .replace(/"\}/g, '')
              .replace(/\[ti\]/gi, '')
              .replace(/\[su\]/gi, '')
              .replace(/\\"/g, '"')
              .replace(/\\n/g, ' ')
              .replace(/\\t/g, ' ')
              .replace(/\\/g, '')
          }
          const cleanTitle = stripJsonArtifacts(parseField(base?.ti, 'ti'))
            .replace(/[\u2800-\u28FF]/g, '')
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/["{}[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
          const cleanSub = stripJsonArtifacts(parseField(base?.su, 'su'))
            .replace(/[\u2800-\u28FF]/g, '')
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/["{}[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
          return {
            ...base,
            ti: smartTruncate(cleanIAText(cleanTitle), 90),
            su: smartTruncate(cleanIAText(cleanSub), 280),
          }
        }
        if (error || !data || data.length === 0) {
          setArticles(DEMO_NEWS.map(normalize))
        } else {
          const seen = new Set()
          const unique = data.filter(a => {
            const key = (a.ti || '').toLowerCase().trim()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setArticles(unique.map(normalize))
        }
      } catch {
        setArticles(DEMO_NEWS)
      }
      setLoading(false)
    }
    fetchArticles()
  }, [isAdmin])

  async function handleDeleteArticle(id) {
    if (!confirm('Supprimer cet article ?')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) {
      setToast({ type: 'error', text: '❌ Erreur suppression' })
    } else {
      setArticles(articles.filter(a => a.id !== id))
      setToast({ type: 'success', text: '✅ Article supprimé' })
    }
    setTimeout(() => setToast(null), 4000)
  }

  function AdminCardWrap({ article, featured, children }) {
    if (!isAdmin) return children
    return (
      <div style={{ position: 'relative' }}>
        {children}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteArticle(article.id); }}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            padding: '4px 10px', borderRadius: 6, border: '1px solid #EF4444',
            background: 'rgba(239,68,68,0.9)', color: '#fff',
            cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
          }}
        >🗑️ Supprimer</button>
      </div>
    )
  }

  useEffect(() => {
    function onResize() {
      setViewport({
        mobile: window.innerWidth < 640,
        compact: window.innerWidth < 1024,
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const allTags = [...new Set(articles.map(a => a.tag).filter(Boolean))]
  const filtered = catFilter === 'all' ? articles : articles.filter(a => a.tag === catFilter)
  const featured = filtered[0]
  const secondary = filtered.slice(1, 3)
  const rest = filtered.slice(3)

  const STRATEGIC = ['Economie', 'Tech', 'Finance', 'Telecom', 'Geopolitique', 'Business']
  const moreTags = allTags.filter(t => !STRATEGIC.includes(t))
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef(null)

  useEffect(() => {
    function onClick(e) { if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <main className="news-page">
      <SEO
        title="Actualités Économiques Afrique — ABAWI"
        description="Toute l'actualité économique, business et technologique pour l'Afrique de l'Ouest : analyses, tendances et opportunités."
        keywords="actualités Afrique, business Afrique, économie Sénégal, tech Afrique, marché UEMOA, BCEAO, startups africaines"
        image="/abawi-og-banner.jpg"
      />
      <section className="news-hero">
        <ParticlesBackground count={30} color="#18A84A" linkDistance={110} opacity={0.18} />
        <GradientOrbs variant="green" intensity={0.2} count={2} />
        <div className="news-hero-content">
          <SectionReveal delay={0}>
            <span className="news-hero-eyebrow">
              <span className="news-live-dot" />
              EN DIRECT ABAWI NEWS
            </span>
          </SectionReveal>
          <SectionReveal delay={100}>
            <h1 className="news-hero-title">
              Actualite <span className="news-hero-glow">Economique</span><br />
              et Business Africain
            </h1>
          </SectionReveal>
          <SectionReveal delay={200}>
            <p className="news-hero-sub">
              L essentiel de l info business, tech et finance pour les acteurs economiques africains
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="news-ticker">
        <div className="news-ticker-track">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="news-ticker-item">
              <span className="news-ticker-label">{m.label}</span>
              <span className="news-ticker-value">{m.value}</span>
              <span className={`news-ticker-change ${m.up ? 'up' : 'down'}`}>{m.change}</span>
            </span>
          ))}
        </div>
      </section>

      <nav className="news-cats">
        <button
          className={`news-cat ${catFilter === 'all' ? 'news-cat--active' : ''}`}
          onClick={() => setCatFilter('all')}
        >
          <span className="news-cat-label">Tous</span>
          <span className="news-cat-count">{articles.length}</span>
        </button>
        {STRATEGIC.filter(t => allTags.includes(t)).map(tag => {
          const ts = tagStyle(tag)
          const active = catFilter === tag
          return (
            <button
              key={tag}
              className={`news-cat ${active ? 'news-cat--active' : ''}`}
              onClick={() => setCatFilter(tag)}
              style={active ? { borderColor: ts.bg, background: `${ts.bg}20`, color: ts.bg } : {}}
            >
              <span className="news-cat-label">{tag}</span>
            </button>
          )
        })}
        {moreTags.length > 0 && (
          <div className="news-cat-dropdown" ref={moreRef}>
            <button
              className={`news-cat ${moreTags.includes(catFilter) ? 'news-cat--active' : ''}`}
              onClick={() => setShowMore(v => !v)}
            >
              <span className="news-cat-label">Plus</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 4, transform: showMore ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {showMore && (
              <div className="news-cat-dropdown-menu">
                {moreTags.map(tag => {
                  const ts = tagStyle(tag)
                  const active = catFilter === tag
                  return (
                    <button
                      key={tag}
                      className={`news-cat-dropdown-item ${active ? 'news-cat-dropdown-item--active' : ''}`}
                      onClick={() => { setCatFilter(tag); setShowMore(false) }}
                      style={active ? { borderLeft: `3px solid ${ts.bg}`, background: `${ts.bg}12`, color: ts.bg } : {}}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="news-wrapper">
        {loading && (
          <div className="news-loading">
            <div className="news-spinner" />
            <p>Chargement des articles</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="news-empty">Aucun article dans cette categorie.</div>
        )}

        {!loading && featured && (
          <div className="news-featured-area">
            <AdminCardWrap article={featured} featured>
              <NewsCard article={featured} featured={true} />
            </AdminCardWrap>
          </div>
        )}

        {!loading && (secondary.length > 0 || rest.length > 0) && (
          <div className="news-grid">
            {[...secondary, ...rest].map(a => (
              <AdminCardWrap key={a.id} article={a}>
                <NewsCard article={a} />
              </AdminCardWrap>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && !featured && (
          <div className="news-grid">
            {filtered.map(a => (
              <AdminCardWrap key={a.id} article={a}>
                <NewsCard article={a} />
              </AdminCardWrap>
            ))}
          </div>
        )}
      </div>

      <section className="news-newsletter">
        <div className="news-newsletter-inner">
          <div className="news-newsletter-text">
            <h3>Recevez les meilleures infos business</h3>
            <p>Un resume hebdomadaire des actualites economiques africaines, directement dans votre boite mail.</p>
          </div>
          <form className="news-newsletter-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Votre adresse email" required />
            <button type="submit">S inscrire</button>
          </form>
        </div>
      </section>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 10,
          background: toast.type === 'error' ? '#EF4444' : '#10B981', color: '#fff',
          fontWeight: 700, fontSize: '0.85rem', zIndex: 3000,
        }}>{toast.text}</div>
      )}
    </main>
  )
}

export default News

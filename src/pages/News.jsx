import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './News.css'
import { Link } from 'react-router-dom'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'

import { MARKET_DATA, DEMO_NEWS } from '../data/news';
import { normalizeArticle, tagStyle } from '../lib/newsUtils';
import NewsCard from '../components/NewsCard';
import { cleanIAText } from '../lib/cleanText';

function News() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
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
        // Some legacy rows store double-encoded JSON, e.g. `ti = '{"ti":"{"ti":"..."}"}'`.
        // We unwrap up to 4 levels until we land on a plain string.
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
            } catch {
              break
            }
          }
          return s
        }
        // Tronquage intelligent sans couper les mots
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
            // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
            try { const p = JSON.parse(a.ti); base = { ...a, ...p } } catch {}
          }
          // Nettoyer d'abord les caractères parasites
          const stripJsonArtifacts = (text) => {
            // Supprimer les résidus JSON comme {"ti":"...", "su":"..."}
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
            .replace(/[\u2800-\u28FF]/g, '') // Braille
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '') // Diacritiques isolés
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Contrôle
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Invisibles
            .replace(/["{}\[\]]/g, '') // Caractères JSON résiduels
            .replace(/\s+/g, ' ') // Espaces multiples
            .trim()
          const cleanSub = stripJsonArtifacts(parseField(base?.su, 'su'))
            .replace(/[\u2800-\u28FF]/g, '')
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/["{}\[\]]/g, '') // Caractères JSON résiduels
            .replace(/\s+/g, ' ')
            .trim()
          
          // Appliquer cleanIAText après nettoyage des caractères parasites
          return {
            ...base,
            ti: smartTruncate(cleanIAText(cleanTitle), 85),
            su: smartTruncate(cleanIAText(cleanSub), 145),
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
        const smartTruncate = (text, maxLen) => {
          if (!text || text.length <= maxLen) return text
          const truncated = text.slice(0, maxLen)
          const lastSpace = truncated.lastIndexOf(' ')
          if (lastSpace > maxLen * 0.8) return truncated.slice(0, lastSpace) + '...'
          return truncated + '...'
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
        setArticles(DEMO_NEWS.map((a) => { 
          const cleanTitle = stripJsonArtifacts(a.ti)
            .replace(/[\u2800-\u28FF]/g, '')
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/["{}\[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
          const cleanSub = stripJsonArtifacts(a.su)
            .replace(/[\u2800-\u28FF]/g, '')
            .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/["{}\[\]]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
          return { 
            ...a, 
            ti: smartTruncate(cleanIAText(cleanTitle), 85), 
            su: smartTruncate(cleanIAText(cleanSub), 145) 
          }
        }))
      }
      setLoading(false)
    }
    fetchArticles()
  }, [])

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

  const featuredTs = featured ? tagStyle(featured.tag) : { bg: '#F0B429', text: '#070B0F' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(155deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 70%, var(--green) 30%) 50%, var(--bg-primary) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: viewport.mobile ? '40px 20px 32px' : '60px 24px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <ParticlesBackground count={35} color="#18A84A" linkDistance={110} opacity={0.2} />
        <GradientOrbs variant="green" intensity={0.25} count={2} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, var(--green), transparent)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionReveal delay={0}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: '0.7rem', fontWeight: 800, color: 'var(--green)',
              letterSpacing: '3px', textTransform: 'uppercase',
              background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.25)',
              padding: '5px 16px', borderRadius: 100, marginBottom: 18,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'news-blink 1.5s ease-in-out infinite', display: 'inline-block' }} />
              EN DIRECT — ABAWI NEWS
            </div>
          </SectionReveal>
          <SectionReveal delay={100}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900,
              color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.1,
            }}>
              Actualité <span style={{ color: 'var(--green)', textShadow: '0 0 28px rgba(24,168,74,0.4)' }}>Économique</span><br />
              & Business Africain
            </h1>
          </SectionReveal>
          <SectionReveal delay={200}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.55 }}>
              L'essentiel de l'info business, tech et finance pour les acteurs économiques africains
            </p>
          </SectionReveal>
        </div>
        <style>{`@keyframes news-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>

      {/* TICKER MARCHÉS */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, var(--bg-card), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, var(--bg-card), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{
          display: 'flex', gap: 0, whiteSpace: 'nowrap',
          animation: 'ticker 32s linear infinite',
          padding: '10px 0',
        }}>
          {[...MARKET_DATA, ...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 800 }}>{m.value}</span>
              <span style={{ fontSize: '0.72rem', color: m.up ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{m.change}</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
      </div>

      {/* FILTRES PAR TAG */}
      <div style={{
        display: 'flex', gap: 8, padding: '18px 24px', overflowX: 'auto',
        borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--bg-primary) 85%, var(--bg-card))',
        scrollbarWidth: 'none',
        justifyContent: 'flex-start',
      }}>
        <button onClick={() => setCatFilter('all')} style={{
          flexShrink: 0, padding: '7px 18px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700,
          background: catFilter === 'all' ? 'var(--green)' : 'transparent',
          border: `1px solid ${catFilter === 'all' ? 'var(--green)' : 'var(--border)'}`,
          color: catFilter === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)', cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}>Tous ({articles.length})</button>
        {allTags.map(tag => {
          const ts = tagStyle(tag)
          const active = catFilter === tag
          return (
            <button key={tag} onClick={() => setCatFilter(tag)} style={{
              flexShrink: 0, padding: '7px 18px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700,
              background: active ? ts.bg : 'transparent',
              border: `1px solid ${active ? ts.bg : 'var(--border)'}`,
              color: active ? ts.text : 'var(--text-secondary)', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{tag}</button>
          )
        })}
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: viewport.mobile ? '24px 14px 56px' : '36px 24px 80px' }}>
        {loading && (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(24,168,74,0.2)', borderTopColor: '#18A84A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            Chargement des articles...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucun article dans cette catégorie.
          </div>
        )}

        {/* Article à la UNE */}
        {!loading && featured && (
          <div style={{ marginBottom: 32 }}>
            <NewsCard article={featured} featured={true} />
          </div>
        )}

        {/* Articles secondaires + reste en grille */}
        {!loading && (secondary.length > 0 || rest.length > 0) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewport.mobile ? '1fr' : viewport.compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: viewport.mobile ? 14 : 20,
          }}>
            {[...secondary, ...rest].map(a => <NewsCard key={a.id} article={a} />)}
          </div>
        )}

        {/* Si pas de featured mais articles */}
        {!loading && filtered.length > 0 && !featured && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewport.mobile ? '1fr' : viewport.compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: viewport.mobile ? 14 : 20,
          }}>
            {filtered.map(a => <NewsCard key={a.id} article={a} />)}
          </div>
        )}
      </div>
    </main>
  )
}

export default News

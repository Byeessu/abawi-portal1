import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { slugify } from '../../data/products'
import './DetailPage.css'
import { cleanIAText } from '../../lib/cleanText'
import { Link } from 'react-router-dom'
import ShareButtons from '../../components/ShareButtons'

const TAG_COLORS = {
  'Digital': { bg: '#1BA8F5', text: '#fff' },
  'Business': { bg: '#F0B429', text: '#070B0F' },
  'Finance': { bg: '#18A84A', text: '#fff' },
  'Innovation': { bg: '#8B5CF6', text: '#fff' },
  'Éducation': { bg: '#F97316', text: '#fff' },
  'Tech': { bg: '#06B6D4', text: '#fff' },
  'Afrique': { bg: '#EF4444', text: '#fff' },
  'Économie': { bg: '#10B981', text: '#fff' },
  'Géopolitique': { bg: '#6366F1', text: '#fff' },
  'Télécom': { bg: '#EC4899', text: '#fff' },
}

function tagStyle(tag) {
  if (!tag) return { bg: '#6366F1', text: '#fff' }
  // Try exact match first
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  // Try case-insensitive
  const key = Object.keys(TAG_COLORS).find(k => k.toLowerCase() === tag.toLowerCase())
  return key ? TAG_COLORS[key] : { bg: '#6366F1', text: '#fff' }
}

// Some legacy rows store `ti` as a JSON-encoded payload like '{"ti":"…"}'.
// Unwrap up to 4 levels so the resulting slug matches the one computed on
// the news listing (which goes through the same normalization).
function unwrapTitle(raw) {
  if (!raw) return ''
  let s = String(raw).trim()
  for (let depth = 0; depth < 4; depth++) {
    if (!s.startsWith('{') && !s.startsWith('[')) break
    try {
      const obj = JSON.parse(s)
      const next = obj.ti ?? obj.su ?? null
      if (next == null) break
      s = String(next).trim()
    } catch {
      break
    }
  }
  return s
}

function slugFromTitle(ti) {
  return slugify(unwrapTitle(ti))
}

function makeDetailVisual(article) {
  if (article?.cover_url) return article.cover_url
  const ts = tagStyle(article?.tag)
  const title = String(article?.ti || 'ABAWI NEWS').slice(0, 62)
  // Ligne breaker intelligent pour titre long
  const words = title.split(' ')
  let line1 = '', line2 = ''
  let currentLen = 0
  const mid = Math.ceil(words.length / 2)
  for (let i = 0; i < words.length; i++) {
    if (i < mid) {
      line1 += (line1 ? ' ' : '') + words[i]
    } else {
      line2 += (line2 ? ' ' : '') + words[i]
    }
  }
  const y2 = line2 ? 220 : 160
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${ts.bg}"/>
        <stop offset="100%" stop-color="#070B0F"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
    </defs>
    <rect width="1200" height="680" fill="url(#g)"/>
    <circle cx="1000" cy="120" r="200" fill="${ts.bg}" opacity="0.15" filter="url(#blur)"/>
    <circle cx="150" cy="550" r="150" fill="${ts.bg}" opacity="0.1" filter="url(#blur)"/>
    <text x="64" y="160" fill="rgba(255,255,255,0.95)" font-family="${SVG_FONT}" font-size="40" font-weight="800">${escapeXml(line1)}</text>
    ${line2 ? `<text x="64" y="215" fill="rgba(255,255,255,0.90)" font-family="${SVG_FONT}" font-size="36" font-weight="700">${escapeXml(line2)}</text>` : ''}
    <text x="64" y="${y2 + 55}" fill="rgba(255,255,255,0.6)" font-family="${SVG_FONT}" font-size="20" font-weight="500">${escapeXml(article?.tag || 'Actualité')}</text>
    <rect x="0" y="630" width="1200" height="50" fill="rgba(7,11,15,0.5)"/>
    <text x="64" y="662" fill="rgba(255,255,255,0.5)" font-family="${SVG_FONT}" font-size="16" font-weight="600">ABAWI NEWS • Business · Finance · Tech · Afrique</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// Font stack universel pour SVG multi-plateforme
const SVG_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

function stripJsonArtifacts(text) {
  if (!text) return ''
  return String(text)
    .replace(/\{"ti":"/g, '')
    .replace(/","su":"/g, ' ')
    .replace(/"\}/g, '')
    .replace(/\[ti\]/gi, '')
    .replace(/\[su\]/gi, '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\/g, '')
    .replace(/\{"v":"/g, '')
    .replace(/","t":"/g, ' ')
    .replace(/"\}$/g, '')
}

function escapeXml(value) {
  if (!value) return ''
  return String(value)
    // Nettoyer caractères parasites, contrôle, et zéro-width
    // eslint-disable-next-line no-control-regex -- Control character is intentionally matched (sanitization regex)
    .replace(/[\u0000-\u001F\u007F-\u009F\uFFFD\u200B-\u200D\uFEFF\u2060-\u206F]/g, '')
    // Caractères de remplacement et autres symboles problématiques
    .replace(/[\uFFFE\uFFFF]/g, '')
    // Caractères Unicode parasites (Braille, diacritiques isolés)
    .replace(/[\u2800-\u28FF]/g, '')
    .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
    // Émojis problématiques qui peuvent causer des artefacts
    .replace(/[👁‍🗨👁‍🗨️]/g, '👁️')
    // Échapper XML standard
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    // Normaliser espaces (espaces insécables, etc.)
    .replace(/[\s\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]+/g, ' ')
    .trim()
}

// Fonction de nettoyage complète pour les textes
function fullCleanText(text) {
  if (!text) return ''
  let cleaned = stripJsonArtifacts(text)
    .replace(/[\u2800-\u28FF]/g, '')
    .replace(/[\u0300-\u036F\u1DC0-\u1DFF]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/["{}\[\]]/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleanIAText(cleaned)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeRenderedHtml(html) {
  let cleaned = String(html ?? '')
    // Caractères de contrôle et parasites
    // eslint-disable-next-line no-control-regex -- Control character is intentionally matched (sanitization regex)
    .replace(/[\u0000-\u001F\u007F-\u009F\uFFFD\u200B-\u200D\uFEFF]/g, '')
    // Astérisques markdown parasites
    .replace(/[_$*]{2,}/g, ' ')
    // Double espaces
    .replace(/\s+/g, ' ')
  
  // Nettoyer les balises br vides ou cassées
  cleaned = cleaned.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br/>')
  
  return cleaned.trim()
}

function NewsCardMini({ article }) {
  const ts = tagStyle(article.tag)
  return (
    <Link to={`/news/${slugFromTitle(fullCleanText(article?.ti))}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: '#0D1117', border: '1px solid #1A2332', borderRadius: 14,
          overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = ts.bg + '60'; e.currentTarget.style.transform = 'translateY(-4px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1A2332'; e.currentTarget.style.transform = 'none' }}
      >
        <div style={{ height: 120, background: `linear-gradient(135deg, ${ts.bg}20, ${ts.bg}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {article.cover_url
            ? <img src={article.cover_url} alt={article.ti} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.5 }} />
            : null
          }
          <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 100, background: ts.bg, color: ts.text, fontSize: '0.68rem', fontWeight: 800 }}>{article.tag}</div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {fullCleanText(article?.ti)}
          </h4>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{article.dt || (article.created_at && new Date(article.created_at).toLocaleDateString('fr-FR'))}</span>
        </div>
      </div>
    </Link>
  )
}

function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Essayer de charger depuis Supabase
        const { data, error: supabaseError } = await supabase
          .from('articles')
          .select('*')
          .eq('pr', true)
          .order('created_at', { ascending: false })
          .limit(200)

        if (supabaseError) {
          console.error('Erreur Supabase:', supabaseError)
          setError('Impossible de charger les articles')
          setLoading(false)
          return
        }

        if (data && data.length > 0) {
          // Chercher l'article par slug (plusieurs méthodes de fallback)
          let found = data.find(a => slugFromTitle(a.ti) === slug)

          // Fallback 1: slug avec cleanIAText
          if (!found) {
            found = data.find(a => slugFromTitle(cleanIAText(a.ti || '')) === slug)
          }

          // Fallback 2: correspondance partielle du slug
          if (!found) {
            found = data.find(a => {
              const articleSlug = slugFromTitle(a.ti || '')
              return articleSlug.includes(slug) || slug.includes(articleSlug)
            })
          }

          // Fallback 3: recherche par titre similaire
          if (!found) {
            const slugWords = slug.split('-').filter(w => w.length > 2)
            found = data.find(a => {
              const titleWords = (a.ti || '').toLowerCase().split(/\s+/)
              return slugWords.some(sw => titleWords.some(tw => tw.includes(sw) || sw.includes(tw)))
            })
          }

          if (found) {
            setArticle(found)
            setSimilar(data.filter(a => a.tag === found.tag && a.id !== found.id).slice(0, 3))
          } else {
            console.warn('Article non trouvé pour le slug:', slug)
            console.log('Slugs disponibles:', data.slice(0, 10).map(a => slugFromTitle(a.ti)))
          }
        } else {
          setError('Aucun article disponible')
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
        setError('Erreur de chargement')
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
      <div>Chargement...</div>
    </main>
  )

  if (!article) return (
    <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--bg-primary)', gap: 16, padding: '40px 20px' }}>
      <div style={{ fontSize: '3rem' }}>{error ? '⚠️' : '😕'}</div>
      <h2 style={{ color: 'var(--text-primary)', textAlign: 'center' }}>{error || 'Article non trouvé'}</h2>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
        {error ? 'Une erreur est survenue lors du chargement. Veuillez réessayer.' : 'L\'article que vous recherchez n\'existe pas ou a été déplacé.'}
      </p>
      <Link to="/news" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 700, marginTop: '10px' }}>← Retour aux actualités</Link>
    </main>
  )

  const ts = tagStyle(article.tag)
  const safeTitle = fullCleanText(article?.ti)
  const safeSubtitle = fullCleanText(article?.su)
  const safeArticle = { ...article, ti: safeTitle, su: safeSubtitle }

  // Parse content — handle both HTML and JSON blocks
  let htmlContent = ''
  if (article.co) {
    // If it's HTML content (from the new editor)
    if (article.co.includes('<') || article.co.includes('&')) {
      htmlContent = sanitizeRenderedHtml(stripJsonArtifacts(article.co))
    } else {
      htmlContent = `<p>${escapeHtml(fullCleanText(article.co))}</p>`
    }
  } else if (article.bd) {
    // Legacy JSON blocks
    let blocks = []
    try { blocks = typeof article.bd === 'string' ? JSON.parse(article.bd) : (article.bd || []) } catch { blocks = [] }
    htmlContent = blocks.map(block => {
      if (block.t === 'p') return `<p>${escapeHtml(fullCleanText(block.v))}</p>`
      if (block.t === 'q') {
        const main = escapeHtml(fullCleanText(block.v))
        const cite = block.sr ? `<cite>— ${escapeHtml(fullCleanText(block.sr))}</cite>` : ''
        return `<blockquote>${main}${cite}</blockquote>`
      }
      if (block.t === 'v') return `<div class="article-highlight">${escapeHtml(fullCleanText(block.v))}</div>`
      return ''
    }).join('')
  }

  htmlContent = sanitizeRenderedHtml(stripJsonArtifacts(htmlContent))

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(14px, 4vw, 24px) 80px' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '20px 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/news" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
            Actualités
          </Link>
          <span>/</span>
          <span style={{ color: ts.bg }}>{article.tag}</span>
        </div>

        {/* Article header */}
        <div style={{
          background: `linear-gradient(135deg, ${ts.bg}15, transparent)`,
          border: `1px solid ${ts.bg}20`,
          borderRadius: 20, padding: 'clamp(18px, 3vw, 32px)', marginBottom: 40,
        }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 100,
            background: ts.bg, color: ts.text,
            fontSize: '0.72rem', fontWeight: 800, marginBottom: 16,
          }}>{article.tag}</span>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900,
            color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 16,
          }}>{safeTitle}</h1>

          {article.su && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 20 }}>{safeSubtitle}</p>
          )}

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {(article.dt || article.created_at) && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📅 {article.dt || new Date(article.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {article.rt && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>⏱ {article.rt} de lecture</span>
            )}
            {article.au && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>✍️ {article.au}</span>
            )}
          </div>
        </div>

        {/* Cover image */}
        <img src={makeDetailVisual(safeArticle)} alt={safeTitle} style={{
          width: '100%', borderRadius: 16, marginBottom: 40,
          maxHeight: 420, objectFit: 'cover', border: `1px solid ${ts.bg}30`,
        }} />

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.9' }}
        />

        <style>{`
          .article-content h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 32px 0 16px; }
          .article-content h3 { font-size: 1.2rem; font-weight: 700; color: ${ts.bg}; margin: 24px 0 12px; }
          .article-content p { margin-bottom: 20px; }
          .article-content blockquote {
            border-left: 4px solid ${ts.bg}; padding: 16px 24px;
            background: ${ts.bg}0A; border-radius: 0 12px 12px 0;
            margin: 24px 0; color: var(--text-primary); font-style: italic;
          }
          .article-content blockquote cite { display: block; font-size: 0.82rem; color: var(--text-secondary); margin-top: 8px; font-style: normal; }
          .article-content ul, .article-content ol { padding-left: 24px; margin-bottom: 20px; }
          .article-content li { margin-bottom: 8px; color: var(--text-secondary); }
          .article-content a { color: ${ts.bg}; text-decoration: underline; }
          .article-content strong { color: var(--text-primary); font-weight: 700; }
          .article-content img { max-width: 100%; width: 100%; height: auto; border-radius: 12px; margin: 24px 0; display: block; object-fit: contain; }
          .article-content .article-highlight {
            background: ${ts.bg}10; border: 1px solid ${ts.bg}25;
            border-radius: 12px; padding: 16px 20px; margin: 20px 0;
            color: ${ts.bg}; font-weight: 600;
          }
        `}</style>

        {/* Share */}
        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #1A2332' }}>
          <ShareButtons titre={safeTitle} type="article" />
        </div>

        {/* Articles similaires */}
        {similar.length > 0 && (
          <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
              Articles similaires
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {similar.map(a => <NewsCardMini key={a.id} article={a} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticleDetail

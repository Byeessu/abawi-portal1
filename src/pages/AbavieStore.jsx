import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'

const CATS = [
  { id: 'Tous', label: 'Tous', icon: '🏥' },
  { id: 'TENUE MEDICALE', label: 'Tenues médicales', icon: '🥼' },
  { id: 'MATERIEL LEGER', label: 'Matériel léger', icon: '🩺' },
  { id: 'MATERIEL SEMI-LOURD', label: 'Matériel semi-lourd', icon: '🔬' },
  { id: 'MATERIEL LOURD', label: 'Matériel lourd', icon: '🏥' },
  { id: 'CONSOMMABLE', label: 'Consommables', icon: '💉' },
  { id: 'MOBILIER', label: 'Mobilier médical', icon: '🛏️' },
]

function formatP(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

function getStockLabel(stock) {
  if (stock === null || stock === undefined) return null
  if (stock === 0) return { label: 'Rupture', cls: 'abs-out' }
  if (stock <= 3) return { label: 'Derniers', cls: 'abs-low' }
  return { label: 'En stock', cls: 'abs-ok' }
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ aspectRatio: '4/3', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ padding: '14px 16px', display: 'grid', gap: 8 }}>
        <div style={{ height: 14, background: 'var(--bg-secondary)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 12, background: 'var(--bg-secondary)', borderRadius: 6, width: '80%', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 12, background: 'var(--bg-secondary)', borderRadius: 6, width: '40%', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

export default function AbavieStore() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCat, setActiveCat] = useState('Tous')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('new')

  const loadProducts = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('abavie_products')
        .select('id, nom, categorie, description_courte, prix, prix_original, image_url, stock, featured, actif, created_at')
        .eq('actif', true)
        .order('created_at', { ascending: false })
      if (supaError) { setError(supaError.message); setProducts([]) }
      else { setProducts(data || []) }
    } catch (e) { setError(e.message); setProducts([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const displayed = (() => {
    let list = products.filter(p => {
      if (activeCat !== 'Tous' && p.categorie !== activeCat) return false
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const s = [p.nom, p.categorie, p.description_courte].filter(Boolean).join(' ').toLowerCase()
        if (!s.includes(q)) return false
      }
      return true
    })
    switch (sort) {
      case 'prix_asc': list = [...list].sort((a, b) => a.prix - b.prix); break
      case 'prix_desc': list = [...list].sort((a, b) => b.prix - a.prix); break
      case 'name': list = [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')); break
      default: break
    }
    return list
  })()

  const catCount = (catId) => {
    if (catId === 'Tous') return products.length
    return products.filter(p => p.categorie === catId).length
  }
  const uniqueCats = [...new Set(products.map(p => p.categorie).filter(Boolean))]

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px) 80px' }}>
      <SEO title="Boutique Abavie — Matériel médical au Sénégal"
        description="Tenues médicales, matériel léger, semi-lourd et lourd. Livraison partout au Sénégal. Commandez par WhatsApp."
        keywords="matériel médical Sénégal, tenue médicale Dakar, stéthoscope, tensiomètre, lit médical, équipement hospitalier" />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#064e3b 100%)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 24, padding: '40px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(16,185,129,0.9)', borderRadius: 20, marginBottom: 10 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Boutique Santé</span>
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>Matériel Médical & Tenues</h1>
          <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 560 }}>
            Équipement médical professionnel pour cliniques, hôpitaux et professionnels de santé. Livraison partout au Sénégal.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {['Tenues médicales','Matériel léger','Semi-lourd','Lourd','Consommables'].map((t,i) => (
              <span key={i} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input type="text" placeholder="Rechercher un produit…" value={query} onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
          <option value="new">Nouveau d'abord</option>
          <option value="prix_asc">Prix croissant ↑</option>
          <option value="prix_desc">Prix décroissant ↓</option>
          <option value="name">Nom A–Z</option>
        </select>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATS.filter(c => c.id === 'Tous' || uniqueCats.includes(c.id)).map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            style={{ padding: '8px 14px', borderRadius: 20, border: activeCat === c.id ? '1.5px solid #10B981' : '1px solid var(--border)', background: activeCat === c.id ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)', color: activeCat === c.id ? '#34D399' : 'var(--text-secondary)', fontWeight: activeCat === c.id ? 800 : 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{c.icon}</span> {c.label} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{catCount(c.id)}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      {!loading && !error && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{displayed.length}</span> produit{displayed.length !== 1 ? 's' : ''} · <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{uniqueCats.length}</span> catégorie{uniqueCats.length !== 1 ? 's' : ''}
          {query && <> · Recherche « <span style={{ fontWeight: 700 }}>{query}</span> »</>}
        </p>
      )}

      {/* Products grid */}
      {error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Erreur de chargement</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={loadProducts} style={{ marginTop: 16, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Réessayer</button>
        </div>
      ) : loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🩺</div>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{products.length === 0 ? 'Catalogue en cours de mise à jour' : 'Aucun produit trouvé'}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{products.length === 0 ? 'Contactez-nous sur WhatsApp pour connaître nos disponibilités.' : 'Essayez une autre catégorie ou modifiez votre recherche.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {displayed.map(p => {
            const stockInfo = getStockLabel(p.stock)
            const oldPrice = p.prix_original
            const discount = oldPrice && oldPrice > p.prix ? Math.round(((oldPrice - p.prix) / oldPrice) * 100) : null
            return (
              <Link key={p.id} to={`/boutique-sante/${p.id}`}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform .25s, box-shadow .25s', position: 'relative', textDecoration: 'none', color: 'inherit', display: 'block' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(16,185,129,0.12),0 4px 14px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <img src={p.image_url || 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&q=80'} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=600&q=80' }} />
                  {stockInfo && (
                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, background: stockInfo.cls === 'abs-ok' ? 'rgba(16,185,129,0.9)' : stockInfo.cls === 'abs-low' ? 'rgba(245,158,11,0.9)' : 'rgba(239,68,68,0.9)', color: '#fff' }}>{stockInfo.label}</span>
                  )}
                  {p.featured && <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, background: 'rgba(168,85,247,0.9)', color: '#fff' }}>★ Vedette</span>}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.categorie}</span>
                  <h3 style={{ margin: '6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{p.nom}</h3>
                  {p.description_courte && <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description_courte}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10B981' }}>{formatP(p.prix)}</span>
                    {oldPrice && oldPrice > p.prix && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{formatP(oldPrice)}</span>}
                    {discount && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 20 }}>-{discount}%</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 40, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        📞 Commandez par WhatsApp au 77 518 50 50 — Livraison partout au Sénégal
      </p>
    </main>
  )
}

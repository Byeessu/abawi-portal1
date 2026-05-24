import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { waLink } from '../data/products'
import SEO from '../components/SEO'
import ViewToggle, { useViewMode } from '../components/ViewToggle'
import './Store.css'

// ─── Category definitions ──────────────────────────────────────────────────
const CATS = [
  { id: 'Tous',        label: 'Tous',        icon: '🖥️' },
  { id: 'PC PORTABLE', label: 'Portables',   icon: '💻' },
  { id: 'PC BUREAU',   label: 'Bureaux',     icon: '🖥️' },
  { id: 'IMPRIMANTE',  label: 'Imprimantes', icon: '🖨️' },
  { id: 'ECRAN',       label: 'Écrans',      icon: '📺' },
  { id: 'CLAVIER',     label: 'Claviers',    icon: '⌨️' },
  { id: 'SOURIS',      label: 'Souris',      icon: '🖱️' },
  { id: 'DISQUE DUR',  label: 'Stockage',    icon: '💾' },
  { id: 'RAM',         label: 'Mémoire',     icon: '🧠' },
  { id: 'WEBCAM',      label: 'Webcams',     icon: '📸' },
  { id: 'CASQUE',      label: 'Casques',     icon: '🎧' },
  { id: 'SAC',         label: 'Sacs',        icon: '🎒' },
  { id: 'SERVICES',    label: 'Services',    icon: '⚙️' },
]

// ─── Fallback image map ────────────────────────────────────────────────────
const PRODUCT_IMAGES = {
  macbook:       'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
  imac:          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  hp_laptop:     'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80',
  hp_printer:    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&q=80',
  dell_laptop:   'https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=600&q=80',
  dell_desktop:  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80',
  lenovo_laptop: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=600&q=80',
  printer:       'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&q=80',
  printer_laser: 'https://images.unsplash.com/photo-1563205764-9f5b8f066f91?w=600&q=80',
  ram:           'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80',
  ssd:           'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&q=80',
  mouse:         'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
  keyboard:      'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=600&q=80',
  headset:       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  webcam:        'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
  monitor:       'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  bag:           'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  default:       'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
}

function getProductImage(product) {
  const name = (product.nom || product.name || '').toLowerCase()
  const cat  = (product.cat || product.categorie || '').toLowerCase()

  if (name.includes('macbook') || name.includes(' mac ')) return PRODUCT_IMAGES.macbook
  if (name.includes('imac')) return PRODUCT_IMAGES.imac
  if (name.includes('hp') && cat.includes('imprimante')) return PRODUCT_IMAGES.hp_printer
  if (name.includes('hp')) return PRODUCT_IMAGES.hp_laptop
  if (name.includes('dell') && (cat.includes('bureau') || name.includes('desktop'))) return PRODUCT_IMAGES.dell_desktop
  if (name.includes('dell')) return PRODUCT_IMAGES.dell_laptop
  if (name.includes('lenovo') || name.includes('thinkpad')) return PRODUCT_IMAGES.lenovo_laptop
  if (name.includes('imprimante') || name.includes('printer')) {
    if (name.includes('laser')) return PRODUCT_IMAGES.printer_laser
    return PRODUCT_IMAGES.printer
  }
  if (name.includes('ram') || name.includes('mémoire')) return PRODUCT_IMAGES.ram
  if (name.includes('ssd') || name.includes('disque')) return PRODUCT_IMAGES.ssd
  if (name.includes('souris') || name.includes('mouse')) return PRODUCT_IMAGES.mouse
  if (name.includes('clavier') || name.includes('keyboard')) return PRODUCT_IMAGES.keyboard
  if (name.includes('casque') || name.includes('headset')) return PRODUCT_IMAGES.headset
  if (name.includes('webcam')) return PRODUCT_IMAGES.webcam
  if (name.includes('ecran') || name.includes('monitor') || cat.includes('ecran')) return PRODUCT_IMAGES.monitor
  if (name.includes('sac') || name.includes('bag')) return PRODUCT_IMAGES.bag
  if (cat.includes('portable') || cat.includes('laptop')) return PRODUCT_IMAGES.hp_laptop
  if (cat.includes('bureau') || cat.includes('desktop')) return PRODUCT_IMAGES.dell_desktop
  if (cat.includes('imprimante')) return PRODUCT_IMAGES.printer

  return PRODUCT_IMAGES.default
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatP(n) {
  return (n || 0).toLocaleString('fr-FR') + ' FCFA'
}

function getDiscount(prix, original) {
  if (!original || original <= prix) return null
  return Math.round(((original - prix) / original) * 100)
}

function getStockLabel(stock) {
  if (stock === null || stock === undefined) return null
  if (stock === 0) return { label: 'Rupture', cls: 'out' }
  if (stock <= 3)  return { label: 'Derniers', cls: 'low' }
  return { label: 'En stock', cls: 'ok' }
}

function getSpecs(product) {
  const raw = product.specs
  if (!raw) return []
  if (Array.isArray(raw)) return raw.slice(0, 2).map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, 2).map(String)
    } catch (_) { /* not JSON */ }
    return raw.split(/[,;|]/).slice(0, 2).map(s => s.trim()).filter(Boolean)
  }
  if (typeof raw === 'object') {
    return Object.values(raw).slice(0, 2).map(String)
  }
  return []
}

// ─── Skeleton cards ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="st-skeleton">
      <div className="st-skeleton-img" />
      <div className="st-skeleton-body">
        <div className="st-skeleton-line w60" />
        <div className="st-skeleton-line w80 h14" />
        <div className="st-skeleton-line w45" />
        <div className="st-skeleton-line w80 h14" style={{ marginTop: 4 }} />
      </div>
    </div>
  )
}

// ─── Grid card ─────────────────────────────────────────────────────────────
function GridCard({ product, onNavigate }) {
  const stockInfo = getStockLabel(product.stock)
  const specs     = getSpecs(product)
  const imgSrc    = product.image_url || product.img || getProductImage(product)
  const oldPrice  = product.prix_barre || product.prix_original || null
  const discount  = getDiscount(product.prix, oldPrice)
  const title     = product.nom || product.name || 'Produit'
  const cat       = product.cat || product.categorie || 'IT'
  const waHref    = waLink(title, product.prix)

  return (
    <article className="st-card" onClick={onNavigate}>
      <div className="st-card-cover">
        <img
          src={imgSrc}
          alt={title}
          width={280}
          height={200}
          loading="lazy"
          decoding="async"
          onError={e => { e.currentTarget.src = PRODUCT_IMAGES.default }}
        />
        {stockInfo && (
          <span className={`st-card-stock-badge ${stockInfo.cls}`}>
            {stockInfo.label}
          </span>
        )}
        {product.featured && (
          <span className="st-card-feat-badge">★ Vedette</span>
        )}
      </div>

      <div className="st-card-body">
        <span className="st-card-cat">{cat}</span>
        <h3 className="st-card-title">{title}</h3>

        <div className="st-card-specs-line">
          {specs.length > 0
            ? specs.map((s, i) => (
                <span key={i}>
                  {i > 0 && <span className="spec-dot"> · </span>}
                  {s}
                </span>
              ))
            : <span>&nbsp;</span>
          }
        </div>

        <div className="st-card-price-row">
          <span className="st-card-price">{formatP(product.prix)}</span>
          {oldPrice && (
            <>
              <span className="st-card-old-price">{formatP(oldPrice)}</span>
              {discount && (
                <span className="st-card-discount">-{discount}%</span>
              )}
            </>
          )}
        </div>

        <div className="st-card-actions">
          <Link
            className="st-card-cta"
            to={`/store/${product.id}`}
            onClick={e => e.stopPropagation()}
          >
            Commander →
          </Link>
          <a
            className="st-card-wa"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}
          >
            📱
          </a>
        </div>
      </div>
    </article>
  )
}

// ─── List card ─────────────────────────────────────────────────────────────
function ListCard({ product, onNavigate }) {
  const imgSrc   = product.image_url || product.img || getProductImage(product)
  const title    = product.nom || product.name || 'Produit'
  const cat      = product.cat || product.categorie || 'IT'
  const specs    = getSpecs(product)
  const oldPrice = product.prix_barre || product.prix_original || null
  const waHref   = waLink(title, product.prix)

  return (
    <article className="st-list-card" onClick={onNavigate}>
      <img
        className="st-list-img"
        src={imgSrc}
        alt={title}
        width={120}
        height={90}
        loading="lazy"
        decoding="async"
        onError={e => { e.currentTarget.src = PRODUCT_IMAGES.default }}
      />
      <div className="st-list-body">
        <span className="st-list-cat">{cat}</span>
        <h3 className="st-list-title">{title}</h3>
        {specs.length > 0 && (
          <span className="st-list-specs">{specs.join(' · ')}</span>
        )}
      </div>
      <div className="st-list-right">
        <div>
          <div className="st-list-price">{formatP(product.prix)}</div>
          {oldPrice && (
            <div className="st-list-old">{formatP(oldPrice)}</div>
          )}
        </div>
        <div className="st-list-actions">
          <Link
            className="st-list-cta"
            to={`/store/${product.id}`}
            onClick={e => e.stopPropagation()}
          >
            Voir →
          </Link>
          <a
            className="st-card-wa"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}
          >
            📱
          </a>
        </div>
      </div>
    </article>
  )
}

// ─── Main Store component ──────────────────────────────────────────────────
function Store() {
  const navigate = useNavigate()

  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [activeCat, setActiveCat] = useState('Tous')
  const [query,     setQuery]     = useState('')
  const [sort,      setSort]      = useState('new')   // 'new' | 'prix_asc' | 'prix_desc' | 'name'
  const [viewMode, setViewMode] = useViewMode('store', 'medium')

  // ── Load products from Supabase ──────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supaError } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('[Store] Réponse Supabase:', { count: data?.length, error: supaError })

      if (supaError) {
        console.error('[Store] Erreur Supabase:', supaError)
        setError('Erreur de chargement : ' + supaError.message)
        setProducts([])
      } else if (!data || data.length === 0) {
        console.log('[Store] Aucun produit trouvé')
        setProducts([])
      } else {
        const mapped = data.map(p => ({
          ...p,
          nom: p.name  || p.nom  || 'Produit sans nom',
          cat: p.categorie || p.cat || 'Divers',
          img: p.image_url || p.img || getProductImage(p),
          prix: p.prix || 0,
        }))
        console.log('[Store] Produits mappés:', mapped.length)
        setProducts(mapped)
      }
    } catch (e) {
      console.error('[Store] Exception:', e)
      setError('Exception : ' + (e.message || String(e)))
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { Promise.resolve().then(() => loadProducts()) }, [loadProducts])

  // ── Derived: filtered + sorted list ─────────────────────────────────────
  const displayed = (() => {
    let list = products.filter(p => {
      // Only show active products (actif can be null/undefined = show by default)
      if (p.actif === false) return false

      // Category filter
      const inCat = activeCat === 'Tous' || (p.cat || p.categorie) === activeCat
      if (!inCat) return false

      // Search filter
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const searchable = [p.nom, p.name, p.cat, p.categorie, p.description]
          .filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })

    // Sort
    switch (sort) {
      case 'prix_asc':  list = [...list].sort((a, b) => a.prix - b.prix); break
      case 'prix_desc': list = [...list].sort((a, b) => b.prix - a.prix); break
      case 'name':      list = [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || '')); break
      default:          break // 'new' — already ordered by created_at desc from Supabase
    }
    return list
  })()

  // ── Category counts (over all products ignoring search/cat filter) ───────
  const catCount = (catId) => {
    if (catId === 'Tous') return products.filter(p => p.actif !== false).length
    return products.filter(p => p.actif !== false && (p.cat || p.categorie) === catId).length
  }

  const uniqueCats = [...new Set(products.map(p => p.cat || p.categorie).filter(Boolean))]

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <main className="st-page">
      <SEO
        title="Store IT — Matériel informatique au Sénégal"
        description="PC portables, bureaux, imprimantes, écrans, claviers, souris, disques durs, RAM et accessoires informatiques au Sénégal. Livraison Dakar, conseil personnalisé."
        keywords="PC Sénégal, ordinateur Dakar, imprimante, écran, clavier, souris, disque dur, RAM, matériel informatique, upgrade PC"
        image="/slider/01-Black-Desk-Setup_-minimal_modern.webp"
      />

      {/* Hero */}
      <section className="st-hero">
        <span className="st-badge">ABAWI Store IT</span>
        <h1 className="st-hero-title">
          Matériel <span className="accent">Informatique</span> au Sénégal
        </h1>
        <p className="st-hero-sub">PCs · Upgrades · Maintenance · Conseil — Livraison Dakar</p>
      </section>

      {/* Trust banner */}
      <div className="st-trust-bar">
        <span className="st-trust-item">🚚 Livraison Dakar</span>
        <span className="st-trust-sep">|</span>
        <span className="st-trust-item">🔧 Installation gratuite</span>
        <span className="st-trust-sep">|</span>
        <span className="st-trust-item">📞 77 518 50 50</span>
        <span className="st-trust-sep">|</span>
        <span className="st-trust-item">✅ Garantie produit</span>
      </div>

      {/* Toolbar */}
      <div className="st-toolbar">
        {/* Search */}
        <div className="st-search">
          <span className="st-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Rechercher"
          />
          {query && (
            <button
              className="st-search-clear"
              onClick={() => setQuery('')}
              aria-label="Effacer"
            >
              ✕
            </button>
          )}
        </div>

        {/* View toggle */}
        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {/* Sort */}
        <select
          className="st-sort-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
          aria-label="Trier par"
        >
          <option value="new">Nouveau d&apos;abord</option>
          <option value="prix_asc">Prix croissant ↑</option>
          <option value="prix_desc">Prix décroissant ↓</option>
          <option value="name">Nom A–Z</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="st-cats" role="list">
        {CATS.filter(c => c.id === 'Tous' || uniqueCats.includes(c.id)).map(c => (
          <button
            key={c.id}
            role="listitem"
            className={`st-cat-btn${activeCat === c.id ? ' active' : ''}`}
            onClick={() => setActiveCat(c.id)}
          >
            <span className="cat-icon">{c.icon}</span>
            {c.label}
            <span className="cat-count">{catCount(c.id)}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      {!loading && !error && (
        <p className="st-stats">
          <span>{displayed.length}</span> produit{displayed.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
          <span>{uniqueCats.length}</span> catégorie{uniqueCats.length !== 1 ? 's' : ''}
          {query && <> · Résultat pour &ldquo;<span>{query}</span>&rdquo;</>}
        </p>
      )}

      {/* Product grid / list */}
      {error ? (
        <div className="st-empty">
          <div className="st-empty-icon">⚠️</div>
          <p className="st-empty-title">Erreur de chargement</p>
          <p className="st-empty-sub">{error}</p>
          <button className="st-retry-btn" onClick={loadProducts}>Réessayer</button>
        </div>
      ) : loading ? (
        <div data-view={viewMode}><div className="st-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div></div>
      ) : displayed.length === 0 ? (
        <div className="st-empty">
          <div className="st-empty-icon">💻</div>
          <p className="st-empty-title">
            {products.length === 0
              ? 'Catalogue en cours de mise à jour'
              : 'Aucun produit trouvé'}
          </p>
          <p className="st-empty-sub">
            {products.length === 0
              ? 'Contactez-nous sur WhatsApp pour connaître nos disponibilités.'
              : 'Essayez une autre catégorie ou modifiez votre recherche.'}
          </p>
          {(activeCat !== 'Tous' || query) && (
            <button
              className="st-retry-btn"
              onClick={() => { setActiveCat('Tous'); setQuery('') }}
            >
              Voir tout
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="st-list">
          {displayed.map(p => (
            <ListCard
              key={p.id}
              product={p}
              onNavigate={() => navigate(`/store/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <div data-view={viewMode}>
          <div className="st-grid">
            {displayed.map(p => (
              <GridCard
                key={p.id}
                product={p}
                onNavigate={() => navigate(`/store/${p.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="st-note">
        Catalogue complet sur demande — contactez-nous sur WhatsApp au 77 518 50 50
      </p>
    </main>
  )
}

export default Store

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { slugify } from '../data/products'
import { supabase } from '../lib/supabase'
import { waLink } from '../data/products'
import PaymentFlow from '../components/PaymentFlow'
import SEO from '../components/SEO'
import './StoreProductDetail.css'

const FALLBACK_IMAGES = {
  macbook: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  hp_laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
  hp_printer: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80',
  dell_laptop: 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=800&q=80',
  lenovo: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=800&q=80',
  printer: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80',
  ram: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&q=80',
  ssd: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
  mouse: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=800&q=80',
  headset: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
}

function getFallback(product) {
  const n = (product.nom || product.name || '').toLowerCase()
  const c = (product.categorie || product.cat || '').toLowerCase()
  if (n.includes('macbook') || n.includes('apple')) return FALLBACK_IMAGES.macbook
  if (n.includes('hp') && c.includes('imprimante')) return FALLBACK_IMAGES.hp_printer
  if (n.includes('hp')) return FALLBACK_IMAGES.hp_laptop
  if (n.includes('dell')) return FALLBACK_IMAGES.dell_laptop
  if (n.includes('lenovo') || n.includes('thinkpad')) return FALLBACK_IMAGES.lenovo
  if (n.includes('imprimante') || n.includes('printer')) return FALLBACK_IMAGES.printer
  if (n.includes('ram') || n.includes('mémoire')) return FALLBACK_IMAGES.ram
  if (n.includes('ssd') || n.includes('disque')) return FALLBACK_IMAGES.ssd
  if (n.includes('souris') || n.includes('mouse')) return FALLBACK_IMAGES.mouse
  if (n.includes('clavier')) return FALLBACK_IMAGES.keyboard
  if (n.includes('casque') || n.includes('headset')) return FALLBACK_IMAGES.headset
  if (n.includes('ecran') || n.includes('moniteur') || c.includes('ecran')) return FALLBACK_IMAGES.monitor
  return FALLBACK_IMAGES.default
}

function formatP(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

function parseSpecs(raw) {
  if (!raw) return { type: 'none', data: [] }
  if (Array.isArray(raw)) return { type: 'array', data: raw.filter(Boolean) }
  if (typeof raw === 'object') return { type: 'object', data: Object.entries(raw).filter(([, v]) => v) }
  if (typeof raw === 'string') return { type: 'array', data: raw.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 2) }
  return { type: 'none', data: [] }
}

const TABS = ['Description', 'Caractéristiques', 'Points forts', "Cas d'usage"]

export default function StoreProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState(0)
  const [buyOpen, setBuyOpen] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('store_products').select('*').eq('id', id).maybeSingle()
      if (data) {
        setProduct(data)
        // Load related
        const cat = data.categorie || data.cat
        if (cat) {
          const { data: rel } = await supabase
            .from('store_products')
            .select('id, nom, name, categorie, cat, prix, image_url')
            .eq('categorie', cat)
            .neq('id', id)
            .eq('actif', true)
            .limit(6)
          setRelated(rel || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold,#F0B429)', animation: `spd-pulse 1s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
        <style>{`@keyframes spd-pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: '3rem' }}>💻</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>Produit introuvable</div>
      <Link to="/store" style={{ color: 'var(--gold,#F0B429)', textDecoration: 'none', fontWeight: 600 }}>← Retour au Store</Link>
    </div>
  )

  const nom = product.nom || product.name || 'Produit'
  const cat = product.categorie || product.cat || ''
  const images = product.images?.length > 0 ? product.images
                 : product.image_url ? [product.image_url]
                 : [getFallback(product)]
  const mainImg = images[imgIdx] || getFallback(product)

  const prix = product.prix || 0
  const prixOld = product.prix_barre || product.prix_original || 0
  const discount = prixOld > prix ? Math.round((1 - prix / prixOld) * 100) : 0

  const stock = product.stock ?? 10
  const isOut = stock === 0
  const isLow = stock > 0 && stock <= 3

  const specs = parseSpecs(product.caracteristiques || product.specs)
  const points = Array.isArray(product.points_forts) ? product.points_forts : []
  const usage = Array.isArray(product.cas_usage) ? product.cas_usage : []
  const desc = product.description_longue || (product.description || '').replace(/revendeur officiel[^.]*\./gi, '').replace(/agr[ée][ée][^,.]*[,.]?/gi, '').replace(/ABAWI Dakar,?\s*/gi, '').trim()
  const seoTitle = product.meta_title || `${nom} — ${cat} | ABAWI Store`
  const seoDesc = product.meta_description || desc.slice(0, 160)
  const seoTags = Array.isArray(product.seo_tags) ? product.seo_tags.join(', ') : ''

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords={seoTags}
        image={product.image_url || ''}
        type="product"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: nom,
          description: seoDesc,
          image: product.image_url || '',
          brand: { '@type': 'Brand', name: 'ABAWI' },
          category: cat,
          offers: {
            '@type': 'Offer',
            price: prix,
            priceCurrency: 'XOF',
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://abawi.app/store/${id}`,
          },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '12' }
        }}
      />
      <main className="spd-page">
      {/* Breadcrumb */}
      <nav className="spd-breadcrumb">
        <Link to="/">Accueil</Link>
        <span className="spd-breadcrumb-sep">›</span>
        <Link to="/store">Store IT</Link>
        {cat && <><span className="spd-breadcrumb-sep">›</span><span className="spd-breadcrumb-current">{cat}</span></>}
        <span className="spd-breadcrumb-sep">›</span>
        <span className="spd-breadcrumb-current" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
      </nav>

      <div className="spd-main-grid">
        {/* ── Gallery ── */}
        <div className="spd-gallery">
          <div className="spd-gallery-main">
            <img src={mainImg} alt={nom} loading="lazy" decoding="async" onError={e => { e.target.src = FALLBACK_IMAGES.default }} />
            <div className={`spd-gallery-stock-badge ${isOut ? 'spd-gallery-stock-badge--out' : isLow ? 'spd-gallery-stock-badge--low' : 'spd-gallery-stock-badge--ok'}`}>
              {isOut ? 'Rupture de stock' : isLow ? `Derniers ${stock} dispo` : 'En stock ✓'}
            </div>
            {product.featured && <div className="spd-gallery-feat-badge">★ Coup de cœur</div>}
          </div>
          {images.length > 1 && (
            <div className="spd-gallery-thumbs">
              {images.map((img, i) => (
                <div key={i} className={`spd-thumb${i === imgIdx ? ' spd-thumb--active' : ''}`} onClick={() => setImgIdx(i)}>
                  <img src={img} alt={`Vue miniature ${i + 1}`} loading="lazy" decoding="async" onError={e => { e.target.src = FALLBACK_IMAGES.default }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Panel ── */}
        <div className="spd-panel">
          {cat && <div className="spd-cat-tag">{cat}</div>}
          <h1 className="spd-title">{nom}</h1>

          {/* Rating (placeholder) */}
          <div className="spd-rating">
            <span className="spd-stars">★★★★★</span>
            <span className="spd-rating-score">4.8</span>
            <span className="spd-rating-count">(12 avis)</span>
          </div>

          {/* Price */}
          <div className="spd-price-row">
            <span className="spd-price">{formatP(prix)}</span>
            {discount > 0 && <>
              <span className="spd-price-old">{formatP(prixOld)}</span>
              <span className="spd-discount-badge">−{discount}%</span>
            </>}
          </div>
          <div className={`spd-stock-line ${isOut ? 'spd-stock-line--out' : 'spd-stock-line--ok'}`}>
            {isOut ? '✗ Indisponible' : isLow ? `⚠ Plus que ${stock} en stock` : `✓ En stock — livraison sous 24–48h à Dakar`}
          </div>

          <hr className="spd-divider" />

          {/* Qty */}
          {!isOut && (
            <div className="spd-qty-row">
              <span className="spd-qty-label">Quantité</span>
              <div className="spd-qty-ctrl">
                <button className="spd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                <span className="spd-qty-val">{qty}</span>
                <button className="spd-qty-btn" onClick={() => setQty(q => Math.min(stock, q + 1))} disabled={qty >= stock}>+</button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <button
            className="spd-cta-primary"
            disabled={isOut}
            onClick={() => setBuyOpen(true)}
          >
            🛒 {isOut ? 'Indisponible' : `Commander — ${formatP(prix * qty)}`}
          </button>
          <a
            href={waLink(`${nom} × ${qty}`, prix * qty)}
            target="_blank" rel="noopener noreferrer"
            className="spd-cta-wa"
          >
            <svg width="18" height="18" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander via WhatsApp
          </a>

          {/* Trust grid */}
          <div className="spd-trust-grid">
            {[
              { icon: '📦', label: 'Livraison Dakar', sub: '24–48h ouvrées' },
              { icon: '🛡️', label: `Garantie ${product.garantie || '1 an'}`, sub: 'Constructeur' },
              { icon: '🔧', label: 'Installation offerte', sub: 'Sur site à Dakar' },
              { icon: '📞', label: 'Support 77 518 50 50', sub: 'Lun – Sam 8h–20h' },
            ].map((t, i) => (
              <div key={i} className="spd-trust-item">
                <span className="spd-trust-icon">{t.icon}</span>
                <div>
                  <div className="spd-trust-label">{t.label}</div>
                  <div className="spd-trust-sub">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="spd-tabs-section">
        <div className="spd-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={`spd-tab-btn${tab === i ? ' spd-tab-btn--active' : ''}`} onClick={() => setTab(i)}>
              {t}
            </button>
          ))}
        </div>
        <div className="spd-tab-content">
          {tab === 0 && (
            <div>
              {desc ? (
                <div className="spd-desc">
                  {desc.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.trim()}</p>)}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Description non disponible.</p>}
              {product.public_cible && (
                <div className="spd-target-box">
                  <span className="spd-target-icon">🎯</span>
                  <div>
                    <div className="spd-target-label">Pour qui</div>
                    <div className="spd-target-val">{product.public_cible}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 1 && (
            <div>
              {specs.type === 'object' && specs.data.length > 0 ? (
                <table className="spd-specs-table">
                  <tbody>
                    {specs.data.map(([k, v]) => (
                      <tr key={k}><td>{k.replace(/_/g, ' ')}</td><td>{String(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : specs.data.length > 0 ? (
                <div className="spd-specs-pills">
                  {specs.data.map((s, i) => <span key={i} className="spd-spec-pill">{s}</span>)}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Fiche technique non disponible.</p>
              )}
            </div>
          )}

          {tab === 2 && (
            points.length > 0 ? (
              <div className="spd-points-list">
                {points.map((pt, i) => (
                  <div key={i} className="spd-point-item">
                    <div className="spd-point-check">✓</div>
                    <span className="spd-point-text">{pt}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucun point fort renseigné.</p>
          )}

          {tab === 3 && (
            usage.length > 0 ? (
              <div className="spd-usage-chips">
                {usage.map((u, i) => <span key={i} className="spd-usage-chip">{u}</span>)}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Cas d'usage non renseignés.</p>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="spd-related">
          <div className="spd-related-title">Produits similaires</div>
          <div className="spd-related-scroll">
            {related.map(p => (
              <Link key={p.id} to={`/store/${p.id}`} className="spd-rel-card">
                <img className="spd-rel-img" src={p.image_url || getFallback(p)} alt={p.nom || p.name} loading="lazy" decoding="async" onError={e => { e.target.src = FALLBACK_IMAGES.default }} />
                <div className="spd-rel-body">
                  <div className="spd-rel-cat">{p.categorie || p.cat}</div>
                  <div className="spd-rel-name">{p.nom || p.name}</div>
                  <div className="spd-rel-price">{formatP(p.prix)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {buyOpen && (
        <PaymentFlow
          product={{ id: product.id, titre: nom, prix: prix * qty, type: 'store', cover_url: product.image_url }}
          onClose={() => setBuyOpen(false)}
        />
      )}
    </main>
    </>
  )
}

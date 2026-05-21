import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { waLink } from '../data/products'
import PaymentFlow from '../components/PaymentFlow'
import SEO from '../components/SEO'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&q=80'

function formatP(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

function parseSpecs(raw) {
  if (!raw) return { type: 'none', data: [] }
  if (Array.isArray(raw)) return { type: 'array', data: raw.filter(Boolean) }
  if (typeof raw === 'object') return { type: 'object', data: Object.entries(raw).filter(([, v]) => v) }
  if (typeof raw === 'string') return { type: 'array', data: raw.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 2) }
  return { type: 'none', data: [] }
}

export default function AbavieProductDetail() {
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
      const { data } = await supabase.from('abavie_products').select('*').eq('id', id).maybeSingle()
      if (data) {
        setProduct(data)
        const cat = data.categorie
        if (cat) {
          const { data: rel } = await supabase
            .from('abavie_products')
            .select('id, nom, categorie, prix, image_url')
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

  // Inject JSON-LD schema.org
  useEffect(() => {
    if (!product?.schema_org) return
    const existing = document.getElementById('abavie-product-schema')
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = 'abavie-product-schema'
    script.type = 'application/ld+json'
    script.textContent = product.schema_org
    document.head.appendChild(script)
    return () => { const el = document.getElementById('abavie-product-schema'); if (el) el.remove() }
  }, [product?.schema_org])

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
      <div style={{ fontSize: '3rem' }}>🩺</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>Produit introuvable</div>
      <Link to="/boutique-sante" style={{ color: 'var(--gold,#F0B429)', textDecoration: 'none', fontWeight: 600 }}>← Retour à la Boutique</Link>
    </div>
  )

  const nom = product.nom || 'Produit'
  const cat = product.categorie || ''
  const images = product.image_url ? [product.image_url] : [FALLBACK_IMAGE]
  const mainImg = images[imgIdx] || FALLBACK_IMAGE

  const prix = product.prix || 0
  const prixOld = product.prix_original || 0
  const discount = prixOld > prix ? Math.round(((prixOld - prix) / prixOld) * 100) : 0

  const stock = product.stock ?? 10
  const isOut = stock === 0
  const isLow = stock > 0 && stock <= 3

  const specs = parseSpecs(product.caracteristiques || product.specs)
  const points = Array.isArray(product.points_forts) ? product.points_forts : []
  const usage = Array.isArray(product.cas_usage) ? product.cas_usage : []
  const faq = Array.isArray(product.faq) ? product.faq : []
  const desc = product.description_longue || product.description || product.description_courte || ''
  const seoTitle = product.meta_title || `${nom} — ${cat} | Abavie Santé`
  const seoDesc = product.meta_description || desc.slice(0, 160)
  const seoTags = Array.isArray(product.seo_tags) ? product.seo_tags.join(', ') : ''

  const TABS = useMemo(() => {
    const t = ['Description', 'Caractéristiques']
    if (points.length) t.push('Points forts')
    if (usage.length) t.push("Cas d'usage")
    if (product.storytelling) t.push('Storytelling')
    if (faq.length) t.push('FAQ')
    return t
  }, [product, points.length, usage.length, faq.length])

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
          brand: { '@type': 'Brand', name: 'Abavie' },
          category: cat,
          offers: {
            '@type': 'Offer',
            price: prix,
            priceCurrency: 'XOF',
            availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://abawi.app/abavie/produit/${id}`,
          },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.7', reviewCount: '8' }
        }}
      />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(16px,3vw,32px) 80px' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Accueil</Link>
        <span>›</span>
        <Link to="/boutique-sante" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Boutique Santé</Link>
        {cat && <><span>›</span><span style={{ color: 'var(--text-secondary)' }}>{cat}</span></>}
        <span>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40, alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: '4/3' }}>
            <img src={mainImg} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = FALLBACK_IMAGE }} />
            <span style={{ position: 'absolute', bottom: 12, left: 12, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, color: '#fff', background: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981' }}>
              {isOut ? 'Rupture de stock' : isLow ? `Derniers ${stock} dispo` : 'En stock'}
            </span>
            {product.featured && <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, color: '#fff', background: '#a855f7' }}>★ Vedette</span>}
          </div>
        </div>

        {/* Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cat && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</span>}
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{nom}</h1>

          {product.description_courte && (
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{product.description_courte}</p>
          )}

          {/* Angles de vente */}
          {product.angle_vente && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.angle_vente.split('|').map((a, i) => (
                <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#A855F7', fontSize: '0.72rem', fontWeight: 700 }}>{a.trim()}</span>
              ))}
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{formatP(prix)}</span>
            {prixOld > prix && <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatP(prixOld)}</span>}
            {discount > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '3px 10px', borderRadius: 20 }}>-{discount}%</span>}
          </div>

          <div style={{ fontSize: '0.85rem', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
            {isOut ? '✗ Indisponible' : isLow ? `⚠ Plus que ${stock} en stock` : `✓ En stock — livraison partout au Sénégal`}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          {/* Qty */}
          {!isOut && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quantité</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} style={{ padding: '8px 14px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', opacity: qty <= 1 ? 0.4 : 1 }}>−</button>
                <span style={{ padding: '8px 14px', fontWeight: 700, minWidth: 40, textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(stock, q + 1))} disabled={qty >= stock} style={{ padding: '8px 14px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', opacity: qty >= stock ? 0.4 : 1 }}>+</button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <button
            disabled={isOut}
            onClick={() => setBuyOpen(true)}
            style={{
              padding: '14px 24px', borderRadius: 12, border: 'none', background: isOut ? 'var(--border)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: isOut ? 'not-allowed' : 'pointer', opacity: isOut ? 0.6 : 1, transition: 'all 0.2s'
            }}
          >
            🛒 {isOut ? 'Indisponible' : `Commander — ${formatP(prix * qty)}`}
          </button>
          <a
            href={waLink(`${nom} × ${qty}`, prix * qty)}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: '1.5px solid #25D366', background: 'transparent', color: '#25D366', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander via WhatsApp
          </a>

          {/* Trust */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            {[
              { icon: '📦', label: 'Livraison Sénégal', sub: '24–72h selon zone' },
              { icon: '🛡️', label: `Garantie ${product.garantie || '6 mois'}`, sub: 'Constructeur' },
              { icon: '🔧', label: 'Installation', sub: 'Sur devis à Dakar' },
              { icon: '📞', label: 'Support 77 518 50 50', sub: 'Lun – Sam 8h–20h' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '12px 20px', border: 'none', background: 'transparent', color: tab === i ? '#10b981' : 'var(--text-muted)', fontSize: '0.88rem', fontWeight: tab === i ? 700 : 600, borderBottom: tab === i ? '2px solid #10b981' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', marginBottom: -1, whiteSpace: 'nowrap'
            }}>{t}</button>
          ))}
        </div>
        <div>
          {tab === 0 && (
            <div>
              {desc ? (
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                  {desc.split(/\n\s*\n/).map((p, i) => <p key={i} style={{ margin: '0 0 12px' }}>{p.trim()}</p>)}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Description non disponible.</p>}
              {product.public_cible && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', marginTop: 16 }}>
                  <span style={{ fontSize: '1.3rem' }}>🎯</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>Pour qui</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{product.public_cible}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 1 && (
            <div>
              {specs.type === 'object' && specs.data.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <tbody>
                    {specs.data.map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 0', color: 'var(--text-muted)', fontWeight: 600, width: '40%' }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : specs.data.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {specs.data.map((s, i) => <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s}</span>)}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Fiche technique non disponible.</p>
              )}
            </div>
          )}

          {TABS[tab] === 'Points forts' && (
            points.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {points.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>✓</div>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{pt}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucun point fort renseigné.</p>
          )}

          {TABS[tab] === "Cas d'usage" && (
            usage.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {usage.map((u, i) => <span key={i} style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#0ea5e9', fontSize: '0.82rem', fontWeight: 600 }}>{u}</span>)}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Cas d'usage non renseignés.</p>
          )}

          {TABS[tab] === 'Storytelling' && (
            <div style={{ padding: 20, borderRadius: 14, background: 'linear-gradient(135deg,rgba(168,85,247,0.06),rgba(59,130,246,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>✨ Storytelling</div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{product.storytelling}</p>
            </div>
          )}

          {TABS[tab] === 'FAQ' && (
            faq.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {faq.map((item, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F0B429', marginBottom: 6 }}>Q : {item.q}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.r}</div>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucune FAQ disponible.</p>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Produits similaires</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {related.map(p => (
              <Link key={p.id} to={`/boutique-sante/${p.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s', position: 'relative', textDecoration: 'none', color: 'inherit', display: 'block' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ aspectRatio: '4/3', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <img src={p.image_url || FALLBACK_IMAGE} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = FALLBACK_IMAGE }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>{p.categorie}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.3 }}>{p.nom}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: 6 }}>{formatP(p.prix)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {buyOpen && (
        <PaymentFlow
          product={{ id: product.id, titre: nom, prix: prix * qty, type: 'abavie', cover_url: product.image_url }}
          onClose={() => setBuyOpen(false)}
        />
      )}
    </main>
    </>
  )
}

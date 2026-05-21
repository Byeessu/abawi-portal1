import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProductAccess } from '../hooks/useProductAccess'
import { videos as staticVideos, formatPrix, slugify } from '../data/products'
import PaymentFlow from '../components/PaymentFlow'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import SectionReveal from '../components/premium/SectionReveal'
import AccessBadge from '../components/AccessBadge'
import './Podcasts.css'

const CATEGORIES = ['Toutes', ...Array.from(new Set(staticVideos.map(v => v.categorie).filter(Boolean))).sort()]

function VideoCard({ video, isAdmin, setPayProduct }) {
  const access = useProductAccess(video, 'video')
  const navigate = useNavigate()
  const canPlay = access.canUnlock || !video.premium || video.gratuit

  return (
    <div className="pod-card">
      <Link
        to={`/videos/${slugify(video.titre)}`}
        className="pod-card-cover"
        style={{ position: 'relative', cursor: 'pointer', display: 'block', textDecoration: 'none' }}
        onClick={e => { if (!canPlay) { e.preventDefault(); setPayProduct(video) } }}
      >
        <div style={{
          width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #0B1119, #1A2332)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(240,180,41,0.15)', overflow: 'hidden'
        }}>
          <span style={{ fontSize: '3rem' }}>▶️</span>
        </div>
        {!video.premium
          ? <span className="pod-card-free-badge">GRATUIT</span>
          : canPlay
            ? <span style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(24,168,74,0.85)', color: '#fff',
                fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              }}>✓ ACCÈS</span>
            : <span className="pod-card-premium">🔒 PREMIUM</span>
        }
      </Link>
      <div className="pod-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="pod-card-serie">{video.categorie}</span>
          {access.canUnlock && access.type !== 'none' && access.type !== 'public' && (
            <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} compact />
          )}
        </div>
        <Link
          to={`/videos/${slugify(video.titre)}`}
          className="pod-card-title"
          style={{ textDecoration: 'none', color: 'inherit' }}
          onClick={e => { if (!canPlay) { e.preventDefault(); setPayProduct(video) } }}
        >
          {video.titre}
        </Link>
        {video.premium && !canPlay && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F0B429' }}>{formatPrix(video.prix || 1900)}</span>
            </div>
            <button
              onClick={() => setPayProduct({ id: video.id, titre: video.titre, prix: video.prix || 1900, type: 'video' })}
              style={{
                width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #F0B429, #e5a820)',
                color: '#070B0F', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              Débloquer — {formatPrix(video.prix || 1900)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Videos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Toutes')
  const [payProduct, setPayProduct] = useState(null)
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase.from('videos').select('*').eq('active', true).order('created_at', { ascending: false })
      if (error) throw error
      setVideos(data || [])
    } catch (e) {
      console.error('[Videos] fetch error:', e)
      // Fallback statique
      setVideos(staticVideos)
    }
    setLoading(false)
  }

  const filtered = cat === 'Toutes' ? videos : videos.filter(v => v.categorie === cat)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <ParticlesBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center' }}>
          <SectionReveal>
            <span style={{ color: '#F0B429', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
              ABAWI Digital
            </span>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, margin: '12px 0 16px' }}>
              Vidéos & Masterclasses
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Formations vidéo premium sur le business, la tech et le développement personnel.
            </p>
          </SectionReveal>
        </section>

        {payProduct && (
          <PaymentFlow product={payProduct} onClose={() => setPayProduct(null)} />
        )}

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 24px', marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{
                padding: '8px 18px', borderRadius: 999,
                border: cat === c ? 'none' : '1.5px solid var(--border)',
                background: cat === c ? '#F0B429' : 'transparent',
                color: cat === c ? '#070B0F' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <section style={{ padding: '0 24px 80px' }}>
          {loading ? (
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, height: 280, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Aucune vidéo disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {filtered.map(v => (
                <VideoCard key={v.id} video={v} isAdmin={isAdmin} setPayProduct={setPayProduct} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Videos

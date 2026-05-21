import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { videos as staticVideos, slugify, formatPrix, findSummaryForContent } from '../../data/products'
import { useProductAccess } from '../../hooks/useProductAccess'
import { resolveFirstPlayable } from '../../lib/mediaResolver'
import PaymentFlow from '../../components/PaymentFlow'
import PremiumVideoPlayer from '../../components/PremiumVideoPlayer'
import { Link } from 'react-router-dom'
import AccessBadge from '../../components/AccessBadge'
import ShareButtons from '../../components/ShareButtons'
import './DetailPage.css'

function VideoDetail() {
  const { slug } = useParams()
  const { isMember } = useAuth()
  const [payflow, setPayflow] = useState(false)
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)

  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    async function fetchVideo() {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data, error } = await supabase.from('videos').select('*').eq('slug', slug).single()
        if (error || !data) throw error
        setVideo(data)
      } catch {
        // Fallback statique — les vidéos statiques n'ont pas de champ slug
        setVideo(staticVideos.find(v => slugify(v.titre) === slug) || null)
      }
      setLoading(false)
    }
    fetchVideo()
  }, [slug])

  // Résolution de l'URL vidéo (gère les vidéos importées sans video_url direct)
  useEffect(() => {
    if (!video) return
    const candidates = [
      video.video_url,
      video.storage_url,
      video.file_path,
      video.url,
      video.src,
      `/files/videos/${slugify(video.titre)}.mp4`,
    ].filter(Boolean)
    let cancelled = false
    resolveFirstPlayable(candidates).then(url => {
      if (cancelled) return
      setVideoUrl(url || video.video_url || '')
    })
    return () => { cancelled = true }
  }, [video])

  const access = useProductAccess(video || {}, 'video')

  if (loading) return (
    <main className="detail" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div className="spin-lg" style={{ margin: '0 auto 20px' }} />
      <p>Chargement...</p>
    </main>
  )

  if (!video) return (
    <main className="detail" style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2>Vidéo non trouvée</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Cette vidéo n'existe pas ou a été déplacée.</p>
      <Link to="/digital" style={{ color: 'var(--gold)', fontWeight: 600 }}>← Retour aux Guides & Vidéos</Link>
    </main>
  )

  const canPlay = access.canUnlock || !video.premium || video.gratuit

  return (
    <main className="detail">
      {payflow && <PaymentFlow product={video} onClose={() => setPayflow(false)} />}

      <div className="detail-hero">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ color: '#F0B429', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>{video.categorie}</span>
            {access.canUnlock && access.type !== 'none' && access.type !== 'public' && (
              <AccessBadge accessType={access.type} daysLeft={access.daysLeft} plan={access.plan} />
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, marginBottom: 16 }}>{video.titre}</h1>
          <ShareButtons url={window.location.href} title={video.titre} />
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Résumé audio s'il existe */}
        {(() => {
          const summary = findSummaryForContent(video.titre)
          if (!summary) return null
          return (
            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A78BFA', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                🎙️ Résumé audio — {summary.titre.replace(/-/g, ' ')}
              </div>
              <audio controls style={{ width: '100%', height: 36 }} src={summary.audio_url} />
            </div>
          )
        })()}

        {/* Video player */}
        {canPlay ? (
          <div style={{ marginBottom: 40 }}>
            {videoUrl ? (
              <PremiumVideoPlayer
                src={videoUrl}
                poster={video.cover_url || ''}
                title={video.titre}
              />
            ) : (
              <div style={{
                borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(240,180,41,0.2)',
                background: '#0B1119', padding: 60, textAlign: 'center', color: 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎬</div>
                <p>Fichier vidéo en cours de vérification...</p>
                <p style={{ fontSize: '0.8rem', marginTop: 8, opacity: 0.7 }}>
                  Si le problème persiste, le fichier n'est peut-être pas encore disponible sur le serveur.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            borderRadius: 16, padding: 60, textAlign: 'center',
            border: '1.5px dashed rgba(240,180,41,0.3)',
            background: 'rgba(240,180,41,0.04)', marginBottom: 40
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
            <h3 style={{ marginBottom: 8 }}>Vidéo Premium</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Débloquez l'accès pour regarder cette vidéo.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {video.prix && (
                <button onClick={() => setPayflow(true)} style={{
                  padding: '14px 28px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #F0B429, #e5a820)',
                  color: '#070B0F', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem'
                }}>
                  Débloquer — {formatPrix(video.prix)}
                </button>
              )}
              <Link to="/plans" style={{
                padding: '14px 28px', borderRadius: 12,
                background: 'transparent', border: '1.5px solid var(--border)',
                color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem'
              }}>
                Voir les abonnements
              </Link>
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Catégorie</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{video.categorie}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Prix</div>
            <div style={{ fontWeight: 700, marginTop: 4, color: '#F0B429' }}>
              {video.gratuit ? 'Gratuit' : formatPrix(video.prix || 1900)}
            </div>
          </div>
        </div>

        {video.description && (
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{video.description}</p>
        )}

        <Link to="/digital" style={{ color: 'var(--gold)', fontWeight: 600 }}>← Retour aux Guides & Vidéos</Link>
      </div>
    </main>
  )
}

export default VideoDetail

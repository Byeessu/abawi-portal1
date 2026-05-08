import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { podcasts, slugify, formatPrix } from '../../data/products'
import { useAuth } from '../../context/AuthContext'
import { resolveFirstPlayable } from '../../lib/mediaResolver'
import { loadPodcastOverrides, mergePodcastWithOverride } from '../../lib/podcastsRuntime'
import './DetailPage.css'
import PaymentFlow from '../../components/PaymentFlow'
import ContentViewer from '../../components/ContentViewer'
import { Link } from 'react-router-dom'
import { CoverImage } from '../../components/CoverImage'
import { AudioPlayer } from '../../components/AudioPlayer'
import MemberGate from '../../components/MemberGate'
import ShareButtons from '../../components/ShareButtons'

function PodcastPaymentOptions({ ep, onBuy }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      {ep.prix && (
        <button
          onClick={onBuy}
          style={{
            padding: '14px 20px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: '#fff', fontWeight: 800, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
          }}
        >
          🔓 Acheter cet épisode — {formatPrix(ep.prix)}
        </button>
      )}
      <a
        href="/plans"
        style={{
          padding: '14px 20px', borderRadius: 12,
          background: 'linear-gradient(135deg, #F0B429, #e5a820)',
          color: '#070B0F', fontWeight: 800, fontSize: '0.92rem',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 12px rgba(240,180,41,0.3)',
        }}
      >
        💎 Accès illimité — ABAWI+ (4 900 F/mois)
      </a>
      <a
        href={`https://wa.me/221775185050?text=${encodeURIComponent(`Bonjour, je veux accéder au podcast : ${ep.titre}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '12px 20px', borderRadius: 12,
          background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.3)',
          color: '#18A84A', fontWeight: 700, fontSize: '0.88rem',
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        💬 Commander via WhatsApp
      </a>
    </div>
  )
}

// 40-second preview player with progress bar + seek
function PreviewPlayer({ src, limit = 40 }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => {
      if (a.currentTime >= limit) {
        a.pause()
        setPlaying(false)
        setEnded(true)
      }
      setCurrent(Math.min(a.currentTime, limit))
    }
    const onEnded = () => { setPlaying(false); setEnded(true) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnded)
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnded) }
  }, [limit])

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (ended) {
      a.currentTime = 0
      setCurrent(0)
      setEnded(false)
    }
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().catch(() => {}); setPlaying(true) }
  }

  function seek(e) {
    const a = audioRef.current
    if (!a) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const t = ratio * limit
    a.currentTime = t
    setCurrent(t)
    setEnded(false)
  }

  const pct = (current / limit) * 100
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
      <audio ref={audioRef} src={src} preload="none" crossOrigin="anonymous" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={togglePlay}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: '#fff', fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(139,92,246,0.4)',
          }}
        >
          {playing ? '⏸' : ended ? '↺' : '▶'}
        </button>
        <div style={{ flex: 1 }}>
          <div
            onClick={seek}
            style={{ height: 6, background: 'rgba(139,92,246,0.2)', borderRadius: 100, cursor: 'pointer', overflow: 'hidden', marginBottom: 4 }}
          >
            <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)', borderRadius: 100, transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{fmt(current)}</span>
            <span style={{ color: '#8B5CF6', fontWeight: 700 }}>Extrait {limit}s</span>
            <span>{fmt(limit)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PodcastDetail() {
  const { slug } = useParams()
  const { isMember } = useAuth()
  const [payflow, setPayflow] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [showLyrics, setShowLyrics] = useState(false)
  const [playableSrc, setPlayableSrc] = useState('')
  const [audioCheckDone, setAudioCheckDone] = useState(false)
  const [runtimePodcasts, setRuntimePodcasts] = useState(podcasts)

  useEffect(() => {
    let cancelled = false
    loadPodcastOverrides().then((overrides) => {
      if (cancelled) return
      const merged = podcasts
        .map((p) => mergePodcastWithOverride(p, overrides.get(p.id)))
        .filter((p) => p.actif !== false)
      setRuntimePodcasts(merged)
    })
    return () => { cancelled = true }
  }, [])

  const ep = runtimePodcasts.find((p) => slugify(p.titre) === slug)
  const audioCandidates = useMemo(() => {
    if (!ep) return []
    const canonical = `/files/podcasts/${slugify(ep.titre)}.mp3`
    return [ep.audio_url, canonical]
  }, [ep])

  useEffect(() => {
    let cancelled = false
    if (!ep) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    setAudioCheckDone(false)
    resolveFirstPlayable(audioCandidates).then((src) => {
      if (cancelled) return
      setPlayableSrc(src || ep.audio_url || '')
      setAudioCheckDone(true)
    })
    return () => { cancelled = true }
  }, [audioCandidates, ep])

  if (!ep) return (
    <main className="detail">
      <p style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>Épisode introuvable.</p>
    </main>
  )

  const similar = runtimePodcasts.filter((p) => p.serie === ep.serie && p.id !== ep.id).slice(0, 4)
  const isFree = ep.gratuit || (!ep.premium && ep.audio_url)
  const lyricsText = typeof ep.lyrics === 'string' ? ep.lyrics.trim() : ''
  const hasLyrics = lyricsText.length > 0

  return (
    <main className="detail">
      {payflow && <PaymentFlow product={ep} onClose={() => setPayflow(false)} />}
      {viewer && <ContentViewer type={viewer.type} src={viewer.src} titre={viewer.titre} onClose={() => setViewer(null)} />}

      <nav className="detail-bread">
        <Link to="/">Accueil</Link><span>/</span>
        <Link to="/podcasts">Podcasts</Link><span>/</span>
        <span>{ep.serie}</span><span>/</span>
        <span>{ep.titre}</span>
      </nav>

      <section className="detail-hero">
        <div className="detail-hero-img">
          <CoverImage titre={ep.titre} categorie={ep.serie} type="audio" brand="podcast" size="lg" />
        </div>
        <div className="detail-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="detail-hero-cat detail-hero-cat--green">{ep.serie}</span>
            {isFree && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#18A84A',
                background: 'rgba(24,168,74,0.12)', border: '1px solid rgba(24,168,74,0.3)',
                borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 1,
              }}>GRATUIT</span>
            )}
            {ep.premium && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#8B5CF6',
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 1,
              }}>PREMIUM</span>
            )}
          </div>

          <h1 className="detail-hero-title">{ep.titre}</h1>
          <div className="detail-hero-meta">
            <span className="detail-meta-item">{isFree ? 'Accès libre' : 'Premium'}</span>
            <span className="detail-meta-item">{ep.serie}</span>
            <span className="detail-meta-item">Français</span>
          </div>
          <p className="detail-hero-desc">
            Épisode podcast ABAWI — Analyses, interviews et décryptages pour les entrepreneurs africains.
          </p>

          {isFree ? (
            <>
              {playableSrc ? (
                <div style={{ width: '100%', marginBottom: 16 }}>
                  <AudioPlayer src={playableSrc} size="lg" premium={false} titre={ep.titre} serie={ep.serie} id={ep.id} />
                </div>
              ) : (
                audioCheckDone && <p style={{ color: '#ef4444', fontSize: '0.84rem', marginBottom: 12 }}>Fichier audio introuvable pour cet épisode.</p>
              )}
              {playableSrc && (
                <div style={{ marginBottom: 14 }}>
                  <button
                    onClick={() => setShowLyrics(v => !v)}
                    style={{
                      padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                      border: '1px solid rgba(240,180,41,0.28)', background: 'rgba(240,180,41,0.08)',
                      color: '#F0B429', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Outfit,sans-serif',
                    }}
                  >
                    {showLyrics ? 'Masquer les lyrics' : 'Afficher les lyrics'}
                  </button>
                  {showLyrics && (
                    <div style={{
                      marginTop: 10, maxHeight: 240, overflowY: 'auto',
                      background: '#0D1117', border: '1px solid #1A2332', borderRadius: 10, padding: 12,
                    }}>
                      {hasLyrics ? (
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#D1D5DB', fontSize: '0.84rem', lineHeight: 1.6 }}>
                          {lyricsText}
                        </p>
                      ) : (
                        <p style={{ margin: 0, color: '#8B95A5', fontSize: '0.8rem' }}>
                          Lyrics non disponibles pour cet épisode pour le moment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="detail-hero-btns">
                <button
                  className="detail-btn detail-btn--gold"
                  style={{ background: 'linear-gradient(135deg,#18A84A,#15903f)', color: '#fff', border: 'none' }}
                  onClick={() => setViewer({ type: 'audio', src: playableSrc, titre: ep.titre })}
                >
                  🎧 Écouter en plein écran
                </button>
              </div>
            </>
          ) : (
            <MemberGate
              fallback={
                <>
                  {playableSrc && (
                    <>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Extrait de 40 secondes :
                      </p>
                      <PreviewPlayer src={playableSrc} limit={40} />
                    </>
                  )}
                  <PodcastPaymentOptions ep={ep} onBuy={() => setPayflow(true)} />
                </>
              }
            >
              <>
                {playableSrc ? (
                  <div style={{ width: '100%', marginBottom: 16 }}>
                    <AudioPlayer src={playableSrc} size="lg" premium={false} titre={ep.titre} serie={ep.serie} id={ep.id} />
                  </div>
                ) : (
                  audioCheckDone && <p style={{ color: '#ef4444', fontSize: '0.84rem', marginBottom: 12 }}>Fichier audio introuvable pour cet épisode.</p>
                )}
                {playableSrc && (
                  <div style={{ marginBottom: 14 }}>
                    <button
                      onClick={() => setShowLyrics(v => !v)}
                      style={{
                        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                        border: '1px solid rgba(240,180,41,0.28)', background: 'rgba(240,180,41,0.08)',
                        color: '#F0B429', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Outfit,sans-serif',
                      }}
                    >
                      {showLyrics ? 'Masquer les lyrics' : 'Afficher les lyrics'}
                    </button>
                    {showLyrics && (
                      <div style={{
                        marginTop: 10, maxHeight: 240, overflowY: 'auto',
                        background: '#0D1117', border: '1px solid #1A2332', borderRadius: 10, padding: 12,
                      }}>
                        {hasLyrics ? (
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#D1D5DB', fontSize: '0.84rem', lineHeight: 1.6 }}>
                            {lyricsText}
                          </p>
                        ) : (
                          <p style={{ margin: 0, color: '#8B95A5', fontSize: '0.8rem' }}>
                            Lyrics non disponibles pour cet épisode pour le moment.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="detail-hero-btns">
                  <button
                    className="detail-btn detail-btn--gold"
                    style={{ background: 'linear-gradient(135deg,#18A84A,#15903f)', color: '#fff', border: 'none' }}
                    onClick={() => setViewer({ type: 'audio', src: playableSrc, titre: ep.titre })}
                  >
                    🎧 Écouter en plein écran
                  </button>
                </div>
              </>
            </MemberGate>
          )}

          <ShareButtons titre={ep.titre} type="podcast" />
        </div>
      </section>

      {similar.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Épisodes similaires</h2>
          <div className="detail-similar">
            {similar.map((p) => (
              <Link key={p.id} to={`/podcasts/${slugify(p.titre)}`} className="detail-similar-card">
                <CoverImage titre={p.titre} categorie={p.serie} type="audio" brand="podcast" size="sm" />
                <div className="detail-similar-body">
                  <div className="detail-similar-title">{p.titre}</div>
                  <div className="detail-similar-prix" style={{ color: (p.gratuit || !p.premium) ? 'var(--green)' : '#8B5CF6' }}>
                    {(p.gratuit || (!p.premium && p.audio_url)) ? 'Gratuit' : p.premium ? 'Premium 🔒' : '—'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default PodcastDetail

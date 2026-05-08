import { useEffect, useState } from 'react'
import { podcasts, waLink, slugify, formatPrix } from '../data/products'
import { useAuth } from '../context/AuthContext'
import { loadPodcastOverrides, mergePodcastWithOverride } from '../lib/podcastsRuntime'
import './Podcasts.css'
import PaymentFlow from '../components/PaymentFlow'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import GradientOrbs from '../components/premium/GradientOrbs'
import SectionReveal from '../components/premium/SectionReveal'
import BienvenuePlayer from '../components/BienvenuePlayer'
import { Link } from 'react-router-dom'
import { CoverImage } from '../components/CoverImage'
import { AudioPlayer } from '../components/AudioPlayer'

const TABS = ['Business & Digital', 'Éducatif', 'Souffle Kairos']

function Podcasts() {
  const [tab, setTab] = useState('Business & Digital')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [payProduct, setPayProduct] = useState(null)
  const [runtimePodcasts, setRuntimePodcasts] = useState(podcasts)
  const { isAdmin, isMember } = useAuth()

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

  const filtered = runtimePodcasts.filter((e) => e.serie === tab && e.id !== 'pod-bienvenue')
  const freeCount = runtimePodcasts.filter((p) => !p.premium && p.audio_url).length

  useEffect(() => {
    // Warm up a few audio files to reduce first-play latency.
    const preloadTargets = filtered.filter((ep) => ep.audio_url).slice(0, 4)
    const preloaded = preloadTargets.map((ep) => {
      const a = new Audio()
      a.preload = 'metadata'
      a.src = ep.audio_url
      return a
    })
    return () => {
      preloaded.forEach((a) => {
        a.src = ''
      })
    }
  }, [tab, filtered])

  return (
    <main className="pod-page">
      {payProduct && (
        <PaymentFlow product={payProduct} onClose={() => setPayProduct(null)} />
      )}

      <section className="pod-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <ParticlesBackground count={30} color="#18A84A" linkDistance={100} opacity={0.25} />
        <GradientOrbs variant="green" intensity={0.3} count={2} />
        <SectionReveal as="span" className="pod-badge" delay={0}>Audio — {runtimePodcasts.length} episodes dont {freeCount} gratuits</SectionReveal>
        <SectionReveal as="h1" className="pod-hero-title" delay={100}>ABAWI <span className="text-green">Podcasts</span></SectionReveal>
        <SectionReveal as="p" className="pod-hero-sub" delay={200}>Analyses, interviews et decryptages. Le savoir africain en audio.</SectionReveal>
      </section>

      {/* Bienvenue featured */}
      <SectionReveal as="section" className="pod-bienvenue" direction="up" distance={32}>
        <BienvenuePlayer />
      </SectionReveal>

      <SectionReveal as="div" className="pod-tabs" direction="up" distance={32}>
        {TABS.map((t) => (
          <button key={t} className={`pod-tab ${tab === t ? 'pod-tab--active' : ''}`} onClick={() => setTab(t)}>
            {t} <span className="pod-tab-count">{runtimePodcasts.filter((p) => p.serie === t).length}</span>
          </button>
        ))}
      </SectionReveal>

      <SectionReveal as="div" className="pod-grid" direction="up" distance={32}>
        {filtered.map((ep, i) => (
          <article key={ep.id} className={`pod-card ${!ep.premium && ep.audio_url ? 'pod-card--free' : ''}`}>
            <Link to={`/podcasts/${slugify(ep.titre)}`} className="pod-card-cover">
              <CoverImage titre={ep.titre} categorie={ep.serie} type="audio" brand="podcast" size="md" />
              {ep.premium
                ? <span className="pod-card-premium">{ep.audio_url ? '🔒 Extrait 45s — Complet avec ABAWI+' : '🔒 PREMIUM'}</span>
                : <span className="pod-card-free-badge">▶ GRATUIT</span>}
            </Link>
            <div className="pod-card-body">
              <span className="pod-card-serie">{ep.serie}</span>
              <Link to={`/podcasts/${slugify(ep.titre)}`}><h3 className="pod-card-title">{ep.titre}</h3></Link>

              {/* Player */}
              {ep.audio_url ? (
                <AudioPlayer src={ep.audio_url} size="md" premium={isMember ? false : ep.premium} titre={ep.titre} serie={ep.serie} id={ep.id} />
              ) : isAdmin ? (
                <div style={{ padding: '10px', color: '#8B95A5', fontSize: '0.8rem', textAlign: 'center' }}>
                  🎧 Audio en préparation
                </div>
              ) : (
                <div style={{
                  padding: '12px', borderRadius: 10, textAlign: 'center',
                  border: '1px solid rgba(240,180,41,0.18)', background: 'rgba(240,180,41,0.04)',
                }}>
                  <div style={{ color: '#F0B429', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                    🎧 Audio en cours de publication
                  </div>
                  <a
                    href={waLink(ep.titre, ep.prix || null)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Être notifié sur WhatsApp
                  </a>
                </div>
              )}
              {!!ep.lyrics && (
                <details style={{ marginTop: 10, border: '1px solid #1A2332', borderRadius: 10, padding: '8px 10px', background: '#0B1119' }}>
                  <summary style={{ color: '#F0B429', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                    📝 Lyrics disponibles
                  </summary>
                  <p style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#9CA3AF', fontSize: '0.76rem', lineHeight: 1.5, maxHeight: 140, overflowY: 'auto' }}>
                    {String(ep.lyrics).slice(0, 1200)}
                  </p>
                </details>
              )}

              {/* Payment CTA for premium episodes with a price */}
              {ep.premium && !isMember && ep.prix && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => setPayProduct({ id: ep.id, titre: ep.titre, prix: ep.prix, type: 'podcast' })}
                    style={{
                      width: '100%', padding: '9px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #F0B429, #e5a820)',
                      color: '#070B0F', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    Débloquer — {formatPrix(ep.prix)}
                  </button>
                  <Link to="/plans" style={{
                    textAlign: 'center', fontSize: '0.75rem', color: '#8B95A5',
                    textDecoration: 'none',
                  }}>
                    Ou accéder à tout avec ABAWI+ →
                  </Link>
                </div>
              )}
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="pod-empty">Aucun episode dans cette categorie.</p>}
      </SectionReveal>
      <SectionReveal as="section" className="pod-notify" direction="up" distance={32}>
        <h2 className="pod-notify-title">Nouveaux episodes bientot</h2>
        <p className="pod-notify-desc">Soyez notifie des la sortie.</p>
        {subscribed ? (
          <p className="pod-notify-ok">Merci ! Vous serez notifie.</p>
        ) : (
          <form className="pod-notify-form" onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true) }}>
            <input type="email" className="pod-notify-input" placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" className="pod-notify-btn">Me notifier</button>
          </form>
        )}
      </SectionReveal>
    </main>
  )
}

export default Podcasts

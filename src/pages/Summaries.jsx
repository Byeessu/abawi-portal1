import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { summaries as staticSummaries } from '../data/products'
import ParticlesBackground from '../components/premium/ParticlesBackground'
import SectionReveal from '../components/premium/SectionReveal'
import './Podcasts.css'

function SummaryCard({ summary }) {
  return (
    <div className="pod-card">
      <div className="pod-card-cover" style={{ position: 'relative' }}>
        <div style={{
          width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, #0B1119, #1A2332)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(240,180,41,0.15)', overflow: 'hidden'
        }}>
          <span style={{ fontSize: '3rem' }}>🎙️</span>
        </div>
        <span className="pod-card-free-badge">GRATUIT</span>
      </div>
      <div className="pod-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="pod-card-serie">{summary.categorie}</span>
        </div>
        <h3 className="pod-card-title">{summary.titre}</h3>
        <audio controls style={{ width: '100%', marginTop: 12, height: 36 }} src={summary.audio_url} />
      </div>
    </div>
  )
}

function Summaries() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchSummaries()
  }, [])

  async function fetchSummaries() {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase.from('summaries').select('*').eq('active', true).order('created_at', { ascending: false })
      if (error) throw error
      setSummaries(data || [])
    } catch (e) {
      console.error('[Summaries] fetch error:', e)
      setSummaries(staticSummaries)
    }
    setLoading(false)
  }

  const filtered = search
    ? summaries.filter(s => s.titre.toLowerCase().includes(search.toLowerCase()) || (s.categorie || '').toLowerCase().includes(search.toLowerCase()))
    : summaries

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
              Résumés Audio
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Écoutez les résumés audio de nos meilleurs guides et formations.
            </p>
          </SectionReveal>
        </section>

        {/* Search */}
        <div style={{ padding: '0 24px', marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un résumé..."
            style={{
              padding: '10px 16px', borderRadius: 12, border: '1.5px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              minWidth: 300, fontSize: '0.9rem'
            }}
          />
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
              <p style={{ color: 'var(--text-secondary)' }}>Aucun résumé trouvé.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {filtered.map(s => (
                <SummaryCard key={s.id} summary={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Summaries

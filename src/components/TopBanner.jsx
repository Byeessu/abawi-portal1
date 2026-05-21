import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const MESSAGES_FIXES = [
  '🌍 Bienvenue sur ABAWI — Excellence Africaine · Dakar, Sénégal',
  '🧠 SMART QUOTAS — Limites intelligentes d\'usage · Gratuit mais protégé',
  '🤖 ABAWI IA — Quiz adaptatifs · Recherche experte · Simulations Pro',
  '🛠️ Outils IA : CV Pro · Business Plan · Analyse CV · Pitch Deck',
  '💎 ABAWI+ : Accès illimité · 4 900 FCFA/mois · 44 100 FCFA/an',
  '💻 Store IT : Matériel informatique professionnel à Dakar',
  '🎓 Arkel Up Center — Formations tech & entrepreneuriat',
  '📚 Plus de 70 guides professionnels · Business · Marketing · Tech · IA',
  '🎧 Podcasts business · Entrepreneuriat · Finance africaine',
  '⚖️ Outils Élite : Finance · Juridique OHADA · Comptabilité SYSCOHADA',
  '💳 Abawi Pay — 0% de frais entre comptes · Transferts internationaux dès 0,7%',
  '📞 WhatsApp ABAWI : +221 77 518 50 50 · Réponse rapide garantie',
]

function getWeatherIcon(code) {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code <= 3) return '☁️'
  if (code <= 49) return '🌫️'
  if (code <= 59) return '🌦️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 99) return '⛈️'
  return '🌡️'
}

function getWeatherDesc(code) {
  if (code === 0) return 'Ensoleillé'
  if (code <= 2) return 'Peu nuageux'
  if (code <= 3) return 'Nuageux'
  if (code <= 49) return 'Brumeux'
  if (code <= 59) return 'Bruine'
  if (code <= 69) return 'Pluie'
  if (code <= 79) return 'Neige'
  if (code <= 82) return 'Averses'
  if (code <= 99) return 'Orage'
  return 'Variable'
}

export default function TopBanner() {
  const [dismissed, setDismissed] = useState(
    !!sessionStorage.getItem('abawi_banner_closed')
  )
  const [tickerText, setTickerText] = useState(
    MESSAGES_FIXES.join('   •   ') + '   •   '
  )
  const [weather, setWeather] = useState(null)
  const [time, setTime] = useState(new Date())

  // Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Météo Dakar via Open-Meteo (gratuit, sans clé API)
  useEffect(() => {
    if (dismissed) return
    async function loadWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?' +
          'latitude=14.6937&longitude=-17.4441' +
          '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
          '&wind_speed_unit=kmh&timezone=Africa%2FDakar'
        )
        const data = await res.json()
        const current = data.current
        setWeather({
          temp: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m),
          code: current.weather_code,
          icon: getWeatherIcon(current.weather_code),
          desc: getWeatherDesc(current.weather_code),
        })
      } catch {
        // Silencieux
      }
    }
    loadWeather()
    const weatherTimer = setInterval(loadWeather, 10 * 60 * 1000)
    return () => clearInterval(weatherTimer)
  }, [dismissed])

  // News depuis Supabase
  useEffect(() => {
    if (dismissed) return
    async function loadNews() {
      try {
        const { data } = await supabase
          .from('news')
          .select('ti, tag')
          .eq('statut', 'publié')
          .order('created_at', { ascending: false })
          .limit(10)
        const newsMessages = (data || []).map(n =>
          `📰 ${n.tag ? '[' + n.tag + '] ' : ''}${n.ti}`
        )
        const all = [...MESSAGES_FIXES, ...newsMessages]
        setTickerText(all.join('   •   ') + '   •   ')
      } catch {
        // Garder messages fixes
      }
    }
    loadNews()
  }, [dismissed])

  function close() {
    setDismissed(true)
    sessionStorage.setItem('abawi_banner_closed', 'true')
  }

  if (dismissed) return null

  const heureStr = time.toLocaleTimeString('fr-FR', {
    timeZone: 'Africa/Dakar',
    hour: '2-digit',
    minute: '2-digit',
  })

  const dateStr = time.toLocaleDateString('fr-FR', {
    timeZone: 'Africa/Dakar',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="top-banner-bar" style={{
      width: '100%',
      height: '28px',
      background: 'var(--bg-card)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      fontSize: '0.75rem',
    }}>

      {/* GAUCHE — Météo + Heure */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', gap: '8px',
        paddingLeft: '10px', paddingRight: '80px',
        background: 'linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card) 30%, color-mix(in srgb, var(--bg-card) 70%, transparent) 60%, transparent 100%)',
        zIndex: 2, flexShrink: 0,
      }}>
        {/* Heure */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          <span style={{fontSize: '0.75rem'}}>🕐</span>
          <span>{heureStr}</span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.12)' }} />

        {/* Météo */}
        {weather ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '0.75rem', color: 'var(--text-primary)',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            <span>{weather.icon}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{weather.temp}°</span>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🌡️ Dakar</div>
        )}
      </div>

      {/* CENTRE — Ticker défilant */}
      <div style={{
        position: 'absolute',
        left: '140px',
        right: '110px',
        top: 0, bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          animation: 'tickerScroll 70s linear infinite',
          willChange: 'transform',
        }}>
          {[0, 1].map(i => (
            <span key={i} style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '0.1px',
              opacity: 0.92,
              paddingRight: '60px',
            }}>
              {tickerText}
            </span>
          ))}
        </div>
      </div>

      {/* DROITE — ABAWI+ + Annah + Fermer */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', gap: '4px',
        paddingRight: '8px', paddingLeft: '80px',
        background: 'linear-gradient(270deg, var(--bg-card) 0%, var(--bg-card) 30%, color-mix(in srgb, var(--bg-card) 70%, transparent) 60%, transparent 100%)',
        zIndex: 2,
      }}>
        <Link to="/digital/pack/abawi-plus" style={{
          padding: '4px 10px', borderRadius: '100px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          color: 'var(--accent-text)', fontSize: '0.75rem', fontWeight: 700,
          textDecoration: 'none', letterSpacing: '0.3px',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-glow)'}
        >ABAWI+</Link>

        <Link to="/outils/abawi-ia#annah" style={{
          padding: '4px 10px', borderRadius: '100px',
          background: 'var(--gold-glow)',
          border: '1px solid var(--gold-border)',
          color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700,
          textDecoration: 'none', letterSpacing: '0.2px',
          whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--gold-glow)'}
          title="Annah AI"
        >✦</Link>

        <button onClick={close} style={{
          background: 'var(--bg-card-hover)',
          border: 'none', borderRadius: '50%',
          width: '28px', height: '28px',
          color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, lineHeight: 1, flexShrink: 0,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          title="Fermer"
        >✕</button>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

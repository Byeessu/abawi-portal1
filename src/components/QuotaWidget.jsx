import { useEffect, useState } from 'react'
import { checkQuota, formatTimeUntil } from '../lib/quotas'
import { useAuth } from '../context/AuthContext'

/**
 * Widget affichant les quotas restants pour un outil
 * Usage: <QuotaWidget toolKey="audio_studio" compact />
 */
export default function QuotaWidget({ toolKey, compact = false }) {
  const { membre } = useAuth()
  const [state, setState] = useState({ loading: true, quota: null })

  useEffect(() => {
    if (!membre?.email) return
    checkQuota(membre.email, toolKey, membre).then(q => {
      setState({ loading: false, quota: q })
    })
  }, [membre, toolKey])

  if (state.loading) return null
  const q = state.quota

  // Pas de quota configuré
  if (!q || q.limit === 0) return null

  // Illimité (admin)
  if (q.unlimited) {
    return compact ? (
      <span style={badgeStyle}>♾️ Illimité</span>
    ) : (
      <div style={containerStyle}>♾️ Accès illimité</div>
    )
  }

  const pct = q.limit > 0 ? (q.used / q.limit) * 100 : 0
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e'

  if (compact) {
    return (
      <span style={{ ...badgeStyle, color, borderColor: color + '40', background: color + '12' }}>
        {q.remaining}/{q.limit} {windowLabel(q.windowType)}
      </span>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Utilisations restantes
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>
          {q.remaining} / {q.limit}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      {q.remaining === 0 && q.nextReset && (
        <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 4 }}>
          ⏳ Réinitialisation dans {formatTimeUntil(q.nextReset)}
        </div>
      )}
      {q.remaining > 0 && q.remaining <= 2 && (
        <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 4 }}>
          ⚠️ Presque épuisé
        </div>
      )}
    </div>
  )
}

function windowLabel(w) {
  return { hour: '/h', day: '/j', week: '/sem', month: '/mois' }[w] || ''
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 100,
  fontSize: '0.7rem',
  fontWeight: 700,
  border: '1px solid',
}

const containerStyle = {
  padding: '8px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  marginBottom: 12,
}

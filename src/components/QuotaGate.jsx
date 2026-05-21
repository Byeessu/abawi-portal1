import { useEffect, useState } from 'react'
import { checkQuota, formatTimeUntil } from '../lib/quotas'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

/**
 * Bloque l'accès si quota dépassé, avec CTA upgrade
 * Usage: <QuotaGate toolKey="audio_studio" cost={6}>{children}</QuotaGate>
 */
export default function QuotaGate({ toolKey, cost = 0, children, onAccess }) {
  const { membre, isAdmin } = useAuth()
  const [state, setState] = useState({ loading: true, quota: null })

  useEffect(() => {
    if (!membre?.email) { Promise.resolve().then(() => setState({ loading: false, quota: null })); return }
    if (isAdmin) { Promise.resolve().then(() => setState({ loading: false, quota: { ok: true, unlimited: true } })); return }
    checkQuota(membre.email, toolKey, membre).then(q => {
      Promise.resolve().then(() => setState({ loading: false, quota: q }))
    })
  }, [membre, toolKey, isAdmin])

  if (state.loading) {
    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>Vérification des quotas...</div>
  }

  const q = state.quota

  // Pas de quota = laisse passer (crédits gèrent)
  if (!q || q.ok === undefined) return children

  // Admin / illimité
  if (q.unlimited) return children

  // Quota OK
  if (q.ok && (!q.actionType || q.actionType !== 'premium_cost')) {
    return children
  }

  // Dépassement avec coût majoré — l'utilisateur a encore accès, pas de bannière
  if (q.ok && q.actionType === 'premium_cost') {
    return children
  }

  // BLOQUÉ — affiche le gate
  return (
    <div style={gateStyle}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚧</div>
      <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
        Limite atteinte
      </h3>
      <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
        {q.message || `Vous avez utilisé ${q.used}/${q.limit} utilisations autorisées.`}
        <br />
        {q.nextReset && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Réinitialisation dans {formatTimeUntil(q.nextReset)}
          </span>
        )}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
        {cost > 0 && q.costOverride && (
          <button
            onClick={onAccess}
            style={{
              padding: '14px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: '0.9rem',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
            }}
          >
            💳 Continuer pour {q.costOverride} crédits
          </button>
        )}
        <Link to="/credits" style={{
          padding: '12px', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
          background: 'linear-gradient(135deg, #F0B429, #e5a820)', color: '#070B0F', fontWeight: 800,
        }}>
          ⬆️ Acheter des crédits
        </Link>
        <Link to="/plans" style={{
          padding: '12px', borderRadius: 10, textDecoration: 'none', textAlign: 'center',
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontWeight: 700,
        }}>
          💎 Passer à un plan supérieur
        </Link>
      </div>
    </div>
  )
}

const gateStyle = {
  padding: '32px 24px',
  borderRadius: 16,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  textAlign: 'center',
}

const premiumBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(245,158,11,0.08)',
  border: '1px solid rgba(245,158,11,0.2)',
  color: 'var(--text-secondary)',
  marginBottom: 12,
}

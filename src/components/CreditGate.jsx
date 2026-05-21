import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { checkCredits, debitCredits, CREDIT_COSTS } from '../lib/credits'
import { Link } from 'react-router-dom'

export default function CreditGate({ type, produitId, children, onAccess }) {
  const { membre, isAdmin } = useAuth()
  const [status, setStatus] = useState('checking')
  const [solde, setSolde] = useState(0)
  const [loading, setLoading] = useState(false)
  const cost = CREDIT_COSTS[type] || 0

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
    if (!membre) { setStatus('no_account'); return }
    if (isAdmin) { setStatus('ok'); return }
    checkCredits(membre.email, type).then(result => {
      if (result.ok) setStatus('ok')
      else { setStatus('insufficient'); setSolde(result.solde || 0) }
    })
  }, [membre, type, isAdmin])

  async function handleAccess() {
    if (!membre) return
    setLoading(true)
    const result = await debitCredits(membre.email, type, produitId)
    if (result.ok) { setStatus('ok'); if (onAccess) onAccess() }
    setLoading(false)
  }

  if (status === 'checking') return <div style={{ textAlign: 'center', padding: '20px', color: '#8B95A5' }}>Vérification...</div>
  if (status === 'ok') return children
  if (status === 'no_account') return (
    <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)', textAlign: 'center' }}>
      <p style={{ color: '#8B95A5', marginBottom: '14px' }}>Connectez-vous pour accéder à ce contenu</p>
      <Link to="/login" style={{ padding: '10px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #F0B429, #e5a820)', color: '#070B0F', fontWeight: 800, textDecoration: 'none' }}>Se connecter</Link>
    </div>
  )
  return (
    <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💎</div>
      <h3 style={{ color: '#F0F2F5', fontWeight: 800, marginBottom: '6px' }}>Crédits épuisés</h3>
      <p style={{ color: '#8B95A5', fontSize: '0.85rem', marginBottom: '16px' }}>
        Ce contenu nécessite <strong style={{ color: '#F0B429' }}>{cost} crédit{cost > 1 ? 's' : ''}</strong>. Rechargez ou passez à un abonnement.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link to="/plans" style={{ padding: '14px', borderRadius: '12px', textDecoration: 'none', background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)', color: '#fff', fontWeight: 800 }}>💎 Passer à un abonnement</Link>
        <Link to="/credits" style={{ padding: '12px', borderRadius: '10px', textDecoration: 'none', background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700 }}>💳 Acheter un pack de crédits</Link>
      </div>
    </div>
  )
}

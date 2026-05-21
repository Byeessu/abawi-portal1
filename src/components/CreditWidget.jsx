import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTokenBalance } from '../lib/credits'
import { Link } from 'react-router-dom'

export default function CreditWidget() {
  const { membre, isAdmin } = useAuth()
  const [state, setState] = useState({ credits: 0, tokens: 0, total: 0, consumed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!membre?.email) {
      Promise.resolve().then(() => setLoading(false))
      return
    }
    Promise.resolve().then(() => {
      getTokenBalance(membre.email).then(bal => { setState(bal); setLoading(false) })
    })
    const id = setInterval(() => {
      getTokenBalance(membre.email).then(bal => setState(bal))
    }, 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membre])

  if (!membre || isAdmin || loading) return null

  const { total, credits, consumed } = state
  const isLow = total < 5000
  const isEmpty = total === 0

  return (
    <Link to="/credits" style={{ textDecoration: 'none' }} title={`${total.toLocaleString('fr-FR')} tokens (${credits} crédits) — ${consumed.toLocaleString('fr-FR')} consommés`}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        background: isEmpty ? 'rgba(239,68,68,0.12)' : isLow ? 'rgba(240,180,41,0.12)' : 'rgba(139,92,246,0.08)',
        border: `1px solid ${isEmpty ? 'rgba(239,68,68,0.25)' : isLow ? 'rgba(240,180,41,0.25)' : 'rgba(139,92,246,0.2)'}`,
        transition: 'all 0.2s', cursor: 'pointer',
      }}>
        <span style={{ fontSize: '0.85rem' }}>{isEmpty ? '❌' : isLow ? '⚠️' : '�'}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isEmpty ? '#ef4444' : isLow ? '#F0B429' : '#8B5CF6' }}>
          {total.toLocaleString('fr-FR')} tk
        </span>
      </div>
    </Link>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCredits } from '../lib/credits'
import { Link } from 'react-router-dom'

export default function CreditWidget() {
  const { membre, isAdmin } = useAuth()
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!membre?.email) return
    getCredits(membre.email).then(c => { setCredits(c); setLoading(false) })
  }, [membre])

  if (!membre || isAdmin || loading) return null

  const isLow = credits < 10
  const isEmpty = credits === 0

  return (
    <Link to="/credits" style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        background: isEmpty ? 'rgba(239,68,68,0.12)' : isLow ? 'rgba(240,180,41,0.12)' : 'rgba(24,168,74,0.1)',
        border: `1px solid ${isEmpty ? 'rgba(239,68,68,0.25)' : isLow ? 'rgba(240,180,41,0.25)' : 'rgba(24,168,74,0.2)'}`,
        transition: 'all 0.2s', cursor: 'pointer',
      }}>
        <span style={{ fontSize: '0.85rem' }}>{isEmpty ? '❌' : isLow ? '⚠️' : '💎'}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isEmpty ? '#ef4444' : isLow ? '#F0B429' : '#18A84A' }}>
          {credits} cr.
        </span>
      </div>
    </Link>
  )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDaysUntilExpiry } from '../lib/productAccess'

export default function ToolAccessHeader({ toolAccess, toolName = 'Outil' }) {
  const { membre } = useAuth()
  const { allowed, cost, unlimited, error, loading } = toolAccess

  if (loading) return null

  // Pas connecté
  if (error === 'non_connecte') {
    return (
      <div style={{
        marginBottom: 16, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        color: '#EF4444', fontSize: '0.85rem', fontWeight: 600,
      }}>
        🔒 Connectez-vous pour utiliser {toolName}
      </div>
    )
  }

  // Accès OK → silence total, sauf expiration imminente (≤ 3 jours)
  if (allowed || unlimited) {
    const daysLeft = getDaysUntilExpiry(membre, toolName)
    const isVeryClose = daysLeft !== null && daysLeft !== Infinity && daysLeft <= 3 && daysLeft >= 0
    if (!isVeryClose) return null
    return (
      <div style={{
        marginBottom: 16, padding: '10px 14px', borderRadius: 10,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 600 }}>
          ⏳ Votre accès expire {daysLeft === 0 ? "aujourd'hui" : `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}.
        </span>
        <Link to="/plans" style={{
          fontSize: '0.75rem', fontWeight: 700, color: '#fff',
          background: '#EF4444', padding: '5px 10px', borderRadius: 6, textDecoration: 'none',
        }}>Renouveler</Link>
      </div>
    )
  }

  // Accès bloqué
  const isCreditBlock = error === 'credits_insuffisants'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: isCreditBlock ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isCreditBlock ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
        color: isCreditBlock ? '#F59E0B' : '#EF4444', fontSize: '0.85rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
      }}>
        <span>
          {isCreditBlock
            ? `⚡ Crédits épuisés — ${toolName} nécessite ${cost} crédit${cost > 1 ? 's' : ''}`
            : `🔒 ${toolName} — Accès restreint`}
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/plans" style={{
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)',
            padding: '5px 10px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Voir les formules →</Link>
          {isCreditBlock && (
            <Link to="/credits" style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              padding: '5px 10px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Acheter des crédits</Link>
          )}
        </div>
      </div>
    </div>
  )
}

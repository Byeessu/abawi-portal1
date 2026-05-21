import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ExpiryReminder({ reminder, onDismiss, context = 'product' }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (!reminder || dismissed) return null

  const { daysLeft, type } = reminder
  const isUrgent = daysLeft <= 3

  const messages = {
    subscription: {
      title: isUrgent ? 'Votre abonnement expire bientôt' : 'Renouvellement à prévoir',
      body: isUrgent
        ? `Il ne vous reste que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'accès. Renouvelez pour ne pas être interrompu.`
        : `Votre abonnement se termine dans ${daysLeft} jours. Pensez à le renouveler.`,
      action: 'Renouveler mon abonnement',
      path: '/plans',
    },
    purchased: {
      title: isUrgent ? 'Votre accès expire très bientôt' : 'Accès en cours d\'expiration',
      body: isUrgent
        ? `Votre accès à ce produit expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`
        : `Ce produit reste accessible encore ${daysLeft} jours.`,
      action: 'Prolonger mon accès',
      path: '/credits',
    },
  }

  const msg = messages[type] || messages.subscription

  return (
    <div style={{
      marginBottom: 16,
      padding: '14px 18px',
      borderRadius: 12,
      background: isUrgent ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.06))' : 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06))',
      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>⏳</span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.88rem',
          color: isUrgent ? '#EF4444' : '#3B82F6',
          marginBottom: 4,
        }}>
          {msg.title}
        </div>
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 10,
        }}>
          {msg.body}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(msg.path)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: isUrgent ? '#EF4444' : '#3B82F6',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            {msg.action}
          </button>
          <button
            onClick={() => { setDismissed(true); onDismiss?.() }}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

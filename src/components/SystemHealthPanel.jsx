import { useState, useEffect } from 'react'
import { healthMonitor, useHealthMonitor } from '../lib/healthCheck'

/**
 * Panneau de santé système - Visualisation du statut des services
 * Visible uniquement pour les admins ou en mode debug
 */
export default function SystemHealthPanel({ compact = false }) {
  const health = useHealthMonitor()
  const [expanded, setExpanded] = useState(!compact)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    const checkAdmin = async () => {
      // Simuler la vérification - à remplacer par votre logique réelle
      const adminStatus = localStorage.getItem('isAdmin') === 'true' || import.meta.env.DEV
      setIsAdmin(adminStatus)
    }
    checkAdmin()
  }, [])

  if (!isAdmin) return null

  const statusColors = {
    healthy: '#18A84A',
    degraded: '#F0B429',
    critical: '#E53E3E',
    unknown: '#718096',
    unhealthy: '#E53E3E',
    error: '#E53E3E',
  }

  const statusIcons = {
    healthy: '✅',
    degraded: '⚠️',
    critical: '❌',
    unknown: '❓',
    unhealthy: '❌',
    error: '❌',
  }

  const services = Object.entries(health.services || {})

  if (compact) {
    return (
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'var(--bg-card)',
          border: `2px solid ${statusColors[health.status] || statusColors.unknown}`,
          borderRadius: '100px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem',
          fontWeight: '600',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span>{statusIcons[health.status]}</span>
        <span style={{ color: statusColors[health.status] || statusColors.unknown }}>
          Système {health.status}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>🔍 Santé Système</h3>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0',
            color: 'var(--text-muted)',
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          padding: '8px 12px',
          background: statusColors[health.status] + '20',
          borderRadius: '8px',
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
          {statusIcons[health.status]}
        </span>
        <span
          style={{
            color: statusColors[health.status],
            fontWeight: '700',
            textTransform: 'uppercase',
          }}
        >
          {health.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {services.map(([key, service]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
              background: 'var(--bg-card-hover)',
              borderRadius: '6px',
            }}
          >
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                {service.name || key}
              </div>
              {service.latency && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {Math.round(service.latency)}ms
                </div>
              )}
            </div>
            <span style={{ fontSize: '1.2rem' }}>
              {statusIcons[service.status]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Dernière mise à jour: {new Date(health.timestamp).toLocaleTimeString('fr-FR')}
      </div>

      <button
        onClick={() => healthMonitor.checkAll()}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '8px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        🔄 Vérifier maintenant
      </button>
    </div>
  )
}

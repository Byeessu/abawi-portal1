import { useState } from 'react'

/**
 * Panneau d'information explicative pour les outils Élite
 * Affiche: pourquoi cet outil, comment il est utile, comment l'utiliser
 */
export default function ToolInfoPanel({ toolName, icon, description, benefits, howToUse, tips }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '20px',
      overflow: 'hidden'
    }}>
      {/* Header toujours visible */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.1rem', 
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {toolName}
            </h3>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)'
            }}>
              {description}
            </p>
          </div>
        </div>
        <div style={{
          padding: '6px 12px',
          background: 'var(--accent)',
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          {isOpen ? 'Masquer ▲' : 'En savoir plus ▼'}
        </div>
      </div>

      {/* Contenu dépliable */}
      {isOpen && (
        <div style={{ padding: '20px' }}>
          {/* Pourquoi cet outil */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '1rem', 
              fontWeight: 700,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 Pourquoi cet outil ?
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}>
              {benefits.map((benefit, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{benefit}</li>
              ))}
            </ul>
          </div>

          {/* Comment l'utiliser */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '1rem', 
              fontWeight: 700,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🚀 Comment l'utiliser
            </h4>
            <ol style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}>
              {howToUse.map((step, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Conseils pro */}
          {tips && tips.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--border)'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '1rem', 
                fontWeight: 700,
                color: '#F0B429',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⭐ Conseils Pro
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: 1.6
              }}>
                {tips.map((tip, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

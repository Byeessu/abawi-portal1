import { Link } from 'react-router-dom'

/**
 * QuotaPaywall — Affiché quand un utilisateur gratuit atteint ses 3 lectures/mois
 * Propose 3 options : acheter le contenu, débloquer avec crédits, ou passer ABAWI+
 */
export default function QuotaPaywall({ product, access, onBuy, onClose, creditCost = 0 }) {
  return (
    <div style={{
      marginBottom: 16,
      padding: '18px 20px',
      borderRadius: 14,
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.18)',
      color: '#ef4444',
    }}>
      <p style={{ margin: '0 0 14px', fontSize: '0.88rem', lineHeight: 1.5, color: '#ef4444' }}>
        🚫 <strong>Limite atteinte</strong> — Vous avez consulté 3 contenus ce mois-ci.
        <br />
        <span style={{ color: '#8B95A5', fontSize: '0.8rem' }}>
          Débloquez ce contenu ou passez à ABAWI+ pour un accès illimité.
        </span>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {/* Option 1 : Acheter */}
        <button
          onClick={onBuy}
          style={{
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #F0B429, #e5a820)',
            color: '#070B0F', fontWeight: 800, fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}
        >
          💰 Acheter — {product?.prix ? product.prix.toLocaleString() + ' FCFA' : 'Prix sur demande'}
        </button>

        {/* Option 2 : Crédits */}
        {creditCost > 0 && (
          <button
            onClick={() => {/* TODO: credit unlock */}}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1.5px solid #8B5CF6',
              background: 'rgba(139,92,246,0.08)', color: '#8B5CF6',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            🔓 {creditCost} crédit{creditCost > 1 ? 's' : ''}
          </button>
        )}

        {/* Option 3 : ABAWI+ */}
        <Link
          to="/plans"
          onClick={onClose}
          style={{
            padding: '10px 18px', borderRadius: 10, border: '1.5px solid #F0B429',
            background: 'rgba(240,180,41,0.08)', color: '#F0B429',
            fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
            fontFamily: 'Outfit, sans-serif', display: 'inline-flex', alignItems: 'center',
          }}
        >
          💎 ABAWI+ illimité
        </Link>
      </div>
    </div>
  )
}

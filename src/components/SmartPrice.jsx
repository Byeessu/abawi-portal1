import { formatPrix } from '../data/products'

export default function SmartPrice({ product, access, onBuy, onSubscribe, onCreditUnlock, size = 'md' }) {
  const { type, creditCost, canUnlock, solde, manquant } = access

  // Utilisateur a déjà accès → ne pas afficher le prix
  if (type === 'admin' || type === 'subscription' || type === 'purchased' || type === 'public' || type === 'credits') {
    return (
      <div className={`smart-price smart-price--${size}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: size === 'lg' ? '0.9rem' : '0.78rem',
          fontWeight: 700,
          color: type === 'public' ? '#18A84A' : '#3B82F6',
          background: type === 'public' ? 'rgba(24,168,74,0.1)' : 'rgba(59,130,246,0.1)',
          padding: '4px 10px',
          borderRadius: 8,
          border: `1px solid ${type === 'public' ? '#18A84A' : '#3B82F6'}25`,
        }}>
          {type === 'public' ? 'Gratuit — Accès immédiat' : 'Vous avez accès à ce contenu'}
        </span>
      </div>
    )
  }

  // Pas d'accès → afficher prix + options
  const prix = product.prix || 0
  const prixBarre = product.prix_barre || 0
  const eco = prixBarre ? Math.round((1 - prix / prixBarre) * 100) : 0

  const isLarge = size === 'lg'
  const prixSize = isLarge ? '1.6rem' : size === 'md' ? '1.15rem' : '0.95rem'
  const barreSize = isLarge ? '0.95rem' : '0.78rem'

  return (
    <div className={`smart-price smart-price--${size}`}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: prixSize, fontWeight: 800, color: '#F0B429' }}>
          {formatPrix(prix)}
        </span>
        {prixBarre > 0 && (
          <span style={{ fontSize: barreSize, color: '#8B95A5', textDecoration: 'line-through', fontWeight: 500 }}>
            {formatPrix(prixBarre)}
          </span>
        )}
        {eco > 0 && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, color: '#18A84A',
            background: 'rgba(24,168,74,0.12)', borderRadius: 6, padding: '2px 7px',
          }}>
            -{eco}%
          </span>
        )}
      </div>

      {/* Options d'accès */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Achat direct */}
        {onBuy && (
          <button
            onClick={onBuy}
            style={{
              width: '100%', padding: isLarge ? '12px 18px' : '9px 14px',
              borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #F0B429, #e5a820)',
              color: '#070B0F', fontWeight: 800,
              fontSize: isLarge ? '0.92rem' : '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Acheter — {formatPrix(prix)}
          </button>
        )}

        {/* Déblocage crédits */}
        {creditCost > 0 && (
          <button
            onClick={onCreditUnlock}
            disabled={!canUnlock}
            style={{
              width: '100%', padding: isLarge ? '12px 18px' : '9px 14px',
              borderRadius: 10, border: '1px solid #8B5CF6',
              background: canUnlock ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.04)',
              color: canUnlock ? '#8B5CF6' : '#8B95A5',
              fontWeight: 700,
              fontSize: isLarge ? '0.88rem' : '0.78rem',
              cursor: canUnlock ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {canUnlock
              ? `🔓 Débloquer avec ${creditCost} crédit${creditCost > 1 ? 's' : ''} (solde: ${solde || 0})`
              : `🔒 ${creditCost} crédits requis — il vous manque ${manquant || 0}`}
          </button>
        )}

        {/* Abonnement */}
        {onSubscribe && (
          <button
            onClick={onSubscribe}
            style={{
              width: '100%', padding: isLarge ? '10px 16px' : '8px 12px',
              borderRadius: 10, border: '1px solid #F0B429',
              background: 'transparent',
              color: '#F0B429', fontWeight: 700,
              fontSize: isLarge ? '0.85rem' : '0.76rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            💎 ABAWI+ — Accès illimité dès 4 900 F/mois
          </button>
        )}
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useState } from 'react'

/**
 * FreeToolPaywall — Soft paywall non-bloquant affiché quand le quota gratuit
 * journalier est épuisé. L'utilisateur peut :
 *   1. Acheter des crédits (CTA principal)
 *   2. S'abonner ABAWI+ (CTA secondaire)
 *   3. Attendre demain / continuer en lecture seule (CTA tertiaire)
 *
 * Props :
 *   toolName       {string}
 *   usedToday      {number}
 *   limit          {number}
 *   membre         {object|null}
 *   creditCost     {number|null}   coût en crédits pour débloquer
 *   upgradeAction  {string}        'export' | 'generate' | 'full'
 *   onClose        {fn}            fermer la modale (continuer gratuit)
 *   onUseCredit    {fn}            callback si l'utilisateur choisit d'utiliser 1 crédit
 */
export default function FreeToolPaywall({
  toolName,
  usedToday,
  limit,
  membre,
  creditCost,
  soldeCredits = 0,
  upgradeAction = 'utilisation',
  onClose,
  onUseCredit,
}) {
  const [showCreditConfirm, setShowCreditConfirm] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const hoursLeft = Math.ceil((tomorrow - Date.now()) / 3600000)

  const actionLabel = upgradeAction === 'export' ? 'Exporter' : upgradeAction === 'generate' ? 'Générer' : 'Utiliser'
  const needsCredits = creditCost > 0 && soldeCredits < creditCost

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520, width: '100%', padding: '28px 26px',
          borderRadius: 20, border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {needsCredits ? '💎 Crédits insuffisants' : '🎯 Quota atteint'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
          Tu as utilisé <strong style={{ color: 'var(--accent)' }}>{usedToday} / {limit}</strong> utilisations gratuites
          de <strong>{toolName}</strong> aujourd'hui.
          {needsCredits && creditCost > 0 && (
            <>
              {' '}Chaque {upgradeAction === 'export' ? 'export' : 'utilisation'} supplémentaire coûte <strong style={{ color: '#F0B429' }}>{creditCost} crédit{creditCost > 1 ? 's' : ''}</strong>.
            </>
          )}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          {needsCredits
            ? `Solde actuel : ${soldeCredits} crédit${soldeCredits > 1 ? 's' : ''} — besoin de ${creditCost}.`
            : `Quota réinitialisé dans ~${hoursLeft}h`
          }
        </p>

        {/* Progress bar */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{
            height: '100%', borderRadius: 100,
            width: `${Math.min(100, (usedToday / limit) * 100)}%`,
            background: 'linear-gradient(90deg, #0EA5E9, #F0B429)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Primary : use credit (if applicable) */}
          {creditCost && onUseCredit && (
            <button
              onClick={() => setShowCreditConfirm(true)}
              style={{
                display: 'block', width: '100%', padding: '13px 20px', borderRadius: 12,
                background: 'linear-gradient(135deg, #F0B429, #c9a84c)',
                color: '#0a0a0a', fontWeight: 800, fontSize: '0.9rem', border: 'none',
                cursor: 'pointer',
              }}
            >
              ⚡ {actionLabel} maintenant — {creditCost} crédit{creditCost > 1 ? 's' : ''}
            </button>
          )}

          {/* Secondary : buy credits */}
          <Link to="/credits" style={{
            display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: '#fff', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none',
          }}>
            💳 Acheter des crédits
          </Link>

          {/* Tertiary : ABAWI+ */}
          <Link to="/digital/pack/abawi-plus" style={{
            display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 12,
            border: '1.5px solid rgba(240,180,41,0.4)',
            background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(139,92,246,0.06))',
            color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
          }}>
            👑 ABAWI+ — accès illimité à tous les outils
          </Link>

          {/* Quaternary : wait / continue free */}
          {!membre && (
            <Link to="/inscription" style={{
              display: 'block', textAlign: 'center', padding: '11px 20px', borderRadius: 12,
              background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)',
              color: '#0EA5E9', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
            }}>
              ✨ Créer un compte gratuit — {limit} uses/jour
            </Link>
          )}

          <button
            onClick={onClose}
            style={{
              display: 'block', width: '100%', padding: '10px 20px', borderRadius: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ⏳ Attendre ~{hoursLeft}h — continuer gratuitement
          </button>
        </div>

        {/* Credit confirm modal (nested) */}
        {showCreditConfirm && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Confirmer l'utilisation de <strong>{creditCost} crédit{creditCost > 1 ? 's' : ''}</strong> pour {actionLabel.toLowerCase()} ?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowCreditConfirm(false); onUseCredit?.() }}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: '#F0B429', color: '#0a0a0a', fontWeight: 800, fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ✅ Confirmer
              </button>
              <button
                onClick={() => setShowCreditConfirm(false)}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-primary)', color: 'var(--text-muted)', fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * FreeToolQuotaBadge — Badge compact affiché dans l'outil pour montrer le quota restant.
 */
export function FreeToolQuotaBadge({ usesLeft, limit, isUnlimited, toolKey }) {
  if (isUnlimited) return null

  const pct = Math.max(0, usesLeft / limit)
  const color = pct > 0.5 ? '#10B981' : pct > 0.2 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px', borderRadius: 100,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      fontSize: '0.75rem', fontWeight: 700,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
        boxShadow: `0 0 6px ${color}66`,
      }} />
      <span style={{ color: 'var(--text-secondary)' }}>
        {usesLeft > 0
          ? <><strong style={{ color }}>{usesLeft}</strong> utilisation{usesLeft > 1 ? 's' : ''} gratuite{usesLeft > 1 ? 's' : ''} restante{usesLeft > 1 ? 's' : ''}</>
          : <span style={{ color: '#EF4444' }}>Quota atteint</span>
        }
      </span>
    </div>
  )
}

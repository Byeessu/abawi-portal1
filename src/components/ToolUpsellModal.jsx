import { Link } from 'react-router-dom'
import { useState } from 'react'

/**
 * ToolUpsellModal — Modal premium affichée quand un outil est bloqué
 *
 * Props:
 *   isOpen        {boolean}
 *   config        {object}   — résultat de useToolGuard.upsellConfig
 *   onClose       {fn}
 *   onUseCredit   {fn}       — callback si l'utilisateur utilise des crédits
 */
export default function ToolUpsellModal({ isOpen, config, onClose, onUseCredit }) {
  const [confirmCredit, setConfirmCredit] = useState(false)

  if (!isOpen || !config) return null

  const {
    toolName,
    category,
    errorType,
    errorMessage,
    quota,
    cooldown,
    solde,
    cost,
    monthlyPrice,
    limit,
    used,
    remaining,
  } = config

  const hasEnoughCredits = solde >= cost && cost > 0
  const hoursUntilReset = quota?.nextReset
    ? Math.ceil((new Date(quota.nextReset) - Date.now()) / 3600000)
    : 24

  const categoryLabel = {
    GRATUIT_ILLIMITE: 'Outil gratuit',
    GRATUIT_LIMITE:   'Outil gratuit limité',
    FREEMIUM_COOLDOWN:'Outil freemium',
    PREMIUM:          'Outil premium',
    SPECIAL:          'Outil spécial',
  }[category] || 'Outil'

  const errorIcon = {
    non_connecte:          '🔒',
    quota_exceeded:        '🎯',
    cooldown:              '⏳',
    credits_insuffisants:  '💎',
    abonnement_inactif:    '⛔',
  }[errorType] || '⚠️'

  const errorTitle = {
    non_connecte:          'Connexion requise',
    quota_exceeded:        'Quota atteint',
    cooldown:              'Cooldown actif',
    credits_insuffisants:  'Crédits insuffisants',
    abonnement_inactif:    'Abonnement inactif',
  }[errorType] || 'Accès limité'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483647,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 520, width: '100%',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, #161B22 0%, #0D1117 100%)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>

        {/* Header gradient */}
        <div style={{
          padding: '24px 24px 16px',
          background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(139,92,246,0.06))',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8B95A5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {categoryLabel}
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FC', margin: 0 }}>
                {errorIcon} {errorTitle}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
              width: 36, height: 36, fontSize: '1.2rem', color: '#8B95A5', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Message d'erreur */}
          <p style={{ fontSize: '0.85rem', color: '#C9D1D9', lineHeight: 1.6, margin: '0 0 16px' }}>
            {errorMessage}
          </p>

          {/* Barre de quota */}
          {limit > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8B95A5', marginBottom: 6 }}>
                <span>Utilisations aujourd'hui</span>
                <span><strong style={{ color: remaining > 0 ? '#F0B429' : '#EF4444' }}>{used}</strong> / {limit}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  width: `${Math.min(100, ((used || 0) / limit) * 100)}%`,
                  background: remaining > 0 ? 'linear-gradient(90deg, #10B981, #F0B429)' : '#EF4444',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* Cooldown timer */}
          {cooldown?.minutesLeft > 0 && (
            <div style={{
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>⏳</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0EA5E9' }}>
                  Prochaine utilisation dans {cooldown.minutesLeft} min
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8B95A5' }}>
                  Un cooldown de {Math.floor(cooldown.minutesLeft / 60)}h s'applique entre 2 utilisations
                </div>
              </div>
            </div>
          )}

          {/* Solde crédits */}
          <div style={{
            padding: 12, borderRadius: 12, marginBottom: 16,
            background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>💎</span>
              <span style={{ fontSize: '0.8rem', color: '#C9D1D9' }}>Votre solde</span>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F0B429' }}>
              {solde} crédit{solde > 1 ? 's' : ''}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* 1. Utiliser crédits (si applicable) */}
            {cost > 0 && hasEnoughCredits && (
              <>
                {!confirmCredit ? (
                  <button onClick={() => setConfirmCredit(true)} style={{
                    width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #F0B429, #c9a84c)',
                    color: '#0a0a0a', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  }}>
                    ⚡ Utiliser maintenant — {cost} crédit{cost > 1 ? 's' : ''}
                  </button>
                ) : (
                  <div style={{
                    padding: 14, borderRadius: 12,
                    background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)',
                  }}>
                    <p style={{ fontSize: '0.8rem', color: '#C9D1D9', margin: '0 0 12px' }}>
                      Confirmer l'utilisation de <strong style={{ color: '#F0B429' }}>{cost} crédit{cost > 1 ? 's' : ''}</strong> pour <strong>{toolName}</strong> ?
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setConfirmCredit(false); onUseCredit?.() }} style={{
                        flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                        background: '#F0B429', color: '#0a0a0a', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                      }}>✅ Confirmer</button>
                      <button onClick={() => setConfirmCredit(false)} style={{
                        flex: 1, padding: '10px', borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                        color: '#8B95A5', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                      }}>Annuler</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. Acheter l'outil en mensuel (si prix défini) */}
            {monthlyPrice > 0 && (
              <Link to={`/plans?tool=${config.toolKey}`} onClick={onClose} style={{
                display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none',
              }}>
                🔓 Débloquer {toolName} — {monthlyPrice.toLocaleString('fr-FR')} FCFA/mois
              </Link>
            )}

            {/* 3. Upgrader plan */}
            <Link to="/plans" onClick={onClose} style={{
              display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 12,
              border: '1.5px solid rgba(139,92,246,0.4)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.06))',
              color: '#A78BFA', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none',
            }}>
              👑 Passer Pro — accès illimité à tous les outils
            </Link>

            {/* 4. Acheter crédits */}
            <Link to="/credits" onClick={onClose} style={{
              display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: '#C9D1D9', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
            }}>
              💳 Acheter un pack de crédits
            </Link>

            {/* 5. Attendre / fermer */}
            <button onClick={onClose} style={{
              width: '100%', padding: '10px 20px', borderRadius: 12,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
              color: '#6B7280', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}>
              {errorType === 'cooldown'
                ? `Attendre encore ~${cooldown?.minutesLeft || 0} min`
                : `Attendre ~${hoursUntilReset}h — continuer gratuitement`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ToolGuardBadge — Badge compact affiché dans l'en-tête d'un outil
 */
export function ToolGuardBadge({ guard }) {
  if (!guard) return null
  const { allowed, loading, quota, cooldown, solde, cost, quotaConfig } = guard

  if (loading) return (
    <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>⌛ Vérification…</span>
  )

  if (!quotaConfig) return null

  const { limit_count, category } = quotaConfig
  const remaining = quota?.remaining ?? limit_count
  const used = quota?.used ?? 0

  // Illimité
  if (limit_count === 0 && (!cooldown || cooldown.minutesLeft === 0)) {
    if (category === 'GRATUIT_ILLIMITE') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 100,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          fontSize: '0.72rem', fontWeight: 700, color: '#10B981',
        }}>✨ Gratuit illimité</span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 100,
        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
        fontSize: '0.72rem', fontWeight: 700, color: '#A78BFA',
      }}>♾️ Illimité</span>
    )
  }

  // Quota avec nombre restant
  const pct = limit_count > 0 ? remaining / limit_count : 1
  const color = pct > 0.5 ? '#10B981' : pct > 0.2 ? '#F59E0B' : '#EF4444'
  const dotColor = pct > 0.5 ? '#10B981' : pct > 0.2 ? '#F59E0B' : '#EF4444'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 100,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.72rem', fontWeight: 700, color: '#C9D1D9',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: dotColor,
        boxShadow: `0 0 6px ${dotColor}66`, flexShrink: 0,
      }} />
      {remaining > 0
        ? <><strong style={{ color }}>{remaining}</strong> restante{remaining > 1 ? 's' : ''}</>
        : <strong style={{ color: '#EF4444' }}>Quota atteint</strong>
      }
      {cost > 0 && (
        <span style={{ color: '#8B95A5', fontWeight: 500 }}>· {cost}💎</span>
      )}
    </span>
  )
}

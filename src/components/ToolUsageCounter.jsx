import { Link } from 'react-router-dom'

/**
 * ToolUsageCounter — Badge réutilisable affichant le quota d'utilisation.
 *
 * Permissions :
 * - Admin / ABAWI+ → rien n'est affiché (accès illimité, pas de friction)
 * - Membre gratuit → badge "⭐ X/Y gratuites" + lien /credits
 * - Anonyme        → badge "⭐ X/Y gratuites" + lien /inscription
 *
 * Props :
 *   toolKey        {string}  identifiant de l'outil (ex: 'qr_code_pro')
 *   usedToday      {number}
 *   limit          {number}  Infinity = illimité
 *   usesLeft       {number}
 *   isUnlimited    {boolean}
 *   membre         {object|null}
 *   compact        {boolean}  si true, version réduite (juste le compteur)
 */
export default function ToolUsageCounter({
  toolKey,
  usedToday,
  limit,
  usesLeft,
  isUnlimited,
  membre,
  compact = false,
}) {
  // Admin / Plus → pas de badge (pas de restriction à afficher)
  if (isUnlimited) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 100,
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#059669',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 6px #10B98166',
          }}
        />
        Illimité
      </span>
    )
  }

  const pct = limit > 0 ? Math.max(0, usesLeft / limit) : 0
  const color = pct > 0.5 ? '#10B981' : pct > 0.2 ? '#F59E0B' : '#EF4444'
  const bg = pct > 0.5 ? 'rgba(16,185,129,0.08)' : pct > 0.2 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
  const border = pct > 0.5 ? 'rgba(16,185,129,0.2)' : pct > 0.2 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 100,
          background: bg,
          border: `1px solid ${border}`,
          fontSize: '0.72rem',
          fontWeight: 700,
          color,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
        {usesLeft}/{limit} gratuites
      </span>
    )
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        borderRadius: 100,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        fontSize: '0.78rem',
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}66`,
        }}
      />
      <span style={{ color: 'var(--text-secondary)' }}>
        {usesLeft > 0 ? (
          <>
            <strong style={{ color }}>{usesLeft}</strong> utilisation
            {usesLeft > 1 ? 's' : ''} gratuite{usesLeft > 1 ? 's' : ''} restante
            {usesLeft > 1 ? 's' : ''}
          </>
        ) : (
          <span style={{ color: '#EF4444' }}>Quota atteint</span>
        )}
      </span>
      {usesLeft === 0 && (
        <Link
          to={membre ? '/credits' : '/inscription'}
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#3B82F6',
            fontSize: '0.68rem',
            textDecoration: 'none',
          }}
        >
          {membre ? '💳 Crédits' : '✨ Compte'}
        </Link>
      )}
    </div>
  )
}

/**
 * ToolAccessInfo — Bandeau d'info affiché dans l'outil selon le profil.
 * - Admin / Plus : "👑 Accès illimité ABAWI+"
 * - Membre : "⭐ X gratuites restantes aujourd'hui · puis X crédits (solde: Y)"
 * - Anonyme : "⭐ X gratuites restantes · compte gratuit = +X/jour"
 */
export function ToolAccessInfo({ isUnlimited, usesLeft, limit, membre, creditCost, soldeCredits, upgradeAction }) {
  if (isUnlimited) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#8B5CF6',
        }}
      >
        👑 Accès illimité ABAWI+
      </div>
    )
  }

  const quotaExhausted = usesLeft === 0

  const nextTier = membre ? (
    creditCost > 0 ? (
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
        {quotaExhausted
          ? `Puis ${creditCost} crédit${creditCost > 1 ? 's' : ''} / ${upgradeAction === 'export' ? 'export' : 'utilisation'} (solde: ${soldeCredits ?? '?'})`
          : `Puis ${creditCost} crédit${creditCost > 1 ? 's' : ''} / ${upgradeAction === 'export' ? 'export' : 'utilisation'}`
        }
      </span>
    ) : (
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
        Puis passage aux crédits
      </span>
    )
  ) : (
    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
      Compte gratuit = <strong style={{ color: 'var(--accent)' }}>{limit} / jour</strong>
    </span>
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <ToolUsageCounter
        toolKey=""
        usedToday={limit - usesLeft}
        limit={limit}
        usesLeft={usesLeft}
        isUnlimited={false}
        membre={membre}
        compact
      />
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>·</span>
      {nextTier}
      {quotaExhausted && membre && (
        <Link
          to="/credits"
          style={{
            padding: '2px 8px',
            borderRadius: 6,
            background: 'rgba(240,180,41,0.1)',
            border: '1px solid rgba(240,180,41,0.25)',
            color: '#F0B429',
            fontSize: '0.68rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          💳 Recharger
        </Link>
      )}
    </div>
  )
}

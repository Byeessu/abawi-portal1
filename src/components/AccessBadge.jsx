import { getAccessLabel } from '../lib/productAccess'

export default function AccessBadge({ accessType, daysLeft, plan, compact = false }) {
  const label = getAccessLabel(accessType)

  let extra = ''
  if (daysLeft !== null && daysLeft !== Infinity && daysLeft >= 0) {
    if (daysLeft <= 3) extra = ` · expire dans ${daysLeft}j`
    else if (daysLeft <= 7) extra = ` · ${daysLeft}j restants`
  }

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.72rem',
        fontWeight: 700,
        color: label.color,
        background: label.bg,
        border: `1px solid ${label.color}30`,
        borderRadius: 6,
        padding: '2px 8px',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label.text}{extra}
      </span>
    )
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 10,
      background: label.bg,
      border: `1px solid ${label.color}25`,
      color: label.color,
      fontSize: '0.82rem',
      fontWeight: 700,
    }}>
      <span style={{ fontSize: '1rem' }}>
        {accessType === 'subscription' ? '💎' : accessType === 'purchased' ? '🔓' : accessType === 'admin' ? '👑' : accessType === 'public' ? '✓' : '🔒'}
      </span>
      <span>{label.text}{extra && <span style={{ opacity: 0.75, fontWeight: 500 }}>{extra}</span>}</span>
      {plan && <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 500, textTransform: 'uppercase' }}>({plan})</span>}
    </div>
  )
}

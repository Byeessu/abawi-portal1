/* ── SenTicket Organizer Tiers — Commission & Features ── */

// Configuration statique (fallback si la DB n'est pas encore synchronisée)
export const TIER_CONFIG = {
  start: {
    label: 'SenTicket Start',
    commissionRate: 0.07,
    monthlyPrice: 0,
    withdrawalDelayDays: 3,
    maxEvents: null,
    branding: false,
    featuredBoost: false,
    apiAccess: false,
    supportLevel: 'email',
  },
  pro: {
    label: 'SenTicket Pro',
    commissionRate: 0.045,
    monthlyPrice: 15000,
    withdrawalDelayDays: 1,
    maxEvents: null,
    branding: true,
    featuredBoost: false,
    apiAccess: false,
    supportLevel: 'whatsapp',
  },
  business: {
    label: 'SenTicket Business',
    commissionRate: 0.02,
    monthlyPrice: 0, // Sur mesure
    withdrawalDelayDays: 0,
    maxEvents: null,
    branding: true,
    featuredBoost: true,
    apiAccess: true,
    supportLevel: 'dedicated',
  },
}

export const DEFAULT_TIER = 'start'
export const DEFAULT_COMMISSION = 0.07

/** Récupère le tier d'un organisateur (objet membre) */
export function getOrganizerTier(organizer) {
  if (!organizer) return DEFAULT_TIER
  const tier = (organizer.organizer_tier || '').toLowerCase()
  if (TIER_CONFIG[tier]) return tier
  return DEFAULT_TIER
}

/** Récupère la config complète d'un tier */
export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG[DEFAULT_TIER]
}

/**
 * Calcule le taux de commission applicable.
 * Priorité : commission_rate sur l'événement > tier de l'organisateur > fallback 7%
 */
export function getCommissionRate(organizer, event) {
  // 1. Si l'événement a un commission_rate explicite (override admin/event)
  if (event?.commission_rate != null && !isNaN(event.commission_rate)) {
    const rate = Number(event.commission_rate)
    if (rate >= 0 && rate <= 1) return rate
  }
  // 2. Sinon, tier de l'organisateur
  const tier = getOrganizerTier(organizer)
  return TIER_CONFIG[tier]?.commissionRate ?? DEFAULT_COMMISSION
}

/** Commission en FCFA pour un montant donné */
export function calcCommission(total, organizer, event) {
  const rate = getCommissionRate(organizer, event)
  return Math.round(total * rate)
}

/** Net organisateur après commission et réduction */
export function calcNetOrganisateur(total, organizer, event, discount = 0) {
  const commission = calcCommission(total, organizer, event)
  return total - commission - discount
}

/** Vérifie si un retrait est autorisé selon le délai du tier */
export function canWithdraw(organizer, eventDate) {
  if (!eventDate) return false
  const tier = getOrganizerTier(organizer)
  const delayDays = TIER_CONFIG[tier]?.withdrawalDelayDays ?? 3
  const eventEnd = new Date(eventDate)
  eventEnd.setDate(eventEnd.getDate() + delayDays)
  return new Date() >= eventEnd
}

/** Formate le délai de retrait en texte lisible */
export function withdrawalDelayLabel(organizer) {
  const tier = getOrganizerTier(organizer)
  const days = TIER_CONFIG[tier]?.withdrawalDelayDays ?? 3
  if (days === 0) return 'Immédiat'
  if (days === 1) return 'J+1'
  return `J+${days}`
}

/** Vérifie si l'organisateur a droit au branding perso */
export function hasBranding(organizer) {
  const tier = getOrganizerTier(organizer)
  return !!TIER_CONFIG[tier]?.branding
}

/** Vérifie si l'organisateur a droit à la mise en avant */
export function hasFeaturedBoost(organizer) {
  const tier = getOrganizerTier(organizer)
  return !!TIER_CONFIG[tier]?.featuredBoost
}

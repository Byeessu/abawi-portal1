// src/lib/productAccess.js
// Logique intelligente d'accès aux produits (guides, podcasts, fascicules, outils)

import { CREDIT_COSTS } from './credits'
import { isSystemAdmin, hasAllInclusiveAccess, normalizePlan, PLANS } from './permissions'

export const ACCESS_TYPES = {
  ADMIN: 'admin',
  SUBSCRIPTION: 'subscription',
  PURCHASED: 'purchased',
  CREDITS: 'credits',
  PUBLIC: 'public',
  NONE: 'none',
}

export const PRODUCT_TYPES = {
  GUIDE: 'guide',
  PODCAST: 'podcast',
  FASCICULE: 'fascicule',
  PACK: 'pack',
  TOOL: 'tool',
}

/**
 * Vérifie si un membre a acheté un produit spécifique.
 * S'appuie sur membre.purchases (tableau d'objets { product_id, type, expires_at })
 * et membre.date_fin (date de fin d'abonnement globale).
 */
function hasProductPurchase(membre, productId) {
  if (!membre?.purchases?.length) return false
  const purchase = membre.purchases.find(
    (p) => p.product_id === productId && (!p.expires_at || new Date(p.expires_at) > new Date())
  )
  return !!purchase
}

/**
 * Vérifie si un membre a un abonnement actif couvrant les produits.
 */
function hasSubscriptionAccess(membre) {
  if (!membre) return false
  const plan = normalizePlan(membre)
  if (!plan || plan === PLANS.GRATUIT) return false
  const isExpired = membre.date_fin && new Date(membre.date_fin) < new Date()
  return membre.statut === 'actif' && !isExpired
}

/**
 * Calcule le nombre de jours restants avant expiration.
 * Retourne null si pas d'expiration connue, -1 si expiré, sinon nombre de jours.
 */
export function getDaysUntilExpiry(membre, productId) {
  if (!membre) return null

  // Admin = jamais expiré
  if (isSystemAdmin(membre)) return Infinity

  // Vérifier achat individuel
  if (membre.purchases?.length) {
    const purchase = membre.purchases.find((p) => p.product_id === productId)
    if (purchase?.expires_at) {
      const diff = new Date(purchase.expires_at) - new Date()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }
  }

  // Vérifier abonnement
  if (membre.date_fin) {
    const diff = new Date(membre.date_fin) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return null
}

/**
 * Détermine le type d'accès d'un membre à un produit.
 * Retourne { type, daysLeft, creditCost, canUnlock, reason }
 */
export function resolveProductAccess(membre, product, productType) {
  // 1. Admin = accès total
  if (isSystemAdmin(membre)) {
    return { type: ACCESS_TYPES.ADMIN, daysLeft: Infinity, creditCost: 0, canUnlock: true, reason: 'admin' }
  }

  // 2. Produit public / gratuit
  if (product.gratuit || productType === PRODUCT_TYPES.PUBLIC) {
    return { type: ACCESS_TYPES.PUBLIC, daysLeft: Infinity, creditCost: 0, canUnlock: true, reason: 'gratuit' }
  }

  // 3. Abonnement inclusif (ABAWI+, Elite, etc.)
  if (hasAllInclusiveAccess(membre)) {
    const daysLeft = getDaysUntilExpiry(membre, product.id)
    return {
      type: ACCESS_TYPES.SUBSCRIPTION,
      daysLeft,
      creditCost: 0,
      canUnlock: true,
      reason: 'plan_inclusif',
      plan: normalizePlan(membre),
    }
  }

  // 4. Abonnement standard actif
  if (hasSubscriptionAccess(membre)) {
    const daysLeft = getDaysUntilExpiry(membre, product.id)
    const plan = normalizePlan(membre)
    // Vérifier si le plan couvre ce type de produit
    const coversPodcasts = ['pro', '360', 'elite', 'vip', 'premium'].includes(plan)
    const coversGuides = ['starter', 'pro', '360', 'elite', 'vip', 'premium'].includes(plan)
    const hasCoverage = (productType === PRODUCT_TYPES.PODCAST && coversPodcasts) ||
                        (productType === PRODUCT_TYPES.GUIDE && coversGuides) ||
                        (productType === PRODUCT_TYPES.FASCICULE && coversGuides) ||
                        (productType === PRODUCT_TYPES.TOOL && coversGuides)

    if (hasCoverage) {
      return {
        type: ACCESS_TYPES.SUBSCRIPTION,
        daysLeft,
        creditCost: 0,
        canUnlock: true,
        reason: 'plan_cover',
        plan,
      }
    }
  }

  // 5. Achat individuel
  if (hasProductPurchase(membre, product.id)) {
    const daysLeft = getDaysUntilExpiry(membre, product.id)
    return { type: ACCESS_TYPES.PURCHASED, daysLeft, creditCost: 0, canUnlock: true, reason: 'achete' }
  }

  // 6. Crédits
  const creditTypeMap = {
    [PRODUCT_TYPES.GUIDE]: 'guide',
    [PRODUCT_TYPES.PODCAST]: 'podcast',
    [PRODUCT_TYPES.FASCICULE]: 'fascicule',
  }
  const creditKey = creditTypeMap[productType]
  const creditCost = CREDIT_COSTS[creditKey] || 0
  const solde = membre?.credits || 0
  const canUnlock = creditCost > 0 && solde >= creditCost

  // 7. Pas d'accès
  return {
    type: ACCESS_TYPES.NONE,
    daysLeft: null,
    creditCost,
    canUnlock,
    reason: canUnlock ? 'credits_suffisants' : 'credits_insuffisants',
    solde,
    manquant: canUnlock ? 0 : creditCost - solde,
  }
}

/**
 * Détermine si on doit afficher un rappel d'expiration.
 * Seuil : 7 jours pour abonnement, 3 jours pour achat individuel.
 * Non intrusif : une seule fois par session via localStorage.
 */
export function shouldShowExpiryReminder(membre, product, productType, sessionKey) {
  if (!membre) return false
  const access = resolveProductAccess(membre, product, productType)

  if (!access.canUnlock || access.daysLeft === Infinity || access.daysLeft === null) return false

  const threshold = access.type === ACCESS_TYPES.PURCHASED ? 3 : 7
  if (access.daysLeft > threshold || access.daysLeft < 0) return false

  // Éviter les répétitions dans la même session
  if (typeof window !== 'undefined' && sessionKey) {
    const dismissed = sessionStorage.getItem(`expiry_dismissed_${sessionKey}`)
    if (dismissed) return false
  }

  return { daysLeft: access.daysLeft, type: access.type, plan: access.plan }
}

export function dismissExpiryReminder(sessionKey) {
  if (typeof window !== 'undefined' && sessionKey) {
    sessionStorage.setItem(`expiry_dismissed_${sessionKey}`, '1')
  }
}

/**
 * Libellés pour l'UI
 */
export const ACCESS_LABELS = {
  [ACCESS_TYPES.ADMIN]: { text: 'Accès illimité', color: '#F0B429', bg: 'rgba(240,180,41,0.12)' },
  [ACCESS_TYPES.SUBSCRIPTION]: { text: 'Inclus dans votre abonnement', color: '#18A84A', bg: 'rgba(24,168,74,0.12)' },
  [ACCESS_TYPES.PURCHASED]: { text: 'Vous avez acheté ce produit', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  [ACCESS_TYPES.CREDITS]: { text: 'Débloqué avec vos crédits', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  [ACCESS_TYPES.PUBLIC]: { text: 'Gratuit', color: '#18A84A', bg: 'rgba(24,168,74,0.12)' },
  [ACCESS_TYPES.NONE]: { text: 'Achat nécessaire', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

export function getAccessLabel(accessType) {
  return ACCESS_LABELS[accessType] || ACCESS_LABELS[ACCESS_TYPES.NONE]
}

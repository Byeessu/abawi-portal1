/**
 * freeContentQuota — Preview 25% gratuite pour tous les utilisateurs gratuits
 * Les utilisateurs gratuits peuvent consulter 25% de n'importe quel contenu payant.
 * Pour aller au-delà : acheter le contenu, utiliser des crédits, ou passer ABAWI+.
 * Admin, ABAWI+, et contenus gratuits (gratuit=true) ont un accès illimité.
 */

const STORAGE_KEY = 'abawi_free_content_quota_v1'

function getMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function loadQuota() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const month = getMonthKey()
    if (parsed.month !== month) {
      // Nouveau mois → reset
      return { month, views: [], count: 0 }
    }
    return parsed
  } catch {
    return { month: getMonthKey(), views: [], count: 0 }
  }
}

function saveQuota(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

/** Retourne true si le contenu a déjà été compté ce mois-ci */
export function hasViewedThisMonth(productId) {
  const q = loadQuota()
  return q.views?.includes(productId) || false
}

/** Retourne le nombre de consultations ce mois-ci */
export function getFreeViewsCount() {
  const q = loadQuota()
  return q.count || 0
}

/** Enregistre une consultation gratuite */
export function recordFreeView(productId) {
  const q = loadQuota()
  if (!q.views.includes(productId)) {
    q.views.push(productId)
    q.count = (q.count || 0) + 1
    saveQuota(q)
  }
}

/**
 * Détermine l'accès d'un utilisateur à un contenu.
 * @param {object} membre — membre depuis useAuth()
 * @param {object} product — le produit (doit avoir id, gratuit)
 * @param {boolean} isAdmin — statut admin
 * @returns {object} { canView, canPreview, reason, isLimited, isUnlimited }
 */
export function resolveFreeContentAccess(membre, product, isAdmin) {
  // Illimités : admin, ABAWI+, contenus explicitement gratuits
  const plan = (membre?.plan_type || membre?.plan || '').toLowerCase().trim()
  const isPaidMember = plan && plan !== 'gratuit' && plan !== ''
  const isGratuitProduct = product?.gratuit === true

  if (isAdmin) {
    return { canView: true, canPreview: false, reason: null, isLimited: false, isUnlimited: true }
  }
  if (isPaidMember) {
    return { canView: true, canPreview: false, reason: null, isLimited: false, isUnlimited: true }
  }
  if (isGratuitProduct) {
    return { canView: true, canPreview: false, reason: null, isLimited: false, isUnlimited: true }
  }

  // Utilisateur gratuit sur contenu payant → preview 25% gratuite
  return {
    canView: true,
    canPreview: true,
    reason: null,
    isLimited: true,
    isUnlimited: false,
  }
}

/** Peut-on télécharger ? Uniquement admin ou membre payant */
export function canDownload(membre, isAdmin) {
  if (isAdmin) return true
  const plan = (membre?.plan_type || membre?.plan || '').toLowerCase().trim()
  return plan && plan !== 'gratuit' && plan !== ''
}

// src/lib/permissions.js

export const PLANS = {
  GRATUIT: 'gratuit',
  STARTER: 'starter',
  PRO: 'pro',
  P360: '360',
  ELITE: 'elite',
  VIP: 'vip',
  PREMIUM: 'premium', // rétro-compatibilité ABAWI+
};

export function normalizePlan(membre) {
  return (membre?.plan_type || membre?.plan || '').toLowerCase().trim()
}

const ADMIN_EMAILS = ['ngomlaurentblog@gmail.com', 'contactabawi@gmail.com']

function isSystemAdmin(membre) {
  if (!membre) return false
  const email = (membre.email || '').toLowerCase().trim()
  return membre.role === 'admin' || membre.isAdminUser === true || ADMIN_EMAILS.includes(email)
}

export function hasAllInclusiveAccess(membre) {
  if (!membre) return false
  if (isSystemAdmin(membre)) return true
  const plan = normalizePlan(membre)
  const isExpired = membre.date_fin && new Date(membre.date_fin) < new Date()
  const active = membre.statut === 'actif' && !isExpired
  return active && plan !== '' && plan !== PLANS.GRATUIT
}

/**
 * Gère la "part des choses" : définit qui a accès à quoi.
 * @param {Object} membre - L'objet membre issu du AuthContext
 * @param {string} feature - La fonctionnalité demandée
 * @returns {boolean}
 */
export function canAccess(membre, feature) {
  // 1. Si pas de membre connecté -> Accès refusé par défaut
  if (!membre) return false;

  // 2. Admin système + profil ELITE : accès total
  if (isSystemAdmin(membre) || hasAllInclusiveAccess(membre)) return true;

  // 3. Définition des règles pour les autres profils
  const rules = {
    // Accès aux guides PDF et podcasts complets
    'guides-pdf': [PLANS.PREMIUM, PLANS.STARTER, PLANS.PRO, PLANS.P360, PLANS.ELITE, PLANS.VIP],
    'podcasts-premium': [PLANS.PRO, PLANS.P360, PLANS.ELITE, PLANS.VIP],
    
    // Outils Essentiels (CV, Lettre, Business Plan de base)
    'outils-essentiels': [PLANS.STARTER, PLANS.PRO, PLANS.P360, PLANS.ELITE, PLANS.VIP],
    
    // Outils Élite (Finance, Juridique OHADA, RH, Comptabilité)
    // Seul le plan ELITE y a accès par défaut
    'outils-elite': [PLANS.PRO, PLANS.P360, PLANS.ELITE, PLANS.VIP],
    'abawi-360': [PLANS.P360, PLANS.ELITE, PLANS.VIP],
    
    // Accès au Dashboard Admin
    'admin-panel': [PLANS.ELITE, PLANS.VIP]
  };

  // 4. Vérification du statut actif et de la date de fin
  const isExpired = membre.date_fin && new Date(membre.date_fin) < new Date();
  if (membre.statut !== 'actif' || isExpired) return false;

  // 5. Retourne vrai si le plan du membre est dans la liste autorisée pour cette feature
  const plan = normalizePlan(membre)
  return rules[feature]?.includes(plan) || false;
}

/**
 * Vérifie si le membre a assez de crédits pour une action
 */
export function hasCredits(membre, cost = 1) {
  if (!membre) return false;
  if (isSystemAdmin(membre) || hasAllInclusiveAccess(membre)) return true; // Crédits illimités
  return (membre.credits || 0) >= cost;
}

// ========================================
// TOOL ACCESS MAPPING - ARCHITECTURE CENTRALISÉE
// ========================================

export const TOOL_ACCESS = {
  // Outils ÉLITE
  businessPlan: 'outils-elite',
  finance: 'outils-elite',
  consultant: 'outils-elite',
  comptable: 'outils-elite',
  rh: 'outils-elite',
  immobilier: 'outils-elite',
  juridique: 'outils-elite',
  
  // Outils Essentiels
  cv: 'outils-essentiels',
  lettre: 'outils-essentiels',
  facture: 'outils-essentiels',
  analyseCV: 'outils-essentiels',
  
  // Outils Spéciaux
  dictionnaire: 'outils-essentiels',
  translator: 'outils-essentiels',
  photoStudio: 'outils-essentiels',
  abawiIA: 'outils-essentiels',
  smartOffice: 'outils-elite',
  tontine: 'outils-elite',
  maxavis: 'outils-elite',
}

/**
 * Vérifie l'accès à un outil spécifique via le mapping centralisé
 * @param {string} toolName - Nom de l'outil (ex: 'businessPlan')
 * @param {Object} membre - Objet membre du AuthContext
 * @returns {boolean}
 */
export function checkToolAccess(toolName, membre) {
  if (!membre) return false;
  if (isSystemAdmin(membre) || hasAllInclusiveAccess(membre)) return true;
  
  const accessLevel = TOOL_ACCESS[toolName];
  if (!accessLevel) return false; // Outil non trouvé
  
  return canAccess(membre, accessLevel);
}

/**
 * Vérifie si le membre est en cours de chargement (null/undefined)
 * @param {Object} membre - Objet membre du AuthContext
 * @returns {boolean}
 */
export function isMemberLoading(membre) {
  return membre === null || membre === undefined;
}
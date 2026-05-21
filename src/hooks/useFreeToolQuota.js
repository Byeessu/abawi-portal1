/**
 * useFreeToolQuota — Gestion du quota gratuit + crédits auto-débit pour les outils freemium
 *
 * Principe :
 *   1. Quota gratuit journalier (localStorage)
 *   2. Si quota épuisé ET l'utilisateur a assez de crédits → débit auto, pas de friction
 *   3. Si quota épuisé ET pas assez de crédits → soft paywall
 *   4. Admin / ABAWI+ → illimité, zéro friction
 */

import { useState, useCallback, useEffect } from 'react'
import { CREDIT_COSTS, debitCredits as debitCreditsLib } from '../lib/credits'
import { isSystemAdmin } from '../lib/permissions'

const STORAGE_KEY = 'abawi_free_quotas_v1'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

function loadQuotas() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function saveQuotas(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

/** Retourne le nombre d'utilisations aujourd'hui pour un outil */
export function getToolUsageToday(toolKey) {
  const all = loadQuotas()
  const today = getTodayKey()
  const entry = all[toolKey]
  if (!entry || entry.date !== today) return 0
  return entry.count || 0
}

/** Incrémente le compteur gratuit pour un outil */
export function recordToolUse(toolKey) {
  const all = loadQuotas()
  const today = getTodayKey()
  const prev = all[toolKey]
  all[toolKey] = {
    date: today,
    count: prev?.date === today ? (prev.count || 0) + 1 : 1,
  }
  saveQuotas(all)
}

/**
 * Hook React pour gérer le quota freemium d'un outil.
 *
 * @param {string} toolKey     - Identifiant de l'outil
 * @param {object} opts
 *   @param {number} opts.anonymousLimit - Quota/jour anonyme (défaut: 5)
 *   @param {number} opts.memberLimit    - Quota/jour membre (défaut: 10)
 *   @param {object} opts.membre         - Objet membre depuis useAuth()
 *   @param {string} opts.creditType     - Clé dans CREDIT_COSTS (ex: 'qr_code_pro')
 *   @param {number} opts.creditCost     - Coût explicite si creditType absent
 *
 * @returns {object}
 *   canUse, usedToday, limit, usesLeft, recordUse, isUnlimited,
 *   quotaAvailable, canUseCredits, creditCost, soldeCredits, debitCredits
 */
export function useFreeToolQuota(toolKey, {
  anonymousLimit = 5,
  memberLimit = 10,
  membre = null,
  creditType = null,
  creditCost = 0,
} = {}) {
  const isAdmin  = isSystemAdmin(membre)
  const isPlus   = membre?.plan === 'abawi-plus' || membre?.plan === 'plus'
  const isMember = !!membre

  const limit = isAdmin || isPlus ? Infinity : isMember ? memberLimit : anonymousLimit

  const [usedToday, setUsedToday] = useState(() => getToolUsageToday(toolKey))
  const [soldeCredits, setSoldeCredits] = useState(membre?.credits || 0)

  useEffect(() => {
    setUsedToday(getToolUsageToday(toolKey))
  }, [toolKey])

  useEffect(() => {
    setSoldeCredits(membre?.credits || 0)
  }, [membre])

  const effectiveCreditCost = creditType ? (CREDIT_COSTS[creditType] ?? creditCost) : creditCost

  const quotaAvailable = limit === Infinity || usedToday < limit
  const canUseCredits  = isMember && !isAdmin && !isPlus && effectiveCreditCost > 0 && soldeCredits >= effectiveCreditCost

  // Admin/Plus = toujours OK. Sinon : quota disponible OU crédits suffisants.
  const canUse = isAdmin || isPlus || quotaAvailable || canUseCredits

  const usesLeft = limit === Infinity ? Infinity : Math.max(0, limit - usedToday)

  const recordUse = useCallback(() => {
    if (limit === Infinity) return
    recordToolUse(toolKey)
    setUsedToday(c => c + 1)
  }, [toolKey, limit])

  const debitCredits = useCallback(async () => {
    if (!membre || !creditType) return { ok: false, reason: 'no_member_or_type' }
    if (isAdmin || isPlus) return { ok: true, cost: 0, tokensUsed: 0 }
    const result = await debitCreditsLib(membre.email, creditType)
    if (result.ok) {
      setSoldeCredits(result.solde || 0)
    }
    return result
  }, [membre, creditType, isAdmin, isPlus])

  return {
    canUse,
    usedToday,
    limit,
    usesLeft,
    recordUse,
    isUnlimited: limit === Infinity,
    quotaAvailable,
    canUseCredits,
    creditCost: effectiveCreditCost,
    soldeCredits,
    debitCredits,
  }
}

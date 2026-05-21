import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { resolveToolAccess } from '../lib/permissions'
import { checkQuota, checkCooldown, logUsage } from '../lib/quotas'
import { debitCredits, CREDIT_COSTS } from '../lib/credits'

/**
 * useToolGuard — Hook unifié de garde d'accès aux outils
 *
 * Gère : plan + crédits + quota DB + cooldown + upsell modal
 *
 * @param {string} toolKey        — clé technique (ex: 'qr_code_pro')
 * @param {string} creditType     — clé dans CREDIT_COSTS (ex: 'qr_code_pro')
 * @returns {
 *   allowed, loading, error, errorType,
 *   quota, cooldown, solde, cost,
 *   upsellOpen, upsellConfig,
 *   openUpsell, closeUpsell,
 *   checkAndDebit, recordUsage
 * }
 */
export function useToolGuard(toolKey, creditType) {
  const { membre, isAdmin } = useAuth()
  const email = membre?.email || ''

  const [state, setState] = useState({
    allowed: false,
    loading: true,
    error: null,
    errorType: null, // 'non_connecte' | 'quota_exceeded' | 'cooldown' | 'credits_insuffisants' | 'abonnement_inactif'
    quota: null,
    cooldown: null,
    solde: 0,
    cost: 0,
    quotaConfig: null,
  })

  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellConfig, setUpsellConfig] = useState(null)

  const checkedRef = useRef(false)

  // ── 1. Récupérer la config quota depuis la DB ──
  const fetchQuotaConfig = useCallback(async () => {
    const planId = (membre?.plan_type || membre?.plan || 'gratuit').toLowerCase()
    const { data, error } = await supabase
      .from('tool_quotas')
      .select('*')
      .eq('tool_key', toolKey)
      .in('plan_id', [planId, 'all'])
      .order('limit_count', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) return null
    return data[0]
  }, [toolKey, membre])

  // ── 2. Vérification complète d'accès ──
  const runCheck = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null, errorType: null }))

    // Admin = tout OK
    if (isAdmin) {
      setState({ allowed: true, loading: false, error: null, errorType: null, quota: null, cooldown: null, solde: 99999, cost: 0, quotaConfig: null })
      return
    }

    // Non connecté
    if (!membre) {
      setState({ allowed: false, loading: false, error: 'Connectez-vous pour utiliser cet outil', errorType: 'non_connecte', quota: null, cooldown: null, solde: 0, cost: 0, quotaConfig: null })
      return
    }

    // Plan + crédits
    const cost = CREDIT_COSTS[creditType] || 0
    const access = resolveToolAccess(membre, toolKey, cost)

    if (!access.ok) {
      setState({
        allowed: false,
        loading: false,
        error: access.reason === 'non_connecte' ? 'Connectez-vous pour utiliser cet outil'
          : access.reason === 'abonnement_inactif' ? 'Votre abonnement est inactif ou expiré'
          : access.reason === 'credits_insuffisants' ? `Crédits insuffisants (${access.solde || 0} / ${cost})`
          : 'Accès refusé',
        errorType: access.reason,
        quota: null,
        cooldown: null,
        solde: access.solde || 0,
        cost,
        quotaConfig: null,
      })
      return
    }

    // Récupérer config DB
    const cfg = await fetchQuotaConfig()

    // Pas de config = illimité (juste crédits)
    if (!cfg) {
      setState({ allowed: true, loading: false, error: null, errorType: null, quota: null, cooldown: null, solde: access.solde || 0, cost, quotaConfig: null })
      return
    }

    // Quota illimité (limit_count = 0)
    if (cfg.limit_count === 0 && cfg.cooldown_min === 0) {
      setState({ allowed: true, loading: false, error: null, errorType: null, quota: null, cooldown: null, solde: access.solde || 0, cost: 0, quotaConfig: cfg })
      return
    }

    // Vérifier cooldown
    let cooldownInfo = null
    if (cfg.cooldown_min > 0) {
      cooldownInfo = await checkCooldown(email, toolKey, cfg.cooldown_min)
      if (!cooldownInfo.ok) {
        setState({
          allowed: false,
          loading: false,
          error: `Cooldown actif — attendez encore ${cooldownInfo.minutesLeft} minute${cooldownInfo.minutesLeft > 1 ? 's' : ''}`,
          errorType: 'cooldown',
          quota: null,
          cooldown: cooldownInfo,
          solde: access.solde || 0,
          cost,
          quotaConfig: cfg,
        })
        return
      }
    }

    // Vérifier quota
    const quota = await checkQuota(email, toolKey, membre)

    if (!quota.ok) {
      setState({
        allowed: false,
        loading: false,
        error: quota.message || 'Quota atteint',
        errorType: 'quota_exceeded',
        quota,
        cooldown: cooldownInfo,
        solde: access.solde || 0,
        cost,
        quotaConfig: cfg,
      })
      return
    }

    // Tout est OK
    const effectiveCost = quota.costOverride && quota.remaining === 0 ? quota.costOverride : cost
    setState({
      allowed: true,
      loading: false,
      error: null,
      errorType: null,
      quota,
      cooldown: cooldownInfo,
      solde: access.solde || 0,
      cost: effectiveCost,
      quotaConfig: cfg,
    })
  }, [membre, isAdmin, toolKey, creditType, email, fetchQuotaConfig])

  // ── Initial check ──
  useEffect(() => {
    runCheck()
    checkedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membre, toolKey, creditType, isAdmin])

  // ── Ouvrir le modal upsell ──
  const openUpsell = useCallback(() => {
    const cfg = state.quotaConfig
    if (!cfg && !state.errorType) return

    setUpsellConfig({
      toolKey,
      toolName: cfg?.tool_name || toolKey,
      category: cfg?.category || 'PREMIUM',
      errorType: state.errorType,
      errorMessage: state.error,
      quota: state.quota,
      cooldown: state.cooldown,
      solde: state.solde,
      cost: state.cost,
      monthlyPrice: cfg?.monthly_price || 0,
      limit: cfg?.limit_count || 0,
      used: state.quota?.used || 0,
      remaining: state.quota?.remaining ?? 0,
    })
    setUpsellOpen(true)
  }, [state, toolKey])

  const closeUpsell = useCallback(() => {
    setUpsellOpen(false)
    setUpsellConfig(null)
  }, [])

  // ── Débiter + logger l'usage ──
  const checkAndDebit = useCallback(async () => {
    if (!state.allowed) {
      openUpsell()
      return { ok: false, reason: state.errorType || 'not_allowed' }
    }

    // Re-check cooldown juste avant l'action
    if (state.quotaConfig?.cooldown_min > 0) {
      const cd = await checkCooldown(email, toolKey, state.quotaConfig.cooldown_min)
      if (!cd.ok) {
        setState(s => ({ ...s, allowed: false, errorType: 'cooldown', error: `Cooldown — attendez ${cd.minutesLeft}min`, cooldown: cd }))
        openUpsell()
        return { ok: false, reason: 'cooldown' }
      }
    }

    if (state.cost > 0) {
      const result = await debitCredits(email, creditType, '')
      if (!result.ok) {
        setState(s => ({ ...s, allowed: false, errorType: 'credits_insuffisants', error: result.reason || 'Crédits insuffisants' }))
        openUpsell()
        return result
      }
      setState(s => ({ ...s, solde: result.solde || 0 }))
      return result
    }

    return { ok: true, cost: 0, solde: state.solde }
  }, [state, email, toolKey, creditType, openUpsell])

  // ── Logger l'usage (appelé APRÈS succès) ──
  const recordUsage = useCallback(async (metadata = {}) => {
    if (!membre) return
    const planId = (membre?.plan_type || membre?.plan || 'gratuit').toLowerCase()
    await logUsage(email, toolKey, state.cost, planId, metadata)
    // Re-check pour mettre à jour le quota restant
    runCheck()
  }, [membre, email, toolKey, state.cost, runCheck])

  return {
    allowed: state.allowed,
    loading: state.loading,
    error: state.error,
    errorType: state.errorType,
    quota: state.quota,
    cooldown: state.cooldown,
    solde: state.solde,
    cost: state.cost,
    quotaConfig: state.quotaConfig,
    upsellOpen,
    upsellConfig,
    openUpsell,
    closeUpsell,
    checkAndDebit,
    recordUsage,
    refresh: runCheck,
  }
}

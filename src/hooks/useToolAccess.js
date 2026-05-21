import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { resolveToolAccess } from '../lib/permissions'
import { debitCredits, refundCredits, CREDIT_COSTS } from '../lib/credits'
import { checkQuota, logUsage } from '../lib/quotas'

/**
 * Hook unifié pour la gestion des accès outils (plan + crédits + quotas)
 * @param {string} toolName - clé dans TOOL_ACCESS
 * @param {string} creditType - clé dans CREDIT_COSTS
 * @returns {object} { allowed, loading, error, cost, solde, quota, debit, checkAccess }
 */
export function useToolAccess(toolName, creditType) {
  const { membre, isAdmin } = useAuth()
  const [state, setState] = useState({
    allowed: false,
    loading: true,
    error: null,
    cost: CREDIT_COSTS[creditType] || 0,
    solde: 0,
    unlimited: false,
    quota: null,
  })

  const cost = CREDIT_COSTS[creditType] || 0

  async function checkAccess() {
    if (!membre) {
      setState(s => ({ ...s, allowed: false, loading: false, error: 'non_connecte' }))
      return
    }
    if (isAdmin) {
      setState(s => ({ ...s, allowed: true, loading: false, error: null, unlimited: true }))
      return
    }

    // 1. Vérifier crédits + plan
    const res = resolveToolAccess(membre, toolName, cost)
    if (!res.ok) {
      setState(s => ({
        ...s,
        allowed: false,
        loading: false,
        error: res.reason,
        solde: res.solde || 0,
        manquant: res.manquant || 0,
      }))
      return
    }

    // 2. Vérifier quota (si configuré)
    const quota = await checkQuota(membre.email, creditType, membre)

    // Quota illimité ou pas de quota
    if (quota.unlimited || quota.limit === 0) {
      setState(s => ({
        ...s,
        allowed: true,
        loading: false,
        error: null,
        solde: res.solde || 0,
        quota,
      }))
      return
    }

    // Quota dépassé + action = block
    if (!quota.ok && quota.actionType === 'block') {
      setState(s => ({
        ...s,
        allowed: false,
        loading: false,
        error: 'quota_exceeded',
        errorMessage: quota.message,
        solde: res.solde || 0,
        quota,
      }))
      return
    }

    // Quota OK ou dépassement accepté (premium_cost / warn)
    const effectiveCost = quota.costOverride && quota.remaining === 0 ? quota.costOverride : cost
    setState(s => ({
      ...s,
      allowed: true,
      loading: false,
      error: null,
      solde: res.solde || 0,
      cost: effectiveCost,
      quota,
    }))
  }

  useEffect(() => {
    checkAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membre, toolName, creditType, isAdmin])

  async function debit() {
    if (!membre) return { ok: false }
    if (state.unlimited) {
      await logUsage(membre.email, creditType, 0, membre?.plan)
      return { ok: true, cost: 0 }
    }
    const result = await debitCredits(membre.email, creditType, '')
    if (result.ok) {
      await logUsage(membre.email, creditType, result.cost || state.cost, membre?.plan)
      setState(s => ({ ...s, allowed: true, solde: result.solde || 0, error: null }))
    } else {
      setState(s => ({ ...s, allowed: false, error: result.reason || 'debit_failed' }))
    }
    return result
  }

  async function refund(montant) {
    if (!membre || state.unlimited) return { ok: false }
    const result = await refundCredits(membre.email, creditType, montant)
    if (result.ok) {
      setState(s => ({ ...s, solde: result.solde || 0 }))
    }
    return result
  }

  return {
    allowed: state.allowed,
    loading: state.loading,
    error: state.error,
    errorMessage: state.errorMessage || '',
    cost: state.cost,
    solde: state.solde,
    unlimited: state.unlimited,
    manquant: state.manquant || 0,
    quota: state.quota,
    debit,
    refund,
    checkAccess,
  }
}

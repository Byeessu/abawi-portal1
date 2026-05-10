import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { resolveToolAccess } from '../lib/permissions'
import { debitCredits, CREDIT_COSTS } from '../lib/credits'

/**
 * Hook unifié pour la gestion des accès outils (plan + crédits)
 * @param {string} toolName - clé dans TOOL_ACCESS
 * @param {string} creditType - clé dans CREDIT_COSTS
 * @returns {object} { allowed, loading, error, cost, solde, debit, checkAccess }
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
  })

  const cost = CREDIT_COSTS[creditType] || 0

  function checkAccess() {
    if (!membre) {
      setState(s => ({ ...s, allowed: false, loading: false, error: 'non_connecte' }))
      return
    }
    if (isAdmin) {
      setState(s => ({ ...s, allowed: true, loading: false, error: null, unlimited: true }))
      return
    }
    const res = resolveToolAccess(membre, toolName, cost)
    setState(s => ({
      ...s,
      allowed: res.ok,
      loading: false,
      error: res.ok ? null : res.reason,
      solde: res.solde || 0,
      unlimited: res.unlimited || false,
      manquant: res.manquant || 0,
    }))
  }

  useEffect(() => {
    checkAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membre, toolName, creditType, isAdmin])

  async function debit() {
    if (!membre) return { ok: false }
    if (state.unlimited) return { ok: true, cost: 0 }
    const result = await debitCredits(membre.email, creditType, '')
    if (result.ok) {
      setState(s => ({ ...s, allowed: true, solde: result.solde || 0, error: null }))
    } else {
      setState(s => ({ ...s, allowed: false, error: result.reason || 'debit_failed' }))
    }
    return result
  }

  return {
    allowed: state.allowed,
    loading: state.loading,
    error: state.error,
    cost: state.cost,
    solde: state.solde,
    unlimited: state.unlimited,
    manquant: state.manquant || 0,
    debit,
    checkAccess,
  }
}

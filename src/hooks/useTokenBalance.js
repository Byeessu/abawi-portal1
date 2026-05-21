import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTokenBalance, TOKENS_PER_CREDIT } from '../lib/credits'

export function useTokenBalance(pollInterval = 5000) {
  const { membre } = useAuth()
  const [state, setState] = useState({
    credits: 0,
    tokens: 0,
    total: 0,
    consumed: 0,
    loading: true,
    error: null,
  })

  const refresh = useCallback(async () => {
    if (!membre?.email) {
      setState(s => ({ ...s, loading: false }))
      return
    }
    try {
      const bal = await getTokenBalance(membre.email)
      setState({ ...bal, loading: false, error: null })
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e.message }))
    }
  }, [membre?.email])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, pollInterval)
    return () => clearInterval(id)
  }, [refresh, pollInterval])

  const spend = useCallback((amount) => {
    setState(s => {
      if (s.tokens >= amount) {
        return { ...s, tokens: s.tokens - amount, total: s.total - amount, consumed: s.consumed + amount }
      }
      const fromCredits = Math.ceil((amount - s.tokens) / TOKENS_PER_CREDIT)
      return {
        ...s,
        tokens: 0,
        credits: s.credits - fromCredits,
        total: s.total - amount,
        consumed: s.consumed + amount,
      }
    })
  }, [])

  return { ...state, refresh, spend }
}

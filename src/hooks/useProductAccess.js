import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { resolveProductAccess, shouldShowExpiryReminder, dismissExpiryReminder, getDaysUntilExpiry } from '../lib/productAccess'

/**
 * Hook unifié pour la gestion de l'accès aux produits (guides, podcasts, fascicules)
 * @param {Object} product - Le produit (doit avoir id, prix, gratuit...)
 * @param {string} productType - 'guide' | 'podcast' | 'fascicule' | 'tool'
 * @returns {object}
 */
export function useProductAccess(product, productType) {
  const { membre, isAdmin } = useAuth()
  const [sessionKey] = useState(() => `${product?.id || 'x'}_${Date.now()}`)

  const access = useMemo(() => {
    if (!product) return { type: 'none', canUnlock: false, creditCost: 0 }
    return resolveProductAccess(membre, product, productType)
  }, [membre, product, productType])

  const daysLeft = useMemo(() => {
    if (!product) return null
    return getDaysUntilExpiry(membre, product.id)
  }, [membre, product])

  const reminder = useMemo(() => {
    if (!product || !access.canUnlock) return null
    return shouldShowExpiryReminder(membre, product, productType, sessionKey)
  }, [membre, product, productType, access.canUnlock, sessionKey])

  function dismissReminder() {
    dismissExpiryReminder(sessionKey)
  }

  return {
    ...access,
    daysLeft,
    reminder,
    dismissReminder,
    isAdmin,
    isLoggedIn: !!membre,
    membre,
  }
}

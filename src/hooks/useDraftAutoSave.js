import { useEffect, useRef, useState } from 'react'

/**
 * Hook de sauvegarde automatique de brouillon dans localStorage.
 *
 * @param {string} key       Clé localStorage unique par outil (ex: 'bp-draft')
 * @param {object} value     État à sauvegarder (sérialisable JSON)
 * @param {object} options   { durationMs?: number, debounceMs?: number, onRestore?: (data)=>void }
 *
 * @returns {{
 *   restored: { data: any, savedAt: number } | null,
 *   clearDraft: () => void,
 *   saving: boolean,
 *   lastSavedAt: number | null,
 * }}
 *
 * Comportement :
 * - Au montage : tente de charger un brouillon ; si trouvé et non expiré, appelle onRestore(data)
 * - À chaque changement de value : sauvegarde avec debounce (défaut 800 ms)
 * - L'expiration par défaut est 30 jours
 */
export function useDraftAutoSave(key, value, options = {}) {
  const {
    durationMs = 30 * 24 * 60 * 60 * 1000,
    debounceMs = 800,
    onRestore,
  } = options

  const [restored, setRestored] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(false)

  // Restauration au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return
      if (Date.now() - (parsed.savedAt || 0) > durationMs) {
        localStorage.removeItem(key)
        return
      }
      setRestored(parsed)
      if (onRestore && parsed.data) onRestore(parsed.data)
    } catch {
      localStorage.removeItem(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Auto-save avec debounce
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    clearTimeout(timerRef.current)
    setSaving(true)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ data: value, savedAt: Date.now() }))
        setLastSavedAt(Date.now())
      } catch (e) {
        console.warn('[useDraftAutoSave]', e?.message || e)
      } finally {
        setSaving(false)
      }
    }, debounceMs)
    return () => clearTimeout(timerRef.current)
  }, [key, value, debounceMs])

  const clearDraft = () => {
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    setRestored(null)
    setLastSavedAt(null)
  }

  return { restored, clearDraft, saving, lastSavedAt }
}

export default useDraftAutoSave

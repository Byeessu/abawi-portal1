import { useState, useCallback, useEffect } from 'react'
import { saveToHistory, getHistory, deleteHistoryEntry, updateRetention } from '../lib/historyManager'

/**
 * Hook pour gérer l'historique d'un outil spécifique
 * @param {string} tool - Identifiant de l'outil (HISTORY_TOOLS)
 * @param {string} defaultRetention - Politique de rétention par défaut
 */
export function useHistory(tool, defaultRetention = 'permanent') {
  const [retention, setRetention] = useState(defaultRetention)
  const [lastSaved, setLastSaved] = useState(null)

  const save = useCallback((data, customRetention = null) => {
    const entry = saveToHistory(tool, data, customRetention || retention)
    if (entry) {
      setLastSaved(entry)
    }
    return entry
  }, [tool, retention])

  const getToolHistory = useCallback((filter = {}) => {
    return getHistory(tool, filter)
  }, [tool])

  const deleteEntry = useCallback((entryId) => {
    return deleteHistoryEntry(tool, entryId)
  }, [tool])

  const updateEntryRetention = useCallback((entryId, newRetention) => {
    const result = updateRetention(tool, entryId, newRetention)
    return result
  }, [tool])

  const saveWithPrompt = useCallback((data, options = {}) => {
    const effectiveRetention = options.retention || retention
    const entry = saveToHistory(tool, {
      ...data,
      metadata: {
        ...data.metadata,
        savedAt: new Date().toISOString(),
        savedBy: options.user || 'anonymous',
        tags: options.tags || []
      }
    }, effectiveRetention)
    
    if (entry) {
      setLastSaved(entry)
    }
    return entry
  }, [tool, retention])

  return {
    save,
    saveWithPrompt,
    getToolHistory,
    deleteEntry,
    updateEntryRetention,
    retention,
    setRetention,
    lastSaved,
    retentionOptions: [
      { value: '30days', label: '30 jours' },
      { value: '6months', label: '6 mois' },
      { value: '1year', label: '1 an' },
      { value: 'permanent', label: 'Permanent' }
    ]
  }
}

/**
 * Hook pour sauvegarder automatiquement l'état d'un formulaire
 */
export function useAutoSave(tool, getData, interval = 30000, retention = 'permanent') {
  const { save } = useHistory(tool, retention)

  useEffect(() => {
    const timer = setInterval(() => {
      const data = getData()
      if (data && Object.keys(data).length > 0) {
        save(data, retention)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [tool, getData, interval, retention, save])
}

export default useHistory

// Gestionnaire d'historique avec politiques de rétention
// Retention policies: '30days', '6months', '1year', 'permanent'

const RETENTION_POLICIES = {
  '30days': 30 * 24 * 60 * 60 * 1000,
  '6months': 180 * 24 * 60 * 60 * 1000,
  '1year': 365 * 24 * 60 * 60 * 1000,
  'permanent': null
}

export const HISTORY_TOOLS = {
  DISSECTEUR: 'dissecteur',
  MAXAVIS: 'maxavis',
  TONTINE: 'tontine',
  STUDIO_PRO: 'studio_pro',
  MARKETING: 'marketing',
  CRM: 'crm',
  LEXIQUE: 'lexique'
}

export function saveToHistory(tool, data, retention = 'permanent') {
  const key = `abawi_history_${tool}`
  const entry = {
    id: `${tool}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tool,
    data,
    retention,
    createdAt: new Date().toISOString(),
    expiresAt: retention === 'permanent' ? null : new Date(Date.now() + RETENTION_POLICIES[retention]).toISOString()
  }

  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.unshift(entry)
    // Garder maximum 100 entrées par outil
    const trimmed = existing.slice(0, 100)
    localStorage.setItem(key, JSON.stringify(trimmed))
    return entry
  } catch (e) {
    console.error('Erreur sauvegarde historique:', e)
    return null
  }
}

export function getHistory(tool, filter = {}) {
  const key = `abawi_history_${tool}`
  try {
    const all = JSON.parse(localStorage.getItem(key) || '[]')
    const now = new Date()

    // Filtrer les expirés et appliquer les filtres
    return all.filter(entry => {
      // Vérifier expiration
      if (entry.expiresAt && new Date(entry.expiresAt) < now) {
        return false
      }

      // Filtres additionnels
      if (filter.since && new Date(entry.createdAt) < new Date(filter.since)) {
        return false
      }
      if (filter.until && new Date(entry.createdAt) > new Date(filter.until)) {
        return false
      }
      if (filter.search) {
        const searchStr = JSON.stringify(entry.data).toLowerCase()
        if (!searchStr.includes(filter.search.toLowerCase())) {
          return false
        }
      }

      return true
    })
  } catch (e) {
    console.error('Erreur lecture historique:', e)
    return []
  }
}

export function getAllHistory(filter = {}) {
  const allTools = Object.values(HISTORY_TOOLS)
  const all = []

  allTools.forEach(tool => {
    const toolHistory = getHistory(tool, filter)
    toolHistory.forEach(entry => all.push(entry))
  })

  // Trier par date décroissante
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function deleteHistoryEntry(tool, entryId) {
  const key = `abawi_history_${tool}`
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter(e => e.id !== entryId)
    localStorage.setItem(key, JSON.stringify(filtered))
    return true
  } catch (e) {
    console.error('Erreur suppression historique:', e)
    return false
  }
}

export function deleteAllHistory(tool) {
  const key = `abawi_history_${tool}`
  try {
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.error('Erreur suppression totale:', e)
    return false
  }
}

export function updateRetention(tool, entryId, newRetention) {
  const key = `abawi_history_${tool}`
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const updated = existing.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          retention: newRetention,
          expiresAt: newRetention === 'permanent' ? null : new Date(Date.now() + RETENTION_POLICIES[newRetention]).toISOString()
        }
      }
      return entry
    })
    localStorage.setItem(key, JSON.stringify(updated))
    return true
  } catch (e) {
    console.error('Erreur mise à jour rétention:', e)
    return false
  }
}

export function exportHistory(tool) {
  const history = getHistory(tool)
  const dataStr = JSON.stringify(history, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `abawi_history_${tool}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function getRetentionLabel(retention) {
  const labels = {
    '30days': '30 jours',
    '6months': '6 mois',
    '1year': '1 an',
    'permanent': 'Permanent'
  }
  return labels[retention] || retention
}

export function getRetentionOptions() {
  return [
    { value: '30days', label: '30 jours' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' },
    { value: 'permanent', label: 'Permanent' }
  ]
}

// Nettoyage automatique des entrées expirées (à appeler au démarrage)
export function cleanupExpiredHistory() {
  const allTools = Object.values(HISTORY_TOOLS)
  const now = new Date()

  allTools.forEach(tool => {
    const key = `abawi_history_${tool}`
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const valid = existing.filter(entry => {
        if (entry.expiresAt && new Date(entry.expiresAt) < now) {
          return false
        }
        return true
      })
      if (valid.length !== existing.length) {
        localStorage.setItem(key, JSON.stringify(valid))
      }
    } catch (e) {
      console.error(`Erreur nettoyage ${tool}:`, e)
    }
  })
}

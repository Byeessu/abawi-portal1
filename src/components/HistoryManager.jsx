import { useState, useEffect } from 'react'
import {
  getAllHistory,
  getHistory,
  deleteHistoryEntry,
  deleteAllHistory,
  updateRetention,
  exportHistory,
  getRetentionOptions,
  getRetentionLabel,
  HISTORY_TOOLS,
  cleanupExpiredHistory
} from '../lib/historyManager'

const TOOL_NAMES = {
  [HISTORY_TOOLS.DISSECTEUR]: 'Dissecteur Infos Elite',
  [HISTORY_TOOLS.MAXAVIS]: 'MaxAvis Elite',
  [HISTORY_TOOLS.TONTINE]: 'Tontine SN',
  [HISTORY_TOOLS.STUDIO_PRO]: 'ABAWI Studio Pro',
  [HISTORY_TOOLS.MARKETING]: 'Marketing 360',
  [HISTORY_TOOLS.CRM]: 'CRM 360',
  [HISTORY_TOOLS.LEXIQUE]: 'Lexique'
}

const TOOL_ICONS = {
  [HISTORY_TOOLS.DISSECTEUR]: '🔬',
  [HISTORY_TOOLS.MAXAVIS]: '⭐',
  [HISTORY_TOOLS.TONTINE]: '💰',
  [HISTORY_TOOLS.STUDIO_PRO]: '🎙️',
  [HISTORY_TOOLS.MARKETING]: '📢',
  [HISTORY_TOOLS.CRM]: '👥',
  [HISTORY_TOOLS.LEXIQUE]: '📖'
}

export default function HistoryManager() {
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState({
    tool: 'all',
    search: '',
    since: '',
    until: ''
  })
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'detail'
  const [detailItem, setDetailItem] = useState(null)

  useEffect(() => {
    cleanupExpiredHistory()
    loadHistory()
  }, [filter])

  function loadHistory() {
    setLoading(true)
    let data
    if (filter.tool === 'all') {
      data = getAllHistory({
        search: filter.search,
        since: filter.since,
        until: filter.until
      })
    } else {
      data = getHistory(filter.tool, {
        search: filter.search,
        since: filter.since,
        until: filter.until
      })
    }
    setHistory(data)
    setLoading(false)
  }

  function handleDelete(entryId, tool) {
    if (confirm('Supprimer cette entrée définitivement ?')) {
      deleteHistoryEntry(tool, entryId)
      loadHistory()
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    }
  }

  function handleDeleteSelected() {
    if (selectedItems.size === 0) return
    if (confirm(`Supprimer ${selectedItems.size} entrée(s) sélectionnée(s) ?`)) {
      selectedItems.forEach(id => {
        const entry = history.find(h => h.id === id)
        if (entry) {
          deleteHistoryEntry(entry.tool, id)
        }
      })
      setSelectedItems(new Set())
      loadHistory()
    }
  }

  function handleDeleteAll() {
    if (filter.tool === 'all') {
      if (confirm('Supprimer tout l\'historique de TOUS les outils ? Cette action est irréversible.')) {
        Object.values(HISTORY_TOOLS).forEach(tool => deleteAllHistory(tool))
        loadHistory()
      }
    } else {
      if (confirm(`Supprimer tout l\'historique de ${TOOL_NAMES[filter.tool]} ?`)) {
        deleteAllHistory(filter.tool)
        loadHistory()
      }
    }
  }

  function handleRetentionChange(entryId, tool, newRetention) {
    updateRetention(tool, entryId, newRetention)
    loadHistory()
  }

  function handleExport() {
    if (filter.tool === 'all') {
      Object.values(HISTORY_TOOLS).forEach(tool => exportHistory(tool))
    } else {
      exportHistory(filter.tool)
    }
  }

  function toggleSelection(id) {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    if (selectedItems.size === history.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(history.map(h => h.id)))
    }
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getExpiryBadge(entry) {
    if (!entry.expiresAt) {
      return <span style={{ color: '#22C55E', fontSize: '0.75rem' }}>♾️ Permanent</span>
    }
    const daysLeft = Math.ceil((new Date(entry.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7) {
      return <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>⏰ {daysLeft}j</span>
    }
    return <span style={{ color: '#F59E0B', fontSize: '0.75rem' }}>📅 {daysLeft}j restants</span>
  }

  if (viewMode === 'detail' && detailItem) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => { setViewMode('list'); setDetailItem(null) }}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Retour à l'historique
          </button>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>{TOOL_ICONS[detailItem.tool]}</span>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{TOOL_NAMES[detailItem.tool]}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {formatDate(detailItem.createdAt)} · {getRetentionLabel(detailItem.retention)}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Durée de conservation :</label>
            <select
              value={detailItem.retention}
              onChange={(e) => handleRetentionChange(detailItem.id, detailItem.tool, e.target.value)}
              style={{
                marginLeft: 12,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)'
              }}
            >
              {getRetentionOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 16,
            maxHeight: 600,
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {JSON.stringify(detailItem.data, null, 2)}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              onClick={() => handleDelete(detailItem.id, detailItem.tool)}
              style={{
                padding: '12px 24px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🗑️ Supprimer cette entrée
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
          📚 Historique des Activités
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedItems.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '10px 20px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🗑️ Supprimer ({selectedItems.size})
            </button>
          )}
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ⬇️ Exporter
          </button>
          <button
            onClick={handleDeleteAll}
            style={{
              padding: '10px 20px',
              background: 'var(--bg-secondary)',
              color: '#EF4444',
              border: '1px solid #EF4444',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🗑️ Tout supprimer
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 6 }}>Outil</label>
            <select
              value={filter.tool}
              onChange={(e) => setFilter({ ...filter, tool: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Tous les outils</option>
              {Object.entries(TOOL_NAMES).map(([key, name]) => (
                <option key={key} value={key}>{TOOL_ICONS[key]} {name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 6 }}>Recherche</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 6 }}>Depuis</label>
            <input
              type="date"
              value={filter.since}
              onChange={(e) => setFilter({ ...filter, since: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 6 }}>Jusqu'à</label>
            <input
              type="date"
              value={filter.until}
              onChange={(e) => setFilter({ ...filter, until: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>Aucun historique trouvé</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={selectedItems.size === history.length && history.length > 0}
              onChange={selectAll}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {selectedItems.size} sélectionné(s) sur {history.length}
            </span>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 60px 1fr 120px 140px auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.has(entry.id)}
                  onChange={() => toggleSelection(entry.id)}
                  style={{ width: 18, height: 18 }}
                />

                <span style={{ fontSize: 24, textAlign: 'center' }}>{TOOL_ICONS[entry.tool]}</span>

                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                    {TOOL_NAMES[entry.tool]}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {entry.data?.prompt?.slice(0, 60) || entry.data?.title?.slice(0, 60) || JSON.stringify(entry.data).slice(0, 60)}...
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {getExpiryBadge(entry)}
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
                  {formatDate(entry.createdAt)}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setDetailItem(entry); setViewMode('detail') }}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    👁️ Voir
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id, entry.tool)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-secondary)',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

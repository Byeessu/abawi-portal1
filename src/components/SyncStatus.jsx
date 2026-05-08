export default function SyncStatus({ lastSyncAt, onRetry, errorMessage = '', accent = '#3B82F6', labels = {} }) {
  const syncLabel = labels.syncLabel || 'Aucune synchronisation'
  const retryLabel = labels.retryLabel || '↻ Réessayer'
  const errorPrefix = labels.errorPrefix || 'Chargement incomplet'

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ color: '#6B7280', fontSize: '0.74rem' }}>
          {lastSyncAt ? `Dernière mise à jour: ${lastSyncAt.toLocaleTimeString('fr-FR')}` : syncLabel}
        </span>
        <button onClick={onRetry} style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${accent}4D`, background: `${accent}1A`, color: accent, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
          {retryLabel}
        </button>
      </div>
      {errorMessage && (
        <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontSize: '0.78rem' }}>
          {errorPrefix}: {errorMessage}
        </div>
      )}
    </>
  )
}

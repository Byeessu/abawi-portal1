import { useState } from 'react'
import { exportTextFile } from '../lib/generatePDF'
import { useFullscreen } from '../hooks/useFullscreen'
import WorkspaceShare from './WorkspaceShare'

const TTL_OPTIONS = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
  { label: 'Permanent', value: 36500 },
]

function relDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.round((d - now) / 86400000)
  if (diff < 0) return 'Expiré'
  if (diff === 0) return 'Expire aujourd\'hui'
  if (diff === 1) return 'Expire demain'
  if (diff < 30) return `Expire dans ${diff}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function WorkspacePanel({
  workspace,       // useWorkspace() return value
  onLoad,          // (content) => void — charge un doc sauvegardé
  onReset,         // () => void — remet l'outil à zéro
  currentContent,  // string — contenu actuel à sauvegarder
  toolLabel = 'Document',
  toolId,          // for sharing
  toolPath,        // route for background job navigation
  accent = '#F0B429',
  containerRef,    // ref to fullscreen target
}) {
  const { entries, loading, save, remove, clearAll } = workspace
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const [ttl, setTtl] = useState(30)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'clear' | entry.id
  const [open, setOpen] = useState(false)

  async function handleSave() {
    if (!currentContent) return
    setSaving(true)
    const title = `${toolLabel} — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    await save(currentContent, title, ttl)
    setSaving(false)
    setOpen(true)
  }

  const bg = '#0D1117'
  const border = '#1A2332'
  const text = '#F0F2F5'
  const muted = '#8B95A5'

  return (
    <div style={{ marginTop: 16 }}>
      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={!currentContent || saving}
          style={{ padding: '7px 14px', borderRadius: 8, background: saving ? '#1A2332' : accent, border: 'none', color: '#0a0a0a', fontWeight: 800, fontSize: '0.78rem', cursor: currentContent ? 'pointer' : 'not-allowed', opacity: !currentContent ? 0.5 : 1 }}
        >
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
        </button>

        <select
          value={ttl}
          onChange={e => setTtl(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: bg, color: muted, fontSize: '0.75rem', cursor: 'pointer' }}
        >
          {TTL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          onClick={() => setOpen(o => !o)}
          style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: muted, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📂 Mes sauvegardes {entries.length > 0 && <span style={{ background: accent, color: '#0a0a0a', borderRadius: 999, padding: '0 6px', fontSize: '0.68rem', fontWeight: 900 }}>{entries.length}</span>}
        </button>

        {onReset && (
          <button
            onClick={() => setConfirm('reset')}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            🔄 Réinitialiser
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${border}`, background: isFullscreen ? `${accent}15` : 'transparent', color: isFullscreen ? accent : muted, fontSize: '0.78rem', cursor: 'pointer' }}
        >
          {isFullscreen ? '⊡' : '⛶'}
        </button>
      </div>

      {/* Collaborative sharing */}
      {toolId && (
        <WorkspaceShare
          toolId={toolId}
          toolLabel={toolLabel}
          currentContent={currentContent}
          onRemoteContent={content => { onLoad?.(content) }}
          accent={accent}
        />
      )}

      {/* Saved list */}
      {open && (
        <div style={{ marginTop: 12, background: bg, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: text }}>Travaux sauvegardés</span>
            {entries.length > 0 && (
              <button onClick={() => setConfirm('clear')} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                🗑 Tout supprimer
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: muted, fontSize: '0.82rem' }}>Chargement...</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: muted, fontSize: '0.82rem' }}>Aucune sauvegarde. Générez un document puis cliquez sur "Sauvegarder".</div>
          ) : (
            <div>
              {entries.map((e, i) => {
                const pl = e.payload || {}
                const title = pl.title || `Document ${i + 1}`
                const expiry = pl.expires_at
                const expired = expiry && new Date(expiry) < new Date()
                return (
                  <div key={e.id || i} style={{ padding: '12px 16px', borderBottom: i < entries.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, opacity: expired ? 0.5 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.83rem', fontWeight: 700, color: text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      <div style={{ fontSize: '0.72rem', color: muted, display: 'flex', gap: 10 }}>
                        <span>📅 {fmtDate(e.created_at)}</span>
                        {expiry && <span style={{ color: expired ? '#ef4444' : muted }}>{relDate(expiry)}</span>}
                        {pl.content && <span>{Math.round(pl.content.length / 100) / 10} kcar</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!expired && onLoad && (
                        <button onClick={() => { onLoad(pl.content); setOpen(false) }} style={{ padding: '5px 10px', borderRadius: 7, background: `rgba(240,180,41,0.1)`, border: `1px solid rgba(240,180,41,0.2)`, color: accent, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Charger</button>
                      )}
                      <button onClick={() => exportTextFile(pl.content || '', (title || 'document').replace(/[^\wÀ-ÿ\s-]/gi, '').trim())} style={{ padding: '5px 10px', borderRadius: 7, background: 'transparent', border: `1px solid ${border}`, color: muted, fontSize: '0.72rem', cursor: 'pointer' }}>⬇ TXT</button>
                      <button onClick={() => setConfirm(e.id || i)} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0D1117', border: `1px solid ${border}`, borderRadius: 14, padding: '24px 28px', maxWidth: 360, width: '90%' }}>
            <div style={{ fontWeight: 800, color: text, marginBottom: 8, fontSize: '0.95rem' }}>
              {confirm === 'reset' ? '🔄 Réinitialiser l\'outil ?' : confirm === 'clear' ? '🗑 Supprimer toutes les sauvegardes ?' : '🗑 Supprimer cette sauvegarde ?'}
            </div>
            <div style={{ color: muted, fontSize: '0.82rem', marginBottom: 20 }}>
              {confirm === 'reset' ? 'Le contenu actuel sera effacé. Vos sauvegardes restent intactes.' : 'Cette action est irréversible.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => {
                if (confirm === 'reset') { onReset?.(); setConfirm(null) }
                else if (confirm === 'clear') { clearAll(); setConfirm(null) }
                else { remove(confirm); setConfirm(null) }
              }} style={{ flex: 1, padding: '10px', borderRadius: 9, background: '#ef4444', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}>
                Confirmer
              </button>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: 'transparent', border: `1px solid ${border}`, color: muted, cursor: 'pointer', fontSize: '0.82rem' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * WorkspaceShare — Collaborative workspace via share code
 * Generates a 6-char code. Other subscribers enter the code to join.
 * Real-time sync via Supabase Realtime channels.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function WorkspaceShare({
  toolId,
  toolLabel = 'Outil',
  currentContent,
  onRemoteContent,   // (content, from) => void — called when remote user pushes content
  accent = '#F0B429',
}) {
  const [mode, setMode] = useState(null)           // null | 'host' | 'guest'
  const [code, setCode] = useState('')
  const [joinInput, setJoinInput] = useState('')
  const [peers, setPeers] = useState([])           // [{ id, name }]
  const [status, setStatus] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const channelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
  const userId = useRef(Math.random().toString(36).slice(2, 8))
  // eslint-disable-next-line react-hooks/purity -- Called from event handlers/effects, not during pure render — instability is intentional or scoped
  const userName = useRef('Abonné-' + Math.floor(Math.random() * 900 + 100))

  const subscribe = useCallback((shareCode) => {
    if (channelRef.current) channelRef.current.unsubscribe()

    const ch = supabase.channel(`workspace-${shareCode}`, {
      config: { broadcast: { self: false } }
    })

    ch.on('broadcast', { event: 'content' }, ({ payload }) => {
      if (payload?.from !== userId.current) {
        onRemoteContent?.(payload.content, payload.fromName || 'Collègue')
        setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    })
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      const list = Object.values(state).flat().map(p => ({ id: p.user_id, name: p.user_name }))
      setPeers(list.filter(p => p.id !== userId.current))
    })
    ch.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      setStatus(`👤 ${newPresences[0]?.user_name || 'Quelqu\'un'} a rejoint`)
      setTimeout(() => setStatus(''), 3000)
    })
    ch.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      setStatus(`👋 ${leftPresences[0]?.user_name || 'Quelqu\'un'} a quitté`)
      setTimeout(() => setStatus(''), 3000)
    })

    ch.subscribe(async (s) => {
      if (s === 'SUBSCRIBED') {
        await ch.track({ user_id: userId.current, user_name: userName.current, tool: toolId })
      }
    })

    channelRef.current = ch
    return ch
  }, [toolId, onRemoteContent])

  function startHost() {
    const c = genCode()
    setCode(c)
    setMode('host')
    setError('')
    subscribe(c)
    // Store in Supabase for discovery
    supabase.from('ai_jobs').insert({
      tool: toolId, job_type: 'shared_workspace',
      payload: { code: c, label: toolLabel, host: userName.current, created_at: new Date().toISOString() },
      created_at: new Date().toISOString(),
    }).then(() => {})
  }

  async function joinSession() {
    const c = joinInput.trim().toUpperCase()
    if (c.length < 4) { setError('Code invalide'); return }
    setError('')
    setMode('guest')
    setCode(c)
    subscribe(c)
  }

  function pushContent() {
    if (!channelRef.current || !currentContent) return
    setSyncing(true)
    channelRef.current.send({
      type: 'broadcast', event: 'content',
      payload: { content: currentContent, from: userId.current, fromName: userName.current, tool: toolId },
    }).then(() => {
      setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setSyncing(false)
    })
  }

  function leave() {
    channelRef.current?.unsubscribe()
    channelRef.current = null
    setMode(null)
    setCode('')
    setPeers([])
    setStatus('')
  }

  useEffect(() => () => { channelRef.current?.unsubscribe() }, [])

  const bg = '#0D1117'
  const border = '#1A2332'
  const text = '#F0F2F5'
  const muted = '#8B95A5'

  return (
    <div style={{ marginTop: 10 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '7px 14px', borderRadius: 8,
          border: `1px solid ${mode ? accent : border}`,
          background: mode ? `${accent}15` : 'transparent',
          color: mode ? accent : muted,
          fontSize: '0.78rem', fontWeight: mode ? 800 : 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        🤝 {mode ? `Partagé${peers.length > 0 ? ` · ${peers.length + 1} en ligne` : ''}` : 'Partager'}
        {peers.length > 0 && (
          <span style={{ background: accent, color: '#0a0a0a', borderRadius: 999, padding: '0 6px', fontSize: '0.65rem', fontWeight: 900 }}>{peers.length + 1}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{ marginTop: 8, background: bg, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}` }}>
            <div style={{ fontWeight: 800, color: text, fontSize: '0.82rem', marginBottom: 4 }}>🤝 Poste de travail partagé</div>
            <div style={{ fontSize: '0.72rem', color: muted }}>Travaillez ensemble sur le même document en temps réel via un code</div>
          </div>

          {!mode ? (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={startHost} style={{ flex: 1, padding: '10px', borderRadius: 9, background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                  🔑 Créer une session
                </button>
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  <input
                    value={joinInput}
                    onChange={e => setJoinInput(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={8}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: `1px solid ${border}`, background: '#070B0F', color: text, fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', outline: 'none', minWidth: 0 }}
                    onKeyDown={e => e.key === 'Enter' && joinSession()}
                  />
                  <button onClick={joinSession} style={{ padding: '9px 14px', borderRadius: 8, background: '#18A84A', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                    Rejoindre
                  </button>
                </div>
              </div>
              {error && <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</div>}
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              {/* Code display */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#070B0F', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: muted, marginBottom: 2 }}>{mode === 'host' ? 'CODE À PARTAGER' : 'SESSION REJOINTE'}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: accent, letterSpacing: '0.25em' }}>{code}</div>
                </div>
                {mode === 'host' && (
                  <button
                    onClick={() => navigator.clipboard.writeText(code).catch(() => {})}
                    style={{ padding: '7px 12px', borderRadius: 7, background: `${accent}15`, border: `1px solid ${accent}30`, color: accent, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📋 Copier
                  </button>
                )}
              </div>

              {/* Collaborators */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.72rem', color: muted, marginBottom: 6 }}>PARTICIPANTS EN LIGNE</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ padding: '4px 10px', borderRadius: 999, background: `${accent}20`, border: `1px solid ${accent}30`, fontSize: '0.72rem', color: accent, fontWeight: 700 }}>
                    {userName.current} (moi)
                  </div>
                  {peers.map(p => (
                    <div key={p.id} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.25)', fontSize: '0.72rem', color: '#18A84A', fontWeight: 600 }}>
                      {p.name}
                    </div>
                  ))}
                  {peers.length === 0 && <div style={{ fontSize: '0.72rem', color: muted }}>En attente d'un collègue...</div>}
                </div>
              </div>

              {/* Status */}
              {status && <div style={{ fontSize: '0.74rem', color: '#18A84A', marginBottom: 8 }}>{status}</div>}
              {lastSync && <div style={{ fontSize: '0.7rem', color: muted, marginBottom: 8 }}>🔄 Dernière sync : {lastSync}</div>}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={pushContent}
                  disabled={!currentContent || syncing || peers.length === 0}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, background: peers.length > 0 ? accent : '#1A2332', border: 'none', color: peers.length > 0 ? '#0a0a0a' : muted, fontWeight: 800, fontSize: '0.78rem', cursor: peers.length > 0 ? 'pointer' : 'not-allowed', opacity: !currentContent ? 0.5 : 1 }}
                >
                  {syncing ? '⏳ Envoi...' : '📤 Partager mon contenu'}
                </button>
                <button onClick={leave} style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                  Quitter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

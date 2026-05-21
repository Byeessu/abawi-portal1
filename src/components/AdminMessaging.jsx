import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

async function groqGenerate(prompt) {
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch { return '' }
}

const IS = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'var(--bg-primary)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
}

const canalColors = { email: '#3B82F6', whatsapp: '#18A84A', les_deux: '#F0B429' }
const canalLabels = { email: '📧 Email', whatsapp: '💬 WhatsApp', les_deux: '📧+💬 Les deux' }

export default function AdminMessaging({ showToast }) {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [filter, setFilter] = useState('tous')
  const [search, setSearch] = useState('')
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')
  const [canal, setCanal] = useState('email')
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
    loadMembres()
    // eslint-disable-next-line react-hooks/immutability -- JS function-declaration hoisting handles this correctly; rule is overstrict for this pattern
    loadHistory()
  }, [])

  async function loadMembres() {
    setLoading(true)
    const { data } = await supabase.from('membres').select('*').order('created_at', { ascending: false })
    setMembres(data || [])
    setLoading(false)
  }

  async function loadHistory() {
    setHistLoading(true)
    const { data } = await supabase.from('admin_messages').select('*').order('created_at', { ascending: false }).limit(50)
    setHistory(data || [])
    setHistLoading(false)
  }

  const now = new Date()
  const filtered = membres.filter(m => {
    const isActive = m.statut === 'actif' && new Date(m.date_fin) > now
    if (filter === 'actif') return isActive && m.role !== 'admin'
    if (filter === 'expiré') return !isActive && m.role !== 'admin'
    if (filter === 'admin') return m.role === 'admin'
    return true
  }).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.email?.toLowerCase().includes(q) || `${m.prenom} ${m.nom}`.toLowerCase().includes(q)
  })

  function toggleSelect(email) {
    setSelected(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email])
  }

  function selectAll() {
    const emails = filtered.map(m => m.email)
    setSelected(prev => prev.length === emails.length ? [] : emails)
  }

  async function generateWithAI() {
    if (!sujet) { showToast('⚠️ Entrez un sujet d\'abord', 'warning'); return }
    setGenerating(true)
    const count = selected.length || filtered.length
    const prompt = `Tu es l'assistant d'ABAWI, une plateforme éducative africaine premium.
Rédige un message professionnel en français pour envoyer à ${count} membre(s).
Sujet : "${sujet}"
Canal : ${canal}
Le message doit être chaleureux, motivant, concis (3-4 phrases max).
Ne mets pas de formule de salutation générique. Commence directement par le contenu.
Termine par une signature : "L'équipe ABAWI 🏆"`
    const text = await groqGenerate(prompt)
    if (text) { setMessage(text); showToast('✅ Message généré par IA') }
    else showToast('❌ Erreur IA', 'error')
    setGenerating(false)
  }

  async function sendMessages() {
    if (!sujet || !message) { showToast('⚠️ Sujet et message requis', 'warning'); return }
    const targets = selected.length > 0
      ? membres.filter(m => selected.includes(m.email))
      : filtered
    if (targets.length === 0) { showToast('⚠️ Aucun destinataire', 'warning'); return }

    setSending(true)
    const rows = targets.map(m => ({
      membre_email: m.email,
      membre_nom: `${m.prenom || ''} ${m.nom || ''}`.trim(),
      sujet,
      message,
      canal,
      type: 'message',
      statut: 'envoye',
    }))

    const { error } = await supabase.from('admin_messages').insert(rows)
    if (error) { showToast('❌ Erreur: ' + error.message, 'error'); setSending(false); return }

    // Open WhatsApp for single target
    if (canal !== 'email' && targets.length === 1 && targets[0].telephone) {
      const tel = targets[0].telephone.replace(/\D/g, '')
      const waMsg = encodeURIComponent(`*${sujet}*\n\n${message}`)
      window.open(`https://wa.me/${tel}?text=${waMsg}`, '_blank')
    }

    showToast(`✅ ${rows.length} message(s) enregistré(s)`)
    setSujet(''); setMessage(''); setSelected([])
    loadHistory()
    setSending(false)
  }

  function copyEmails() {
    const emails = (selected.length > 0 ? selected : filtered.map(m => m.email)).join(', ')
    navigator.clipboard.writeText(emails).then(() => showToast('✅ Emails copiés !'))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>📨 Messagerie</h2>
        <button onClick={copyEmails} style={{
          padding: '8px 16px', borderRadius: 10,
          background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.3)',
          color: 'var(--gold)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
        }}>📋 Copier les emails</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* LEFT — Liste membres */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontSize: '0.9rem' }}>
            Destinataires — {selected.length > 0 ? `${selected.length} sélectionné(s)` : `${filtered.length} affiché(s)`}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {[['tous','Tous'], ['actif','Actifs'], ['expiré','Expirés'], ['admin','Admins']].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                background: filter === k ? 'rgba(240,180,41,0.15)' : 'rgba(128,128,128,0.06)',
                border: `1px solid ${filter === k ? 'var(--gold)' : 'var(--border)'}`,
                color: filter === k ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>

          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{ ...IS, marginBottom: 10 }}
          />

          <button onClick={selectAll} style={{
            width: '100%', padding: '6px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#3B82F6', cursor: 'pointer', marginBottom: 10,
          }}>
            {selected.length === filtered.length && filtered.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>Chargement...</div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map(m => {
                const isActive = m.statut === 'actif' && new Date(m.date_fin) > now
                const isSel = selected.includes(m.email)
                return (
                  <div key={m.email} onClick={() => toggleSelect(m.email)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 8, cursor: 'pointer',
                    background: isSel ? 'rgba(59,130,246,0.12)' : 'rgba(128,128,128,0.04)',
                    border: `1px solid ${isSel ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      background: isSel ? '#3B82F6' : 'rgba(128,128,128,0.12)',
                      border: `1px solid ${isSel ? '#3B82F6' : 'var(--border)'}`,

                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSel && <span style={{ color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.prenom} {m.nom}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.email}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 7px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                      background: m.role === 'admin' ? 'rgba(240,180,41,0.15)' : isActive ? 'rgba(24,168,74,0.12)' : 'rgba(239,68,68,0.1)',
                      color: m.role === 'admin' ? '#F0B429' : isActive ? '#18A84A' : '#ef4444',
                    }}>
                      {m.role === 'admin' ? 'Admin' : isActive ? 'Actif' : 'Expiré'}
                    </span>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun membre</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Compose + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.9rem' }}>
              ✍️ Composer un message
            </div>

            {/* Canal */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Canal d'envoi</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(canalLabels).map(([k, l]) => (
                  <button key={k} onClick={() => setCanal(k)} style={{
                    flex: 1, padding: '7px 6px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                    background: canal === k ? `${canalColors[k]}18` : 'rgba(128,128,128,0.06)',
                    border: `1px solid ${canal === k ? canalColors[k] + '50' : 'var(--border)'}`,
                    color: canal === k ? canalColors[k] : 'var(--text-secondary)', cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Sujet</label>
              <input value={sujet} onChange={e => setSujet(e.target.value)} placeholder="Ex: Renouvellement ABAWI+" style={IS} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Message</label>
                <button onClick={generateWithAI} disabled={generating} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)',
                  color: 'var(--gold)', cursor: generating ? 'not-allowed' : 'pointer',
                }}>
                  {generating ? '⏳ IA...' : '✨ Générer avec IA'}
                </button>
              </div>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                rows={6} placeholder="Votre message..."
                style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {message && (
              <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>APERÇU</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>{sujet}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{message}</div>
              </div>
            )}

            <button onClick={sendMessages} disabled={sending} style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: sending ? 'var(--bg-card)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              border: 'none', color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem',
              cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif',
            }}>
              {sending ? '⏳ Envoi...' : `📨 Envoyer à ${selected.length > 0 ? selected.length : filtered.length} membre(s)`}
            </button>
          </div>

          {/* Historique */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontSize: '0.9rem' }}>📋 Historique</div>
            {histLoading ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 16 }}>Chargement...</div>
            ) : history.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Aucun message envoyé</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ padding: '10px 12px', background: 'rgba(128,128,128,0.04)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{h.sujet}</span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 100, fontWeight: 700, flexShrink: 0, background: `${canalColors[h.canal] || 'var(--text-muted)'}18`, color: canalColors[h.canal] || 'var(--text-muted)' }}>{h.canal}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>→ {h.membre_email}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 900px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

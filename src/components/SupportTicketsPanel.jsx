import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CREATE_TABLE_SQL = `-- Exécuter dans Supabase > SQL Editor
create table if not exists public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  statut      text not null default 'nouveau'
                check (statut in ('nouveau','en_cours','resolu','ferme')),
  priorite    text not null default 'normal'
                check (priorite in ('basse','normal','haute','urgente')),
  sujet       text not null,
  message     text not null,
  nom         text,
  email       text not null,
  telephone   text,
  categorie   text,
  reponse_admin text,
  admin_email text,
  repondu_at  timestamptz
);

-- Activer RLS
alter table public.support_tickets enable row level security;

-- Permettre INSERT depuis les utilisateurs non-connectés (formulaire public)
create policy "anyone can insert" on public.support_tickets
  for insert with check (true);

-- Permettre SELECT/UPDATE uniquement aux utilisateurs authentifiés (admins)
create policy "auth users can read" on public.support_tickets
  for select using (auth.role() = 'authenticated');

create policy "auth users can update" on public.support_tickets
  for update using (auth.role() = 'authenticated');`

const STATUT_COLORS = {
  nouveau: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
  en_cours: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  resolu: { bg: 'rgba(24,168,74,0.12)', color: '#18A84A' },
  ferme: { bg: 'rgba(100,116,139,0.12)', color: '#64748B' },
}

const PRIORITE_LABELS = { basse: '↓ Basse', normal: '● Normal', haute: '↑ Haute', urgente: '🔥 Urgente' }

const IS = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  background: 'var(--bg-primary)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
}

export default function SupportTicketsPanel({ showToast }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [filter, setFilter] = useState('tous') // tous | nouveau | en_cours | resolu
  const [selected, setSelected] = useState(null)
  const [reponse, setReponse] = useState('')
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState({ total: 0, nouveau: 0, en_cours: 0, resolu: 0 })

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadTickets() {
    setLoadError(null)
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      const msg = error.message || JSON.stringify(error)
      setLoadError(msg)
      showToast('❌ ' + msg, 'error')
      setLoading(false)
      return
    }

    const list = data || []
    setTickets(list)
    setStats({
      total: list.length,
      nouveau: list.filter(t => t.statut === 'nouveau').length,
      en_cours: list.filter(t => t.statut === 'en_cours').length,
      resolu: list.filter(t => t.statut === 'resolu').length,
    })
    setLoading(false)
  }

  const filtered = tickets.filter(t => {
    if (filter === 'tous') return true
    return t.statut === filter
  })

  async function repondre() {
    if (!selected || !reponse.trim()) return
    setSending(true)

    const { error } = await supabase
      .from('support_tickets')
      .update({
        reponse_admin: reponse.trim(),
        admin_email: 'admin@abawi.sn',
        statut: 'resolu',
        repondu_at: new Date().toISOString(),
      })
      .eq('id', selected.id)

    if (error) {
      showToast('❌ ' + error.message, 'error')
      setSending(false)
      return
    }

    showToast('✅ Réponse envoyée')
    setReponse('')
    setSelected(null)
    loadTickets()
    setSending(false)
  }

  async function changerStatut(id, statut) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ statut })
      .eq('id', id)

    if (error) {
      showToast('❌ ' + error.message, 'error')
      return
    }
    showToast(`✅ Statut mis à jour : ${statut}`)
    loadTickets()
    if (selected?.id === id) setSelected(p => ({ ...p, statut }))
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '#8B5CF6' },
          { label: 'Nouveaux', value: stats.nouveau, color: '#3B82F6' },
          { label: 'En cours', value: stats.en_cours, color: '#F59E0B' },
          { label: 'Résolus', value: stats.resolu, color: '#18A84A' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px', borderRadius: 12,
            background: `${s.color}10`, border: `1px solid ${s.color}25`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          ['tous', `Tous (${stats.total})`],
          ['nouveau', `Nouveaux (${stats.nouveau})`],
          ['en_cours', `En cours (${stats.en_cours})`],
          ['resolu', `Résolus (${stats.resolu})`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
            background: filter === k ? 'rgba(139,92,246,0.15)' : 'rgba(128,128,128,0.06)',
            border: `1px solid ${filter === k ? '#8B5CF6' : 'var(--border)'}`,
            color: filter === k ? '#8B5CF6' : 'var(--text-secondary)', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
            width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>📨 Ticket</h4>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '1.3rem', cursor: 'pointer',
              }}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <StatusBadge statut={selected.statut} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {PRIORITE_LABELS[selected.priorite]}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(selected.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{selected.sujet}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.message}</div>
            </div>

            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              marginBottom: 14, fontSize: '0.78rem',
            }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}><strong>De :</strong> {selected.nom || '—'} · {selected.email}</div>
              {selected.telephone && <div style={{ color: 'var(--text-muted)' }}><strong>Tél :</strong> {selected.telephone}</div>}
              <div style={{ color: 'var(--text-muted)' }}><strong>Catégorie :</strong> {selected.categorie}</div>
            </div>

            {/* Admin response */}
            {selected.reponse_admin ? (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(24,168,74,0.08)', border: '1px solid rgba(24,168,74,0.2)',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#18A84A', marginBottom: 6 }}>✅ RÉPONSE ADMIN</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selected.reponse_admin}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Répondu le {new Date(selected.repondu_at).toLocaleString('fr-FR')} · {selected.admin_email}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Répondre</label>
                <textarea
                  value={reponse}
                  onChange={e => setReponse(e.target.value)}
                  rows={4}
                  placeholder="Votre réponse à l'utilisateur..."
                  style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }}
                />
                <button
                  onClick={repondre}
                  disabled={sending || !reponse.trim()}
                  style={{
                    width: '100%', marginTop: 8, padding: '10px', borderRadius: 10,
                    background: sending ? 'var(--bg-card)' : 'linear-gradient(135deg, #18A84A, #16a34a)',
                    border: 'none', color: '#fff', fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? '⏳ Envoi...' : '✅ Envoyer la réponse'}
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.statut !== 'en_cours' && (
                <button onClick={() => changerStatut(selected.id, 'en_cours')} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  color: '#F59E0B', cursor: 'pointer',
                }}>🟡 Marquer en cours</button>
              )}
              {selected.statut !== 'resolu' && (
                <button onClick={() => changerStatut(selected.id, 'resolu')} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(24,168,74,0.1)', border: '1px solid rgba(24,168,74,0.25)',
                  color: '#18A84A', cursor: 'pointer',
                }}>🟢 Marquer résolu</button>
              )}
              {selected.statut !== 'ferme' && (
                <button onClick={() => changerStatut(selected.id, 'ferme')} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                  background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)',
                  color: '#64748B', cursor: 'pointer',
                }}>⚪ Fermer</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div style={{
          borderRadius: 12, padding: '16px 18px', marginBottom: 16,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.82rem', marginBottom: 6 }}>
            ❌ Impossible de charger les tickets
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: 10 }}>
            {loadError}
          </div>
          {(loadError.includes('does not exist') || loadError.includes('relation') || loadError.includes('42P01') || loadError.includes('schema cache')) && (
            <>
              <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginBottom: 10, lineHeight: 1.5 }}>
                <strong>💡 Cause :</strong> La table <code>support_tickets</code> existe dans la migration locale mais n’a pas encore été créée sur le projet Supabase distant (ou le cache de schéma PostgREST n’est pas à jour).
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <a
                  href="https://supabase.com/dashboard/project/nqpfmnsecjhqxuvfkqhi/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                    background: '#3B82F6', color: '#fff', textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  🔗 Ouvrir SQL Editor
                </a>
                <button
                  onClick={() => navigator.clipboard?.writeText(CREATE_TABLE_SQL).then(() => showToast('✅ SQL copié', 'success'))}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                    color: '#8B5CF6', cursor: 'pointer',
                  }}
                >
                  📋 Copier le SQL
                </button>
              </div>
              <details style={{ marginBottom: 10 }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B', cursor: 'pointer' }}>
                  📋 Script SQL complet
                </summary>
                <pre style={{
                  marginTop: 8, padding: '10px 12px', borderRadius: 8, fontSize: '0.68rem',
                  background: 'rgba(0,0,0,0.25)', color: '#a3e635', overflow: 'auto',
                  whiteSpace: 'pre-wrap', lineHeight: 1.5,
                }}>{CREATE_TABLE_SQL}</pre>
              </details>
            </>
          )}
          <button
            onClick={() => { setLoading(true); loadTickets() }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', cursor: 'pointer',
            }}
          >↻ Réessayer</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Chargement...</div>
      ) : loadError ? null : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucun ticket</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => { setSelected(t); setReponse(t.reponse_admin || '') }}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: t.statut === 'nouveau' ? 'rgba(59,130,246,0.04)' : 'var(--bg-primary)',
                border: `1px solid ${t.statut === 'nouveau' ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                  {t.sujet}
                </span>
                <StatusBadge statut={t.statut} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
                {t.message.length > 100 ? t.message.slice(0, 100) + '…' : t.message}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {t.nom || t.email} · {t.categorie}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ statut }) {
  const cfg = STATUT_COLORS[statut] || STATUT_COLORS.ferme
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 800,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {statut === 'nouveau' ? 'Nouveau' : statut === 'en_cours' ? 'En cours' : statut === 'resolu' ? 'Résolu' : 'Fermé'}
    </span>
  )
}

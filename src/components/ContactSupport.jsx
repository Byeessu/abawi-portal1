import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './ContactSupport.css'

const CATEGORIES = [
  { id: 'general', label: 'Question générale', icon: '❓' },
  { id: 'bug', label: 'Bug / Problème technique', icon: '🐛' },
  { id: 'outil', label: 'Outil qui ne fonctionne pas', icon: '🔧' },
  { id: 'facturation', label: 'Facturation / Paiement', icon: '💳' },
  { id: 'compte', label: 'Mon compte / Accès', icon: '🔐' },
  { id: 'suggestion', label: 'Suggestion / Idée', icon: '💡' },
]

const IS = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'var(--bg-primary)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
}

export default function ContactSupport() {
  const { membre } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('form') // form | success | history
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({
    sujet: '',
    message: '',
    categorie: 'general',
    telephone: membre?.telephone || '',
    email: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && membre) loadTickets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, membre])

  async function loadTickets() {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('email', membre.email)
      .order('created_at', { ascending: false })
      .limit(10)
    setTickets(data || [])
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.sujet.trim() || !form.message.trim()) {
      setError('Veuillez remplir le sujet et le message')
      return
    }
    setLoading(true)

    const { error: err } = await supabase.from('support_tickets').insert({
      email: membre?.email || form.email || 'anonyme',
      nom: membre ? `${membre.prenom || ''} ${membre.nom || ''}`.trim() : '',
      telephone: form.telephone,
      sujet: form.sujet.trim(),
      message: form.message.trim(),
      categorie: form.categorie,
      statut: 'nouveau',
    })

    if (err) {
      setError('Erreur : ' + err.message)
      setLoading(false)
      return
    }

    setForm({ sujet: '', message: '', categorie: 'general', telephone: membre?.telephone || '', email: form.email })
    setStep('success')
    loadTickets()
    setLoading(false)
  }

  const hasOpenTicket = tickets.some(t => t.statut === 'nouveau' || t.statut === 'en_cours')

  return (
    <>
      <style>{`
        .contact-support-fab {
          position: fixed !important;
          bottom: 90px !important;
          right: 20px !important;
          z-index: 9999 !important;
        }
        @media (max-width: 640px) {
          .contact-support-fab {
            bottom: 80px !important;
            left: 16px !important;
            right: auto !important;
          }
        }
      `}</style>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="contact-support-fab"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: hasOpenTicket ? 'linear-gradient(135deg, #8B5CF6, #7c3aed)' : 'linear-gradient(135deg, #F0B429, #e5a820)',
          border: 'none',
          color: '#fff',
          fontSize: '1.4rem',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        title="Contacter l'équipe"
      >
        {hasOpenTicket ? '🔔' : '💬'}
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              width: '100%', maxWidth: 480,
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '24px 20px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {step === 'history' ? '📋 Mes demandes' : step === 'success' ? '✅ Envoyé !' : '💬 Contacter l\'équipe'}
              </h3>
              <button onClick={() => { setOpen(false); setStep('form'); setError('') }} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1,
              }}>×</button>
            </div>

            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 14 }}>🚀</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 8 }}>
                  Votre message a été envoyé à l'équipe.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
                  Nous vous répondrons dans les plus brefs délais par email ou WhatsApp.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setStep('history')} style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)',
                    border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  }}>📋 Voir mes demandes</button>
                  <button onClick={() => { setStep('form'); setError('') }} style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer',
                  }}>Nouveau message</button>
                </div>
              </div>
            )}

            {step === 'history' && (
              <div>
                {tickets.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune demande</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tickets.map(t => (
                      <div key={t.id} style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.sujet}</span>
                          <StatusBadge statut={t.statut} />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                          {t.message.length > 120 ? t.message.slice(0, 120) + '…' : t.message}
                        </p>
                        {t.reponse_admin && (
                          <div style={{
                            padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(24,168,74,0.08)', border: '1px solid rgba(24,168,74,0.2)',
                            fontSize: '0.78rem', color: '#18A84A', lineHeight: 1.5,
                          }}>
                            <strong>Réponse :</strong> {t.reponse_admin}
                          </div>
                        )}
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6 }}>
                          {new Date(t.created_at).toLocaleDateString('fr-FR')} · {CATEGORIES.find(c => c.id === t.categorie)?.label || t.categorie}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setStep('form')} style={{
                  width: '100%', marginTop: 14, padding: '10px', borderRadius: 10,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer',
                }}>← Retour au formulaire</button>
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={submit}>
                {/* Quick categories */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, categorie: c.id }))}
                      style={{
                        padding: '8px 6px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                        background: form.categorie === c.id ? 'rgba(139,92,246,0.12)' : 'var(--bg-primary)',
                        border: `1px solid ${form.categorie === c.id ? 'rgba(139,92,246,0.35)' : 'var(--border)'}`,
                        color: form.categorie === c.id ? '#8B5CF6' : 'var(--text-secondary)',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Sujet</label>
                  <input
                    value={form.sujet}
                    onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
                    placeholder="Ex : Problème avec l'outil CV Pro"
                    style={IS}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={5}
                    placeholder="Décrivez votre problème en détail..."
                    style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }}
                    required
                  />
                </div>

                {!membre && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                    <input
                      value={form.email || ''}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="votre@email.com"
                      type="email"
                      style={IS}
                      required
                    />
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Téléphone (optionnel)</label>
                  <input
                    value={form.telephone}
                    onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                    placeholder="Ex : 77 123 45 67"
                    style={IS}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #8B5CF6, #7c3aed)',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? '⏳ Envoi...' : '🚀 Envoyer à l\'équipe'}
                </button>

                {tickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep('history')}
                    style={{
                      width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    📋 Voir mes {tickets.length} demande{tickets.length > 1 ? 's' : ''}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ statut }) {
  const cfg = {
    nouveau: { bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'Nouveau' },
    en_cours: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'En cours' },
    resolu: { bg: 'rgba(24,168,74,0.12)', color: '#18A84A', label: 'Résolu' },
    ferme: { bg: 'rgba(100,116,139,0.12)', color: '#64748B', label: 'Fermé' },
  }[statut] || { bg: 'var(--bg-primary)', color: 'var(--text-muted)', label: statut }

  return (
    <span style={{
      padding: '2px 8px', borderRadius: 100, fontSize: '0.65rem', fontWeight: 800,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

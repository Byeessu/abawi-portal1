import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { cleanIATextLight } from '../../lib/cleanText'
import { useToast } from '../../context/ToastContext'
import { run360Crud } from '../../lib/abawi360CrudClient'
import './Abawi360Tools.css'
import SyncStatus from '../../components/SyncStatus'
import MarkdownText from '../../components/MarkdownText'
import { Link } from 'react-router-dom'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

const STATUTS = {
  prospect: { label: 'Prospect', color: 'var(--purple)' },
  contact: { label: 'Contact', color: 'var(--accent2)' },
  client: { label: 'Client', color: 'var(--green)' },
  partenaire: { label: 'Partenaire', color: 'var(--gold)' },
  inactif: { label: 'Inactif', color: 'var(--text-muted)' },
}

const SECTEURS = ['Commerce', 'Agriculture', 'BTP', 'Transport', 'Santé', 'Éducation', 'Technologie', 'Finance', 'Immobilier', 'Autre']

const EMPTY_CONTACT = { prenom: '', nom: '', entreprise: '', poste: '', email: '', telephone: '', whatsapp: '', ville: '', secteur: '', statut: 'prospect', valeur_estimee: 0, probabilite: 0, notes: '' }

export default function CRM() {
  const { membre } = useAuth()
  const toast = useToast()
  const [contacts, setContacts] = useState([])
  const [view, setView] = useState('liste')
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState('')
  const [aiMessage, setAiMessage] = useState('')
  const [form, setForm] = useState(EMPTY_CONTACT)
  const [loadError, setLoadError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { if (membre) loadContacts() }, [membre])

  async function loadContacts() {
    setLoading(true)
    setLoadError('')
    if (!membre?.email) { setContacts([]); setLoading(false); return }
    try {
      const out = await run360Crud('list', 'crm_contacts', membre.email)
      setContacts(out.data || [])
    } catch (e) {
      toast('❌ Chargement CRM impossible: ' + e.message, 'error')
      setContacts([])
      setLoadError(e.message || 'Erreur réseau')
      setLoading(false)
      return
    }
    setLastSyncAt(new Date())
    setLoading(false)
  }

  async function saveContact() {
    if (!form.nom) return toast('Le nom est requis', 'error')
    if (!membre?.email) return toast('Utilisateur non connecté', 'error')
    setSaving(true)
    // Nettoyer les données et s'assurer que owner_email est inclus
    const payload = {
      ...form,
      owner_email: membre.email,
      telephone: form.telephone || null,
      email: form.email || null,
      entreprise: form.entreprise || null,
      ville: form.ville || null,
      valeur_estimee: form.valeur_estimee || null,
      notes: form.notes || null
    }
    try {
      if (editContact) {
        await run360Crud('update', 'crm_contacts', membre.email, { id: editContact.id, payload })
      } else {
        await run360Crud('insert', 'crm_contacts', membre.email, { payload })
      }
      toast(editContact ? 'Contact modifié' : 'Contact créé', 'success')
      setShowModal(false)
      loadContacts()
    } catch (e) {
      toast('Erreur: ' + e.message, 'error')
    }
    setSaving(false)
  }

  async function deleteContact(id) {
    if (!window.confirm('Supprimer ce contact ?')) return
    try { await run360Crud('delete', 'crm_contacts', membre.email, { id }) }
    catch { toast('❌ Suppression échouée', 'error'); return }
    toast('Contact supprimé', 'info')
    loadContacts()
  }

  function openEdit(c) {
    setEditContact(c)
    setForm({ prenom: c.prenom || '', nom: c.nom || '', entreprise: c.entreprise || '', poste: c.poste || '', email: c.email || '', telephone: c.telephone || '', whatsapp: c.whatsapp || '', ville: c.ville || '', secteur: c.secteur || '', statut: c.statut || 'prospect', valeur_estimee: c.valeur_estimee || 0, probabilite: c.probabilite || 0, notes: c.notes || '' })
    setAiSuggestions('')
    setAiMessage('')
    setShowModal(true)
  }

  async function generateSuggestions(contact) {
    if (!GROQ_KEY) { toast("❌ Clé GROQ manquante (VITE_GROQ_API_KEY).", 'error'); return }
    setGenerating(true)
    try {
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 500, temperature: 0.7,
          messages: [{ role: 'user', content: `Contact CRM : ${contact.prenom} ${contact.nom}, ${contact.entreprise}, secteur ${contact.secteur}, statut ${contact.statut}. Donne 3 suggestions concrètes pour faire avancer ce prospect en français.` }],
        }),
      })
      const data = await res.json()
      setAiSuggestions(cleanIATextLight(data.choices?.[0]?.message?.content || ''))
      toast('✅ Suggestions générées', 'success')
    } catch { toast('❌ Erreur IA', 'error') }
    setGenerating(false)
  }

  async function generateMessage(contact, type) {
    if (!GROQ_KEY) { toast("❌ Clé GROQ manquante (VITE_GROQ_API_KEY).", 'error'); return }
    setGenerating(true)
    try {
      const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 300, temperature: 0.7,
          messages: [{ role: 'user', content: `Rédige un message ${type} professionnel et chaleureux en français pour contacter ${contact.prenom} ${contact.nom} de ${contact.entreprise} (secteur ${contact.secteur}). Court, efficace, 3-4 phrases max.` }],
        }),
      })
      const data = await res.json()
      setAiMessage(cleanIATextLight(data.choices?.[0]?.message?.content || ''))
      toast('✅ Message généré', 'success')
    } catch { toast('❌ Erreur IA', 'error') }
    setGenerating(false)
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.prenom} ${c.nom} ${c.entreprise} ${c.email} ${c.ville}`.toLowerCase().includes(q)
    const matchStatut = !filterStatut || c.statut === filterStatut
    return matchSearch && matchStatut
  })

  const stats = {
    total: contacts.length,
    clients: contacts.filter(c => c.statut === 'client').length,
    prospects: contacts.filter(c => c.statut === 'prospect').length,
    valeur: contacts.reduce((acc, c) => acc + (c.valeur_estimee || 0), 0),
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--t360-bg-input)', border: '1px solid var(--t360-border-input)', color: 'var(--t360-text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }
  const labelStyle = { fontSize: '0.72rem', color: 'var(--t360-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }

  return (
    <div className="tools360-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="tools360-header">
        <div>
          <h1 className="tools360-title">👥 CRM ABAWI</h1>
          <p className="tools360-subtitle">Gérez vos contacts et votre pipeline</p>
        </div>
        <button onClick={() => { setEditContact(null); setForm(EMPTY_CONTACT); setAiSuggestions(''); setAiMessage(''); setShowModal(true) }} className="tools360-btn tools360-btn-primary">
          + Nouveau contact
        </button>
      </div>
      <SyncStatus
        lastSyncAt={lastSyncAt}
        onRetry={loadContacts}
        errorMessage={loadError}
        accent="#3B82F6"
        labels={{ errorPrefix: 'Chargement partiel CRM' }}
      />

      {/* Stats */}
      <div className="tools360-grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total contacts', value: stats.total, color: '#3B82F6' },
          { label: 'Clients actifs', value: stats.clients, color: '#18A84A' },
          { label: 'Prospects', value: stats.prospects, color: '#8B5CF6' },
          { label: 'Valeur pipeline', value: stats.valeur.toLocaleString('fr-FR') + ' F', color: '#F0B429' },
        ].map(s => (
          <div key={s.label} className="tools360-stat-card">
            <div className="tools360-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="tools360-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...inputStyle, width: '240px' }} />
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {['liste', 'pipeline'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`tools360-tab ${view === v ? 'tools360-tab-active' : ''}`} style={{ background: view === v ? 'var(--t360-accent-primary)' : undefined }}>
              {v === 'liste' ? '≡ Liste' : '⧉ Pipeline'}
            </button>
          ))}
        </div>
      </div>

      {/* Vue Liste */}
      {view === 'liste' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? <div className="tools360-loading">Chargement...</div> :
           filtered.length === 0 ? <div className="tools360-empty">Aucun contact trouvé</div> :
           filtered.map(c => (
            <div key={c.id} className="tools360-card tools360-card-hover" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: STATUTS[c.statut]?.color + '20', border: `2px solid ${STATUTS[c.statut]?.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: STATUTS[c.statut]?.color, flexShrink: 0 }}>
                {((c.prenom?.[0] || '') + (c.nom?.[0] || '')).toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--t360-text-primary)' }}>{c.prenom} {c.nom}</span>
                  <span className="tools360-badge" style={{ background: STATUTS[c.statut]?.color + '15', color: STATUTS[c.statut]?.color }}>{STATUTS[c.statut]?.label}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--t360-text-secondary)' }}>{[c.poste, c.entreprise, c.ville].filter(Boolean).join(' · ')}</div>
                {c.valeur_estimee > 0 && <div style={{ fontSize: '0.78rem', color: '#F0B429', fontWeight: 600 }}>{c.valeur_estimee.toLocaleString('fr-FR')} F — {c.probabilite}%</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="tools360-btn-icon" style={{ background: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.2)', color: '#25D366' }}>💬</a>}
                <button onClick={() => openEdit(c)} className="tools360-btn-icon" style={{ color: 'var(--t360-accent-primary)' }}>✏️</button>
                <button onClick={() => deleteContact(c.id)} className="tools360-btn-icon" style={{ color: 'var(--t360-accent-danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue Pipeline */}
      {view === 'pipeline' && (
        <div className="tools360-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', overflowX: 'auto' }}>
          {Object.entries(STATUTS).map(([statut, info]) => {
            const cols = filtered.filter(c => c.statut === statut)
            return (
              <div key={statut} className="tools360-card" style={{ borderColor: info.color + '30', overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '12px 14px', background: info.color + '15', borderBottom: `1px solid ${info.color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: info.color, fontWeight: 800, fontSize: '0.82rem' }}>{info.label}</span>
                  <span className="tools360-badge" style={{ background: info.color + '25', color: info.color }}>{cols.length}</span>
                </div>
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {cols.map(c => (
                    <div key={c.id} onClick={() => openEdit(c)} className="tools360-card-hover" style={{ padding: '10px', borderRadius: '8px', background: 'var(--t360-bg-tag)', border: '1px solid var(--t360-border)', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 600, color: 'var(--t360-text-primary)', fontSize: '0.82rem' }}>{c.prenom} {c.nom}</div>
                      {c.entreprise && <div style={{ fontSize: '0.72rem', color: 'var(--t360-text-secondary)' }}>{c.entreprise}</div>}
                      {c.valeur_estimee > 0 && <div style={{ fontSize: '0.72rem', color: '#F0B429', fontWeight: 600, marginTop: '4px' }}>{c.valeur_estimee.toLocaleString('fr-FR')} F</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Contact */}
      {showModal && (
        <div className="tools360-modal-overlay">
          <div className="tools360-modal" style={{ maxWidth: '680px' }}>
            <div className="tools360-modal-header">
              <h2 className="tools360-modal-title">{editContact ? 'Modifier contact' : 'Nouveau contact'}</h2>
              <button onClick={() => setShowModal(false)} className="tools360-modal-close">✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { key: 'prenom', label: 'Prénom' }, { key: 'nom', label: 'Nom' },
                { key: 'entreprise', label: 'Entreprise' }, { key: 'poste', label: 'Poste' },
                { key: 'email', label: 'Email' }, { key: 'telephone', label: 'Téléphone' },
                { key: 'whatsapp', label: 'WhatsApp' }, { key: 'ville', label: 'Ville' },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Secteur</label>
                <select value={form.secteur} onChange={e => setForm(p => ({ ...p, secteur: e.target.value }))} style={inputStyle}>
                  <option value="">Choisir...</option>
                  {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                  {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Valeur estimée (F)</label>
                <input type="number" value={form.valeur_estimee} onChange={e => setForm(p => ({ ...p, valeur_estimee: parseInt(e.target.value) || 0 }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Probabilité (%)</label>
              <input type="range" min="0" max="100" value={form.probabilite} onChange={e => setForm(p => ({ ...p, probabilite: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#3B82F6' }} />
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#8B95A5' }}>{form.probabilite}%</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {editContact && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={() => generateSuggestions(editContact)} disabled={generating} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                    {generating ? '...' : '🤖 Suggestions IA'}
                  </button>
                  <button onClick={() => generateMessage(editContact, 'WhatsApp')} disabled={generating} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#18A84A', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                    {generating ? '...' : '💬 Message WhatsApp IA'}
                  </button>
                </div>
                {aiSuggestions && <MarkdownText text={aiSuggestions} compact color="#C8D3E0" />}
                {aiMessage && <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(37,211,102,0.05)', borderRadius: '8px' }}><MarkdownText text={aiMessage} compact color="#C8D3E0" /></div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8B95A5', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={saveContact} style={{ padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                {editContact ? 'Enregistrer' : 'Créer contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToolInfoPanel
        toolName="CRM 360"
        icon="🤝"
        description="Gestion complète de la relation client : contacts, opportunités, tâches et tableau de bord"
        benefits={[
          'Gestion centralisée des contacts et clients',
          'Suivi des opportunités commerciales',
          'Gestion des tâches et rappels',
          'Tableau de bord avec statistiques',
          'Export CSV des données',
          'Historique des interactions',
          'Catégorisation par statut et priorité',
          'Synchronisation avec les autres outils 360',
        ]}
        howToUse={[
          'Ajoutez vos contacts avec leurs informations détaillées',
          'Créez des opportunités liées à vos contacts',
          'Planifiez des tâches avec dates et priorités',
          'Suivez le statut de vos opportunités (Nouveau, En cours, Gagné, Perdu)',
          'Utilisez le tableau de bord pour voir les statistiques',
          'Exportez vos données en CSV pour sauvegarde',
        ]}
        tips={[
          'Commencez par importer vos contacts existants',
          'Utilisez les tags pour organiser vos contacts',
          'Configurez des rappels pour ne rien oublier',
          'Analysez vos taux de conversion via le dashboard',
          'Les données sont partagées avec d\'autres outils 360',
        ]}
      />
    </div>
  )
}

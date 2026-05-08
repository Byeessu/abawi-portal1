import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/ThemeUniversal.css'
import './Marketing.css'
import { supabase } from '../../lib/supabase'
import { cleanIAText, cleanIATextLight } from '../../lib/cleanText'
import { useToast } from '../../context/ToastContext'
import { groqChatCompletion } from '../../lib/groqClient'
import SyncStatus from '../../components/SyncStatus'
import MarkdownText from '../../components/MarkdownText'
import AutonomousMarketingExpert from '../../components/AutonomousMarketingExpert'
import SocialConnectorExpert from '../../components/SocialConnectorExpert'
import { Link } from 'react-router-dom'
import ToolInfoPanel from '../../components/ToolInfoPanel'

// ═══════════════════════════════════════════════════════════════
// ICONES SVG PROFESSIONNELS - Remplacent les emojis
// ═══════════════════════════════════════════════════════════════
const IconSVG = ({ type, size = 20, color = 'currentColor' }) => {
  const icons = {
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="18" cy="6" r="1.5" fill={color}/>
      </svg>
    ),
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <path d="M8 17V11M8 8V8.01" strokeLinecap="round"/>
        <path d="M12 17V14C12 12.5 13 12 14 12C15 12 16 12.5 16 14V17"/>
        <path d="M4 6H20"/>
      </svg>
    ),
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <path d="M12 20V12M12 12H9M12 12H15M12 12V8C12 7 13 6 15 6H17" strokeLinecap="round"/>
      </svg>
    ),
    twitter: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M4 4L11 13L4 20H8L14 14L20 20H24L16 11L23 4H19L13 10L8 4H4Z" strokeLinejoin="round"/>
      </svg>
    ),
    whatsapp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M21 11.5C21 16.75 16.75 21 11.5 21C9.5 21 7.5 20.5 6 19.5L3 21L4.5 18C3.5 16.5 3 14.5 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 7.25 21 11.5Z"/>
        <path d="M9 10C9 10 10 9 11 10C12 11 12 12 12 12M12 12C12 12 13 13 14 14C15 15 14 16 14 16M9 16L10 15"/>
      </svg>
    ),
    email: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="3"/>
        <path d="M2 6L12 13L22 6"/>
      </svg>
    ),
    sms: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="3"/>
        <path d="M8 6H16M8 10H16M8 14H12"/>
      </svg>
    ),
    megaphone: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M3 8H6L11 4V20L6 16H3C2.5 16 2 15.5 2 15V9C2 8.5 2.5 8 3 8Z"/>
        <path d="M14 9C15.5 9.5 16.5 10.5 16.5 12C16.5 13.5 15.5 14.5 14 15"/>
        <path d="M19 7L19 17"/>
        <circle cx="19" cy="12" r="1" fill={color}/>
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <path d="M3 9H21"/>
        <path d="M8 2V6M16 2V6"/>
      </svg>
    ),
    write: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <path d="M12 20H20"/>
        <path d="M17 3L21 7L8 20L4 20L4 16L17 3Z"/>
        <path d="M15 5L19 9"/>
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 15L8 10L13 14L21 6"/>
        <circle cx="21" cy="6" r="1.5" fill={color}/>
      </svg>
    ),
    brain: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="12" cy="12" r="8"/>
        <circle cx="12" cy="9" r="1.5" fill={color}/>
        <circle cx="9" cy="14" r="1.2" fill={color}/>
        <circle cx="15" cy="14" r="1.2" fill={color}/>
        <path d="M12 10.5V12.5M12 12.5L9.7 13.5M12 12.5L14.3 13.5"/>
      </svg>
    ),
    globe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <ellipse cx="12" cy="12" rx="4" ry="10"/>
        <path d="M2 12H22"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M5 12L10 17L20 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    phone: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
        <rect x="6" y="2" width="12" height="20" rx="3"/>
        <circle cx="12" cy="18" r="1.5" fill={color}/>
        <path d="M10 6H14"/>
      </svg>
    ),
  }
  return icons[type] || null
}

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_LLAMA_API_KEY || ''
const GROQ_BASE_URL = import.meta.env.VITE_GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

async function callGroq(prompt, maxTokens = 800) {
  const data = await groqChatCompletion({
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  }, GROQ_KEY)
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// Opérations Supabase directes pour remplacer l'endpoint Netlify inexistant
async function marketingCrud(action, table, ownerEmail, payload = {}) {
  const { id, ...data } = payload.payload || payload
  
  try {
    if (action === 'list') {
      const { data: rows, error } = await supabase
        .from(table)
        .select('*')
        .eq('owner_email', ownerEmail)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { data: rows || [] }
    }
    
    if (action === 'insert') {
      const { data: row, error } = await supabase
        .from(table)
        .insert({ ...data, owner_email: ownerEmail })
        .select()
      if (error) throw error
      return { data: row?.[0] }
    }
    
    if (action === 'update') {
      const { data: row, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .eq('owner_email', ownerEmail)
        .select()
      if (error) throw error
      return { data: row?.[0] }
    }
    
    if (action === 'delete') {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('owner_email', ownerEmail)
      if (error) throw error
      return { ok: true }
    }
    
    return { ok: true }
  } catch (err) {
    throw new Error(err.message || `Erreur ${action}`)
  }
}

const PLATEFORMES = [
  { id: 'instagram', label: 'Instagram', iconType: 'instagram', color: '#E1306C', maxChars: 2200 },
  { id: 'linkedin', label: 'LinkedIn', iconType: 'linkedin', color: '#0A66C2', maxChars: 3000 },
  { id: 'facebook', label: 'Facebook', iconType: 'facebook', color: '#1877F2', maxChars: 63206 },
  { id: 'twitter', label: 'X / Twitter', iconType: 'twitter', color: '#1DA1F2', maxChars: 280 },
  { id: 'whatsapp', label: 'WhatsApp', iconType: 'whatsapp', color: '#25D366', maxChars: 1000 },
  { id: 'email', label: 'Email', iconType: 'email', color: '#F0B429', maxChars: 5000 },
  { id: 'sms', label: 'SMS', iconType: 'sms', color: '#8B5CF6', maxChars: 160 },
  { id: 'pub', label: 'Pub / Ad', iconType: 'megaphone', color: '#EF4444', maxChars: 300 },
]

const TYPES_CONTENU = [
  'Post promotionnel', 'Annonce produit', 'Témoignage client', 'Conseil expert',
  'Offre spéciale', 'Storytelling', 'Appel à l\'action', 'Présentation équipe',
  'Actualité sectorielle', 'Tutoriel / How-to',
]

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'Outfit,sans-serif', boxSizing: 'border-box' }
const ta = { ...inp, resize: 'vertical', minHeight: '80px' }
const lbl = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.5px' }

// Styles adaptatifs selon le thème
const themeStyles = {
  btnNav: { width: 34, height: 34, borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem' },
  monthLabel: { color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', minWidth: '140px', textAlign: 'center' },
  dayCell: { minHeight: '90px', padding: '6px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  dayNumber: (isToday) => ({ fontSize: '0.75rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#EC4899' : 'var(--text-secondary)', marginBottom: '4px' }),
  dayMore: { fontSize: '0.62rem', color: 'var(--text-muted)' },
  closeBtn: { padding: '9px 14px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' },
  resultTitle: { color: 'var(--text-primary)', fontWeight: 800 },
  emptyState: { minHeight: '320px', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' },
  sectionLabel: { color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 600 },
  scenarioBox: { border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-primary)', padding: 10 },
  scenarioTitle: { color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' },
  scenarioText: { color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: 4 },
  scenarioAccent: { color: 'var(--gold)', fontSize: '0.76rem' }
}

// ─── Calendrier éditorial ────────────────────────────────────────────────────
function Calendrier({ owner, toast }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [posts, setPosts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ titre: '', plateforme: 'instagram', type_contenu: 'Post promotionnel', date_publication: '', heure: '09:00', statut: 'planifié', contenu: '' })
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadPosts() }, [owner, year, month])

  async function loadPosts() {
    setLoadError('')
    if (!owner) { setPosts([]); return }
    const debut = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const fin = `${year}-${String(month + 1).padStart(2, '0')}-31`
    try {
      const out = await marketingCrud('list', 'marketing_posts', owner)
      const data = (out.data || []).filter((p) => p.date_publication >= debut && p.date_publication <= fin).sort((a, b) => String(a.date_publication).localeCompare(String(b.date_publication)))
      setPosts(data)
    } catch (e) {
      toast?.('❌ Chargement calendrier impossible: ' + e.message, 'error'); setPosts([]); setLoadError(e.message || 'Erreur réseau'); return
    }
    setLastSyncAt(new Date())
  }

  async function save() {
    if (!form.titre || !form.date_publication) return
    setSaving(true)
    // Nettoyer les données pour éviter les dates vides
    const payload = {
      ...form,
      date_publication: form.date_publication || null,
      heure: form.heure || '09:00',
      contenu: form.contenu || null
    }
    try {
      if (selected) await marketingCrud('update', 'marketing_posts', owner, { id: selected.id, payload })
      else await marketingCrud('insert', 'marketing_posts', owner, { payload })
    } catch (e) {
      setSaving(false); toast?.('❌ Sauvegarde post impossible: ' + e.message, 'error'); return
    }
    setSaving(false)
    setShowForm(false)
    setSelected(null)
    setForm({ titre: '', plateforme: 'instagram', type_contenu: 'Post promotionnel', date_publication: '', heure: '09:00', statut: 'planifié', contenu: '' })
    loadPosts()
  }

  async function deletePost(id) {
    if (!window.confirm('Supprimer ce post ?')) return
    try { await marketingCrud('delete', 'marketing_posts', owner, { id }) }
    catch (e) { toast?.('❌ Suppression post impossible: ' + e.message, 'error'); return }
    loadPosts()
  }

  function openEdit(post) {
    setSelected(post)
    setForm({ titre: post.titre, plateforme: post.plateforme, type_contenu: post.type_contenu, date_publication: post.date_publication, heure: post.heure || '09:00', statut: post.statut, contenu: post.contenu || '' })
    setShowForm(true)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const postsByDay = {}
  posts.forEach(p => {
    if (!p.date_publication) return
    const d = parseInt(p.date_publication.split('-')[2])
    if (!postsByDay[d]) postsByDay[d] = []
    postsByDay[d].push(p)
  })

  const STATUT_COLOR = { planifié: '#3B82F6', publié: '#18A84A', brouillon: '#8B95A5', annulé: '#EF4444' }
  const PLAT_ICON = Object.fromEntries(PLATEFORMES.map(p => [p.id, p.icon]))

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
            style={themeStyles.btnNav}>‹</button>
          <span style={themeStyles.monthLabel}>{MOIS[month]} {year}</span>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
            style={themeStyles.btnNav}>›</button>
        </div>
        <button onClick={() => { setSelected(null); setForm({ titre: '', plateforme: 'instagram', type_contenu: 'Post promotionnel', date_publication: `${year}-${String(month + 1).padStart(2, '0')}-01`, heure: '09:00', statut: 'planifié', contenu: '' }); setShowForm(true) }}
          style={{ padding: '9px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899, #be185d)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          + Nouveau post
        </button>
      </div>
      <SyncStatus
        lastSyncAt={lastSyncAt}
        onRetry={loadPosts}
        errorMessage={loadError}
        accent="#EC4899"
        labels={{ errorPrefix: 'Chargement calendrier incomplet' }}
      />

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(STATUT_COLOR).map(([s, c]) => {
          const n = posts.filter(p => p.statut === s).length
          return <div key={s} style={{ padding: '6px 14px', borderRadius: '8px', background: c + '18', border: `1px solid ${c}30`, color: c, fontSize: '0.78rem', fontWeight: 700 }}>{n} {s}</div>
        })}
        <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontSize: '0.78rem', fontWeight: 700 }}>{posts.length} total</div>
      </div>

      {/* Calendar grid */}
      <div className="marketing-calendar">
        <div className="marketing-calendar__header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {JOURS_SEMAINE.map(j => (
            <div key={j} className="marketing-calendar__day-label">{j}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayPosts = day ? (postsByDay[day] || []) : []
            return (
              <div key={i} style={{ ...themeStyles.dayCell, background: isToday ? 'rgba(236,72,153,0.06)' : 'transparent' }}>
                {day && (
                  <>
                    <div style={themeStyles.dayNumber(isToday)}>{day}</div>
                    {dayPosts.slice(0, 3).map(p => {
                      const plat = PLATEFORMES.find(x => x.id === p.plateforme)
                      return (
                        <div key={p.id} onClick={() => openEdit(p)}
                          style={{ padding: '2px 6px', borderRadius: '4px', background: (plat?.color || '#8B5CF6') + '22', border: `1px solid ${(plat?.color || '#8B5CF6')}40`, marginBottom: '2px', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={p.titre}>
                          {PLAT_ICON[p.plateforme]} {p.titre}
                        </div>
                      )
                    })}
                    {dayPosts.length > 3 && <div style={themeStyles.dayMore}>+{dayPosts.length - 3}</div>}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="marketing-modal" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="marketing-modal__content">
            <h3 className="marketing-modal__title">{selected ? 'Modifier le post' : 'Nouveau post'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={lbl}>Titre / Sujet</label><input style={inp} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex: Lancement produit X" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Plateforme</label>
                  <select style={inp} value={form.plateforme} onChange={e => setForm(f => ({ ...f, plateforme: e.target.value }))}>
                    {PLATEFORMES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Type de contenu</label>
                  <select style={inp} value={form.type_contenu} onChange={e => setForm(f => ({ ...f, type_contenu: e.target.value }))}>
                    {TYPES_CONTENU.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date_publication} onChange={e => setForm(f => ({ ...f, date_publication: e.target.value }))} /></div>
                <div><label style={lbl}>Heure</label><input type="time" style={inp} value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} /></div>
                <div>
                  <label style={lbl}>Statut</label>
                  <select style={inp} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                    <option value="planifié">Planifié</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="publié">Publié</option>
                    <option value="annulé">Annulé</option>
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Contenu / Notes</label><textarea style={ta} rows={4} value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} placeholder="Contenu du post..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setPreviewOpen(true)} className="marketing-btn marketing-btn--preview">👁️ Preview</button>
              <button onClick={save} disabled={saving} className="marketing-btn marketing-btn--primary">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              {selected && <button onClick={() => deletePost(selected.id)} className="marketing-btn marketing-btn--danger">🗑️</button>}
              <button onClick={() => setShowForm(false)} className="marketing-btn marketing-btn--secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
      {previewOpen && (
        <div className="marketing-modal" style={{ zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false) }}>
          <div className="marketing-modal__preview">
            <h4 className="marketing-modal__preview-title">Prévisualisation publication</h4>
            <div className="marketing-modal__preview-meta">{form.plateforme} · {form.type_contenu}</div>
            <div className="marketing-modal__preview-box">
              <strong>{form.titre || 'Titre'}</strong>
              <div style={{ marginTop: 8 }}>{form.contenu || 'Contenu...'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => setPreviewOpen(false)} style={themeStyles.closeBtn}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Générateur IA ────────────────────────────────────────────────────────────
function GenerateurIA() {
  const [plateforme, setPlateforme] = useState('instagram')
  const [type, setType] = useState('Post promotionnel')
  const [form, setForm] = useState({ produit: '', cible: '', ton: 'professionnel', hashtags: true, emoji: true, cta: true })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scenarios, setScenarios] = useState([])
  const [simulating, setSimulating] = useState(false)

  const plat = PLATEFORMES.find(p => p.id === plateforme)

  async function generate() {
    if (!form.produit) return
    setLoading(true)
    setResult('')
    const platLabel = plat?.label || plateforme
    const chars = plat?.maxChars || 500
    const prompt = `Tu es un expert en marketing digital pour les entreprises africaines (Sénégal, Côte d'Ivoire, etc.).
Rédige un ${type} pour ${platLabel} pour le produit/service suivant : "${form.produit}".
${form.cible ? `Cible : ${form.cible}.` : ''}
Ton : ${form.ton}.
${form.hashtags ? 'Inclure des hashtags pertinents.' : 'Sans hashtags.'}
${form.emoji ? 'Utiliser des emojis adaptés.' : 'Sans emojis.'}
${form.cta ? 'Inclure un appel à l\'action clair.' : ''}
Limite : ${Math.min(chars, 1000)} caractères max.
Adapté au marché africain francophone. Uniquement le texte du post, sans commentaire.`
    const text = cleanIAText(await callGroq(prompt, 600))
    setResult(text)
    setLoading(false)
  }

  async function simulateScenarios() {
    if (!result.trim()) return
    setSimulating(true)
    try {
      const prompt = `Analyse ce contenu marketing et propose 3 scénarios de rendu publication avant diffusion.
Plateforme: ${plat?.label || plateforme}
Contenu:
${result}
Retourne un JSON: {"scenarios":[{"name":"...","hook":"...","risk":"...","expectedImpact":"...","adjustment":"..."}]}`
      const raw = await callGroq(prompt, 700)
      const json = JSON.parse(String(raw).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim())
      setScenarios(Array.isArray(json?.scenarios) ? json.scenarios : [])
    } catch {
      setScenarios([])
    }
    setSimulating(false)
  }

  function copy() {
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const TONS = ['professionnel', 'décontracté', 'inspirant', 'urgent', 'humour', 'émotionnel', 'éducatif', 'luxe']

  return (
    <div className="marketing-generator">
      {/* Formulaire */}
      <div className="marketing-form-group">
        <h3 className="marketing-form-title">✍️ Paramètres</h3>

        {/* Sélection plateforme */}
        <div>
          <label style={lbl}>Plateforme cible</label>
          <div className="marketing-platforms">
            {PLATEFORMES.map(p => (
              <button
                key={p.id}
                onClick={() => setPlateforme(p.id)}
                className="marketing-platform-btn"
                style={{
                  borderColor: plateforme === p.id ? p.color : undefined,
                  background: plateforme === p.id ? p.color + '22' : undefined,
                  color: plateforme === p.id ? p.color : undefined
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>Type de contenu</label>
          <select style={inp} value={type} onChange={e => setType(e.target.value)}>
            {TYPES_CONTENU.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>Produit / Service / Sujet *</label>
          <textarea style={ta} rows={2} value={form.produit} onChange={e => setForm(f => ({ ...f, produit: e.target.value }))} placeholder="Ex: Formation entrepreneuriat 6 semaines, 49 000 FCFA..." />
        </div>

        <div>
          <label style={lbl}>Audience cible (optionnel)</label>
          <input style={inp} value={form.cible} onChange={e => setForm(f => ({ ...f, cible: e.target.value }))} placeholder="Ex: Étudiants 18-25 ans, entrepreneurs débutants..." />
        </div>

        <div>
          <label style={lbl}>Ton</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TONS.map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, ton: t }))}
                style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${form.ton === t ? '#EC4899' : 'var(--border)'}`, background: form.ton === t ? 'rgba(236,72,153,0.15)' : 'transparent', color: form.ton === t ? '#EC4899' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {[['hashtags', '#️⃣ Hashtags'], ['emoji', '😊 Emojis'], ['cta', '👆 Appel à l\'action']].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>

        <button onClick={generate} disabled={loading || !form.produit}
          style={{ padding: '14px', borderRadius: '12px', background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #EC4899, #be185d)', color: loading ? 'var(--text-muted)' : '#fff', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
          {loading ? '⏳ Génération en cours...' : `✨ Générer pour ${plat?.label}`}
        </button>
      </div>

      {/* Résultat */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={themeStyles.resultTitle}>📋 Résultat</h3>
          {result && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={copy} style={{ padding: '6px 14px', borderRadius: '8px', background: copied ? 'rgba(24,168,74,0.15)' : 'var(--bg-primary)', border: `1px solid ${copied ? 'rgba(24,168,74,0.3)' : 'var(--border)'}`, color: copied ? '#18A84A' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>{copied ? '✓ Copié !' : '📋 Copier'}</button>
              <button onClick={generate} style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#EC4899', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>🔄 Regénérer</button>
              <button onClick={simulateScenarios} disabled={simulating} style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                {simulating ? 'Simulation...' : '🧪 Simuler'}
              </button>
            </div>
          )}
        </div>

        {result ? (
          <div>
            <textarea
              value={result}
              onChange={e => setResult(e.target.value)}
              style={{ ...ta, minHeight: '320px', lineHeight: '1.6', fontSize: '0.88rem', borderColor: plat?.color + '40' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{result.length} / {plat?.maxChars} caractères</span>
              <span style={{ fontSize: '0.72rem', color: result.length > (plat?.maxChars || 9999) ? '#EF4444' : '#18A84A', fontWeight: 700 }}>
                {result.length > (plat?.maxChars || 9999) ? `⚠️ Dépasse la limite de ${plat?.label}` : '✓ Dans la limite'}
              </span>
            </div>
          </div>
        ) : (
          <div style={themeStyles.emptyState}>
            <div style={{ fontSize: '2.5rem' }}>✨</div>
            <p style={themeStyles.emptyText}>
              Remplissez les paramètres et cliquez<br />sur "Générer" pour créer votre texte
            </p>
          </div>
        )}

        {/* Variantes rapides */}
        {result && (
          <div style={{ marginTop: '16px' }}>
            <p style={themeStyles.sectionLabel}>GÉNÉRER AUSSI POUR :</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PLATEFORMES.filter(p => p.id !== plateforme).slice(0, 5).map(p => (
                <button key={p.id} onClick={() => { setPlateforme(p.id); setTimeout(generate, 100) }}
                  style={{ padding: '5px 12px', borderRadius: '6px', background: p.color + '15', border: `1px solid ${p.color}30`, color: p.color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {scenarios.length > 0 && (
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {scenarios.map((s, i) => (
              <div key={i} style={themeStyles.scenarioBox}>
                <div style={themeStyles.scenarioTitle}>{s.name || `Scénario ${i + 1}`}</div>
                <div style={themeStyles.scenarioText}>Hook: {s.hook || '—'}</div>
                <div style={themeStyles.scenarioText}>Impact: {s.expectedImpact || '—'}</div>
                <div style={themeStyles.scenarioAccent}>Ajustement: {s.adjustment || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Campagnes ────────────────────────────────────────────────────────────────
function Campagnes({ owner, toast }) {
  const [campagnes, setCampagnes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ nom: '', plateforme: 'instagram', budget: '', depense: '', revenus: '', date_debut: '', date_fin: '', statut: 'active', objectif: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [aiTips, setAiTips] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [campPreview, setCampPreview] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { loadCampagnes() }, [owner])

  async function loadCampagnes() {
    setLoadError('')
    if (!owner) { setCampagnes([]); return }
    try {
      const out = await marketingCrud('list', 'marketing_campagnes', owner)
      setCampagnes(out.data || [])
    } catch (e) {
      toast?.('❌ Chargement campagnes impossible: ' + e.message, 'error'); setCampagnes([]); setLoadError(e.message || 'Erreur réseau'); return
    }
    setLastSyncAt(new Date())
  }

  async function save() {
    if (!form.nom) return
    setSaving(true)
    const payload = { ...form, budget: parseFloat(form.budget) || 0, depense: parseFloat(form.depense) || 0, revenus: parseFloat(form.revenus) || 0 }
    try {
      if (selected) await marketingCrud('update', 'marketing_campagnes', owner, { id: selected.id, payload })
      else await marketingCrud('insert', 'marketing_campagnes', owner, { payload })
    } catch (e) {
      setSaving(false); toast?.('❌ Sauvegarde campagne impossible: ' + e.message, 'error'); return
    }
    setSaving(false); setShowForm(false); setSelected(null)
    setForm({ nom: '', plateforme: 'instagram', budget: '', depense: '', revenus: '', date_debut: '', date_fin: '', statut: 'active', objectif: '', notes: '' })
    loadCampagnes()
  }

  async function simulateCampaign() {
    if (!form.nom) return
    try {
      const prompt = `Simule le rendu final de campagne avant publication.
Nom: ${form.nom}
Plateforme: ${form.plateforme}
Objectif: ${form.objectif}
Budget: ${form.budget}
Statut: ${form.statut}
Retourne un JSON {"readiness":0-100,"projection":"...","risks":["..."],"adjustments":["..."]}`
      const raw = await callGroq(prompt, 500)
      const parsed = JSON.parse(String(raw).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim())
      setCampPreview(parsed)
    } catch {
      setCampPreview(null)
    }
  }

  async function deleteCamp(id) {
    if (!window.confirm('Supprimer cette campagne ?')) return
    try { await marketingCrud('delete', 'marketing_campagnes', owner, { id }) }
    catch (e) { toast?.('❌ Suppression campagne impossible: ' + e.message, 'error'); return }
    loadCampagnes()
  }

  async function getAiTips(camp) {
    setLoadingAi(true)
    setAiTips('')
    const roi = camp.revenus && camp.depense ? (((camp.revenus - camp.depense) / camp.depense) * 100).toFixed(0) : 'N/A'
    const prompt = `Analyse cette campagne marketing et donne 3 conseils d'optimisation concrets en français :
Campagne : "${camp.nom}", Plateforme : ${camp.plateforme}
Budget : ${camp.budget} FCFA, Dépensé : ${camp.depense} FCFA, Revenus : ${camp.revenus} FCFA, ROI : ${roi}%
Objectif : ${camp.objectif || 'Non défini'}
Statut : ${camp.statut}
Donne des conseils pratiques adaptés au marché africain.`
    const text = cleanIATextLight(await callGroq(prompt, 500))
    setAiTips(text)
    setLoadingAi(false)
  }

  const totalBudget = campagnes.reduce((s, c) => s + (c.budget || 0), 0)
  const totalDepense = campagnes.reduce((s, c) => s + (c.depense || 0), 0)
  const totalRevenus = campagnes.reduce((s, c) => s + (c.revenus || 0), 0)
  const roiGlobal = totalDepense > 0 ? (((totalRevenus - totalDepense) / totalDepense) * 100).toFixed(1) : 0

  const STATUT_COLOR = { active: '#18A84A', terminée: '#3B82F6', pause: '#F0B429', annulée: '#EF4444' }

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Budget total', value: totalBudget.toLocaleString('fr') + ' F', color: '#3B82F6' },
          { label: 'Dépensé', value: totalDepense.toLocaleString('fr') + ' F', color: '#F0B429' },
          { label: 'Revenus', value: totalRevenus.toLocaleString('fr') + ' F', color: '#18A84A' },
          { label: 'ROI Global', value: roiGlobal + '%', color: roiGlobal >= 0 ? '#18A84A' : '#EF4444' },
        ].map(k => (
          <div key={k.label} style={{ background: '#0D1117', border: `1px solid ${k.color}25`, borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ color: '#8B95A5', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>{k.label.toUpperCase()}</p>
            <p style={{ color: k.color, fontSize: '1.4rem', fontWeight: 900 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => { setSelected(null); setForm({ nom: '', plateforme: 'instagram', budget: '', depense: '', revenus: '', date_debut: '', date_fin: '', statut: 'active', objectif: '', notes: '' }); setShowForm(true) }}
          style={{ padding: '9px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899, #be185d)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          + Nouvelle campagne
        </button>
      </div>
      <SyncStatus
        lastSyncAt={lastSyncAt}
        onRetry={loadCampagnes}
        errorMessage={loadError}
        accent="#EC4899"
        labels={{ errorPrefix: 'Chargement campagnes incomplet' }}
      />

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {campagnes.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#4A5568' }}>Aucune campagne. Créez votre première campagne !</div>}
        {campagnes.map(c => {
          const roi = c.depense > 0 ? (((c.revenus - c.depense) / c.depense) * 100).toFixed(1) : null
          const plat = PLATEFORMES.find(p => p.id === c.plateforme)
          return (
            <div key={c.id} style={{ background: '#0D1117', border: '1px solid #1A2332', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem' }}>{plat?.icon}</span>
                    <h4 style={{ color: '#F0F2F5', fontWeight: 800, margin: 0 }}>{c.nom}</h4>
                    <span style={{ padding: '2px 10px', borderRadius: '100px', background: (STATUT_COLOR[c.statut] || '#8B95A5') + '20', color: STATUT_COLOR[c.statut] || '#8B95A5', fontSize: '0.7rem', fontWeight: 700 }}>{c.statut}</span>
                  </div>
                  {c.objectif && <p style={{ color: '#8B95A5', fontSize: '0.8rem', margin: '0 0 10px' }}>{c.objectif}</p>}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#8B95A5', fontSize: '0.8rem' }}>Budget : <strong style={{ color: '#F0F2F5' }}>{(c.budget || 0).toLocaleString('fr')} F</strong></span>
                    <span style={{ color: '#8B95A5', fontSize: '0.8rem' }}>Dépensé : <strong style={{ color: '#F0B429' }}>{(c.depense || 0).toLocaleString('fr')} F</strong></span>
                    <span style={{ color: '#8B95A5', fontSize: '0.8rem' }}>Revenus : <strong style={{ color: '#18A84A' }}>{(c.revenus || 0).toLocaleString('fr')} F</strong></span>
                    {roi !== null && <span style={{ color: '#8B95A5', fontSize: '0.8rem' }}>ROI : <strong style={{ color: parseFloat(roi) >= 0 ? '#18A84A' : '#EF4444' }}>{roi}%</strong></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => getAiTips(c)} style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#EC4899', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>✨ IA</button>
                  <button onClick={() => { setSelected(c); setForm({ nom: c.nom, plateforme: c.plateforme, budget: c.budget || '', depense: c.depense || '', revenus: c.revenus || '', date_debut: c.date_debut || '', date_fin: c.date_fin || '', statut: c.statut, objectif: c.objectif || '', notes: c.notes || '' }); setShowForm(true) }}
                    style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid #1A2332', color: '#8B95A5', fontSize: '0.75rem', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => deleteCamp(c.id)} style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* AI Tips panel */}
      {(loadingAi || aiTips) && (
        <div style={{ marginTop: '20px', background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '16px', padding: '20px' }}>
          <p style={{ color: '#EC4899', fontWeight: 700, marginBottom: '10px' }}>✨ Conseils IA</p>
          {loadingAi ? <p style={{ color: '#8B95A5' }}>Analyse en cours...</p> : <MarkdownText text={aiTips} compact color="#C8D3E0" />}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={{ background: '#0D1117', borderRadius: '20px', border: '1px solid #1A2332', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#F0F2F5', fontWeight: 800, marginBottom: '24px' }}>{selected ? 'Modifier la campagne' : 'Nouvelle campagne'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={lbl}>Nom de la campagne *</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Lancement Ramadan 2025" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={lbl}>Plateforme</label>
                  <select style={inp} value={form.plateforme} onChange={e => setForm(f => ({ ...f, plateforme: e.target.value }))}>
                    {PLATEFORMES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Statut</label>
                  <select style={inp} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="pause">En pause</option>
                    <option value="terminée">Terminée</option>
                    <option value="annulée">Annulée</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>Budget (FCFA)</label><input type="number" style={inp} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" /></div>
                <div><label style={lbl}>Dépensé (FCFA)</label><input type="number" style={inp} value={form.depense} onChange={e => setForm(f => ({ ...f, depense: e.target.value }))} placeholder="0" /></div>
                <div><label style={lbl}>Revenus (FCFA)</label><input type="number" style={inp} value={form.revenus} onChange={e => setForm(f => ({ ...f, revenus: e.target.value }))} placeholder="0" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>Début</label><input type="date" style={inp} value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                <div><label style={lbl}>Fin</label><input type="date" style={inp} value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
              </div>
              <div><label style={lbl}>Objectif</label><input style={inp} value={form.objectif} onChange={e => setForm(f => ({ ...f, objectif: e.target.value }))} placeholder="Ex: +200 followers, 50 ventes..." /></div>
              <div><label style={lbl}>Notes</label><textarea style={ta} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={simulateCampaign} style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', color: '#60A5FA', fontWeight: 700, cursor: 'pointer' }}>
                🧪 Tester / Simuler
              </button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #EC4899, #be185d)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #1A2332', color: '#8B95A5', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            </div>
            {campPreview && (
              <div style={{ marginTop: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: 10 }}>
                <div style={{ color: '#60A5FA', fontWeight: 800, fontSize: '0.8rem', marginBottom: 4 }}>Simulation campagne</div>
                <div style={{ color: '#C8D3E0', fontSize: '0.78rem' }}>Readiness: {campPreview.readiness ?? '—'}</div>
                <div style={{ color: '#C8D3E0', fontSize: '0.78rem' }}>Projection: {campPreview.projection || '—'}</div>
                {!!campPreview.adjustments?.length && <div style={{ color: '#F0B429', fontSize: '0.76rem', marginTop: 4 }}>Ajustements: {campPreview.adjustments.join(' • ')}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function Analytics({ owner }) {
  const [campagnes, setCampagnes] = useState([])
  const [posts, setPosts] = useState([])
  const [aiRapport, setAiRapport] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    marketingCrud('list', 'marketing_campagnes', owner).then((out) => setCampagnes(out.data || [])).catch(() => setCampagnes([]))
    marketingCrud('list', 'marketing_posts', owner).then((out) => setPosts(out.data || [])).catch(() => setPosts([]))
  }, [owner])

  async function genererRapport() {
    setLoading(true)
    setAiRapport('')
    const totalBudget = campagnes.reduce((s, c) => s + (c.budget || 0), 0)
    const totalDepense = campagnes.reduce((s, c) => s + (c.depense || 0), 0)
    const totalRevenus = campagnes.reduce((s, c) => s + (c.revenus || 0), 0)
    const roi = totalDepense > 0 ? (((totalRevenus - totalDepense) / totalDepense) * 100).toFixed(1) : 0
    const postsByPlatform = {}
    posts.forEach(p => { postsByPlatform[p.plateforme] = (postsByPlatform[p.plateforme] || 0) + 1 })
    const prompt = `Génère un rapport marketing synthétique en français pour cette entreprise :
- ${campagnes.length} campagne(s), budget total : ${totalBudget.toLocaleString()} FCFA
- Dépensé : ${totalDepense.toLocaleString()} FCFA, Revenus générés : ${totalRevenus.toLocaleString()} FCFA
- ROI global : ${roi}%
- ${posts.length} post(s) planifiés/publiés
- Répartition par plateforme : ${JSON.stringify(postsByPlatform)}
Donne : 1) Points forts 2) Points d'amélioration 3) Recommandations stratégiques pour le marché africain. Format clair et actionnable.`
    const text = cleanIATextLight(await callGroq(prompt, 800))
    setAiRapport(text)
    setLoading(false)
  }

  const postsByPlatform = {}
  posts.forEach(p => { postsByPlatform[p.plateforme] = (postsByPlatform[p.plateforme] || 0) + 1 })
  const postsByStatus = {}
  posts.forEach(p => { postsByStatus[p.statut] = (postsByStatus[p.statut] || 0) + 1 })

  return (
    <div>
      {/* Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Campagnes', value: campagnes.length, icon: '📣', color: '#EC4899' },
          { label: 'Posts planifiés', value: posts.filter(p => p.statut === 'planifié').length, icon: '📅', color: '#3B82F6' },
          { label: 'Posts publiés', value: posts.filter(p => p.statut === 'publié').length, icon: '✅', color: '#18A84A' },
          { label: 'Plateformes actives', value: Object.keys(postsByPlatform).length, iconType: 'phone', color: '#8B5CF6' },
        ].map(k => (
          <div key={k.label} style={{ background: '#0D1117', border: `1px solid ${k.color}25`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center' }}><IconSVG type={k.iconType} size={22} color={k.color} /></div>
            <p style={{ color: k.color, fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>{k.value}</p>
            <p style={{ color: '#8B95A5', fontSize: '0.72rem', fontWeight: 600, margin: '4px 0 0' }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* By platform */}
        <div style={{ background: '#0D1117', border: '1px solid #1A2332', borderRadius: '16px', padding: '20px' }}>
          <h4 style={{ color: '#F0F2F5', fontWeight: 700, marginBottom: '16px' }}>Posts par plateforme</h4>
          {Object.keys(postsByPlatform).length === 0
            ? <p style={{ color: '#4A5568', fontSize: '0.85rem' }}>Aucun post encore.</p>
            : Object.entries(postsByPlatform).sort((a, b) => b[1] - a[1]).map(([plat, count]) => {
              const p = PLATEFORMES.find(x => x.id === plat)
              const pct = Math.round((count / posts.length) * 100)
              return (
                <div key={plat} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#C8D3E0', fontSize: '0.82rem' }}>{p?.icon} {p?.label || plat}</span>
                    <span style={{ color: p?.color || '#8B95A5', fontWeight: 700, fontSize: '0.82rem' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#1A2332', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: p?.color || '#EC4899', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })
          }
        </div>

        {/* By status */}
        <div style={{ background: '#0D1117', border: '1px solid #1A2332', borderRadius: '16px', padding: '20px' }}>
          <h4 style={{ color: '#F0F2F5', fontWeight: 700, marginBottom: '16px' }}>Posts par statut</h4>
          {Object.keys(postsByStatus).length === 0
            ? <p style={{ color: '#4A5568', fontSize: '0.85rem' }}>Aucun post encore.</p>
            : Object.entries(postsByStatus).map(([statut, count]) => {
              const colors = { planifié: '#3B82F6', publié: '#18A84A', brouillon: '#8B95A5', annulé: '#EF4444' }
              const pct = Math.round((count / posts.length) * 100)
              return (
                <div key={statut} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#C8D3E0', fontSize: '0.82rem', textTransform: 'capitalize' }}>{statut}</span>
                    <span style={{ color: colors[statut] || '#8B95A5', fontWeight: 700, fontSize: '0.82rem' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#1A2332', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colors[statut] || '#8B95A5', borderRadius: '3px' }} />
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* AI Report */}
      <div style={{ background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ color: '#EC4899', fontWeight: 800, margin: 0 }}>✨ Rapport IA Marketing</h4>
          <button onClick={genererRapport} disabled={loading}
            style={{ padding: '8px 20px', borderRadius: '10px', background: loading ? '#1A2332' : 'linear-gradient(135deg, #EC4899, #be185d)', color: loading ? '#4A5568' : '#fff', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
            {loading ? '⏳ Analyse...' : '🤖 Générer le rapport'}
          </button>
        </div>
        {aiRapport
          ? <MarkdownText text={aiRapport} compact color="#C8D3E0" />
          : <p style={{ color: '#4A5568', fontSize: '0.85rem', margin: 0 }}>Cliquez sur "Générer le rapport" pour obtenir une analyse IA de vos performances marketing.</p>
        }
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'calendrier', label: 'Calendrier', icon: 'calendar' },
  { id: 'generateur', label: 'Générateur IA', icon: 'write' },
  { id: 'campagnes', label: 'Campagnes & ROI', icon: 'megaphone' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'autonomie', label: 'Autonomie Expert', icon: 'brain' },
  { id: 'connecteurs', label: 'Connecteurs Sociaux', icon: 'globe' },
]

export default function Marketing() {
  const { membre, isAdmin, isMember } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('calendrier')

  if (!isMember && !isAdmin) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📈</div>
        <h2 style={{ color: '#F0F2F5', fontWeight: 800, marginBottom: '12px' }}>Marketing 360</h2>
        <p style={{ color: '#8B95A5', marginBottom: '28px' }}>Accédez au module Marketing 360 avec ABAWI+</p>
        <a href="/plans" style={{ padding: '14px 32px', borderRadius: '14px', background: 'linear-gradient(135deg, #EC4899, #be185d)', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🔱 S'abonner à ABAWI+</a>
      </div>
    )
  }

  const owner = membre?.email || ''

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 16px', borderRadius: '100px', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', color: '#EC4899', fontSize: '0.7rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '2px' }}>📈 MARKETING 360</div>
        <h1 style={{ color: '#F0F2F5', fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0 0 8px' }}>
          Marketing <span style={{ background: 'linear-gradient(135deg, #EC4899, #F43F5E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>360°</span>
        </h1>
        <p style={{ color: '#8B95A5', fontSize: '0.9rem', margin: 0 }}>Calendrier éditorial · Génération IA · Campagnes · Analytics</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', background: '#0D1117', padding: '6px', borderRadius: '14px', border: '1px solid #1A2332', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, minWidth: '120px', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s', background: tab === t.id ? 'linear-gradient(135deg, #EC4899, #be185d)' : 'transparent', color: tab === t.id ? '#fff' : '#8B95A5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <IconSVG type={t.icon} size={16} color={tab === t.id ? '#fff' : '#8B95A5'} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'calendrier' && <Calendrier owner={owner} toast={toast} />}
      {tab === 'generateur' && <GenerateurIA />}
      {tab === 'campagnes' && <Campagnes owner={owner} toast={toast} />}
      {tab === 'analytics' && <Analytics owner={owner} />}
      {tab === 'autonomie' && <AutonomousMarketingExpert owner={owner} toast={toast} />}
      {tab === 'connecteurs' && <SocialConnectorExpert owner={owner} toast={toast} />}

      {/* Footer avec lien À propos */}
      <ToolInfoPanel
        toolName="Marketing 360"
        icon="📣"
        description="Suite complète de marketing digital : planification de contenu, calendrier éditorial, analytics et expert IA"
        benefits={[
          'Calendrier éditorial avec planification mensuelle',
          'Générateur de contenu IA pour publications',
          'Gestion des campagnes multi-plateformes',
          'Analytics et statistiques de performance',
          'Expert IA pour stratégie marketing',
          'Connecteurs sociaux (Facebook, Instagram, LinkedIn, Twitter, TikTok)',
          'Prévisualisation des publications',
          'Synchronisation avec CRM pour lead tracking',
        ]}
        howToUse={[
          'Accédez au calendrier pour planifier vos publications',
          'Utilisez le générateur IA pour créer du contenu',
          'Créez des campagnes avec objectifs et KPIs',
          'Consultez les analytics pour mesurer l\'impact',
          'Demandez conseil à l\'expert IA pour optimiser',
          'Connectez vos comptes sociaux pour publication directe',
        ]}
        tips={[
          'Planifiez vos contenus à l\'avance pour régularité',
          'Testez différents formats et heures de publication',
          'Analysez les performances pour ajuster votre stratégie',
          'L\'expert IA peut suggérer des idées de contenu',
          'Les données sont liées au CRM pour suivi des prospects',
        ]}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import './Recrutement.css'

const TAGS = ['Tous', 'CDI', 'CDD', 'Stage', 'Freelance', 'Expat', 'Remote', 'IT', 'Marketing', 'Finance', 'Santé', 'Ingénierie', 'Admin', 'Commercial']
const SOURCES = ['Toutes', 'ABAWI Jobs', 'Expat Dakar', 'Emploi Sénégal', 'Rekrute', 'Adecco', 'Michael Page', 'LinkedIn', 'HelloWork', 'Other']

export default function Recrutement() {
  const { isAdmin } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('Tous')
  const [source, setSource] = useState('Toutes')
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', message: '', cv: null })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchOffers()
  }, [isAdmin])

  async function fetchOffers() {
    setLoading(true)
    try {
      let q = supabase.from('job_offers').select('*').order('created_at', { ascending: false })
      if (!isAdmin) q = q.eq('active', true)
      const { data, error } = await q.limit(100)
      if (!error && data) setOffers(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const filtered = offers.filter(o => {
    const matchesSearch = !search || (o.title + ' ' + o.company + ' ' + o.location).toLowerCase().includes(search.toLowerCase())
    const matchesTag = tag === 'Tous' || (o.tags || []).includes(tag) || o.contract_type === tag
    const matchesSource = source === 'Toutes' || o.source === source
    return matchesSearch && matchesTag && matchesSource
  })

  async function handleApply(e) {
    e.preventDefault()
    if (!selectedOffer) return
    setSubmitting(true)
    try {
      // 1. Enregistrer dans Supabase
      const { error: dbErr } = await supabase.from('job_applications').insert({
        offer_id: selectedOffer.id,
        name: applyForm.name,
        email: applyForm.email,
        phone: applyForm.phone,
        message: applyForm.message,
        cv_url: applyForm.cv,
        created_at: new Date().toISOString()
      })
      if (dbErr) throw dbErr

      // 2. Transmettre via ABAWI au recruteur
      const res = await fetch('/.netlify/functions/notify-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: selectedOffer.id,
          candidate: {
            name: applyForm.name,
            email: applyForm.email,
            phone: applyForm.phone,
            message: applyForm.message,
            cv_url: applyForm.cv,
          },
        }),
      })
      if (!res.ok) throw new Error('Erreur transmission ABAWI')

      setToast({ type: 'success', text: '✅ Candidature envoyée — ABAWI la transmet au recruteur' })
      setSelectedOffer(null)
      setApplyForm({ name: '', email: '', phone: '', message: '', cv: null })
    } catch {
      setToast({ type: 'error', text: '❌ Erreur lors de l\'envoi' })
    }
    setSubmitting(false)
    setTimeout(() => setToast(null), 5000)
  }

  async function handleDeleteOffer(id) {
    if (!confirm('Supprimer cette offre ?')) return
    const { error } = await supabase.from('job_offers').delete().eq('id', id)
    if (error) {
      setToast({ type: 'error', text: '❌ Erreur suppression' })
    } else {
      setOffers(offers.filter(o => o.id !== id))
      setSelectedOffer(null)
      setToast({ type: 'success', text: '✅ Offre supprimée' })
    }
    setTimeout(() => setToast(null), 4000)
  }

  async function handleToggleActive(id, active) {
    const { error } = await supabase.from('job_offers').update({ active }).eq('id', id)
    if (error) {
      setToast({ type: 'error', text: '❌ Erreur mise à jour' })
    } else {
      setOffers(offers.map(o => o.id === id ? { ...o, active } : o))
      if (selectedOffer?.id === id) setSelectedOffer({ ...selectedOffer, active })
      setToast({ type: 'success', text: active ? '✅ Offre activée' : '✅ Offre désactivée' })
    }
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <main className="recrutement-page">
      <SEO
        title="Emploi & Recrutement Afrique — Offres CDI, CDD, Stage, Expat"
        description="Trouvez votre prochain emploi en Afrique de l'Ouest. Offres IT, marketing, finance, ingénierie. Expat Dakar, Sénégal, Côte d'Ivoire, Bénin."
        keywords="emploi Sénégal, recrutement Afrique, offre emploi Dakar, expat, CDI, stage, travail Afrique de l'Ouest"
      />
      <div className="recrutement-hero">
        <h1>💼 Emploi & Recrutement Afrique</h1>
        <p>Offres d'emploi sélectionnées en Afrique de l'Ouest — CDI, CDD, Stage, Freelance & Expat</p>
        <div className="recrutement-stats">
          <span>{offers.length} offres</span>
          <span>{new Set(offers.map(o => o.source)).size} sources</span>
          <span>{new Set(offers.map(o => o.location)).size} villes</span>
        </div>
      </div>

      <div className="recrutement-filters">
        <input
          className="recrutement-search"
          placeholder="🔍 Rechercher un poste, entreprise, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="recrutement-tags">
          {TAGS.map(t => (
            <button key={t} className={`recrutement-tag ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        {isAdmin && (
          <select className="recrutement-source" value={source} onChange={e => setSource(e.target.value)}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="recrutement-loading">Chargement des offres…</div>
      ) : filtered.length === 0 ? (
        <div className="recrutement-empty">Aucune offre trouvée. Essayez un autre filtre.</div>
      ) : (
        <div className="recrutement-grid">
          {filtered.map(o => (
            <div key={o.id} className="recrutement-card" onClick={() => setSelectedOffer(o)}>
              <div className="recrutement-card-header">
                <span className="recrutement-card-source">{o.source || 'ABAWI Jobs'}</span>
                <span className="recrutement-card-date">{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <h3 className="recrutement-card-title">{o.title}</h3>
              <div className="recrutement-card-meta">
                <span>🏢 {o.company || 'Confidentiel'}</span>
                <span>📍 {o.location || 'Non précisé'}</span>
                <span>📝 {o.contract_type || 'CDI'}</span>
                {o.salary && <span>💰 {o.salary}</span>}
              </div>
              <p className="recrutement-card-desc">{o.summary?.slice(0, 180)}…</p>
              {o.requirements && o.requirements.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Profil :</strong> {o.requirements[0]}
                  {o.requirements.length > 1 && '…'}
                </div>
              )}
              <div className="recrutement-card-tags">
                {(o.tags || []).map(t => <span key={t} className="recrutement-card-tag">{t}</span>)}
              </div>
              <div className="recrutement-card-actions">
                {o.external_url ? (
                  <a href={o.external_url} target="_blank" rel="noreferrer" className="recrutement-btn recrutement-btn--outline">Voir l'offre →</a>
                ) : (
                  <button className="recrutement-btn recrutement-btn--primary" onClick={e => { e.stopPropagation(); setSelectedOffer(o) }}>Postuler</button>
                )}
                {isAdmin && (
                  <button className="recrutement-btn recrutement-btn--danger" onClick={e => { e.stopPropagation(); handleDeleteOffer(o.id) }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOffer && (
        <div className="recrutement-modal" onClick={() => setSelectedOffer(null)}>
          <div className="recrutement-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="recrutement-modal-close" onClick={() => setSelectedOffer(null)}>×</button>
            <div className="recrutement-modal-header">
              <span className="recrutement-card-source">{selectedOffer.source}</span>
              <h2>{selectedOffer.title}</h2>
              <div className="recrutement-card-meta">
                <span>🏢 {selectedOffer.company}</span>
                <span>📍 {selectedOffer.location}</span>
                <span>📝 {selectedOffer.contract_type}</span>
                <span>💰 {selectedOffer.salary || 'Salaire selon profil'}</span>
              </div>
            </div>
            <div className="recrutement-modal-body">
              <p>{selectedOffer.description}</p>
              {selectedOffer.requirements && (
                <>
                  <h4>Profil recherché</h4>
                  <ul>{selectedOffer.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </>
              )}
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button className="recrutement-btn recrutement-btn--danger" onClick={() => handleDeleteOffer(selectedOffer.id)}>🗑️ Supprimer l'offre</button>
                <button className="recrutement-btn recrutement-btn--outline" onClick={() => handleToggleActive(selectedOffer.id, !selectedOffer.active)}>
                  {selectedOffer.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            )}
            <div className="recrutement-modal-apply">
              {selectedOffer.external_url ? (
                <a href={selectedOffer.external_url} target="_blank" rel="noreferrer" className="recrutement-btn recrutement-btn--primary">Postuler sur le site externe →</a>
              ) : (
                <form onSubmit={handleApply} className="recrutement-apply-form">
                  <h4>Envoyer ma candidature</h4>
                  <input required placeholder="Nom complet" value={applyForm.name} onChange={e => setApplyForm(p => ({ ...p, name: e.target.value }))} />
                  <input required type="email" placeholder="Email" value={applyForm.email} onChange={e => setApplyForm(p => ({ ...p, email: e.target.value }))} />
                  <input placeholder="Téléphone" value={applyForm.phone} onChange={e => setApplyForm(p => ({ ...p, phone: e.target.value }))} />
                  <textarea placeholder="Message de motivation (optionnel)" rows={3} value={applyForm.message} onChange={e => setApplyForm(p => ({ ...p, message: e.target.value }))} />
                  <button type="submit" className="recrutement-btn recrutement-btn--primary" disabled={submitting}>
                    {submitting ? 'Envoi…' : 'Envoyer ma candidature'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`recrutement-toast recrutement-toast--${toast.type}`}>{toast.text}</div>
      )}
    </main>
  )
}

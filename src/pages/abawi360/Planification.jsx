import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { run360Crud } from '../../lib/abawi360CrudClient'
import './Abawi360Tools.css'
import SyncStatus from '../../components/SyncStatus'
import ToolInfoPanel from '../../components/ToolInfoPanel'

const STATUTS_PROJET = { planifie: { label: 'Planifié', color: '#8B95A5' }, en_cours: { label: 'En cours', color: '#3B82F6' }, en_pause: { label: 'En pause', color: '#F0B429' }, termine: { label: 'Terminé', color: '#18A84A' }, annule: { label: 'Annulé', color: '#EF4444' } }
const PRIORITES = { basse: '#6B7280', normale: '#3B82F6', haute: '#F0B429', critique: '#EF4444' }
const STATUTS_TACHE = { todo: 'À faire', doing: 'En cours', done: 'Terminé' }

const EMPTY_PROJET = { nom: '', description: '', statut: 'planifie', priorite: 'normale', date_debut: '', date_fin: '', budget: 0, progression: 0, couleur: '#3B82F6' }
const EMPTY_TACHE = { titre: '', description: '', assignee: '', statut: 'todo', priorite: 'normale', date_echeance: '' }

export default function Planification() {
  const { membre } = useAuth()
  const [tab, setTab] = useState('projets')
  const [projets, setProjets] = useState([])
  const [taches, setTaches] = useState([])
  const [okrs, setOkrs] = useState([])
  const [selectedProjet, setSelectedProjet] = useState(null)
  const [showProjetModal, setShowProjetModal] = useState(false)
  const [showTacheModal, setShowTacheModal] = useState(false)
  const [editProjet, setEditProjet] = useState(null)
  const [editTache, setEditTache] = useState(null)
  const [formProjet, setFormProjet] = useState(EMPTY_PROJET)
  const [formTache, setFormTache] = useState(EMPTY_TACHE)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { if (membre) loadAll() }, [membre])

  async function loadAll() {
    setLoading(true)
    setLoadError('')
    try {
      const [p, t, o] = await Promise.all([
        run360Crud('list', 'projets', membre.email),
        run360Crud('list', 'taches', membre.email),
        run360Crud('list', 'okr_objectifs', membre.email),
      ])
      setProjets(p.data || [])
      setTaches(t.data || [])
      setOkrs(o.data || [])
    } catch (e) {
      setLoadError(e.message || 'Erreur réseau')
      setProjets([])
      setTaches([])
      setOkrs([])
    }
    setLastSyncAt(new Date())
    setLoading(false)
  }

  async function saveProjet() {
    if (!formProjet.nom) return
    const legacyPayload = { ...formProjet, updated_at: new Date().toISOString() }
    const sqlPayload = {
      titre: formProjet.nom,
      description: formProjet.description,
      statut: formProjet.statut,
      priorite: formProjet.priorite,
      date_echeance: formProjet.date_fin || null,
      progression: formProjet.progression || 0,
      updated_at: new Date().toISOString(),
    }
    if (editProjet) {
      try {
        await run360Crud('update', 'projets', membre.email, { id: editProjet.id, payload: legacyPayload })
      } catch {
        await run360Crud('update', 'projets', membre.email, { id: editProjet.id, payload: sqlPayload })
      }
    } else {
      try {
        await run360Crud('insert', 'projets', membre.email, { payload: { ...formProjet } })
      } catch {
        await run360Crud('insert', 'projets', membre.email, { payload: { ...sqlPayload } })
      }
    }
    setShowProjetModal(false); setEditProjet(null); setFormProjet(EMPTY_PROJET); loadAll()
  }

  async function saveTache() {
    if (!formTache.titre) return
    const projetId = selectedProjet?.id || (projets[0]?.id)
    const fixedStatus = formTache.statut === 'en_cours' || formTache.statut === 'review' ? 'doing' : formTache.statut
    if (editTache) await run360Crud('update', 'taches', membre.email, { id: editTache.id, payload: { ...formTache, statut: fixedStatus } })
    else await run360Crud('insert', 'taches', membre.email, { payload: { ...formTache, statut: fixedStatus, projet_id: projetId } })
    setShowTacheModal(false); setEditTache(null); setFormTache(EMPTY_TACHE); loadAll()
  }

  async function deleteProjet(id) {
    if (!window.confirm('Supprimer ce projet et ses tâches ?')) return
    await run360Crud('delete', 'taches', membre.email, { filters: { projet_id: id } })
    await run360Crud('delete', 'projets', membre.email, { id })
    loadAll()
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--t360-bg-input)', border: '1px solid var(--t360-border-input)', color: 'var(--t360-text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'Outfit,sans-serif' }
  const labelStyle = { fontSize: '0.72rem', color: 'var(--t360-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }

  const tabStyle = (t) => ({ padding: '8px 18px', borderRadius: '8px', background: tab === t ? 'var(--t360-accent-purple)' : 'var(--t360-bg-tag)', border: `1px solid ${tab === t ? 'var(--t360-accent-purple)' : 'var(--t360-border)'}`, color: tab === t ? 'var(--t360-text-inverse)' : 'var(--t360-text-secondary)', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: '0.82rem' })

  return (
    <div className="tools360-page" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="tools360-header">
        <div>
          <h1 className="tools360-title">📅 Planification</h1>
          <p className="tools360-subtitle">Projets, tâches, Gantt et OKR</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setEditProjet(null); setFormProjet(EMPTY_PROJET); setShowProjetModal(true) }} className="tools360-btn" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: '#fff' }}>+ Projet</button>
          {projets.length > 0 && <button onClick={() => { setEditTache(null); setFormTache(EMPTY_TACHE); setShowTacheModal(true) }} style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+ Tâche</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['projets', 'taches', 'gantt', 'okr'].map(t => <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{t === 'projets' ? '🗂 Projets' : t === 'taches' ? '✅ Tâches' : t === 'gantt' ? '📊 Gantt' : '🎯 OKR'}</button>)}
      </div>
      <SyncStatus
        lastSyncAt={lastSyncAt}
        onRetry={loadAll}
        errorMessage={loadError}
        accent="#8B5CF6"
        labels={{ errorPrefix: 'Chargement planification incomplet' }}
      />

      {loading && <div className="tools360-loading">Chargement...</div>}

      {!loading && tab === 'projets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {projets.length === 0 ? <div className="tools360-empty" style={{ gridColumn: '1/-1' }}>Aucun projet — Créez votre premier projet</div> :
           projets.map(p => (
            <div key={p.id} className="tools360-card tools360-card-hover" style={{ borderColor: p.couleur + '30', borderRadius: '16px', overflow: 'hidden', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = p.couleur}
              onMouseLeave={e => e.currentTarget.style.borderColor = p.couleur + '30'}
            >
              <div style={{ padding: '16px 20px', background: p.couleur + '10', borderBottom: `1px solid ${p.couleur}20` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--t360-text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>{p.nom || p.titre}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="tools360-badge" style={{ background: (STATUTS_PROJET[p.statut]?.color || '#8B95A5') + '20', color: STATUTS_PROJET[p.statut]?.color || '#8B95A5' }}>{STATUTS_PROJET[p.statut]?.label || p.statut}</span>
                      <span className="tools360-badge" style={{ background: (PRIORITES[p.priorite] || '#6B7280') + '20', color: PRIORITES[p.priorite] || '#6B7280' }}>{p.priorite}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setEditProjet(p); setFormProjet({ nom: p.nom || p.titre || '', description: p.description || '', statut: p.statut || 'planifie', priorite: p.priorite || 'normale', date_debut: p.date_debut || '', date_fin: p.date_fin || p.date_echeance || '', budget: p.budget || 0, progression: p.progression || 0, couleur: p.couleur || '#3B82F6' }); setShowProjetModal(true) }} className="tools360-btn-icon">✏️</button>
                    <button onClick={() => deleteProjet(p.id)} className="tools360-btn-icon" style={{ color: 'var(--t360-accent-danger)', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}>🗑️</button>
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                {p.description && <p style={{ color: 'var(--t360-text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>{p.description}</p>}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--t360-text-secondary)', marginBottom: '4px' }}>
                    <span>Progression</span><span style={{ color: p.couleur, fontWeight: 700 }}>{p.progression}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--t360-border)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: p.progression + '%', background: p.couleur, borderRadius: '100px', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--t360-text-muted)' }}>
                  {(p.date_fin || p.date_echeance) && <span>Fin : {new Date(p.date_fin || p.date_echeance).toLocaleDateString('fr-FR')}</span>}
                  {p.budget > 0 && <span style={{ color: '#F0B429' }}>Budget : {p.budget.toLocaleString('fr-FR')} F</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '4px' }}>
                  {taches.filter(t => t.projet_id === p.id).length} tâches · {taches.filter(t => t.projet_id === p.id && t.statut === 'done').length} terminées
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'taches' && (
        <div>
          {Object.entries(STATUTS_TACHE).map(([statut, label]) => {
            const cols = taches.filter(t => t.statut === statut)
            if (cols.length === 0) return null
            return (
              <div key={statut} style={{ marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--t360-text-secondary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label} ({cols.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cols.map(t => {
                    const proj = projets.find(p => p.id === t.projet_id)
                    return (
                      <div key={t.id} className="tools360-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--t360-text-primary)', fontSize: '0.85rem' }}>{t.titre}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--t360-text-secondary)' }}>{proj ? (proj.nom || proj.titre) : ''}{t.assignee ? ' · ' + t.assignee : ''}{t.date_echeance ? ' · ' + new Date(t.date_echeance).toLocaleDateString('fr-FR') : ''}</div>
                        </div>
                        <span className="tools360-badge" style={{ background: (PRIORITES[t.priorite] || '#6B7280') + '15', color: PRIORITES[t.priorite] || '#6B7280' }}>{t.priorite}</span>
                        <button onClick={async () => { await run360Crud('update', 'taches', membre.email, { id: t.id, payload: { statut: statut === 'done' ? 'todo' : 'done' } }); loadAll() }} className="tools360-btn-icon" style={{ background: statut === 'done' ? 'rgba(24,168,74,0.15)' : 'var(--t360-bg-tag)', border: 'none', color: statut === 'done' ? 'var(--t360-accent-success)' : 'var(--t360-text-muted)' }}>{statut === 'done' ? '✓' : '○'}</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {taches.length === 0 && <div className="tools360-empty">Aucune tâche</div>}
        </div>
      )}

      {!loading && tab === 'gantt' && (
        <div>
          {projets.length === 0 ? <div className="tools360-empty">Créez des projets avec des dates pour voir le Gantt</div> :
           projets.filter(p => p.date_debut && p.date_fin).map(p => {
            const start = new Date(p.date_debut)
            const end = new Date(p.date_fin)
            const total = end - start
            const elapsed = Math.max(0, Math.min(new Date() - start, total))
            const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0
            return (
              <div key={p.id} className="tools360-card" style={{ padding: '16px 20px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--t360-text-primary)', fontSize: '0.9rem' }}>{p.nom || p.titre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--t360-text-secondary)' }}>{start.toLocaleDateString('fr-FR')} → {end.toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ height: '20px', background: 'var(--t360-border)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: p.progression + '%', background: p.couleur + '80', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 8px)`, borderRight: '2px solid #fff' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--t360-text-muted)' }}>
                  <span>Planifié : {p.progression}%</span>
                  <span>Temps écoulé : {pct}%</span>
                </div>
              </div>
            )
          })}
          {projets.filter(p => !p.date_debut || !p.date_fin).length > 0 && <p style={{ color: 'var(--t360-text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: '12px' }}>Certains projets sans dates ne sont pas affichés</p>}
        </div>
      )}

      {!loading && tab === 'okr' && (
        <div className="tools360-empty">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
          <h3 style={{ color: 'var(--t360-text-primary)', fontWeight: 800, marginBottom: '8px' }}>OKR & Objectifs</h3>
          <p style={{ color: 'var(--t360-text-secondary)', marginBottom: '20px' }}>Définissez vos objectifs et résultats clés</p>
          <p style={{ color: 'var(--t360-text-muted)', fontSize: '0.82rem' }}>Fonctionnalité OKR disponible prochainement</p>
        </div>
      )}

      {/* Modal Projet */}
      {showProjetModal && (
        <div className="tools360-modal-overlay">
          <div className="tools360-modal" style={{ maxWidth: '560px' }}>
            <div className="tools360-modal-header">
              <h2 className="tools360-modal-title">{editProjet ? 'Modifier projet' : 'Nouveau projet'}</h2>
              <button onClick={() => setShowProjetModal(false)} className="tools360-modal-close">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={labelStyle}>Nom du projet *</label><input value={formProjet.nom} onChange={e => setFormProjet(p => ({ ...p, nom: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Description</label><textarea value={formProjet.description} onChange={e => setFormProjet(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Statut</label><select value={formProjet.statut} onChange={e => setFormProjet(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>{Object.entries(STATUTS_PROJET).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label style={labelStyle}>Priorité</label><select value={formProjet.priorite} onChange={e => setFormProjet(p => ({ ...p, priorite: e.target.value }))} style={inputStyle}>{Object.keys(PRIORITES).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div><label style={labelStyle}>Date début</label><input type="date" value={formProjet.date_debut} onChange={e => setFormProjet(p => ({ ...p, date_debut: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Date fin</label><input type="date" value={formProjet.date_fin} onChange={e => setFormProjet(p => ({ ...p, date_fin: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Budget (F)</label><input type="number" value={formProjet.budget} onChange={e => setFormProjet(p => ({ ...p, budget: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Couleur</label><input type="color" value={formProjet.couleur} onChange={e => setFormProjet(p => ({ ...p, couleur: e.target.value }))} style={{ ...inputStyle, height: '42px', padding: '4px 8px' }} /></div>
              </div>
              <div>
                <label style={labelStyle}>Progression : {formProjet.progression}%</label>
                <input type="range" min="0" max="100" value={formProjet.progression} onChange={e => setFormProjet(p => ({ ...p, progression: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: formProjet.couleur }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowProjetModal(false)} className="tools360-btn">Annuler</button>
              <button onClick={saveProjet} className="tools360-btn" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: '#fff' }}>{editProjet ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tâche */}
      {showTacheModal && (
        <div className="tools360-modal-overlay">
          <div className="tools360-modal" style={{ maxWidth: '480px' }}>
            <div className="tools360-modal-header">
              <h2 className="tools360-modal-title">{editTache ? 'Modifier tâche' : 'Nouvelle tâche'}</h2>
              <button onClick={() => setShowTacheModal(false)} className="tools360-modal-close">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={labelStyle}>Titre *</label><input value={formTache.titre} onChange={e => setFormTache(p => ({ ...p, titre: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Projet</label><select value={selectedProjet?.id || ''} onChange={e => setSelectedProjet(projets.find(p => p.id === e.target.value))} style={inputStyle}>{projets.map(p => <option key={p.id} value={p.id}>{p.nom || p.titre}</option>)}</select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Statut</label><select value={formTache.statut} onChange={e => setFormTache(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>{Object.entries(STATUTS_TACHE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label style={labelStyle}>Priorité</label><select value={formTache.priorite} onChange={e => setFormTache(p => ({ ...p, priorite: e.target.value }))} style={inputStyle}>{Object.keys(PRIORITES).map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                <div><label style={labelStyle}>Assigné à</label><input value={formTache.assignee} onChange={e => setFormTache(p => ({ ...p, assignee: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Échéance</label><input type="date" value={formTache.date_echeance} onChange={e => setFormTache(p => ({ ...p, date_echeance: e.target.value }))} style={inputStyle} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowTacheModal(false)} className="tools360-btn">Annuler</button>
              <button onClick={saveTache} className="tools360-btn" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff' }}>{editTache ? 'Enregistrer' : 'Créer tâche'}</button>
            </div>
          </div>
        </div>
      )}

      <ToolInfoPanel
        toolName="Planification 360"
        icon="📅"
        description="Outil complet de gestion de projets : tâches, calendrier, équipes et suivi de progression"
        benefits={[
          'Création et gestion de projets multi-équipes',
          'Gestion des tâches avec priorités et échéances',
          'Calendrier interactif avec vue mensuelle/hebdomadaire',
          'Attribution des tâches aux membres',
          'Suivi des statuts (À faire, En cours, Terminé, En retard)',
          'Dashboard avec statistiques de progression',
          'Historique des modifications',
          'Synchronisation avec les autres outils 360',
        ]}
        howToUse={[
          'Créez un nouveau projet avec titre et description',
          'Ajoutez des tâches avec dates d\'échéance et priorités',
          'Assignez les tâches aux membres de l\'équipe',
          'Suivez la progression via le calendrier ou la liste',
          'Mettez à jour les statuts des tâches au fur et à mesure',
          'Utilisez le dashboard pour voir les statistiques globales',
        ]}
        tips={[
          'Définissez des échéances réalistes pour chaque tâche',
          'Utilisez les priorités pour identifier les tâches urgentes',
          'Le calendrier permet de visualiser la charge de travail',
          'Les tâches en retard sont automatiquement signalées',
          'Intégrez vos projets avec le CRM pour suivre les clients',
        ]}
      />
    </div>
  )
}

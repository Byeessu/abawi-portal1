import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { SEED_COURSES } from '../../data/arkelCourses'

// ─── LocalStorage keys ─────────────────────────────────────────────────────
const PREFIX = 'arkelup_'
const KEYS = {
  cohortes: PREFIX + 'cohortes_v1',
  apprenants: PREFIX + 'apprenants_v1',
  formateurs: PREFIX + 'formateurs_v1',
  entreprises: PREFIX + 'entreprises_v1',
  paiements: PREFIX + 'paiements_v1',
  modules: PREFIX + 'modules_v1',
  presences: PREFIX + 'presences_v1',
  notes: PREFIX + 'notes_v1',
}

function load(key) { try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] } }
function save(key, d) { localStorage.setItem(key, JSON.stringify(d)) }
function uid(p='x') { return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6).toUpperCase()}` }
function dateFR(iso) { return new Date(iso).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) }
function todayISO() { return new Date().toISOString().slice(0,10) }
function nowISO() { return new Date().toISOString() }

const METIERS_FORMATION = ['Web & App', 'IA & Productivité', 'Bureautique', 'Infographie', 'Entrepreneuriat', 'Anglais Pro']
const STATUTS_APPRENANT = ['Inscrit', 'En formation', 'Stage', 'Diplômé', 'Abandon', 'Suspendu']
const STATUTS_PAIEMENT = ['Payé', 'Partiel', 'En attente', 'Impayé', 'Remboursé']

const DEFAULT_COHORTES = [
  { id: 'c1', nom: 'Cohorte Alpha', debut: '2026-06-01', fin: '2026-11-30', places: 30, prix: 120000, statut: 'Ouverte' },
  { id: 'c2', nom: 'Cohorte Beta', debut: '2026-09-01', fin: '2027-02-28', places: 30, prix: 120000, statut: 'Pré-inscription' },
]
const DEFAULT_MODULES = [
  { id: 'm1', titre: 'Création de Sites Web & Apps', duree: '5 semaines', cohorteId: '', ordre: 1 },
  { id: 'm2', titre: 'Maîtrise de l\'IA', duree: '4 semaines', cohorteId: '', ordre: 2 },
  { id: 'm3', titre: 'Bureautique Avancée', duree: '3 semaines', cohorteId: '', ordre: 3 },
  { id: 'm4', titre: 'Infographie & Design', duree: '4 semaines', cohorteId: '', ordre: 4 },
  { id: 'm5', titre: 'Entrepreneuriat', duree: '4 semaines', cohorteId: '', ordre: 5 },
  { id: 'm6', titre: 'Ateliers Terrain & Stage', duree: '4 semaines', cohorteId: '', ordre: 6 },
]

function init() {
  if (!localStorage.getItem(KEYS.cohortes)) save(KEYS.cohortes, DEFAULT_COHORTES)
  if (!localStorage.getItem(KEYS.modules)) save(KEYS.modules, DEFAULT_MODULES)
}

// ─── Small UI helpers ────────────────────────────────────────────────────────
function Card({ title, value, sub, color }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, minWidth:180 }}>
      <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:'1.6rem', fontWeight:900, color, margin:'8px 0' }}>{value}</div>
      {sub && <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{sub}</div>}
    </div>
  )
}

function Btn({ children, onClick, type='primary', disabled }) {
  const colors = {
    primary: { bg:'#3B82F6', c:'#fff' },
    success: { bg:'#10B981', c:'#fff' },
    danger: { bg:'#EF4444', c:'#fff' },
    ghost: { bg:'var(--bg-primary)', c:'var(--text-secondary)', border:'1px solid var(--border)' },
  }
  const s = colors[type] || colors.primary
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'8px 16px', borderRadius:10, border:s.border||'none', background:s.bg, color:s.c,
      fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit', opacity:disabled?0.5:1
    }}>{children}</button>
  )
}

function Input({ label, value, onChange, type='text', placeholder='', style={} }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', ...style }}>
      {label}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
        padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)',
        color:'var(--text-primary)', fontSize:'0.88rem', fontFamily:'inherit'
      }} />
    </label>
  )
}

function Select({ label, value, onChange, options, style={} }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', ...style }}>
      {label}
      <select value={value} onChange={onChange} style={{
        padding:'10px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)',
        color:'var(--text-primary)', fontSize:'0.88rem', fontFamily:'inherit'
      }}>
        {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Dashboard({ cohortes, apprenants, formateurs, entreprises, paiements, modules }) {
  const totalCA = paiements.filter(p=>p.statut==='Payé').reduce((s,p)=>s+(p.montant||0),0)
  const totalAttendu = apprenants.length * (cohortes[0]?.prix||120000)
  const tauxInsertion = (() => {
    const dipl = apprenants.filter(a=>a.statut==='Diplômé').length
    return apprenants.length ? Math.round((dipl/apprenants.length)*100) : 0
  })()
  const tauxCompletion = (() => {
    const fin = apprenants.filter(a=>a.statut==='Diplômé'||a.statut==='Stage').length
    return apprenants.length ? Math.round((fin/apprenants.length)*100) : 0
  })()

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>🏫 Arkel'Up Center — Dashboard</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:16, marginBottom:28 }}>
        <Card title="Cohortes" value={cohortes.length} sub="actives" color="#3B82F6" />
        <Card title="Apprenants" value={apprenants.length} sub="inscrits total" color="#8B5CF6" />
        <Card title="Formateurs" value={formateurs.length} sub="actifs" color="#10B981" />
        <Card title="Partenaires" value={entreprises.length} sub="entreprises" color="#F59E0B" />
        <Card title="CA Encaissé" value={`${(totalCA/1000).toFixed(0)}k FCFA`} sub={`sur ${(totalAttendu/1000).toFixed(0)}k attendus`} color="#18A84A" />
        <Card title="Taux Insertion" value={`${tauxInsertion}%`} sub="diplômés / inscrits" color="#F0B429" />
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>📈 Répartition des apprenants par cohorte</h3>
        {cohortes.length === 0 ? <p style={{color:'var(--text-secondary)'}}>Aucune cohorte.</p> :
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {cohortes.map(c => {
              const count = apprenants.filter(a=>a.cohorteId===c.id).length
              const pct = Math.round((count / (c.places||30)) * 100)
              return (
                <div key={c.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:4 }}>
                    <span style={{fontWeight:700, color:'var(--text-primary)'}}>{c.nom}</span>
                    <span style={{color:'var(--text-secondary)'}}>{count} / {c.places} places ({pct}%)</span>
                  </div>
                  <div style={{ height:8, background:'var(--bg-primary)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background: pct>=90?'#EF4444':pct>=70?'#F59E0B':'#10B981', borderRadius:4 }} />
                  </div>
                </div>
              )
            })}
          </div>
        }
      </div>
    </div>
  )
}

function CohortesManager({ cohortes, setCohortes }) {
  const [form, setForm] = useState({ nom:'', debut:'', fin:'', places:30, prix:120000, statut:'Pré-inscription' })
  const [editing, setEditing] = useState(null)

  function add() {
    if (!form.nom || !form.debut || !form.fin) return
    const newC = { id: uid('c'), ...form, places: Number(form.places), prix: Number(form.prix) }
    const updated = [...cohortes, newC]
    setCohortes(updated); save(KEYS.cohortes, updated)
    setForm({ nom:'', debut:'', fin:'', places:30, prix:120000, statut:'Pré-inscription' })
  }
  function update() {
    if (!editing) return
    const updated = cohortes.map(c => c.id===editing.id ? { ...editing, places:Number(editing.places), prix:Number(editing.prix) } : c)
    setCohortes(updated); save(KEYS.cohortes, updated); setEditing(null)
  }
  function remove(id) {
    if (!window.confirm('Supprimer cette cohorte ?')) return
    const updated = cohortes.filter(c=>c.id!==id)
    setCohortes(updated); save(KEYS.cohortes, updated)
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>📅 Cohortes</h2>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>{editing ? 'Modifier' : 'Nouvelle'} cohorte</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Input label="Nom" value={editing?editing.nom:form.nom} onChange={e => editing?setEditing({...editing,nom:e.target.value}):setForm({...form,nom:e.target.value})} />
          <Input label="Début" type="date" value={editing?editing.debut:form.debut} onChange={e => editing?setEditing({...editing,debut:e.target.value}):setForm({...form,debut:e.target.value})} />
          <Input label="Fin" type="date" value={editing?editing.fin:form.fin} onChange={e => editing?setEditing({...editing,fin:e.target.value}):setForm({...form,fin:e.target.value})} />
          <Input label="Places" type="number" value={editing?editing.places:form.places} onChange={e => editing?setEditing({...editing,places:e.target.value}):setForm({...form,places:e.target.value})} />
          <Input label="Prix (FCFA)" type="number" value={editing?editing.prix:form.prix} onChange={e => editing?setEditing({...editing,prix:e.target.value}):setForm({...form,prix:e.target.value})} />
          <Select label="Statut" value={editing?editing.statut:form.statut} onChange={e => editing?setEditing({...editing,statut:e.target.value}):setForm({...form,statut:e.target.value})}
            options={['Pré-inscription','Ouverte','En cours','Clôturée','Annulée']} />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {editing ? <>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </> : <Btn type="primary" onClick={add}>➕ Ajouter</Btn>}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {cohortes.map(c => (
          <div key={c.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{c.nom}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginTop:2 }}>{dateFR(c.debut)} → {dateFR(c.fin)} · {c.places} places · {c.prix.toLocaleString()} FCFA · <span style={{ color: c.statut==='En cours'?'#10B981':c.statut==='Clôturée'?'#8B5CF6':'#3B82F6', fontWeight:700 }}>{c.statut}</span></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn type="ghost" onClick={()=>setEditing(c)}>✏️</Btn>
              <Btn type="danger" onClick={()=>remove(c.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprenantsManager({ apprenants, setApprenants, cohortes, entreprises }) {
  const [form, setForm] = useState({ prenom:'', nom:'', email:'', telephone:'', cohorteId:'', statut:'Inscrit', pc:false })
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState({ text:'', cohorte:'', statut:'' })

  const filtered = useMemo(() => {
    return apprenants.filter(a => {
      const full = `${a.prenom} ${a.nom} ${a.email} ${a.telephone}`.toLowerCase()
      return (!filter.text || full.includes(filter.text.toLowerCase()))
        && (!filter.cohorte || a.cohorteId===filter.cohorte)
        && (!filter.statut || a.statut===filter.statut)
    })
  }, [apprenants, filter])

  function add() {
    if (!form.prenom || !form.nom) return
    const newA = { id: uid('a'), ...form, dateInscription: nowISO() }
    const updated = [...apprenants, newA]
    setApprenants(updated); save(KEYS.apprenants, updated)
    setForm({ prenom:'', nom:'', email:'', telephone:'', cohorteId:'', statut:'Inscrit', pc:false })
  }
  function update() {
    if (!editing) return
    const updated = apprenants.map(a => a.id===editing.id ? editing : a)
    setApprenants(updated); save(KEYS.apprenants, updated); setEditing(null)
  }
  function remove(id) {
    if (!window.confirm('Supprimer cet apprenant ?')) return
    const updated = apprenants.filter(a=>a.id!==id)
    setApprenants(updated); save(KEYS.apprenants, updated)
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>👨‍🎓 Apprenants</h2>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>{editing ? 'Modifier' : 'Nouvel'} apprenant</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Input label="Prénom" value={editing?editing.prenom:form.prenom} onChange={e => editing?setEditing({...editing,prenom:e.target.value}):setForm({...form,prenom:e.target.value})} />
          <Input label="Nom" value={editing?editing.nom:form.nom} onChange={e => editing?setEditing({...editing,nom:e.target.value}):setForm({...form,nom:e.target.value})} />
          <Input label="Email" value={editing?editing.email:form.email} onChange={e => editing?setEditing({...editing,email:e.target.value}):setForm({...form,email:e.target.value})} />
          <Input label="Téléphone" value={editing?editing.telephone:form.telephone} onChange={e => editing?setEditing({...editing,telephone:e.target.value}):setForm({...form,telephone:e.target.value})} />
          <Select label="Cohorte" value={editing?editing.cohorteId:form.cohorteId} onChange={e => editing?setEditing({...editing,cohorteId:e.target.value}):setForm({...form,cohorteId:e.target.value})}
            options={[{v:'',l:'-- Choisir --'}, ...cohortes.map(c=>({v:c.id,l:c.nom}))]} />
          <Select label="Statut" value={editing?editing.statut:form.statut} onChange={e => editing?setEditing({...editing,statut:e.target.value}):setForm({...form,statut:e.target.value})}
            options={STATUTS_APPRENANT} />
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, fontSize:'0.85rem', color:'var(--text-secondary)', cursor:'pointer' }}>
          <input type="checkbox" checked={editing?editing.pc:form.pc} onChange={e => editing?setEditing({...editing,pc:e.target.checked}):setForm({...form,pc:e.target.checked})} />
          Demande un PC (payable en 6 mois)
        </label>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {editing ? <>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </> : <Btn type="primary" onClick={add}>➕ Ajouter</Btn>}
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input placeholder="Rechercher..." value={filter.text} onChange={e=>setFilter({...filter,text:e.target.value})} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit', flex:1, minWidth:200 }} />
        <select value={filter.cohorte} onChange={e=>setFilter({...filter,cohorte:e.target.value})} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit' }}>
          <option value="">Toutes les cohortes</option>
          {cohortes.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filter.statut} onChange={e=>setFilter({...filter,statut:e.target.value})} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit' }}>
          <option value="">Tous les statuts</option>
          {STATUTS_APPRENANT.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(a => (
          <div key={a.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.8rem' }}>{a.prenom?.[0]}{a.nom?.[0]}</div>
              <div>
                <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{a.prenom} {a.nom}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{a.email} · {a.telephone} · {cohortes.find(c=>c.id===a.cohorteId)?.nom || 'Aucune'} · {dateFR(a.dateInscription)}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ padding:'4px 10px', borderRadius:20, background: a.statut==='Diplômé'?'rgba(16,185,129,0.15)':a.statut==='Abandon'?'rgba(239,68,68,0.15)':'rgba(59,130,246,0.15)', color: a.statut==='Diplômé'?'#10B981':a.statut==='Abandon'?'#EF4444':'#3B82F6', fontWeight:700, fontSize:'0.75rem' }}>{a.statut}</span>
              {a.pc && <span style={{ fontSize:'0.75rem' }}>💻</span>}
              <Btn type="ghost" onClick={()=>setEditing(a)}>✏️</Btn>
              <Btn type="danger" onClick={()=>remove(a.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormateursManager({ formateurs, setFormateurs }) {
  const [form, setForm] = useState({ prenom:'', nom:'', email:'', telephone:'', specialite:'', tarif:50000, statut:'Actif' })
  const [editing, setEditing] = useState(null)

  function add() {
    if (!form.prenom || !form.nom) return
    const newF = { id: uid('f'), ...form, tarif: Number(form.tarif) }
    const updated = [...formateurs, newF]
    setFormateurs(updated); save(KEYS.formateurs, updated)
    setForm({ prenom:'', nom:'', email:'', telephone:'', specialite:'', tarif:50000, statut:'Actif' })
  }
  function update() {
    if (!editing) return
    const updated = formateurs.map(f => f.id===editing.id ? { ...editing, tarif:Number(editing.tarif) } : f)
    setFormateurs(updated); save(KEYS.formateurs, updated); setEditing(null)
  }
  function remove(id) {
    if (!window.confirm('Supprimer ce formateur ?')) return
    const updated = formateurs.filter(f=>f.id!==id)
    setFormateurs(updated); save(KEYS.formateurs, updated)
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>👨‍🏫 Formateurs</h2>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>{editing ? 'Modifier' : 'Nouveau'} formateur</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Input label="Prénom" value={editing?editing.prenom:form.prenom} onChange={e => editing?setEditing({...editing,prenom:e.target.value}):setForm({...form,prenom:e.target.value})} />
          <Input label="Nom" value={editing?editing.nom:form.nom} onChange={e => editing?setEditing({...editing,nom:e.target.value}):setForm({...form,nom:e.target.value})} />
          <Input label="Email" value={editing?editing.email:form.email} onChange={e => editing?setEditing({...editing,email:e.target.value}):setForm({...form,email:e.target.value})} />
          <Input label="Téléphone" value={editing?editing.telephone:form.telephone} onChange={e => editing?setEditing({...editing,telephone:e.target.value}):setForm({...form,telephone:e.target.value})} />
          <Select label="Spécialité" value={editing?editing.specialite:form.specialite} onChange={e => editing?setEditing({...editing,specialite:e.target.value}):setForm({...form,specialite:e.target.value})}
            options={['',...METIERS_FORMATION]} />
          <Input label="Tarif/mois (FCFA)" type="number" value={editing?editing.tarif:form.tarif} onChange={e => editing?setEditing({...editing,tarif:e.target.value}):setForm({...form,tarif:e.target.value})} />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {editing ? <>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </> : <Btn type="primary" onClick={add}>➕ Ajouter</Btn>}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {formateurs.map(f => (
          <div key={f.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{f.prenom} {f.nom}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{f.specialite} · {f.tarif?.toLocaleString()} FCFA/mois · {f.email}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn type="ghost" onClick={()=>setEditing(f)}>✏️</Btn>
              <Btn type="danger" onClick={()=>remove(f.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EntreprisesManager({ entreprises, setEntreprises }) {
  const [form, setForm] = useState({ nom:'', secteur:'', contact:'', email:'', telephone:'', placesStage:2, statut:'Actif' })
  const [editing, setEditing] = useState(null)

  function add() {
    if (!form.nom) return
    const newE = { id: uid('e'), ...form, placesStage: Number(form.placesStage) }
    const updated = [...entreprises, newE]
    setEntreprises(updated); save(KEYS.entreprises, updated)
    setForm({ nom:'', secteur:'', contact:'', email:'', telephone:'', placesStage:2, statut:'Actif' })
  }
  function update() {
    if (!editing) return
    const updated = entreprises.map(e => e.id===editing.id ? { ...editing, placesStage:Number(editing.placesStage) } : e)
    setEntreprises(updated); save(KEYS.entreprises, updated); setEditing(null)
  }
  function remove(id) {
    if (!window.confirm('Supprimer ce partenaire ?')) return
    const updated = entreprises.filter(e=>e.id!==id)
    setEntreprises(updated); save(KEYS.entreprises, updated)
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>🏢 Partenaires Entreprises</h2>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>{editing ? 'Modifier' : 'Nouveau'} partenaire</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Input label="Nom entreprise" value={editing?editing.nom:form.nom} onChange={e => editing?setEditing({...editing,nom:e.target.value}):setForm({...form,nom:e.target.value})} />
          <Input label="Secteur" value={editing?editing.secteur:form.secteur} onChange={e => editing?setEditing({...editing,secteur:e.target.value}):setForm({...form,secteur:e.target.value})} />
          <Input label="Contact" value={editing?editing.contact:form.contact} onChange={e => editing?setEditing({...editing,contact:e.target.value}):setForm({...form,contact:e.target.value})} />
          <Input label="Email" value={editing?editing.email:form.email} onChange={e => editing?setEditing({...editing,email:e.target.value}):setForm({...form,email:e.target.value})} />
          <Input label="Téléphone" value={editing?editing.telephone:form.telephone} onChange={e => editing?setEditing({...editing,telephone:e.target.value}):setForm({...form,telephone:e.target.value})} />
          <Input label="Places de stage" type="number" value={editing?editing.placesStage:form.placesStage} onChange={e => editing?setEditing({...editing,placesStage:e.target.value}):setForm({...form,placesStage:e.target.value})} />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {editing ? <>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </> : <Btn type="primary" onClick={add}>➕ Ajouter</Btn>}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {entreprises.map(e => (
          <div key={e.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{e.nom}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{e.secteur} · {e.contact} · {e.telephone} · {e.placesStage} place{e.placesStage>1?'s':''} stage</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn type="ghost" onClick={()=>setEditing(e)}>✏️</Btn>
              <Btn type="danger" onClick={()=>remove(e.id)}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancesManager({ apprenants, cohortes, paiements, setPaiements }) {
  const [form, setForm] = useState({ apprenantId:'', montant:'', date:todayISO(), mode:'Espèces', statut:'Payé', note:'' })
  const [editing, setEditing] = useState(null)

  const soldeParApprenant = useMemo(() => {
    const map = {}
    apprenants.forEach(a => {
      const prix = cohortes.find(c=>c.id===a.cohorteId)?.prix || 120000
      const paye = paiements.filter(p=>p.apprenantId===a.id && p.statut==='Payé').reduce((s,p)=>s+p.montant,0)
      map[a.id] = { prix, paye, reste: prix - paye }
    })
    return map
  }, [apprenants, cohortes, paiements])

  function add() {
    if (!form.apprenantId || !form.montant) return
    const newP = { id: uid('p'), ...form, montant: Number(form.montant) }
    const updated = [...paiements, newP]
    setPaiements(updated); save(KEYS.paiements, updated)
    setForm({ apprenantId:'', montant:'', date:todayISO(), mode:'Espèces', statut:'Payé', note:'' })
  }
  function update() {
    if (!editing) return
    const updated = paiements.map(p => p.id===editing.id ? { ...editing, montant:Number(editing.montant) } : p)
    setPaiements(updated); save(KEYS.paiements, updated); setEditing(null)
  }
  function remove(id) {
    if (!window.confirm('Supprimer ce paiement ?')) return
    const updated = paiements.filter(p=>p.id!==id)
    setPaiements(updated); save(KEYS.paiements, updated)
  }

  const totalPaye = paiements.filter(p=>p.statut==='Payé').reduce((s,p)=>s+p.montant,0)
  const totalAttendu = apprenants.reduce((s,a)=>s+(soldeParApprenant[a.id]?.prix||0),0)
  const totalRestant = totalAttendu - totalPaye

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>💰 Finances</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        <Card title="Total Payé" value={`${(totalPaye/1000).toFixed(0)}k FCFA`} color="#10B981" />
        <Card title="Restant dû" value={`${(totalRestant/1000).toFixed(0)}k FCFA`} color="#EF4444" />
        <Card title="Taux encaissement" value={`${totalAttendu?Math.round((totalPaye/totalAttendu)*100):0}%`} color="#3B82F6" />
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>{editing ? 'Modifier' : 'Nouveau'} paiement</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Select label="Apprenant" value={editing?editing.apprenantId:form.apprenantId} onChange={e => editing?setEditing({...editing,apprenantId:e.target.value}):setForm({...form,apprenantId:e.target.value})}
            options={[{v:'',l:'-- Choisir --'}, ...apprenants.map(a=>({v:a.id,l:`${a.prenom} ${a.nom}`}))]} />
          <Input label="Montant (FCFA)" type="number" value={editing?editing.montant:form.montant} onChange={e => editing?setEditing({...editing,montant:e.target.value}):setForm({...form,montant:e.target.value})} />
          <Input label="Date" type="date" value={editing?editing.date:form.date} onChange={e => editing?setEditing({...editing,date:e.target.value}):setForm({...form,date:e.target.value})} />
          <Select label="Mode" value={editing?editing.mode:form.mode} onChange={e => editing?setEditing({...editing,mode:e.target.value}):setForm({...form,mode:e.target.value})}
            options={['Espèces','Wave','Orange Money','Free Money','Virement','Chèque']} />
          <Select label="Statut" value={editing?editing.statut:form.statut} onChange={e => editing?setEditing({...editing,statut:e.target.value}):setForm({...form,statut:e.target.value})}
            options={STATUTS_PAIEMENT} />
          <Input label="Note" value={editing?editing.note:form.note} onChange={e => editing?setEditing({...editing,note:e.target.value}):setForm({...form,note:e.target.value})} />
        </div>
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          {editing ? <>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </> : <Btn type="primary" onClick={add}>➕ Ajouter</Btn>}
        </div>
      </div>

      <h3 style={{ margin:'0 0 12px', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>Historique des paiements</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[...paiements].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(p => {
          const a = apprenants.find(x=>x.id===p.apprenantId)
          return (
            <div key={p.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{a ? `${a.prenom} ${a.nom}` : 'Inconnu'}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{p.montant?.toLocaleString()} FCFA · {p.mode} · {dateFR(p.date)} · {p.note}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ padding:'4px 10px', borderRadius:20, background: p.statut==='Payé'?'rgba(16,185,129,0.15)':p.statut==='Impayé'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color: p.statut==='Payé'?'#10B981':p.statut==='Impayé'?'#EF4444':'#F59E0B', fontWeight:700, fontSize:'0.75rem' }}>{p.statut}</span>
                <Btn type="ghost" onClick={()=>setEditing(p)}>✏️</Btn>
                <Btn type="danger" onClick={()=>remove(p.id)}>🗑️</Btn>
              </div>
            </div>
          )
        })}
      </div>

      <h3 style={{ margin:'24px 0 12px', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>Solde par apprenant</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {apprenants.map(a => {
          const s = soldeParApprenant[a.id] || { prix:0, paye:0, reste:0 }
          const pct = s.prix ? Math.round((s.paye/s.prix)*100) : 0
          return (
            <div key={a.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:4 }}>
                <span style={{fontWeight:700}}>{a.prenom} {a.nom}</span>
                <span style={{color:'var(--text-secondary)'}}>{s.paye.toLocaleString()} / {s.prix.toLocaleString()} FCFA ({pct}%)</span>
              </div>
              <div style={{ height:6, background:'var(--bg-primary)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background: pct>=100?'#10B981':pct>=50?'#F59E0B':'#EF4444', borderRadius:3 }} />
              </div>
              {s.reste > 0 && <div style={{ fontSize:'0.75rem', color:'#EF4444', marginTop:4 }}>Reste : {s.reste.toLocaleString()} FCFA</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OnlineEnrollmentsManager() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCourse, setFilterCourse] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('arkelup_enrollments')
      .select('id, course_id, user_id, status, requested_at, approved_at, notes, progress_pct, membres:user_id(prenom,nom,email,telephone)')
      .order('requested_at', { ascending: false })
    if (error) { console.error('[ArkelUpPanel] load error:', error); setLoading(false); return }
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status, note = '') {
    const { error } = await supabase
      .from('arkelup_enrollments')
      .update({ status, approved_at: status === 'approved' ? new Date().toISOString() : null, notes: note })
      .eq('id', id)
    if (error) { alert('Erreur : ' + error.message); return }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, approved_at: status === 'approved' ? new Date().toISOString() : r.approved_at, notes: note || r.notes } : r))
  }

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (filterCourse && r.course_id !== filterCourse) return false
      return true
    })
  }, [requests, filterStatus, filterCourse])

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>🎓 Inscriptions aux cours en ligne</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        <Card title="En attente" value={stats.pending} color="#F59E0B" />
        <Card title="Approuvées" value={stats.approved} color="#10B981" />
        <Card title="Rejetées" value={stats.rejected} color="#EF4444" />
        <Card title="Total" value={requests.length} color="#3B82F6" />
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit' }}>
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvée</option>
          <option value="rejected">Rejetée</option>
        </select>
        <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit' }}>
          <option value="">Tous les cours</option>
          {SEED_COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Btn type="ghost" onClick={load}>🔄 Actualiser</Btn>
      </div>

      {loading ? (
        <div style={{ color:'var(--text-secondary)', padding:20 }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color:'var(--text-secondary)', padding:20 }}>Aucune demande trouvée.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(r => {
            const course = SEED_COURSES.find(c => c.id === r.course_id)
            const m = r.membres || {}
            const isPending = r.status === 'pending'
            return (
              <div key={r.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:260 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.85rem', flexShrink:0 }}>{m.prenom?.[0]}{m.nom?.[0]}</div>
                  <div>
                    <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{m.prenom} {m.nom}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{m.email} · {m.telephone}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:2 }}>
                      Cours : <strong style={{ color:'var(--text-primary)' }}>{course?.title || r.course_id}</strong> · {new Date(r.requested_at).toLocaleDateString('fr-FR')} · Progression {r.progress_pct}%
                    </div>
                    {r.notes && <div style={{ fontSize:'0.72rem', color:'#F59E0B', marginTop:2 }}>Note : {r.notes}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ padding:'4px 12px', borderRadius:20, background: r.status==='approved'?'rgba(16,185,129,0.15)':r.status==='rejected'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color: r.status==='approved'?'#10B981':r.status==='rejected'?'#EF4444':'#F59E0B', fontWeight:700, fontSize:'0.78rem', textTransform:'capitalize' }}>
                    {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </span>
                  {isPending && (
                    <>
                      <Btn type="success" onClick={() => updateStatus(r.id, 'approved')}>✅ Approuver</Btn>
                      <Btn type="danger" onClick={() => {
                        const note = window.prompt('Raison du rejet (optionnel) :') || ''
                        updateStatus(r.id, 'rejected', note)
                      }}>❌ Rejeter</Btn>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <Btn type="ghost" onClick={() => {
                      const note = window.prompt('Note admin (optionnel) :') || ''
                      updateStatus(r.id, 'rejected', note)
                    }}>Annuler l'accès</Btn>
                  )}
                  {r.status === 'rejected' && (
                    <Btn type="primary" onClick={() => updateStatus(r.id, 'approved')}>Ré-approuver</Btn>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ModulesManager({ modules, setModules, cohortes }) {
  const [editing, setEditing] = useState(null)
  const [dragged, setDragged] = useState(null)

  function update() {
    if (!editing) return
    const updated = modules.map(m => m.id===editing.id ? editing : m)
    setModules(updated); save(KEYS.modules, updated); setEditing(null)
  }
  function reorder(fromId, toIndex) {
    const fromIndex = modules.findIndex(m=>m.id===fromId)
    if (fromIndex<0) return
    const newArr = [...modules]
    const [item] = newArr.splice(fromIndex,1)
    newArr.splice(toIndex,0,item)
    const reordered = newArr.map((m,i)=>({...m,ordre:i+1}))
    setModules(reordered); save(KEYS.modules, reordered)
  }

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>📚 Modules Pédagogiques</h2>
      <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:16 }}>Glissez-déposez pour réorganiser l'ordre des modules.</p>

      {editing && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>Modifier module</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
            <Input label="Titre" value={editing.titre} onChange={e=>setEditing({...editing,titre:e.target.value})} />
            <Input label="Durée" value={editing.duree} onChange={e=>setEditing({...editing,duree:e.target.value})} />
            <Select label="Cohorte assignée" value={editing.cohorteId||''} onChange={e=>setEditing({...editing,cohorteId:e.target.value})}
              options={[{v:'',l:'Toutes'},...cohortes.map(c=>({v:c.id,l:c.nom}))]} />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Btn type="primary" onClick={update}>💾 Enregistrer</Btn>
            <Btn type="ghost" onClick={()=>setEditing(null)}>Annuler</Btn>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[...modules].sort((a,b)=>a.ordre-b.ordre).map((m,i) => (
          <div key={m.id} draggable onDragStart={()=>setDragged(m.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>{ reorder(dragged,i); setDragged(null) }}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:14, display:'flex', alignItems:'center', gap:14, cursor:'grab' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'0.8rem', flexShrink:0 }}>{m.ordre}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:'var(--text-primary)' }}>{m.titre}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{m.duree} · {cohortes.find(c=>c.id===m.cohorteId)?.nom || 'Toutes les cohortes'}</div>
            </div>
            <Btn type="ghost" onClick={()=>setEditing(m)}>✏️</Btn>
          </div>
        ))}
      </div>
    </div>
  )
}

const STORAGE_BUCKET = 'arkelup-materials'

function formatBytes(b) {
  if (!b || b === 0) return '0 B'
  const k = 1024
  const sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function CourseMaterialsManager() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [courseFilter, setCourseFilter] = useState('')
  const [title, setTitle] = useState('')
  const fileRef = useRef(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('arkelup_course_materials')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) console.error('[Materials] load error:', error)
    setMaterials(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function upload(e) {
    const file = e.target.files?.[0]
    if (!file || !courseFilter || !title.trim()) { alert('Choisir un cours, un titre et un fichier PDF'); return }
    if (!file.name.toLowerCase().endsWith('.pdf')) { alert('Seuls les fichiers PDF sont acceptés'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${courseFilter}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (upErr) {
      if (upErr.message?.includes('Bucket') || upErr.message?.includes('not found')) {
        alert(`Le bucket "${STORAGE_BUCKET}" n'existe pas. Créez-le dans Supabase Storage.`)
      } else {
        alert('Erreur upload : ' + upErr.message)
      }
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

    // Insert into DB
    const { error: dbErr } = await supabase.from('arkelup_course_materials').insert({
      course_id: courseFilter,
      title: title.trim(),
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type || 'application/pdf',
    })

    if (dbErr) { alert('Erreur DB : ' + dbErr.message); setUploading(false); return }

    setTitle('')
    if (fileRef.current) fileRef.current.value = ''
    await load()
    setUploading(false)
  }

  async function remove(id, fileUrl) {
    if (!window.confirm('Supprimer ce support ?')) return
    // Extract path from URL
    const urlObj = new URL(fileUrl)
    const pathParts = urlObj.pathname.split('/')
    const objectPath = pathParts.slice(pathParts.indexOf(STORAGE_BUCKET) + 1).join('/')
    if (objectPath) await supabase.storage.from(STORAGE_BUCKET).remove([decodeURIComponent(objectPath)])
    const { error } = await supabase.from('arkelup_course_materials').delete().eq('id', id)
    if (error) alert('Erreur suppression : ' + error.message)
    else setMaterials(prev => prev.filter(m => m.id !== id))
  }

  const filtered = courseFilter ? materials.filter(m => m.course_id === courseFilter) : materials

  const byCourse = useMemo(() => {
    const map = {}
    SEED_COURSES.forEach(c => { map[c.id] = [] })
    filtered.forEach(m => {
      if (!map[m.course_id]) map[m.course_id] = []
      map[m.course_id].push(m)
    })
    return map
  }, [filtered])

  return (
    <div>
      <h2 style={{ margin:'0 0 20px', fontSize:'1.2rem', fontWeight:900, color:'var(--text-primary)' }}>📄 Supports de cours (PDF)</h2>

      {/* Upload zone */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:800 }}>Uploader un nouveau support</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
          <Select label="Cours" value={courseFilter} onChange={e=>setCourseFilter(e.target.value)}
            options={[{v:'',l:'-- Choisir un cours --'}, ...SEED_COURSES.map(c=>({v:c.id,l:c.title}))]} />
          <Input label="Titre du support" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Support PDF - Module 1" />
          <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)' }}>
            Fichier PDF
            <input ref={fileRef} type="file" accept=".pdf" onChange={upload} disabled={uploading}
              style={{ padding:'8px 0', color:'var(--text-primary)', fontFamily:'inherit', fontSize:'0.85rem' }} />
          </label>
        </div>
        {uploading && <div style={{ marginTop:10, color:'#F0B429', fontSize:'0.82rem' }}>⏳ Upload en cours...</div>}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <select value={courseFilter} onChange={e=>setCourseFilter(e.target.value)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'inherit' }}>
          <option value="">Tous les cours</option>
          {SEED_COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Btn type="ghost" onClick={load}>🔄 Actualiser</Btn>
      </div>

      {/* List by course */}
      {loading ? (
        <div style={{ color:'var(--text-secondary)', padding:20 }}>Chargement...</div>
      ) : Object.keys(byCourse).length === 0 ? (
        <div style={{ color:'var(--text-secondary)', padding:20 }}>Aucun support uploadé.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {SEED_COURSES.filter(c => byCourse[c.id]?.length > 0).map(c => (
            <div key={c.id}>
              <div style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#F0B429' }} />
                {c.title}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {byCourse[c.id].map(m => (
                  <div key={m.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:200 }}>
                      <span style={{ fontSize:'1.4rem' }}>📄</span>
                      <div>
                        <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.85rem' }}>{m.title}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{m.file_name} · {formatBytes(m.file_size)} · {new Date(m.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={m.file_url} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                        <Btn type="primary">👁 Voir</Btn>
                      </a>
                      <a href={m.file_url} download style={{ textDecoration:'none' }}>
                        <Btn type="ghost">⬇ Télécharger</Btn>
                      </a>
                      <Btn type="danger" onClick={() => remove(m.id, m.file_url)}>🗑 Supprimer</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ────────────────────────────────────────────────────────────
const ARKEL_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'cohortes', label: 'Cohortes', icon: '📅' },
  { id: 'apprenants', label: 'Apprenants', icon: '👨‍🎓' },
  { id: 'formateurs', label: 'Formateurs', icon: '👨‍🏫' },
  { id: 'entreprises', label: 'Entreprises', icon: '🏢' },
  { id: 'finances', label: 'Finances', icon: '💰' },
  { id: 'modules', label: 'Modules', icon: '📚' },
  { id: 'online', label: 'Inscriptions Cours', icon: '🎓' },
  { id: 'materials', label: 'Supports PDF', icon: '📄' },
]

export default function ArkelUpPanel() {
  const [tab, setTab] = useState('dashboard')
  const [cohortes, setCohortes] = useState(() => load(KEYS.cohortes))
  const [apprenants, setApprenants] = useState(() => load(KEYS.apprenants))
  const [formateurs, setFormateurs] = useState(() => load(KEYS.formateurs))
  const [entreprises, setEntreprises] = useState(() => load(KEYS.entreprises))
  const [paiements, setPaiements] = useState(() => load(KEYS.paiements))
  const [modules, setModules] = useState(() => load(KEYS.modules))

  useEffect(() => { init() }, [])

  const panels = {
    dashboard: <Dashboard {...{ cohortes, apprenants, formateurs, entreprises, paiements, modules }} />,
    cohortes: <CohortesManager {...{ cohortes, setCohortes }} />,
    apprenants: <ApprenantsManager {...{ apprenants, setApprenants, cohortes, entreprises }} />,
    formateurs: <FormateursManager {...{ formateurs, setFormateurs }} />,
    entreprises: <EntreprisesManager {...{ entreprises, setEntreprises }} />,
    finances: <FinancesManager {...{ apprenants, cohortes, paiements, setPaiements }} />,
    modules: <ModulesManager {...{ modules, setModules, cohortes }} />,
    online: <OnlineEnrollmentsManager />,
    materials: <CourseMaterialsManager />,
  }

  return (
    <div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:16 }}>
        {ARKEL_TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 14px', borderRadius:10, border:'1px solid var(--border)',
            background: tab===t.id ? 'linear-gradient(135deg,#F0B429,#E5A820)' : 'var(--bg-card)',
            color: tab===t.id ? '#0c0a06' : 'var(--text-secondary)',
            fontWeight: tab===t.id ? 800 : 600, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:6
          }}>{t.icon} {t.label}</button>
        ))}
      </div>
      {panels[tab]}
    </div>
  )
}

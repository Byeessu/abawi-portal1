import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PharmacyGuardReport({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name:'', address:'', phone:'', city:'', zone:'', guardDate:'', startsAt:'20:00', endsAt:'08:00', notes:'', photo:null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cities = ['Dakar','Thiès','Saint-Louis','Kaolack','Ziguinchor','Tambacounda','Diourbel','Louga','Fatick','Kolda','Matam','Kédougou','Sédhiou','Kaffrine','Dagana']

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Connectez-vous pour signaler une garde.')
      let photoUrl = ''
      if (form.photo) {
        const fileName = `${Date.now()}-${form.photo.name}`
        const { error: upErr } = await supabase.storage.from('pharmacy-guard-media').upload(fileName, form.photo)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('pharmacy-guard-media').getPublicUrl(fileName)
        photoUrl = data.publicUrl
      }
      const { error: insErr } = await supabase.from('pharmacy_guard_shifts').insert({
        pharmacy_name: form.name, address: form.address, phone: form.phone,
        city: form.city, zone: form.zone, guard_date: form.guardDate,
        starts_at: form.startsAt, ends_at: form.endsAt, notes: form.notes,
        photo_url: photoUrl, reported_by: user.id, reported_name: user.user_metadata?.prenom || user.email
      })
      if (insErr) throw insErr
      onSuccess?.()
      onClose()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit} style={{background:'#fff',borderRadius:16,padding:24,maxWidth:480,width:'100%',maxHeight:'90vh',overflow:'auto',boxShadow:'0 24px 48px rgba(0,0,0,0.25)'}}>
        <h3 style={{margin:'0 0 16px',fontSize:'1.15rem',fontWeight:800}}>🚨 Signaler une pharmacie de garde</h3>
        {error && <div style={{padding:10,borderRadius:8,background:'rgba(239,68,68,0.1)',color:'#B91C1C',fontSize:'0.82rem',marginBottom:12}}>{error}</div>}
        <input required placeholder="Nom de la pharmacie" style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        <input placeholder="Adresse" style={inputStyle} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} />
        <input placeholder="Téléphone" style={inputStyle} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
        <select required style={inputStyle} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}>
          <option value="">Choisir une ville</option>
          {cities.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Zone / Quartier" style={inputStyle} value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} />
        <label style={labelStyle}>Date de garde</label>
        <input required type="date" style={inputStyle} value={form.guardDate} onChange={e=>setForm(f=>({...f,guardDate:e.target.value}))} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div><label style={labelStyle}>Début</label><input type="time" style={inputStyle} value={form.startsAt} onChange={e=>setForm(f=>({...f,startsAt:e.target.value}))} /></div>
          <div><label style={labelStyle}>Fin</label><input type="time" style={inputStyle} value={form.endsAt} onChange={e=>setForm(f=>({...f,endsAt:e.target.value}))} /></div>
        </div>
        <textarea placeholder="Notes (optionnel)" rows={3} style={{...inputStyle,resize:'vertical'}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        <label style={labelStyle}>Photo du panneau de garde (optionnel)</label>
        <input type="file" accept="image/*" style={inputStyle} onChange={e=>setForm(f=>({...f,photo:e.target.files[0]}))} />
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button type="submit" disabled={loading} style={{flex:1,padding:'10px 16px',borderRadius:10,background:'#10B981',color:'#fff',border:'none',fontWeight:700,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Envoi...':'✅ Signaler la garde'}</button>
          <button type="button" onClick={onClose} style={{padding:'10px 16px',borderRadius:10,background:'#F3F4F6',color:'#374151',border:'none',fontWeight:600,cursor:'pointer'}}>Annuler</button>
        </div>
      </form>
    </div>
  )
}

const inputStyle = { width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #E5E7EB',fontSize:'0.9rem',marginBottom:10,background:'#FAFAFA' }
const labelStyle = { fontSize:'0.75rem',color:'#6B7280',fontWeight:600,marginBottom:4,display:'block' }

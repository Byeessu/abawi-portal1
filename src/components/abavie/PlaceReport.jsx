import { useState } from 'react';

export default function PlaceReport({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSending(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      onSuccess?.();
    } finally { setSending(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--card-bg,#fff)', borderRadius:16, maxWidth:420, width:'100%', maxHeight:'90vh', overflow:'auto', padding:24 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'1.1rem' }}>📍 Signaler un lieu manquant</h3>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du lieu *" required style={{ padding:10, borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem' }} />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse" style={{ padding:10, borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem' }} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding:10, borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem' }}>
            <option value="restaurant">Restaurant</option>
            <option value="sante">Santé</option>
            <option value="commerce">Commerce</option>
            <option value="services">Services</option>
            <option value="transport">Transport</option>
            <option value="education">Éducation</option>
            <option value="hotel">Hébergement</option>
            <option value="loisirs">Loisirs</option>
          </select>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone" style={{ padding:10, borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem' }} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / horaires" rows={3} style={{ padding:10, borderRadius:8, border:'1px solid var(--border)', fontSize:'0.9rem', resize:'vertical' }} />
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer' }}>Annuler</button>
            <button type="submit" disabled={sending} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#10B981', color:'#fff', fontWeight:700, cursor:'pointer' }}>{sending ? 'Envoi…' : 'Signaler'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

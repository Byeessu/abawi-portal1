import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Membre.css'
import './Inscription.css'

function Inscription() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '+221', email: '', mdp: '', mdp2: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  function upd(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleRegister(e) {
    e.preventDefault(); setErr('')
    if (form.mdp.length < 6) { setErr('Mot de passe : 6 caracteres minimum'); return }
    if (form.mdp !== form.mdp2) { setErr('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const r = await register(form.prenom, form.nom, form.telephone, form.email, form.mdp)
    setLoading(false)
    if (!r.success) { setErr(r.error); return }
    nav('/membre')
  }

  return (
    <main className="insc-page">
      <div className="insc-card">
        <h1 className="insc-title">Creer un <span style={{ color: 'var(--gold)' }}>compte</span></h1>
        <p className="insc-sub">Rejoignez ABAWI gratuitement. Debloquez plus avec ABAWI+ quand vous le souhaitez.</p>
        {err && <p className="mb-login-err">{err}</p>}
        <form onSubmit={handleRegister} className="insc-form">
          <div className="insc-row">
            <input className="mb-input" placeholder="Prenom" value={form.prenom} onChange={(e) => upd('prenom', e.target.value)} required />
            <input className="mb-input" placeholder="Nom" value={form.nom} onChange={(e) => upd('nom', e.target.value)} required />
          </div>
          <input className="mb-input" placeholder="Numero WhatsApp" value={form.telephone} onChange={(e) => upd('telephone', e.target.value)} required />
          <input className="mb-input" type="email" placeholder="Email" value={form.email} onChange={(e) => upd('email', e.target.value)} required />
          <div className="mb-input-pw-wrap">
            <input className="mb-input" type={showPw ? 'text' : 'password'} placeholder="Mot de passe (min 6 car)" value={form.mdp} onChange={(e) => upd('mdp', e.target.value)} required />
            <button type="button" className="mb-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>{showPw ? '🙈' : '👁️'}</button>
          </div>
          <div className="mb-input-pw-wrap">
            <input className="mb-input" type={showPw2 ? 'text' : 'password'} placeholder="Confirmer mot de passe" value={form.mdp2} onChange={(e) => upd('mdp2', e.target.value)} required />
            <button type="button" className="mb-pw-toggle" onClick={() => setShowPw2((v) => !v)} tabIndex={-1}>{showPw2 ? '🙈' : '👁️'}</button>
          </div>
          <label className="insc-check">
            <input type="checkbox" required />
            <span>J'accepte les <a href="/mentions-legales" target="_blank">conditions</a></span>
          </label>
          <button className="mb-btn mb-btn--gold" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creation...' : 'Creer mon compte'}
          </button>
        </form>
        <p className="mb-login-links" style={{ marginTop: 18, textAlign: 'center' }}>
          Deja membre ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </main>
  )
}

export default Inscription

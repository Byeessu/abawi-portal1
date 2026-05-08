import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createInvoice } from '../../config/paydunya'
import './Membre.css'
import './Inscription.css'

function Inscription() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '+221', email: '', mdp: '', mdp2: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // form | pay
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
    setStep('pay')
  }

  async function handlePay() {
    setLoading(true)
    const r = await createInvoice({ id: 'aplus', titre: 'Abonnement ABAWI+ — Mois 1', prix: 4900 })
    setLoading(false)
    if (r.success && r.url) { window.location.href = r.url }
    else {
      // Fallback WhatsApp
      window.open('https://wa.me/221775185050?text=' + encodeURIComponent(`Bonjour, je suis ${form.prenom} ${form.nom}. Je souhaite m'abonner a ABAWI+ (4 900 F/mois). Mon email : ${form.email}`), '_blank')
      nav('/bienvenue-vip')
    }
  }

  return (
    <main className="insc-page">
      <div className="insc-card">
        <h1 className="insc-title">Rejoindre <span style={{ color: 'var(--gold)' }}>ABAWI+</span></h1>

        {step === 'form' && (
          <>
            <p className="insc-sub">Creez votre compte, puis payez 4 900 FCFA/mois</p>
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
                <span>J'accepte les <a href="/mentions-legales" target="_blank">conditions d'abonnement</a></span>
              </label>
              <button className="mb-btn mb-btn--gold" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Creation...' : 'Creer mon compte et payer'}
              </button>
            </form>
          </>
        )}

        {step === 'pay' && (
          <div className="insc-pay">
            <p className="insc-sub">Compte cree ! Finalisez votre abonnement.</p>
            <div className="insc-recap">
              <span>Abonnement ABAWI+</span>
              <span className="insc-recap-prix">4 900 FCFA/mois</span>
            </div>
            <div className="insc-pay-options">
              <button className="insc-pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? 'Redirection...' : 'Payer — Wave, OM ou Carte'}
              </button>
              <a href={'https://wa.me/221775185050?text=' + encodeURIComponent(`Bonjour, je suis ${form.prenom}. Abonnement ABAWI+ (4 900 F/mois). Email: ${form.email}`)}
                target="_blank" rel="noopener noreferrer" className="insc-pay-wa">
                Payer via WhatsApp / Wave direct
              </a>
            </div>
            <p className="insc-secure">Paiement securise par PayDunya. Annulable a tout moment.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default Inscription

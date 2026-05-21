import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Membre.css'
import { Link } from 'react-router-dom'

// ─── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const { requestPasswordReset, confirmPasswordReset } = useAuth()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequest(e) {
    e.preventDefault(); setErr(''); setMsg(''); setLoading(true)
    const r = await requestPasswordReset(email)
    if (r.success) {
      setMsg(`Un code à 6 chiffres a été généré. Saisissez-le ci-dessous pour réinitialiser votre mot de passe.`)
      setStep('confirm')
    } else {
      setErr(r.error)
    }
    setLoading(false)
  }

  async function handleConfirm(e) {
    e.preventDefault(); setErr(''); setMsg(''); setLoading(true)
    if (newPw !== confirmPw) { setErr('Les mots de passe ne correspondent pas'); setLoading(false); return }
    if (newPw.length < 6) { setErr('Le mot de passe doit contenir au moins 6 caractères'); setLoading(false); return }
    const r = await confirmPasswordReset(email, token, newPw)
    if (r.success) {
      setMsg('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.')
      setStep('done')
    } else {
      setErr(r.error)
    }
    setLoading(false)
  }

  return (
    <div className="mb-viewer-overlay" onClick={onClose}>
      <div className="mb-login-card" style={{ maxWidth: 420, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {step === 'request' ? '🔑 Mot de passe oublié' : step === 'confirm' ? '🔐 Nouveau mot de passe' : '✅ Terminé'}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {step === 'request' ? 'Entrez votre email pour recevoir un code de réinitialisation.' :
           step === 'confirm' ? 'Saisissez le code reçu et votre nouveau mot de passe.' :
           'Votre mot de passe a été mis à jour.'}
        </p>
        {err && <p className="mb-login-err">{err}</p>}
        {msg && <p style={{ background: 'rgba(0,200,83,0.1)', color: '#00c853', padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 12 }}>{msg}</p>}

        {step === 'request' && (
          <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="mb-input" type="email" placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="mb-btn mb-btn--gold" type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le code'}</button>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="mb-input" placeholder="Code à 6 chiffres" value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
            <input className="mb-input" type="password" placeholder="Nouveau mot de passe" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
            <input className="mb-input" type="password" placeholder="Confirmer le mot de passe" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            <button className="mb-btn mb-btn--gold" type="submit" disabled={loading}>{loading ? 'Mise à jour...' : 'Réinitialiser'}</button>
          </form>
        )}

        {step === 'done' && (
          <button className="mb-btn mb-btn--gold" onClick={onClose}>Se connecter</button>
        )}

        <button onClick={onClose} style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Annuler</button>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, membre } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  // Already logged in → redirect
  useEffect(() => {
    if (membre) navigate('/membre', { replace: true })
  }, [membre, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setExpired(false)
    setLoading(true)
    const r = await login(id, pw)
    setLoading(false)
    if (!r.success) {
      setErr(r.error)
    } else if (r.expired) {
      setExpired(true)
    } else {
      navigate('/membre', { replace: true })
    }
  }

  return (
    <main className="mb-login-page" style={{ minHeight: '75vh' }}>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div className="mb-login-card" style={{ maxWidth: 460 }}>
        {/* Logo / en-tête */}
        <div style={{ marginBottom: 28 }}>
          <img src="/favicon-abawi-64.webp" alt="ABAWI" loading="eager" decoding="async" width="52" height="52" style={{ borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 0 12px rgba(240,180,41,0.4))', marginBottom: 16 }} />
          <h1 className="mb-login-title">
            Espace <span style={{ color: 'var(--gold)' }}>Membre</span>
          </h1>
          <p className="mb-login-sub">Connectez-vous à votre compte ABAWI+</p>
        </div>

        {err && <p className="mb-login-err">{err}</p>}

        {expired && (
          <div className="mb-login-expired">
            <p>Votre abonnement a expiré.</p>
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm" style={{ marginTop: 8, display: 'inline-block' }}>
              Renouveler mon abonnement
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-login-form">
          <input
            className="mb-input"
            placeholder="Email ou numéro WhatsApp"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            required
          />
          <div className="mb-input-pw-wrap">
            <input
              className="mb-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="button" className="mb-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="mb-btn mb-btn--gold" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ margin: '20px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }} />

        <p className="mb-login-links">
          <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 'inherit', padding: 0, textDecoration: 'underline' }}>
            Mot de passe oublié ?
          </button>
        </p>
        <p className="mb-login-links" style={{ marginTop: 10 }}>
          Pas encore membre ?{' '}
          <Link to="/inscription">Creer un compte gratuit</Link>
        </p>
      </div>
    </main>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Membre.css'
import { Link } from 'react-router-dom'

export default function Login() {
  const { login, membre } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(false)

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
      <div className="mb-login-card" style={{ maxWidth: 460 }}>
        {/* Logo / en-tête */}
        <div style={{ marginBottom: 28 }}>
          <img src="/abawi-logo.png" alt="ABAWI" style={{ height: 52, borderRadius: '50%', filter: 'drop-shadow(0 0 10px rgba(240,180,41,0.5))', marginBottom: 16 }} />
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
          <a href="https://wa.me/221775185050?text=Mot%20de%20passe%20oublie" target="_blank" rel="noopener noreferrer">
            Mot de passe oublié ?
          </a>
        </p>
        <p className="mb-login-links" style={{ marginTop: 10 }}>
          Pas encore membre ?{' '}
          <Link to="/plans">S'abonner à ABAWI+</Link>
        </p>
      </div>
    </main>
  )
}

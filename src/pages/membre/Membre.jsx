import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { guides, allFascicules, podcasts, slugify } from '../../data/products'
import { supabase } from '../../lib/supabase'
import './Membre.css'
import { Link } from 'react-router-dom'
import { CoverImage } from '../../components/CoverImage'
import { AudioPlayer } from '../../components/AudioPlayer'

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

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuth()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setExpired(false); setLoading(true)
    const r = await login(id, pw)
    if (!r.success) setErr(r.error)
    else if (r.expired) setExpired(true)
    setLoading(false)
  }

  return (
    <main className="mb-login-page">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div className="mb-login-card">
        <div className="mb-login-logo">
          <img src="/favicon-symbol.png" alt="ABAWI" loading="eager" decoding="async" width="52" height="52" />
        </div>
        <h1 className="mb-login-title">Espace <span style={{ color: 'var(--gold)' }}>Membre</span></h1>
        <p className="mb-login-sub">Connectez-vous à votre compte ABAWI+</p>
        {err && <p className="mb-login-err">{err}</p>}
        {expired && (
          <div className="mb-login-expired">
            <p>Votre abonnement a expiré.</p>
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm" style={{ marginTop: 8 }}>Renouveler mon abonnement</Link>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-login-form">
          <input className="mb-input" placeholder="Email ou numéro WhatsApp" value={id} onChange={(e) => setId(e.target.value)} required />
          <div className="mb-input-pw-wrap">
            <input className="mb-input" type={showPw ? 'text' : 'password'} placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" className="mb-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="mb-btn mb-btn--gold" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <p className="mb-login-links">
          <button onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 'inherit', padding: 0, textDecoration: 'underline' }}>Mot de passe oublié ?</button>
          {' | '}<Link to="/plans">Pas encore membre ? S'abonner</Link>
        </p>
      </div>
    </main>
  )
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
function PdfViewer({ url, onClose }) {
  if (!url) return null
  const embedUrl = url.includes('drive.google.com') ? url.replace('/view', '/preview').replace('/edit', '/preview') : url
  return (
    <div className="mb-viewer-overlay" onClick={onClose}>
      <div className="mb-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="mb-viewer-header">
          <button className="mb-viewer-close" onClick={onClose}>&times;</button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mb-viewer-dl">Télécharger</a>
        </div>
        <iframe src={embedUrl} className="mb-viewer-frame" title="PDF Viewer" />
      </div>
    </div>
  )
}

// ─── Access Item ──────────────────────────────────────────────────────────────
function AccessItem({ icon, label, desc, unlocked }) {
  return (
    <div className={`mb-access-item ${unlocked ? 'mb-access-item--unlocked' : 'mb-access-item--locked'}`}>
      <span className="mb-access-icon">{icon}</span>
      <div className="mb-access-content">
        <div className={`mb-access-label ${unlocked ? '' : 'mb-access-label--muted'}`}>{label}</div>
        <div className="mb-access-desc">{desc}</div>
      </div>
      <span className={`mb-access-badge ${unlocked ? 'mb-access-badge--unlocked' : 'mb-access-badge--locked'}`}>
        {unlocked ? '✅ Accès' : '🔒 Verrouillé'}
      </span>
    </div>
  )
}

// ─── Credit Transaction Row ───────────────────────────────────────────────────
function CreditTxRow({ tx }) {
  const isDebit = (tx.amount || tx.montant || 0) < 0
  const amount = Math.abs(tx.amount || tx.montant || 0)
  const label = tx.description || tx.tool_name || tx.product_id || 'Transaction'
  const date = new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="mb-credit-tx">
      <div className="mb-credit-tx-left">
        <span className={`mb-credit-tx-icon ${isDebit ? 'mb-credit-tx-icon--debit' : 'mb-credit-tx-icon--credit'}`}>
          {isDebit ? '−' : '+'}
        </span>
        <div>
          <div className="mb-credit-tx-label">{label}</div>
          <div className="mb-credit-tx-date">{date}</div>
        </div>
      </div>
      <span className={`mb-credit-tx-amount ${isDebit ? 'mb-credit-tx-amount--debit' : 'mb-credit-tx-amount--credit'}`}>
        {isDebit ? '−' : '+'}{amount} cr.
      </span>
    </div>
  )
}

// ─── Profile Field ────────────────────────────────────────────────────────────
function ProfileField({ label, value }) {
  return (
    <div className="mb-profile-field">
      <span className="mb-profile-field-label">{label}</span>
      <span className="mb-profile-field-value">{value}</span>
    </div>
  )
}

// ─── Main Membre Component ────────────────────────────────────────────────────
function Membre() {
  const { membre, logout, refreshMembre, isAdmin, isMember } = useAuth()
  const [tab, setTab] = useState('espace')
  const [search, setSearch] = useState('')
  const [viewerUrl, setViewerUrl] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileData, setProfileData] = useState({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [creditTxs, setCreditTxs] = useState([])
  const [creditTxsLoading, setCreditTxsLoading] = useState(false)
  const [userPacks, setUserPacks] = useState([])
  const [userPacksLoading, setUserPacksLoading] = useState(false)
  const [showUpsell, setShowUpsell] = useState(() => {
    try { return localStorage.getItem('abawi_upsell_closed') !== '1' } catch { return true }
  })

  const isFreePlan = (membre?.plan_type || '').toLowerCase() === 'gratuit'

  function closeUpsell() {
    setShowUpsell(false)
    try { localStorage.setItem('abawi_upsell_closed', '1') } catch { /* ignore */ }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refreshMembre() }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'achats' && membre) loadPurchases()
    if (tab === 'credits' && membre) loadCreditTxs()
    if (tab === 'packs' && membre) loadUserPacks()
  }, [tab, membre])

  async function loadPurchases() {
    if (!membre?.email) return
    setPurchasesLoading(true)
    const { data } = await supabase.from('payments').select('*').eq('email', membre.email).order('created_at', { ascending: false })
    setPurchases(data || [])
    setPurchasesLoading(false)
  }

  async function loadUserPacks() {
    if (!membre?.id) return
    setUserPacksLoading(true)
    const { data } = await supabase.from('user_packs').select('*').eq('user_id', membre.id).order('created_at', { ascending: false })
    setUserPacks(data || [])
    setUserPacksLoading(false)
  }

  async function loadCreditTxs() {
    if (!membre?.email) return
    setCreditTxsLoading(true)
    const { data } = await supabase.from('credit_transactions').select('*').eq('email', membre.email).order('created_at', { ascending: false }).limit(50)
    setCreditTxs(data || [])
    setCreditTxsLoading(false)
  }

  async function saveProfile() {
    if (!membre?.id) return
    setSavingProfile(true)
    const { error } = await supabase.from('membres').update({
      prenom: profileData.prenom,
      nom: profileData.nom,
      telephone: profileData.telephone,
    }).eq('id', membre.id)
    if (!error) { await refreshMembre(); setEditProfile(false) }
    setSavingProfile(false)
  }

  if (!membre) return <LoginForm />

  const daysLeft = membre.date_fin ? Math.max(0, Math.ceil((new Date(membre.date_fin) - new Date()) / 86400000)) : 0
  const isActive = isAdmin || (membre.isActive !== false && daysLeft > 0)
  const initials = ((membre.prenom?.[0] || '') + (membre.nom?.[0] || '')).toUpperCase() || '?'
  const creditBalance = membre.credits ?? 0

  const filteredGuides = guides.filter((g) => !search || g.titre.toLowerCase().includes(search.toLowerCase()))
  const filteredFasc = allFascicules.filter((f) => !search || f.titre.toLowerCase().includes(search.toLowerCase()))

  const TABS = [
    { key: 'espace',  label: 'Mon espace', icon: '🏠' },
    { key: 'packs',   label: 'Mes packs',  icon: '📦' },
    { key: 'credits', label: 'Mes crédits', icon: '💰' },
    { key: 'acces',   label: 'Mes accès',   icon: '🔑' },
    { key: 'achats',  label: 'Historique',  icon: '🛒' },
    { key: 'profil',  label: 'Mon profil',  icon: '👤' },
  ]

  const ACCESS_ITEMS = [
    { icon: '📚', label: 'Guides Digital',      desc: `${guides.length} guides business & stratégie`,   unlocked: isMember },
    { icon: '🎓', label: 'Academy',             desc: `${allFascicules.length} fascicules & cours Bac`,  unlocked: isMember },
    { icon: '🎧', label: 'Podcasts',            desc: `${podcasts.length} épisodes premium`,             unlocked: isMember },
    { icon: '🛠️', label: 'Outils & IA',         desc: 'CV, Business Plan, Factures, IA élite',          unlocked: isMember },
    { icon: '💬', label: 'Groupe WhatsApp VIP', desc: 'Communauté privée ABAWI+',                       unlocked: isMember },
    { icon: '📋', label: 'Templates Business',  desc: 'Modèles professionnels téléchargeables',          unlocked: isMember },
    { icon: '⚙️', label: 'Panel Admin',          desc: 'Gestion complète du portail',                    unlocked: isAdmin },
  ]

  return (
    <main className="mb-page">
      <PdfViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      {/* ══ HEADER ══ */}
      <div className="mb-header">
        <div className="mb-header-left">
          <div className="mb-avatar" style={{
            background: isAdmin
              ? 'linear-gradient(135deg, #F0B429, #e5a820)'
              : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: isAdmin ? '#070B0F' : '#fff',
          }}>{initials}</div>
          <div>
            <h2 className="mb-welcome">Bonjour {membre.prenom} 👋</h2>
            <p className="mb-since">
              {isAdmin ? 'Administrateur ABAWI' : `Membre ABAWI+ ${isActive ? '— Actif' : '— Expiré'}`}
            </p>
          </div>
        </div>
        <div className="mb-header-right">
          {isAdmin ? (
            <span className="mb-admin-badge">⚙️ ADMIN</span>
          ) : isFreePlan ? (
            <span className="mb-badge-vip mb-badge-vip--free">🌱 Gratuit</span>
          ) : (
            <span className="mb-badge-vip">💎 ABAWI+</span>
          )}
          <div className={`mb-status ${isActive && !isFreePlan ? 'mb-status--active' : isFreePlan ? 'mb-status--active' : 'mb-status--expired'}`}>
            {isAdmin ? 'Accès total' : isFreePlan ? 'Compte gratuit' : isActive ? `Actif — ${daysLeft}j restants` : 'Expiré'}
          </div>
          {!isAdmin && isActive && daysLeft <= 7 && (
            <div className="mb-alert mb-alert--danger">
              ⚠️ Expire dans {daysLeft}j
              <Link to="/plans" style={{ color: 'var(--gold)', marginLeft: 8, fontWeight: 700 }}>Renouveler →</Link>
            </div>
          )}
          {!isAdmin && !isActive && (
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm">Renouveler l'abonnement</Link>
          )}
          {isAdmin && <Link to="/admin" className="mb-admin-link">⚙️ Panel Admin</Link>}
          <button className="mb-logout" onClick={logout}>Déconnexion</button>
        </div>
      </div>

      {/* ── Upsell banner — free users ── */}
      {isFreePlan && showUpsell && (
        <div className="mb-upsell">
          <span className="mb-upsell-icon">💎</span>
          <div className="mb-upsell-body">
            <div className="mb-upsell-title">Passez à ABAWI+</div>
            <div className="mb-upsell-sub">Guides premium, outils IA, Academy, ABAWI 360 et bien plus. Sans engagement.</div>
          </div>
          <div className="mb-upsell-actions">
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm">Découvrir ABAWI+</Link>
            <button className="mb-upsell-close" onClick={closeUpsell} title="Fermer">✕</button>
          </div>
        </div>
      )}

      {/* ══ TABS ══ */}
      <div className="mb-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`mb-tab ${tab === t.key ? 'mb-tab--active' : ''}`} onClick={() => setTab(t.key)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: MON ESPACE ══ */}
      {tab === 'espace' && (
        <div>
          <input className="mb-search" placeholder="Rechercher un guide, fascicule..." value={search} onChange={(e) => setSearch(e.target.value)} />

          {/* Guides */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="mb-section-title mb-section-title--gold">📚 Guides Digital ({filteredGuides.length})</h3>
            {isMember ? (
              <div className="mb-grid">
                {filteredGuides.map((g) => (
                  <div key={g.id} className="mb-card">
                    <CoverImage titre={g.titre} categorie={g.categorie} type="guide" brand="digital" size="md" />
                    <div className="mb-card-body">
                      <h3 className="mb-card-title">{g.titre}</h3>
                      <div className="mb-card-btns">
                        {g.drive_url && <button className="mb-btn mb-btn--green mb-btn--sm" onClick={() => setViewerUrl(g.drive_url)}>Lire</button>}
                        {g.file_url && <a href={g.file_url} download className="mb-btn mb-btn--outline mb-btn--sm">PDF</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-locked-panel mb-locked-panel--gold">
                <div className="mb-locked-icon">🔒</div>
                <p className="mb-locked-text">Abonnez-vous à ABAWI+ pour accéder aux {guides.length} guides</p>
                <Link to="/plans" className="mb-btn mb-btn--gold">S'abonner à ABAWI+</Link>
              </div>
            )}
          </div>

          {/* Academy */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="mb-section-title mb-section-title--green">🎓 Academy ({filteredFasc.length})</h3>
            {isMember ? (
              <div className="mb-grid">
                {filteredFasc.map((f) => (
                  <div key={f.id} className="mb-card">
                    <CoverImage titre={f.titre} categorie={f.categorie} type="fascicule" brand="academy" serie={f.serie} matiere={f.matiere} size="md" />
                    <div className="mb-card-body">
                      <h3 className="mb-card-title">{f.titre}</h3>
                      <div className="mb-card-btns">
                        {f.drive_url && <button className="mb-btn mb-btn--green mb-btn--sm" onClick={() => setViewerUrl(f.drive_url)}>Lire</button>}
                        {f.file_url && <a href={f.file_url} download className="mb-btn mb-btn--outline mb-btn--sm">PDF</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-locked-panel mb-locked-panel--green">
                <div className="mb-locked-icon">🔒</div>
                <p className="mb-locked-text">Accès aux {allFascicules.length} fascicules avec ABAWI+</p>
                <Link to="/plans" className="mb-btn mb-btn--gold">S'abonner à ABAWI+</Link>
              </div>
            )}
          </div>

          {/* Podcasts */}
          <div style={{ marginBottom: 32 }}>
            <h3 className="mb-section-title mb-section-title--purple">🎧 Podcasts ({podcasts.length})</h3>
            {isMember ? (
              <div className="mb-pod-list">
                {podcasts.map((ep) => (
                  <div key={ep.id} className="mb-pod-item">
                    <div className="mb-pod-info">
                      <span className="mb-pod-serie">{ep.serie}</span>
                      <h3 className="mb-pod-title">{ep.titre}</h3>
                    </div>
                    {ep.audio_url
                      ? <AudioPlayer src={ep.audio_url} size="md" titre={ep.titre} serie={ep.serie} id={ep.id} />
                      : <span className="mb-pod-soon">Audio bientôt disponible</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-locked-panel mb-locked-panel--purple">
                <div className="mb-locked-icon">🔒</div>
                <p className="mb-locked-text">Accès aux {podcasts.length} épisodes avec ABAWI+</p>
                <Link to="/plans" className="mb-btn mb-btn--gold">S'abonner à ABAWI+</Link>
              </div>
            )}
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-section-title mb-section-title--white">💬 Communauté</h3>
            <div className="mb-community">
              <a href="https://wa.me/221775185050?text=Acces%20groupe%20VIP" target="_blank" rel="noopener noreferrer" className="mb-comm-card">
                <span>💬</span> Groupe WhatsApp VIP
              </a>
              <a href="https://www.tiktok.com/@abawi_sn" target="_blank" rel="noopener noreferrer" className="mb-comm-card">
                <span>🎵</span> TikTok @abawi_sn
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: MES PACKS ══ */}
      {tab === 'packs' && (
        <div>
          <h3 className="mb-section-title mb-section-title--gold" style={{ marginBottom: 20 }}>
            📦 Mes packs achetés ({userPacks.length})
          </h3>
          {userPacksLoading ? (
            <div className="mb-empty-state"><div className="mb-empty-state-icon">⏳</div><p>Chargement...</p></div>
          ) : userPacks.length === 0 ? (
            <div className="mb-empty-state">
              <div className="mb-empty-state-icon">📦</div>
              <p className="mb-empty-state-title">Aucun pack acheté</p>
              <p className="mb-empty-state-sub">Vos packs apparaîtront ici après achat.</p>
              <Link to="/digital" className="mb-btn mb-btn--gold mb-btn--sm" style={{ marginTop: 16 }}>Explorer les packs →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {userPacks.map((up) => {
                const isAcademy = up.pack_type === 'academy'
                const basePath = isAcademy ? '/academy' : '/digital'
                const color = isAcademy ? 'green' : 'gold'
                const productList = isAcademy ? allFascicules : guides
                const ids = Array.isArray(up.product_ids) ? up.product_ids : []
                const included = productList.filter((p) => ids.includes(String(p.id)))
                return (
                  <div key={up.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: `var(--${color})` }}>{isAcademy ? 'Pack Academy' : 'Pack Digital'}</span>
                        <h4 style={{ margin: '6px 0 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{up.pack_name}</h4>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: up.status === 'active' ? '#00c853' : '#ef4444', fontWeight: 700, background: up.status === 'active' ? 'rgba(0,200,83,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                        {up.status === 'active' ? '✓ Actif' : up.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{included.length} produit(s) inclus</div>
                    <div className="mb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                      {included.map((p) => (
                        <Link key={p.id} to={`${basePath}/${slugify(p.titre)}`} className="mb-card" style={{ textDecoration: 'none' }}>
                          <CoverImage titre={p.titre} categorie={p.categorie || p.matiere} type={isAcademy ? 'fascicule' : 'guide'} brand={isAcademy ? 'academy' : 'digital'} serie={p.serie} matiere={p.matiere} size="sm" />
                          <div className="mb-card-body">
                            <h3 className="mb-card-title" style={{ fontSize: '0.82rem' }}>{p.titre}</h3>
                            <div className="mb-card-btns">
                              {p.drive_url && <span className="mb-btn mb-btn--green mb-btn--sm" style={{ pointerEvents: 'none' }}>Lire</span>}
                              {p.file_url && <span className="mb-btn mb-btn--outline mb-btn--sm" style={{ pointerEvents: 'none' }}>PDF</span>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {included.length === 0 && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>Produits non listés — contactez le support.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: MES CRÉDITS ══ */}
      {tab === 'credits' && (
        <div className="mb-credits-page">

          {/* Solde */}
          <div className="mb-credit-balance-card">
            <div className="mb-credit-balance-left">
              <span className="mb-credit-balance-icon">💰</span>
              <div>
                <div className="mb-credit-balance-label">Solde actuel</div>
                <div className="mb-credit-balance-value">{creditBalance.toLocaleString()}</div>
                <div className="mb-credit-balance-unit">crédits disponibles</div>
              </div>
            </div>
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm">Recharger →</Link>
          </div>

          {/* Infos usage */}
          <div className="mb-credit-info-grid">
            <div className="mb-credit-info-card">
              <div className="mb-credit-info-icon">🤖</div>
              <div className="mb-credit-info-title">ABAWI IA</div>
              <div className="mb-credit-info-cost">~2–5 cr. / génération</div>
            </div>
            <div className="mb-credit-info-card">
              <div className="mb-credit-info-icon">📄</div>
              <div className="mb-credit-info-title">Business Plan</div>
              <div className="mb-credit-info-cost">~20–50 cr. / document</div>
            </div>
            <div className="mb-credit-info-card">
              <div className="mb-credit-info-icon">📷</div>
              <div className="mb-credit-info-title">Studio Photo</div>
              <div className="mb-credit-info-cost">~5–10 cr. / export</div>
            </div>
            <div className="mb-credit-info-card">
              <div className="mb-credit-info-icon">⚖️</div>
              <div className="mb-credit-info-title">Juridique Élite</div>
              <div className="mb-credit-info-cost">~15–30 cr. / document</div>
            </div>
          </div>

          {/* Historique transactions */}
          <div className="mb-credit-history">
            <h3 className="mb-section-title mb-section-title--gold" style={{ marginBottom: 16 }}>
              📋 Historique des transactions
            </h3>

            {creditTxsLoading ? (
              <div className="mb-empty-state">
                <div className="mb-empty-state-icon">⏳</div>
                <p>Chargement...</p>
              </div>
            ) : creditTxs.length === 0 ? (
              <div className="mb-empty-state">
                <div className="mb-empty-state-icon">💳</div>
                <p className="mb-empty-state-title">Aucune transaction</p>
                <p className="mb-empty-state-sub">Vos transactions de crédits apparaîtront ici dès que vous utiliserez un outil IA.</p>
                <Link to="/outils" className="mb-btn mb-btn--gold mb-btn--sm" style={{ marginTop: 16 }}>Explorer les outils →</Link>
              </div>
            ) : (
              <div className="mb-credit-tx-list">
                {creditTxs.map((tx, i) => <CreditTxRow key={tx.id || i} tx={tx} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: MES ACCÈS ══ */}
      {tab === 'acces' && (
        <div>
          <h3 className="mb-section-title mb-section-title--white" style={{ marginBottom: 20 }}>
            🔑 Droits d'accès — {isMember ? 'ABAWI+' : 'Non membre'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACCESS_ITEMS.map((item, i) => <AccessItem key={i} {...item} />)}
          </div>
          {!isMember && (
            <div className="mb-upsell-cta">
              <p>Débloquez tout avec ABAWI+</p>
              <Link to="/plans" className="mb-btn mb-btn--gold">S'abonner — 4 900 F/mois</Link>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: HISTORIQUE ACHATS ══ */}
      {tab === 'achats' && (
        <div>
          <h3 className="mb-section-title mb-section-title--white" style={{ marginBottom: 20 }}>
            🛒 Historique d'achats
          </h3>
          {purchasesLoading ? (
            <div className="mb-empty-state">
              <div className="mb-empty-state-icon">⏳</div>
              <p>Chargement...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="mb-empty-state">
              <div className="mb-empty-state-icon">🛒</div>
              <p className="mb-empty-state-title">Aucun achat enregistré</p>
              <p className="mb-empty-state-sub">Vos achats et renouvellements d'abonnement apparaîtront ici.</p>
            </div>
          ) : (
            <div className="mb-purchase-list">
              {purchases.map((p) => {
                const sc = p.statut === 'paid' ? 'green' : p.statut === 'pending' ? 'gold' : 'red'
                const scColor = sc === 'green' ? 'var(--green)' : sc === 'gold' ? 'var(--gold)' : 'var(--red)'
                return (
                  <div key={p.id} className="mb-purchase-row">
                    <div className="mb-purchase-info">
                      <div className="mb-purchase-title">{p.product_title || p.product_id || 'Produit ABAWI'}</div>
                      <div className="mb-purchase-date">
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="mb-purchase-amount">{(p.montant || 0).toLocaleString()} FCFA</div>
                    <span className="mb-purchase-badge" style={{ color: scColor, background: `${scColor}18`, border: `1px solid ${scColor}33` }}>
                      {p.statut === 'paid' ? '✅ Payé' : p.statut === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: MON PROFIL ══ */}
      {tab === 'profil' && (
        <div style={{ maxWidth: 540 }}>
          <h3 className="mb-section-title mb-section-title--white" style={{ marginBottom: 24 }}>
            👤 Mon profil
          </h3>

          {!editProfile ? (
            <div className="mb-profile-card">
              <ProfileField label="Prénom"       value={membre.prenom} />
              <ProfileField label="Nom"           value={membre.nom} />
              <ProfileField label="Email"         value={membre.email} />
              <ProfileField label="Téléphone"     value={membre.telephone || '—'} />
              <ProfileField label="Rôle"          value={membre.role === 'admin' ? '⚙️ Administrateur' : '💎 Membre ABAWI+'} />
              <ProfileField
                label="Abonnement"
                value={isAdmin ? 'Accès total (admin)' : isActive ? `Actif — expire le ${new Date(membre.date_fin).toLocaleDateString('fr-FR')}` : 'Expiré'}
              />
              <button
                className="mb-profile-edit-btn"
                onClick={() => { setProfileData({ prenom: membre.prenom, nom: membre.nom, telephone: membre.telephone || '' }); setEditProfile(true) }}
              >
                ✏️ Modifier mon profil
              </button>
            </div>
          ) : (
            <div className="mb-profile-card">
              {[{ key: 'prenom', label: 'Prénom' }, { key: 'nom', label: 'Nom' }, { key: 'telephone', label: 'Téléphone' }].map(({ key, label }) => (
                <div key={key} className="mb-profile-edit-field">
                  <label className="mb-profile-edit-label">{label}</label>
                  <input
                    className="mb-input"
                    value={profileData[key] || ''}
                    onChange={e => setProfileData(p => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="mb-profile-edit-actions">
                <button onClick={saveProfile} disabled={savingProfile} className="mb-btn mb-btn--gold" style={{ flex: 1 }}>
                  {savingProfile ? 'Sauvegarde...' : '✅ Sauvegarder'}
                </button>
                <button onClick={() => setEditProfile(false)} className="mb-btn mb-btn--outline">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Déconnexion */}
          <div className="mb-danger-zone">
            <div className="mb-danger-zone-title">Zone de déconnexion</div>
            <button onClick={logout} className="mb-danger-btn">
              🚪 Se déconnecter
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default Membre

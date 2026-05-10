import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { guides, allFascicules, podcasts } from '../../data/products'
import { supabase } from '../../lib/supabase'
import './Membre.css'
import { Link } from 'react-router-dom'
import { CoverImage } from '../../components/CoverImage'
import { AudioPlayer } from '../../components/AudioPlayer'

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuth()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setExpired(false); setLoading(true)
    const r = await login(id, pw)
    if (!r.success) setErr(r.error)
    else if (r.expired) setExpired(true)
    setLoading(false)
  }

  return (
    <main className="mb-login-page">
      <div className="mb-login-card">
        <h1 className="mb-login-title">Espace <span style={{ color: 'var(--gold)' }}>Membre</span></h1>
        <p className="mb-login-sub">Connectez-vous a votre compte ABAWI+</p>
        {err && <p className="mb-login-err">{err}</p>}
        {expired && (
          <div className="mb-login-expired">
            <p>Votre abonnement a expire.</p>
            <Link to="/plans" className="mb-btn mb-btn--gold mb-btn--sm" style={{ marginTop: 8 }}>Renouveler mon abonnement</Link>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-login-form">
          <input className="mb-input" placeholder="Email ou numero WhatsApp" value={id} onChange={(e) => setId(e.target.value)} required />
          <div className="mb-input-pw-wrap">
            <input className="mb-input" type={showPw ? 'text' : 'password'} placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" className="mb-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="mb-btn mb-btn--gold" type="submit" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <p className="mb-login-links">
          <a href="https://wa.me/221775185050?text=Mot%20de%20passe%20oublie" target="_blank" rel="noopener noreferrer">Mot de passe oublie ?</a>
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  useEffect(() => { refreshMembre() }, [])

  useEffect(() => {
    if (tab === 'achats' && membre) loadPurchases()
    if (tab === 'credits' && membre) loadCreditTxs()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [tab, membre])

  async function loadPurchases() {
    if (!membre?.email) return
    setPurchasesLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('email', membre.email)
      .order('created_at', { ascending: false })
    setPurchases(data || [])
    setPurchasesLoading(false)
  }

  async function loadCreditTxs() {
    if (!membre?.email) return
    setCreditTxsLoading(true)
    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('email', membre.email)
      .order('created_at', { ascending: false })
      .limit(50)
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

  const filteredGuides = guides.filter((g) => !search || g.titre.toLowerCase().includes(search.toLowerCase()))
  const filteredFasc = allFascicules.filter((f) => !search || f.titre.toLowerCase().includes(search.toLowerCase()))

  const TABS = [
    { key: 'espace', label: 'Mon espace', icon: '🏠' },
    { key: 'acces', label: 'Mes accès', icon: '🔑' },
    { key: 'achats', label: 'Mes achats', icon: '🛒' },
    { key: 'credits', label: 'Mes crédits', icon: '💰' },
    { key: 'profil', label: 'Mon profil', icon: '👤' },
  ]

  const ACCESS_ITEMS = [
    { icon: '📚', label: 'Guides Digital', desc: `${guides.length} guides business & stratégie`, unlocked: isMember },
    { icon: '🎓', label: 'Academy', desc: `${allFascicules.length} fascicules & cours Bac`, unlocked: isMember },
    { icon: '🎧', label: 'Podcasts', desc: `${podcasts.length} épisodes premium`, unlocked: isMember },
    { icon: '🛠️', label: 'Outils & IA', desc: 'CV, Business Plan, Factures, IA élite', unlocked: isMember },
    { icon: '💬', label: 'Groupe WhatsApp VIP', desc: 'Communauté privée ABAWI+', unlocked: isMember },
    { icon: '📋', label: 'Templates Business', desc: 'Modèles professionnels téléchargeables', unlocked: isMember },
    { icon: '⚙️', label: 'Panel Admin', desc: 'Gestion complète du portail', unlocked: isAdmin },
  ]

  return (
    <main className="mb-page">
      <PdfViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />

      {/* HEADER */}
      <div className="mb-header">
        <div className="mb-header-left">
          <div className="mb-avatar" style={{
            background: isAdmin ? 'linear-gradient(135deg, #F0B429, #e5a820)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
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
          ) : (
            <span className="mb-badge-vip">💎 ABAWI+</span>
          )}
          <div className={`mb-status ${isActive ? 'mb-status--active' : 'mb-status--expired'}`}>
            {isAdmin ? 'Accès total' : isActive ? `Actif — ${daysLeft}j restants` : 'Expiré'}
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
          {isAdmin && (
            <Link to="/admin" className="mb-admin-link">⚙️ Panel Admin</Link>
          )}
          <button className="mb-logout" onClick={logout}>Déconnexion</button>
        </div>
      </div>

      {/* TABS */}
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
          {/* Search */}
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
                    {ep.audio_url ? (
                      <AudioPlayer src={ep.audio_url} size="md" titre={ep.titre} serie={ep.serie} id={ep.id} />
                    ) : (
                      <span className="mb-pod-soon">Audio bientot disponible</span>
                    )}
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

      {/* ══ TAB: MES ACCÈS ══ */}
      {tab === 'acces' && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F0F2F5', marginBottom: 20 }}>
            🔑 Droits d'accès — {isMember ? 'ABAWI+' : 'Non membre'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACCESS_ITEMS.map((item, i) => <AccessItem key={i} {...item} />)}
          </div>
          {!isMember && (
            <div style={{ marginTop: 28, padding: '20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(240,180,41,0.08), rgba(240,180,41,0.04))', border: '1px solid rgba(240,180,41,0.2)', textAlign: 'center' }}>
              <p style={{ color: '#F0F2F5', fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Débloquez tout avec ABAWI+</p>
              <Link to="/plans" className="mb-btn mb-btn--gold">S'abonner — 4 900 F/mois</Link>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: MES ACHATS ══ */}
      {tab === 'achats' && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F0F2F5', marginBottom: 20 }}>🛒 Historique d'achats</h3>
          {purchasesLoading ? (
            <div style={{ textAlign: 'center', color: '#8B95A5', padding: 40 }}>Chargement...</div>
          ) : purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛒</div>
              <p>Aucun achat enregistré</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {purchases.map((p) => {
                const sc = p.statut === 'paid' ? '#18A84A' : p.statut === 'pending' ? '#F0B429' : '#ef4444'
                return (
                  <div key={p.id} style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: '#0D1117', border: '1px solid #1A2332',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F0F2F5', marginBottom: 4 }}>
                        {p.product_title || p.product_id || 'Produit ABAWI'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#18A84A' }}>
                      {(p.montant || 0).toLocaleString()} FCFA
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: `${sc}15`, color: sc }}>
                      {p.statut === 'paid' ? '✅ Payé' : p.statut === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: MES CRÉDITS ══ */}
      {tab === 'credits' && (
        <div style={{ maxWidth: 720 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F0F2F5', marginBottom: 24 }}>💰 Mes crédits</h3>

          {/* Solde */}
          <div style={{ padding: 24, borderRadius: 16, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: 8 }}>Solde disponible</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{membre?.credits || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>crédits</div>
            {isAdmin && (
              <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 100, display: 'inline-block' }}>
                ⚙️ Admin — accès illimité
              </div>
            )}
            {!isAdmin && (
              <Link to="/plans" style={{ marginTop: 16, display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: '#fff', color: '#7C3AED', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none' }}>
                ➕ Recharger mes crédits
              </Link>
            )}
          </div>

          {/* Historique */}
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F0F2F5', marginBottom: 14 }}>Historique</h4>
          {creditTxsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chargement...</p>
          ) : creditTxs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune transaction pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {creditTxs.map((tx) => {
                const isDebit = tx.type === 'debit'
                const isRecharge = tx.type === 'recharge'
                const color = isDebit ? '#ef4444' : isRecharge ? '#18A84A' : '#F0B429'
                const sign = isDebit ? '-' : '+'
                return (
                  <div key={tx.id} style={{
                    padding: '14px 18px', borderRadius: 12,
                    background: '#0D1117', border: '1px solid #1A2332',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F0F2F5', marginBottom: 4 }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color }}>
                      {sign}{tx.montant}
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: `${color}15`, color }}>
                      {isDebit ? 'Débit' : isRecharge ? 'Recharge' : tx.type === 'refund' ? 'Remboursement' : tx.type === 'bonus' ? 'Bonus' : tx.type}
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
        <div style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F0F2F5', marginBottom: 24 }}>👤 Mon profil</h3>

          {!editProfile ? (
            <div style={{ background: '#0D1117', border: '1px solid #1A2332', borderRadius: 16, padding: 24 }}>
              {[
                { label: 'Prénom', value: membre.prenom },
                { label: 'Nom', value: membre.nom },
                { label: 'Email', value: membre.email },
                { label: 'Téléphone', value: membre.telephone || '—' },
                { label: 'Rôle', value: membre.role === 'admin' ? '⚙️ Administrateur' : '💎 Membre ABAWI+' },
                { label: 'Abonnement', value: isAdmin ? 'Accès total (admin)' : isActive ? `Actif — expire le ${new Date(membre.date_fin).toLocaleDateString('fr-FR')}` : 'Expiré' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: '0.88rem', color: '#F0F2F5', fontWeight: 500, textAlign: 'right', flex: 1, marginLeft: 16 }}>{value}</span>
                </div>
              ))}
              <button
                onClick={() => { setProfileData({ prenom: membre.prenom, nom: membre.nom, telephone: membre.telephone || '' }); setEditProfile(true) }}
                style={{ marginTop: 20, width: '100%', padding: '11px', borderRadius: 10, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.25)', color: '#F0B429', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif' }}
              >
                ✏️ Modifier mon profil
              </button>
            </div>
          ) : (
            <div style={{ background: '#0D1117', border: '1px solid #1A2332', borderRadius: 16, padding: 24 }}>
              {[
                { key: 'prenom', label: 'Prénom' },
                { key: 'nom', label: 'Nom' },
                { key: 'telephone', label: 'Téléphone' },
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8B95A5', marginBottom: 6 }}>{label}</label>
                  <input
                    value={profileData[key] || ''}
                    onChange={e => setProfileData(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#070B0F', border: '1px solid #1A2332', color: '#F0F2F5', fontSize: '0.88rem', outline: 'none', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={saveProfile} disabled={savingProfile} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #F0B429, #e5a820)', border: 'none', color: '#070B0F', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  {savingProfile ? 'Sauvegarde...' : '✅ Sauvegarder'}
                </button>
                <button onClick={() => setEditProfile(false)} style={{ padding: '11px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #1A2332', color: '#8B95A5', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div style={{ marginTop: 24, padding: 18, borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, marginBottom: 10 }}>Zone de déconnexion</div>
            <button onClick={logout} style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>
              🚪 Se déconnecter
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default Membre

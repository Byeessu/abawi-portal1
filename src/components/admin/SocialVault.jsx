import { useEffect, useState } from 'react'
import {
  encryptVault, decryptVault,
  loadVaultBlob, saveVaultBlob, clearVaultBlob,
} from '../../lib/cryptoVault'

const DEFAULT_ACCOUNTS = [
  { id: 'instagram', label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/abawi' },
  { id: 'facebook', label: 'Facebook', icon: '📘', url: 'https://www.facebook.com/abawi' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', url: 'https://www.tiktok.com/@abawi_sn' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', url: 'https://www.linkedin.com/company/abawi' },
]

export default function SocialVault({ showToast }) {
  const [blob, setBlob] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const [master, setMaster] = useState('')
  const [masterConfirm, setMasterConfirm] = useState('')
  const [accounts, setAccounts] = useState(
    DEFAULT_ACCOUNTS.map(a => ({ ...a, email: '', password: '', notes: '' }))
  )
  const [reveal, setReveal] = useState({})
  const [busy, setBusy] = useState(false)
  const [autoLockMin, setAutoLockMin] = useState(10)

  useEffect(() => {
    const b = loadVaultBlob()
    setBlob(b)
  }, [])

  // Auto-lock après inactivité
  useEffect(() => {
    if (!unlocked) return
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => lock(), autoLockMin * 60 * 1000)
    }
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, autoLockMin])

  function lock() {
    setUnlocked(false)
    setMaster('')
    setReveal({})
    setAccounts(DEFAULT_ACCOUNTS.map(a => ({ ...a, email: '', password: '', notes: '' })))
    showToast?.('🔒 Coffre verrouillé')
  }

  async function handleUnlock() {
    if (!master) return
    setBusy(true)
    try {
      const data = await decryptVault(blob, master)
      if (Array.isArray(data?.accounts)) {
        const merged = DEFAULT_ACCOUNTS.map(def => {
          const saved = data.accounts.find(a => a.id === def.id)
          return saved ? { ...def, ...saved } : { ...def, email: '', password: '', notes: '' }
        })
        setAccounts(merged)
      }
      setUnlocked(true)
      showToast?.('🔓 Coffre déverrouillé')
    } catch (e) {
      showToast?.(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate() {
    if (master !== masterConfirm) {
      showToast?.('Les mots de passe maîtres ne correspondent pas', 'error')
      return
    }
    if (master.length < 8) {
      showToast?.('Mot de passe maître trop court (8+ caractères)', 'error')
      return
    }
    setBusy(true)
    try {
      const vault = await encryptVault({ accounts }, master)
      saveVaultBlob(vault)
      setBlob(vault)
      setUnlocked(true)
      setMasterConfirm('')
      showToast?.('✅ Coffre créé et déverrouillé')
    } catch (e) {
      showToast?.(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    setBusy(true)
    try {
      const vault = await encryptVault({ accounts }, master)
      saveVaultBlob(vault)
      setBlob(vault)
      showToast?.('💾 Identifiants chiffrés et sauvegardés')
    } catch (e) {
      showToast?.(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!confirm('⚠️ Supprimer tout le coffre ? Les identifiants seront définitivement perdus.')) return
    clearVaultBlob()
    setBlob(null)
    setUnlocked(false)
    setMaster('')
    setMasterConfirm('')
    showToast?.('🗑️ Coffre supprimé')
  }

  function updateAccount(id, field, value) {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)))
  }

  function copyPwd(id, pwd) {
    if (!pwd) return
    try {
      navigator.clipboard.writeText(pwd)
      showToast?.(`📋 Mot de passe ${id} copié`)
    } catch {
      showToast?.('Copie impossible', 'error')
    }
  }

  // ───────── Rendu ─────────
  const style = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 },
    input: { width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    btn: { padding: '10px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
    btnPri: { background: 'linear-gradient(135deg, #F0B429, #F59E0B)', color: '#0a0a0a', boxShadow: '0 4px 14px rgba(240,180,41,0.3)' },
    btnSec: { background: 'rgba(128,128,128,0.08)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    btnDanger: { background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' },
  }

  return (
    <section style={style.card}>
      <header style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🔐 Coffre-fort — Comptes sociaux
        </h2>
        <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          Les identifiants sont chiffrés localement (AES-GCM + PBKDF2) avec un mot de passe maître.
          Rien n'est envoyé sur le serveur ni stocké en clair. En cas de perte du mot de passe
          maître, le coffre est irrécupérable.
        </p>
      </header>

      {!blob && !unlocked && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 8, color: 'var(--gold)', fontSize: '0.82rem' }}>
            💡 Aucun coffre existant — créez-en un pour stocker vos identifiants en toute sécurité.
          </div>
          <div>
            <label style={style.label}>Mot de passe maître (8+ caractères)</label>
            <input type="password" value={master} onChange={(e) => setMaster(e.target.value)} style={style.input} autoComplete="new-password" />
          </div>
          <div>
            <label style={style.label}>Confirmer</label>
            <input type="password" value={masterConfirm} onChange={(e) => setMasterConfirm(e.target.value)} style={style.input} autoComplete="new-password" />
          </div>
          <button onClick={handleCreate} disabled={busy} style={{ ...style.btn, ...style.btnPri, opacity: busy ? 0.6 : 1 }}>
            {busy ? '⏳ Création…' : '🔐 Créer le coffre'}
          </button>
        </div>
      )}

      {blob && !unlocked && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={style.label}>Mot de passe maître</label>
            <input
              type="password" value={master}
              onChange={(e) => setMaster(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              style={style.input}
              autoComplete="current-password"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleUnlock} disabled={busy || !master} style={{ ...style.btn, ...style.btnPri, opacity: (busy || !master) ? 0.6 : 1 }}>
              {busy ? '⏳ Déverrouillage…' : '🔓 Déverrouiller'}
            </button>
            <button onClick={handleReset} style={{ ...style.btn, ...style.btnDanger }}>
              🗑️ Réinitialiser
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
            Coffre créé le {new Date(blob.updatedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}

      {unlocked && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.12)', color: 'var(--green)', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700 }}>
              🔓 Déverrouillé
            </span>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Auto-verrouillage
              <select value={autoLockMin} onChange={(e) => setAutoLockMin(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
              </select>
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={busy} style={{ ...style.btn, ...style.btnPri, opacity: busy ? 0.6 : 1 }}>
                💾 Enregistrer
              </button>
              <button onClick={lock} style={{ ...style.btn, ...style.btnSec }}>
                🔒 Verrouiller
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {accounts.map((a) => (
              <div key={a.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.3rem' }}>{a.icon}</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{a.label}</strong>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', fontSize: '0.78rem', marginLeft: 'auto' }}>
                      Ouvrir ↗
                    </a>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={style.label}>Email / Identifiant</label>
                    <input
                      type="text"
                      value={a.email}
                      onChange={(e) => updateAccount(a.id, 'email', e.target.value)}
                      style={style.input}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label style={style.label}>Mot de passe</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type={reveal[a.id] ? 'text' : 'password'}
                        value={a.password}
                        onChange={(e) => updateAccount(a.id, 'password', e.target.value)}
                        style={{ ...style.input, flex: 1 }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setReveal(r => ({ ...r, [a.id]: !r[a.id] }))}
                        style={{ ...style.btn, ...style.btnSec, padding: '0 12px' }}
                        title={reveal[a.id] ? 'Masquer' : 'Révéler'}
                      >
                        {reveal[a.id] ? '🙈' : '👁️'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPwd(a.id, a.password)}
                        style={{ ...style.btn, ...style.btnSec, padding: '0 12px' }}
                        title="Copier"
                        disabled={!a.password}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={style.label}>Notes (optionnel)</label>
                  <input
                    type="text"
                    value={a.notes}
                    onChange={(e) => updateAccount(a.id, 'notes', e.target.value)}
                    placeholder="2FA activé, récupération, etc."
                    style={style.input}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            ℹ️ Pour publier : cliquez sur <strong>Ouvrir ↗</strong>, utilisez le bouton 📋 pour copier
            l'identifiant et le mot de passe, puis collez dans le formulaire de connexion.
            L'auto-verrouillage déclenche après {autoLockMin} min d'inactivité.
          </div>
        </div>
      )}
    </section>
  )
}

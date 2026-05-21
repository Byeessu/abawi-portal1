import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!localStorage.getItem('abawi_app_installed') && !localStorage.getItem('abawi_install_dismissed')) {
        setTimeout(() => setShow(true), 30000)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem('abawi_app_installed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16,
      zIndex: 8999, maxWidth: 400, margin: '0 auto',
      background: 'var(--bg-card)', border: '1px solid var(--accent)',
      borderRadius: 16, padding: 20,
      boxShadow: '0 20px 48px var(--shadow)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <style>{`@keyframes abawiBadgeSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: -2, borderRadius: '50%',
            background: 'conic-gradient(from 0deg,#18A84A 0deg,#F0B429 120deg,#6366F1 240deg,#18A84A 360deg)',
            animation: 'abawiBadgeSpin 5s linear infinite',
            filter: 'blur(0.8px)',
          }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/favicon-abawi-64.webp" alt="ABAWI" loading="lazy" decoding="async" style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              transform: 'scale(1.30)',
            }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2, fontFamily: 'Outfit, sans-serif' }}>
            Installer l'app ABAWI
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
            Accédez à vos outils ABAWI en un clic, même hors connexion.
          </div>
        </div>
        <button onClick={() => setShow(false)} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem',
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={install} style={{
          flex: 1, padding: 12, borderRadius: 10,
          background: 'var(--accent)',
          border: 'none', color: 'var(--accent-text)', fontWeight: 800,
          cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif',
        }}>
          📱 Installer
        </button>
        <button onClick={() => { setShow(false); localStorage.setItem('abawi_install_dismissed', '1') }} style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif',
        }}>Plus tard</button>
      </div>
    </div>
  )
}

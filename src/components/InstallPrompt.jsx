import { useState, useEffect } from 'react'

/**
 * Prompt d'installation PWA
 * Invite l'utilisateur à installer l'app sur son appareil
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Détecter iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    // Écouter l'installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Afficher automatiquement après 30 secondes sur iOS
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        if (!isInstalled) setIsVisible(true)
      }, 30000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('✅ Installation acceptée')
    } else {
      console.log('❌ Installation refusée')
    }

    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Sauvegarder la préférence
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  if (!isVisible || isInstalled) return null

  // Vérifier si l'utilisateur a déjà refusé récemment (moins de 7 jours)
  const dismissed = localStorage.getItem('installPromptDismissed')
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--accent)',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 10000,
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          🚀
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '700' }}>
            Installer ABAWI
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isIOS
              ? 'Ajoutez à l\'écran d\'accueil pour un accès rapide'
              : 'Installez l\'application pour l\'utiliser hors ligne'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0',
            color: 'var(--text-muted)',
          }}
        >
          ×
        </button>
      </div>

      {isIOS ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>1.</strong> Appuyez sur le bouton <strong>Partager</strong>{' '}
            <span style={{ fontSize: '1.2rem' }}>⎋</span>
          </p>
          <p style={{ margin: 0 }}>
            <strong>2.</strong> Sélectionnez{' '}
            <strong>"Sur l'écran d'accueil"</strong>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleInstall}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.95rem',
            }}
          >
            📲 Installer
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Plus tard
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

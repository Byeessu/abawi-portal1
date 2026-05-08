import { useState, useEffect, useCallback, useRef, Component } from 'react';
import './FullscreenButton.css';
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'

class FullscreenSafeBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error) {
    if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
      console.warn('[FullscreenButton] suppressed error:', error)
    }
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function safeDecodePath(p) {
  try { return decodeURIComponent(p || '') } catch { return p || '' }
}

// Label lisible depuis le pathname
function pathLabel(p) {
  const map = {
    '/outils/cv': 'CV Pro',
    '/outils/lettre': 'Lettre de motivation',
    '/outils/business-plan': 'Business Plan',
    '/outils/pitch': 'Pitch Deck',
    '/outils/facture': 'Facture Pro',
    '/outils/analyse-cv': 'Analyse CV',
    '/outils/dictionnaire-elite': 'Dictionnaire Élite',
    '/outils/translator-elite': 'Traducteur Élite',
    '/outils/infographie-pro': 'Infographie Pro',
    '/outils/photo-studio-pro': 'Photo Studio',
    '/outils/finance': 'Finance Élite',
    '/outils/juridique': 'Juridique Élite',
    '/outils/comptable': 'Comptable Élite',
    '/outils/rh': 'RH Élite',
    '/outils/immobilier': 'Immobilier Élite',
    '/outils/consultant': 'Consultant Élite',
    '/outils/abawi-ia': 'ABAWI IA',
    '/outils/exegetika': 'Exegetika',
    '/outils/sante': 'ABAWI Santé',
    '/outils/autoroute': 'AutoRoute',
    '/outils/editeur-pro': 'Éditeur Pro',
    '/outils/smart-word-editor': 'Smart Word',
    '/outils/maxavis': 'MaxAvis Élite',
    '/outils/studio-design-pro': 'Studio Design',
    '/outils/studio-logo-ia': 'Studio Logo IA',
    '/outils/tontine': 'Tontine Pro',
    '/outils': 'Outils ABAWI',
    '/abawi360/crm': 'CRM 360',
    '/abawi360/marketing': 'Marketing 360',
    '/abawi360/planification': 'Planification',
    '/abawi360/statistiques': 'Statistiques',
    '/store': 'Store IT',
  }
  return map[p] || safeDecodePath(p)
}

export default function FullscreenButton(props) {
  return (
    <FullscreenSafeBoundary>
      <FullscreenButtonInner {...props} />
    </FullscreenSafeBoundary>
  )
}

function FullscreenButtonInner({ targetSelector, position = 'bottom-right' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dockTimer = useRef(null)
  const [dockVisible, setDockVisible] = useState(true)

  // Determine si on est sur une page "outil" (affichage étendu du bouton)
  const isToolPage = (
    location.pathname.startsWith('/outils') ||
    location.pathname.startsWith('/abawi360') ||
    location.pathname.startsWith('/store') ||
    location.pathname.startsWith('/abawi-pay') ||
    location.pathname.startsWith('/abavie')
  )

  useEffect(() => {
    const handler = () => {
      const el = document.fullscreenElement || document.webkitFullscreenElement
      setIsFullscreen(!!el)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const enter = useCallback(() => {
    // On cible toujours documentElement pour que le dock reste dans le fullscreen
    const el = document.documentElement
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    if (req) {
      try {
        const p = req.call(el)
        if (p && typeof p.then === 'function') p.catch(() => {})
      } catch {}
    }
  }, [])

  const exit = useCallback(() => {
    const fn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen
    if (fn) {
      try {
        const p = fn.call(document)
        if (p && typeof p.then === 'function') p.catch(() => {})
      } catch {}
    }
  }, [])

  const toggle = useCallback(() => {
    if (isFullscreen) exit()
    else enter()
  }, [isFullscreen, enter, exit])

  // Auto-hide dock après 3s d'inactivité
  useEffect(() => {
    if (!isFullscreen) return
    const reveal = () => {
      setDockVisible(true)
      if (dockTimer.current) clearTimeout(dockTimer.current)
      dockTimer.current = setTimeout(() => setDockVisible(false), 3000)
    }
    reveal()
    window.addEventListener('mousemove', reveal)
    window.addEventListener('keydown', reveal)
    window.addEventListener('touchstart', reveal, { passive: true })
    return () => {
      window.removeEventListener('mousemove', reveal)
      window.removeEventListener('keydown', reveal)
      window.removeEventListener('touchstart', reveal)
      if (dockTimer.current) clearTimeout(dockTimer.current)
    }
  }, [isFullscreen])

  // Ctrl/Cmd + Shift + F bascule. Échap géré nativement par le browser.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const posStyle = {
    'top-right': { top: 72, right: 16 },
    'top-left': { top: 72, left: 16 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  }[position] || { bottom: 20, right: 20 }

  // Bouton trigger (hors fullscreen)
  const trigger = !isFullscreen && (
    isToolPage ? (
      <button
        onClick={toggle}
        title="Mode Projection (Ctrl+Shift+F)"
        aria-label="Plein écran - Mode Projection"
        className="fullscreen-btn fullscreen-btn--pill"
        style={posStyle}
      >
        <FsIcon enter />
        <span className="fullscreen-btn__label">Projection</span>
      </button>
    ) : (
      <button
        onClick={toggle}
        title="Mode Projection (Ctrl+Shift+F)"
        aria-label="Plein écran"
        className="fullscreen-btn"
        style={posStyle}
      >
        <FsIcon enter />
      </button>
    )
  )

  if (!isFullscreen) return trigger

  const toolName = pathLabel(location?.pathname)

  // Dock de navigation en plein écran
  const dock = (
    <div
      className="fullscreen-dock"
      style={{
        transform: `translateX(-50%) translateY(${dockVisible ? '0' : 'calc(-100% - 20px)'})`,
        opacity: dockVisible ? 1 : 0,
        pointerEvents: dockVisible ? 'auto' : 'none',
      }}
      onMouseEnter={() => {
        setDockVisible(true)
        if (dockTimer.current) clearTimeout(dockTimer.current)
      }}
      onMouseLeave={() => {
        if (dockTimer.current) clearTimeout(dockTimer.current)
        dockTimer.current = setTimeout(() => setDockVisible(false), 1500)
      }}
    >
      {/* Navigation */}
      <DockBtn title="Précédent" onClick={() => navigate(-1)} icon={<ArrowIcon dir="left" />} />
      <DockBtn title="Suivant" onClick={() => navigate(1)} icon={<ArrowIcon dir="right" />} />
      <DockSep />
      <DockBtn title="Accueil" onClick={() => navigate('/')} icon={<HomeIcon />} />
      <DockBtn title="Outils" onClick={() => navigate('/outils')} icon={<ToolsIcon />} />
      <DockBtn title="Recharger" onClick={() => window.location.reload()} icon={<ReloadIcon />} />
      <DockSep />
      {/* Nom de l'outil actif */}
      <span className="dock-tool-name">{toolName}</span>
      <DockSep />
      {/* Bouton sortie — bien visible et labelisé */}
      <button
        onClick={exit}
        title="Quitter le plein écran (Échap)"
        aria-label="Quitter le plein écran"
        className="dock-exit-btn"
      >
        <FsIcon enter={false} />
        <span>Quitter</span>
      </button>
    </div>
  )

  const portalTarget =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.body
  return createPortal(dock, portalTarget)
}

function DockBtn({ icon, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="dock-btn"
    >
      {icon}
    </button>
  )
}

function DockSep() {
  return <span aria-hidden className="dock-sep" />
}

function FsIcon({ enter }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {enter ? (
        <>
          <path d="M3 9V5a2 2 0 0 1 2-2h4" />
          <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
          <path d="M3 15v4a2 2 0 0 0 2 2h4" />
          <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
        </>
      ) : (
        <>
          <path d="M9 3H5a2 2 0 0 0-2 2v4" />
          <path d="M15 3h4a2 2 0 0 1 2 2v4" />
          <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
          <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
        </>
      )}
    </svg>
  )
}

function ArrowIcon({ dir }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'right' ? 'rotate(180deg)' : undefined }}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10" />
    </svg>
  )
}

function ToolsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="3" width="6" height="6" rx="1" />
      <rect x="16" y="3" width="6" height="6" rx="1" />
      <rect x="2" y="10" width="6" height="6" rx="1" />
      <rect x="9" y="10" width="6" height="6" rx="1" />
      <rect x="16" y="10" width="6" height="6" rx="1" />
      <rect x="2" y="17" width="6" height="6" rx="1" />
      <rect x="9" y="17" width="6" height="6" rx="1" />
      <rect x="16" y="17" width="6" height="6" rx="1" />
    </svg>
  )
}

function ReloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

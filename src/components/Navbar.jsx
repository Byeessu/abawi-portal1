import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess } from '../lib/permissions'
import TopBanner from './TopBanner'
import SearchOverlay from './SearchOverlay'
import './Navbar.css'
import Logo360 from './Logo360'
import ThemeSwitcher from './ThemeSwitcher'
import CreditWidget from './CreditWidget'
import Search from './Search'

function NavAbawiPlusMark() {
  const gid = 'nav-aplus-grad'
  return (
    <svg width="18" height="18" viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#e5a820" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill={`url(#${gid})`} />
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <path d="M20 11v18M11 20h18" stroke="#0c0a06" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function AnnahPremiumIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="annah-premium-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#annah-premium-grad)" opacity="0.95" />
      <path d="M8 15.2V9.1M12 16.8V7.2M16 14.4v-4.8" stroke="#231605" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  )
}

function AbawiPayNavIcon({ size = 16 }) {
  const r = Math.round(size * 0.2)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: r,
      background: '#0a0a0a', overflow: 'hidden', flexShrink: 0,
      verticalAlign: 'middle',
    }}>
      <img
        src="/abawi-pay-icon.jpg"
        width={size}
        height={size}
        alt=""
        style={{
          display: 'block', objectFit: 'cover',
          filter: 'grayscale(1) invert(1) sepia(1) saturate(5) hue-rotate(5deg) brightness(1.35)',
        }}
      />
    </span>
  )
}

function AbavieNavIcon({ size = 16 }) {
  const r = Math.round(size * 0.22)
  /* Symbole original ABAWI — image réelle avec filtre CSS :
     invert + grayscale + brightness rend le symbole clair sur fond vert.
     mix-blend-mode:screen fait disparaître le fond blanc de l'image
     en le fusionnant avec le vert du conteneur. */
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: r,
      background: '#18A84A', overflow: 'hidden', flexShrink: 0,
      border: '1px solid rgba(24,168,74,0.5)', verticalAlign: 'middle',
    }}>
      <img
        src="/abawi-pay-icon.jpg"
        width={size}
        height={size}
        alt=""
        style={{
          display: 'block', objectFit: 'cover',
          filter: 'invert(1) grayscale(1) brightness(2)',
          mixBlendMode: 'screen',
        }}
      />
    </span>
  )
}

const NAV_LINKS = [
  { path: '/', label: 'Accueil' },
  { path: '/digital', label: 'Guides' },
  { path: '/academy', label: 'Academy' },
  { path: '/podcasts', label: 'Podcasts' },
  { path: '/outils', label: 'Outils & IA' },
  { path: '/abawi360', label: 'Abawi 360', is360: true },
  { path: '/store', label: 'Store IT' },
  { path: '/news', label: 'News' },
]

function AnnahRescueBtn() {
  const [expanded, setExpanded] = useState(false)
  const [hidden, setHidden] = useState(false)
  const timerRef = useRef(null)

  const collapse = useCallback(() => {
    timerRef.current = setTimeout(() => setExpanded(false), 3000)
  }, [])

  function toggle(e) {
    e.preventDefault()
    clearTimeout(timerRef.current)
    if (expanded) {
      setExpanded(false)
    } else {
      setExpanded(true)
      collapse()
    }
  }

  if (hidden) return null

  return (
    <div className={`nav-annah-rescue${expanded ? ' nav-annah-rescue--expanded' : ''}`} role="group" aria-label="Assistant Annah">
      {/* Bouton fermer — visible seulement quand expanded */}
      {expanded && (
        <button
          className="nav-annah-close"
          onClick={() => setHidden(true)}
          title="Masquer"
          aria-label="Masquer Annah"
        >×</button>
      )}
      {/* Icône toujours visible */}
      <button className="nav-annah-icon-btn" onClick={toggle} title={expanded ? 'Réduire' : 'Ouvrir Annah'}>
        <AnnahPremiumIcon size={18} />
      </button>
      {/* Label + lien — visible seulement quand expanded */}
      {expanded && (
        <Link to="/outils/abawi-ia#annah" className="nav-annah-label">
          <span>Annah</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      )}
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [bannerVisible] = useState(
    () => sessionStorage.getItem('abawi_banner_closed') !== 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navOverflows, setNavOverflows] = useState(false)
  const navInnerRef = useRef(null)
  const location = useLocation()
  const { membre, isAdmin } = useAuth()
  const initials = membre ? ((membre.prenom?.[0] || '') + (membre.nom?.[0] || '')).toUpperCase() : null
  const bannerHeight = bannerVisible ? 28 : 0

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--navbar-total-h', `${60 + bannerHeight}px`)
  }, [bannerHeight])

  useEffect(() => {
    const el = navInnerRef.current
    if (!el) return
    const check = () => {
      // nav-links a flex:1 + overflow:hidden → son overflow interne ne remonte
      // pas dans le scrollWidth du parent. On compare le bord droit du dernier
      // enfant visible avec le bord droit du conteneur nav-links.
      const links = el.querySelector('.nav-links')
      if (!links) { setNavOverflows(false); return }
      const items = [...links.children].filter(c => c.offsetParent !== null)
      if (!items.length) { setNavOverflows(false); return }
      const containerRight = links.getBoundingClientRect().right
      const lastRight = items[items.length - 1].getBoundingClientRect().right
      setNavOverflows(lastRight > containerRight + 1)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    window.addEventListener('resize', check, { passive: true })
    return () => { ro.disconnect(); window.removeEventListener('resize', check) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target && e.target.tagName) || ''
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !e.target?.isContentEditable) {
          e.preventDefault()
          setSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const isActive = (path) => location.pathname === path || (path === '/abawi360' && location.pathname.startsWith('/abawi360'))
  const plusActive = location.pathname.startsWith('/digital/pack/abawi-plus')
  const payActive = location.pathname.startsWith('/abawi-pay')
  const abavieActive = location.pathname.startsWith('/abavie')

  return (
    <>
      <div className="nav-shell">
        {bannerVisible && <TopBanner />}

        <nav className={`nav-bar ${scrolled ? 'is-scrolled' : ''}`}>
          <div ref={navInnerRef} className={`nav-inner ${navOverflows ? 'nav-overflow' : ''}`}>

            <Link to="/" className="nav-logo" aria-label="Accueil ABAWI">
              <span className="nav-logo-ring" aria-hidden="true" />
              <img src="/abawi-logo.png" alt="ABAWI" className="nav-logo-img" />
            </Link>

            <div className="nav-links">
              {NAV_LINKS.map(link => {
                const active = isActive(link.path)
                if (link.is360) {
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`nav-chip-360 ${active ? 'is-active' : ''}`}
                    >
                      <Logo360 size={16} />
                      {link.label}
                    </Link>
                  )
                }
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`nav-link ${active ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </Link>
                )
              })}

              <Link
                to="/digital/pack/abawi-plus"
                className={`nav-chip-plus ${plusActive ? 'is-active' : ''}`}
                title="ABAWI+ Premium"
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  <NavAbawiPlusMark />
                </span>
                <span className="nav-chip-plus-label">ABAWI+</span>
              </Link>

              <Link
                to="/abawi-pay"
                className={`nav-chip-pay ${payActive ? 'is-active' : ''}`}
                title="Abawi Pay"
              >
                <AbawiPayNavIcon size={14} />
                <span>AbawiPay</span>
              </Link>

              <Link
                to="/abavie"
                className={`nav-chip-abavie${abavieActive ? ' is-active' : ''}`}
                title="Abavie"
              >
                <AbavieNavIcon size={14} />
                <span>Abavie</span>
              </Link>

              {canAccess(membre, 'admin-panel') && (
                <Link to="/admin" className="nav-chip-admin">👑 ADMIN</Link>
              )}
            </div>

            <div className="nav-actions">
              <button
                className={`nav-burger ${mobileOpen ? 'is-open' : ''}`}
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileOpen}
              >
                <span /><span /><span />
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className="nav-icon-btn nav-search-btn"
                aria-label="Rechercher"
                title="Rechercher (Ctrl+K)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <kbd className="nav-search-kbd">⌘K</kbd>
              </button>

              <ThemeSwitcher />
              <CreditWidget />

              {membre ? (
                <Link
                  to="/membre"
                  className={`nav-profile ${isAdmin ? 'nav-profile--admin' : 'nav-profile--member'}`}
                  title={isAdmin ? 'Admin' : 'Mon espace'}
                >
                  {initials}
                </Link>
              ) : (
                <Link to="/login" className="nav-login">Connexion</Link>
              )}
            </div>
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <>
          <div className="nav-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="nav-drawer" role="dialog" aria-modal="true">
            <div className="nav-drawer-head">
              <div className="nav-drawer-title">Navigation</div>
              <button
                className="nav-icon-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>

            <div className="nav-drawer-body">
              <div className="nav-drawer-section-title">Pages</div>
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path)
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`nav-drawer-link ${active ? 'is-active' : ''}`}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {link.is360 ? <Logo360 size={18} /> : null}
                      {link.label}
                    </span>
                    <span className="nav-drawer-link-arrow">→</span>
                  </Link>
                )
              })}

              <div className="nav-drawer-section-title" style={{ marginTop: 8 }}>Premium</div>

              <Link
                to="/digital/pack/abawi-plus"
                onClick={() => setMobileOpen(false)}
                className="nav-drawer-link"
                style={{
                  background: 'linear-gradient(135deg, rgba(240,180,41,0.18), rgba(168,85,247,0.14))',
                  borderColor: 'rgba(240,180,41,0.45)',
                  color: '#ffe7a0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <NavAbawiPlusMark />
                  <span style={{ fontWeight: 900 }}>ABAWI+</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link
                to="/abawi-pay"
                onClick={() => setMobileOpen(false)}
                className="nav-drawer-link"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,197,24,0.16), rgba(0,200,83,0.1))',
                  borderColor: 'rgba(245,197,24,0.45)',
                  color: '#f5c518',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AbawiPayNavIcon size={18} />
                  <span style={{ fontWeight: 900 }}>AbawiPay</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link
                to="/abavie"
                onClick={() => setMobileOpen(false)}
                className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(24,168,74,0.16),rgba(24,168,74,0.08))', borderColor:'rgba(24,168,74,0.45)', color:'#18A84A' }}
              >
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <AbavieNavIcon size={18} />
                  <span style={{ fontWeight:900 }}>Abavie</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              {canAccess(membre, 'admin-panel') && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="nav-drawer-link is-active"
                >
                  <span>👑 ADMIN</span>
                  <span className="nav-drawer-link-arrow">→</span>
                </Link>
              )}

              <div className="nav-drawer-tip">
                💡 Astuce : utilise <strong>🔍 Rechercher</strong> pour accéder rapidement à n'importe quelle section.
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ height: `${bannerHeight + 60}px` }} />

      <AnnahRescueBtn />

      {searchOpen && <Search onClose={() => setSearchOpen(false)} />}
    </>
  )
}

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess } from '../lib/permissions'
import TopBanner from './TopBanner'
import './Navbar.css'
import Logo360 from './Logo360'
import ThemeSwitcher from './ThemeSwitcher'
import CreditWidget from './CreditWidget'
import Search from './Search'
import { AbTalkLogoSVG } from './clair/AbTalkLogoSVG'
import ArkelUpLogo from './icons/ArkelUpLogo'

// ─── Icons ────────────────────────────────────────────────────────────────────
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
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:size, height:size, borderRadius:r, background:'#0a0a0a', overflow:'hidden', flexShrink:0, verticalAlign:'middle' }}>
      <img src="/abawi-pay-icon.webp" width={size} height={size} alt=""
        style={{ display:'block', objectFit:'cover', filter:'grayscale(1) invert(1) sepia(1) saturate(3.2) hue-rotate(-5deg) brightness(1.12) contrast(1.05)' }} />
    </span>
  )
}

function AbavieNavIcon({ size = 16 }) {
  const r = Math.round(size * 0.22)
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:size, height:size, borderRadius:r, background:'#18A84A', overflow:'hidden', flexShrink:0, border:'1px solid rgba(24,168,74,0.5)', verticalAlign:'middle' }}>
      <img src="/abawi-pay-icon.webp" width={size} height={size} alt=""
        style={{ display:'block', objectFit:'cover', filter:'invert(1) grayscale(1) brightness(2)', mixBlendMode:'screen' }} />
    </span>
  )
}

function AbTalkNavIcon({ size = 16 }) {
  return <AbTalkLogoSVG size={size} />;
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { id:'home',    type:'link',   path:'/',                          label:'Accueil' },
  { id:'guides',  type:'link',   path:'/digital',                   label:'Guides' },
  { id:'academy', type:'link',   path:'/academy',                   label:'Academy' },
  { id:'podcast', type:'link',   path:'/podcasts',                  label:'Podcasts' },
  { id:'outils',  type:'link',   path:'/outils',                    label:'Outils & IA' },
  { id:'a360',    type:'360',    path:'/abawi360',                  label:'Abawi 360' },
  { id:'store',   type:'link',   path:'/store',                     label:'Store IT' },
  { id:'news',    type:'link',   path:'/news',                      label:'Actualités' },
  { id:'offres',  type:'link',   path:'/offres-commerciales',       label:'Offres' },
  { id:'catlog',  type:'link',   path:'/catalogue',                 label:'Catalogue' },
  { id:'plus',    type:'plus',   path:'/digital/pack/abawi-plus',   label:'ABAWI+' },
  { id:'pay',     type:'pay',    path:'/abawi-pay',                 label:'AbawiPay' },
  { id:'abavie',  type:'abavie', path:'/abavie',                    label:'Abavie' },
  { id:'abtalk',  type:'abtalk', path:'/abtalk',                    label:'AbTalk' },
  { id:'arkel',   type:'arkel',  path:'/arkel-up-center',           label:'Arkel Up' },
]

function itemIsActive(item, pathname) {
  if (item.type === '360')    return pathname.startsWith('/abawi360')
  if (item.type === 'plus')   return pathname.startsWith('/digital/pack/abawi-plus')
  if (item.type === 'pay')    return pathname.startsWith('/abawi-pay')
  if (item.type === 'abavie') return pathname.startsWith('/abavie')
  if (item.type === 'abtalk') return pathname.startsWith('/abtalk')
  if (item.type === 'arkel')  return pathname.startsWith('/arkel-up-center')
  if (item.type === 'admin')  return pathname.startsWith('/admin')
  return pathname === item.path
}

// Renders a single nav item (bar or measurement strip)
function NavItem({ item, active }) {
  switch (item.type) {
    case 'link':
      return <Link to={item.path} className={`nav-link ${active ? 'is-active' : ''}`}>{item.label}</Link>
    case '360':
      return (
        <Link to={item.path} className={`nav-chip-360 ${active ? 'is-active' : ''}`}>
          <Logo360 size={16} />{item.label}
        </Link>
      )
    case 'plus':
      return (
        <Link to={item.path} className={`nav-chip-plus ${active ? 'is-active' : ''}`} title="ABAWI+ Premium">
          <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center' }}><NavAbawiPlusMark /></span>
          <span className="nav-chip-plus-label">ABAWI+</span>
        </Link>
      )
    case 'pay':
      return (
        <Link to={item.path} className={`nav-chip-pay ${active ? 'is-active' : ''}`}>
          <AbawiPayNavIcon size={14} /><span>AbawiPay</span>
        </Link>
      )
    case 'abavie':
      return (
        <Link to={item.path} className={`nav-chip-abavie ${active ? 'is-active' : ''}`}>
          <AbavieNavIcon size={14} /><span>Abavie</span>
        </Link>
      )
    case 'abtalk':
      return (
        <Link to={item.path} className={`nav-chip-abtalk ${active ? 'is-active' : ''}`}>
          <AbTalkNavIcon size={14} /><span>AbTalk</span>
        </Link>
      )
    case 'arkel':
      return (
        <Link to={item.path} className={`nav-chip-arkel ${active ? 'is-active' : ''}`}>
          <ArkelUpLogo variant="icon" size={52} />
        </Link>
      )
    case 'admin':
      return <Link to={item.path} className="nav-chip-admin">{item.label}</Link>
    default:
      return null
  }
}

// ─── Annah floating rescue ────────────────────────────────────────────────────
function AnnahRescueBtn() {
  const [expanded, setExpanded] = useState(false)
  const [hidden,   setHidden]   = useState(false)
  const timerRef = useRef(null)

  function toggle(e) {
    e.preventDefault()
    clearTimeout(timerRef.current)
    if (expanded) {
      setExpanded(false)
    } else {
      setExpanded(true)
      timerRef.current = setTimeout(() => setExpanded(false), 3000)
    }
  }

  if (hidden) return null
  return (
    <div className={`nav-annah-rescue${expanded ? ' nav-annah-rescue--expanded' : ''}`} role="group" aria-label="Assistant Annah">
      {expanded && (
        <button className="nav-annah-close" onClick={() => setHidden(true)} title="Masquer" aria-label="Masquer Annah">×</button>
      )}
      <button className="nav-annah-icon-btn" onClick={toggle} title={expanded ? 'Réduire' : 'Ouvrir Annah'}>
        <AnnahPremiumIcon size={18} />
      </button>
      {expanded && (
        <Link to="/outils/abawi-ia#annah" className="nav-annah-label">
          <span>Annah</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      )}
    </div>
  )
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled,      setScrolled]      = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [overflowFrom,  setOverflowFrom]  = useState(-1)   // -1 = all visible
  const [overflowOpen,  setOverflowOpen]  = useState(false)
  const [bannerVisible] = useState(() => sessionStorage.getItem('abawi_banner_closed') !== 'true')

  const navLinksRef = useRef(null)
  const measureStripRef = useRef(null)

  const location    = useLocation()
  const { pathname } = location
  const { membre, isAdmin } = useAuth()
  const initials = membre ? ((membre.prenom?.[0] || '') + (membre.nom?.[0] || '')).toUpperCase() : null
  const bannerHeight = bannerVisible ? 28 : 0

  // Build nav items (admin conditional)
  const navItems = useMemo(() => [
    ...ALL_NAV_ITEMS,
    ...(canAccess(membre, 'admin-panel') ? [{ id:'admin', type:'admin', path:'/admin', label:'👑 Admin' }] : []),
  ], [membre])

  const visibleItems  = overflowFrom < 0 ? navItems : navItems.slice(0, overflowFrom)
  const overflowItems = overflowFrom < 0 ? [] : navItems.slice(overflowFrom)

  // Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // CSS variable for navbar height
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--navbar-total-h', `${60 + bannerHeight}px`)
  }, [bannerHeight])

  // Priority-overflow calculation — robust: reads children from measure-strip ref
  useLayoutEffect(() => {
    const container = navLinksRef.current
    const strip = measureStripRef.current
    if (!container || !strip) return

    const GAP = 2

    const recalc = () => {
      const containerW = container.clientWidth
      if (containerW === 0) { setOverflowFrom(-1); return }

      const children = strip.children
      const widths = []
      for (let i = 0; i < navItems.length; i++) {
        const el = children[i]
        widths.push((el ? el.getBoundingClientRect().width : 80) + GAP)
      }

      const total = widths.reduce((s, w) => s + w, 0)
      if (total <= containerW + 2) {
        setOverflowFrom(-1)
        return
      }

      // Measure real overflow button width from phantom element
      const overflowBtnEl = children[navItems.length]
      const overflowBtnW = (overflowBtnEl ? overflowBtnEl.getBoundingClientRect().width : 72) + GAP

      let used = overflowBtnW
      let count = 0
      for (let i = 0; i < widths.length; i++) {
        if (used + widths[i] <= containerW + 2) {
          used += widths[i]
          count++
        } else {
          break
        }
      }
      setOverflowFrom(count)
    }

    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(container)
    // Also listen to window resize for cases where flex siblings change size
    window.addEventListener('resize', recalc)
    return () => { ro.disconnect(); window.removeEventListener('resize', recalc) }
  }, [navItems])

  // Close everything on navigation
  useEffect(() => {
    Promise.resolve().then(() => setMobileOpen(false))
    Promise.resolve().then(() => setOverflowOpen(false))
  }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [mobileOpen])

  // Close overflow dropdown on Escape
  useEffect(() => {
    if (!overflowOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setOverflowOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overflowOpen])

  // Global keyboard shortcuts for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); setSearchOpen(true)
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName) || ''
        if (!['INPUT','TEXTAREA','SELECT'].includes(tag) && !e.target?.isContentEditable) {
          e.preventDefault(); setSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Full-screen tools — hide navbar entirely so they get 100vh
  const FULLSCREEN_TOOLS = ['/outils/studio-visuel-pro', '/outils/audio-studio']
  if (FULLSCREEN_TOOLS.includes(pathname)) return null

  return (
    <>
      <div className="nav-shell">
        {bannerVisible && <TopBanner />}

        <nav className={`nav-bar ${scrolled ? 'is-scrolled' : ''}`}>
          <div className="nav-inner">

            <Link to="/" className="nav-logo" aria-label="Accueil ABAWI">
              <span className="nav-logo-ring" aria-hidden="true" />
              <div className="nav-logo-img-wrap">
                <img src="/nav-logo-abawi.png" alt="ABAWI" className="nav-logo-img" loading="eager" decoding="async" />
              </div>
            </Link>

            {/* ── Priority-overflow nav links ── */}
            <div className="nav-links" ref={navLinksRef}>

              {/* Hidden measurement strip — always renders all items to measure their natural widths */}
              <div className="nav-measure-strip" ref={measureStripRef} aria-hidden="true">
                {navItems.map((item) => (
                  <span key={item.id} style={{ flexShrink:0, display:'inline-flex' }}>
                    <NavItem item={item} active={false} />
                  </span>
                ))}
                <span key="overflow-btn-phantom" style={{ flexShrink:0, display:'inline-flex' }}>
                  <button className="nav-overflow-btn" style={{ visibility:'hidden', position:'absolute' }}>
                    <span>•••</span>
                    <span className="nav-overflow-badge">0</span>
                  </button>
                </span>
              </div>

              {/* Visible items */}
              {visibleItems.map(item => (
                <NavItem key={item.id} item={item} active={itemIsActive(item, pathname)} />
              ))}

              {/* Overflow button + dropdown */}
              {overflowItems.length > 0 && (
                <div className="nav-overflow-wrap">
                  <button
                    className={`nav-overflow-btn ${overflowOpen ? 'is-open' : ''}`}
                    onClick={() => setOverflowOpen(v => !v)}
                    aria-label={`${overflowItems.length} pages de plus`}
                    aria-expanded={overflowOpen}
                    aria-haspopup="true"
                  >
                    <span>•••</span>
                    <span className="nav-overflow-badge">{overflowItems.length}</span>
                  </button>

                  {overflowOpen && (
                    <>
                      <div className="nav-overflow-backdrop" onClick={() => setOverflowOpen(false)} />
                      <div className="nav-overflow-dropdown" role="menu">
                        {overflowItems.map(item => (
                          <Link
                            key={item.id}
                            to={item.path}
                            className={`nav-overflow-item ${itemIsActive(item, pathname) ? 'is-active' : ''}`}
                            onClick={() => setOverflowOpen(false)}
                            role="menuitem"
                          >
                            <span className="nav-overflow-item-inner">
                              {item.type === '360'    && <Logo360 size={15} />}
                              {item.type === 'plus'   && <NavAbawiPlusMark />}
                              {item.type === 'pay'    && <AbawiPayNavIcon size={16} />}
                              {item.type === 'abavie' && <AbavieNavIcon size={16} />}
                              {item.type === 'abtalk' && <AbTalkNavIcon size={16} />}
                              {item.label}
                            </span>
                            {itemIsActive(item, pathname) && <span className="nav-overflow-active-dot" />}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Right actions ── */}
            <div className="nav-actions">
              {/* Burger — mobile only (handled by CSS < 640px) */}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
                  title={membre.prenom || (isAdmin ? 'Admin' : 'Mon espace')}
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

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div className="nav-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="nav-drawer" role="dialog" aria-modal="true">
            <div className="nav-drawer-head">
              <div className="nav-drawer-title">Navigation</div>
              <button className="nav-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu">✕</button>
            </div>

            <div className="nav-drawer-body">
              <div className="nav-drawer-section-title">Pages</div>
              {navItems.filter(item => !['plus','pay','abavie','abtalk','arkel','admin'].includes(item.type)).map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-drawer-link ${itemIsActive(item, pathname) ? 'is-active' : ''}`}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {item.type === '360' && <Logo360 size={18} />}
                    {item.label}
                  </span>
                  <span className="nav-drawer-link-arrow">→</span>
                </Link>
              ))}

              <div className="nav-drawer-section-title" style={{ marginTop:8 }}>Premium</div>

              <Link to="/digital/pack/abawi-plus" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(240,180,41,0.18),rgba(168,85,247,0.14))', borderColor:'rgba(240,180,41,0.45)', color:'#ffe7a0' }}>
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <NavAbawiPlusMark /><span style={{ fontWeight:900 }}>ABAWI+</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link to="/abawi-pay" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(212,175,55,0.16),rgba(0,200,83,0.1))', borderColor:'rgba(212,175,55,0.45)', color:'#D4AF37' }}>
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <AbawiPayNavIcon size={18} /><span style={{ fontWeight:900 }}>AbawiPay</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link to="/abavie" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(24,168,74,0.16),rgba(24,168,74,0.08))', borderColor:'rgba(24,168,74,0.45)', color:'#18A84A' }}>
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <AbavieNavIcon size={18} /><span style={{ fontWeight:900 }}>Abavie</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link to="/abtalk" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.18),rgba(2,132,199,0.10))', borderColor:'rgba(14,165,233,0.40)', color:'#38BDF8' }}>
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <AbTalkNavIcon size={18} /><span style={{ fontWeight:900 }}>AbTalk</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <Link to="/arkel-up-center" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ background:'linear-gradient(135deg,rgba(168,85,247,0.16),rgba(99,102,241,0.1))', borderColor:'rgba(168,85,247,0.45)', color:'#A855F7' }}>
                <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span>🏛️</span><span style={{ fontWeight:900 }}>Arkel Up Center</span>
                </span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              {canAccess(membre, 'admin-panel') && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="nav-drawer-link is-active">
                  <span>👑 ADMIN</span>
                  <span className="nav-drawer-link-arrow">→</span>
                </Link>
              )}

              <Link to="/docs" onClick={() => setMobileOpen(false)} className="nav-drawer-link"
                style={{ borderColor:'rgba(255,255,255,0.1)', color:'var(--text-secondary)' }}>
                <span>📚 Aide & Documentation</span>
                <span className="nav-drawer-link-arrow">→</span>
              </Link>

              <div className="nav-drawer-tip">
                💡 Astuce : utilise <strong>🔍 Rechercher</strong> pour accéder rapidement à n'importe quelle section.
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ height:`${Math.max(48, bannerHeight + 48)}px` }} />
      <AnnahRescueBtn />
      {searchOpen && <Search onClose={() => setSearchOpen(false)} />}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const CONSENT_KEY = 'abawi-cookie-consent'
const CONSENT_VERSION = '1.0'
const EXPIRY_MS = 12 * 30 * 24 * 60 * 60 * 1000 // 12 mois

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== CONSENT_VERSION) return null
    if (Date.now() - parsed.savedAt > EXPIRY_MS) return null
    return parsed
  } catch {
    return null
  }
}

// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function hasConsented(category) {
  const c = getConsent()
  return Boolean(c?.preferences?.[category])
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const c = getConsent()
    if (!c) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const save = (preferences) => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ version: CONSENT_VERSION, savedAt: Date.now(), preferences })
      )
    // eslint-disable-next-line no-empty -- Empty catch is intentional — failure is non-fatal here
    } catch {}
    setVisible(false)
  }

  const acceptAll = () => save({ necessary: true, analytics: true, marketing: true })
  const rejectOptional = () => save({ necessary: true, analytics: false, marketing: false })
  const saveCustom = () => save(prefs)

  if (!visible) return null

  return (
    <>
      <div className="cookie-backdrop" aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
        className="cookie-banner"
      >
        <div className="cookie-banner__inner">
          <div className="cookie-banner__content">
            <div className="cookie-banner__head">
              <span className="cookie-banner__icon" aria-hidden="true">🍪</span>
              <div>
                <h2 id="cookie-title" className="cookie-banner__title">
                  Vos préférences cookies
                </h2>
                <p id="cookie-desc" className="cookie-banner__desc">
                  Nous utilisons des cookies strictement nécessaires au fonctionnement du site et, avec votre
                  accord, des cookies pour améliorer votre expérience. Vous pouvez tout accepter, refuser les
                  optionnels ou personnaliser.{' '}
                  <Link to="/politique-cookies" className="cookie-banner__link">En savoir plus</Link>.
                </p>
              </div>
            </div>

            {showDetails && (
              <div className="cookie-banner__details">
                <label className="cookie-choice cookie-choice--disabled">
                  <input type="checkbox" checked disabled readOnly />
                  <div>
                    <strong>Strictement nécessaires</strong> <span className="cookie-badge">Toujours actifs</span>
                    <p>Session, authentification, panier, préférences thème. Indispensables au site.</p>
                  </div>
                </label>
                <label className="cookie-choice">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                  />
                  <div>
                    <strong>Analytique</strong>
                    <p>Mesure d'audience anonymisée pour améliorer le site. Non actif à ce jour.</p>
                  </div>
                </label>
                <label className="cookie-choice">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                  />
                  <div>
                    <strong>Marketing</strong>
                    <p>Publicité personnalisée. Non utilisé à ce jour.</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="cookie-banner__actions">
            {!showDetails ? (
              <>
                <button
                  type="button"
                  className="cookie-btn cookie-btn--ghost"
                  onClick={() => setShowDetails(true)}
                >
                  Personnaliser
                </button>
                <button
                  type="button"
                  className="cookie-btn cookie-btn--secondary"
                  onClick={rejectOptional}
                >
                  Refuser les optionnels
                </button>
                <button
                  type="button"
                  className="cookie-btn cookie-btn--primary"
                  onClick={acceptAll}
                >
                  Tout accepter
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="cookie-btn cookie-btn--ghost"
                  onClick={() => setShowDetails(false)}
                >
                  Retour
                </button>
                <button
                  type="button"
                  className="cookie-btn cookie-btn--primary"
                  onClick={saveCustom}
                >
                  Enregistrer mes choix
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cookie-backdrop {
          position: fixed; inset: 0; z-index: 99998;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(2px);
          animation: cookieFade 0.3s ease;
        }
        .cookie-banner {
          position: fixed; z-index: 99999;
          bottom: 16px; left: 16px; right: 16px;
          max-width: 880px; margin: 0 auto;
          background: var(--bg-card);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border));
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent);
          color: var(--text-primary);
          animation: cookieSlide 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cookie-banner__inner { padding: 20px 22px; display: grid; gap: 18px; }
        .cookie-banner__head { display: flex; gap: 14px; align-items: flex-start; }
        .cookie-banner__icon { font-size: 1.6rem; line-height: 1; }
        .cookie-banner__title { margin: 0 0 6px; font-size: 1rem; font-weight: 800; color: var(--text-primary); }
        .cookie-banner__desc { margin: 0; font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary); }
        .cookie-banner__link { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
        .cookie-banner__details {
          display: grid; gap: 10px; padding: 14px;
          background: color-mix(in srgb, var(--bg-secondary) 80%, transparent);
          border: 1px solid var(--border); border-radius: 10px;
        }
        .cookie-choice {
          display: flex; gap: 12px; align-items: flex-start; padding: 10px;
          border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: background 0.15s ease;
        }
        .cookie-choice:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }
        .cookie-choice--disabled { opacity: 0.75; cursor: default; }
        .cookie-choice input { margin-top: 4px; accent-color: var(--accent); }
        .cookie-choice strong { color: var(--text-primary); font-size: 0.88rem; }
        .cookie-choice p { margin: 4px 0 0; color: var(--text-muted); font-size: 0.78rem; }
        .cookie-badge {
          display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 100px;
          background: color-mix(in srgb, var(--accent2) 15%, transparent);
          color: var(--accent2); font-size: 0.66rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .cookie-banner__actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .cookie-btn {
          padding: 10px 18px; border-radius: 10px; border: 1px solid transparent;
          font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; font-family: inherit;
        }
        .cookie-btn--ghost {
          background: transparent; color: var(--text-secondary);
          border-color: var(--border);
        }
        .cookie-btn--ghost:hover { color: var(--text-primary); border-color: color-mix(in srgb, var(--text-primary) 30%, transparent); }
        .cookie-btn--secondary {
          background: color-mix(in srgb, var(--bg-secondary) 60%, transparent);
          color: var(--text-primary); border-color: var(--border);
        }
        .cookie-btn--secondary:hover { background: var(--bg-secondary); }
        .cookie-btn--primary {
          background: var(--accent); color: var(--text-on-accent, #0a0a0a);
          box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent);
        }
        .cookie-btn--primary:hover { transform: translateY(-1px); filter: brightness(1.1); }
        @keyframes cookieFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cookieSlide { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (max-width: 600px) {
          .cookie-banner { bottom: 8px; left: 8px; right: 8px; }
          .cookie-banner__inner { padding: 16px; }
          .cookie-banner__actions { justify-content: stretch; }
          .cookie-btn { flex: 1 1 auto; }
        }
      `}</style>
    </>
  )
}

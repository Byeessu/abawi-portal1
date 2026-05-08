import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AudioProvider } from './context/AudioContext'
import { ToastProvider } from './context/ToastContext'
import { FavProvider } from './context/FavContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initObservability } from './lib/observability'
import './index.css'
import './styles/theme-colors.css'
import './styles/theme-polish.css'
import App from './App.jsx'

// Initialisation de l'observabilité (Sentry, etc.)
initObservability()

// Cleanup: désenregistrer l'ancien /service-worker.js (legacy CRA) qui entrait en
// conflit avec /sw.js (VitePWA) enregistré dans index.html, créant une boucle
// "Nouvelle version disponible" à chaque chargement.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL
      if (scriptURL && scriptURL.endsWith('/service-worker.js')) {
        registration.unregister()
      }
    })
  })
}

// Global audio unlock for mobile browsers (autoplay policy)
document.addEventListener('touchstart', function unlockAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  ctx.resume().then(() => ctx.close())
  document.removeEventListener('touchstart', unlockAudio)
}, { once: true })

// Détection du mode hors ligne
window.addEventListener('offline', () => {
  console.log('📡 Mode hors ligne détecté')
})

window.addEventListener('online', () => {
  console.log('📡 Connexion rétablie')
})

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AudioProvider>
              <ToastProvider>
                <FavProvider>
                  <App />
                </FavProvider>
              </ToastProvider>
            </AudioProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

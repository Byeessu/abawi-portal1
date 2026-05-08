/**
 * Service Worker Registration
 * Enregistrement et gestion du Service Worker
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
)

export function register(config) {
  if ('serviceWorker' in navigator) {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`

    if (isLocalhost) {
      // En localhost, vérifier si le SW est valide
      checkValidServiceWorker(swUrl, config)
      navigator.serviceWorker.ready.then(() => {
        console.log('✅ Service Worker ready (localhost)')
      })
    } else {
      // Production: enregistrement direct
      registerValidSW(swUrl, config)
    }
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        if (installingWorker == null) {
          return
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nouveau contenu disponible
              console.log('🔄 Nouveau contenu disponible, veuillez rafraîchir.')
              if (config && config.onUpdate) {
                config.onUpdate(registration)
              }
            } else {
              // Première installation
              console.log('✅ Contenu mis en cache pour offline.')
              if (config && config.onSuccess) {
                config.onSuccess(registration)
              }
            }
          }
        }
      }
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error)
    })
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type')
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service Worker non trouvé, probablement pas de build
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload()
          })
        })
      } else {
        // Service Worker valide
        registerValidSW(swUrl, config)
      }
    })
    .catch(() => {
      console.log('⚠️ Pas de connexion internet. App en mode offline.')
    })
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

// Fonction pour forcer la mise à jour
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
    })
  }
}

// Fonction pour envoyer des messages au SW
export function sendMessageToSW(message) {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active Service Worker'))
      return
    }
    
    const channel = new MessageChannel()
    channel.port1.onmessage = (event) => {
      resolve(event.data)
    }
    
    navigator.serviceWorker.controller.postMessage(message, [channel.port2])
  })
}

// Fonction pour vérifier si une mise à jour est disponible
export function checkForUpdates() {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().then(() => {
          resolve(true)
        })
      })
    } else {
      resolve(false)
    }
  })
}

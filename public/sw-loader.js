// ── SW KILLSWITCH / AUTO-UPDATE ──────────────────────────────────────
// Force le remplacement de tout ancien service worker obsolète sans
// intervention manuelle de l'utilisateur.
(function () {
  if (!('serviceWorker' in navigator)) return
  var EXPECTED_VERSION = 'abawi-abavie-v9'
  var RELOAD_FLAG = 'abawi_sw_reloaded_v9'

  function getActiveSWVersion(reg) {
    return new Promise(function (resolve) {
      var sw = reg.active
      if (!sw) return resolve(null)
      var ch = new MessageChannel()
      var timer = setTimeout(function () { resolve(null) }, 1500)
      ch.port1.onmessage = function (e) {
        clearTimeout(timer)
        resolve(e.data && e.data.version)
      }
      try { sw.postMessage({ type: 'ABAVIE_GET_VERSION' }, [ch.port2]) } catch { resolve(null) }
    })
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) {
        console.log('[SW] Registered:', reg.scope)
        getActiveSWVersion(reg).then(function (v) {
          if (v && v !== EXPECTED_VERSION) {
            console.log('[SW] Version obsolète:', v, '→ nettoyage + reload')
            if ('caches' in window) {
              caches.keys().then(function (keys) {
                Promise.all(keys.map(function (k) { return caches.delete(k) }))
                  .then(function () { reg.update() })
              })
            }
            if (reg.waiting) reg.waiting.postMessage({ type: 'ABAVIE_SKIP_WAITING' })
            if (!sessionStorage.getItem(RELOAD_FLAG)) {
              sessionStorage.setItem(RELOAD_FLAG, '1')
              setTimeout(function () { window.location.reload() }, 500)
            }
          }
        })
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing
          if (!nw) return
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'ABAVIE_SKIP_WAITING' })
            }
          })
        })
      })
      .catch(function (err) { console.log('[SW] Error:', err) })

    var refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return
      refreshing = true
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      }
    })
  })
})()

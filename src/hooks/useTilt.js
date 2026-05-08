import { useEffect, useRef } from 'react'

/**
 * Effet de tilt 3D au survol (suivi de la souris).
 * Applique rotateX + rotateY + lueur dynamique.
 *
 * Options :
 *  - max         : degrés de tilt max (défaut 10)
 *  - perspective : perspective 3D en px (défaut 1000)
 *  - scale       : facteur de zoom au hover (défaut 1.03)
 *  - glare       : si true, ajoute une lueur qui suit la souris (défaut true)
 */
export function useTilt(options = {}) {
  const { max = 10, perspective = 1000, scale = 1.03, glare = true } = options
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Tilt nuisible au tactile, on l'évite
    if (window.matchMedia('(hover: none)').matches) return

    el.style.transformStyle = 'preserve-3d'
    el.style.transition = 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.willChange = 'transform'

    let glareEl = null
    if (glare) {
      glareEl = document.createElement('div')
      glareEl.style.cssText = `
        position: absolute; inset: 0; pointer-events: none;
        border-radius: inherit; opacity: 0;
        transition: opacity 0.2s ease;
        background: radial-gradient(circle at var(--gx,50%) var(--gy,50%),
          rgba(255,255,255,0.18), transparent 40%);
      `
      const cs = getComputedStyle(el)
      if (cs.position === 'static') el.style.position = 'relative'
      el.appendChild(glareEl)
    }

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rx = (0.5 - y) * max
      const ry = (x - 0.5) * max
      el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
      if (glareEl) {
        glareEl.style.setProperty('--gx', `${x * 100}%`)
        glareEl.style.setProperty('--gy', `${y * 100}%`)
        glareEl.style.opacity = '1'
      }
    }

    function onLeave() {
      el.style.transform = `perspective(${perspective}px) rotateX(0) rotateY(0) scale(1)`
      if (glareEl) glareEl.style.opacity = '0'
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (glareEl && glareEl.parentNode) glareEl.parentNode.removeChild(glareEl)
    }
  }, [max, perspective, scale, glare])

  return ref
}

export default useTilt

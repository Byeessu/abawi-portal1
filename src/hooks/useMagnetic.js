import { useEffect, useRef } from 'react'

/**
 * Effet magnétique : l'élément suit la souris au survol avec un amortissement.
 *
 * Options :
 *  - strength : intensité du déplacement (défaut 0.3)
 *  - radius   : rayon d'activation en px (défaut 120)
 */
export function useMagnetic(options = {}) {
  const { strength = 0.3, radius = 120 } = options
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return

    el.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.willChange = 'transform'

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) {
        el.style.transform = 'translate3d(0, 0, 0)'
        return
      }
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
    }

    function onLeave() {
      el.style.transform = 'translate3d(0, 0, 0)'
    }

    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength, radius])

  return ref
}

export default useMagnetic

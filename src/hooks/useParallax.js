import { useEffect, useRef } from 'react'

/**
 * Hook de parallaxe au scroll. Applique un translate3d Y proportionnel
 * au scroll, basé sur la position de l'élément dans le viewport.
 *
 * Options :
 *  - speed    : multiplicateur (0.2 = lent, 0.8 = rapide, négatif = direction inverse). Défaut 0.3
 *  - axis     : 'y' | 'x' (défaut 'y')
 *  - rotate   : degrés de rotation max au scroll (défaut 0)
 *  - scale    : true pour scale léger (défaut false)
 */
export function useParallax(options = {}) {
  const { speed = 0.3, axis = 'y', rotate = 0, scale = false } = options
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId = null
    let latestY = window.scrollY

    const update = () => {
      rafId = null
      const rect = el.getBoundingClientRect()
      const wh = window.innerHeight
      const progress = (latestY + wh - (rect.top + latestY)) / (wh + rect.height)
      const clamped = Math.max(0, Math.min(1, progress))
      const offset = (clamped - 0.5) * 200 * speed

      const parts = []
      if (axis === 'y') parts.push(`translate3d(0, ${offset}px, 0)`)
      else parts.push(`translate3d(${offset}px, 0, 0)`)
      if (rotate) parts.push(`rotate(${(clamped - 0.5) * rotate * 2}deg)`)
      if (scale) parts.push(`scale(${1 + (clamped - 0.5) * 0.1})`)

      el.style.transform = parts.join(' ')
    }

    const onScroll = () => {
      latestY = window.scrollY
      if (rafId == null) rafId = requestAnimationFrame(update)
    }

    el.style.willChange = 'transform'
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [speed, axis, rotate, scale])

  return ref
}

export default useParallax

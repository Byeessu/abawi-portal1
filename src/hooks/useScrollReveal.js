import { useEffect, useRef } from 'react'

/**
 * Hook d'apparition au scroll basé sur IntersectionObserver.
 * Usage simple :       const ref = useScrollReveal()
 * Usage avec options :  const ref = useScrollReveal({ threshold: 0.2, delay: 100 })
 *
 * Options :
 *  - threshold (0-1)  : % de visibilité pour déclencher (défaut 0.15)
 *  - rootMargin       : marge viewport (défaut '0px 0px -60px 0px')
 *  - delay (ms)       : délai d'animation (défaut 0)
 *  - direction        : 'up' | 'down' | 'left' | 'right' | 'scale' (défaut 'up')
 *  - distance (px)    : distance initiale (défaut 24)
 *  - duration (ms)    : durée d'animation (défaut 600)
 *  - once             : si true, ne se déclenche qu'une fois (défaut true)
 */
export function useScrollReveal(arg = {}) {
  const opts = typeof arg === 'number' ? { threshold: arg } : arg
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    delay = 0,
    direction = 'up',
    distance = 24,
    duration = 600,
    once = true,
  } = opts

  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const initial = {
      up: `translate3d(0, ${distance}px, 0)`,
      down: `translate3d(0, -${distance}px, 0)`,
      left: `translate3d(${distance}px, 0, 0)`,
      right: `translate3d(-${distance}px, 0, 0)`,
      scale: 'scale(0.92)',
    }[direction] || `translate3d(0, ${distance}px, 0)`

    el.style.opacity = '0'
    el.style.transform = initial
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`
    if (delay) el.style.transitionDelay = `${delay}ms`
    el.style.willChange = 'opacity, transform'

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = '1'
            el.style.transform = 'none'
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            el.style.opacity = '0'
            el.style.transform = initial
          }
        })
      },
      { threshold, rootMargin }
    )

    io.observe(el)
    
    // Fallback: force visible after 1.5s to prevent elements staying hidden
    const fallbackTimer = setTimeout(() => {
      if (el && el.style.opacity === '0') {
        el.style.opacity = '1'
        el.style.transform = 'none'
      }
    }, 1500)
    
    return () => {
      io.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [threshold, rootMargin, delay, direction, distance, duration, once])

  return ref
}

export default useScrollReveal

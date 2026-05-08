import { useEffect, useRef, useState } from 'react'

/**
 * Compteur animé de 0 vers une cible quand il entre dans le viewport.
 * Avec easing cubic-out pour une sensation premium.
 *
 * @param {number} to      Valeur cible
 * @param {number} duration Durée en ms (défaut 1400)
 * @param {string} prefix  Préfixe (ex: '+')
 * @param {string} suffix  Suffixe (ex: ' M FCFA', '%')
 * @param {number} decimals Nombre de décimales (défaut 0)
 */
export default function AnimatedCounter({
  to = 0,
  duration = 1400,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  style,
}) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync from external source (localStorage, props, async result) — refactor to derived state where feasible
      setVal(to)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const start = performance.now()
            const tick = (now) => {
              const progress = Math.min(1, (now - start) / duration)
              const eased = 1 - Math.pow(1 - progress, 3)
              setVal(to * eased)
              if (progress < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  const display = decimals > 0
    ? val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : Math.round(val).toLocaleString('fr-FR')

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display}{suffix}
    </span>
  )
}

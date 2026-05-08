import { useEffect, useRef } from 'react'

/**
 * Orbes de gradient animés en fond — style Linear / Vercel / Stripe.
 * Effet visuel premium, 100% CSS + rAF pour la légèreté.
 *
 * Usage :
 *   <div style={{ position: 'relative', overflow: 'hidden' }}>
 *     <GradientOrbs variant="gold" intensity={0.6} />
 *     {contenu...}
 *   </div>
 */
export default function GradientOrbs({ variant = 'gold', intensity = 0.5, count = 3 }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const orbs = Array.from(root.querySelectorAll('[data-orb]'))
    let rafId = null
    let t = 0

    const animate = () => {
      t += 0.004
      orbs.forEach((orb, i) => {
        const phase = i * 2.1
        const x = Math.sin(t + phase) * 25
        const y = Math.cos(t * 0.8 + phase) * 20
        orb.style.transform = `translate3d(${x}%, ${y}%, 0)`
      })
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const palettes = {
    gold: ['#F0B429', '#F59E0B', '#EAB308'],
    blue: ['#3B82F6', '#0EA5E9', '#8B5CF6'],
    green: ['#22C55E', '#16A34A', '#0EA5E9'],
    purple: ['#8B5CF6', '#EC4899', '#3B82F6'],
    multi: ['#F0B429', '#3B82F6', '#EC4899'],
  }
  const colors = palettes[variant] || palettes.gold

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          data-orb
          style={{
            position: 'absolute',
            top: `${20 + i * 25}%`,
            left: `${15 + i * 30}%`,
            width: `${300 + i * 80}px`,
            height: `${300 + i * 80}px`,
            background: `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 70%)`,
            opacity: intensity * (0.35 - i * 0.06),
            filter: 'blur(60px)',
            borderRadius: '50%',
            willChange: 'transform',
            transition: 'transform 50ms linear',
          }}
        />
      ))}
    </div>
  )
}

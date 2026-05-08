import { useEffect, useRef } from 'react'

/**
 * Fond particules connectées en canvas 2D (maillage). Très léger, ~60fps.
 * Inspiré de l'effet « constellation » qu'on voit sur les hero modernes.
 *
 * Options :
 *  - count     : nombre de particules (défaut 60)
 *  - color     : couleur des particules (défaut '#F0B429')
 *  - linkColor : couleur des liens (défaut même)
 *  - linkDistance : distance max pour lier 2 particules (défaut 140)
 *  - speed     : vitesse de base (défaut 0.3)
 *  - opacity   : opacité globale (défaut 0.45)
 */
export default function ParticlesBackground({
  count = 60,
  color = '#F0B429',
  linkColor,
  linkDistance = 140,
  speed = 0.3,
  opacity = 0.45,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    let rafId = null
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const parts = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 1.8 + 0.6,
    }))

    const linkCol = linkColor || color
    const linkRgba = hexToRgba(linkCol, 0.5 * opacity)

    function step() {
      ctx.clearRect(0, 0, width, height)

      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.globalAlpha = opacity
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Maillage
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x
          const dy = parts[i].y - parts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < linkDistance) {
            ctx.globalAlpha = (1 - d / linkDistance) * opacity
            ctx.strokeStyle = linkRgba
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(parts[i].x, parts[i].y)
            ctx.lineTo(parts[j].x, parts[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      rafId = requestAnimationFrame(step)
    }

    step()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [count, color, linkColor, linkDistance, speed, opacity])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

function hexToRgba(hex, a = 1) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

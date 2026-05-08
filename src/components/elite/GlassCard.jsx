/**
 * GlassCard - Elite Component
 * Carte avec effet glassmorphism et animations
 */
import './elite.css'

export function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  glow = false,
  ...props 
}) {
  const variants = {
    default: 'elite-glass',
    elevated: 'elite-glass elite-glass--elevated',
    flat: 'elite-glass elite-glass--flat',
  }
  
  const classes = [
    variants[variant] || variants.default,
    hover && 'elite-glass--hover',
    glow && 'elite-glass--glow',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

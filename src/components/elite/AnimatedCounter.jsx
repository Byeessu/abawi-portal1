/**
 * AnimatedCounter - Elite Component
 * Compteur avec animation smooth
 */
import { useState, useEffect, useRef } from 'react'
import './elite.css'

export function AnimatedCounter({ 
  value, 
  duration = 1000,
  prefix = '',
  suffix = '',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef(null)
  const startValue = useRef(0)
  
  useEffect(() => {
    startValue.current = displayValue
    startTime.current = null
    
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue.current + (value - startValue.current) * easeOut
      
      setDisplayValue(Math.round(current))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: review hook dependencies
  }, [value, duration])
  
  return (
    <span className={`elite-counter ${className}`}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

/**
 * EliteToast - Elite Component
 * Notification toast premium avec animations
 */
import { useEffect } from 'react'
import './elite.css'

export function EliteToast({ 
  msg, 
  type = 'success',
  duration = 4000,
  onClose,
  position = 'bottom-right'
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const types = {
    success: 'elite-toast--success',
    error: 'elite-toast--error',
    warning: 'elite-toast--warning',
    info: 'elite-toast--info'
  }
  
  const positions = {
    'bottom-right': 'elite-toast--br',
    'bottom-left': 'elite-toast--bl',
    'top-right': 'elite-toast--tr',
    'top-left': 'elite-toast--tl'
  }
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  
  const classes = [
    'elite-toast',
    types[type] || types.success,
    positions[position] || positions['bottom-right']
  ].join(' ')
  
  return (
    <div className={classes}>
      <span className="elite-toast__icon">{icons[type]}</span>
      <span className="elite-toast__text">{msg}</span>
    </div>
  )
}

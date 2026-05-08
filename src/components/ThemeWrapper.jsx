import React from 'react'
import { useThemeContext } from '../context/ThemeContext'

/**
 * Wrapper qui garantit que tous les éléments enfants sont visibles
 * quel que soit le mode (clair/sombre)
 */
export function ThemeWrapper({ children, className = '', style = {} }) {
  const { darkMode } = useThemeContext()
  
  return (
    <div 
      className={`theme-wrapper ${darkMode ? 'theme-dark' : 'theme-light'} ${className}`}
      style={{
        // Garantir la visibilité
        color: darkMode ? '#F0F2F5' : '#0F172A',
        backgroundColor: darkMode ? '#070B0F' : '#F8FAFC',
        minHeight: '100%',
        ...style
      }}
      data-theme={darkMode ? 'dark' : 'light'}
    >
      {children}
    </div>
  )
}

/**
 * Composant Card avec couleurs garanties
 */
export function ThemeCard({ children, className = '', style = {}, title, onClick }) {
  const { darkMode } = useThemeContext()
  
  const baseStyle = {
    backgroundColor: darkMode ? '#0D1117' : '#FFFFFF',
    border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`,
    borderRadius: '12px',
    padding: '16px',
    color: darkMode ? '#F0F2F5' : '#0F172A',
    ...style
  }
  
  return (
    <div 
      className={`theme-card ${className}`}
      style={baseStyle}
      onClick={onClick}
    >
      {title && (
        <h3 style={{ 
          color: darkMode ? '#F0F2F5' : '#0F172A',
          marginTop: 0,
          marginBottom: '12px'
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

/**
 * Composant Text avec couleurs garanties
 */
export function ThemeText({ children, variant = 'primary', className = '', style = {}, as: Component = 'span' }) {
  const { darkMode } = useThemeContext()
  
  const colorMap = {
    primary: darkMode ? '#F0F2F5' : '#0F172A',
    secondary: darkMode ? '#8B95A5' : '#475569',
    muted: darkMode ? '#5A6575' : '#94A3B8',
    accent: darkMode ? '#60A5FA' : '#3B82F6',
    success: darkMode ? '#22C55E' : '#16A34A',
    warning: darkMode ? '#F59E0B' : '#D97706',
    error: darkMode ? '#EF4444' : '#DC2626'
  }
  
  return (
    <Component 
      className={`theme-text theme-text-${variant} ${className}`}
      style={{
        color: colorMap[variant] || colorMap.primary,
        ...style
      }}
    >
      {children}
    </Component>
  )
}

/**
 * Composant Input avec couleurs garanties
 */
export function ThemeInput({ className = '', style = {}, ...props }) {
  const { darkMode } = useThemeContext()
  
  return (
    <input
      className={`theme-input ${className}`}
      style={{
        backgroundColor: darkMode ? '#0D1117' : '#FFFFFF',
        border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`,
        color: darkMode ? '#F0F2F5' : '#0F172A',
        padding: '8px 12px',
        borderRadius: '6px',
        width: '100%',
        ...style
      }}
      {...props}
    />
  )
}

/**
 * Composant Button avec couleurs garanties
 */
export function ThemeButton({ children, variant = 'primary', className = '', style = {}, ...props }) {
  const { darkMode } = useThemeContext()
  
  const variantStyles = {
    primary: {
      backgroundColor: darkMode ? '#60A5FA' : '#3B82F6',
      color: '#FFFFFF',
      border: 'none'
    },
    secondary: {
      backgroundColor: darkMode ? '#0D1117' : '#FFFFFF',
      color: darkMode ? '#F0F2F5' : '#0F172A',
      border: `1px solid ${darkMode ? '#1A2332' : '#E2E8F0'}`
    },
    ghost: {
      backgroundColor: 'transparent',
      color: darkMode ? '#8B95A5' : '#475569',
      border: 'none'
    }
  }
  
  return (
    <button
      className={`theme-button theme-button-${variant} ${className}`}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        ...variantStyles[variant],
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Composant Section avec couleurs garanties
 */
export function ThemeSection({ children, className = '', style = {}, title }) {
  const { darkMode } = useThemeContext()
  
  return (
    <section
      className={`theme-section ${className}`}
      style={{
        backgroundColor: darkMode ? '#0D1117' : '#FFFFFF',
        color: darkMode ? '#F0F2F5' : '#0F172A',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '16px',
        ...style
      }}
    >
      {title && (
        <h2 style={{ 
          color: darkMode ? '#F0F2F5' : '#0F172A',
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '1.25rem'
        }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export default ThemeWrapper

import { useContext, useMemo } from 'react'
import { ThemeContext } from '../context/ThemeContext'

/**
 * Hook pour obtenir les couleurs du thème actuel
 * Garantit que les couleurs sont cohérentes avec le mode clair/sombre
 */
export function useThemeColors() {
  const themeContext = useContext(ThemeContext)
  const theme = themeContext?.theme
  const darkMode = themeContext?.darkMode

  return useMemo(() => {
    if (!themeContext) {
      // Fallback si le contexte n'est pas disponible
      return getDefaultColors()
    }
    return darkMode ? getDarkColors(theme) : getLightColors(theme)
  }, [themeContext, theme, darkMode])
}

/**
 * Hook simplifié pour obtenir les classes CSS adaptées au thème
 */
export function useThemeClasses() {
  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.darkMode ?? true
  
  return useMemo(() => ({
    // Classes de base
    container: `theme-container ${isDark ? 'theme-dark' : 'theme-light'}`,
    card: `theme-card ${isDark ? 'bg-card-dark' : 'bg-card-light'}`,
    text: `theme-text ${isDark ? 'text-primary-dark' : 'text-primary-light'}`,
    textSecondary: `theme-text-secondary ${isDark ? 'text-secondary-dark' : 'text-secondary-light'}`,
    
    // Classes d'inputs
    input: `theme-input ${isDark ? 'bg-input-dark border-dark' : 'bg-input-light border-light'}`,
    
    // Classes de boutons
    button: `theme-button ${isDark ? 'btn-dark' : 'btn-light'}`,
    buttonPrimary: 'theme-button theme-button-primary',
    
    // États
    isDark,
    isLight: !isDark,
    
    // Helpers pour les styles inline
    getContainerStyle: () => ({
      backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
      color: isDark ? '#F0F2F5' : '#0F172A'
    }),
    
    getCardStyle: () => ({
      backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
      borderColor: isDark ? '#1A2332' : '#E2E8F0',
      color: isDark ? '#F0F2F5' : '#0F172A'
    }),
    
    getTextStyle: (secondary = false) => ({
      color: secondary 
        ? (isDark ? '#8B95A5' : '#475569')
        : (isDark ? '#F0F2F5' : '#0F172A')
    }),
    
    getInputStyle: () => ({
      backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
      borderColor: isDark ? '#1A2332' : '#E2E8F0',
      color: isDark ? '#F0F2F5' : '#0F172A'
    }),
    
    // Classes de couleurs garanties
    colors: {
      bgPrimary: isDark ? '#070B0F' : '#F8FAFC',
      bgSecondary: isDark ? '#0D1117' : '#FFFFFF',
      bgCard: isDark ? '#0D1117' : '#FFFFFF',
      bgHover: isDark ? '#131A23' : '#F1F5F9',
      textPrimary: isDark ? '#F0F2F5' : '#0F172A',
      textSecondary: isDark ? '#8B95A5' : '#475569',
      textMuted: isDark ? '#5A6575' : '#94A3B8',
      border: isDark ? '#1A2332' : '#E2E8F0',
      accent: isDark ? '#60A5FA' : '#3B82F6',
      success: isDark ? '#22C55E' : '#16A34A',
      warning: isDark ? '#F59E0B' : '#D97706',
      error: isDark ? '#EF4444' : '#DC2626',
    }
  }), [isDark])
}

/**
 * Fonction pour générer des styles garantis visibles
 */
export function useVisibleStyles() {
  const themeContext = useContext(ThemeContext)
  const isDark = themeContext?.darkMode ?? true
  
  return useMemo(() => {
    const colors = {
      bgPrimary: isDark ? '#070B0F' : '#F8FAFC',
      bgSecondary: isDark ? '#0D1117' : '#FFFFFF',
      bgCard: isDark ? '#0D1117' : '#FFFFFF',
      textPrimary: isDark ? '#F0F2F5' : '#0F172A',
      textSecondary: isDark ? '#8B95A5' : '#475569',
      textMuted: isDark ? '#5A6575' : '#94A3B8',
      border: isDark ? '#1A2332' : '#E2E8F0',
      accent: isDark ? '#60A5FA' : '#3B82F6',
    }
    
    return {
      colors,
      
      // Styles communs
      container: {
        backgroundColor: colors.bgPrimary,
        color: colors.textPrimary,
        minHeight: '100vh'
      },
      
      card: {
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        borderRadius: '8px',
        padding: '16px'
      },
      
      text: {
        color: colors.textPrimary
      },
      
      textSecondary: {
        color: colors.textSecondary
      },
      
      input: {
        backgroundColor: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        padding: '8px 12px',
        borderRadius: '6px'
      },
      
      button: {
        backgroundColor: colors.accent,
        color: '#FFFFFF',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer'
      },
      
      buttonSecondary: {
        backgroundColor: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer'
      },
      
      // Méthode pour créer un style garanti
      ensureVisible: (baseStyle = {}) => ({
        ...baseStyle,
        color: baseStyle.color || colors.textPrimary,
        backgroundColor: baseStyle.backgroundColor || colors.bgCard
      }),
      
      // Méthode pour créer un style de texte garanti
      ensureTextVisible: (color = 'primary') => ({
        color: colors[color === 'primary' ? 'textPrimary' : color === 'secondary' ? 'textSecondary' : 'textMuted']
      })
    }
  }, [isDark])
}

// Helpers internes
function getDefaultColors() {
  return {
    isDark: true,
    bgPrimary: '#070B0F',
    bgSecondary: '#0D1117',
    bgCard: '#0D1117',
    textPrimary: '#F0F2F5',
    textSecondary: '#8B95A5',
    textMuted: '#5A6575',
    border: '#1A2332',
    accent: '#60A5FA',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  }
}

function getDarkColors(theme) {
  return {
    isDark: true,
    bgPrimary: '#070B0F',
    bgSecondary: '#0D1117',
    bgCard: '#0D1117',
    bgHover: '#131A23',
    textPrimary: '#F0F2F5',
    textSecondary: '#8B95A5',
    textMuted: '#5A6575',
    border: '#1A2332',
    accent: '#60A5FA',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    ...getThemeSpecificColors(theme, true)
  }
}

function getLightColors(theme) {
  return {
    isDark: false,
    bgPrimary: '#F8FAFC',
    bgSecondary: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgHover: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    accent: '#3B82F6',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    ...getThemeSpecificColors(theme, false)
  }
}

function getThemeSpecificColors(theme, isDark) {
  // Couleurs spécifiques selon le thème sélectionné
  const themeColors = {
    cyberpunk: {
      accent: isDark ? '#FF6B9D' : '#EC4899',
      secondary: isDark ? '#B4A7D6' : '#8B5CF6'
    },
    neon: {
      accent: isDark ? '#39FF14' : '#22C55E',
      secondary: isDark ? '#FF00FF' : '#D946EF'
    },
    royal: {
      accent: isDark ? '#FFD700' : '#EAB308',
      secondary: isDark ? '#C080FF' : '#9333EA'
    },
    cristal: {
      accent: isDark ? '#60C8FF' : '#0EA5E9',
      secondary: isDark ? '#A0FFE0' : '#14B8A6'
    },
    ice: {
      accent: isDark ? '#0080C0' : '#0369A1',
      secondary: isDark ? '#00A8E0' : '#0284C7'
    }
  }
  
  return themeColors[theme] || {}
}

export default useThemeColors

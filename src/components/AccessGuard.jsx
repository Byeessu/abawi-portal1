/**
 * ABAWI ACCESS GUARD - Architecture Centralisée des Permissions
 * 
 * Objectif :
 * - Centraliser toute la logique de permissions
 * - Éviter les checks dupliqués dans chaque composant
 * - Gérer le cas membre === null au premier render
 * - Fournir une interface unifiée pour tous les outils
 * 
 * @version 1.0.0 - Enterprise Architecture
 */

import React from 'react'
import { useAuth } from '../context/AuthContext'
import { checkToolAccess, isMemberLoading } from '../lib/permissions'

/**
 * Loader pour le chargement des permissions
 */
function AccessLoader() {
  return (
    <div style={{ 
      minHeight: '60vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ 
        width: 40, 
        height: 40, 
        border: '3px solid rgba(240,180,41,0.2)', 
        borderTopColor: '#F0B429', 
        borderRadius: '50%', 
        animation: 'spin 0.8s linear infinite' 
      }} />
      <p style={{ color: '#8B95A5', fontSize: '0.9rem' }}>
        Vérification des permissions...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

/**
 * Composant d'accès restreint unifié
 */
function RestrictedAccess({ toolName }) {
  return (
    <div style={{ 
      padding: 48, 
      color: '#64748B', 
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div style={{ 
        width: 64, 
        height: 64, 
        borderRadius: '50%',
        background: 'rgba(240,180,41,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        ?
      </div>
      <div>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.2rem', 
          fontWeight: 600, 
          color: '#F0B429',
          marginBottom: '8px'
        }}>
          Accès Restreint
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: '0.95rem', 
          lineHeight: 1.5 
        }}>
          Accès VIP requis pour utiliser cet outil.
        </p>
        <p style={{ 
          margin: '8px 0 0', 
          fontSize: '0.85rem', 
          color: '#94A3B8' 
        }}>
          Outil : {toolName}
        </p>
      </div>
    </div>
  )
}

/**
 * AccessGuard - Composant principal pour la gestion des permissions
 * 
 * @param {Object} props
 * @param {string} props.toolName - Nom de l'outil (ex: 'businessPlan')
 * @param {React.ReactNode} props.children - Composant à afficher si accès autorisé
 * @param {React.ReactNode} props.fallback - Composant personnalisé pour accès refusé
 */
export function AccessGuard({ toolName, children, fallback }) {
  const { membre } = useAuth()

  // 1. Vérifier si le membre est en cours de chargement
  if (isMemberLoading(membre)) {
    return <AccessLoader />
  }

  // 2. Vérifier l'accès via le système centralisé
  if (!checkToolAccess(toolName, membre)) {
    return fallback || <RestrictedAccess toolName={toolName} />
  }

  // 3. Accès autorisé - afficher le composant
  return <>{children}</>
}

/**
 * Hook pour vérifier l'accès sans composant
 * @param {string} toolName - Nom de l'outil
 * @returns {Object} { hasAccess, isLoading, isRestricted }
 */
// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function useAccessGuard(toolName) {
  const { membre } = useAuth()

  const isLoading = isMemberLoading(membre)
  const hasAccess = !isLoading && checkToolAccess(toolName, membre)
  const isRestricted = !isLoading && !hasAccess

  return {
    hasAccess,
    isLoading,
    isRestricted
  }
}

/**
 * Composant d'ordre supérieur (HOC) pour protéger les outils
 // eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
 */
// eslint-disable-next-line react-refresh/only-export-components -- Mixed export pattern is intentional for this module
export function withAccessGuard(toolName) {
  return function WrappedComponent(props) {
    return (
      <AccessGuard toolName={toolName}>
        <WrappedComponent {...props} />
      </AccessGuard>
    )
  }
}

export default AccessGuard

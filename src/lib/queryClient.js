import { QueryClient } from '@tanstack/react-query'

/**
 * Query Client Configuration
 * Gestion intelligente du cache avec React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches pendant 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache pendant 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry automatique en cas d'échec
      retry: (failureCount, error) => {
        // Ne pas retry sur les erreurs 4xx (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry max 3 fois pour les autres erreurs
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automatique à la reconnexion
      refetchOnReconnect: true,
      // Refetch quand la fenêtre reprend le focus
      refetchOnWindowFocus: false,
      // Refetch en cas d'erreur
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry pour les mutations importantes
      retry: 2,
      retryDelay: 1000,
    },
  },
})

// Helpers pour les queries courantes
export const defaultQueryConfig = {
  articles: {
    queryKey: ['articles'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  },
  products: {
    queryKey: ['products'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  },
  user: {
    queryKey: ['user'],
    staleTime: 1000 * 60 * 2, // 2 minutes
  },
  podcasts: {
    queryKey: ['podcasts'],
    staleTime: 1000 * 60 * 15, // 15 minutes
  },
}

// Fonction pour invalider le cache
export function invalidateCache(queryKey) {
  return queryClient.invalidateQueries({ queryKey })
}

// Fonction pour précharger des données
export function prefetchData(queryKey, fetchFn, options = {}) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: fetchFn,
    ...options,
  })
}

// Fonction pour obtenir des données du cache
export function getCachedData(queryKey) {
  return queryClient.getQueryData(queryKey)
}

// Fonction pour mettre à jour le cache
export function setCachedData(queryKey, data) {
  return queryClient.setQueryData(queryKey, data)
}

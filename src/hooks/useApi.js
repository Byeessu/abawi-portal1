import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trackError } from '../lib/observability'

/**
 * Hook API avec retry automatique et gestion d'erreurs
 */

// Hook pour les requêtes GET avec React Query
export function useApiQuery(key, fetchFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fetchFn,
    ...options,
  })
}

// Hook pour les mutations avec feedback
export function useApiMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, onError, invalidateQueries = [], ...rest } = options

  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalider les queries concernées
      invalidateQueries.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
      })
      onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      trackError(error, { mutation: true, variables })
      onError?.(error, variables, context)
    },
    ...rest,
  })
}

// Hook pour les requêtes avec retry manuel
export function useRetryableRequest(requestFn, options = {}) {
  const { maxRetries = 3, retryDelay = 1000, onSuccess, onError } = options
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  })
  const abortControllerRef = useRef(null)

  const execute = useCallback(async (params) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState((prev) => ({ ...prev, loading: true, error: null }))

    let lastError = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = await requestFn(params, { signal: controller.signal })
        
        setState({
          data,
          loading: false,
          error: null,
          retryCount: attempt,
        })
        
        onSuccess?.(data)
        return { success: true, data }
      } catch (error) {
        // Ne pas retry si la requête a été annulée
        if (error.name === 'AbortError') {
          return { success: false, error }
        }

        lastError = error
        
        // Ne pas retry sur les erreurs 4xx
        if (error.status >= 400 && error.status < 500) {
          break
        }

        // Attendre avant le retry (avec backoff exponentiel)
        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    setState({
      data: null,
      loading: false,
      error: lastError,
      retryCount: maxRetries,
    })

    onError?.(lastError)
    trackError(lastError, { retryableRequest: true, retryCount: maxRetries })
    
    return { success: false, error: lastError }
  }, [requestFn, maxRetries, retryDelay, onSuccess, onError])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Hook pour les requêtes paginées
export function usePaginatedQuery(key, fetchFn, options = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(options.pageSize || 10)

  const query = useQuery({
    queryKey: [...(Array.isArray(key) ? key : [key]), page, pageSize],
    queryFn: () => fetchFn({ page, pageSize }),
    keepPreviousData: true,
    ...options,
  })

  return {
    ...query,
    page,
    setPage,
    pageSize,
    setPageSize,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
  }
}

// Hook pour la soumission de formulaires avec gestion d'erreurs
export function useFormSubmit(submitFn, options = {}) {
  const { onSuccess, onError, resetOnSuccess = false } = options
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const submit = useCallback(async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const result = await submitFn(data)
      setSubmitSuccess(true)
      onSuccess?.(result, data)
      
      if (resetOnSuccess) {
        return { success: true, result, reset: true }
      }
      
      return { success: true, result }
    } catch (error) {
      setSubmitError(error)
      onError?.(error, data)
      trackError(error, { formSubmit: true, data })
      return { success: false, error }
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFn, onSuccess, onError, resetOnSuccess])

  const reset = useCallback(() => {
    setSubmitError(null)
    setSubmitSuccess(false)
    setIsSubmitting(false)
  }, [])

  return {
    submit,
    isSubmitting,
    submitError,
    submitSuccess,
    reset,
  }
}

// Hook pour les requêtes optimistes
export function useOptimisticMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient()
  const { queryKey, optimisticUpdate, ...rest } = options

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey })

      // Sauvegarder l'état précédent
      const previousData = queryClient.getQueryData(queryKey)

      // Appliquer la mise à jour optimiste
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old) => optimisticUpdate(old, variables))
      }

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey })
    },
    ...rest,
  })
}

import { useCallback } from 'react'

/**
 * Hook to get and use CSRF token for API requests
 */
export function useCsrfToken() {
  const getCsrfToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('csrf-token') || null
  }, [])

  const getHeaders = useCallback((includeContentType = true) => {
    const headers: Record<string, string> = {}
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }
    
    return headers
  }, [getCsrfToken])

  return { getCsrfToken, getHeaders }
}

import { useCallback } from 'react'

/**
 * Read the CSRF token directly from document.cookie.
 * Because the CSRF cookie is no longer httpOnly the client can read it
 * synchronously — no sessionStorage, no async fetch required.
 */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Hook to get and use CSRF token for API requests
 */
export function useCsrfToken() {
  const getCsrfToken = useCallback((): string | null => {
    return readCsrfCookie()
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

'use client'

/** CSRF removed — this hook is now a no-op. */
export function useCsrfToken() {
  const getCsrfToken = () => null
  const getHeaders = (includeContentType = true): Record<string, string> =>
    includeContentType ? { 'Content-Type': 'application/json' } : {}
  return { getCsrfToken, getHeaders }
}

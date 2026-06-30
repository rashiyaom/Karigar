'use client'

import { useEffect } from 'react'

/**
 * Hook to ensure a fresh CSRF token cookie exists.
 * Fetches from the server if the cookie is missing or empty.
 * Because the cookie is now non-httpOnly, we can read it directly
 * via document.cookie — no sessionStorage dependency.
 */
export function useInitializeCsrfToken() {
  useEffect(() => {
    const ensureCsrfToken = async () => {
      // Check if token cookie is already present
      const hasCookie = /(?:^|;\s*)csrf-token=([^;]+)/.test(document.cookie)
      if (hasCookie) return

      try {
        const response = await fetch('/api/csrf-token')
        if (!response.ok) return
        // The server sets the cookie in the Set-Cookie header automatically;
        // no need to store anything in sessionStorage.
        await response.json()
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error)
      }
    }

    ensureCsrfToken()
  }, [])
}

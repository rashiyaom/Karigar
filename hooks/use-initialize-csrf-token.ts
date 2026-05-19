'use client'

import { useEffect } from 'react'

/**
 * Hook to initialize and store CSRF token in sessionStorage
 * Should be called on app initialization or protected page load
 */
export function useInitializeCsrfToken() {
  useEffect(() => {
    const initializeCsrf = async () => {
      // Check if token already exists in sessionStorage
      const existingToken = sessionStorage.getItem('csrf-token')
      if (existingToken) {
        return
      }

      try {
        // Fetch CSRF token from server
        const response = await fetch('/api/csrf-token')
        const data = await response.json()

        if (data.success && data.csrfToken) {
          // Store token in sessionStorage for API calls
          sessionStorage.setItem('csrf-token', data.csrfToken)
        }
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error)
      }
    }

    initializeCsrf()
  }, [])
}

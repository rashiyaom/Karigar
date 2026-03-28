"use client"

import { useEffect, useState } from "react"
import { useResetAttendance } from "@/hooks/use-api"

export function AttendanceAutoReset() {
  const resetMutation = useResetAttendance()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated first
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        })
        setIsAuthenticated(response.ok)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const checkAndReset = async () => {
      const today = new Date().toISOString().split('T')[0]
      try {
        // The API endpoint handles the daily reset check server-side
        // MongoDB stores last reset timestamp for each record
        const response = await fetch('/api/attendance/auto-reset', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          console.debug(`Auto-reset API returned status ${response.status}`)
          return
        }

        const data = await response.json()
        
        if (data.success && data.data.markedAbsent > 0) {
          console.log(`Auto-reset: Marked ${data.data.markedAbsent} employees as absent for ${today}`)
        }
      } catch (error) {
        console.debug('Auto-reset check (expected on login page):', error)
      }
    }

    // Check on mount
    checkAndReset()

    // Set up interval to check every hour
    const interval = setInterval(checkAndReset, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, resetMutation])

  return null // This component doesn't render anything
}

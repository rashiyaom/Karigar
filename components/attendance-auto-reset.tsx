"use client"

import { useEffect } from "react"
import { useResetAttendance } from "@/hooks/use-api"

export function AttendanceAutoReset() {
  const resetMutation = useResetAttendance()

  useEffect(() => {
    const checkAndReset = async () => {
      const today = new Date().toISOString().split('T')[0]
      try {
        // The API endpoint handles the daily reset check server-side
        // MongoDB stores last reset timestamp for each record
        const response = await fetch('/api/attendance/auto-reset')
        const data = await response.json()
        
        if (data.success && data.data.markedAbsent > 0) {
          console.log(`Auto-reset: Marked ${data.data.markedAbsent} employees as absent for ${today}`)
        }
      } catch (error) {
        console.error('Failed to auto-reset attendance:', error)
      }
    }

    // Check on mount
    checkAndReset()

    // Set up interval to check every hour
    const interval = setInterval(checkAndReset, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [resetMutation])

  return null // This component doesn't render anything
}

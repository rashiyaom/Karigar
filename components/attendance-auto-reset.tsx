"use client"

import { useEffect } from "react"
import { useResetAttendance } from "@/hooks/use-api"

const LAST_RESET_KEY = "attendance_last_reset"

export function AttendanceAutoReset() {
  const resetMutation = useResetAttendance()

  useEffect(() => {
    const checkAndReset = async () => {
      const today = new Date().toISOString().split('T')[0]
      const lastReset = localStorage.getItem(LAST_RESET_KEY)

      // If it's a new day and we haven't reset today
      if (lastReset !== today) {
        try {
          // Check if there's any attendance for today first
          const response = await fetch('/api/attendance/auto-reset')
          const data = await response.json()
          
          if (data.success && data.data.hasAttendanceToday) {
            // There's old attendance, reset it
            await resetMutation.mutateAsync(today)
            localStorage.setItem(LAST_RESET_KEY, today)
            console.log(`Auto-reset attendance for ${today}`)
          }
        } catch (error) {
          console.error('Failed to auto-reset attendance:', error)
        }
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

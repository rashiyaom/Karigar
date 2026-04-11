import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

// This endpoint can be called by a cron job or scheduler to auto-reset attendance
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const addedCount = await mongoStore.resetDailyAttendance(user.id, today)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        addedCount,
        date: today,
        message: `Auto-reset attendance - marked ${addedCount} employees as absent on ${today}`
      },
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to auto-reset attendance",
      },
      { status: 500 },
    )
  }
}

// Allow checking if auto-reset has been done today
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = await mongoStore.getAttendanceByDate(today, user.id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        date: today,
        hasAttendanceToday: todayAttendance.length > 0,
        attendanceCount: todayAttendance.length
      },
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to check attendance status",
      },
      { status: 500 },
    )
  }
}

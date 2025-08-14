import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

// This endpoint can be called by a cron job or scheduler to auto-reset attendance
export async function POST(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const deletedCount = store.resetDailyAttendance(today)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        deletedCount,
        date: today,
        message: `Auto-reset attendance for ${deletedCount} records on ${today}`
      },
    })
  } catch (error) {
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
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = store.getAttendanceByDate(today)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        date: today,
        hasAttendanceToday: todayAttendance.length > 0,
        attendanceCount: todayAttendance.length
      },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to check attendance status",
      },
      { status: 500 },
    )
  }
}

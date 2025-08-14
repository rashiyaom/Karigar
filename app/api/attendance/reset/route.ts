import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const date = url.searchParams.get("date")
    
    const deletedCount = store.resetDailyAttendance(date || undefined)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        deletedCount,
        date: date || new Date().toISOString().split('T')[0],
        message: `Reset attendance for ${deletedCount} records`
      },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to reset attendance",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const date = url.searchParams.get("date")
    
    const deletedCount = await mongoStore.resetDailyAttendance(user.id, date || undefined)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        deletedCount,
        date: date || new Date().toISOString().split('T')[0],
        message: `Reset attendance for ${deletedCount} records`
      },
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to reset attendance",
      },
      { status: 500 },
    )
  }
}

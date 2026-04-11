import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { guardWriteRequest, getClientIp } from "@/lib/api-write-guard"

export async function DELETE(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `attendance-reset:${ip}`,
      maxRequests: 20,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return guard.response
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const date = url.searchParams.get("date")
    
    const deletedCount = await mongoStore.resetDailyAttendance(user.id, date || undefined)

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        deletedCount,
        date: date || new Date().toISOString().split('T')[0],
        message: `Reset attendance for ${deletedCount} records`
      },
    })

    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
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

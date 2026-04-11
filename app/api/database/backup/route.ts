import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { guardWriteRequest, getClientIp } from "@/lib/api-write-guard"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `db-backup:${ip}`,
      maxRequests: 20,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return guard.response
    }

    // Check authentication - only admins can access backups
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    
    // MongoDB Cloud Atlas handles automatic backups
    // This endpoint confirms backup availability
    const response = NextResponse.json({
      success: true,
      data: { 
        timestamp,
        message: "MongoDB Cloud Atlas handles automatic backups",
        status: "backup_enabled"
      },
    })

    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Backup check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

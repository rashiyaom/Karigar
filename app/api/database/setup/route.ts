import { NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { getCurrentUser } from "@/lib/auth"
import { guardWriteRequest, getClientIp } from "@/lib/api-write-guard"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `db-setup:${ip}`,
      maxRequests: 10,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return guard.response
    }

    // Check authentication - only admins can access database setup endpoints
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Initialize database with sample data if needed
    await mongoStore.initializeDatabase()
    
    const settings = await mongoStore.getSettings(user.id)
    const stats = await mongoStore.getStats(user.id)

    const response = NextResponse.json({
      success: true,
      data: {
        message: "MongoDB initialized successfully and connected",
        status: "connected",
        database: "karigar",
        initialized: true,
        settings,
        stats,
      },
    })

    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    )
  }
}

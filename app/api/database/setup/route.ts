import { NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to access admin endpoints
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Initialize database with sample data if needed
    await mongoStore.initializeDatabase()
    
    const settings = await mongoStore.getSettings()
    const stats = await mongoStore.getStats()

    return NextResponse.json({
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

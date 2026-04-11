import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { getCurrentUser } from "@/lib/auth"

export async function POST() {
  try {
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

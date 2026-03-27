import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"

export async function POST() {
  try {
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

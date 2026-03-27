import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // MongoDB connection is handled automatically through mongoStore
    // This endpoint is now a no-op since MongoDB handles connection pooling
    return NextResponse.json({
      success: true,
      data: { 
        message: "MongoDB is configured and ready",
        status: "connected"
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

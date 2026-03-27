import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"

export async function GET() {
  try {
    const stats = await mongoStore.getStats()

    return NextResponse.json({
      success: true,
      data: {
        database: "MongoDB",
        status: "connected",
        stats,
      },
    })
  } catch (error) {
    console.error("Database info error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get database info",
      },
      { status: 500 },
    )
  }
}

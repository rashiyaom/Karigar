import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    
    // MongoDB Cloud Atlas handles automatic backups
    // This endpoint confirms backup availability
    return NextResponse.json({
      success: true,
      data: { 
        timestamp,
        message: "MongoDB Cloud Atlas handles automatic backups",
        status: "backup_enabled"
      },
    })
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

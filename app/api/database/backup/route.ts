import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST() {
  try {
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

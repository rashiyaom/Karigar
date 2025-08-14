import { NextResponse } from "next/server"
import { sqliteStore } from "@/lib/database"
import path from "path"

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupPath = path.join(path.dirname(sqliteStore.getDatabasePath()), `backup_${timestamp}.db`)

    const success = await sqliteStore.backup(backupPath)

    if (success) {
      return NextResponse.json({
        success: true,
        data: { backupPath },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Backup failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

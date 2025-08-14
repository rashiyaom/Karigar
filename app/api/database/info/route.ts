import { NextResponse } from "next/server"
import { sqliteStore } from "@/lib/database"

export async function GET() {
  try {
    const path = sqliteStore.getDatabasePath()
    const stats = sqliteStore.getStats()
    const employees = sqliteStore.getAllEmployees().length
    const attendance = sqliteStore.getAllAttendance().length
    const credits = sqliteStore.getAllCredits().length
    const tasks = sqliteStore.getAllTasks().length

    return NextResponse.json({
      success: true,
      data: {
        path,
        stats: {
          employees,
          attendance,
          credits,
          tasks,
          ...stats,
        },
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

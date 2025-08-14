import { type NextRequest, NextResponse } from "next/server"
import { sqliteStore } from "@/lib/database"
import path from "path"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    const { path: requestedPath } = await request.json()

    if (!requestedPath || typeof requestedPath !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid path provided. Please provide a valid file path.",
        },
        { status: 400 },
      )
    }

    const trimmedPath = requestedPath.trim()
    
    if (trimmedPath.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Path is too short. Please provide a valid file path.",
        },
        { status: 400 },
      )
    }

    // Ensure the directory exists
    try {
      const dir = path.dirname(trimmedPath)
      console.log("Creating directory:", dir)
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    } catch (dirError) {
      console.error("Failed to create directory:", dirError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create directory: ${dirError instanceof Error ? dirError.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }

    console.log("Setting database path to:", trimmedPath)
    const success = sqliteStore.setDatabasePath(trimmedPath)

    if (success) {
      const newPath = sqliteStore.getDatabasePath()
      console.log("Database path set successfully:", newPath)
      
      return NextResponse.json({
        success: true,
        data: { path: newPath },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to set database path. Please check path permissions and try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    )
  }
}

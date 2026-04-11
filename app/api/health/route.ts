import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Force connection
    await connectToDatabase()

    const readyStates: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }

    const readyState = mongoose.connection.readyState
    const isConnected = readyState === 1

    return NextResponse.json({
      success: true,
      data: {
        status: isConnected ? 'healthy' : 'degraded',
        connection: {
          readyState: readyState,
          readyStateLabel: readyStates[readyState],
          isConnected: isConnected,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          status: "disconnected",
          database: "MongoDB Atlas",
          connection: {
            readyState: mongoose.connection.readyState,
            isConnected: false,
          },
        },
      },
      { status: 503 }
    )
  }
}

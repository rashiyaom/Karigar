import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET() {
  try {
    // Check authentication - only admins can access database details
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    const readyStates: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }

    // Check connection status safely
    const isConnected = mongoose.connection.readyState === 1
    
    if (!isConnected) {
      // Try to connect
      try {
        await mongoStore.getStats(user.id)
      } catch (error) {
        // Connection attempt failed, return disconnected status
        return NextResponse.json({
          success: true,
          data: {
            database: "MongoDB",
            readyState: "disconnected",
            status: "disconnected",
            collections: [],
            stats: {
              employees: 0,
              attendance: 0,
              credits: 0,
              tasks: 0,
            },
          },
        })
      }
    }

    const stats = await mongoStore.getStats(user.id)
    const db = mongoose.connection.db
    const collections = db ? (await db.listCollections().toArray()).map((c) => c.name) : []

    return NextResponse.json({
      success: true,
      data: {
        database: "MongoDB",
        dbName: mongoose.connection.name || "unknown",
        host: mongoose.connection.host || "unknown",
        readyState: readyStates[mongoose.connection.readyState] || "unknown",
        collections,
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

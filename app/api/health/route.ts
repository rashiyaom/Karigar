import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"

export async function GET() {
  try {
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

    // Get stats
    const stats = await mongoStore.getStats()
    
    // Get database info
    const db = mongoose.connection.db
    const collections = db ? (await db.listCollections().toArray()).map((c) => c.name) : []
    
    // Get database stats
    let dbStats = {}
    if (db) {
      try {
        dbStats = await db.stats()
      } catch (e) {
        dbStats = { error: "Could not retrieve db stats" }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        status: "connected",
        database: "MongoDB Atlas",
        connection: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: readyState,
          readyStateLabel: readyStates[readyState],
          isConnected: isConnected,
          uri: process.env.MONGODB_URI?.replace(/:[^:]*@/, ":***@") || "not configured",
        },
        collections: collections,
        stats: stats,
        dbStats: dbStats,
        timestamp: new Date().toISOString(),
        mongooseVersion: mongoose.version,
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

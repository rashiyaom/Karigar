import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const stats = await mongoStore.getStats()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch statistics",
      },
      { status: 500 },
    )
  }
}

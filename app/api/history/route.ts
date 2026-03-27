import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const history = await mongoStore.getHistory()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: history,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch history",
      },
      { status: 500 },
    )
  }
}

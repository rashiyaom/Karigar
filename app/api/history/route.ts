import { NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const history = store.getHistory()
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

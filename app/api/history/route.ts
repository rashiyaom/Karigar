import { NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const history = await mongoStore.getHistory(user.id)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: history,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch history",
      },
      { status: 500 },
    )
  }
}

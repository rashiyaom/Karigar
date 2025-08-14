import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = store.undoAction(id)

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to undo action or action cannot be undone",
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { undone: true },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to undo action",
      },
      { status: 500 },
    )
  }
}

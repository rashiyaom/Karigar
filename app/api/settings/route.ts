import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { settingsSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const settings = store.getSettings()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch settings",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    const settings = store.updateSettings(validatedData)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update settings",
      },
      { status: 500 },
    )
  }
}

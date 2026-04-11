import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { creditSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const credits = await mongoStore.getAllCredits(user.id)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: credits,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch credits",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = creditSchema.parse(body)

    const credit = await mongoStore.createCredit(validatedData, user.id)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: credit,
      },
      { status: 201 },
    )
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
        error: "Failed to create credit record",
      },
      { status: 500 },
    )
  }
}

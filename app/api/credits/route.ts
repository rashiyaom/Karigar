import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { creditSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const credits = await mongoStore.getAllCredits()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: credits,
    })
  } catch (error) {
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
    const body = await request.json()
    const validatedData = creditSchema.parse(body)

    const credit = await mongoStore.createCredit(validatedData)

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

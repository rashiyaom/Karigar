import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { creditSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    console.log('GET /api/credits - Fetching all credits')
    const credits = store.getAllCredits()
    console.log('Found credits:', credits.length)
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
    console.log('POST /api/credits - Creating credit with data:', body)
    const validatedData = creditSchema.parse(body)

    const credit = store.createCredit(validatedData)
    console.log('POST /api/credits - Created credit:', credit.id)
    console.log('POST /api/credits - Total credits after creation:', store.getAllCredits().length)

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

import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { creditSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = creditSchema.partial().parse(body)

    // Debug logging
    console.log('PUT /api/credits/[id] - Attempting to update credit:', id)
    console.log('Update data:', validatedData)
    console.log('Available credit IDs:', store.getAllCredits().map(c => c.id))
    
    const credit = store.updateCredit(id, validatedData)
    if (!credit) {
      console.log('Credit not found in store for ID:', id)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Credit record not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: credit,
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
        error: "Failed to update credit record",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = store.deleteCredit(id)
    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Credit record not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete credit record",
      },
      { status: 500 },
    )
  }
}

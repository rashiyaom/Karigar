import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { creditSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    // This endpoint can return a single credit or credits for an employee
    // For single credit, we'll need to fetch and return it
    // For employee credits, use GET /api/credits/employee/[employeeId]
    
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Use GET /api/credits/employee/[employeeId] for employee credits",
      },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch credit",
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = creditSchema.partial().parse(body)

    const updated = await mongoStore.updateCredit(id, validatedData)

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Credit record not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updated,
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update credit",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params
    const success = await mongoStore.deleteCredit(id)

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Credit record not found",
        },
        { status: 404 }
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
        error: "Failed to delete credit",
      },
      { status: 500 }
    )
  }
}

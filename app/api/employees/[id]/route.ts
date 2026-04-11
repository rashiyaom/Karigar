import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { employeeSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    void request
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const employee = await mongoStore.getEmployee(id, user.id)

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: employee,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employee",
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = employeeSchema.partial().parse(body)

    const updated = await mongoStore.updateEmployee(id, validatedData, user.id)

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
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
        error: "Failed to update employee",
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
    void request
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const success = await mongoStore.deleteEmployee(id, user.id)

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id },
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete employee",
      },
      { status: 500 }
    )
  }
}

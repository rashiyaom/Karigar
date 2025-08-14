import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { employeeSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const employee = store.getEmployee(id)
    if (!employee) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: employee,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employee",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = employeeSchema.partial().parse(body)

    const employee = store.updateEmployee(id, validatedData)
    if (!employee) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: employee,
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
        error: "Failed to update employee",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = store.deleteEmployee(id)
    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Employee deleted successfully" },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete employee",
      },
      { status: 500 },
    )
  }
}

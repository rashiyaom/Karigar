import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const deleted = store.deleteAttendance(id)

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Attendance record not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete attendance record",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    const updatedAttendance = store.updateAttendance(id, body)

    if (!updatedAttendance) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Attendance record not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedAttendance,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update attendance record",
      },
      { status: 500 },
    )
  }
}

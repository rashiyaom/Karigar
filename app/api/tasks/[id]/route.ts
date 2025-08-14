import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { taskSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = taskSchema.partial().parse(body)

    const task = store.updateTask(id, validatedData)

    if (!task) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: task,
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
        error: "Failed to update task",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = store.deleteTask(id)

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Task not found",
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
        error: "Failed to delete task",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { taskSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const tasks = store.getAllTasks()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: tasks,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch tasks",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    const task = store.createTask(validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: task,
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
        error: "Failed to create task",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { taskSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { guardWriteRequest, getClientIp } from "@/lib/api-write-guard"

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
    const task = await mongoStore.getTask(id, user.id)

    if (!task) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: task,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch tasks",
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

    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `tasks-write:${ip}`,
      maxRequests: 120,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: true,
    })

    if (!guard.ok) {
      return guard.response
    }

    const { id } = await params
    const validatedData = taskSchema.partial().parse(guard.body)

    const updated = await mongoStore.updateTask(id, validatedData, user.id)

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      )
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: updated,
    })

    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
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
        error: "Failed to update task",
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
    const ip = getClientIp(request)
    const guard = await guardWriteRequest(request, {
      rateLimitKey: `tasks-write:${ip}`,
      maxRequests: 120,
      windowMs: 60 * 1000,
      requireCsrf: true,
      parseJsonBody: false,
    })

    if (!guard.ok) {
      return guard.response
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const success = await mongoStore.deleteTask(id, user.id)

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      )
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { id },
    })

    Object.entries(guard.rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete task",
      },
      { status: 500 }
    )
  }
}

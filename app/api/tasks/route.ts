import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { taskSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { guardWriteRequest, getClientIp } from "@/lib/api-write-guard"
import { createPaginationMeta, parsePaginationParams } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const pagination = parsePaginationParams(new URL(request.url).searchParams)
    if (pagination.enabled) {
      const result = await mongoStore.getTasksPage(user.id, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: result.data,
        pagination: createPaginationMeta(result.total, pagination.page, pagination.pageSize),
      })
    }

    const tasks = await mongoStore.getAllTasks(user.id)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: tasks,
    })
  } catch {
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

    const validatedData = taskSchema.parse(guard.body)

    const task = await mongoStore.createTask(validatedData, user.id)

    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        data: task,
      },
      { status: 201 },
    )

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

import { NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import type { ApiResponse } from "@/lib/types"
import { getCurrentUser } from "@/lib/auth"
import { createPaginationMeta, parsePaginationParams } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const pagination = parsePaginationParams(new URL(request.url).searchParams)
    if (pagination.enabled) {
      const result = await mongoStore.getHistoryPage(user.id, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: result.data,
        pagination: createPaginationMeta(result.total, pagination.page, pagination.pageSize),
      })
    }

    const history = await mongoStore.getHistory(user.id)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: history,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch history",
      },
      { status: 500 },
    )
  }
}

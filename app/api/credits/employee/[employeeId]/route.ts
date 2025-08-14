import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import type { ApiResponse } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    const { employeeId } = await params
    const credits = store.getCreditsByEmployee(employeeId)
    return NextResponse.json<ApiResponse>({
      success: true,
      data: credits,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch credit records",
      },
      { status: 500 },
    )
  }
}

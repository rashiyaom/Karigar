import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"
import { attendanceSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = attendanceSchema.parse(body)

    const attendance = store.createAttendance(validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: attendance,
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
        error: "Failed to create attendance record",
      },
      { status: 500 },
    )
  }
}

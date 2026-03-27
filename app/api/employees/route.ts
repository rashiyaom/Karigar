import { type NextRequest, NextResponse } from "next/server"
import { mongoStore } from "@/lib/mongo-store"
import { employeeSchema } from "@/lib/validation"
import type { ApiResponse } from "@/lib/types"

export async function GET() {
  try {
    const employees = await mongoStore.getAllEmployees()
    return NextResponse.json<ApiResponse>({
      success: true,
      data: employees,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employees",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = employeeSchema.parse(body)

    const employee = await mongoStore.createEmployee(validatedData)

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: employee,
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
        error: "Failed to create employee",
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UserModel, EmployeeModel, AttendanceModel, CreditModel, TaskModel, SettingsModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/mongodb'

type Params = Promise<{ id: string }>

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const adminUser = await getCurrentUser()
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params

    const user = await UserModel.findById(id, { password: 0 }).lean()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const [employees, attendance, credits, tasks, settings] = await Promise.all([
      EmployeeModel.find({ ownerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
      AttendanceModel.find({ ownerId: id }).sort({ date: -1 }).limit(20).lean(),
      CreditModel.find({ ownerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
      TaskModel.find({ ownerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
      SettingsModel.findOne({ ownerId: id }).lean(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
        settings,
        employees,
        attendance,
        credits,
        tasks,
      },
    })
  } catch (error) {
    console.error('Admin user details error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch user details' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UserModel, EmployeeModel, AttendanceModel, CreditModel, TaskModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/mongodb'

type AdminUserListItem = {
  _id: { toString(): string }
  username: string
  role: 'admin' | 'user'
  createdAt: Date
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    await connectToDatabase()

    const users = await UserModel.find({}, { password: 0 }).sort({ createdAt: -1 }).lean()

    const payload = await Promise.all(
      (users as AdminUserListItem[]).map(async (u) => {
        const ownerId = u._id.toString()
        const [employees, attendance, credits, tasks] = await Promise.all([
          EmployeeModel.countDocuments({ ownerId }),
          AttendanceModel.countDocuments({ ownerId }),
          CreditModel.countDocuments({ ownerId }),
          TaskModel.countDocuments({ ownerId }),
        ])

        return {
          id: ownerId,
          username: u.username,
          role: u.role,
          createdAt: u.createdAt,
          stats: {
            employees,
            attendance,
            credits,
            tasks,
          },
        }
      })
    )

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

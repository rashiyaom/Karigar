import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import {
  UserModel,
  EmployeeModel,
  AttendanceModel,
  CreditModel,
  TaskModel,
  SettingsModel,
} from '@/lib/mongodb-models'
import bcrypt from 'bcrypt'

// One-time seed endpoint – protected by a secret key
// Call with: POST /api/seed  { "secret": "<SEED_SECRET>" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const secret = body?.secret ?? ''

    // Protect the endpoint with a secret (set SEED_SECRET env var, or default below)
    const expected = process.env.SEED_SECRET || 'karigar-seed-2026'
    if (secret !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // ── 1. Create the demo user account ────────────────────────────────────
    const username = 'milan_enterprises'
    const email = 'milan_enterprises@gmail.com'
    const password = 'Milan@123'

    let user = await UserModel.findOne({ $or: [{ username }, { email }] })
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10)
      user = await UserModel.create({
        username,
        email,
        password: passwordHash,
        role: 'user',
      })
    } else {
      user.role = 'user'
      await user.save()
    }

    const ownerId: string = user._id.toString()

    // ── 2. Upsert settings ─────────────────────────────────────────────────
    await SettingsModel.findOneAndUpdate(
      { ownerId },
      {
        ownerId,
        organizationName: 'Milan Enterprises',
        companyEmail: email,
        companyPhone: '+91-9876543210',
        companyAddress: 'Plot 14, MIDC Industrial Area, Pune, Maharashtra 411018',
        workingHours: { start: '09:00', end: '18:00' },
        weekendDays: ['Sunday'],
        autoMarkAbsent: false,
        emailNotifications: false,
        leaveDeduction: { type: 'percentage', value: 10 },
      },
      { upsert: true, new: true }
    )

    // ── 3. Clear old seeded data for this owner ────────────────────────────
    await Promise.all([
      EmployeeModel.deleteMany({ ownerId }),
      AttendanceModel.deleteMany({ ownerId }),
      CreditModel.deleteMany({ ownerId }),
      TaskModel.deleteMany({ ownerId }),
    ])

    // ── 4. Create 10 employees ─────────────────────────────────────────────
    const today = new Date()
    const fmtDate = (d: Date) => d.toISOString().split('T')[0]

    const employeeData = [
      { name: 'Rajesh Kumar Sharma', role: 'Senior Engineer', salary: 45000, mobile: '9876501001', email: `rajesh.sharma.${ownerId.slice(-4)}@milanent.in`, joiningDate: '2022-03-15' },
      { name: 'Priya Nair',          role: 'HR Manager',      salary: 38000, mobile: '9876501002', email: `priya.nair.${ownerId.slice(-4)}@milanent.in`,    joiningDate: '2021-07-01' },
      { name: 'Amit Verma',          role: 'Accountant',      salary: 32000, mobile: '9876501003', email: `amit.verma.${ownerId.slice(-4)}@milanent.in`,    joiningDate: '2023-01-10' },
      { name: 'Sunita Desai',        role: 'Sales Executive',  salary: 28000, mobile: '9876501004', email: `sunita.desai.${ownerId.slice(-4)}@milanent.in`,  joiningDate: '2022-11-20' },
      { name: 'Mohammed Iqbal',      role: 'Warehouse Incharge', salary: 30000, mobile: '9876501005', email: `md.iqbal.${ownerId.slice(-4)}@milanent.in`,   joiningDate: '2021-04-05' },
      { name: 'Kavitha Rajan',       role: 'Quality Inspector', salary: 27000, mobile: '9876501006', email: `kavitha.rajan.${ownerId.slice(-4)}@milanent.in`,joiningDate: '2023-06-01' },
      { name: 'Deepak Patel',        role: 'Machine Operator', salary: 24000, mobile: '9876501007', email: `deepak.patel.${ownerId.slice(-4)}@milanent.in`, joiningDate: '2022-08-14' },
      { name: 'Anjali Singh',        role: 'Office Assistant', salary: 22000, mobile: '9876501008', email: `anjali.singh.${ownerId.slice(-4)}@milanent.in`,  joiningDate: '2023-09-03' },
      { name: 'Suresh Naidu',        role: 'Security Guard',   salary: 18000, mobile: '9876501009', email: `suresh.naidu.${ownerId.slice(-4)}@milanent.in`,  joiningDate: '2020-12-01' },
      { name: 'Meera Krishnamurthy', role: 'Data Entry Operator', salary: 20000, mobile: '9876501010', email: `meera.km.${ownerId.slice(-4)}@milanent.in`,  joiningDate: '2024-01-15' },
    ]

    const createdEmployees = await EmployeeModel.insertMany(
      employeeData.map(e => ({ ...e, ownerId, status: 'active' }))
    )

    // ── 5. Mark 10 days of attendance for each employee ────────────────────
    // Use the last 14 calendar days, pick 10 working days
    const attendanceStatuses = ['present','present','present','present','present','present','present','half-day','present','present'] as const
    const attendanceDocs: object[] = []

    for (const emp of createdEmployees) {
      let day = 0
      let offset = 1
      while (day < 10 && offset <= 30) {
        const d = new Date(today)
        d.setDate(d.getDate() - offset)
        // Skip Sundays
        if (d.getDay() !== 0) {
          attendanceDocs.push({
            ownerId,
            employeeId: emp._id.toString(),
            date: fmtDate(d),
            status: attendanceStatuses[day],
          })
          day++
        }
        offset++
      }
    }

    // Use insertMany with ordered:false to skip duplicates gracefully
    try {
      await AttendanceModel.insertMany(attendanceDocs, { ordered: false })
    } catch {
      // ignore duplicate key errors
    }

    // ── 6. Create 2 credits (loans) for first 2 employees ─────────────────
    const loanDate = fmtDate(new Date(today.getFullYear(), today.getMonth(), 5))
    const returnDate = fmtDate(new Date(today.getFullYear(), today.getMonth() + 2, 5))

    await CreditModel.insertMany([
      {
        ownerId,
        employeeId: createdEmployees[0]._id.toString(),
        amount: 15000,
        dateTaken: loanDate,
        promiseReturnDate: returnDate,
        isPaid: false,
      },
      {
        ownerId,
        employeeId: createdEmployees[1]._id.toString(),
        amount: 8000,
        dateTaken: loanDate,
        promiseReturnDate: returnDate,
        isPaid: false,
      },
    ])

    // ── 7. Create 2 tasks for 3rd and 4th employees ────────────────────────
    const taskDeadline1 = fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7))
    const taskDeadline2 = fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14))

    await TaskModel.insertMany([
      {
        ownerId,
        employeeId: createdEmployees[2]._id.toString(),
        title: 'Prepare Monthly Financial Report',
        description: 'Compile all income, expenses, and balance sheet data for the month of June 2026 and submit to management by the deadline.',
        deadline: taskDeadline1,
        priority: 'high',
        isCompleted: false,
      },
      {
        ownerId,
        employeeId: createdEmployees[3]._id.toString(),
        title: 'Q3 Sales Target Planning',
        description: 'Prepare a detailed sales strategy and target breakdown for Q3 2026, including region-wise allocation and key account priorities.',
        deadline: taskDeadline2,
        priority: 'medium',
        isCompleted: false,
      },
    ])

    return NextResponse.json({
      success: true,
      message: 'Demo account seeded successfully.',
      account: {
        username,
        email,
        password,
        note: 'Login at /login with email or username',
      },
      summary: {
        employees: createdEmployees.length,
        attendanceRecords: attendanceDocs.length,
        loans: 2,
        tasks: 2,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { MongoMemoryReplSet } from 'mongodb-memory-server'

let replSet: MongoMemoryReplSet
let mongooseLib: typeof import('mongoose')
let executeUserDeletionTransaction: typeof import('../../lib/user-deletion').executeUserDeletionTransaction
let connectToDatabase: typeof import('../../lib/mongodb').connectToDatabase
let models: typeof import('../../lib/mongodb-models')
let audit: typeof import('../../lib/audit-logger')

describe('User deletion transaction integration', () => {
  beforeAll(async () => {
    const mem = await import('mongodb-memory-server')
    replSet = await mem.MongoMemoryReplSet.create({ replSet: { count: 1 } })
    process.env.MONGODB_URI = replSet.getUri()
    process.env.NODE_ENV = 'test'

    mongooseLib = await import('mongoose')
    ;({ connectToDatabase } = await import('../../lib/mongodb'))
    ;({ executeUserDeletionTransaction } = await import('../../lib/user-deletion'))
    models = await import('../../lib/mongodb-models')
    audit = await import('../../lib/audit-logger')

    await connectToDatabase()
  })

  beforeEach(async () => {
    await Promise.all([
      models.UserModel.deleteMany({}),
      models.EmployeeModel.deleteMany({}),
      models.AttendanceModel.deleteMany({}),
      models.CreditModel.deleteMany({}),
      models.TaskModel.deleteMany({}),
      models.SettingsModel.deleteMany({}),
      models.HistoryModel.deleteMany({}),
      models.SessionModel.deleteMany({}),
      audit.AuditLogModel.deleteMany({}),
      audit.FailedLoginModel.deleteMany({}),
    ])
  })

  afterAll(async () => {
    await mongooseLib.disconnect()
    await replSet.stop()
  })

  it('deletes user and related data in one successful transaction', async () => {
    const ownerId = new mongooseLib.Types.ObjectId().toString()
    const username = 'worker.one'

    await models.UserModel.create({
      _id: ownerId,
      username,
      password: 'hash',
      role: 'user',
    })

    const employee = await models.EmployeeModel.create({
      ownerId,
      name: 'Worker One',
      salary: 1000,
      joiningDate: '2026-01-01',
      mobile: '9999999999',
      email: 'worker.one@example.com',
      role: 'staff',
      status: 'active',
    })

    await Promise.all([
      models.AttendanceModel.create({ ownerId, employeeId: employee._id.toString(), date: '2026-01-10', status: 'present' }),
      models.CreditModel.create({ ownerId, employeeId: employee._id.toString(), amount: 100, dateTaken: '2026-01-10', promiseReturnDate: '2026-01-20', isPaid: false }),
      models.TaskModel.create({ ownerId, employeeId: employee._id.toString(), title: 'Task', description: 'Do work', deadline: '2026-01-11', priority: 'high', isCompleted: false }),
      models.SettingsModel.create({ ownerId, organizationName: 'Org' }),
      models.HistoryModel.create({ ownerId, timestamp: new Date(), action: 'create', entity: 'employee', entityId: employee._id.toString(), description: 'seed' }),
      models.SessionModel.create({ userId: ownerId, token: 'token-1', expiresAt: new Date(Date.now() + 3600_000) }),
      audit.AuditLogModel.create({ eventType: 'USER_LOGIN', severity: 'INFO', userId: ownerId, username, status: 'SUCCESS' }),
      audit.FailedLoginModel.create({ username, ipAddress: '127.0.0.1', reason: 'INVALID_CREDENTIALS' }),
    ])

    const deleted = await executeUserDeletionTransaction(ownerId, username)

    expect(deleted.users).toBe(1)
    expect(deleted.employees).toBe(1)
    expect(deleted.attendance).toBe(1)
    expect(deleted.credits).toBe(1)
    expect(deleted.tasks).toBe(1)
    expect(deleted.settings).toBe(1)
    expect(deleted.history).toBe(1)

    const [userCount, employeeCount, attendanceCount, creditCount, taskCount, settingsCount, historyCount] =
      await Promise.all([
        models.UserModel.countDocuments({ _id: ownerId }),
        models.EmployeeModel.countDocuments({ ownerId }),
        models.AttendanceModel.countDocuments({ ownerId }),
        models.CreditModel.countDocuments({ ownerId }),
        models.TaskModel.countDocuments({ ownerId }),
        models.SettingsModel.countDocuments({ ownerId }),
        models.HistoryModel.countDocuments({ ownerId }),
      ])

    expect(userCount).toBe(0)
    expect(employeeCount).toBe(0)
    expect(attendanceCount).toBe(0)
    expect(creditCount).toBe(0)
    expect(taskCount).toBe(0)
    expect(settingsCount).toBe(0)
    expect(historyCount).toBe(0)
  })

  it('rolls back when deletion is not permitted (admin user)', async () => {
    const adminId = new mongooseLib.Types.ObjectId().toString()
    const username = 'admin.rollback'

    await models.UserModel.create({
      _id: adminId,
      username,
      password: 'hash',
      role: 'admin',
    })

    await models.EmployeeModel.create({
      ownerId: adminId,
      name: 'Admin Worker',
      salary: 2000,
      joiningDate: '2026-01-01',
      mobile: '8888888888',
      email: 'admin.rollback@example.com',
      role: 'admin',
      status: 'active',
    })

    await expect(executeUserDeletionTransaction(adminId, username)).rejects.toThrow(
      'Admin account deletion is not permitted through this endpoint'
    )

    const [userCount, employeeCount] = await Promise.all([
      models.UserModel.countDocuments({ _id: adminId }),
      models.EmployeeModel.countDocuments({ ownerId: adminId }),
    ])

    expect(userCount).toBe(1)
    expect(employeeCount).toBe(1)
  })
})

import mongoose from 'mongoose'
import {
  AttendanceModel,
  CreditModel,
  EmployeeModel,
  HistoryModel,
  SessionModel,
  SettingsModel,
  TaskModel,
  UserModel,
} from './mongodb-models'
import { AuditLogModel, FailedLoginModel } from './audit-logger'

export type DeletedUserRecords = {
  users: number
  sessions: number
  settings: number
  employees: number
  attendance: number
  credits: number
  tasks: number
  history: number
  auditLogs: number
  failedLogins: number
}

export async function executeUserDeletionTransaction(userId: string, username: string): Promise<DeletedUserRecords> {
  const session = await mongoose.startSession()

  try {
    const deletedRecords: DeletedUserRecords = {
      users: 0,
      sessions: 0,
      settings: 0,
      employees: 0,
      attendance: 0,
      credits: 0,
      tasks: 0,
      history: 0,
      auditLogs: 0,
      failedLogins: 0,
    }

    await session.withTransaction(async () => {
      const targetUser = await UserModel.findOne({ _id: userId }).session(session)
      if (!targetUser) {
        throw new Error('User not found')
      }

      if (targetUser.role === 'admin') {
        throw new Error('Admin account deletion is not permitted through this endpoint')
      }

      const [employees, attendance, credits, tasks, settings, history, sessionsDeleted, auditLogs, failedLogins] =
        await Promise.all([
          EmployeeModel.deleteMany({ ownerId: userId }).session(session),
          AttendanceModel.deleteMany({ ownerId: userId }).session(session),
          CreditModel.deleteMany({ ownerId: userId }).session(session),
          TaskModel.deleteMany({ ownerId: userId }).session(session),
          SettingsModel.deleteMany({ ownerId: userId }).session(session),
          HistoryModel.deleteMany({ ownerId: userId }).session(session),
          SessionModel.deleteMany({ userId }).session(session),
          AuditLogModel.deleteMany({ $or: [{ userId }, { username }] }).session(session),
          FailedLoginModel.deleteMany({ username }).session(session),
        ])

      const deletedUser = await UserModel.deleteOne({ _id: userId }).session(session)

      deletedRecords.users = deletedUser.deletedCount ?? 0
      deletedRecords.sessions = sessionsDeleted.deletedCount ?? 0
      deletedRecords.settings = settings.deletedCount ?? 0
      deletedRecords.employees = employees.deletedCount ?? 0
      deletedRecords.attendance = attendance.deletedCount ?? 0
      deletedRecords.credits = credits.deletedCount ?? 0
      deletedRecords.tasks = tasks.deletedCount ?? 0
      deletedRecords.history = history.deletedCount ?? 0
      deletedRecords.auditLogs = auditLogs.deletedCount ?? 0
      deletedRecords.failedLogins = failedLogins.deletedCount ?? 0
    })

    return deletedRecords
  } finally {
    await session.endSession()
  }
}

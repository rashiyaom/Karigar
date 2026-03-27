import mongoose, { Schema, Document } from 'mongoose'
import type { Employee, Attendance, Credit, Task, Settings } from './types'

// Employee Schema
export interface IEmployee extends Employee, Document {}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, index: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, required: true },
    profilePhoto: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: true,
    collection: 'employees',
  }
)

// Attendance Schema
export interface IAttendance extends Attendance, Document {}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // ISO format: YYYY-MM-DD
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'sick-leave', 'paid-leave'],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'attendance',
  }
)

// Create unique index for attendance (employee + date)
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })

// Credit Schema
export interface ICredit extends Credit, Document {}

const CreditSchema = new Schema<ICredit>(
  {
    employeeId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    dateTaken: { type: String, required: true },
    promiseReturnDate: { type: String, required: true },
    isPaid: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'credits',
  }
)

// Task Schema
export interface ITask extends Task, Document {}

const TaskSchema = new Schema<ITask>(
  {
    employeeId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'tasks',
  }
)

// Settings Schema
export interface ISettings extends Settings, Document {}

const SettingsSchema = new Schema<ISettings>(
  {
    organizationName: { type: String, default: 'My Company' },
    leaveDeduction: {
      type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      value: { type: Number, default: 10 },
    },
    workingHours: {
      start: String,
      end: String,
    },
    weekendDays: [String],
    autoMarkAbsent: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: false },
    backupFrequency: String,
    companyAddress: String,
    companyPhone: String,
    companyEmail: String,
  },
  {
    timestamps: true,
    collection: 'settings',
  }
)

// History/Audit Schema
export interface IHistory extends Document {
  timestamp: Date
  action: string
  entity: string
  entityId: string
  oldData?: any
  newData?: any
  description: string
}

const HistorySchema = new Schema<IHistory>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true, index: true },
    oldData: Schema.Types.Mixed,
    newData: Schema.Types.Mixed,
    description: { type: String, required: true },
  },
  {
    collection: 'history',
  }
)

// Create models
export const EmployeeModel = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema)
export const AttendanceModel = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema)
export const CreditModel = mongoose.models.Credit || mongoose.model<ICredit>('Credit', CreditSchema)
export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema)
export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
export const HistoryModel = mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema)

import { connectToDatabase } from './mongodb'
import mongoose, { Schema, model } from 'mongoose'

/**
 * Audit Log Schema
 * Tracks all sensitive operations for security auditing
 */
const auditLogSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'USER_LOGIN',
        'USER_LOGIN_FAILED',
        'USER_LOGOUT',
        'EMPLOYEE_CREATE',
        'EMPLOYEE_UPDATE',
        'EMPLOYEE_DELETE',
        'CREDIT_CREATE',
        'CREDIT_UPDATE',
        'CREDIT_DELETE',
        'TASK_CREATE',
        'TASK_UPDATE',
        'TASK_DELETE',
        'ATTENDANCE_CREATE',
        'ATTENDANCE_UPDATE',
        'ATTENDANCE_DELETE',
        'DATABASE_SETUP',
        'DATABASE_BACKUP',
        'SETTINGS_UPDATE',
        'INJECTION_ATTEMPT',
        'RATE_LIMIT_EXCEEDED',
        'CSRF_VALIDATION_FAILED',
        'UNAUTHORIZED_ACCESS',
        'INVALID_REQUEST_SIZE',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
      required: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    username: String,
    ipAddress: String,
    userAgent: String,
    action: String,
    resourceType: String,
    resourceId: String,
    details: Schema.Types.Mixed,
    errorMessage: String,
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      index: true,
      expire: 0, // TTL index
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for efficient querying
auditLogSchema.index({ eventType: 1, timestamp: -1 })
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ severity: 1, timestamp: -1 })
auditLogSchema.index({ ipAddress: 1, timestamp: -1 })

/**
 * Failed Login Schema
 * Tracks all failed login attempts for security analysis
 */
const failedLoginSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: String,
    attemptTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      enum: ['INVALID_CREDENTIALS', 'RATE_LIMITED', 'ACCOUNT_LOCKED', 'INJECTION_ATTEMPT'],
      required: true,
    },
    details: Schema.Types.Mixed,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      index: true,
      expire: 0, // TTL index
    },
  },
  {
    timestamps: true,
  }
)

failedLoginSchema.index({ username: 1, attemptTime: -1 })
failedLoginSchema.index({ ipAddress: 1, attemptTime: -1 })

// Get or create models
export const AuditLogModel =
  mongoose.models.AuditLog || model('AuditLog', auditLogSchema)
export const FailedLoginModel =
  mongoose.models.FailedLogin || model('FailedLogin', failedLoginSchema)

/**
 * Log an audit event
 */
export async function logAuditEvent(data: {
  eventType: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  userId?: string
  username?: string
  ipAddress?: string
  userAgent?: string
  action?: string
  resourceType?: string
  resourceId?: string
  details?: unknown
  errorMessage?: string
  status?: 'SUCCESS' | 'FAILED'
}) {
  try {
    await connectToDatabase()

    const auditLog = new AuditLogModel({
      ...data,
      status: data.status || 'SUCCESS',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Auto-delete after 90 days
    })

    await auditLog.save()
    return auditLog
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - logging should never break the application
    return null
  }
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(data: {
  username: string
  ipAddress: string
  userAgent?: string
  reason: 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'ACCOUNT_LOCKED' | 'INJECTION_ATTEMPT'
  details?: unknown
}) {
  try {
    await connectToDatabase()

    const failedLogin = new FailedLoginModel({
      ...data,
      attemptTime: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Auto-delete after 90 days
    })

    await failedLogin.save()
    return failedLogin
  } catch (error) {
    console.error('Failed to log login attempt:', error)
    return null
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 50, skip = 0) {
  try {
    await connectToDatabase()

    return await AuditLogModel.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error)
    return []
  }
}

/**
 * Get failed login attempts for a user
 */
export async function getUserFailedLogins(username: string, limit = 50) {
  try {
    await connectToDatabase()

    return await FailedLoginModel.find({ username })
      .sort({ attemptTime: -1 })
      .limit(limit)
      .lean()
  } catch (error) {
    console.error('Failed to fetch failed login logs:', error)
    return []
  }
}

/**
 * Get failed login attempts by IP address
 */
export async function getIpFailedLogins(ipAddress: string, limit = 50) {
  try {
    await connectToDatabase()

    return await FailedLoginModel.find({ ipAddress })
      .sort({ attemptTime: -1 })
      .limit(limit)
      .lean()
  } catch (error) {
    console.error('Failed to fetch IP failed login logs:', error)
    return []
  }
}

/**
 * Get security events (errors and warnings)
 */
export async function getSecurityEvents(limit = 100, skip = 0) {
  try {
    await connectToDatabase()

    return await AuditLogModel.find({
      severity: { $in: ['WARNING', 'ERROR', 'CRITICAL'] },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
  } catch (error) {
    console.error('Failed to fetch security events:', error)
    return []
  }
}

/**
 * Get audit statistics for dashboard
 */
export async function getAuditStats() {
  try {
    await connectToDatabase()

    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalAuditLogs,
      logsLast24h,
      logsLast7d,
      failedLogins24h,
      criticalEvents,
      injectionAttempts,
    ] = await Promise.all([
      AuditLogModel.countDocuments(),
      AuditLogModel.countDocuments({ timestamp: { $gte: last24Hours } }),
      AuditLogModel.countDocuments({ timestamp: { $gte: last7Days } }),
      FailedLoginModel.countDocuments({ attemptTime: { $gte: last24Hours } }),
      AuditLogModel.countDocuments({ severity: 'CRITICAL' }),
      AuditLogModel.countDocuments({ eventType: 'INJECTION_ATTEMPT' }),
    ])

    return {
      totalAuditLogs,
      logsLast24h,
      logsLast7d,
      failedLogins24h,
      criticalEvents,
      injectionAttempts,
    }
  } catch (error) {
    console.error('Failed to fetch audit stats:', error)
    return {
      totalAuditLogs: 0,
      logsLast24h: 0,
      logsLast7d: 0,
      failedLogins24h: 0,
      criticalEvents: 0,
      injectionAttempts: 0,
    }
  }
}

/**
 * Clean up old audit logs (manual cleanup)
 */
export async function cleanupOldAuditLogs() {
  try {
    await connectToDatabase()

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const [auditResult, loginResult] = await Promise.all([
      AuditLogModel.deleteMany({ timestamp: { $lt: ninetyDaysAgo } }),
      FailedLoginModel.deleteMany({ attemptTime: { $lt: ninetyDaysAgo } }),
    ])

    return {
      auditLogsDeleted: auditResult.deletedCount,
      failedLoginsDeleted: loginResult.deletedCount,
    }
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error)
    return {
      auditLogsDeleted: 0,
      failedLoginsDeleted: 0,
    }
  }
}

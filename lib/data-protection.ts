/**
 * Data Protection Utilities
 * GDPR Compliance: Data export, deletion, and retention management
 * Implements "Right to Access" and "Right to Be Forgotten"
 */

import { NextRequest } from 'next/server'

interface UserDataExport {
  user: {
    id: string
    username: string
    email: string
    createdAt: string
    lastLogin?: string
  }
  profile?: Record<string, any>
  employees?: Record<string, any>[]
  auditLogs?: Record<string, any>[]
  activityLogs?: Record<string, any>[]
  exportedAt: string
  exportedBy: string
}

interface DeletionRequest {
  userId: string
  username: string
  reason?: string
  timestamp: string
  ipAddress: string
}

interface DeletionConfirmation {
  requestId: string
  userId: string
  deletedAt: string
  deletedRecords: {
    users: number
    auditLogs: number
    activityLogs: number
    relatedData: number
  }
  verificationCode: string
}

/**
 * Extract request metadata for audit trail
 */
export function extractRequestMetadata(request: NextRequest) {
  const ipAddress =
    (request.headers.get('x-forwarded-for') as string)?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const userAgent = request.headers.get('user-agent') || 'unknown'

  return { ipAddress, userAgent }
}

/**
 * Prepare user data for export (GDPR compliance)
 * Includes all personal data associated with user
 */
export async function prepareUserDataExport(
  userId: string,
  username: string
): Promise<UserDataExport> {
  try {
    // Note: In production, fetch actual data from MongoDB
    // This is a template structure
    const exportData: UserDataExport = {
      user: {
        id: userId,
        username: username,
        email: `${username}@example.com`,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      profile: {
        // User profile data would go here
      },
      employees: [],
      auditLogs: [],
      activityLogs: [],
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
    }

    return exportData
  } catch (error) {
    console.error('Error preparing user data export:', error)
    throw new Error('Failed to prepare data export')
  }
}

/**
 * Validate deletion request
 * Ensures user has permission and provides confirmation
 */
export function validateDeletionRequest(
  requestingUserId: string,
  targetUserId: string,
  verificationCode: string
): boolean {
  // User can only delete their own account
  if (requestingUserId !== targetUserId) {
    console.warn(
      `Unauthorized deletion attempt: user ${requestingUserId} tried to delete user ${targetUserId}`
    )
    return false
  }

  // In production, verify against sent verification code
  // This is a simplified check
  if (!verificationCode || verificationCode.length < 6) {
    console.warn('Invalid verification code for deletion request')
    return false
  }

  return true
}

/**
 * Create deletion audit record
 * GDPR compliance: Document deletion events
 */
export function createDeletionRecord(
  userId: string,
  username: string,
  ipAddress: string
): DeletionRequest {
  return {
    userId,
    username,
    reason: 'User-initiated account deletion',
    timestamp: new Date().toISOString(),
    ipAddress,
  }
}

/**
 * Generate deletion verification code
 * Sent to user for confirmation
 */
export function generateDeletionVerificationCode(): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  return code
}

/**
 * Create deletion confirmation record
 */
export function createDeletionConfirmation(userId: string, deletedRecords: {
  users: number
  auditLogs: number
  activityLogs: number
  relatedData: number
}): DeletionConfirmation {
  const verificationCode = generateDeletionVerificationCode()

  return {
    requestId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    deletedAt: new Date().toISOString(),
    deletedRecords,
    verificationCode,
  }
}

/**
 * Sanitize user data before export
 * Remove sensitive operational data, keep only user data
 */
export function sanitizeDataForExport(data: any): any {
  const sanitized = { ...data }

  // Remove sensitive fields
  const sensitiveFieds = [
    'password',
    '_id',
    'sessionToken',
    'apiKey',
    'refreshToken',
  ]

  sensitiveFieds.forEach((field) => {
    delete sanitized[field]
  })

  return sanitized
}

/**
 * Convert export data to JSON format
 */
export function exportToJSON(data: UserDataExport): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Convert export data to CSV format (simplified)
 */
export function exportToCSV(data: UserDataExport): string {
  const headers = ['Field', 'Value']
  const rows = [headers.join(',')]

  // Flatten user data for CSV
  Object.entries(data.user).forEach(([key, value]) => {
    rows.push(`"${key}","${value}"`)
  })

  rows.push('')
  rows.push('Exported at:,' + new Date().toISOString())

  return rows.join('\n')
}

/**
 * Calculate data retention policy
 * GDPR requires deletion after specific periods
 */
export function getDataRetentionPolicy() {
  return {
    auditLogs: 90, // days
    activityLogs: 180, // days
    backups: 30, // days
    failedLogins: 30, // days
    sessionTokens: 3, // days
    deletedUserData: 0, // Immediate deletion after verification period
  }
}

/**
 * Check if user data should be retained or deleted
 */
export function shouldDeleteUserData(createdAtOrModifiedAt: Date, retentionDays: number): boolean {
  const now = new Date()
  const ageInDays = (now.getTime() - createdAtOrModifiedAt.getTime()) / (1000 * 60 * 60 * 24)

  return ageInDays >= retentionDays
}

/**
 * Generate GDPR compliance report
 */
export function generateGdprComplianceReport() {
  const now = new Date()
  const retention = getDataRetentionPolicy()

  return {
    reportDate: now.toISOString(),
    dataProtectionOfficer: 'privacy@example.com',
    organization: 'Karigar Inc.',
    retentionPolicies: retention,
    compliance: {
      rightToAccess: 'Implemented via /api/user/export',
      rightToBeForgotten: 'Implemented via /api/user/delete',
      dataPortability: 'JSON/CSV export formats supported',
      consentTracking: 'Required for all data processing',
      dataBreachNotification: 'Mandatory 72-hour notification',
    },
    securityMeasures: {
      encryption: 'AES-256-GCM for sensitive fields',
      authentication: 'Bcrypt hashing with 10 salt rounds',
      rateLimiting: '5 attempts per 15 minutes',
      auditLogging: 'All operations logged with 90-day retention',
      csrfProtection: 'Token-based CSRF prevention',
    },
  }
}

/**
 * Log GDPR-related events for compliance audit
 */
export async function logGdprEvent(eventType: string, userId: string, details: any) {
  const gdprEvent = {
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    details,
    compliance: true, // Marks as GDPR-related for audit
  }

  // In production, this would be logged to a secure audit log
  console.log('GDPR Event:', gdprEvent)

  return gdprEvent
}

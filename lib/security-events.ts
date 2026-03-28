import { NextRequest } from 'next/server'
import { logAuditEvent, logFailedLogin } from './audit-logger'
import { getCurrentUser } from './auth'

/**
 * Extract request metadata
 */
function extractRequestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

/**
 * Log successful login
 */
export async function logSuccessfulLogin(username: string, request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: 'USER_LOGIN',
    severity: 'INFO',
    username,
    ipAddress,
    userAgent,
    action: 'User logged in',
    status: 'SUCCESS',
  })
}

/**
 * Log failed login attempt
 */
export async function logFailedLoginAttempt(
  username: string,
  request: NextRequest,
  reason: 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'INJECTION_ATTEMPT' = 'INVALID_CREDENTIALS'
) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  // Log to FailedLogin collection
  await logFailedLogin({
    username,
    ipAddress,
    userAgent,
    reason,
    details: {
      timestamp: new Date().toISOString(),
    },
  })

  // Log to AuditLog collection
  await logAuditEvent({
    eventType: 'USER_LOGIN_FAILED',
    severity: reason === 'INJECTION_ATTEMPT' ? 'WARNING' : 'INFO',
    username,
    ipAddress,
    userAgent,
    action: 'Failed login attempt',
    details: { reason },
    status: 'FAILED',
  })
}

/**
 * Log user logout
 */
export async function logUserLogout(request: NextRequest) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    await logAuditEvent({
      eventType: 'USER_LOGOUT',
      severity: 'INFO',
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: 'User logged out',
      status: 'SUCCESS',
    })
  }
}

/**
 * Log employee creation
 */
export async function logEmployeeCreate(
  employeeData: any,
  request: NextRequest,
  employeeId?: string
) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    await logAuditEvent({
      eventType: 'EMPLOYEE_CREATE',
      severity: 'INFO',
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: 'Created new employee',
      resourceType: 'Employee',
      resourceId: employeeId,
      details: {
        name: employeeData.name,
        email: employeeData.email,
        mobile: employeeData.mobile,
        role: employeeData.role,
      },
      status: 'SUCCESS',
    })
  }
}

/**
 * Log employee update
 */
export async function logEmployeeUpdate(
  employeeId: string,
  changes: any,
  request: NextRequest
) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    await logAuditEvent({
      eventType: 'EMPLOYEE_UPDATE',
      severity: 'INFO',
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: 'Updated employee',
      resourceType: 'Employee',
      resourceId: employeeId,
      details: changes,
      status: 'SUCCESS',
    })
  }
}

/**
 * Log employee deletion
 */
export async function logEmployeDelete(employeeId: string, employeeName: string, request: NextRequest) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    await logAuditEvent({
      eventType: 'EMPLOYEE_DELETE',
      severity: 'WARNING', // Higher severity for deletions
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: 'Deleted employee',
      resourceType: 'Employee',
      resourceId: employeeId,
      details: {
        employeeName,
        deletedAt: new Date().toISOString(),
      },
      status: 'SUCCESS',
    })
  }
}

/**
 * Log credit operation
 */
export async function logCreditOperation(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  creditData: any,
  request: NextRequest,
  creditId?: string
) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    const eventTypeMap = {
      CREATE: 'CREDIT_CREATE',
      UPDATE: 'CREDIT_UPDATE',
      DELETE: 'CREDIT_DELETE',
    }

    await logAuditEvent({
      eventType: eventTypeMap[operation],
      severity: operation === 'DELETE' ? 'WARNING' : 'INFO',
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: `${operation.toLowerCase()} credit`,
      resourceType: 'Credit',
      resourceId: creditId,
      details: creditData,
      status: 'SUCCESS',
    })
  }
}

/**
 * Log task operation
 */
export async function logTaskOperation(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  taskData: any,
  request: NextRequest,
  taskId?: string
) {
  const user = await getCurrentUser()
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  if (user) {
    const eventTypeMap = {
      CREATE: 'TASK_CREATE',
      UPDATE: 'TASK_UPDATE',
      DELETE: 'TASK_DELETE',
    }

    await logAuditEvent({
      eventType: eventTypeMap[operation],
      severity: operation === 'DELETE' ? 'WARNING' : 'INFO',
      userId: user.id,
      username: user.username,
      ipAddress,
      userAgent,
      action: `${operation.toLowerCase()} task`,
      resourceType: 'Task',
      resourceId: taskId,
      details: taskData,
      status: 'SUCCESS',
    })
  }
}

/**
 * Log security incident
 */
export async function logSecurityIncident(
  eventType: string,
  severity: 'WARNING' | 'ERROR' | 'CRITICAL',
  request: NextRequest,
  details?: any
) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)
  const user = await getCurrentUser()

  await logAuditEvent({
    eventType,
    severity,
    userId: user?.id,
    username: user?.username,
    ipAddress,
    userAgent,
    action: eventType,
    details,
    status: 'FAILED',
  })
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(key: string, request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: 'RATE_LIMIT_EXCEEDED',
    severity: 'WARNING',
    ipAddress,
    userAgent,
    action: 'Rate limit exceeded',
    details: { limitKey: key },
    status: 'FAILED',
  })
}

/**
 * Log injection attempt
 */
export async function logInjectionAttempt(
  username: string,
  injection: string,
  request: NextRequest
) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: 'INJECTION_ATTEMPT',
    severity: 'CRITICAL',
    username,
    ipAddress,
    userAgent,
    action: 'Potential injection attack detected',
    details: {
      attemptedInput: injection.substring(0, 100), // Log first 100 chars only
      timestamp: new Date().toISOString(),
    },
    status: 'FAILED',
  })

  // Also log as failed login if it was during auth
  if (username) {
    await logFailedLogin({
      username,
      ipAddress,
      userAgent,
      reason: 'INJECTION_ATTEMPT',
      details: { attemptedInput: injection.substring(0, 100) },
    })
  }
}

/**
 * Log CSRF validation failure
 */
export async function logCsrfValidationFailure(request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)
  const user = await getCurrentUser()

  await logAuditEvent({
    eventType: 'CSRF_VALIDATION_FAILED',
    severity: 'WARNING',
    userId: user?.id,
    username: user?.username,
    ipAddress,
    userAgent,
    action: 'CSRF validation failed',
    status: 'FAILED',
  })
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(endpoint: string, request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)

  await logAuditEvent({
    eventType: 'UNAUTHORIZED_ACCESS',
    severity: 'WARNING',
    ipAddress,
    userAgent,
    action: `Unauthorized access attempt to ${endpoint}`,
    details: { endpoint },
    status: 'FAILED',
  })
}

/**
 * Log invalid request size
 */
export async function logInvalidRequestSize(size: number, maxSize: number, request: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMetadata(request)
  const user = await getCurrentUser()

  await logAuditEvent({
    eventType: 'INVALID_REQUEST_SIZE',
    severity: 'WARNING',
    userId: user?.id,
    ipAddress,
    userAgent,
    action: 'Request payload too large',
    details: {
      requestSize: size,
      maxAllowed: maxSize,
    },
    status: 'FAILED',
  })
}

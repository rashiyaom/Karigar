/**
 * NoSQL Injection Prevention and Input Sanitization
 * Prevents common injection attacks in MongoDB queries
 */

/**
 * Sanitize string input to prevent NoSQL injection
 * Removes dangerous characters and patterns
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Escape special regex characters
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Remove JavaScript object notation patterns that could be used for injection
  // This prevents patterns like {$ne: null}, {$gt: ""}, etc.
  sanitized = sanitized.replace(/\$[a-zA-Z]+/g, '')

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

  return sanitized.trim()
}

/**
 * Validate and sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return ''
  }

  // Basic email validation pattern
  const emailRegex = /^[^\s@${}[\]\\()*+?]+@[^\s@${}[\]\\()*+?]+\.[^\s@${}[\]\\()*+?]+$/

  if (!emailRegex.test(email)) {
    return ''
  }

  return sanitizeString(email)
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any): number | null {
  const num = Number(input)
  
  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  return num
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input
  }

  if (typeof input === 'string') {
    return input.toLowerCase() === 'true'
  }

  return Boolean(input)
}

/**
 * Escape HTML special characters
 * Prevents XSS attacks
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return ''
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Sanitize object keys to prevent injection
 * Removes dangerous characters from object property names
 */
export function sanitizeObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectKeys(item))
  }

  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    // Remove dangerous key patterns
    if (key.includes('$') || key.includes('.') || key.includes('\0')) {
      continue
    }

    sanitized[key] = sanitizeObjectKeys(value)
  }

  return sanitized
}

/**
 * Check if input contains dangerous patterns
 */
export function hasDangerousPatterns(input: string): boolean {
  if (typeof input !== 'string') {
    return false
  }

  // Common NoSQL injection patterns
  const dangerousPatterns = [
    /\$\w+/,  // $ne, $gt, $where, etc.
    /;\s*db\./,  // Database access
    /;\s*function/,  // Function definitions
    /eval\s*\(/,  // eval() calls
    /constructor\s*\(/,  // Constructor access
  ]

  return dangerousPatterns.some(pattern => pattern.test(input))
}

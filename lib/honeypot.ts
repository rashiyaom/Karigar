/**
 * Honeypot Fields for Bot Detection
 * Hidden form fields that legitimate users won't fill
 * Detects and blocks automated form submissions
 */

import { NextRequest } from 'next/server'

interface HoneypotConfig {
  fields: string[]
  timeout: number // milliseconds - too fast submission = bot
  minSubmissionTime: number
}

interface HoneypotValidation {
  isValid: boolean
  reason?: string
  isLikelyBot: boolean
  suspicionScore: number
}

// Default honeypot configuration
const DEFAULT_HONEYPOT_CONFIG: HoneypotConfig = {
  fields: [
    'website_url', // Users won't fill this
    'company_name', // Rarely filled by users
    'phone_verify', // Should stay empty
    'confirm_email', // Hidden duplicate field
  ],
  timeout: 60000, // 60 seconds max time to submit
  minSubmissionTime: 1000, // Must take at least 1 second
}

// Track form submissions for timing analysis
const formSubmissions = new Map<string, { timestamp: number; fields: Set<string> }>()

/**
 * Generate honeypot HTML for forms
 * Returns hidden form fields that bots will likely fill
 */
export function generateHoneypotFields(config: Partial<HoneypotConfig> = {}): string {
  const finalConfig = { ...DEFAULT_HONEYPOT_CONFIG, ...config }

  const styles = `
    display: none;
    visibility: hidden;
    height: 0;
    width: 0;
    margin: 0;
    padding: 0;
    border: none;
    position: absolute;
    left: -9999px;
  `

  const fields = finalConfig.fields
    .map(
      (field) => `
    <div style="${styles}">
      <label for="${field}">${field.replace(/_/g, ' ')}</label>
      <input 
        type="text" 
        id="${field}" 
        name="${field}" 
        value="" 
        autocomplete="off"
        tabindex="-1"
        aria-hidden="true"
      />
    </div>
  `
    )
    .join('')

  return fields
}

/**
 * Generate honeypot token for form submission tracking
 */
export function generateHoneypotToken(): string {
  const token = `hp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  formSubmissions.set(token, {
    timestamp: Date.now(),
    fields: new Set(),
  })

  // Clean up old tokens (older than timeout)
  const config = DEFAULT_HONEYPOT_CONFIG
  for (const [key, value] of formSubmissions.entries()) {
    if (Date.now() - value.timestamp > config.timeout * 2) {
      formSubmissions.delete(key)
    }
  }

  return token
}

/**
 * Validate honeypot fields in form submission
 */
export function validateHoneypotFields(
  formData: Record<string, any>,
  config: Partial<HoneypotConfig> = {}
): HoneypotValidation {
  const finalConfig = { ...DEFAULT_HONEYPOT_CONFIG, ...config }
  let suspicionScore = 0

  // Check if any honeypot fields were filled
  for (const field of finalConfig.fields) {
    const value = formData[field]

    // If honeypot field has value, it's likely a bot
    if (value && value.toString().trim() !== '') {
      suspicionScore += 100
    }
  }

  // If any honeypot filled, it's a bot
  if (suspicionScore >= 100) {
    return {
      isValid: false,
      reason: 'Honeypot field filled - likely bot',
      isLikelyBot: true,
      suspicionScore: 100,
    }
  }

  return {
    isValid: true,
    isLikelyBot: false,
    suspicionScore: 0,
  }
}

/**
 * Validate submission timing
 * Too fast or too slow submission can indicate bot
 */
export function validateSubmissionTiming(
  token: string,
  config: Partial<HoneypotConfig> = {}
): HoneypotValidation {
  const finalConfig = { ...DEFAULT_HONEYPOT_CONFIG, ...config }

  const submission = formSubmissions.get(token)
  if (!submission) {
    return {
      isValid: false,
      reason: 'Invalid or expired honeypot token',
      isLikelyBot: true,
      suspicionScore: 50,
    }
  }

  const submissionTime = Date.now() - submission.timestamp

  // Too fast submission (faster than minSubmissionTime)
  if (submissionTime < finalConfig.minSubmissionTime) {
    return {
      isValid: false,
      reason: `Submission too fast (${submissionTime}ms < ${finalConfig.minSubmissionTime}ms)`,
      isLikelyBot: true,
      suspicionScore: 75,
    }
  }

  // Too slow submission (longer than timeout)
  if (submissionTime > finalConfig.timeout) {
    return {
      isValid: false,
      reason: `Submission too slow (${submissionTime}ms > ${finalConfig.timeout}ms)`,
      isLikelyBot: true,
      suspicionScore: 40, // Lower suspicion for slow submissions
    }
  }

  formSubmissions.delete(token)

  return {
    isValid: true,
    isLikelyBot: false,
    suspicionScore: 0,
  }
}

/**
 * Combined honeypot validation
 */
export function validateHoneypot(
  formData: Record<string, any>,
  token: string,
  config: Partial<HoneypotConfig> = {}
): HoneypotValidation {
  // Check honeypot fields
  const fieldValidation = validateHoneypotFields(formData, config)
  if (!fieldValidation.isValid) {
    return fieldValidation
  }

  // Check submission timing
  const timingValidation = validateSubmissionTiming(token, config)
  if (!timingValidation.isValid) {
    return timingValidation
  }

  return {
    isValid: true,
    isLikelyBot: false,
    suspicionScore: 0,
  }
}

/**
 * Detect bot behavior patterns
 */
export function detectBotBehavior(
  request: NextRequest,
  formData: Record<string, any>
): { isBotLikely: boolean; score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Check user agent for bot signatures
  const userAgent = request.headers.get('user-agent') || ''
  const botSignatures = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python']

  for (const sig of botSignatures) {
    if (userAgent.toLowerCase().includes(sig)) {
      score += 20
      reasons.push(`Bot signature detected: ${sig}`)
    }
  }

  // Check for missing common headers
  if (!request.headers.get('accept-language')) {
    score += 10
    reasons.push('Missing accept-language header')
  }

  if (!request.headers.get('accept-encoding')) {
    score += 10
    reasons.push('Missing accept-encoding header')
  }

  // Check for unusual number of form fields
  const fieldCount = Object.keys(formData).length
  if (fieldCount > 50) {
    score += 15
    reasons.push(`Unusual field count: ${fieldCount}`)
  }

  // Check for empty required fields (bots often skip)
  let emptyFieldCount = 0
  for (const value of Object.values(formData)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      emptyFieldCount++
    }
  }

  if (emptyFieldCount > fieldCount / 2) {
    score += 15
    reasons.push('Too many empty fields')
  }

  return {
    isBotLikely: score >= 50,
    score: Math.min(100, score),
    reasons,
  }
}

/**
 * Get honeypot statistics
 */
export function getHoneypotStats() {
  return {
    activeTokens: formSubmissions.size,
    defaultConfig: DEFAULT_HONEYPOT_CONFIG,
    honeypotFields: DEFAULT_HONEYPOT_CONFIG.fields,
  }
}

/**
 * Clear expired honeypot tokens
 */
export function clearExpiredTokens(config: Partial<HoneypotConfig> = {}) {
  const finalConfig = { ...DEFAULT_HONEYPOT_CONFIG, ...config }
  let cleared = 0

  for (const [key, value] of formSubmissions.entries()) {
    if (Date.now() - value.timestamp > finalConfig.timeout) {
      formSubmissions.delete(key)
      cleared++
    }
  }

  return cleared
}

/**
 * Reset honeypot (for testing)
 */
export function resetHoneypot() {
  formSubmissions.clear()
}

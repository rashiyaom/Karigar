import crypto from 'crypto'

const DEFAULT_COUNTRY_CODE = process.env.MSG91_DEFAULT_COUNTRY_CODE || '91'
const OTP_LENGTH = 6
const OTP_EXPIRY_MS = 5 * 60 * 1000
const VERIFICATION_TOKEN_EXPIRY_MS = 20 * 60 * 1000

export function normalizeMobile(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function toMsg91Mobile(value: string): string {
  const normalized = normalizeMobile(value)
  if (!normalized) return ''

  // Convert 10-digit Indian numbers to 12-digit with country code.
  if (normalized.length === 10 && DEFAULT_COUNTRY_CODE) {
    return `${DEFAULT_COUNTRY_CODE}${normalized}`
  }

  return normalized
}

export function isValidMobile(value: string): boolean {
  const normalized = normalizeMobile(value)
  return normalized.length >= 10 && normalized.length <= 15
}

export function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1)
  const max = 10 ** OTP_LENGTH - 1
  return String(Math.floor(min + Math.random() * (max - min + 1)))
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS)
}

export function getVerificationTokenExpiryDate(): Date {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS)
}

type Msg91Result = {
  providerRequestId?: string
  isMock: boolean
}

export async function sendOtpViaMsg91(mobile: string, otp: string): Promise<Msg91Result> {
  const authKey = process.env.MSG91_AUTH_KEY
  const templateId = process.env.MSG91_TEMPLATE_ID
  const endpoint = process.env.MSG91_OTP_ENDPOINT || 'https://control.msg91.com/api/v5/otp'

  if (!authKey || !templateId) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP] Mobile: ${mobile}, OTP: ${otp}`)
      return { isMock: true }
    }
    throw new Error('MSG91 is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.')
  }

  const msg91Mobile = toMsg91Mobile(mobile)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey,
    },
    body: JSON.stringify({
      mobile: msg91Mobile,
      template_id: templateId,
      otp,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMessage =
      (payload && (payload.message || payload.type || payload.error)) ||
      `MSG91 request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  return {
    providerRequestId: payload?.request_id || payload?.requestId,
    isMock: false,
  }
}

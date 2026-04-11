/**
 * Field-Level Encryption for Sensitive Data
 * Implements AES-256-GCM encryption for database fields
 * GDPR Compliance: Protects sensitive personal data at rest
 */

import crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
let devRuntimeEncryptionKey: string | null = null

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

function getValidatedEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY?.trim()

  if (envKey && validateEncryptionKey(envKey)) {
    return Buffer.from(envKey, 'hex')
  }

  if (IS_PRODUCTION) {
    throw new Error('ENCRYPTION_KEY must be set to a valid 64-character hex string in production')
  }

  if (!devRuntimeEncryptionKey) {
    devRuntimeEncryptionKey = crypto.randomBytes(32).toString('hex')
    console.warn('ENCRYPTION_KEY is not set. Using an in-memory development key for this runtime only.')
  }

  return Buffer.from(devRuntimeEncryptionKey, 'hex')
}

/**
 * Encrypt a sensitive field
 * Returns encrypted data with IV and auth tag for decryption
 */
export function encryptField(value: string): EncryptedData {
  try {
    if (!value) return { encrypted: '', iv: '', authTag: '' }

    const key = getValidatedEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(value, 'utf-8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag().toString('hex')

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    }
  } catch (error) {
    console.error('Field encryption error:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt a sensitive field
 * Uses stored IV and auth tag to verify data integrity
 */
export function decryptField(encryptedData: EncryptedData): string {
  try {
    if (!encryptedData.encrypted) return ''

    const key = getValidatedEncryptionKey()
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const authTag = Buffer.from(encryptedData.authTag, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')

    return decrypted
  } catch (error) {
    console.error('Field decryption error:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * Check if encryption key is securely configured
 * Should warn if using default random key in production
 */
export function isEncryptionKeySecure(): boolean {
  const key = process.env.ENCRYPTION_KEY?.trim()
  const hasCustomKey = !!key && validateEncryptionKey(key)

  if (IS_PRODUCTION && !hasCustomKey) {
    console.warn(
      'WARNING: Encryption key not properly configured. Set ENCRYPTION_KEY environment variable with a 64+ character hex string.'
    )
    return false
  }

  return true
}

/**
 * List of sensitive fields that should be encrypted
 * Format: { modelName: ['field1', 'field2'] }
 */
export const SENSITIVE_FIELDS = {
  Employee: ['ssn', 'bankAccount', 'panCard', 'aadharNumber'],
  Credit: [],
  Task: [],
  Attendance: [],
}

/**
 * Get list of fields to encrypt for a model
 */
export function getSensitiveFields(modelName: string): string[] {
  return SENSITIVE_FIELDS[modelName as keyof typeof SENSITIVE_FIELDS] || []
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key) return false

  // Should be hex string of 64 characters (32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    console.error('Invalid encryption key format. Must be 64 character hex string.')
    return false
  }

  return true
}

/**
 * Generate a new encryption key
 * Should be called once and stored securely in environment
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32).toString('hex')
  console.log('Generated encryption key (store in ENCRYPTION_KEY environment variable):')
  console.log(key)
  return key
}

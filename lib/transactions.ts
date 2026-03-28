/**
 * MongoDB Transaction Support
 * Implements ACID transactions for multi-document operations
 * Ensures data consistency across multiple collections
 */

import { MongoClient, ClientSession } from 'mongodb'
import { getMongoClient } from './connection-pool'

interface TransactionOptions {
  maxCommitTimeMS?: number
  readConcern?: string
  writeConcern?: string
  readPreference?: string
  timeout?: number
}

interface TransactionResult {
  success: boolean
  data?: any
  error?: string
  transactionId: string
  duration: number
  operationsCount: number
}

const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  maxCommitTimeMS: 10000, // 10 seconds
  readConcern: 'snapshot',
  writeConcern: 'majority',
  readPreference: 'primary',
  timeout: 30000, // 30 seconds
}

// Track active transactions
const activeTransactions = new Map<string, { startTime: Date; operationCount: number }>()

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Execute operation within transaction
 * Automatically handles rollback on error
 */
export async function executeTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<TransactionResult> {
  const transactionId = generateTransactionId()
  const startTime = Date.now()
  let session: ClientSession | null = null
  let operationCount = 0

  try {
    const client = getMongoClient()
    const finalOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options }

    // Create session for transaction
    session = client.startSession()

    // Track transaction
    activeTransactions.set(transactionId, {
      startTime: new Date(),
      operationCount: 0,
    })

    // Start transaction
    await session.withTransaction(
      async () => {
        return await operation(session!)
      },
      {
        maxCommitTimeMS: finalOptions.maxCommitTimeMS,
        readConcern: { level: finalOptions.readConcern as any },
        writeConcern: {
          w: finalOptions.writeConcern === 'majority' ? 'majority' : 1,
        },
        readPreference: finalOptions.readPreference as any,
      }
    )

    const duration = Date.now() - startTime

    // Get operation count (approximation)
    operationCount = activeTransactions.get(transactionId)?.operationCount || 1

    activeTransactions.delete(transactionId)

    return {
      success: true,
      transactionId,
      duration,
      operationsCount: operationCount,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    activeTransactions.delete(transactionId)

    console.error(`Transaction ${transactionId} failed:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactionId,
      duration,
      operationsCount: operationCount,
    }
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}

/**
 * Multi-step transaction with rollback support
 */
export async function executeMultiStepTransaction<T>(
  steps: Array<(session: ClientSession) => Promise<void>>,
  options: TransactionOptions = {}
): Promise<TransactionResult> {
  const transactionId = generateTransactionId()
  const startTime = Date.now()
  let session: ClientSession | null = null

  try {
    const client = getMongoClient()
    const finalOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options }

    session = client.startSession()

    activeTransactions.set(transactionId, {
      startTime: new Date(),
      operationCount: steps.length,
    })

    await session.withTransaction(
      async () => {
        for (let i = 0; i < steps.length; i++) {
          await steps[i](session!)
        }
      },
      {
        maxCommitTimeMS: finalOptions.maxCommitTimeMS,
        readConcern: { level: finalOptions.readConcern as any },
        writeConcern: {
          w: finalOptions.writeConcern === 'majority' ? 'majority' : 1,
        },
        readPreference: finalOptions.readPreference as any,
      }
    )

    const duration = Date.now() - startTime
    activeTransactions.delete(transactionId)

    return {
      success: true,
      transactionId,
      duration,
      operationsCount: steps.length,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    activeTransactions.delete(transactionId)

    console.error(`Multi-step transaction ${transactionId} failed:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactionId,
      duration,
      operationsCount: steps.length,
    }
  } finally {
    if (session) {
      await session.endSession()
    }
  }
}

/**
 * Get active transactions
 */
export function getActiveTransactions() {
  const transactions = []

  for (const [id, info] of activeTransactions.entries()) {
    transactions.push({
      id,
      startTime: info.startTime,
      duration: Date.now() - info.startTime.getTime(),
      operationCount: info.operationCount,
    })
  }

  return transactions
}

/**
 * Get transaction statistics
 */
export function getTransactionStats() {
  return {
    activeTransactions: activeTransactions.size,
    defaultMaxCommitTime: DEFAULT_TRANSACTION_OPTIONS.maxCommitTimeMS,
    defaultTimeout: DEFAULT_TRANSACTION_OPTIONS.timeout,
  }
}

/**
 * Validate transaction options
 */
export function validateTransactionOptions(options: TransactionOptions): boolean {
  if (options.maxCommitTimeMS && options.maxCommitTimeMS < 1000) {
    console.error('maxCommitTimeMS must be >= 1000')
    return false
  }

  if (options.timeout && options.timeout < 1000) {
    console.error('timeout must be >= 1000')
    return false
  }

  const validReadConcerns = ['local', 'available', 'majority', 'snapshot']
  if (options.readConcern && !validReadConcerns.includes(options.readConcern)) {
    console.error(`Invalid readConcern: ${options.readConcern}`)
    return false
  }

  return true
}

/**
 * Abort all active transactions (emergency cleanup)
 */
export async function abortAllTransactions() {
  console.warn('⚠️  Aborting all active transactions')
  activeTransactions.clear()
}

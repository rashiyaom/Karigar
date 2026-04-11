/**
 * Database Connection Pooling
 * Optimizes MongoDB connection management for production
 * Implements connection reuse, health checks, and auto-reconnection
 */

import { MongoClient, ServerDescription } from 'mongodb'

interface PoolConfig {
  maxPoolSize: number
  minPoolSize: number
  maxIdleTimeMS: number
  waitQueueTimeoutMS: number
  serverSelectionTimeoutMS: number
  socketTimeoutMS: number
  heartbeatFrequencyMS: number
}

interface ConnectionStatus {
  isConnected: boolean
  poolSize: number
  availableConnections: number
  totalRequests: number
  failedRequests: number
  averageResponseTime: number
  lastHealthCheck: Date
}

// Global connection pool instance
let mongoClient: MongoClient | null = null
const connectionStatus: ConnectionStatus = {
  isConnected: false,
  poolSize: 0,
  availableConnections: 0,
  totalRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  lastHealthCheck: new Date(),
}

const poolMetrics = {
  totalRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  requestTimes: [] as number[],
}

/**
 * Default pool configuration optimized for production
 */
const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 45000, // 45 seconds
  waitQueueTimeoutMS: 10000, // 10 seconds
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  heartbeatFrequencyMS: 10000, // 10 seconds
}

/**
 * Initialize MongoDB connection pool
 */
export async function initializeConnectionPool(
  uri: string,
  config: Partial<PoolConfig> = {}
): Promise<MongoClient> {
  try {
    const finalConfig = { ...DEFAULT_POOL_CONFIG, ...config }

    const mongoUri = new URL(uri)

    // Add pool configuration to connection string
    mongoUri.searchParams.set('maxPoolSize', finalConfig.maxPoolSize.toString())
    mongoUri.searchParams.set('minPoolSize', finalConfig.minPoolSize.toString())
    mongoUri.searchParams.set('maxIdleTimeMS', finalConfig.maxIdleTimeMS.toString())
    mongoUri.searchParams.set('waitQueueTimeoutMS', finalConfig.waitQueueTimeoutMS.toString())
    mongoUri.searchParams.set(
      'serverSelectionTimeoutMS',
      finalConfig.serverSelectionTimeoutMS.toString()
    )
    mongoUri.searchParams.set('socketTimeoutMS', finalConfig.socketTimeoutMS.toString())
    mongoUri.searchParams.set('heartbeatFrequencyMS', finalConfig.heartbeatFrequencyMS.toString())

    mongoClient = new MongoClient(mongoUri.toString())

    // Connect and verify
    await mongoClient.connect()

    // Verify connection
    await mongoClient.db('admin').command({ ping: 1 })

    connectionStatus.isConnected = true
    connectionStatus.lastHealthCheck = new Date()

    console.log('✅ MongoDB connection pool initialized')
    console.log(`   Pool size: ${finalConfig.maxPoolSize}`)
    console.log(`   Min connections: ${finalConfig.minPoolSize}`)

    // Start periodic health checks
    startHealthCheckInterval()

    return mongoClient
  } catch (error) {
    console.error('Failed to initialize connection pool:', error)
    connectionStatus.isConnected = false
    throw error
  }
}

/**
 * Get MongoDB client from pool
 */
export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new Error('MongoDB connection pool not initialized. Call initializeConnectionPool first.')
  }
  return mongoClient
}

/**
 * Get database instance with connection pooling
 */
export function getDatabase(dbName: string) {
  const client = getMongoClient()
  return client.db(dbName)
}

/**
 * Execute query with connection pooling and metrics
 */
export async function executeWithPooling<T>(
  operation: (client: MongoClient) => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const client = getMongoClient()
    const result = await operation(client)

    const responseTime = Date.now() - startTime
    recordMetric(responseTime, true)

    return result
  } catch (error) {
    const responseTime = Date.now() - startTime
    recordMetric(responseTime, false)
    throw error
  }
}

/**
 * Record performance metrics
 */
function recordMetric(responseTime: number, success: boolean) {
  poolMetrics.totalRequests++
  poolMetrics.totalResponseTime += responseTime
  poolMetrics.requestTimes.push(responseTime)

  if (!success) {
    poolMetrics.failedRequests++
  }

  // Keep only last 1000 request times for memory efficiency
  if (poolMetrics.requestTimes.length > 1000) {
    poolMetrics.requestTimes = poolMetrics.requestTimes.slice(-1000)
  }

  // Update connection status
  connectionStatus.totalRequests = poolMetrics.totalRequests
  connectionStatus.failedRequests = poolMetrics.failedRequests
  connectionStatus.averageResponseTime =
    poolMetrics.totalResponseTime / poolMetrics.totalRequests
}

/**
 * Periodic health check interval
 */
let healthCheckInterval: NodeJS.Timeout | null = null

function startHealthCheckInterval() {
  // Check every 30 seconds
  healthCheckInterval = setInterval(async () => {
    await performHealthCheck()
  }, 30000)
}

/**
 * Perform health check on connection pool
 */
async function performHealthCheck() {
  try {
    const client = getMongoClient()
    await client.db('admin').command({ ping: 1 })

    connectionStatus.isConnected = true
    connectionStatus.lastHealthCheck = new Date()
  } catch (error) {
    console.error('Health check failed:', error)
    connectionStatus.isConnected = false
  }
}

/**
 * Get current connection pool status
 */
export function getPoolStatus(): ConnectionStatus {
  return { ...connectionStatus }
}

/**
 * Get connection pool metrics
 */
export function getPoolMetrics() {
  const sortedTimes = [...poolMetrics.requestTimes].sort((a, b) => a - b)
  const median =
    sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0

  return {
    totalRequests: poolMetrics.totalRequests,
    successfulRequests: poolMetrics.totalRequests - poolMetrics.failedRequests,
    failedRequests: poolMetrics.failedRequests,
    successRate: poolMetrics.totalRequests > 0 
      ? (((poolMetrics.totalRequests - poolMetrics.failedRequests) / poolMetrics.totalRequests) * 100).toFixed(2) + '%'
      : 'N/A',
    averageResponseTime: connectionStatus.averageResponseTime.toFixed(2) + ' ms',
    medianResponseTime: median + ' ms',
    minResponseTime: sortedTimes.length > 0 ? Math.min(...sortedTimes) + ' ms' : 'N/A',
    maxResponseTime: sortedTimes.length > 0 ? Math.max(...sortedTimes) + ' ms' : 'N/A',
  }
}

/**
 * Close connection pool gracefully
 */
export async function closeConnectionPool() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }

  if (mongoClient) {
    await mongoClient.close()
    mongoClient = null
    connectionStatus.isConnected = false
    console.log('✅ MongoDB connection pool closed')
  }
}

/**
 * Reset pool metrics (useful for testing)
 */
export function resetPoolMetrics() {
  poolMetrics.totalRequests = 0
  poolMetrics.failedRequests = 0
  poolMetrics.totalResponseTime = 0
  poolMetrics.requestTimes = []
  connectionStatus.averageResponseTime = 0
}

/**
 * Validate pool configuration
 */
export function validatePoolConfig(config: Partial<PoolConfig>): boolean {
  if (config.maxPoolSize && config.maxPoolSize < 1) {
    console.error('maxPoolSize must be >= 1')
    return false
  }

  if (config.minPoolSize && config.maxPoolSize && config.minPoolSize > config.maxPoolSize) {
    console.error('minPoolSize cannot be greater than maxPoolSize')
    return false
  }

  return true
}

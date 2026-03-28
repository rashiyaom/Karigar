/**
 * Performance Monitoring & Metrics
 * Tracks system performance, API response times, and resource usage
 * Provides observability for optimization and bottleneck identification
 */

import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'api' | 'database' | 'memory' | 'cpu' | 'security'
}

interface ApiMetrics {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  requestSize: number
  responseSize: number
  timestamp: Date
}

interface PerformanceReport {
  totalRequests: number
  averageResponseTime: number
  slowRequests: number
  failedRequests: number
  memoryUsage: string
  uptime: number
  topSlowEndpoints: Array<{ endpoint: string; avgTime: number }>
}

// Metrics storage
const performanceMetrics: PerformanceMetric[] = []
const apiMetrics: ApiMetrics[] = []
const startTime = Date.now()

const MAX_STORED_METRICS = 10000 // Prevent memory explosion

/**
 * Record API performance metric
 */
export function recordApiMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  requestSize: number = 0,
  responseSize: number = 0
) {
  try {
    const metric: ApiMetrics = {
      endpoint,
      method,
      statusCode,
      responseTime,
      requestSize,
      responseSize,
      timestamp: new Date(),
    }

    apiMetrics.push(metric)

    // Keep only recent metrics to prevent memory issues
    if (apiMetrics.length > MAX_STORED_METRICS) {
      apiMetrics.splice(0, apiMetrics.length - MAX_STORED_METRICS)
    }

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(
        `⚠️  Slow API: ${method} ${endpoint} - ${responseTime}ms (${statusCode})`
      )
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(`❌ API Error: ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`)
    }
  } catch (error) {
    console.error('Error recording API metric:', error)
  }
}

/**
 * Record custom performance metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: string,
  category: 'api' | 'database' | 'memory' | 'cpu' | 'security' = 'api'
) {
  try {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
    }

    performanceMetrics.push(metric)

    if (performanceMetrics.length > MAX_STORED_METRICS) {
      performanceMetrics.splice(0, performanceMetrics.length - MAX_STORED_METRICS)
    }
  } catch (error) {
    console.error('Error recording metric:', error)
  }
}

/**
 * Get performance report
 */
export function getPerformanceReport(): PerformanceReport {
  const now = Date.now()
  const uptime = now - startTime

  // Calculate API statistics
  const slowRequests = apiMetrics.filter((m) => m.responseTime > 1000).length
  const failedRequests = apiMetrics.filter((m) => m.statusCode >= 400).length
  const averageResponseTime =
    apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / apiMetrics.length
      : 0

  // Find slowest endpoints
  const endpointStats = new Map<string, { totalTime: number; count: number }>()

  for (const metric of apiMetrics) {
    const key = `${metric.method} ${metric.endpoint}`
    const existing = endpointStats.get(key) || { totalTime: 0, count: 0 }
    existing.totalTime += metric.responseTime
    existing.count++
    endpointStats.set(key, existing)
  }

  const topSlowEndpoints = Array.from(endpointStats.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      avgTime: stats.totalTime / stats.count,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5)

  // Memory usage
  let memoryUsage = 'N/A'
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
    memoryUsage = `${heapUsedMB}MB / ${heapTotalMB}MB`
  }

  return {
    totalRequests: apiMetrics.length,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    slowRequests,
    failedRequests,
    memoryUsage,
    uptime: Math.floor(uptime / 1000), // in seconds
    topSlowEndpoints,
  }
}

/**
 * Middleware to automatically track API performance
 */
export function performanceMiddleware(request: NextRequest, call: () => Promise<NextResponse>) {
  const startTime = Date.now()
  const { pathname, search } = request.nextUrl
  const endpoint = pathname + search
  const method = request.method

  // Store request size
  const requestSize = request.headers.get('content-length')
    ? parseInt(request.headers.get('content-length')!)
    : 0

  return async () => {
    try {
      const response = await call()

      const responseTime = Date.now() - startTime
      const responseSize = response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!)
        : 0

      recordApiMetric(endpoint, method, response.status, responseTime, requestSize, responseSize)

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      recordApiMetric(endpoint, method, 500, responseTime, requestSize, 0)
      throw error
    }
  }
}

/**
 * Get metrics for specific endpoint
 */
export function getEndpointMetrics(endpoint: string) {
  const metrics = apiMetrics.filter((m) => m.endpoint.includes(endpoint))

  if (metrics.length === 0) {
    return null
  }

  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
  const minResponseTime = Math.min(...metrics.map((m) => m.responseTime))
  const maxResponseTime = Math.max(...metrics.map((m) => m.responseTime))
  const errorRate = (metrics.filter((m) => m.statusCode >= 400).length / metrics.length) * 100

  return {
    endpoint,
    totalRequests: metrics.length,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    minResponseTime,
    maxResponseTime,
    errorRate: Math.round(errorRate * 100) / 100 + '%',
    lastAccessed: metrics[metrics.length - 1].timestamp,
  }
}

/**
 * Get health check
 */
export function getHealthCheck() {
  const report = getPerformanceReport()
  const errorRate = report.totalRequests > 0 
    ? (report.failedRequests / report.totalRequests) * 100 
    : 0

  return {
    status: errorRate < 10 ? 'healthy' : errorRate < 25 ? 'degraded' : 'unhealthy',
    errorRate: Math.round(errorRate * 100) / 100 + '%',
    avgResponseTime: report.averageResponseTime + 'ms',
    uptime: report.uptime + 's',
    slowRequests: report.slowRequests,
  }
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics() {
  performanceMetrics.length = 0
  apiMetrics.length = 0
}

/**
 * Export metrics for analysis
 */
export function exportMetrics() {
  return {
    apiMetrics: [...apiMetrics],
    customMetrics: [...performanceMetrics],
    report: getPerformanceReport(),
  }
}

/**
 * Get recent metrics (last N minutes)
 */
export function getRecentMetrics(minutes: number = 5) {
  const cutoffTime = Date.now() - minutes * 60 * 1000

  return {
    apiMetrics: apiMetrics.filter((m) => m.timestamp.getTime() > cutoffTime),
    customMetrics: performanceMetrics.filter((m) => m.timestamp.getTime() > cutoffTime),
  }
}

/**
 * Alert on performance degradation
 */
export function checkPerformanceAlerts() {
  const report = getPerformanceReport()
  const alerts: string[] = []

  if (report.averageResponseTime > 500) {
    alerts.push(`⚠️  High average response time: ${report.averageResponseTime}ms`)
  }

  if (report.slowRequests > 10) {
    alerts.push(`⚠️  Too many slow requests: ${report.slowRequests}`)
  }

  if (report.failedRequests > 5) {
    alerts.push(`⚠️  Too many failed requests: ${report.failedRequests}`)
  }

  const errorRate = (report.failedRequests / (report.totalRequests || 1)) * 100
  if (errorRate > 10) {
    alerts.push(`⚠️  High error rate: ${errorRate.toFixed(2)}%`)
  }

  return alerts
}

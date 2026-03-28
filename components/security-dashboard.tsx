import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock, LogOut, LogIn, Trash2, AlertTriangle, Shield } from 'lucide-react'

interface AuditStats {
  totalAuditLogs: number
  logsLast24h: number
  logsLast7d: number
  failedLogins24h: number
  criticalEvents: number
  injectionAttempts: number
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditStats()
  }, [])

  async function fetchAuditStats() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/audit-logs?type=stats')

      if (!response.ok) {
        throw new Error('Failed to fetch audit stats')
      }

      const result = await response.json()
      setStats(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit stats')
      console.error('Error fetching audit stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return null
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string
    value: number
    icon: React.ReactNode
    color: string
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className="text-4xl opacity-20">{Icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {stats.criticalEvents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.criticalEvents} critical security event(s) detected in audit logs.
            <button className="ml-2 underline hover:no-underline">Review now</button>
          </AlertDescription>
        </Alert>
      )}

      {stats.injectionAttempts > 0 && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {stats.injectionAttempts} potential injection attempt(s) blocked.
            <button className="ml-2 underline hover:no-underline">View details</button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Audit Logs"
          value={stats.totalAuditLogs}
          icon={<Lock className="h-8 w-8" />}
          color="text-blue-600"
        />

        <StatCard
          title="Logs (Last 24h)"
          value={stats.logsLast24h}
          icon={<LogIn className="h-8 w-8" />}
          color="text-green-600"
        />

        <StatCard
          title="Logs (Last 7 days)"
          value={stats.logsLast7d}
          icon={<LogOut className="h-8 w-8" />}
          color="text-blue-600"
        />

        <StatCard
          title="Failed Logins (24h)"
          value={stats.failedLogins24h}
          icon={<AlertCircle className="h-8 w-8" />}
          color="text-orange-600"
        />

        <StatCard
          title="Critical Events"
          value={stats.criticalEvents}
          icon={<AlertTriangle className="h-8 w-8" />}
          color="text-red-600"
        />

        <StatCard
          title="Injection Attempts"
          value={stats.injectionAttempts}
          icon={<Shield className="h-8 w-8" />}
          color="text-purple-600"
        />
      </div>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Information</CardTitle>
          <CardDescription>
            All audit logs are retained for 90 days and automatically deleted thereafter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Logged Events:</strong> User login/logout, employee management, data changes,
              security incidents, and failed access attempts.
            </p>
            <p>
              <strong>Retention Policy:</strong> 90-day automatic retention with TTL indexes. Old logs
              are automatically deleted.
            </p>
            <p>
              <strong>Access:</strong> Only authenticated users can view audit logs. Use the admin API
              to retrieve specific logs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <button
        onClick={fetchAuditStats}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
      >
        Refresh Statistics
      </button>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"

interface AdminUserRow {
  id: string
  username: string
  role: "admin" | "user"
  createdAt: string
  stats: {
    employees: number
    attendance: number
    credits: number
    tasks: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const result = await response.json()

      if (!response.ok || !result?.success) {
        setError(result?.error || "Failed to fetch users.")
        return
      }

      setUsers(Array.isArray(result.data) ? result.data : [])
    } catch {
      setError("Unable to load users right now.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BrandMark size="xs" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Console</p>
            </div>
            <h1 className="text-3xl font-semibold">User Workspaces</h1>
            <p className="text-sm text-muted-foreground">Inspect each account and verify isolated data ownership.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers}>
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Total users: {users.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {!isLoading && !error && users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : null}

            {!isLoading && !error && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.username}</p>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Created: {new Date(user.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Employees {user.stats.employees} • Attendance {user.stats.attendance} • Credits {user.stats.credits} • Tasks {user.stats.tasks}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/admin/users/${user.id}`}>Inspect User</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

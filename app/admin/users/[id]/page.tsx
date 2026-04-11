"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"

interface DetailedUser {
  id: string
  username: string
  role: "admin" | "user"
  createdAt: string
}

interface UserDetailsPayload {
  user: DetailedUser
  settings: {
    organizationName?: string
    companyEmail?: string
  } | null
  employees: Array<{ _id: string; name: string; role: string; status?: string }>
  attendance: Array<{ _id: string; employeeId: string; date: string; status: string }>
  credits: Array<{ _id: string; employeeId: string; amount: number; isPaid: boolean }>
  tasks: Array<{ _id: string; title: string; priority: string; isCompleted: boolean }>
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<UserDetailsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/users/${params.id}`, { cache: "no-store" })
        const result = await response.json()

        if (!response.ok || !result?.success) {
          setError(result?.error || "Failed to load user details.")
          return
        }

        setData(result.data)
      } catch {
        setError("Unable to load user details right now.")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchDetails()
    }
  }, [params.id])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BrandMark size="xs" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Console</p>
            </div>
            <h1 className="text-3xl font-semibold">User Details</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading details...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isLoading && !error && data ? (
          <>
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {data.user.username}
                  <Badge variant={data.user.role === "admin" ? "default" : "secondary"}>{data.user.role}</Badge>
                </CardTitle>
                <CardDescription>Created: {new Date(data.user.createdAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Organization: {data.settings?.organizationName || "Not configured"}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Employees</CardTitle>
                  <CardDescription>{data.employees.length} recent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.employees.slice(0, 5).map((entry) => (
                    <p key={entry._id} className="truncate">
                      {entry.name} • {entry.role}
                    </p>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Attendance</CardTitle>
                  <CardDescription>{data.attendance.length} recent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.attendance.slice(0, 5).map((entry) => (
                    <p key={entry._id} className="truncate">
                      {entry.date} • {entry.status}
                    </p>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Credits</CardTitle>
                  <CardDescription>{data.credits.length} recent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.credits.slice(0, 5).map((entry) => (
                    <p key={entry._id} className="truncate">
                      {entry.employeeId} • {entry.amount} • {entry.isPaid ? "Paid" : "Pending"}
                    </p>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Tasks</CardTitle>
                  <CardDescription>{data.tasks.length} recent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.tasks.slice(0, 5).map((entry) => (
                    <p key={entry._id} className="truncate">
                      {entry.title} • {entry.priority} • {entry.isCompleted ? "Done" : "Open"}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}

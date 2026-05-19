"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format, subMonths } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts"
import {
  ArrowLeft,
  Activity,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCredits, useEmployees, useSettings, useTasks } from "@/hooks/use-api"
import { useInitializeCsrfToken } from "@/hooks/use-initialize-csrf-token"
import type { ApiResponse, Attendance } from "@/lib/types"

const ATTENDANCE_COLORS: Record<Attendance["status"], string> = {
  present: "#22c55e",
  absent: "#ef4444",
  "half-day": "#f59e0b",
  "sick-leave": "#3b82f6",
  "paid-leave": "#a855f7",
}

const ATTENDANCE_LABELS: Record<Attendance["status"], string> = {
  present: "Present",
  absent: "Absent",
  "half-day": "Half Day",
  "sick-leave": "Sick Leave",
  "paid-leave": "Paid Leave",
}

const PRIORITY_COLORS: Record<"high" | "medium" | "low", string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
}

function getMonthOptions(count = 8) {
  const now = new Date()
  return Array.from({ length: count }).map((_, index) => {
    const monthDate = subMonths(now, index)
    const value = format(monthDate, "yyyy-MM")
    const label = format(monthDate, "MMMM yyyy")
    return { value, label }
  })
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0
  return Number(((value / total) * 100).toFixed(1))
}

function getStatusWeight(status: Attendance["status"]) {
  if (status === "present" || status === "paid-leave" || status === "sick-leave") return 1
  if (status === "half-day") return 0.5
  return 0
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))
}

async function fetchAllAttendance() {
  const response = await fetch("/api/attendance")
  const json: ApiResponse<Attendance[]> = await response.json()

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || "Failed to fetch attendance")
  }

  return json.data
}

export function DataAnalytics() {
  const monthOptions = useMemo(() => getMonthOptions(), [])
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || format(new Date(), "yyyy-MM"))
  // Initialize CSRF token for API requests
  useInitializeCsrfToken()


  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useEmployees()
  const { data: credits = [], isLoading: creditsLoading, refetch: refetchCredits } = useCredits()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks()
  const { data: settings } = useSettings()

  const {
    data: attendance = [],
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["attendance-all"],
    queryFn: fetchAllAttendance,
    refetchInterval: 30000,
  })

  const isLoading = employeesLoading || creditsLoading || tasksLoading || attendanceLoading
  const companyName = settings?.organizationName || "Your Organization"
  const totalBaseSalary = useMemo(
    () => employees.reduce((sum, employee) => sum + (employee.salary || 0), 0),
    [employees],
  )

  const salaryMap = useMemo(() => {
    return new Map(employees.map((employee) => [employee.id, employee.salary || 0]))
  }, [employees])

  const selectedMonthAttendance = useMemo(
    () => attendance.filter((record) => record.date.startsWith(selectedMonth)),
    [attendance, selectedMonth],
  )

  const selectedMonthCredits = useMemo(
    () => credits.filter((credit) => credit.dateTaken.startsWith(selectedMonth)),
    [credits, selectedMonth],
  )

  const selectedMonthTasks = useMemo(() => {
    return tasks.filter((task) => {
      const deadlineMonth = task.deadline ? format(new Date(task.deadline), "yyyy-MM") : ""
      const createdMonth = task.createdAt ? format(new Date(task.createdAt), "yyyy-MM") : ""
      return deadlineMonth === selectedMonth || createdMonth === selectedMonth
    })
  }, [tasks, selectedMonth])

  const attendanceDistribution = useMemo(() => {
    const base = {
      present: 0,
      absent: 0,
      "half-day": 0,
      "sick-leave": 0,
      "paid-leave": 0,
    } satisfies Record<Attendance["status"], number>

    for (const record of selectedMonthAttendance) {
      base[record.status] += 1
    }

    return Object.entries(base).map(([status, count]) => ({
      status,
      label: ATTENDANCE_LABELS[status as Attendance["status"]],
      value: count,
      fill: ATTENDANCE_COLORS[status as Attendance["status"]],
    }))
  }, [selectedMonthAttendance])

  const attendanceRate = useMemo(() => {
    const scored = selectedMonthAttendance.reduce((sum, row) => sum + getStatusWeight(row.status), 0)
    return percentage(scored, selectedMonthAttendance.length)
  }, [selectedMonthAttendance])

  const taskSummary = useMemo(() => {
    const now = new Date()
    const completed = selectedMonthTasks.filter((task) => task.isCompleted).length
    const pending = selectedMonthTasks.filter((task) => !task.isCompleted).length
    const overdue = selectedMonthTasks.filter((task) => !task.isCompleted && new Date(task.deadline) < now).length

    return {
      completed,
      pending,
      overdue,
      completionRate: percentage(completed, selectedMonthTasks.length),
    }
  }, [selectedMonthTasks])

  const outstandingCreditAmount = useMemo(() => {
    return credits.filter((credit) => !credit.isPaid).reduce((sum, credit) => sum + credit.amount, 0)
  }, [credits])

  const selectedMonthCreditAmount = useMemo(() => {
    return selectedMonthCredits.reduce((sum, credit) => sum + credit.amount, 0)
  }, [selectedMonthCredits])

  const selectedMonthLeaveDeduction = useMemo(() => {
    return selectedMonthAttendance.reduce((sum, row) => {
      const salary = salaryMap.get(row.employeeId) || 0
      if (row.status === "absent") return sum + salary / 30
      if (row.status === "half-day") return sum + salary / 60
      return sum
    }, 0)
  }, [selectedMonthAttendance, salaryMap])

  const selectedMonthNetPayroll = Math.max(0, totalBaseSalary - selectedMonthLeaveDeduction - selectedMonthCreditAmount)

  const monthlyTrend = useMemo(() => {
    return [...monthOptions]
      .reverse()
      .map((month) => {
        const monthAttendance = attendance.filter((row) => row.date.startsWith(month.value))
        const monthCredits = credits.filter((credit) => credit.dateTaken.startsWith(month.value))

        const leaveDeduction = monthAttendance.reduce((sum, row) => {
          const salary = salaryMap.get(row.employeeId) || 0
          if (row.status === "absent") return sum + salary / 30
          if (row.status === "half-day") return sum + salary / 60
          return sum
        }, 0)

        const creditAmount = monthCredits.reduce((sum, credit) => sum + credit.amount, 0)
        const deductions = leaveDeduction + creditAmount

        return {
          month: format(new Date(`${month.value}-01`), "MMM yy"),
          payroll: totalBaseSalary,
          deductions,
          net: Math.max(0, totalBaseSalary - deductions),
        }
      })
  }, [monthOptions, attendance, credits, salaryMap, totalBaseSalary])

  const taskByPriority = useMemo(() => {
    return (["high", "medium", "low"] as const).map((priority) => {
      const bucket = selectedMonthTasks.filter((task) => task.priority === priority)
      const done = bucket.filter((task) => task.isCompleted).length
      const pending = bucket.length - done

      return {
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        completed: done,
        pending,
        fill: PRIORITY_COLORS[priority],
      }
    })
  }, [selectedMonthTasks])

  const employeeInsights = useMemo(() => {
    return employees
      .map((employee) => {
        const personAttendance = selectedMonthAttendance.filter((row) => row.employeeId === employee.id)
        const personTasks = tasks.filter((task) => task.employeeId === employee.id)
        const personCredits = credits.filter((credit) => credit.employeeId === employee.id && !credit.isPaid)

        const attendanceScore = personAttendance.reduce((sum, row) => sum + getStatusWeight(row.status), 0)
        const attendancePct = percentage(attendanceScore, personAttendance.length)
        const pendingTasks = personTasks.filter((task) => !task.isCompleted).length
        const overdueTasks = personTasks.filter(
          (task) => !task.isCompleted && new Date(task.deadline) < new Date(),
        ).length
        const unpaidCredit = personCredits.reduce((sum, credit) => sum + credit.amount, 0)

        return {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          attendancePct,
          pendingTasks,
          overdueTasks,
          unpaidCredit,
        }
      })
      .sort((a, b) => b.unpaidCredit + b.overdueTasks * 1000 - (a.unpaidCredit + a.overdueTasks * 1000))
      .slice(0, 6)
  }, [employees, selectedMonthAttendance, tasks, credits])

  const handleRefresh = async () => {
    await Promise.all([refetchEmployees(), refetchCredits(), refetchTasks(), refetchAttendance()])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-3 text-sm text-muted-foreground">Building analytics from live data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-b from-cyan-500/10 via-background to-background">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="mt-1 rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Operational Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  {companyName} • Live payroll, attendance, task and credit intelligence
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
                <Activity className="mr-1 h-3.5 w-3.5" />
                Live every 30s
              </Badge>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[170px] rounded-full">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <section className="grid grid-cols-1 min-[520px]:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-gradient-to-br from-cyan-500/10 to-background">
            <CardHeader className="pb-2">
              <CardDescription>Total Workforce</CardDescription>
              <CardTitle className="text-3xl">{employees.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Active workforce in system
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-emerald-500/10 to-background">
            <CardHeader className="pb-2">
              <CardDescription>Attendance Score</CardDescription>
              <CardTitle className="text-3xl">{attendanceRate}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {selectedMonthAttendance.length} records in {format(new Date(`${selectedMonth}-01`), "MMMM")}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-amber-500/10 to-background">
            <CardHeader className="pb-2">
              <CardDescription>Task Completion</CardDescription>
              <CardTitle className="text-3xl">{taskSummary.completionRate}%</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
              <span>{taskSummary.completed} done</span>
              <span>{taskSummary.pending} pending</span>
              <span>{taskSummary.overdue} overdue</span>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-br from-rose-500/10 to-background">
            <CardHeader className="pb-2">
              <CardDescription>Net Payroll Estimate</CardDescription>
              <CardTitle className="text-3xl">₹{currency(selectedMonthNetPayroll)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Outstanding credits: ₹{currency(outstandingCreditAmount)}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-white/10 bg-gradient-to-b from-cyan-500/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-300" />
                Payroll Trend (Last {monthOptions.length} Months)
              </CardTitle>
              <CardDescription>Base payroll vs deductions vs projected net payout</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[320px] w-full"
                config={{
                  payroll: { label: "Payroll", color: "#22d3ee" },
                  deductions: { label: "Deductions", color: "#fb7185" },
                  net: { label: "Net", color: "#4ade80" },
                }}
              >
                <AreaChart data={monthlyTrend} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="payroll" stroke="var(--color-payroll)" fill="var(--color-payroll)" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="deductions" stroke="var(--color-deductions)" fill="var(--color-deductions)" fillOpacity={0.18} />
                  <Area type="monotone" dataKey="net" stroke="var(--color-net)" fill="var(--color-net)" fillOpacity={0.2} />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-b from-emerald-500/5 to-background">
            <CardHeader>
              <CardTitle>Attendance Mix</CardTitle>
              <CardDescription>Status distribution for selected month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[320px] w-full"
                config={{
                  present: { label: "Present", color: ATTENDANCE_COLORS.present },
                  absent: { label: "Absent", color: ATTENDANCE_COLORS.absent },
                  halfDay: { label: "Half Day", color: ATTENDANCE_COLORS["half-day"] },
                  sickLeave: { label: "Sick Leave", color: ATTENDANCE_COLORS["sick-leave"] },
                  paidLeave: { label: "Paid Leave", color: ATTENDANCE_COLORS["paid-leave"] },
                }}
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <Pie
                    data={attendanceDistribution.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={102}
                    paddingAngle={2}
                  >
                    {attendanceDistribution.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-white/10 bg-gradient-to-b from-amber-500/5 to-background">
            <CardHeader>
              <CardTitle>Task Priority Execution</CardTitle>
              <CardDescription>Completed vs pending tasks by priority bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[300px] w-full"
                config={{
                  completed: { label: "Completed", color: "#4ade80" },
                  pending: { label: "Pending", color: "#f97316" },
                }}
              >
                <BarChart data={taskByPriority} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="priority" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="var(--color-pending)" radius={[6, 6, 0, 0]} />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-gradient-to-b from-rose-500/5 to-background">
            <CardHeader>
              <CardTitle>Month Breakdown</CardTitle>
              <CardDescription>Current month financial drivers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
                <span>Base Payroll</span>
                <strong>₹{currency(totalBaseSalary)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                <span>Leave Deductions</span>
                <strong>₹{currency(selectedMonthLeaveDeduction)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                <span>Credits Issued</span>
                <strong>₹{currency(selectedMonthCreditAmount)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                <span>Projected Net</span>
                <strong>₹{currency(selectedMonthNetPayroll)}</strong>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-white/10 bg-gradient-to-b from-background to-muted/20">
            <CardHeader>
              <CardTitle>High Attention Employees</CardTitle>
              <CardDescription>
                Sorted by financial exposure and overdue delivery risk for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-3 text-left font-medium">Employee</th>
                      <th className="py-3 text-left font-medium">Role</th>
                      <th className="py-3 text-right font-medium">Attendance %</th>
                      <th className="py-3 text-right font-medium">Pending Tasks</th>
                      <th className="py-3 text-right font-medium">Overdue</th>
                      <th className="py-3 text-right font-medium">Unpaid Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeInsights.map((employee) => (
                      <tr key={employee.id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-3 font-medium">{employee.name}</td>
                        <td className="py-3 text-muted-foreground">{employee.role}</td>
                        <td className="py-3 text-right">{employee.attendancePct}%</td>
                        <td className="py-3 text-right">{employee.pendingTasks}</td>
                        <td className="py-3 text-right text-amber-400">{employee.overdueTasks}</td>
                        <td className="py-3 text-right text-rose-400">₹{currency(employee.unpaidCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

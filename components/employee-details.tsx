"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CreditCard, CheckSquare, DollarSign, Phone, Mail, CalendarDays } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useAttendance, useCredits, useEmployeeTasks } from "@/hooks/use-api"
import type { Employee } from "@/lib/types"
import { format } from "date-fns"

interface EmployeeDetailsProps {
  employee: Employee
  onClose: () => void
}

export function EmployeeDetails({ employee }: EmployeeDetailsProps) {
  const { t } = useLanguage()
  const [currentMonth, setCurrentMonth] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  // Set current month and date on client-side only to avoid hydration issues
  useEffect(() => {
    const now = new Date()
    setCurrentMonth(now.toISOString().slice(0, 7))
    setCurrentDate(now)
  }, [])

  const { data: attendance = [] } = useAttendance(employee.id)
  const { data: credits = [] } = useCredits(employee.id)
  const { data: tasks = [] } = useEmployeeTasks(employee.id)

  const getSalaryBreakdown = () => {
    const baseSalary = employee.salary
    let finalSalary = baseSalary
    const deductions = []

    // Calculate leave deductions
    const monthlyAttendance = attendance.filter((a) => a.date.startsWith(currentMonth))
    const leaveCount = monthlyAttendance.filter((a) => ["absent", "half-day", "sick-leave"].includes(a.status)).length

    if (leaveCount > 0) {
      const leaveDeduction = (baseSalary * 10 * leaveCount) / 100 // 10% per leave day
      deductions.push({
        type: "Leave Deduction",
        description: `${leaveCount} leave days × 10%`,
        amount: leaveDeduction,
      })
      finalSalary -= leaveDeduction
    }

    // Calculate credit deductions
    const unpaidCredits = credits.filter((c) => !c.isPaid)
    if (unpaidCredits.length > 0) {
      const creditDeduction = unpaidCredits.reduce((sum, c) => sum + c.amount, 0)
      deductions.push({
        type: "Unpaid Credits",
        description: `${unpaidCredits.length} unpaid credits`,
        amount: creditDeduction,
      })
      finalSalary -= creditDeduction
    }

    return {
      baseSalary,
      deductions,
      finalSalary: Math.max(0, finalSalary),
    }
  }

  const salaryBreakdown = getSalaryBreakdown()
  const unpaidCredits = credits.filter((c) => !c.isPaid)
  const completedTasks = tasks.filter((t) => t.isCompleted)
  const pendingTasks = tasks.filter((t) => !t.isCompleted)

  console.log("Employee Details Debug:", {
    employeeId: employee.id,
    creditsCount: credits.length,
    tasksCount: tasks.length,
    attendanceCount: attendance.length,
  })

  // Get recent attendance (last 30 days) - only if currentDate is available
  const recentAttendance = currentDate 
    ? (() => {
        const thirtyDaysAgo = new Date(currentDate)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return attendance.filter((a) => new Date(a.date) >= thirtyDaysAgo)
      })()
    : []

  const attendanceStats = {
    present: recentAttendance.filter((a) => a.status === "present").length,
    absent: recentAttendance.filter((a) => a.status === "absent").length,
    halfDay: recentAttendance.filter((a) => a.status === "half-day").length,
    sickLeave: recentAttendance.filter((a) => a.status === "sick-leave").length,
    paidLeave: recentAttendance.filter((a) => a.status === "paid-leave").length,
  }

  // Don't render until currentDate is available
  if (!currentDate || !currentMonth) {
    return <div className="p-6 text-center">Loading employee details...</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-6">
      {/* Employee Header */}
      <Card>
        <CardContent className="pt-6 sm:pt-8">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage
                src={employee.profilePhoto || `/placeholder.svg?height=128&width=128&query=${employee.name}`}
              />
              <AvatarFallback className="text-xl sm:text-2xl">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 w-full">
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{employee.name}</h2>
              <p className="text-lg sm:text-xl text-muted-foreground">{employee.role}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Badge variant={employee.status === "active" ? "default" : "secondary"} className="text-sm px-3 py-1">
                  {employee.status === "active" ? t("employee.active") : t("employee.inactive")}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {format(new Date(employee.joiningDate), "MMM dd, yyyy")}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Salary Breakdown</p>
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Base Salary</span>
                    <span className="font-semibold">₹{salaryBreakdown.baseSalary.toLocaleString()}</span>
                  </div>

                  {salaryBreakdown.deductions.map((deduction, index) => (
                    <div key={index} className="flex justify-between items-center text-red-600">
                      <div className="flex flex-col">
                        <span className="text-sm">{deduction.type}</span>
                        <span className="text-xs text-muted-foreground">{deduction.description}</span>
                      </div>
                      <span className="font-semibold">-₹{deduction.amount.toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Net Salary</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{salaryBreakdown.finalSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Mail className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground mb-1">{t("employee.email")}</p>
                <p className="font-medium break-all text-sm sm:text-base">{employee.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Phone className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground mb-1">{t("employee.mobile")}</p>
                <p className="font-medium text-sm sm:text-base">{employee.mobile}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10 sm:h-12 text-xs sm:text-sm">
          <TabsTrigger value="overview" className="px-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-2">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="credits" className="px-2">
            Credits
          </TabsTrigger>
          <TabsTrigger value="tasks" className="px-2">
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Present Days</CardTitle>
                <Calendar className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{attendanceStats.present}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Unpaid Credits</CardTitle>
                <CreditCard className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{unpaidCredits.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₹{unpaidCredits.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <CheckSquare className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{pendingTasks.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{completedTasks.length} completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  ₹{salaryBreakdown.finalSalary.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">After deductions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Attendance Summary (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">{attendanceStats.present}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("attendance.present")}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">{attendanceStats.absent}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("attendance.absent")}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600">{attendanceStats.halfDay}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("attendance.halfDay")}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">{attendanceStats.sickLeave}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("attendance.sickLeave")}</p>
                </div>
                <div className="text-center space-y-2 col-span-2 sm:col-span-1">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">{attendanceStats.paidLeave}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("attendance.paidLeave")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6 mt-6">
          {unpaidCredits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-red-600">
                  Pending Credits ({unpaidCredits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unpaidCredits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border border-red-200 rounded-lg space-y-3 sm:space-y-0 bg-red-50"
                    >
                      <div className="space-y-2">
                        <p className="text-lg sm:text-xl font-semibold text-red-700">
                          ₹{credit.amount.toLocaleString()}
                        </p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Taken: {format(new Date(credit.dateTaken), "MMM dd, yyyy")}</p>
                          <p>Promise: {format(new Date(credit.promiseReturnDate), "MMM dd, yyyy")}</p>
                          {currentDate && new Date(credit.promiseReturnDate) < currentDate && (
                            <p className="text-red-600 font-medium">Overdue!</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="destructive">Unpaid</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">All Credit History ({credits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {credits.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No credit records found.</p>
                  <p className="text-sm text-muted-foreground mt-2">Credits will appear here once added.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {credits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="space-y-2">
                        <p className="text-lg sm:text-xl font-semibold">₹{credit.amount.toLocaleString()}</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Taken: {format(new Date(credit.dateTaken), "MMM dd, yyyy")}</p>
                          <p>Promise: {format(new Date(credit.promiseReturnDate), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <Badge variant={credit.isPaid ? "default" : "destructive"} className="self-start sm:self-center">
                        {credit.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6 mt-6">
          {pendingTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-orange-600">
                  Pending Tasks ({pendingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 border border-orange-200 rounded-lg space-y-4 lg:space-y-0 bg-orange-50"
                    >
                      <div className="flex-1 space-y-2">
                        <h4 className="text-base sm:text-lg font-semibold leading-tight">{task.title}</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Deadline: {format(new Date(task.deadline), "MMM dd, yyyy")}
                          {currentDate && new Date(task.deadline) < currentDate && (
                            <span className="text-red-600 font-medium ml-2">Overdue!</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">All Task History ({tasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">No tasks assigned.</p>
                  <p className="text-sm text-muted-foreground mt-2">Tasks will appear here once created.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 border rounded-lg space-y-4 lg:space-y-0"
                    >
                      <div className="flex-1 space-y-2">
                        <h4 className="text-base sm:text-lg font-semibold leading-tight">{task.title}</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{task.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Deadline: {format(new Date(task.deadline), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant={task.isCompleted ? "default" : "outline"}>
                          {task.isCompleted ? t("tasks.completed") : t("tasks.pending")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

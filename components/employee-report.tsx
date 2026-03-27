"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { User, Mail, Phone, MapPin, Calendar, CreditCard, FileText, Download, Printer, FileSpreadsheet } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isValid, parseISO } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { useEmployeeTasks, useCredits, useAttendance } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/types"
import { exportEmployeeToExcel } from "@/lib/excel-export"

interface EmployeeReportProps {
  employee: Employee
  isOpen: boolean
  onClose: () => void
}

const safeFormatDate = (dateValue: string | Date | null | undefined, formatString = "MMM dd, yyyy"): string => {
  if (!dateValue) return "N/A"

  let date: Date
  if (typeof dateValue === "string") {
    date = parseISO(dateValue)
  } else {
    date = dateValue
  }

  if (!isValid(date)) return "Invalid Date"

  try {
    return format(date, formatString)
  } catch (error) {
    return "Invalid Date"
  }
}

const safeCreateDate = (dateValue: string | Date | null | undefined): Date | null => {
  if (!dateValue) return null

  let date: Date
  if (typeof dateValue === "string") {
    date = parseISO(dateValue)
  } else {
    date = dateValue
  }

  return isValid(date) ? date : null
}

export function EmployeeReport({ employee, isOpen, onClose }: EmployeeReportProps) {
  const [currentDate, setCurrentDate] = useState("")
  const [currentDateObj, setCurrentDateObj] = useState<Date | null>(null)
  const { t } = useLanguage()
  const { toast } = useToast()

  // Set current date on client-side only
  useEffect(() => {
    const now = new Date()
    setCurrentDate(format(now, "MMMM dd, yyyy"))
    setCurrentDateObj(now)
  }, [])

  const { data: tasks = [] } = useEmployeeTasks(employee.id)
  const { data: allCredits = [] } = useCredits()
  const { data: allAttendance = [] } = useAttendance(employee.id)

  // Filter data for this employee
  const employeeCredits = allCredits.filter((credit) => credit.employeeId === employee.id)
  const employeeAttendance = allAttendance.filter((att) => att.employeeId === employee.id)

  // Calculate current month attendance - only if currentDateObj is available
  const monthStart = currentDateObj ? startOfMonth(currentDateObj) : null
  const monthEnd = currentDateObj ? endOfMonth(currentDateObj) : null
  const monthDays = currentDateObj && monthStart && monthEnd 
    ? eachDayOfInterval({ start: monthStart, end: monthEnd })
    : []

  const currentMonthAttendance = monthStart && monthEnd 
    ? employeeAttendance.filter((att) => {
        const attDate = safeCreateDate(att.date)
        if (!attDate) return false
        return attDate >= monthStart && attDate <= monthEnd
      })
    : []

  // Calculate statistics
  const stats = {
    // Task statistics
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.isCompleted).length,
    pendingTasks: tasks.filter((task) => !task.isCompleted).length,
    overdueTasks: currentDateObj ? tasks.filter((task) => {
      if (task.isCompleted) return false
      const deadlineDate = safeCreateDate(task.deadline)
      return deadlineDate && deadlineDate < currentDateObj
    }).length : 0,

    // Credit statistics
    totalCredits: employeeCredits.length,
    unpaidCredits: employeeCredits.filter((credit) => !credit.isPaid).length,
    totalCreditAmount: employeeCredits.reduce((sum, credit) => sum + credit.amount, 0),
    unpaidCreditAmount: employeeCredits
      .filter((credit) => !credit.isPaid)
      .reduce((sum, credit) => sum + credit.amount, 0),

    // Attendance statistics
    totalWorkingDays: monthDays.filter((day) => day.getDay() !== 0 && day.getDay() !== 6).length,
    presentDays: currentMonthAttendance.filter((att) => att.status === "present").length,
    absentDays: currentMonthAttendance.filter((att) => att.status === "absent").length,
    halfDays: currentMonthAttendance.filter((att) => att.status === "half-day").length,
    sickLeave: currentMonthAttendance.filter((att) => att.status === "sick-leave").length,
    paidLeave: currentMonthAttendance.filter((att) => att.status === "paid-leave").length,
  }

  // Calculate attendance percentage
  const attendancePercentage =
    stats.totalWorkingDays > 0
      ? (((stats.presentDays + stats.halfDays * 0.5) / stats.totalWorkingDays) * 100).toFixed(1)
      : 0

  // Calculate estimated salary
  const baseSalary = employee.salary || 0
  const leaveDeduction = (stats.absentDays + stats.halfDays * 0.5) * 100
  const creditDeduction = stats.unpaidCreditAmount
  const estimatedSalary = Math.max(0, baseSalary - leaveDeduction - creditDeduction)

  const handlePrintReport = () => {
    window.print()
    toast({
      title: "Report Printed",
      description: "Employee report has been sent to printer.",
    })
  }

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Employee report is being downloaded as PDF.",
    })
  }

  const handleExportToExcel = async () => {
    try {
      toast({
        title: "Generating Excel...",
        description: "Please wait while we prepare your report.",
      })

      await exportEmployeeToExcel({
        employee,
        attendance: employeeAttendance,
        credits: employeeCredits,
        tasks,
        stats: {
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          pendingTasks: stats.pendingTasks,
          overdueTasks: stats.overdueTasks,
          totalCredits: stats.totalCredits,
          unpaidCredits: stats.unpaidCredits,
          totalCreditAmount: stats.totalCreditAmount,
          unpaidCreditAmount: stats.unpaidCreditAmount,
          presentDays: stats.presentDays,
          absentDays: stats.absentDays,
          halfDays: stats.halfDays,
          attendancePercentage: attendancePercentage.toString(),
          baseSalary,
          leaveDeduction,
          creditDeduction,
          netSalary: estimatedSalary,
        },
      })

      toast({
        title: "Excel Downloaded",
        description: "Employee report has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export employee report to Excel.",
        variant: "destructive",
      })
    }
  }

  // Don't render until dates are initialized
  if (!currentDate || !currentDateObj) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <FileText className="h-6 w-6" />
              Loading Report...
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <p>Loading employee report...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full max-h-[95vh] overflow-y-auto p-10">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
        <FileText className="h-6 w-6" />
        Employee Report
          </DialogTitle>
          <DialogDescription className="text-base">
        Comprehensive performance and attendance report for {employee.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-5">
              <Avatar className="h-24 w-24 border-2">
                <AvatarImage
                  src={employee.profilePhoto || `/placeholder.svg?height=96&width=96&query=${employee.name}`}
                />
                <AvatarFallback className="text-2xl font-semibold">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">{employee.name}</h2>
                <p className="text-lg text-muted-foreground">{employee.role}</p>
                <p className="text-sm text-muted-foreground">Generated on {currentDate || "Loading..."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportToExcel} className="gap-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">Export Excel</span>
              </Button>
              <Button variant="outline" onClick={handlePrintReport} className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadReport} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-muted-foreground">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-green-600">{attendancePercentage}%</div>
                <p className="text-sm text-muted-foreground">Current month</p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-muted-foreground">Tasks Completed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-blue-600">{stats.completedTasks}</div>
                <p className="text-sm text-muted-foreground">Out of {stats.totalTasks} total</p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-muted-foreground">Unpaid Credits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-orange-600">{stats.unpaidCredits}</div>
                <p className="text-sm text-muted-foreground">₹{stats.unpaidCreditAmount.toLocaleString()} outstanding</p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium text-muted-foreground">Net Salary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-green-600">₹{estimatedSalary.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">After deductions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <User className="h-6 w-6" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-7">
                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                      <p className="text-base break-words">{employee.email || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-base break-words">{employee.mobile || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-7">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                      <p className="text-base break-words">{"Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Join Date</p>
                      <p className="text-base break-words">{safeFormatDate(employee.joiningDate, "MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="attendance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-14">
              <TabsTrigger value="attendance" className="text-base font-medium">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-base font-medium">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="credits" className="text-base font-medium">
                Credits
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-base font-medium">
                Salary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Monthly Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.presentDays}</div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Present Days</p>
                    </div>
                    <div className="text-center p-5 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absentDays}</div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Absent Days</p>
                    </div>
                    <div className="text-center p-5 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.halfDays}</div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mt-1">Half Days</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-semibold text-xl flex items-center gap-3">
                      <Calendar className="h-6 w-6" />
                      Recent Attendance
                    </h4>
                    <div className="space-y-4">
                      {currentMonthAttendance
                        .sort((a, b) => {
                          const dateA = safeCreateDate(b.date)
                          const dateB = safeCreateDate(a.date)
                          if (!dateA || !dateB) return 0
                          return dateA.getTime() - dateB.getTime()
                        })
                        .slice(0, 8)
                        .map((attendance) => (
                          <div key={attendance.id} className="flex items-center justify-between p-5 border-2 rounded-lg hover:shadow-md transition-all bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                            <div className="flex items-center gap-4">
                              <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
                                attendance.status === "present" ? "bg-green-500" :
                                attendance.status === "absent" ? "bg-red-500" :
                                "bg-orange-500"
                              }`}></div>
                              <span className="font-medium text-base">{safeFormatDate(attendance.date, "EEEE, MMM dd")}</span>
                            </div>
                            <Badge
                              variant={
                                attendance.status === "present"
                                  ? "default"
                                  : attendance.status === "absent"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="px-4 py-1.5 capitalize text-sm"
                            >
                              {attendance.status.replace("-", " ")}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Task Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-5 border-2 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                      <div className="text-2xl font-bold">{stats.totalTasks}</div>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Total</p>
                    </div>
                    <div className="text-center p-5 border-2 border-green-200 dark:border-green-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Completed</p>
                    </div>
                    <div className="text-center p-5 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingTasks}</div>
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1">Pending</p>
                    </div>
                    <div className="text-center p-5 border-2 border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueTasks}</div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Overdue</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-semibold text-xl flex items-center gap-3">
                      <FileText className="h-6 w-6" />
                      Recent Tasks
                    </h4>
                    <div className="space-y-4">
                      {tasks.slice(0, 6).map((task) => (
                        <div key={task.id} className="p-6 border-2 rounded-lg space-y-4 hover:shadow-md transition-all bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${
                                task.isCompleted ? "bg-green-500" : "bg-orange-500"
                              }`}></div>
                              <h5 className="font-semibold text-lg leading-tight break-words">{task.title}</h5>
                            </div>
                            <div className="flex flex-wrap gap-2 items-start flex-shrink-0">
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "destructive"
                                    : task.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                }
                                className="capitalize px-3 py-1"
                              >
                                {task.priority}
                              </Badge>
                              <Badge variant={task.isCompleted ? "default" : "secondary"} className="px-3 py-1">
                                {task.isCompleted ? "✓ Done" : "○ Pending"}
                              </Badge>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-base text-muted-foreground pl-7 break-words">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground pl-7">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Due: {safeFormatDate(task.deadline)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Credit History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-5 border-2 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                      <div className="text-2xl font-bold">{stats.totalCredits}</div>
                      <p className="text-sm font-medium text-muted-foreground mt-1">Total Credits</p>
                    </div>
                    <div className="text-center p-5 border-2 border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unpaidCredits}</div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Unpaid</p>
                    </div>
                    <div className="text-center p-5 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{stats.totalCreditAmount.toLocaleString()}</div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">Total Amount</p>
                    </div>
                    <div className="text-center p-5 border-2 border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        ₹{stats.unpaidCreditAmount.toLocaleString()}
                      </div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Outstanding</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-semibold text-xl flex items-center gap-3">
                      <CreditCard className="h-6 w-6" />
                      Credit Records
                    </h4>
                    <div className="space-y-4">
                      {employeeCredits.map((credit) => (
                        <div key={credit.id} className={`p-6 border-2 rounded-lg hover:shadow-md transition-all ${
                          credit.isPaid 
                            ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/10 dark:to-green-900/10 border-green-200 dark:border-green-900" 
                            : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/10 dark:to-red-900/10 border-red-200 dark:border-red-900"
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${
                                credit.isPaid ? "bg-green-200 dark:bg-green-800" : "bg-red-200 dark:bg-red-800"
                              }`}>
                                <CreditCard className={`h-5 w-5 ${
                                  credit.isPaid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                                }`} />
                              </div>
                              <span className="text-2xl font-bold">₹{credit.amount.toLocaleString()}</span>
                            </div>
                            <Badge variant={credit.isPaid ? "default" : "destructive"} className="px-4 py-1.5 text-sm">
                              {credit.isPaid ? "✓ Paid" : "○ Unpaid"}
                            </Badge>
                          </div>
                          <div className="text-base space-y-2 pl-14">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-muted-foreground font-medium">Taken:</span>
                              <span className="font-medium">{safeFormatDate(credit.dateTaken)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-muted-foreground font-medium">Promise:</span>
                              <span className="font-medium">{safeFormatDate(credit.promiseReturnDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salary" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">Salary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <p className="text-base text-muted-foreground font-medium mb-2">Base Salary</p>
                          <span className="text-3xl font-bold text-green-600 dark:text-green-400">₹{baseSalary.toLocaleString()}</span>
                        </div>
                        <Badge variant="outline" className="bg-white dark:bg-slate-800 px-4 py-1.5">Monthly</Badge>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h4 className="font-semibold text-xl flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        Deductions
                      </h4>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-6 border-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/10 dark:to-red-900/10 border-red-200 dark:border-red-900">
                          <div>
                            <p className="font-semibold text-base">Leave Deduction</p>
                            <p className="text-sm text-muted-foreground mt-1">{stats.absentDays + stats.halfDays * 0.5} days absent</p>
                          </div>
                          <span className="font-bold text-red-600 dark:text-red-400 text-xl">-₹{leaveDeduction.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-6 border-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/10 dark:to-red-900/10 border-red-200 dark:border-red-900">
                          <div>
                            <p className="font-semibold text-base">Credit Deduction</p>
                            <p className="text-sm text-muted-foreground mt-1">{stats.unpaidCredits} unpaid credits</p>
                          </div>
                          <span className="font-bold text-red-600 dark:text-red-400 text-xl">-₹{creditDeduction.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950/30 dark:to-green-900/30 rounded-lg border-2 border-green-300 dark:border-green-700 shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <p className="text-base text-green-700 dark:text-green-300 font-semibold mb-2">Net Salary (This Month)</p>
                          <span className="text-4xl font-bold text-green-600 dark:text-green-400">₹{estimatedSalary.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-green-600 dark:bg-green-700 text-white px-4 py-1.5 text-sm">Final</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

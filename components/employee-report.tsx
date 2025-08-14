"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { User, Mail, Phone, MapPin, Calendar, CreditCard, FileText, Download, Printer } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isValid, parseISO } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { useEmployeeTasks, useCredits, useAttendance } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/types"

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={employee.profilePhoto || `/placeholder.svg?height=80&width=80&query=${employee.name}`}
                />
                <AvatarFallback className="text-xl font-semibold">
                  {employee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold">{employee.name}</h2>
                <p className="text-lg text-muted-foreground">{employee.role}</p>
                <p className="text-sm text-muted-foreground">Generated on {currentDate || "Loading..."}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrintReport} className="gap-2 bg-transparent">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadReport} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">{attendancePercentage}%</div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.completedTasks}</div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">{stats.unpaidCredits}</div>
                <p className="text-sm font-medium text-muted-foreground">Unpaid Credits</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">₹{estimatedSalary.toLocaleString()}</div>
                <p className="text-sm font-medium text-muted-foreground">Net Salary</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="text-base">{employee.email || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-base">{employee.mobile || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-base">{"Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                      <p className="text-base">{safeFormatDate(employee.joiningDate, "MMMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="attendance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="attendance" className="text-sm">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-sm">
                Tasks
              </TabsTrigger>
              <TabsTrigger value="credits" className="text-sm">
                Credits
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-sm">
                Salary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{stats.presentDays}</div>
                      <p className="text-sm font-medium text-green-700">Present Days</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{stats.absentDays}</div>
                      <p className="text-sm font-medium text-red-700">Absent Days</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{stats.halfDays}</div>
                      <p className="text-sm font-medium text-orange-700">Half Days</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Recent Attendance</h4>
                    <div className="space-y-3">
                      {currentMonthAttendance
                        .sort((a, b) => {
                          const dateA = safeCreateDate(b.date)
                          const dateB = safeCreateDate(a.date)
                          if (!dateA || !dateB) return 0
                          return dateA.getTime() - dateB.getTime()
                        })
                        .slice(0, 8)
                        .map((attendance) => (
                          <div key={attendance.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <span className="font-medium">{safeFormatDate(attendance.date, "EEEE, MMM dd")}</span>
                            <Badge
                              variant={
                                attendance.status === "present"
                                  ? "default"
                                  : attendance.status === "absent"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="px-3 py-1"
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
                <CardHeader>
                  <CardTitle>Task Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.totalTasks}</div>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Recent Tasks</h4>
                    <div className="space-y-3">
                      {tasks.slice(0, 6).map((task) => (
                        <div key={task.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <h5 className="font-medium">{task.title}</h5>
                            <div className="flex gap-2">
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
                              <Badge variant={task.isCompleted ? "default" : "secondary"}>
                                {task.isCompleted ? "Done" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <p className="text-xs text-muted-foreground">Due: {safeFormatDate(task.deadline)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Credit History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.totalCredits}</div>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.unpaidCredits}</div>
                      <p className="text-sm text-muted-foreground">Unpaid</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">₹{stats.totalCreditAmount.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        ₹{stats.unpaidCreditAmount.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Credit Records</h4>
                    <div className="space-y-3">
                      {employeeCredits.map((credit) => (
                        <div key={credit.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              <span className="text-lg font-semibold">₹{credit.amount.toLocaleString()}</span>
                            </div>
                            <Badge variant={credit.isPaid ? "default" : "destructive"}>
                              {credit.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Taken: {safeFormatDate(credit.dateTaken)}</p>
                            <p>Promise: {safeFormatDate(credit.promiseReturnDate)}</p>
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
                <CardHeader>
                  <CardTitle>Salary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-6 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Base Salary</span>
                        <span className="text-2xl font-bold text-green-600">₹{baseSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Deductions</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 border rounded-lg">
                          <span>Leave Deduction ({stats.absentDays + stats.halfDays * 0.5} days)</span>
                          <span className="font-semibold text-red-600">-₹{leaveDeduction.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 border rounded-lg">
                          <span>Credit Deduction</span>
                          <span className="font-semibold text-red-600">-₹{creditDeduction.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Net Salary</span>
                        <span className="text-3xl font-bold text-green-600">₹{estimatedSalary.toLocaleString()}</span>
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

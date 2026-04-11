"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon, RotateCcw, Trash2, Users, Activity, CalendarDays } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { 
  useEmployees, 
  useAttendance, 
  useCreateAttendance, 
  useUpdateAttendance, 
  useDeleteAttendance, 
  useResetAttendance 
} from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, subDays, startOfWeek, isAfter } from "date-fns"
import type { Attendance } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"

const attendanceStatusConfig = {
  present: { label: "Present", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-100" },
  absent: { label: "Absent", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-100" },
  "half-day": { label: "Half Day", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-100" },
  "sick-leave": { label: "Sick Leave", color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-100" },
  "paid-leave": { label: "Paid Leave", color: "bg-purple-500", textColor: "text-purple-700", bgColor: "bg-purple-100" },
}

type AttendanceStatus = Attendance["status"]

export function AttendanceCalendar() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present")
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ show: boolean; attendance: Attendance | null }>({ 
    show: false, 
    attendance: null 
  })

  // Set current date on client-side only to avoid hydration issues
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const { data: employees = [], isLoading: employeesLoading } = useEmployees()
  const { data: attendance = [], isLoading: attendanceLoading } = useAttendance(selectedEmployee)
  const createAttendanceMutation = useCreateAttendance()
  const updateAttendanceMutation = useUpdateAttendance()
  const deleteAttendanceMutation = useDeleteAttendance()
  const resetAttendanceMutation = useResetAttendance()

  // Calculate month values - use null safety instead of early return
  const monthStart = currentDate ? startOfMonth(currentDate) : null
  const monthEnd = currentDate ? endOfMonth(currentDate) : null
  const monthDays = currentDate && monthStart && monthEnd 
    ? eachDayOfInterval({ start: monthStart, end: monthEnd })
    : []
  const leadingEmptyDays = monthStart ? Array.from({ length: monthStart.getDay() }) : []

  // Get attendance for the current month
  const monthAttendance = useMemo(() => {
    if (!monthStart || !monthEnd) return new Map()
    
    const attendanceMap = new Map<string, Attendance>()
    attendance.forEach((record) => {
      const recordDate = new Date(record.date)
      if (recordDate >= monthStart && recordDate <= monthEnd) {
        attendanceMap.set(format(recordDate, "yyyy-MM-dd"), record)
      }
    })
    return attendanceMap
  }, [attendance, monthStart, monthEnd])

  const allAttendanceByDate = useMemo(() => {
    const map = new Map<string, Attendance>()
    attendance.forEach((record) => {
      map.set(record.date, record)
    })
    return map
  }, [attendance])

  // Don't render calendar until currentDate is set - move after all hooks
  if (!currentDate || employeesLoading || (selectedEmployee && attendanceLoading)) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, idx) => (
                <Skeleton key={`attendance-skeleton-${idx}`} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee first",
        variant: "destructive",
      })
      return
    }
    
    const existingAttendance = getAttendanceForDate(date)
    if (existingAttendance) {
      // If attendance exists, set up for editing
      setEditingAttendance(existingAttendance)
      setSelectedStatus(existingAttendance.status)
    } else {
      // New attendance
      setEditingAttendance(null)
      setSelectedStatus("")
    }
    setSelectedDate(date)
  }

  const applyDatePreset = (preset: "today" | "yesterday" | "week-start" | "month-start") => {
    const now = new Date()
    const presetDate =
      preset === "today"
        ? now
        : preset === "yesterday"
          ? subDays(now, 1)
          : preset === "week-start"
            ? startOfWeek(now, { weekStartsOn: 1 })
            : startOfMonth(now)

    setCurrentDate(presetDate)
    handleDateClick(presetDate)
  }

  const getBulkDates = (preset: "today" | "last-7" | "week-to-date" | "month-to-date") => {
    const today = new Date()
    if (preset === "today") {
      return [today]
    }
    if (preset === "last-7") {
      return Array.from({ length: 7 }).map((_, index) => subDays(today, index)).reverse()
    }
    if (preset === "week-to-date") {
      return eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: today,
      })
    }
    return eachDayOfInterval({
      start: startOfMonth(today),
      end: today,
    })
  }

  const handleBulkAttendance = async (preset: "today" | "last-7" | "week-to-date" | "month-to-date") => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee first",
        variant: "destructive",
      })
      return
    }

    const dates = getBulkDates(preset).filter((date) => !isAfter(date, new Date()))
    if (dates.length === 0) return

    setIsBulkUpdating(true)
    let created = 0
    let updated = 0
    let failed = 0

    for (const date of dates) {
      const dateKey = format(date, "yyyy-MM-dd")
      const existing = allAttendanceByDate.get(dateKey)

      try {
        if (existing) {
          await updateAttendanceMutation.mutateAsync({
            id: existing.id,
            employeeId: selectedEmployee,
            status: bulkStatus,
          })
          updated += 1
        } else {
          await createAttendanceMutation.mutateAsync({
            employeeId: selectedEmployee,
            date: dateKey,
            status: bulkStatus,
          })
          created += 1
        }
      } catch {
        failed += 1
      }
    }

    setIsBulkUpdating(false)
    toast({
      title: "Bulk Update Complete",
      description: `Created: ${created}, Updated: ${updated}, Failed: ${failed}`,
      variant: failed > 0 ? "destructive" : "default",
    })
  }

  const handleMarkAttendance = async () => {
    if (!selectedEmployee || !selectedDate || !selectedStatus) {
      toast({
        title: "Missing Information",
        description: "Please select employee, date, and attendance status",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingAttendance) {
        // Update existing attendance
        await updateAttendanceMutation.mutateAsync({
          id: editingAttendance.id,
          employeeId: selectedEmployee,
          status: selectedStatus as AttendanceStatus,
        })
        toast({
          title: "Success",
          description: "Attendance updated successfully",
        })
      } else {
        // Create new attendance
        await createAttendanceMutation.mutateAsync({
          employeeId: selectedEmployee,
          date: format(selectedDate, "yyyy-MM-dd"),
          status: selectedStatus as AttendanceStatus,
        })
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        })
      }

      setSelectedDate(null)
      setSelectedStatus("")
      setEditingAttendance(null)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark attendance",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAttendance = async (attendance: Attendance) => {
    try {
      await deleteAttendanceMutation.mutateAsync({
        id: attendance.id,
        employeeId: attendance.employeeId,
      })
      toast({
        title: "Success",
        description: "Attendance deleted successfully",
      })
      setShowDeleteDialog({ show: false, attendance: null })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete attendance",
        variant: "destructive",
      })
    }
  }

  const handleResetAttendance = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd")
      await resetAttendanceMutation.mutateAsync(today)
      toast({
        title: "Success",
        description: "Today's attendance has been reset",
      })
      setShowResetDialog(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to reset attendance",
        variant: "destructive",
      })
    }
  }

  const getAttendanceForDate = (date: Date) => {
    return monthAttendance.get(format(date, "yyyy-MM-dd"))
  }

  const selectedEmployeeData = employees.find((emp) => emp.id === selectedEmployee)
  const monthlyTotal = monthAttendance.size
  const presentCount = Array.from(monthAttendance.values()).filter((record) => record.status === "present").length
  const absentCount = Array.from(monthAttendance.values()).filter((record) => record.status === "absent").length
  const monthlyCoverage = monthDays.length > 0 ? Math.round((monthlyTotal / monthDays.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-slate-50 via-white to-blue-50 p-5 shadow-sm dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Attendance</p>
            <h2 className="mt-1 text-2xl font-semibold">Track Attendance Day by Day</h2>
            <p className="text-sm text-muted-foreground">All values below are loaded in real time from your database.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-xl border bg-background/80 px-3 py-2">
              <div className="text-muted-foreground">Days Marked</div>
              <div className="font-semibold">{monthlyTotal}</div>
            </div>
            <div className="rounded-xl border bg-background/80 px-3 py-2">
              <div className="text-muted-foreground">Present</div>
              <div className="font-semibold text-emerald-700">{presentCount}</div>
            </div>
            <div className="rounded-xl border bg-background/80 px-3 py-2">
              <div className="text-muted-foreground">Absent</div>
              <div className="font-semibold text-rose-700">{absentCount}</div>
            </div>
            <div className="rounded-xl border bg-background/80 px-3 py-2">
              <div className="text-muted-foreground">Coverage</div>
              <div className="font-semibold text-blue-700">{monthlyCoverage}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("attendance.calendar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 min-w-0">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedEmployeeData && (
              <Badge variant="outline" className="w-fit">
                <Users className="mr-1 h-3 w-3" />
                {selectedEmployeeData.name}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Today Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedEmployee && (
        <Card className="border-dashed border-border/70 bg-muted/20">
          <CardContent className="py-10 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-semibold">No Employee Selected</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an employee to load attendance history and start marking days.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedEmployee && (
        <>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">One-Click Date Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => applyDatePreset("today")}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => applyDatePreset("yesterday")}>Yesterday</Button>
                <Button variant="outline" size="sm" onClick={() => applyDatePreset("week-start")}>Week Start</Button>
                <Button variant="outline" size="sm" onClick={() => applyDatePreset("month-start")}>Month Start</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Bulk Attendance Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
                <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as AttendanceStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status for bulk update" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={isBulkUpdating} onClick={() => handleBulkAttendance("today")}>Today</Button>
                  <Button variant="outline" size="sm" disabled={isBulkUpdating} onClick={() => handleBulkAttendance("last-7")}>Last 7 Days</Button>
                  <Button variant="outline" size="sm" disabled={isBulkUpdating} onClick={() => handleBulkAttendance("week-to-date")}>Week to Date</Button>
                  <Button variant="outline" size="sm" disabled={isBulkUpdating} onClick={() => handleBulkAttendance("month-to-date")}>Month to Date</Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Uses existing live API flow: existing records are updated, missing records are created.
              </p>
            </CardContent>
          </Card>

          {/* Calendar Navigation */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}

                {leadingEmptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="h-12" />
                ))}

                {/* Calendar days */}
                {monthDays.map((date) => {
                  const attendance = getAttendanceForDate(date)
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())

                  return (
                    <Button
                      key={date.toISOString()}
                      variant={isSelected ? "default" : "ghost"}
                      className={`
                        h-12 p-1 relative border border-transparent hover:border-border/70
                        ${isToday ? "ring-2 ring-primary" : ""}
                        ${attendance && attendance.status in attendanceStatusConfig ? attendanceStatusConfig[attendance.status as keyof typeof attendanceStatusConfig].bgColor : ""}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-sm ${attendance && attendance.status in attendanceStatusConfig ? attendanceStatusConfig[attendance.status as keyof typeof attendanceStatusConfig].textColor : ""}`}
                        >
                          {format(date, "d")}
                        </span>
                        {attendance && attendance.status in attendanceStatusConfig && (
                          <div className={`w-2 h-2 rounded-full ${attendanceStatusConfig[attendance.status as keyof typeof attendanceStatusConfig].color}`} />
                        )}
                      </div>
                    </Button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 justify-center">
                {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-sm">{config.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Tip:
                </span>{" "}
                click any date to add or update attendance instantly.
              </div>
              {monthAttendance.size === 0 && (
                <div className="mt-4 rounded-xl border border-dashed px-4 py-6 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No Attendance Yet for This Month</p>
                  <p className="text-xs text-muted-foreground">Use presets above or click on any date to start marking attendance.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Marking */}
          {selectedDate && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {editingAttendance ? "Edit" : "Mark"} Attendance for {format(selectedDate, "MMMM dd, yyyy")}
                  </span>
                  {editingAttendance && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog({ show: true, attendance: editingAttendance })}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </CardTitle>
                {editingAttendance && (
                  <p className="text-sm text-muted-foreground">
                    Current status: <Badge variant="outline">{attendanceStatusConfig[editingAttendance.status as keyof typeof attendanceStatusConfig]?.label}</Badge>
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attendance status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(attendanceStatusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${config.color}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleMarkAttendance}
                    disabled={!selectedStatus || createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                  >
                    {createAttendanceMutation.isPending || updateAttendanceMutation.isPending 
                      ? "Processing..." 
                      : editingAttendance 
                        ? "Update Attendance" 
                        : "Mark Attendance"
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDate(null)
                      setSelectedStatus("")
                      setEditingAttendance(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Summary */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(attendanceStatusConfig).map(([status, config]) => {
                  const count = Array.from(monthAttendance.values()).filter((record) => record.status === status).length

                  return (
                    <div key={status} className="text-center">
                      <div className={`text-2xl font-bold ${config.textColor}`}>{count}</div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Reset Attendance Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Today&apos;s Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all attendance records for today ({format(new Date(), "MMMM dd, yyyy")}). 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAttendance}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Attendance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Attendance Dialog */}
      <AlertDialog 
        open={showDeleteDialog.show} 
        onOpenChange={(open) => setShowDeleteDialog({ show: open, attendance: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
              {showDeleteDialog.attendance && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p><strong>Date:</strong> {showDeleteDialog.attendance.date}</p>
                  <p><strong>Status:</strong> {attendanceStatusConfig[showDeleteDialog.attendance.status as keyof typeof attendanceStatusConfig]?.label}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog.attendance && handleDeleteAttendance(showDeleteDialog.attendance)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

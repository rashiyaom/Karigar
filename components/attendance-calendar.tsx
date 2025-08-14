"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon, RotateCcw, Trash2, Edit } from "lucide-react"
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import type { Attendance } from "@/lib/types"
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

export function AttendanceCalendar() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ show: boolean; attendance: Attendance | null }>({ 
    show: false, 
    attendance: null 
  })

  // Set current date on client-side only to avoid hydration issues
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const { data: employees = [] } = useEmployees()
  const { data: attendance = [] } = useAttendance(selectedEmployee)
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

  // Don't render calendar until currentDate is set - move after all hooks
  if (!currentDate) {
    return <div>Loading calendar...</div>
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
          status: selectedStatus as any,
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
          status: selectedStatus as any,
        })
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        })
      }

      setSelectedDate(null)
      setSelectedStatus("")
      setEditingAttendance(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
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
    } catch (error) {
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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("attendance.calendar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
            {selectedEmployeeData && <Badge variant="outline">{selectedEmployeeData.name}</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Today's Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Calendar Navigation */}
          <Card>
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
                        h-12 p-1 relative
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
            </CardContent>
          </Card>

          {/* Attendance Marking */}
          {selectedDate && (
            <Card>
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
          <Card>
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
            <AlertDialogTitle>Reset Today's Attendance</AlertDialogTitle>
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

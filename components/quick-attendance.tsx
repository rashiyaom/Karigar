"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useEmployees, useCreateAttendance } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const attendanceStatusConfig = {
  present: { label: "Present", color: "bg-green-500", variant: "default" as const },
  absent: { label: "Absent", color: "bg-red-500", variant: "destructive" as const },
  "half-day": { label: "Half Day", color: "bg-orange-500", variant: "secondary" as const },
  "sick-leave": { label: "Sick Leave", color: "bg-blue-500", variant: "default" as const },
  "paid-leave": { label: "Paid Leave", color: "bg-purple-500", variant: "outline" as const },
}

export function QuickAttendance() {
  const [today, setToday] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState<string>("")

  const { data: employees = [] } = useEmployees()
  const createAttendanceMutation = useCreateAttendance()

  // Set dates on client-side only
  useEffect(() => {
    const now = new Date()
    setToday(format(now, "yyyy-MM-dd"))
    setCurrentDate(format(now, "MMMM dd, yyyy"))
  }, [])

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId],
    )
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map((emp) => emp.id))
    }
  }

  const handleMarkAttendance = async () => {
    if (selectedEmployees.length === 0 || !attendanceStatus) {
      toast({
        title: "Missing Information",
        description: "Please select employees and attendance status",
        variant: "destructive",
      })
      return
    }

    try {
      // Mark attendance for all selected employees
      await Promise.all(
        selectedEmployees.map((employeeId) =>
          createAttendanceMutation.mutateAsync({
            employeeId,
            date: today,
            status: attendanceStatus as any,
          }),
        ),
      )

      toast({
        title: "Success",
        description: `Attendance marked for ${selectedEmployees.length} employee(s)`,
      })

      setSelectedEmployees([])
      setAttendanceStatus("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance for some employees",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Quick Attendance - {currentDate || "Loading..."}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Select Employees</h4>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                  ${selectedEmployees.includes(employee.id) ? "bg-primary/10 border-primary" : "hover:bg-muted/50"}
                `}
                onClick={() => handleEmployeeToggle(employee.id)}
              >
                <div
                  className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center
                    ${selectedEmployees.includes(employee.id) ? "bg-primary border-primary" : "border-muted-foreground"}
                  `}
                >
                  {selectedEmployees.includes(employee.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{employee.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedEmployees.length > 0 && (
            <div className="mt-2">
              <Badge variant="outline">{selectedEmployees.length} employee(s) selected</Badge>
            </div>
          )}
        </div>

        {/* Attendance Status Selection */}
        <div>
          <h4 className="font-medium mb-4">Attendance Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(attendanceStatusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={attendanceStatus === status ? "default" : "outline"}
                className="h-auto p-3 flex flex-col gap-2"
                onClick={() => setAttendanceStatus(status)}
              >
                <div className={`w-4 h-4 rounded-full ${config.color}`} />
                <span className="text-sm">{config.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedEmployees([])
              setAttendanceStatus("")
            }}
          >
            Clear
          </Button>
          <Button
            onClick={handleMarkAttendance}
            disabled={selectedEmployees.length === 0 || !attendanceStatus || createAttendanceMutation.isPending}
          >
            {createAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

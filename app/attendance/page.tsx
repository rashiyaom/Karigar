import { AttendanceCalendar } from "@/components/attendance-calendar"

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage employee attendance</p>
        </div>
        <AttendanceCalendar />
      </div>
    </div>
  )
}

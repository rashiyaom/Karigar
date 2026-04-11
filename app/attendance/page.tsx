import { AttendanceCalendar } from "@/components/attendance-calendar"

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <AttendanceCalendar />
      </div>
    </div>
  )
}

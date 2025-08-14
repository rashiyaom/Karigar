export interface Employee {
  id: string
  name: string
  salary: number
  joiningDate: string
  mobile: string
  email: string
  role: string
  profilePhoto?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  status: "present" | "absent" | "half-day" | "sick-leave" | "paid-leave"
  createdAt: string
  updatedAt: string
}

export interface Credit {
  id: string
  employeeId: string
  amount: number
  dateTaken: string
  promiseReturnDate: string
  isPaid: boolean
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  employeeId: string // Changed to match validation schema
  title: string
  description: string
  deadline: string
  priority: "high" | "medium" | "low"
  isCompleted: boolean // Changed to match validation schema
  createdAt: string
  updatedAt: string
}

export interface Settings {
  organizationName: string
  leaveDeduction: {
    type: "percentage" | "fixed"
    value: number
  }
  workingHours?: {
    start: string
    end: string
  }
  weekendDays?: string[]
  autoMarkAbsent?: boolean
  emailNotifications?: boolean
  backupFrequency?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

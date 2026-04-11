import { z } from "zod"

// NOTE: Input sanitization should be applied in API endpoints
// See lib/input-sanitizer.ts for sanitizeObjectKeys(), sanitizeString(), etc.
// This ensures both Zod validation AND injection prevention

// Maximum field lengths to prevent database bloat and XSS
const MAX_STRING_LENGTH = 500
const MAX_EMAIL_LENGTH = 254
const MAX_MOBILE_LENGTH = 20
const MAX_DESCRIPTION_LENGTH = 2000

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(MAX_STRING_LENGTH, `Name must be less than ${MAX_STRING_LENGTH} characters`),
  salary: z.number().min(0, "Salary must be positive").max(1000000000, "Salary exceeds maximum allowed"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format"),
  mobile: z.string().min(1, "Mobile is required").max(MAX_MOBILE_LENGTH, "Mobile number is too long").regex(/^[0-9+\-\s()]*$/, "Invalid mobile number format"),
  email: z.string().email("Invalid email format").max(MAX_EMAIL_LENGTH, "Email is too long"),
  role: z.string().min(1, "Role is required").max(MAX_STRING_LENGTH, "Role is too long"),
  status: z.enum(["active", "inactive"]),
  profilePhoto: z.string().url("Invalid URL").max(2000, "Profile photo URL is too long").optional(),
})

export const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50, "Employee ID is invalid"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["present", "absent", "half-day", "sick-leave", "paid-leave"]),
})

export const creditSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50, "Employee ID is invalid"),
  amount: z.number().min(0, "Amount must be positive").max(1000000000, "Amount exceeds maximum allowed"),
  dateTaken: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  promiseReturnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isPaid: z.boolean().default(false),
})

export const taskSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50, "Employee ID is invalid"),
  title: z.string().min(1, "Title is required").max(MAX_STRING_LENGTH, "Title is too long"),
  description: z.string().min(1, "Description is required").max(MAX_DESCRIPTION_LENGTH, "Description is too long"),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be in YYYY-MM-DD format"),
  priority: z.enum(["high", "medium", "low"]),
  isCompleted: z.boolean().default(false),
})

export const settingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").max(MAX_STRING_LENGTH, "Organization name is too long").optional(),
  companyLogoUrl: z.string().url("Invalid company logo URL").max(2000, "Company logo URL is too long").optional(),
  leaveDeduction: z
    .object({
      type: z.enum(["percentage", "fixed"]),
      value: z.number().min(0, "Deduction value must be positive"),
    })
    .optional()
    .refine((value) => {
      if (!value) return true
      if (value.type === "percentage") {
        return value.value <= 100
      }
      return value.value <= 1000000000
    }, "Deduction value is too large for selected type"),
  workingHours: z
    .object({
      start: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
      end: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
    })
    .optional(),
  weekendDays: z.array(z.string().max(20, "Weekend day value is too long")).max(7, "Too many weekend days").optional(),
  autoMarkAbsent: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  backupFrequency: z.enum(["hourly", "daily", "weekly", "monthly"]).optional(),
  companyAddress: z.string().max(MAX_DESCRIPTION_LENGTH, "Company address is too long").optional(),
  companyPhone: z.string().max(MAX_MOBILE_LENGTH, "Company phone is too long").optional(),
  companyEmail: z.string().email("Invalid company email").max(MAX_EMAIL_LENGTH, "Company email is too long").optional(),
})

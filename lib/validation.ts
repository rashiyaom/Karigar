import { z } from "zod"

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  salary: z.number().min(0, "Salary must be positive"),
  joiningDate: z.string().min(1, "Joining date is required"),
  mobile: z.string().min(1, "Mobile is required"),
  email: z.string().email("Invalid email format"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive"]),
  profilePhoto: z.string().optional(),
})

export const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "half-day", "sick-leave", "paid-leave"]),
})

export const creditSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  amount: z.number().min(0, "Amount must be positive"),
  dateTaken: z.string().min(1, "Date taken is required"),
  promiseReturnDate: z.string().min(1, "Promise return date is required"),
  isPaid: z.boolean().default(false),
})

export const taskSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  priority: z.enum(["high", "medium", "low"]),
  isCompleted: z.boolean().default(false),
})

export const settingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").optional(),
  leaveDeduction: z
    .object({
      type: z.enum(["percentage", "fixed"]),
      value: z.number().min(0, "Deduction value must be positive"),
    })
    .optional(),
})

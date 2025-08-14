import type { Employee, Attendance, Credit, Task, Settings } from "./types"

// In-memory storage with HMR persistence
class InMemoryStore {
  private employees: Map<string, Employee> = new Map()
  private attendance: Map<string, Attendance> = new Map()
  private credits: Map<string, Credit> = new Map()
  private tasks: Map<string, Task> = new Map()
  private settings: Settings = {
    organizationName: "My Company",
    leaveDeduction: {
      type: "percentage",
      value: 10, // 10% deduction for leaves
    },
  }

  private history: Array<{
    id: string
    timestamp: string
    action: string
    entity: string
    entityId: string
    oldData?: any
    newData?: any
    description: string
  }> = []

    constructor() {
    // Restore data from global in development (HMR persistence)
    if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
      const globalStore = (globalThis as any).__appStore
      if (globalStore) {
        this.employees = new Map(globalStore.employees || [])
        this.attendance = new Map(globalStore.attendance || [])
        this.credits = new Map(globalStore.credits || [])
        this.tasks = new Map(globalStore.tasks || [])
        this.settings = globalStore.settings || this.settings
        this.history = globalStore.history || []
        console.log('Store restored from global:', {
          employees: this.employees.size,
          credits: this.credits.size,
          tasks: this.tasks.size,
          attendance: this.attendance.size
        })
        return // Don't initialize sample data if we restored from global
      }
    }
    
    // Initialize with sample data only if store is empty
    this.initializeSampleData()
  }

  private initializeSampleData() {
    // Only initialize if no employees exist
    if (this.employees.size === 0) {
      console.log('Initializing sample data...')
      
      const sampleEmployee1 = this.createEmployee({
        name: "John Doe",
        salary: 75000,
        joiningDate: "2023-01-15",
        mobile: "+1234567890",
        email: "john@company.com",
        role: "Software Engineer",
        status: "active",
      })

      const sampleEmployee2 = this.createEmployee({
        name: "Jane Smith",
        salary: 85000,
        joiningDate: "2022-11-20",
        mobile: "+1234567891",
        email: "jane@company.com",
        role: "Project Manager",
        status: "active",
      })

      // Add some sample attendance
      const today = new Date().toISOString().slice(0, 10)
      this.createAttendance({
        employeeId: sampleEmployee1.id,
        date: today,
        status: "present",
      })

      this.createAttendance({
        employeeId: sampleEmployee2.id,
        date: today,
        status: "present",
      })
      
      console.log('Sample data initialized')
    }
  }  private persistToGlobal() {
    // Save data to global in development (HMR persistence)
    if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
      (globalThis as any).__appStore = {
        employees: Array.from(this.employees.entries()),
        attendance: Array.from(this.attendance.entries()),
        credits: Array.from(this.credits.entries()),
        tasks: Array.from(this.tasks.entries()),
        settings: this.settings,
        history: this.history
      }
    }
  }

  private addToHistory(
    action: string,
    entity: string,
    entityId: string,
    description: string,
    oldData?: any,
    newData?: any,
  ) {
    const historyEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      oldData,
      newData,
      description,
    }
    this.history.unshift(historyEntry) // Add to beginning

    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100)
    }
  }

  getHistory() {
    return this.history
  }

  undoAction(historyId: string): boolean {
    const historyEntry = this.history.find((h) => h.id === historyId)
    if (!historyEntry || !historyEntry.oldData) return false

    try {
      switch (historyEntry.entity) {
        case "employee":
          if (historyEntry.action === "create") {
            this.employees.delete(historyEntry.entityId)
          } else if (historyEntry.action === "update") {
            this.employees.set(historyEntry.entityId, historyEntry.oldData)
          } else if (historyEntry.action === "delete") {
            this.employees.set(historyEntry.entityId, historyEntry.oldData)
          }
          break
        case "task":
          if (historyEntry.action === "create") {
            this.tasks.delete(historyEntry.entityId)
          } else if (historyEntry.action === "update") {
            this.tasks.set(historyEntry.entityId, historyEntry.oldData)
          }
          break
        case "credit":
          if (historyEntry.action === "create") {
            this.credits.delete(historyEntry.entityId)
          } else if (historyEntry.action === "update") {
            this.credits.set(historyEntry.entityId, historyEntry.oldData)
          }
          break
        case "attendance":
          if (historyEntry.action === "create") {
            this.attendance.delete(historyEntry.entityId)
          } else if (historyEntry.action === "update") {
            this.attendance.set(historyEntry.entityId, historyEntry.oldData)
          }
          break
      }

      // Mark this history entry as undone
      historyEntry.description += " (UNDONE)"
      return true
    } catch (error) {
      return false
    }
  }

  // Employee methods with history
  createEmployee(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
    const id = this.generateId()
    const now = new Date().toISOString()
    const newEmployee: Employee = {
      ...employee,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.employees.set(id, newEmployee)

    this.addToHistory("create", "employee", id, `Created employee: ${employee.name}`, null, newEmployee)

    return newEmployee
  }

  getEmployee(id: string): Employee | undefined {
    return this.employees.get(id)
  }

  getAllEmployees(): Employee[] {
    return Array.from(this.employees.values())
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employee = this.employees.get(id)
    if (!employee) return null

    const updatedEmployee: Employee = {
      ...employee,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    this.employees.set(id, updatedEmployee)

    this.addToHistory("update", "employee", id, `Updated employee: ${employee.name}`, employee, updatedEmployee)

    return updatedEmployee
  }

  deleteEmployee(id: string): boolean {
    const employee = this.employees.get(id)
    if (!employee) return false

    // Clean up attendance records for this employee
    const deletedAttendanceCount = this.cleanupAttendanceForEmployee(id)

    const deleted = this.employees.delete(id)
    if (deleted) {
      let message = `Deleted employee: ${employee.name}`
      if (deletedAttendanceCount > 0) {
        message += ` and cleaned up ${deletedAttendanceCount} attendance records`
      }
      this.addToHistory("delete", "employee", id, message, employee, null)
    }
    return deleted
  }

  // Attendance methods with history
  createAttendance(attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Attendance {
    // Check if attendance already exists for this employee on this date
    const existingAttendance = this.getAttendanceByEmployeeAndDate(attendance.employeeId, attendance.date)
    if (existingAttendance) {
      throw new Error(`Attendance already marked for this employee on ${attendance.date}. Current status: ${existingAttendance.status}`)
    }

    const id = this.generateId()
    const now = new Date().toISOString()
    const newAttendance: Attendance = {
      ...attendance,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.attendance.set(id, newAttendance)

    const employee = this.getEmployee(attendance.employeeId)
    this.addToHistory(
      "create",
      "attendance",
      id,
      `Marked ${employee?.name || "Unknown"} as ${attendance.status} on ${attendance.date}`,
      null,
      newAttendance,
    )

    return newAttendance
  }

  getAttendanceByEmployee(employeeId: string): Attendance[] {
    return Array.from(this.attendance.values()).filter((a) => a.employeeId === employeeId)
  }

  getAttendanceByEmployeeAndDate(employeeId: string, date: string): Attendance | null {
    return Array.from(this.attendance.values()).find((a) => a.employeeId === employeeId && a.date === date) || null
  }

  getAttendanceByDate(date: string): Attendance[] {
    return Array.from(this.attendance.values()).filter((a) => a.date === date)
  }

  getAllAttendance(): Attendance[] {
    return Array.from(this.attendance.values())
  }

  updateAttendance(id: string, updates: Partial<Attendance>): Attendance | null {
    const attendance = this.attendance.get(id)
    if (!attendance) return null

    const updatedAttendance: Attendance = {
      ...attendance,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    this.attendance.set(id, updatedAttendance)

    const employee = this.getEmployee(attendance.employeeId)
    this.addToHistory(
      "update",
      "attendance",
      id,
      `Updated attendance for ${employee?.name || "Unknown"} on ${attendance.date}`,
      attendance,
      updatedAttendance,
    )

    return updatedAttendance
  }

  deleteAttendance(id: string): boolean {
    const attendance = this.attendance.get(id)
    if (!attendance) return false

    const employee = this.getEmployee(attendance.employeeId)
    const deleted = this.attendance.delete(id)
    if (deleted) {
      this.addToHistory(
        "delete",
        "attendance",
        id,
        `Deleted attendance for ${employee?.name || "Unknown"} on ${attendance.date}`,
        attendance,
        null,
      )
    }
    return deleted
  }

  resetDailyAttendance(date?: string): number {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const attendanceToDelete = Array.from(this.attendance.values()).filter(a => a.date === targetDate)
    
    let deletedCount = 0
    attendanceToDelete.forEach(attendance => {
      if (this.attendance.delete(attendance.id)) {
        deletedCount++
      }
    })

    if (deletedCount > 0) {
      this.addToHistory(
        "delete",
        "attendance",
        "bulk",
        `Reset attendance for ${targetDate} - deleted ${deletedCount} records`,
        null,
        null,
      )
    }

    return deletedCount
  }

  cleanupAttendanceForEmployee(employeeId: string): number {
    const attendanceToDelete = this.getAttendanceByEmployee(employeeId)
    let deletedCount = 0

    attendanceToDelete.forEach(attendance => {
      if (this.attendance.delete(attendance.id)) {
        deletedCount++
      }
    })

    if (deletedCount > 0) {
      this.addToHistory(
        "delete",
        "attendance",
        "cleanup",
        `Cleaned up ${deletedCount} attendance records for deleted employee`,
        null,
        null,
      )
    }

    return deletedCount
  }

  // Credit methods with history
  createCredit(credit: Omit<Credit, "id" | "createdAt" | "updatedAt">): Credit {
    const id = this.generateId()
    const now = new Date().toISOString()
    const newCredit: Credit = {
      ...credit,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.credits.set(id, newCredit)

    const employee = this.getEmployee(credit.employeeId)
    this.addToHistory(
      "create",
      "credit",
      id,
      `Added credit: ₹${credit.amount} for ${employee?.name || "Unknown"}`,
      null,
      newCredit,
    )

    this.persistToGlobal()
    return newCredit
  }

  getCreditsByEmployee(employeeId: string): Credit[] {
    return Array.from(this.credits.values()).filter((c) => c.employeeId === employeeId)
  }

  getAllCredits(): Credit[] {
    return Array.from(this.credits.values())
  }

  updateCredit(id: string, updates: Partial<Credit>): Credit | null {
    const credit = this.credits.get(id)
    if (!credit) return null

    const updatedCredit: Credit = {
      ...credit,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    this.credits.set(id, updatedCredit)

    const employee = this.getEmployee(credit.employeeId)
    this.addToHistory(
      "update",
      "credit",
      id,
      `Updated credit: ₹${credit.amount} for ${employee?.name || "Unknown"}`,
      credit,
      updatedCredit,
    )

    this.persistToGlobal()
    return updatedCredit
  }

  deleteCredit(id: string): boolean {
    const credit = this.credits.get(id)
    if (!credit) return false

    const deleted = this.credits.delete(id)
    if (deleted) {
      const employee = this.getEmployee(credit.employeeId)
      this.addToHistory(
        "delete",
        "credit",
        id,
        `Deleted credit: ₹${credit.amount} for ${employee?.name || "Unknown"}`,
        credit,
        null,
      )
      this.persistToGlobal()
    }
    return deleted
  }

  // Task methods with history
  createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const id = this.generateId()
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.set(id, newTask)

    const employee = this.getEmployee(task.employeeId)
    this.addToHistory(
      "create",
      "task",
      id,
      `Created task: ${task.title} for ${employee?.name || "Unknown"}`,
      null,
      newTask,
    )

    return newTask
  }

  getTasksByEmployee(employeeId: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.employeeId === employeeId)
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values())
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id)
    if (!task) return null

    const updatedTask: Task = {
      ...task,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    this.tasks.set(id, updatedTask)

    const employee = this.getEmployee(task.employeeId)
    this.addToHistory(
      "update",
      "task",
      id,
      `Updated task: ${task.title} for ${employee?.name || "Unknown"}`,
      task,
      updatedTask,
    )

    return updatedTask
  }

  deleteTask(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task) return false

    const deleted = this.tasks.delete(id)
    if (deleted) {
      const employee = this.getEmployee(task.employeeId)
      this.addToHistory(
        "delete",
        "task",
        id,
        `Deleted task: ${task.title} for ${employee?.name || "Unknown"}`,
        task,
        null,
      )
    }
    return deleted
  }

  // Settings methods
  getSettings(): Settings {
    return this.settings
  }

  updateSettings(updates: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...updates }
    return this.settings
  }

  // Calculation methods
  calculateEmployeeSalary(employeeId: string): number {
    const employee = this.getEmployee(employeeId)
    if (!employee) return 0

    let finalSalary = employee.salary
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Deduct for leaves
    const monthlyAttendance = this.getAttendanceByEmployee(employeeId).filter((a) => a.date.startsWith(currentMonth))
    const leaveCount = monthlyAttendance.filter((a) => ["absent", "half-day", "sick-leave"].includes(a.status)).length

    if (leaveCount > 0) {
      const { type, value } = this.settings.leaveDeduction
      if (type === "percentage") {
        finalSalary -= (employee.salary * value * leaveCount) / 100
      } else {
        finalSalary -= value * leaveCount
      }
    }

    const unpaidCredits = this.getCreditsByEmployee(employeeId).filter((c) => !c.isPaid)
    const totalUnpaidCredits = unpaidCredits.reduce((sum, credit) => sum + credit.amount, 0)
    finalSalary -= totalUnpaidCredits

    return Math.max(0, finalSalary) // Ensure salary doesn't go negative
  }

  calculateEmployeeSalaryBreakdown(employeeId: string) {
    const employee = this.getEmployee(employeeId)
    if (!employee) return null

    const baseSalary = employee.salary
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    // Calculate leave deductions
    const monthlyAttendance = this.getAttendanceByEmployee(employeeId).filter((a) => a.date.startsWith(currentMonth))
    const leaveCount = monthlyAttendance.filter((a) => ["absent", "half-day", "sick-leave"].includes(a.status)).length

    let leaveDeductions = 0
    if (leaveCount > 0) {
      const { type, value } = this.settings.leaveDeduction
      if (type === "percentage") {
        leaveDeductions = (employee.salary * value * leaveCount) / 100
      } else {
        leaveDeductions = value * leaveCount
      }
    }

    // Calculate unpaid credits
    const unpaidCredits = this.getCreditsByEmployee(employeeId).filter((c) => !c.isPaid)
    const unpaidCreditsAmount = unpaidCredits.reduce((sum, credit) => sum + credit.amount, 0)

    const totalDeductions = leaveDeductions + unpaidCreditsAmount
    const netSalary = Math.max(0, baseSalary - totalDeductions)

    return {
      baseSalary,
      unpaidCredits: unpaidCreditsAmount,
      leaveDeductions,
      totalDeductions,
      netSalary,
    }
  }

  // Statistics methods
  getStats() {
    const employees = this.getAllEmployees()
    const today = new Date().toISOString().slice(0, 10)
    const todayAttendance = this.getAttendanceByDate(today)
    const presentToday = todayAttendance.filter((a) => a.status === "present").length
    const allTasks = this.getAllTasks()
    const pendingTasks = allTasks.filter((t) => !t.isCompleted).length
    const allCredits = Array.from(this.credits.values())
    const outstandingCredits = allCredits.filter((c) => !c.isPaid).length

    return {
      totalEmployees: employees.length,
      attendanceToday: presentToday,
      pendingTasks,
      outstandingCredits,
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

// Singleton instance with HMR support
declare global {
  var __appStoreInstance: InMemoryStore | undefined
}

export const store = (() => {
  if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!globalThis.__appStoreInstance) {
      globalThis.__appStoreInstance = new InMemoryStore()
    }
    return globalThis.__appStoreInstance
  }
  return new InMemoryStore()
})()

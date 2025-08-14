import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import type { Employee, Attendance, Credit, Task, Settings } from "./types"

class SQLiteStore {
  private db: Database.Database | null = null
  private dbPath = ""

  constructor() {
    // Default database path - can be configured
    this.initializeDatabase()
  }

  private initializeDatabase(customPath?: string) {
    try {
      // Use custom path or default to app directory
      const defaultPath = path.join(process.cwd(), "data", "employee_management.db")
      this.dbPath = customPath || defaultPath

      // Ensure directory exists
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      this.db = new Database(this.dbPath)
      this.createTables()
      this.insertSampleData()
    } catch (error) {
      console.error("Database initialization failed:", error)
      throw error
    }
  }

  setDatabasePath(newPath: string): boolean {
    try {
      console.log("Setting database path to:", newPath)
      
      // Validate path
      if (!newPath || typeof newPath !== 'string' || newPath.trim().length === 0) {
        console.error("Invalid path provided:", newPath)
        return false
      }

      // Close existing connection gracefully
      if (this.db) {
        try {
          this.db.close()
          console.log("Closed existing database connection")
        } catch (closeError) {
          console.warn("Error closing existing database connection:", closeError)
        }
      }

      // Initialize with new path
      this.initializeDatabase(newPath.trim())
      console.log("Database initialized successfully at:", this.dbPath)
      return true
    } catch (error) {
      console.error("Failed to set database path:", error)
      
      // Try to restore previous connection if possible
      try {
        if (this.dbPath && !this.db) {
          console.log("Attempting to restore previous database connection")
          this.initializeDatabase(this.dbPath)
        }
      } catch (restoreError) {
        console.error("Failed to restore previous database connection:", restoreError)
      }
      
      return false
    }
  }

  getDatabasePath(): string {
    return this.dbPath
  }

  private createTables() {
    if (!this.db) throw new Error("Database not initialized")

    // Create employees table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        salary REAL NOT NULL,
        joiningDate TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        profilePhoto TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // Create attendance table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
      )
    `)

    // Create credits table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credits (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        amount REAL NOT NULL,
        dateTaken TEXT NOT NULL,
        promiseReturnDate TEXT NOT NULL,
        isPaid INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
      )
    `)

    // Create tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        deadline TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        isCompleted INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
      )
    `)

    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        organizationName TEXT NOT NULL,
        leaveDeductionType TEXT NOT NULL DEFAULT 'percentage',
        leaveDeductionValue REAL NOT NULL DEFAULT 10,
        workingHoursStart TEXT,
        workingHoursEnd TEXT,
        weekendDays TEXT,
        autoMarkAbsent INTEGER DEFAULT 0,
        emailNotifications INTEGER DEFAULT 0,
        backupFrequency TEXT,
        companyAddress TEXT,
        companyPhone TEXT,
        companyEmail TEXT,
        updatedAt TEXT NOT NULL
      )
    `)

    // Create history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT NOT NULL,
        oldData TEXT,
        newData TEXT,
        description TEXT NOT NULL
      )
    `)

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employeeId);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_credits_employee ON credits(employeeId);
      CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employeeId);
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
    `)
  }

  private insertSampleData() {
    if (!this.db) return

    // Check if data already exists
    const employeeCount = this.db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number }
    if (employeeCount.count > 0) return

    // Insert default settings
    const settingsStmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, organizationName, leaveDeductionType, leaveDeductionValue, updatedAt
      ) VALUES (1, ?, ?, ?, ?)
    `)
    settingsStmt.run("My Company", "percentage", 10, new Date().toISOString())

    // Insert sample employees
    const employeeStmt = this.db.prepare(`
      INSERT INTO employees (
        id, name, salary, joiningDate, mobile, email, role, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date().toISOString()
    const employee1Id = this.generateId()
    const employee2Id = this.generateId()

    employeeStmt.run(
      employee1Id,
      "John Doe",
      75000,
      "2023-01-15",
      "+1234567890",
      "john@company.com",
      "Software Engineer",
      "active",
      now,
      now,
    )

    employeeStmt.run(
      employee2Id,
      "Jane Smith",
      85000,
      "2022-11-20",
      "+1234567891",
      "jane@company.com",
      "Project Manager",
      "active",
      now,
      now,
    )

    // Insert sample attendance
    const attendanceStmt = this.db.prepare(`
      INSERT INTO attendance (id, employeeId, date, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const today = new Date().toISOString().slice(0, 10)
    attendanceStmt.run(this.generateId(), employee1Id, today, "present", now, now)
    attendanceStmt.run(this.generateId(), employee2Id, today, "present", now, now)
  }

  // Employee methods
  createEmployee(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Employee {
    if (!this.db) throw new Error("Database not initialized")

    const id = this.generateId()
    const now = new Date().toISOString()
    const newEmployee: Employee = { ...employee, id, createdAt: now, updatedAt: now }

    const stmt = this.db.prepare(`
      INSERT INTO employees (
        id, name, salary, joiningDate, mobile, email, role, profilePhoto, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      employee.name,
      employee.salary,
      employee.joiningDate,
      employee.mobile,
      employee.email,
      employee.role,
      employee.profilePhoto || null,
      employee.status,
      now,
      now,
    )

    this.addToHistory("create", "employee", id, `Created employee: ${employee.name}`, null, newEmployee)
    return newEmployee
  }

  getEmployee(id: string): Employee | undefined {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM employees WHERE id = ?")
    return stmt.get(id) as Employee | undefined
  }

  getAllEmployees(): Employee[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM employees ORDER BY createdAt DESC")
    return stmt.all() as Employee[]
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    if (!this.db) throw new Error("Database not initialized")

    const oldEmployee = this.getEmployee(id)
    if (!oldEmployee) return null

    const updatedEmployee = { ...oldEmployee, ...updates, updatedAt: new Date().toISOString() }

    const stmt = this.db.prepare(`
      UPDATE employees SET 
        name = ?, salary = ?, joiningDate = ?, mobile = ?, email = ?, 
        role = ?, profilePhoto = ?, status = ?, updatedAt = ?
      WHERE id = ?
    `)

    stmt.run(
      updatedEmployee.name,
      updatedEmployee.salary,
      updatedEmployee.joiningDate,
      updatedEmployee.mobile,
      updatedEmployee.email,
      updatedEmployee.role,
      updatedEmployee.profilePhoto || null,
      updatedEmployee.status,
      updatedEmployee.updatedAt,
      id,
    )

    this.addToHistory("update", "employee", id, `Updated employee: ${oldEmployee.name}`, oldEmployee, updatedEmployee)
    return updatedEmployee
  }

  deleteEmployee(id: string): boolean {
    if (!this.db) throw new Error("Database not initialized")

    const employee = this.getEmployee(id)
    if (!employee) return false

    const stmt = this.db.prepare("DELETE FROM employees WHERE id = ?")
    const result = stmt.run(id)

    if (result.changes > 0) {
      this.addToHistory("delete", "employee", id, `Deleted employee: ${employee.name}`, employee, null)
      return true
    }
    return false
  }

  // Attendance methods
  createAttendance(attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Attendance {
    if (!this.db) throw new Error("Database not initialized")

    const id = this.generateId()
    const now = new Date().toISOString()
    const newAttendance: Attendance = { ...attendance, id, createdAt: now, updatedAt: now }

    const stmt = this.db.prepare(`
      INSERT INTO attendance (id, employeeId, date, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run(id, attendance.employeeId, attendance.date, attendance.status, now, now)

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
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM attendance WHERE employeeId = ? ORDER BY date DESC")
    return stmt.all(employeeId) as Attendance[]
  }

  getAllAttendance(): Attendance[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM attendance ORDER BY date DESC")
    return stmt.all() as Attendance[]
  }

  // Credit methods
  createCredit(credit: Omit<Credit, "id" | "createdAt" | "updatedAt">): Credit {
    if (!this.db) throw new Error("Database not initialized")

    const id = this.generateId()
    const now = new Date().toISOString()
    const newCredit: Credit = { ...credit, id, createdAt: now, updatedAt: now }

    const stmt = this.db.prepare(`
      INSERT INTO credits (id, employeeId, amount, dateTaken, promiseReturnDate, isPaid, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      credit.employeeId,
      credit.amount,
      credit.dateTaken,
      credit.promiseReturnDate,
      credit.isPaid ? 1 : 0,
      now,
      now,
    )

    const employee = this.getEmployee(credit.employeeId)
    this.addToHistory(
      "create",
      "credit",
      id,
      `Added credit: ₹${credit.amount} for ${employee?.name || "Unknown"}`,
      null,
      newCredit,
    )

    return newCredit
  }

  getCreditsByEmployee(employeeId: string): Credit[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM credits WHERE employeeId = ? ORDER BY createdAt DESC")
    const credits = stmt.all(employeeId) as any[]
    return credits.map((c) => ({ ...c, isPaid: Boolean(c.isPaid) }))
  }

  getAllCredits(): Credit[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM credits ORDER BY createdAt DESC")
    const credits = stmt.all() as any[]
    return credits.map((c) => ({ ...c, isPaid: Boolean(c.isPaid) }))
  }

  updateCredit(id: string, updates: Partial<Credit>): Credit | null {
    if (!this.db) throw new Error("Database not initialized")

    const oldCredit = this.getAllCredits().find((c) => c.id === id)
    if (!oldCredit) return null

    const updatedCredit = { ...oldCredit, ...updates, updatedAt: new Date().toISOString() }

    const stmt = this.db.prepare(`
      UPDATE credits SET amount = ?, dateTaken = ?, promiseReturnDate = ?, isPaid = ?, updatedAt = ?
      WHERE id = ?
    `)

    stmt.run(
      updatedCredit.amount,
      updatedCredit.dateTaken,
      updatedCredit.promiseReturnDate,
      updatedCredit.isPaid ? 1 : 0,
      updatedCredit.updatedAt,
      id,
    )

    const employee = this.getEmployee(oldCredit.employeeId)
    this.addToHistory(
      "update",
      "credit",
      id,
      `Updated credit: ₹${oldCredit.amount} for ${employee?.name || "Unknown"}`,
      oldCredit,
      updatedCredit,
    )

    return updatedCredit
  }

  deleteCredit(id: string): boolean {
    if (!this.db) throw new Error("Database not initialized")

    const credit = this.getAllCredits().find((c) => c.id === id)
    if (!credit) return false

    const stmt = this.db.prepare("DELETE FROM credits WHERE id = ?")
    const result = stmt.run(id)

    if (result.changes > 0) {
      const employee = this.getEmployee(credit.employeeId)
      this.addToHistory(
        "delete",
        "credit",
        id,
        `Deleted credit: ₹${credit.amount} for ${employee?.name || "Unknown"}`,
        credit,
        null,
      )
      return true
    }
    return false
  }

  // Task methods
  createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    if (!this.db) throw new Error("Database not initialized")

    const id = this.generateId()
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    }

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, employeeId, title, description, deadline, priority, isCompleted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const isCompleted = newTask.isCompleted ? 1 : 0
    stmt.run(
      id,
      newTask.employeeId,
      newTask.title,
      newTask.description,
      newTask.deadline,
      newTask.priority,
      isCompleted,
      now,
      now,
    )

    const employee = this.getEmployee(newTask.employeeId)
    this.addToHistory(
      "create",
      "task",
      id,
      `Created task: ${newTask.title} for ${employee?.name || "Unknown"}`,
      null,
      newTask,
    )

    return newTask
  }

  getTasksByEmployee(employeeId: string): Task[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM tasks WHERE employeeId = ? ORDER BY createdAt DESC")
    const tasks = stmt.all(employeeId) as any[]
    return tasks.map((t) => ({
      ...t,
      isCompleted: Boolean(t.isCompleted),
    }))
  }

  getAllTasks(): Task[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM tasks ORDER BY createdAt DESC")
    const tasks = stmt.all() as any[]
    return tasks.map((t) => ({
      ...t,
      isCompleted: Boolean(t.isCompleted),
    }))
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    if (!this.db) throw new Error("Database not initialized")

    const oldTask = this.getAllTasks().find((t) => t.id === id)
    if (!oldTask) return null

    const updatedTask = { ...oldTask, ...updates, updatedAt: new Date().toISOString() }

    const stmt = this.db.prepare(`
      UPDATE tasks SET title = ?, description = ?, deadline = ?, priority = ?, isCompleted = ?, updatedAt = ?
      WHERE id = ?
    `)

    const isCompleted = updatedTask.isCompleted ? 1 : 0
    stmt.run(
      updatedTask.title,
      updatedTask.description,
      updatedTask.deadline,
      updatedTask.priority,
      isCompleted,
      updatedTask.updatedAt,
      id,
    )

    const employee = this.getEmployee(oldTask.employeeId)
    this.addToHistory(
      "update",
      "task",
      id,
      `Updated task: ${oldTask.title} for ${employee?.name || "Unknown"}`,
      oldTask,
      updatedTask,
    )

    return updatedTask
  }

  deleteTask(id: string): boolean {
    if (!this.db) throw new Error("Database not initialized")

    const task = this.getAllTasks().find((t) => t.id === id)
    if (!task) return false

    const stmt = this.db.prepare("DELETE FROM tasks WHERE id = ?")
    const result = stmt.run(id)

    if (result.changes > 0) {
      const employee = this.getEmployee(task.employeeId)
      this.addToHistory(
        "delete",
        "task",
        id,
        `Deleted task: ${task.title} for ${employee?.name || "Unknown"}`,
        task,
        null,
      )
      return true
    }
    return false
  }

  // Settings methods
  getSettings(): Settings {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM settings WHERE id = 1")
    const row = stmt.get() as any

    if (!row) {
      return {
        organizationName: "My Company",
        leaveDeduction: { type: "percentage", value: 10 },
      }
    }

    return {
      organizationName: row.organizationName,
      leaveDeduction: {
        type: row.leaveDeductionType,
        value: row.leaveDeductionValue,
      },
      workingHours: row.workingHoursStart
        ? {
            start: row.workingHoursStart,
            end: row.workingHoursEnd,
          }
        : undefined,
      weekendDays: row.weekendDays ? JSON.parse(row.weekendDays) : undefined,
      autoMarkAbsent: Boolean(row.autoMarkAbsent),
      emailNotifications: Boolean(row.emailNotifications),
      backupFrequency: row.backupFrequency,
      companyAddress: row.companyAddress,
      companyPhone: row.companyPhone,
      companyEmail: row.companyEmail,
    }
  }

  updateSettings(updates: Partial<Settings>): Settings {
    if (!this.db) throw new Error("Database not initialized")

    const current = this.getSettings()
    const updated = { ...current, ...updates }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, organizationName, leaveDeductionType, leaveDeductionValue,
        workingHoursStart, workingHoursEnd, weekendDays, autoMarkAbsent,
        emailNotifications, backupFrequency, companyAddress, companyPhone,
        companyEmail, updatedAt
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      updated.organizationName,
      updated.leaveDeduction.type,
      updated.leaveDeduction.value,
      updated.workingHours?.start || null,
      updated.workingHours?.end || null,
      updated.weekendDays ? JSON.stringify(updated.weekendDays) : null,
      updated.autoMarkAbsent ? 1 : 0,
      updated.emailNotifications ? 1 : 0,
      updated.backupFrequency || null,
      updated.companyAddress || null,
      updated.companyPhone || null,
      updated.companyEmail || null,
      new Date().toISOString(),
    )

    return updated
  }

  // Calculation methods
  calculateEmployeeSalary(employeeId: string): number {
    const employee = this.getEmployee(employeeId)
    if (!employee) return 0

    let finalSalary = employee.salary
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Deduct for leaves
    const monthlyAttendance = this.getAttendanceByEmployee(employeeId).filter((a) => a.date.startsWith(currentMonth))
    const leaveCount = monthlyAttendance.filter((a) => ["absent", "half-day", "sick-leave"].includes(a.status)).length

    if (leaveCount > 0) {
      const settings = this.getSettings()
      const { type, value } = settings.leaveDeduction
      if (type === "percentage") {
        finalSalary -= (employee.salary * value * leaveCount) / 100
      } else {
        finalSalary -= value * leaveCount
      }
    }

    // Deduct unpaid credits
    const unpaidCredits = this.getCreditsByEmployee(employeeId).filter((c) => !c.isPaid)
    const totalUnpaidCredits = unpaidCredits.reduce((sum, credit) => sum + credit.amount, 0)
    finalSalary -= totalUnpaidCredits

    return Math.max(0, finalSalary)
  }

  // Statistics methods
  getStats() {
    const employees = this.getAllEmployees()
    const today = new Date().toISOString().slice(0, 10)
    const todayAttendance = this.getAllAttendance().filter((a) => a.date === today)
    const presentToday = todayAttendance.filter((a) => a.status === "present").length
    const allTasks = this.getAllTasks()
    const pendingTasks = allTasks.filter((t) => !t.isCompleted).length
    const allCredits = this.getAllCredits()
    const outstandingCredits = allCredits.filter((c) => !c.isPaid).length

    return {
      totalEmployees: employees.length,
      attendanceToday: presentToday,
      pendingTasks,
      outstandingCredits,
    }
  }

  // History methods
  private addToHistory(
    action: string,
    entity: string,
    entityId: string,
    description: string,
    oldData?: any,
    newData?: any,
  ) {
    if (!this.db) return

    const stmt = this.db.prepare(`
      INSERT INTO history (id, timestamp, action, entity, entityId, oldData, newData, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      this.generateId(),
      new Date().toISOString(),
      action,
      entity,
      entityId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      description,
    )

    // Keep only last 100 entries
    const cleanupStmt = this.db.prepare(`
      DELETE FROM history WHERE id NOT IN (
        SELECT id FROM history ORDER BY timestamp DESC LIMIT 100
      )
    `)
    cleanupStmt.run()
  }

  getHistory() {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 100")
    const history = stmt.all() as any[]

    return history.map((h) => ({
      ...h,
      oldData: h.oldData ? JSON.parse(h.oldData) : null,
      newData: h.newData ? JSON.parse(h.newData) : null,
    }))
  }

  undoAction(historyId: string): boolean {
    // Implementation for undo functionality
    // This would require more complex logic to reverse operations
    return false
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Database management methods
  async backup(backupPath: string): Promise<boolean> {
    if (!this.db) return false

    try {
      await this.db.backup(backupPath)
      return true
    } catch (error) {
      console.error("Backup failed:", error)
      return false
    }
  }

  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
export const sqliteStore = new SQLiteStore()

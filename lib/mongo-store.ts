import { connectToDatabase } from './mongodb'
import {
  EmployeeModel,
  AttendanceModel,
  CreditModel,
  TaskModel,
  SettingsModel,
  HistoryModel,
  IEmployee,
  IAttendance,
  ICredit,
  ITask,
  ISettings,
} from './mongodb-models'
import type { Employee, Attendance, Credit, Task, Settings } from './types'

/**
 * MongoDB-backed store for persistent, cross-device data storage
 * Replaces both SQLiteStore and InMemoryStore
 * Data is automatically synced across all devices
 */
class MongoDBStore {
  private initialized = false

  async initialize() {
    if (this.initialized) return
    try {
      await connectToDatabase()
      this.initialized = true
      console.log('✓ MongoDB Store initialized')
    } catch (error) {
      console.error('✗ Failed to initialize MongoDB Store:', error)
      throw error
    }
  }

  // Ensure DB connection before operations
  private async ensureConnected() {
    if (!this.initialized) {
      await this.initialize()
    }
    await connectToDatabase()
  }

  // Initialize database with sample data to ensure collections exist in Atlas
  async initializeDatabase(): Promise<void> {
    await this.ensureConnected()

    try {
      // Check if employees already exist
      const existingCount = await EmployeeModel.countDocuments()
      if (existingCount > 0) {
        console.log('✓ Database already initialized with', existingCount, 'employees')
        return
      }

      // Create sample employee
      const sampleEmployee = await EmployeeModel.create({
        name: 'Sample Employee',
        salary: 50000,
        joiningDate: new Date().toISOString().split('T')[0],
        mobile: '9999999999',
        email: 'sample@karigar.test',
        role: 'Employee',
        status: 'active',
      })

      // Create sample attendance
      await AttendanceModel.create({
        employeeId: sampleEmployee._id.toString(),
        date: new Date().toISOString().split('T')[0],
        status: 'present',
      })

      // Create sample settings
      await SettingsModel.create({
        organizationName: 'Karigar',
        leaveDeduction: {
          type: 'percentage',
          value: 10,
        },
        weekendDays: ['Saturday', 'Sunday'],
        autoMarkAbsent: true,
      })

      console.log('✓ Database initialized with sample data')
      console.log('✓ Collections created in MongoDB Atlas')
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

  // ========================
  // Employee Methods
  // ========================

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    await this.ensureConnected()

    const newEmployee = await EmployeeModel.create({
      ...employee,
    })

    await this.addToHistory(
      'create',
      'employee',
      newEmployee._id.toString(),
      `Created employee: ${employee.name}`,
      null,
      newEmployee.toObject()
    )

    return this.formatEmployee(newEmployee)
  }

  async getEmployee(id: string): Promise<Employee | null> {
    await this.ensureConnected()

    try {
      const employee = await EmployeeModel.findById(id)
      return employee ? this.formatEmployee(employee) : null
    } catch (error) {
      console.error('Failed to get employee:', error)
      return null
    }
  }

  async getAllEmployees(): Promise<Employee[]> {
    await this.ensureConnected()

    const employees = await EmployeeModel.find().sort({ createdAt: -1 })
    return employees.map((emp) => this.formatEmployee(emp))
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    await this.ensureConnected()

    try {
      const oldEmployee = await EmployeeModel.findById(id)
      if (!oldEmployee) return null

      const updated = await EmployeeModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      )

      if (updated) {
        await this.addToHistory(
          'update',
          'employee',
          id,
          `Updated employee: ${oldEmployee.name}`,
          oldEmployee.toObject(),
          updated.toObject()
        )
      }

      return updated ? this.formatEmployee(updated) : null
    } catch (error) {
      console.error('Failed to update employee:', error)
      return null
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await this.ensureConnected()

    try {
      const employee = await EmployeeModel.findByIdAndDelete(id)
      if (employee) {
        // Cleanup: delete all related attendance, credits, tasks
        await AttendanceModel.deleteMany({ employeeId: id })
        await CreditModel.deleteMany({ employeeId: id })
        await TaskModel.deleteMany({ employeeId: id })

        await this.addToHistory(
          'delete',
          'employee',
          id,
          `Deleted employee: ${employee.name}`,
          employee.toObject(),
          null
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete employee:', error)
      return false
    }
  }

  // ========================
  // Attendance Methods
  // ========================

  async createAttendance(
    attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Attendance> {
    await this.ensureConnected()

    // Check for existing attendance on same date for same employee
    const existing = await AttendanceModel.findOne({
      employeeId: attendance.employeeId,
      date: attendance.date,
    })

    if (existing) {
      throw new Error(
        `Attendance already marked for this employee on ${attendance.date}. Current status: ${existing.status}`
      )
    }

    const newAttendance = await AttendanceModel.create({
      employeeId: attendance.employeeId,
      date: attendance.date,
      status: attendance.status,
    })

    const employee = await EmployeeModel.findById(attendance.employeeId)
    await this.addToHistory(
      'create',
      'attendance',
      newAttendance._id.toString(),
      `Marked ${employee?.name || 'Unknown'} as ${attendance.status} on ${attendance.date}`,
      null,
      newAttendance.toObject()
    )

    return this.formatAttendance(newAttendance)
  }

  async getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
    await this.ensureConnected()

    const attendance = await AttendanceModel.find({
      employeeId: employeeId,
    }).sort({ date: -1 })

    return attendance.map((att) => this.formatAttendance(att))
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    await this.ensureConnected()

    const attendance = await AttendanceModel.find({ date }).sort({ createdAt: -1 })
    return attendance.map((att) => this.formatAttendance(att))
  }

  async getAllAttendance(): Promise<Attendance[]> {
    await this.ensureConnected()

    const attendance = await AttendanceModel.find().sort({ date: -1 })
    return attendance.map((att) => this.formatAttendance(att))
  }

  async getAttendanceById(id: string): Promise<Attendance | null> {
    await this.ensureConnected()

    try {
      const attendance = await AttendanceModel.findById(id)
      return attendance ? this.formatAttendance(attendance) : null
    } catch (error) {
      console.error('Failed to fetch attendance by ID:', error)
      return null
    }
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | null> {
    await this.ensureConnected()

    try {
      const oldAttendance = await AttendanceModel.findById(id)
      if (!oldAttendance) return null

      const updated = await AttendanceModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      )

      if (updated) {
        const employee = await EmployeeModel.findById(oldAttendance.employeeId)
        await this.addToHistory(
          'update',
          'attendance',
          id,
          `Updated attendance for ${employee?.name || 'Unknown'} on ${oldAttendance.date}`,
          oldAttendance.toObject(),
          updated.toObject()
        )
      }

      return updated ? this.formatAttendance(updated) : null
    } catch (error) {
      console.error('Failed to update attendance:', error)
      return null
    }
  }

  async deleteAttendance(id: string): Promise<boolean> {
    await this.ensureConnected()

    try {
      const attendance = await AttendanceModel.findByIdAndDelete(id)
      if (attendance) {
        const employee = await EmployeeModel.findById(attendance.employeeId)
        await this.addToHistory(
          'delete',
          'attendance',
          id,
          `Deleted attendance for ${employee?.name || 'Unknown'} on ${attendance.date}`,
          attendance.toObject(),
          null
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete attendance:', error)
      return false
    }
  }

  /**
   * AUTO-RESET: Mark unmarked employees as ABSENT
   * Instead of deleting, this creates "absent" records for employees with no attendance
   */
  async resetDailyAttendance(date?: string): Promise<number> {
    await this.ensureConnected()

    const targetDate = date || new Date().toISOString().split('T')[0]

    try {
      // Get all active employees
      const employees = await EmployeeModel.find({ status: 'active' })

      // Get employees already marked for this date
      const markedEmployees = await AttendanceModel.find({ date: targetDate }).select('employeeId')
      const markedEmployeeIds = markedEmployees.map((a) => a.employeeId.toString())

      // Mark unmarked employees as absent
      let addedCount = 0
      for (const employee of employees) {
        if (!markedEmployeeIds.includes(employee._id.toString())) {
          await AttendanceModel.create({
            employeeId: employee._id.toString(),
            date: targetDate,
            status: 'absent',
          })
          addedCount++
        }
      }

      if (addedCount > 0) {
        await this.addToHistory(
          'create',
          'attendance',
          'bulk',
          `Auto-marked ${addedCount} employees as absent for ${targetDate}`,
          null,
          { date: targetDate, count: addedCount }
        )
      }

      return addedCount
    } catch (error) {
      console.error('Failed to reset daily attendance:', error)
      return 0
    }
  }

  // ========================
  // Credit Methods
  // ========================

  async createCredit(credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credit> {
    await this.ensureConnected()

    const newCredit = await CreditModel.create({
      employeeId: credit.employeeId,
      amount: credit.amount,
      dateTaken: credit.dateTaken,
      promiseReturnDate: credit.promiseReturnDate,
      isPaid: credit.isPaid,
    })

    const employee = await EmployeeModel.findById(credit.employeeId)
    await this.addToHistory(
      'create',
      'credit',
      newCredit._id.toString(),
      `Added credit: ₹${credit.amount} for ${employee?.name || 'Unknown'}`,
      null,
      newCredit.toObject()
    )

    return this.formatCredit(newCredit)
  }

  async getCreditsByEmployee(employeeId: string): Promise<Credit[]> {
    await this.ensureConnected()

    const credits = await CreditModel.find({
      employeeId: employeeId,
    }).sort({ createdAt: -1 })

    return credits.map((credit) => this.formatCredit(credit))
  }

  async getAllCredits(): Promise<Credit[]> {
    await this.ensureConnected()

    const credits = await CreditModel.find().sort({ createdAt: -1 })
    return credits.map((credit) => this.formatCredit(credit))
  }

  async getCredit(id: string): Promise<Credit | null> {
    await this.ensureConnected()

    try {
      const credit = await CreditModel.findById(id)
      return credit ? this.formatCredit(credit) : null
    } catch (error) {
      console.error('Failed to fetch credit by ID:', error)
      return null
    }
  }

  async updateCredit(id: string, updates: Partial<Credit>): Promise<Credit | null> {
    await this.ensureConnected()

    try {
      const oldCredit = await CreditModel.findById(id)
      if (!oldCredit) return null

      const updated = await CreditModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      )

      if (updated) {
        const employee = await EmployeeModel.findById(oldCredit.employeeId)
        await this.addToHistory(
          'update',
          'credit',
          id,
          `Updated credit: ₹${oldCredit.amount} for ${employee?.name || 'Unknown'}`,
          oldCredit.toObject(),
          updated.toObject()
        )
      }

      return updated ? this.formatCredit(updated) : null
    } catch (error) {
      console.error('Failed to update credit:', error)
      return null
    }
  }

  async deleteCredit(id: string): Promise<boolean> {
    await this.ensureConnected()

    try {
      const credit = await CreditModel.findByIdAndDelete(id)
      if (credit) {
        const employee = await EmployeeModel.findById(credit.employeeId)
        await this.addToHistory(
          'delete',
          'credit',
          id,
          `Deleted credit: ₹${credit.amount} for ${employee?.name || 'Unknown'}`,
          credit.toObject(),
          null
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete credit:', error)
      return false
    }
  }

  // ========================
  // Task Methods
  // ========================

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await this.ensureConnected()

    const newTask = await TaskModel.create({
      employeeId: task.employeeId,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      isCompleted: task.isCompleted,
    })

    const employee = await EmployeeModel.findById(task.employeeId)
    await this.addToHistory(
      'create',
      'task',
      newTask._id.toString(),
      `Created task: ${newTask.title} for ${employee?.name || 'Unknown'}`,
      null,
      newTask.toObject()
    )

    return this.formatTask(newTask)
  }

  async getTasksByEmployee(employeeId: string): Promise<Task[]> {
    await this.ensureConnected()

    const tasks = await TaskModel.find({
      employeeId,
    }).sort({ createdAt: -1 })

    return tasks.map((task) => this.formatTask(task))
  }

  async getAllTasks(): Promise<Task[]> {
    await this.ensureConnected()

    const tasks = await TaskModel.find().sort({ createdAt: -1 })
    return tasks.map((task: any) => this.formatTask(task))
  }

  async getTask(id: string): Promise<Task | null> {
    await this.ensureConnected()

    try {
      const task = await TaskModel.findById(id)
      return task ? this.formatTask(task) : null
    } catch (error) {
      console.error('Failed to fetch task by ID:', error)
      return null
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    await this.ensureConnected()

    try {
      const oldTask = await TaskModel.findById(id)
      if (!oldTask) return null

      const updated = await TaskModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      )

      if (updated) {
        const employee = await EmployeeModel.findById(oldTask.employeeId)
        await this.addToHistory(
          'update',
          'task',
          id,
          `Updated task: ${oldTask.title} for ${employee?.name || 'Unknown'}`,
          oldTask.toObject(),
          updated.toObject()
        )
      }

      return updated ? this.formatTask(updated) : null
    } catch (error) {
      console.error('Failed to update task:', error)
      return null
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.ensureConnected()

    try {
      const task = await TaskModel.findByIdAndDelete(id)
      if (task) {
        const employee = await EmployeeModel.findById(task.employeeId)
        await this.addToHistory(
          'delete',
          'task',
          id,
          `Deleted task: ${task.title} for ${employee?.name || 'Unknown'}`,
          task.toObject(),
          null
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete task:', error)
      return false
    }
  }

  // ========================
  // Settings Methods
  // ========================

  async getSettings(): Promise<Settings> {
    await this.ensureConnected()

    let settings = await SettingsModel.findOne()

    if (!settings) {
      settings = await SettingsModel.create({
        organizationName: 'My Company',
        leaveDeduction: { type: 'percentage', value: 10 },
      })
    }

    return this.formatSettings(settings)
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    await this.ensureConnected()

    let settings = await SettingsModel.findOne()

    if (!settings) {
      settings = await SettingsModel.create(updates)
    } else {
      settings = await SettingsModel.findByIdAndUpdate(settings._id, updates, { new: true })
    }

    return this.formatSettings(settings!)
  }

  // ========================
  // Calculation Methods
  // ========================

  async calculateEmployeeSalary(employeeId: string): Promise<number> {
    await this.ensureConnected()

    const employee = await EmployeeModel.findById(employeeId)
    if (!employee) return 0

    let finalSalary = employee.salary
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Deduct for leaves
    const monthlyAttendance = await AttendanceModel.find({
      employeeId,
      date: { $regex: `^${currentMonth}` },
    })

    const leaveCount = monthlyAttendance.filter((a) =>
      ['absent', 'half-day', 'sick-leave'].includes(a.status)
    ).length

    if (leaveCount > 0) {
      const settings = await this.getSettings()
      const { type, value } = settings.leaveDeduction
      if (type === 'percentage') {
        finalSalary -= (employee.salary * value * leaveCount) / 100
      } else {
        finalSalary -= value * leaveCount
      }
    }

    // Deduct unpaid credits
    const unpaidCredits = await CreditModel.find({
      employeeId,
      isPaid: false,
    })

    const totalUnpaidCredits = unpaidCredits.reduce((sum, credit) => sum + credit.amount, 0)
    finalSalary -= totalUnpaidCredits

    return Math.max(0, finalSalary)
  }

  async calculateEmployeeSalaryBreakdown(employeeId: string) {
    await this.ensureConnected()

    const employee = await EmployeeModel.findById(employeeId)
    if (!employee) return null

    const baseSalary = employee.salary
    const currentMonth = new Date().toISOString().slice(0, 7)

    const monthlyAttendance = await AttendanceModel.find({
      employeeId,
      date: { $regex: `^${currentMonth}` },
    })

    const leaveCount = monthlyAttendance.filter((a) =>
      ['absent', 'half-day', 'sick-leave'].includes(a.status)
    ).length

    let leaveDeductions = 0
    if (leaveCount > 0) {
      const settings = await this.getSettings()
      const { type, value } = settings.leaveDeduction
      if (type === 'percentage') {
        leaveDeductions = (employee.salary * value * leaveCount) / 100
      } else {
        leaveDeductions = value * leaveCount
      }
    }

    const unpaidCredits = await CreditModel.find({
      employeeId,
      isPaid: false,
    })

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

  // ========================
  // Statistics Methods
  // ========================

  async getStats() {
    await this.ensureConnected()

    const employees = await EmployeeModel.find()
    const today = new Date().toISOString().slice(0, 10)
    const todayAttendance = await AttendanceModel.find({ date: today })
    const presentToday = todayAttendance.filter((a) => a.status === 'present').length
    const allTasks = await TaskModel.find()
    const pendingTasks = allTasks.filter((t) => !t.isCompleted).length
    const allCredits = await CreditModel.find()
    const outstandingCredits = allCredits.filter((c) => !c.isPaid).length

    return {
      totalEmployees: employees.length,
      attendanceToday: presentToday,
      pendingTasks,
      outstandingCredits,
    }
  }

  // ========================
  // History/Audit Methods
  // ========================

  async getHistory(limit = 100) {
    await this.ensureConnected()

    const history = await HistoryModel.find().sort({ timestamp: -1 }).limit(limit)
    return history.map((h) => h.toObject())
  }

  private async addToHistory(
    action: string,
    entity: string,
    entityId: string,
    description: string,
    oldData?: any,
    newData?: any
  ) {
    try {
      await HistoryModel.create({
        timestamp: new Date(),
        action,
        entity,
        entityId,
        oldData,
        newData,
        description,
      })
    } catch (error) {
      console.error('Failed to add history entry:', error)
    }
  }

  // ========================
  // Utility Methods
  // ========================

  private formatEmployee(emp: any): Employee {
    return {
      id: emp._id.toString(),
      name: emp.name,
      salary: emp.salary,
      joiningDate: emp.joiningDate,
      mobile: emp.mobile,
      email: emp.email,
      role: emp.role,
      profilePhoto: emp.profilePhoto,
      status: emp.status,
      createdAt: emp.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: emp.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }

  private formatAttendance(att: any): Attendance {
    return {
      id: att._id.toString(),
      employeeId: att.employeeId.toString(),
      date: att.date,
      status: att.status,
      createdAt: att.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: att.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }

  private formatCredit(credit: any): Credit {
    return {
      id: credit._id.toString(),
      employeeId: credit.employeeId.toString(),
      amount: credit.amount,
      dateTaken: credit.dateTaken,
      promiseReturnDate: credit.promiseReturnDate,
      isPaid: credit.isPaid,
      createdAt: credit.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: credit.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }

  private formatTask(task: any): Task {
    return {
      id: task._id.toString(),
      employeeId: task.employeeId.toString(),
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      isCompleted: task.isCompleted,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: task.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }

  private formatSettings(settings: any): Settings {
    return {
      organizationName: settings.organizationName,
      leaveDeduction: settings.leaveDeduction,
      workingHours: settings.workingHours,
      weekendDays: settings.weekendDays,
      autoMarkAbsent: settings.autoMarkAbsent,
      emailNotifications: settings.emailNotifications,
      backupFrequency: settings.backupFrequency,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      companyEmail: settings.companyEmail,
    }
  }

  // Initialize database with collections (called once on first run)
  async initializeDatabase(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
    
    try {
      // Check if employees already exist
      const employeeCount = await EmployeeModel.countDocuments()
      
      if (employeeCount === 0) {
        console.log('Creating sample data...')
        
        // Create sample employees directly
        const sampleEmployees = [
          {
            name: 'Rajesh Kumar',
            salary: 50000,
            joiningDate: '2023-01-15',
            mobile: '9876543210',
            email: 'rajesh@example.com',
            role: 'Manager',
            status: 'active' as const,
          },
          {
            name: 'Priya Sharma',
            salary: 40000,
            joiningDate: '2023-02-10',
            mobile: '9876543211',
            email: 'priya@example.com',
            role: 'Developer',
            status: 'active' as const,
          },
        ]
        
        await EmployeeModel.insertMany(sampleEmployees)
        console.log('✓ Sample data created successfully')
      } else {
        console.log(`✓ Database already initialized with ${employeeCount} employees`)
      }
    } catch (error) {
      console.error('Error initializing database:', error)
    }
  }
}

// Singleton instance with MongoDB backend
export const mongoStore = new MongoDBStore()

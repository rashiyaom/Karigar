"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, RefreshCw, Users, CreditCard, Calculator, TrendingUp, FileSpreadsheet, Check } from "lucide-react"
import { useEmployees, useCredits, useStats } from "@/hooks/use-api"
import { useLanguage } from "@/components/language-provider"
import { store } from "@/lib/store"
import Link from "next/link"
import { format } from "date-fns"
import { exportEmployeeToExcel, exportMultipleEmployees } from "@/lib/excel-export"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DataAnalytics() {
  const [selectedMonth, setSelectedMonth] = useState("")
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const { t } = useLanguage()

  // Set the current date/time on client-side only
  useEffect(() => {
    const now = new Date()
    setSelectedMonth(format(now, "yyyy-MM"))
    setCurrentDateTime(format(now, "MMM dd, yyyy 'at' HH:mm"))
    
    // Generate month options
    const options = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = format(date, "yyyy-MM")
      const label = format(date, "MMMM yyyy")
      options.push({ value, label })
    }
    setMonthOptions(options)
  }, [])

  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useEmployees()
  const { data: allCredits = [], isLoading: creditsLoading, refetch: refetchCredits } = useCredits()
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats()

  const calculateEmployeeSalary = (employee: any) => {
    try {
      const salaryData = store.calculateEmployeeSalaryBreakdown(employee.id)
      if (salaryData) {
        return {
          baseSalary: salaryData.baseSalary,
          unpaidCredits: salaryData.unpaidCredits,
          leaveDeductions: salaryData.leaveDeductions,
          totalDeductions: salaryData.totalDeductions,
          netSalary: salaryData.netSalary,
        }
      } else {
        return {
          baseSalary: employee.salary || 0,
          unpaidCredits: 0,
          leaveDeductions: 0,
          totalDeductions: 0,
          netSalary: employee.salary || 0,
        }
      }
    } catch (error) {
      console.error("Error calculating salary for employee:", employee.id, error)
      return {
        baseSalary: employee.salary || 0,
        unpaidCredits: 0,
        leaveDeductions: 0,
        totalDeductions: 0,
        netSalary: employee.salary || 0,
      }
    }
  }

  const calculatePayrollSummary = () => {
    let totalBaseSalary = 0
    let totalUnpaidCredits = 0
    let totalLeaveDeductions = 0
    let totalNetSalary = 0

    const employeeSalaries = employees.map((employee) => {
      const salaryData = calculateEmployeeSalary(employee)
      totalBaseSalary += salaryData.baseSalary
      totalUnpaidCredits += salaryData.unpaidCredits
      totalLeaveDeductions += salaryData.leaveDeductions
      totalNetSalary += salaryData.netSalary

      return {
        ...employee,
        ...salaryData,
      }
    })

    return {
      employeeSalaries,
      summary: {
        totalBaseSalary,
        totalUnpaidCredits,
        totalLeaveDeductions,
        totalDeductions: totalUnpaidCredits + totalLeaveDeductions,
        totalNetSalary,
        employeeCount: employees.length,
      },
    }
  }

  const handleRefreshData = async () => {
    await Promise.all([refetchEmployees(), refetchCredits(), refetchStats()])
    setSelectedMonth(selectedMonth)
  }

  const payrollData = calculatePayrollSummary()
  const isLoading = employeesLoading || creditsLoading || statsLoading

  const handleExportSelected = async () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error("Please select at least one employee to export")
      return
    }

    setIsExporting(true)
    try {
      const selectedEmployees = employees.filter(emp => selectedEmployeeIds.includes(emp.id))
      
      // Fetch full data for each selected employee
      const employeeDataPromises = selectedEmployees.map(async (employee) => {
        const [attendanceRes, creditsRes, tasksRes] = await Promise.all([
          fetch(`/api/attendance/employee/${employee.id}`).then(r => r.json()),
          fetch(`/api/credits/employee/${employee.id}`).then(r => r.json()),
          fetch(`/api/tasks/employee/${employee.id}`).then(r => r.json())
        ])

        const attendance = attendanceRes.data || []
        const credits = creditsRes.data || []
        const tasks = tasksRes.data || []

        // Calculate stats
        const salaryData = calculateEmployeeSalary(employee)
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.isCompleted).length
        const pendingTasks = totalTasks - completedTasks
        const overdueTasks = tasks.filter((t: any) => !t.isCompleted && new Date(t.deadline) < new Date()).length
        
        const totalCredits = credits.length
        const unpaidCredits = credits.filter((c: any) => !c.isPaid).length
        const totalCreditAmount = credits.reduce((sum: number, c: any) => sum + c.amount, 0)
        const unpaidCreditAmount = credits.filter((c: any) => !c.isPaid).reduce((sum: number, c: any) => sum + c.amount, 0)
        
        const presentDays = attendance.filter((a: any) => a.status === 'present').length
        const absentDays = attendance.filter((a: any) => a.status === 'absent').length
        const halfDays = attendance.filter((a: any) => a.status === 'half-day').length
        const totalDays = attendance.length
        const attendancePercentage = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1) : '0'

        return {
          employee,
          attendance,
          credits,
          tasks,
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            totalCredits,
            unpaidCredits,
            totalCreditAmount,
            unpaidCreditAmount,
            presentDays,
            absentDays,
            halfDays,
            attendancePercentage,
            baseSalary: salaryData.baseSalary,
            leaveDeduction: salaryData.leaveDeductions,
            creditDeduction: salaryData.unpaidCredits,
            netSalary: salaryData.netSalary
          }
        }
      })

      const employeeData = await Promise.all(employeeDataPromises)
      await exportMultipleEmployees(employeeData)
      toast.success(`Successfully exported ${selectedEmployeeIds.length} employee(s) to Excel`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export employee data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      // Fetch full data for all employees
      const employeeDataPromises = employees.map(async (employee) => {
        const [attendanceRes, creditsRes, tasksRes] = await Promise.all([
          fetch(`/api/attendance/employee/${employee.id}`).then(r => r.json()),
          fetch(`/api/credits/employee/${employee.id}`).then(r => r.json()),
          fetch(`/api/tasks/employee/${employee.id}`).then(r => r.json())
        ])

        const attendance = attendanceRes.data || []
        const credits = creditsRes.data || []
        const tasks = tasksRes.data || []

        // Calculate stats
        const salaryData = calculateEmployeeSalary(employee)
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.isCompleted).length
        const pendingTasks = totalTasks - completedTasks
        const overdueTasks = tasks.filter((t: any) => !t.isCompleted && new Date(t.deadline) < new Date()).length
        
        const totalCredits = credits.length
        const unpaidCredits = credits.filter((c: any) => !c.isPaid).length
        const totalCreditAmount = credits.reduce((sum: number, c: any) => sum + c.amount, 0)
        const unpaidCreditAmount = credits.filter((c: any) => !c.isPaid).reduce((sum: number, c: any) => sum + c.amount, 0)
        
        const presentDays = attendance.filter((a: any) => a.status === 'present').length
        const absentDays = attendance.filter((a: any) => a.status === 'absent').length
        const halfDays = attendance.filter((a: any) => a.status === 'half-day').length
        const totalDays = attendance.length
        const attendancePercentage = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1) : '0'

        return {
          employee,
          attendance,
          credits,
          tasks,
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            totalCredits,
            unpaidCredits,
            totalCreditAmount,
            unpaidCreditAmount,
            presentDays,
            absentDays,
            halfDays,
            attendancePercentage,
            baseSalary: salaryData.baseSalary,
            leaveDeduction: salaryData.leaveDeductions,
            creditDeduction: salaryData.unpaidCredits,
            netSalary: salaryData.netSalary
          }
        }
      })

      const employeeData = await Promise.all(employeeDataPromises)
      await exportMultipleEmployees(employeeData)
      toast.success(`Successfully exported all ${employees.length} employees to Excel`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export employee data")
    } finally {
      setIsExporting(false)
    }
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAllEmployees = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([])
    } else {
      setSelectedEmployeeIds(employees.map(emp => emp.id))
    }
  }

  // Don't render until client-side initialization is complete
  if (!currentDateTime || !monthOptions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading salary data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Monthly Salary Overview</h1>
                <p className="text-sm text-muted-foreground">
                  Track your monthly payroll obligations with real-time data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="relative"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to Excel
                    {selectedEmployeeIds.length > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                        {selectedEmployeeIds.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Export Employee Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Select employees to export detailed reports
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                          onCheckedChange={selectAllEmployees}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          Select All ({employees.length})
                        </label>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {employees.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                          >
                            <Checkbox
                              id={`emp-${employee.id}`}
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                            />
                            <label
                              htmlFor={`emp-${employee.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-xs text-muted-foreground">{employee.role}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAll}
                        disabled={isExporting || employees.length === 0}
                        className="flex-1"
                      >
                        {isExporting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        All
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleExportSelected}
                        disabled={isExporting || selectedEmployeeIds.length === 0}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        {isExporting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Selected
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              Real-time data • Last updated: {currentDateTime || "Loading..."}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Base Salary</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{payrollData.summary.totalBaseSalary.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{payrollData.summary.employeeCount} employees</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{payrollData.summary.totalDeductions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Credits + Leave deductions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Payroll</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{payrollData.summary.totalNetSalary.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Amount to pay this month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₹{payrollData.summary.totalUnpaidCredits.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Outstanding credit amount</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Salary Breakdown - {selectedMonth ? format(new Date(selectedMonth + "-01"), "MMMM yyyy") : "Loading..."}
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Live Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Employee</th>
                    <th className="text-right py-3 px-2 font-medium">Base Salary</th>
                    <th className="text-right py-3 px-2 font-medium">Unpaid Credits</th>
                    <th className="text-right py-3 px-2 font-medium">Leave Deductions</th>
                    <th className="text-right py-3 px-2 font-medium">Total Deductions</th>
                    <th className="text-right py-3 px-2 font-medium text-green-600">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.employeeSalaries.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.role}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">₹{(employee.baseSalary || 0).toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-red-600">
                        {(employee.unpaidCredits || 0) > 0 ? `₹${(employee.unpaidCredits || 0).toLocaleString()}` : "-"}
                      </td>
                      <td className="text-right py-3 px-2 text-orange-600">
                        {(employee.leaveDeductions || 0) > 0
                          ? `₹${(employee.leaveDeductions || 0).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="text-right py-3 px-2 text-red-600">
                        ₹{(employee.totalDeductions || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-2 font-semibold text-green-600">
                        ₹{(employee.netSalary || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold bg-muted/30">
                    <td className="py-4 px-2">Total ({payrollData.summary.employeeCount} employees)</td>
                    <td className="text-right py-4 px-2">₹{payrollData.summary.totalBaseSalary.toLocaleString()}</td>
                    <td className="text-right py-4 px-2 text-red-600">
                      ₹{payrollData.summary.totalUnpaidCredits.toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-2 text-orange-600">
                      ₹{payrollData.summary.totalLeaveDeductions.toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-2 text-red-600">
                      ₹{payrollData.summary.totalDeductions.toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-2 font-bold text-green-600 text-lg">
                      ₹{payrollData.summary.totalNetSalary.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
  <span className="font-medium text-black">Unpaid Credits</span>
  <span className="font-bold text-red-600">
    ₹{payrollData.summary.totalUnpaidCredits.toLocaleString()}
  </span>
</div>

<div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
  <span className="font-medium text-black">Leave Deductions</span>
  <span className="font-bold text-orange-600">
    ₹{payrollData.summary.totalLeaveDeductions.toLocaleString()}
  </span>
</div>

<div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2">
  <span className="font-semibold text-black">Total Deductions</span>
  <span className="font-bold text-gray-800">
    ₹{payrollData.summary.totalDeductions.toLocaleString()}
  </span>
</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
  <span className="font-medium text-black">Total Base Salary</span>
  <span className="font-bold text-blue-600">
    ₹{payrollData.summary.totalBaseSalary.toLocaleString()}
  </span>
</div>

<div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
  <span className="font-medium text-black">Less: Deductions</span>
  <span className="font-bold text-red-600">
    -₹{payrollData.summary.totalDeductions.toLocaleString()}
  </span>
</div>

<div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
  <span className="font-semibold text-lg text-black">Net Amount to Pay</span>
  <span className="font-bold text-green-700 text-xl">
    ₹{payrollData.summary.totalNetSalary.toLocaleString()}
  </span>
</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

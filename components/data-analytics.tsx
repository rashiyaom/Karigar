"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, RefreshCw, Users, CreditCard, Calculator, TrendingUp } from "lucide-react"
import { useEmployees, useCredits, useStats } from "@/hooks/use-api"
import { useLanguage } from "@/components/language-provider"
import { store } from "@/lib/store"
import Link from "next/link"
import { format } from "date-fns"

export function DataAnalytics() {
  const [selectedMonth, setSelectedMonth] = useState("")
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([])
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

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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

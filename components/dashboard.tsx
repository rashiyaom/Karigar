"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Users,
  Calendar,
  CheckSquare,
  CreditCard,
  Plus,
  Search,
  Settings,
  Moon,
  Sun,
  Languages,
  Edit,
  Trash2,
  Eye,
  History,
  FileText,
  Database,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEmployees, useStats, useSettings, useDeleteEmployee } from "@/hooks/use-api"
import { EmployeeForm } from "@/components/employee-form"
import { EmployeeDetails } from "@/components/employee-details"
import { EmployeeReport } from "@/components/employee-report"
import { SettingsForm } from "@/components/settings-form"
import { QuickAttendance } from "@/components/quick-attendance"
import { QuickCredit } from "@/components/quick-credit"
import { QuickTask } from "@/components/quick-task"
import { ConnectionStatus } from "@/components/connection-status"
import { useToast } from "@/hooks/use-toast"
import { useWebSocket } from "@/lib/websocket"
import type { Employee } from "@/lib/types"
import Link from "next/link"

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false)
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(false)
  const [isEmployeeReportOpen, setIsEmployeeReportOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false)
  const [isQuickCreditOpen, setIsQuickCreditOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false)

  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const { toast } = useToast()
  // Added WebSocket connection for real-time updates
  useWebSocket()

  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useEmployees()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: settings } = useSettings()
  const deleteEmployeeMutation = useDeleteEmployee()

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteEmployee = async (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(employee.id)
        toast({
          title: "Success",
          description: `${employee.name} has been deleted successfully.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete employee. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsEmployeeFormOpen(true)
  }

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEmployeeDetailsOpen(true)
  }

  const handleViewEmployeeReport = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEmployeeReportOpen(true)
  }

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setIsEmployeeFormOpen(true)
  }

  if (employeesError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Failed to load data. Please refresh the page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {settings?.organizationName || "My Company"}
              </h1>
              <p className="text-sm text-muted-foreground">{t("dashboard.title")}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ConnectionStatus />

              <Link href="/database-setup">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
                  title="Database Setup"
                >
                  <Database className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/history">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
                  title="View Change History"
                >
                  <History className="h-4 w-4" />
                </Button>
              </Link>

              {/* Language Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("gu")}>ગુજરાતી</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] mx-2 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("common.settings")}</DialogTitle>
                    <DialogDescription>
                      Configure your organization settings, working hours, and system preferences.
                    </DialogDescription>
                  </DialogHeader>
                  <SettingsForm onClose={() => setIsSettingsOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalEmployees")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalEmployees || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.attendanceToday")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.attendanceToday || 0}</div>
              {stats && stats.totalEmployees > 0 && (
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.attendanceToday / stats.totalEmployees) * 100)}% present
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.pendingTasks")}</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.pendingTasks || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.outstandingCredits")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.outstandingCredits || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={handleAddEmployee} className="h-16 sm:h-20 flex flex-col gap-2 text-sm">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-center leading-tight">{t("dashboard.addEmployee")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 sm:h-20 flex flex-col gap-2 bg-transparent text-sm"
                onClick={() => setIsQuickAttendanceOpen(true)}
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-center leading-tight">{t("dashboard.markAttendance")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 sm:h-20 flex flex-col gap-2 bg-transparent text-sm"
                onClick={() => setIsQuickCreditOpen(true)}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-center leading-tight">{t("dashboard.addCredit")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 sm:h-20 flex flex-col gap-2 bg-transparent text-sm"
                onClick={() => setIsQuickTaskOpen(true)}
              >
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-center leading-tight">{t("dashboard.assignTask")}</span>
              </Button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <Link href="/attendance">
                <Button variant="link" className="text-sm">
                Attendance Calendar →
                </Button>
              </Link>
              <Link href="/credits">
                <Button variant="link" className="text-sm">
                Credit Management →
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="link" className="text-sm">
                Task Management →
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="link" className="text-sm">
                Change History →
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="link" className="text-sm">
                Data Analytics →
                </Button>
              </Link>
              <Link href="/database-setup">
                <Button variant="link" className="text-sm">
                  Database Setup →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>{t("dashboard.employeeList")}</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("dashboard.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
                <Button onClick={handleAddEmployee} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("employee.add")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No employees found matching your search."
                    : "No employees found. Add your first employee to get started."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage
                          src={employee.profilePhoto || `/placeholder.svg?height=40&width=40&query=${employee.name}`}
                        />
                        <AvatarFallback className="text-sm">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                        <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="font-medium">₹{employee.salary.toLocaleString()}</p>
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                          {employee.status === "active" ? t("employee.active") : t("employee.inactive")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                          className="flex-1 sm:flex-initial"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t("common.view")}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEmployeeReport(employee)}
                          className="flex-1 sm:flex-initial"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Report</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="flex-1 sm:flex-initial"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t("common.edit")}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee)}
                          disabled={deleteEmployeeMutation.isPending}
                          className="flex-1 sm:flex-initial"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t("common.delete")}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee Form Dialog */}
      <Dialog open={isEmployeeFormOpen} onOpenChange={setIsEmployeeFormOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] mx-2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? t("employee.update") : t("employee.add")}</DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Update employee information, salary, and role details."
                : "Add a new employee to your organization with their basic information and role."}
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee}
            onClose={() => {
              setIsEmployeeFormOpen(false)
              setEditingEmployee(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={isEmployeeDetailsOpen} onOpenChange={setIsEmployeeDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] mx-2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              View detailed employee information, attendance records, credits, and assigned tasks.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeDetails
              employee={selectedEmployee}
              onClose={() => {
                setIsEmployeeDetailsOpen(false)
                setSelectedEmployee(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedEmployee && (
        <EmployeeReport
          employee={selectedEmployee}
          isOpen={isEmployeeReportOpen}
          onClose={() => {
            setIsEmployeeReportOpen(false)
            setSelectedEmployee(null)
          }}
        />
      )}

      {/* Quick Attendance Dialog */}
      <Dialog open={isQuickAttendanceOpen} onOpenChange={setIsQuickAttendanceOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] mx-2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Attendance</DialogTitle>
            <DialogDescription>Mark attendance for multiple employees quickly for today's date.</DialogDescription>
          </DialogHeader>
          <QuickAttendance />
        </DialogContent>
      </Dialog>

      {/* Quick Credit Dialog */}
      <Dialog open={isQuickCreditOpen} onOpenChange={setIsQuickCreditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] mx-2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Credit</DialogTitle>
            <DialogDescription>
              Add a credit record for an employee. The amount will be automatically deducted from their salary.
            </DialogDescription>
          </DialogHeader>
          <QuickCredit />
        </DialogContent>
      </Dialog>

      {/* Quick Task Dialog */}
      <Dialog open={isQuickTaskOpen} onOpenChange={setIsQuickTaskOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] mx-2 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Task Assignment</DialogTitle>
            <DialogDescription>Assign a new task to an employee with priority and deadline settings.</DialogDescription>
          </DialogHeader>
          <QuickTask />
        </DialogContent>
      </Dialog>
    </div>
  )
}

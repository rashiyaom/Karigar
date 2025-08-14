"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, Search, Plus, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useEmployees, useCredits, useUpdateCredit } from "@/hooks/use-api"
import { CreditForm } from "@/components/credit-form"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import type { Employee } from "@/lib/types"

export function CreditManagement() {
  const { t } = useLanguage()
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreditFormOpen, setIsCreditFormOpen] = useState(false)
  const [selectedEmployeeForCredit, setSelectedEmployeeForCredit] = useState<Employee | null>(null)

  const { data: employees = [], isLoading: employeesLoading } = useEmployees()
  const { data: creditsData = [], isLoading: creditsLoading, refetch: refetchCredits } = useCredits()
  const updateCreditMutation = useUpdateCredit()

  const allCredits = useMemo(() => {
    if (!creditsData || !employees) return []
    return creditsData
      .map((credit) => {
        const employee = employees.find((emp) => emp.id === credit.employeeId)
        return { ...credit, employee }
      })
      .filter((credit) => credit.employee) // Filter out credits without valid employees
  }, [creditsData, employees])

  // Filter credits based on selected employee and search term
  const filteredCredits = allCredits.filter((credit) => {
    const matchesEmployee = selectedEmployee === "all" || credit.employeeId === selectedEmployee
    const matchesSearch =
      credit.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.employee?.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.amount.toString().includes(searchTerm)
    return matchesEmployee && matchesSearch
  })

  // Calculate statistics
  const stats = {
    totalCredits: filteredCredits.length,
    unpaidCredits: filteredCredits.filter((c) => !c.isPaid).length,
    totalUnpaidAmount: filteredCredits.filter((c) => !c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    overdueCredits: filteredCredits.filter((c) => !c.isPaid && new Date(c.promiseReturnDate) < new Date()).length,
  }

  const isLoading = employeesLoading || creditsLoading

  const handleAddCredit = (employee?: Employee) => {
    setSelectedEmployeeForCredit(employee || null)
    setIsCreditFormOpen(true)
  }

  const handleMarkAsPaid = async (credit: any) => {
    try {
      console.log('Marking credit as paid:', credit.id, credit.employeeId) // Debug log
      await updateCreditMutation.mutateAsync({
        id: credit.id,
        employeeId: credit.employeeId,
        isPaid: true,
      })
      
      // Refresh the credits data
      await refetchCredits()
      
      toast({
        title: "Success",
        description: `Credit marked as paid for ${credit.employee?.name}`,
      })
    } catch (error) {
      console.error('Error marking credit as paid:', error) // Debug log
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark credit as paid",
        variant: "destructive",
      })
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("credits.management")}</h1>
            <p className="text-muted-foreground">Loading credit data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("credits.management")}</h1>
          <p className="text-muted-foreground">Track and manage employee credits</p>
        </div>
        <Button onClick={() => handleAddCredit()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("credits.add")}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Credits</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaidCredits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{stats.totalUnpaidAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Credits</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueCredits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, role, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Credits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Records ({filteredCredits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCredits.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No credit records found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedEmployee !== "all"
                  ? "Try adjusting your search filters"
                  : "Start by adding a new credit record"}
              </p>
              <Button onClick={() => handleAddCredit()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Credit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCredits.map((credit) => {
                const promiseReturnDate = new Date(credit.promiseReturnDate)
                const today = new Date()
                const diffTime = promiseReturnDate.getTime() - today.getTime()
                const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const isOverdue = daysUntilDue < 0

                return (
                  <div
                    key={credit.id}
                    className={`
                      flex items-center justify-between p-4 border rounded-lg
                      ${isOverdue ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : ""}
                      ${credit.isPaid ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : ""}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={
                            credit.employee?.profilePhoto ||
                            `/placeholder.svg?height=40&width=40&query=${credit.employee?.name || "/placeholder.svg"}`
                          }
                        />
                        <AvatarFallback>
                          {credit.employee?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{credit.employee?.name || "Unknown Employee"}</h3>
                        <p className="text-sm text-muted-foreground">{credit.employee?.role || "Unknown Role"}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-muted-foreground">
                            Taken: {format(new Date(credit.dateTaken), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Promise: {format(new Date(credit.promiseReturnDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{credit.amount.toLocaleString()}</p>
                        {!credit.isPaid && (
                          <p
                            className={`text-sm ${
                              isOverdue
                                ? "text-red-600"
                                : daysUntilDue <= 7
                                  ? "text-orange-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {isOverdue
                              ? `Overdue by ${Math.abs(daysUntilDue)} days`
                              : daysUntilDue <= 0
                                ? "Due today"
                                : `Due in ${daysUntilDue} days`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={credit.isPaid ? "default" : isOverdue ? "destructive" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {credit.isPaid ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              {isOverdue ? "Overdue" : "Unpaid"}
                            </>
                          )}
                        </Badge>
                        {!credit.isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(credit)}
                            disabled={updateCreditMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleAddCredit(credit.employee || undefined)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Credit
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Form Dialog */}
      <Dialog open={isCreditFormOpen} onOpenChange={setIsCreditFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("credits.add")}</DialogTitle>
            <DialogDescription>
              Add a new credit record for {selectedEmployeeForCredit?.name || "an employee"}.
            </DialogDescription>
          </DialogHeader>
          <CreditForm
            employee={selectedEmployeeForCredit}
            isOpen={isCreditFormOpen}
            onClose={() => {
              setIsCreditFormOpen(false)
              setSelectedEmployeeForCredit(null)
              // Refresh credits data after form closes
              refetchCredits()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, Search, Plus, DollarSign, Calendar, CheckCircle, XCircle, WalletCards } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useEmployees, useCredits, useUpdateCredit } from "@/hooks/use-api"
import { CreditForm } from "@/components/credit-form"
import { addDays, endOfMonth, format, isAfter, isBefore, isSameDay } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import type { Employee } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

type CreditWithEmployee = {
  id: string
  employeeId: string
  employee?: Employee
}

export function CreditManagement() {
  const { t } = useLanguage()
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dueDatePreset, setDueDatePreset] = useState<"all" | "today" | "next7" | "monthEnd" | "overdue">("all")
  const [isCreditFormOpen, setIsCreditFormOpen] = useState(false)
  const [selectedEmployeeForCredit, setSelectedEmployeeForCredit] = useState<Employee | null>(null)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // Set current date on client-side only to avoid hydration issues
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

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
    if (!currentDate) return false

    const matchesEmployee = selectedEmployee === "all" || credit.employeeId === selectedEmployee
    const matchesSearch =
      credit.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.employee?.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.amount.toString().includes(searchTerm)

    const dueDate = new Date(credit.promiseReturnDate)
    const matchesDueDate =
      dueDatePreset === "all"
        ? true
        : dueDatePreset === "today"
          ? isSameDay(dueDate, currentDate)
          : dueDatePreset === "next7"
            ? isAfter(dueDate, currentDate) && isBefore(dueDate, addDays(currentDate, 8))
            : dueDatePreset === "monthEnd"
              ? isBefore(dueDate, addDays(endOfMonth(currentDate), 1))
              : !credit.isPaid && isBefore(dueDate, currentDate)

    return matchesEmployee && matchesSearch && matchesDueDate
  })

  // Calculate statistics
  const stats = {
    totalCredits: filteredCredits.length,
    unpaidCredits: filteredCredits.filter((c) => !c.isPaid).length,
    totalUnpaidAmount: filteredCredits.filter((c) => !c.isPaid).reduce((sum, c) => sum + c.amount, 0),
    overdueCredits: currentDate ? filteredCredits.filter((c) => !c.isPaid && new Date(c.promiseReturnDate) < currentDate).length : 0,
  }

  const isLoading = employeesLoading || creditsLoading

  const handleAddCredit = (employee?: Employee) => {
    setSelectedEmployeeForCredit(employee || null)
    setIsCreditFormOpen(true)
  }

  const handleMarkAsPaid = async (credit: CreditWithEmployee) => {
    try {
      const updateData = {
        id: credit.id,
        employeeId: credit.employeeId,
        isPaid: true,
      }
      
      await updateCreditMutation.mutateAsync(updateData)
      
      // Refresh the credits data
      await refetchCredits()
      
      toast({
        title: "Success",
        description: `Credit marked as paid for ${credit.employee?.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark credit as paid",
        variant: "destructive",
      })
    }
  }

  const handleBulkMarkPaid = async (scope: "filtered" | "overdue") => {
    const now = currentDate || new Date()
    const targets = filteredCredits.filter((credit) => {
      if (credit.isPaid) return false
      if (scope === "filtered") return true
      return isBefore(new Date(credit.promiseReturnDate), now)
    })

    if (targets.length === 0) {
      toast({
        title: "No Matching Credits",
        description: "There are no unpaid records in this bulk scope.",
      })
      return
    }

    setIsBulkProcessing(true)
    let successCount = 0
    let failedCount = 0

    for (const credit of targets) {
      try {
        await updateCreditMutation.mutateAsync({
          id: credit.id,
          employeeId: credit.employeeId,
          isPaid: true,
        })
        successCount += 1
      } catch {
        failedCount += 1
      }
    }

    await refetchCredits()
    setIsBulkProcessing(false)

    toast({
      title: "Bulk Action Complete",
      description: `Marked paid: ${successCount}, Failed: ${failedCount}`,
      variant: failedCount > 0 ? "destructive" : "default",
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/60 shadow-sm">
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 shadow-sm dark:from-emerald-950/30 dark:via-slate-900 dark:to-amber-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Credit Ledger</p>
            <h1 className="text-2xl font-semibold mt-1">{t("credits.management")}</h1>
            <p className="text-sm text-muted-foreground">Outstanding, overdue, and paid records sync directly with your database.</p>
          </div>
          <Button onClick={() => handleAddCredit()} className="w-full lg:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("credits.add")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">All credit entries in current filter</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Credits</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unpaidCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Require follow-up</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{stats.totalUnpaidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total amount still due</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Credits</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Past promised return date</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Active Records</h2>
          <p className="text-sm text-muted-foreground">Search and update records instantly.</p>
        </div>
        <Badge variant="outline" className="w-fit">Live count: {filteredCredits.length}</Badge>
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm lg:grid-cols-[1fr_240px_240px]">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, role, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
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
        <Select value={dueDatePreset} onValueChange={(value) => setDueDatePreset(value as typeof dueDatePreset)}>
          <SelectTrigger>
            <SelectValue placeholder="Due date preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Due Dates</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="next7">Next 7 Days</SelectItem>
            <SelectItem value="monthEnd">Due by Month End</SelectItem>
            <SelectItem value="overdue">Overdue Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Bulk Credit Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkProcessing}
              onClick={() => handleBulkMarkPaid("filtered")}
            >
              Mark Filtered Unpaid as Paid
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkProcessing}
              onClick={() => handleBulkMarkPaid("overdue")}
            >
              Mark Overdue as Paid
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Uses current DB flow by calling the same update credit mutation for each matching record.
          </p>
        </CardContent>
      </Card>

      {/* Credits List */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Records ({filteredCredits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCredits.length === 0 ? (
            <div className="text-center py-8">
              <WalletCards className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                const today = currentDate || new Date()
                const diffTime = promiseReturnDate.getTime() - today.getTime()
                const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const isOverdue = daysUntilDue < 0

                return (
                  <div
                    key={credit.id}
                    className={`
                      flex flex-col gap-4 rounded-xl border p-4 transition-colors md:flex-row md:items-center md:justify-between
                      ${isOverdue ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : ""}
                      ${credit.isPaid ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : ""}
                      ${!isOverdue && !credit.isPaid ? "border-border/70 bg-background" : ""}
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

                    <div className="flex flex-col gap-3 md:items-end">
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

                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
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

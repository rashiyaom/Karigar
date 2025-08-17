"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditCard } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useEmployees, useCreateCredit } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { format, addDays } from "date-fns"

export function QuickCredit() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)
  const [promiseDays, setPromiseDays] = useState<number>(30)
  const [today, setToday] = useState<Date | null>(null)

  // Set current date on client-side only to avoid hydration issues
  useEffect(() => {
    setToday(new Date())
  }, [])

  const { data: employees = [] } = useEmployees()
  const createCreditMutation = useCreateCredit()

  const promiseDate = today ? addDays(today, promiseDays) : null

  // Don't render until dates are set
  if (!today || !promiseDate) {
    return <div>Loading...</div>
  }

  const handleSubmit = async () => {
    if (!today || !promiseDate || !selectedEmployee || amount <= 0) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      await createCreditMutation.mutateAsync({
        employeeId: selectedEmployee,
        amount,
        dateTaken: format(today, "yyyy-MM-dd"),
        promiseReturnDate: format(promiseDate, "yyyy-MM-dd"),
        isPaid: false,
      })

      toast({
        title: "Success",
        description: "Credit record created successfully",
      })

      // Reset form
      setSelectedEmployee("")
      setAmount(0)
      setPromiseDays(30)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create credit record",
        variant: "destructive",
      })
    }
  }

  const selectedEmployeeData = employees.find((emp) => emp.id === selectedEmployee)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Quick Credit - {format(today, "MMMM dd, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employee Selection */}
        <div className="space-y-2">
          <Label>Select Employee</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={employee.profilePhoto || `/placeholder.svg?height=24&width=24&query=${employee.name}`}
                      />
                      <AvatarFallback className="text-xs">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {employee.name} - {employee.role}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Employee Info */}
        {selectedEmployeeData && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src={
                      selectedEmployeeData.profilePhoto ||
                      `/placeholder.svg?height=40&width=40&query=${selectedEmployeeData.name || "/placeholder.svg"}`
                    }
                  />
                  <AvatarFallback>
                    {selectedEmployeeData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedEmployeeData.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmployeeData.role}</p>
                  <p className="text-sm text-muted-foreground">
                    Base Salary: ${selectedEmployeeData.salary.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Credit Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promiseDays">Promise Return (Days)</Label>
            <Select value={promiseDays.toString()} onValueChange={(value) => setPromiseDays(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="15">15 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedEmployee("")
              setAmount(0)
              setPromiseDays(30)
            }}
          >
            Clear
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedEmployee || amount <= 0 || createCreditMutation.isPending}>
            {createCreditMutation.isPending ? "Creating..." : "Add Credit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

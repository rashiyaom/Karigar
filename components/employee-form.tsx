"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/components/language-provider"
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/types"

interface EmployeeFormProps {
  employee?: Employee | null
  onClose: () => void
}

export function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const createEmployeeMutation = useCreateEmployee()
  const updateEmployeeMutation = useUpdateEmployee()

  const [formData, setFormData] = useState({
    name: employee?.name || "",
    salary: employee?.salary || 0,
    joiningDate: employee?.joiningDate || "",
    mobile: employee?.mobile || "",
    email: employee?.email || "",
    role: employee?.role || "",
    status: employee?.status || ("active" as const),
    profilePhoto: employee?.profilePhoto || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (formData.salary <= 0) newErrors.salary = "Salary must be greater than 0"
    if (!formData.joiningDate) newErrors.joiningDate = "Joining date is required"
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.role.trim()) newErrors.role = "Role is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (employee) {
        await updateEmployeeMutation.mutateAsync({
          id: employee.id,
          ...formData,
        })
        toast({
          title: "Success",
          description: "Employee updated successfully",
        })
      } else {
        await createEmployeeMutation.mutateAsync(formData)
        toast({
          title: "Success",
          description: "Employee created successfully",
        })
      }
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save employee",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const isLoading = createEmployeeMutation.isPending || updateEmployeeMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={formData.profilePhoto || `/placeholder.svg?height=80&width=80&query=${formData.name}`}
              />
              <AvatarFallback className="text-lg">
                {formData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="profilePhoto">Profile Photo URL</Label>
              <Input
                id="profilePhoto"
                value={formData.profilePhoto}
                onChange={(e) => handleInputChange("profilePhoto", e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("employee.name")} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">{t("employee.role")} *</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            className={errors.role ? "border-destructive" : ""}
          />
          {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("employee.email")} *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">{t("employee.mobile")} *</Label>
          <Input
            id="mobile"
            value={formData.mobile}
            onChange={(e) => handleInputChange("mobile", e.target.value)}
            className={errors.mobile ? "border-destructive" : ""}
          />
          {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">{t("employee.salary")} *</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary}
            onChange={(e) => handleInputChange("salary", Number(e.target.value))}
            className={errors.salary ? "border-destructive" : ""}
          />
          {errors.salary && <p className="text-sm text-destructive">{errors.salary}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="joiningDate">{t("employee.joiningDate")} *</Label>
          <Input
            id="joiningDate"
            type="date"
            value={formData.joiningDate}
            onChange={(e) => handleInputChange("joiningDate", e.target.value)}
            className={errors.joiningDate ? "border-destructive" : ""}
          />
          {errors.joiningDate && <p className="text-sm text-destructive">{errors.joiningDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t("employee.status")}</Label>
          <Select
            value={formData.status}
            onValueChange={(value: "active" | "inactive") => handleInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("employee.active")}</SelectItem>
              <SelectItem value="inactive">{t("employee.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : employee ? t("employee.update") : t("employee.add")}
        </Button>
      </div>
    </form>
  )
}

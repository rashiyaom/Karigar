"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/language-provider"
import { useSettings, useUpdateSettings } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

interface SettingsFormProps {
  onClose: () => void
}

export function SettingsForm({ onClose }: SettingsFormProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { data: settings } = useSettings()
  const updateSettingsMutation = useUpdateSettings()

  const [formData, setFormData] = useState({
    organizationName: settings?.organizationName || "",
    leaveDeductionType: settings?.leaveDeduction.type || "percentage",
    leaveDeductionValue: settings?.leaveDeduction.value || 10,
    workingHoursStart: settings?.workingHours?.start || "09:00",
    workingHoursEnd: settings?.workingHours?.end || "17:00",
    weekendDays: settings?.weekendDays || ["saturday", "sunday"],
    autoMarkAbsent: settings?.autoMarkAbsent || false,
    emailNotifications: settings?.emailNotifications || false,
    backupFrequency: settings?.backupFrequency || "daily",
    companyAddress: settings?.companyAddress || "",
    companyPhone: settings?.companyPhone || "",
    companyEmail: settings?.companyEmail || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateSettingsMutation.mutateAsync({
        organizationName: formData.organizationName,
        leaveDeduction: {
          type: formData.leaveDeductionType as "percentage" | "fixed",
          value: formData.leaveDeductionValue,
        },
        workingHours: {
          start: formData.workingHoursStart,
          end: formData.workingHoursEnd,
        },
        weekendDays: formData.weekendDays,
        autoMarkAbsent: formData.autoMarkAbsent,
        emailNotifications: formData.emailNotifications,
        backupFrequency: formData.backupFrequency,
        companyAddress: formData.companyAddress,
        companyPhone: formData.companyPhone,
        companyEmail: formData.companyEmail,
      })
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  const handleWeekendDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      weekendDays: prev.weekendDays.includes(day)
        ? prev.weekendDays.filter((d) => d !== day)
        : [...prev.weekendDays, day],
    }))
  }

  const isLoading = updateSettingsMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">{t("common.organization")} Name</Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
              placeholder="Enter organization name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="company@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={formData.companyPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Textarea
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, companyAddress: e.target.value }))}
              placeholder="Enter company address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours & Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Start Time</Label>
              <Input
                id="workingHoursStart"
                type="time"
                value={formData.workingHoursStart}
                onChange={(e) => setFormData((prev) => ({ ...prev, workingHoursStart: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">End Time</Label>
              <Input
                id="workingHoursEnd"
                type="time"
                value={formData.workingHoursEnd}
                onChange={(e) => setFormData((prev) => ({ ...prev, workingHoursEnd: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Weekend Days</Label>
            <div className="grid grid-cols-4 gap-2">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Switch
                    id={day}
                    checked={formData.weekendDays.includes(day)}
                    onCheckedChange={() => handleWeekendDayToggle(day)}
                  />
                  <Label htmlFor={day} className="text-sm capitalize">
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Deduction Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deductionType">Deduction Type</Label>
            <Select
              value={formData.leaveDeductionType}
              onValueChange={(value: "percentage" | "fixed") =>
                setFormData((prev) => ({ ...prev, leaveDeductionType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deductionValue">
              Deduction Value {formData.leaveDeductionType === "percentage" ? "(%)" : "(₹)"}
            </Label>
            <Input
              id="deductionValue"
              type="number"
              value={formData.leaveDeductionValue}
              onChange={(e) => setFormData((prev) => ({ ...prev, leaveDeductionValue: Number(e.target.value) }))}
              placeholder={formData.leaveDeductionType === "percentage" ? "10" : "1000"}
            />
            <p className="text-sm text-muted-foreground">
              {formData.leaveDeductionType === "percentage"
                ? "Percentage of daily salary to deduct per leave day"
                : "Fixed amount in rupees to deduct per leave day"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation & Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoMarkAbsent">Auto-mark Absent</Label>
              <p className="text-sm text-muted-foreground">
                Automatically mark employees as absent if not marked present by end of day
              </p>
            </div>
            <Switch
              id="autoMarkAbsent"
              checked={formData.autoMarkAbsent}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoMarkAbsent: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, emailNotifications: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Data Backup Frequency</Label>
            <Select
              value={formData.backupFrequency}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, backupFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </form>
  )
}

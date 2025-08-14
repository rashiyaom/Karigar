"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Employee, Attendance, Credit, Task, Settings, ApiResponse } from "@/lib/types"

const API_BASE = "/api"

// Generic API function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  const data: ApiResponse<T> = await response.json()

  if (!data.success) {
    throw new Error(data.error || "API call failed")
  }

  return data.data as T
}

// Employee hooks
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () => apiCall<Employee[]>("/employees"),
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => apiCall<Employee>(`/employees/${id}`),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) =>
      apiCall<Employee>("/employees", {
        method: "POST",
        body: JSON.stringify(employee),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Employee> & { id: string }) =>
      apiCall<Employee>(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiCall(`/employees/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

// Attendance hooks
export function useAttendance(employeeId: string) {
  return useQuery({
    queryKey: ["attendance", employeeId],
    queryFn: () => apiCall<Attendance[]>(`/attendance/employee/${employeeId}`),
    enabled: !!employeeId,
  })
}

export function useCreateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">) =>
      apiCall<Attendance>("/attendance", {
        method: "POST",
        body: JSON.stringify(attendance),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId, ...updates }: Partial<Attendance> & { id: string; employeeId: string }) =>
      apiCall<Attendance>(`/attendance/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      apiCall(`/attendance/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useResetAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (date?: string) =>
      apiCall(`/attendance/reset${date ? `?date=${date}` : ""}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useCredits(employeeId?: string) {
  return useQuery({
    queryKey: employeeId ? ["credits", employeeId] : ["credits"],
    queryFn: () => apiCall<Credit[]>(employeeId ? `/credits/employee/${employeeId}` : "/credits"),
    enabled: true,
  })
}

export function useCreateCredit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (credit: Omit<Credit, "id" | "createdAt" | "updatedAt">) =>
      apiCall<Credit>("/credits", {
        method: "POST",
        body: JSON.stringify(credit),
      }),
    onSuccess: (data, variables) => {
      // Invalidate all credit-related queries
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      queryClient.invalidateQueries({ queryKey: ["credits", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      // Also invalidate employee-specific queries to update employee details view
      queryClient.invalidateQueries({ queryKey: ["employee", variables.employeeId] })
    },
  })
}

export function useUpdateCredit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId, ...updates }: Partial<Credit> & { id: string; employeeId: string }) =>
      apiCall<Credit>(`/credits/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      queryClient.invalidateQueries({ queryKey: ["credits", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["employee", variables.employeeId] })
    },
  })
}

export function useDeleteCredit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      apiCall(`/credits/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credits"] })
      queryClient.invalidateQueries({ queryKey: ["credits", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["employee", variables.employeeId] })
    },
  })
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiCall<Task[]>("/tasks"),
  })
}

export function useEmployeeTasks(employeeId: string) {
  return useQuery({
    queryKey: ["tasks", employeeId],
    queryFn: () => apiCall<Task[]>(`/tasks/employee/${employeeId}`),
    enabled: !!employeeId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) =>
      apiCall<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      }),
    onSuccess: (data, variables) => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      // Also invalidate employee-specific queries to update employee details view
      queryClient.invalidateQueries({ queryKey: ["employee", variables.employeeId] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Task> & { id: string }) =>
      apiCall<Task>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      if (data.employeeId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", data.employeeId] })
        queryClient.invalidateQueries({ queryKey: ["employee", data.employeeId] })
      }
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      apiCall(`/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["employee", variables.employeeId] })
    },
  })
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiCall<Settings>("/settings"),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Partial<Settings>) =>
      apiCall<Settings>("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

// Stats hooks
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      apiCall<{
        totalEmployees: number
        attendanceToday: number
        pendingTasks: number
        outstandingCredits: number
      }>("/stats"),
    refetchInterval: 60000, // Refetch every 60 seconds (reduced from 30)
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  })
}

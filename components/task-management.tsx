"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Calendar, User, Filter } from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { useTasks, useEmployees, useUpdateTask, useDeleteTask } from "@/hooks/use-api"
import { TaskForm } from "@/components/task-form"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/lib/types"

export function TaskManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEmployee, setFilterEmployee] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  // Set current date on client-side only to avoid hydration issues
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  const { t } = useLanguage()
  const { toast } = useToast()
  const { data: tasks = [], isLoading } = useTasks()
  const { data: employees = [] } = useEmployees()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmployee = filterEmployee === "all" || task.employeeId === filterEmployee
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    const matchesStatus = filterStatus === "all" || (task.isCompleted ? "completed" : "pending") === filterStatus

    return matchesSearch && matchesEmployee && matchesPriority && matchesStatus
  })

  // Group tasks by status - only filter if currentDate is available
  const pendingTasks = filteredTasks.filter((task) => !task.isCompleted)
  const completedTasks = filteredTasks.filter((task) => task.isCompleted)
  
  const overdueTasks = currentDate 
    ? pendingTasks.filter((task) => isBefore(new Date(task.deadline), currentDate))
    : []
    
  const dueSoonTasks = currentDate 
    ? pendingTasks.filter((task) => {
        const deadline = new Date(task.deadline)
        const threeDaysFromNow = addDays(currentDate, 3)
        return isAfter(deadline, currentDate) && isBefore(deadline, threeDaysFromNow)
      })
    : []

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    return employee?.name || "Unknown"
  }

  const getEmployeeAvatar = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId)
    return employee?.profilePhoto || `/placeholder.svg?height=32&width=32&query=${employee?.name || "User"}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (task: Task) => {
    if (task.isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (currentDate && isBefore(new Date(task.deadline), currentDate)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateTaskMutation.mutateAsync({
        ...task,
        isCompleted: !task.isCompleted,
      })
      toast({
        title: "Success",
        description: `Task ${task.isCompleted ? "reopened" : "completed"} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      })
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTaskMutation.mutateAsync({ id: task.id, employeeId: task.employeeId })
        toast({
          title: "Success",
          description: "Task deleted successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete task.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setIsTaskFormOpen(true)
  }

  if (isLoading || !currentDate) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">Manage and track employee tasks</p>
        </div>
        <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update the task details below." : "Create a new task by filling out the form below."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              onClose={() => {
                setIsTaskFormOpen(false)
                setEditingTask(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
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

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskList
            tasks={filteredTasks}
            employees={employees}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            getEmployeeName={getEmployeeName}
            getEmployeeAvatar={getEmployeeAvatar}
            getPriorityColor={getPriorityColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="pending">
          <TaskList
            tasks={pendingTasks}
            employees={employees}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            getEmployeeName={getEmployeeName}
            getEmployeeAvatar={getEmployeeAvatar}
            getPriorityColor={getPriorityColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <TaskList
            tasks={overdueTasks}
            employees={employees}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            getEmployeeName={getEmployeeName}
            getEmployeeAvatar={getEmployeeAvatar}
            getPriorityColor={getPriorityColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="completed">
          <TaskList
            tasks={completedTasks}
            employees={employees}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            getEmployeeName={getEmployeeName}
            getEmployeeAvatar={getEmployeeAvatar}
            getPriorityColor={getPriorityColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TaskListProps {
  tasks: Task[]
  employees: any[]
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  getEmployeeName: (id: string) => string
  getEmployeeAvatar: (id: string) => string
  getPriorityColor: (priority: string) => string
  getStatusIcon: (task: Task) => React.ReactNode
}

function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  getEmployeeName,
  getEmployeeAvatar,
  getPriorityColor,
  getStatusIcon,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(task)}
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <Badge variant={getPriorityColor(task.priority) as any}>{task.priority}</Badge>
                  <Badge variant={task.isCompleted ? "default" : "secondary"}>
                    {task.isCompleted ? "completed" : "pending"}
                  </Badge>
                </div>

                {task.description && <p className="text-muted-foreground mb-3">{task.description}</p>}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getEmployeeAvatar(task.employeeId) || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {getEmployeeName(task.employeeId)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{getEmployeeName(task.employeeId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(new Date(task.deadline), "MMM dd, yyyy")}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleComplete(task)}
                  className={task.isCompleted ? "bg-green-50 border-green-200" : ""}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {task.isCompleted ? "Reopen" : "Complete"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(task)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

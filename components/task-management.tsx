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
import { format, isAfter, isBefore, addDays, formatDistanceToNowStrict } from "date-fns"
import { useTasks, useEmployees, useUpdateTask, useDeleteTask } from "@/hooks/use-api"
import { TaskForm } from "@/components/task-form"
import { useToast } from "@/hooks/use-toast"
import type { Task } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

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
    } catch {
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
      } catch {
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
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`task-skeleton-${idx}`} className="border-border/60 shadow-sm">
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-cyan-50 via-white to-amber-50 p-5 shadow-sm dark:from-cyan-950/30 dark:via-slate-900 dark:to-amber-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Task Board</p>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Manage and track employee tasks with real-time status updates.</p>
          </div>
          <Badge variant="outline" className="w-fit">Open tasks: {pendingTasks.length}</Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Operations</h2>
          <p className="text-sm text-muted-foreground">Create, assign, complete, and revisit tasks.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">All records in database</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonTasks.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Upcoming within 3 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
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
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskList
            tasks={filteredTasks}
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
  onToggleComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  getEmployeeName: (id: string) => string
  getEmployeeAvatar: (id: string) => string
  getPriorityColor: (priority: string) => "destructive" | "default" | "secondary"
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
        <Card key={task.id} className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(task)}
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
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
                    <span className="text-xs">({formatDistanceToNowStrict(new Date(task.deadline), { addSuffix: true })})</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:ml-4 lg:justify-end">
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

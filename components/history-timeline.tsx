"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Undo2, User, CreditCard, CheckSquare, Calendar, Search } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface HistoryEntry {
  id: string
  timestamp: string
  action: string
  entity: string
  entityId: string
  oldData?: unknown
  newData?: unknown
  description: string
}

export function HistoryTimeline() {
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: history = [], isLoading } = useQuery<HistoryEntry[]>({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await fetch("/api/history")
      if (!response.ok) throw new Error("Failed to fetch history")
      const result = await response.json()
      return result.data
    },
  })

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesSearch =
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.action.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesEntity = entityFilter === "all" || entry.entity === entityFilter
      const matchesAction = actionFilter === "all" || entry.action === actionFilter

      return matchesSearch && matchesEntity && matchesAction
    })
  }, [actionFilter, entityFilter, history, searchTerm])

  const handleUndo = async (historyId: string) => {
    try {
      const response = await fetch(`/api/history/${historyId}/undo`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to undo action")

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries()

      toast({
        title: "Success",
        description: "Action has been undone successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to undo action. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "employee":
        return <User className="h-4 w-4" />
      case "credit":
        return <CreditCard className="h-4 w-4" />
      case "task":
        return <CheckSquare className="h-4 w-4" />
      case "attendance":
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-slate-50 via-white to-teal-50 p-5 shadow-sm dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Audit Feed</p>
        <h2 className="mt-1 text-2xl font-semibold">Change History</h2>
        <p className="text-sm text-muted-foreground">Track edits across employees, attendance, credits, and tasks. Undo supported actions instantly.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Changes
          </CardTitle>
          <div className="grid gap-3 pt-2 md:grid-cols-[1fr_170px_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search descriptions, entities, or actions"
                className="pl-8"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 py-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`history-skeleton-${idx}`} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No matching history entries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((entry, index) => (
                    <div key={`${entry.id}-${entry.timestamp}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {getEntityIcon(entry.entity)}
                        </div>
                        {index < filteredHistory.length - 1 && <div className="h-8 w-px bg-border mt-2" />}
                      </div>

                      <div className="flex-1 space-y-2 rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                            <Badge variant="outline">{entry.entity}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </span>
                            {entry.oldData != null && !entry.description.includes("(UNDONE)") && (
                              <Button size="sm" variant="ghost" onClick={() => handleUndo(entry.id)} className="h-6 px-2">
                                <Undo2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 text-left justify-start"
                            >
                              <p className="text-sm">{entry.description}</p>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Change Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Action:</span> {entry.action}
                                </div>
                                <div>
                                  <span className="font-medium">Entity:</span> {entry.entity}
                                </div>
                                <div>
                                  <span className="font-medium">Time:</span> {format(new Date(entry.timestamp), "PPpp")}
                                </div>
                                <div>
                                  <span className="font-medium">ID:</span> {entry.entityId}
                                </div>
                              </div>

                              {entry.oldData != null && (
                                <div>
                                  <h4 className="font-medium mb-2">Previous Data:</h4>
                                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                    {JSON.stringify(entry.oldData, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {entry.newData != null && (
                                <div>
                                  <h4 className="font-medium mb-2">New Data:</h4>
                                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                    {JSON.stringify(entry.newData, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

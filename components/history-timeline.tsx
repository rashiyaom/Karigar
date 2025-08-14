"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Undo2, User, CreditCard, CheckSquare, Calendar } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format, formatDistanceToNow } from "date-fns"

interface HistoryEntry {
  id: string
  timestamp: string
  action: string
  entity: string
  entityId: string
  oldData?: any
  newData?: any
  description: string
}

export function HistoryTimeline() {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await fetch("/api/history")
      if (!response.ok) throw new Error("Failed to fetch history")
      const result = await response.json()
      return result.data
    },
  })

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
    } catch (error) {
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getEntityIcon(entry.entity)}
                    </div>
                    {index < history.length - 1 && <div className="h-8 w-px bg-border mt-2" />}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                        <Badge variant="outline">{entry.entity}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </span>
                        {entry.oldData && !entry.description.includes("(UNDONE)") && (
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
                          onClick={() => setSelectedEntry(entry)}
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

                          {entry.oldData && (
                            <div>
                              <h4 className="font-medium mb-2">Previous Data:</h4>
                              <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                {JSON.stringify(entry.oldData, null, 2)}
                              </pre>
                            </div>
                          )}

                          {entry.newData && (
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
      </CardContent>
    </Card>
  )
}

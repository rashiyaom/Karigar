"use client"

import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

export interface WebSocketMessage {
  type: "employee_updated" | "attendance_marked" | "credit_added" | "task_updated" | "stats_updated"
  data: any
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    }, 10000) // Poll every 10 seconds for demo purposes
  }

  const connect = () => {
    console.log("Using polling fallback for real-time updates")
    startPolling()
    return

    // WebSocket code commented out for demo environment
    /*
    try {
      const ws = new WebSocket("ws://localhost:3001/ws")

      ws.onopen = () => {
        setIsConnected(true)
        console.log("WebSocket connected")
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        console.log("WebSocket disconnected")
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
        startPolling()
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error)
      startPolling()
    }
    */
  }

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "employee_updated":
        queryClient.invalidateQueries({ queryKey: ["employees"] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
        break
      case "attendance_marked":
        queryClient.invalidateQueries({ queryKey: ["attendance"] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
        break
      case "credit_added":
        queryClient.invalidateQueries({ queryKey: ["credits"] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
        break
      case "task_updated":
        queryClient.invalidateQueries({ queryKey: ["tasks"] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
        break
      case "stats_updated":
        queryClient.invalidateQueries({ queryKey: ["stats"] })
        break
    }
  }

  const sendMessage = (message: WebSocketMessage) => {
    handleMessage(message)
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  useEffect(() => {
    connect()
    return disconnect
  }, [])

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
  }
}

// Hook to broadcast changes
export function useBroadcast() {
  const { sendMessage } = useWebSocket()

  const broadcastEmployeeUpdate = (employeeId: string) => {
    sendMessage({
      type: "employee_updated",
      data: { employeeId },
    })
  }

  const broadcastAttendanceUpdate = (employeeId: string, date: string) => {
    sendMessage({
      type: "attendance_marked",
      data: { employeeId, date },
    })
  }

  const broadcastCreditUpdate = (employeeId: string) => {
    sendMessage({
      type: "credit_added",
      data: { employeeId },
    })
  }

  const broadcastTaskUpdate = (taskId: string) => {
    sendMessage({
      type: "task_updated",
      data: { taskId },
    })
  }

  return {
    broadcastEmployeeUpdate,
    broadcastAttendanceUpdate,
    broadcastCreditUpdate,
    broadcastTaskUpdate,
  }
}

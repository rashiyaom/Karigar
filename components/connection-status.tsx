"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { useWebSocket } from "@/lib/websocket"

export function ConnectionStatus() {
  const { isConnected } = useWebSocket()

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
      {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {isConnected ? "Connected" : "Offline"}
    </Badge>
  )
}

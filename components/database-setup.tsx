"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database, FolderOpen, HardDrive, CheckCircle, AlertCircle, Download, Upload, Settings } from "lucide-react"

interface DatabaseSetupProps {
  onSetupComplete?: () => void
}

export default function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [currentPath, setCurrentPath] = useState<string>("")
  const [customPath, setCustomPath] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [dbStats, setDbStats] = useState<any>(null)

  useEffect(() => {
    fetchDatabaseInfo()
  }, [])

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch("/api/database/info")
      const data = await response.json()
      if (data.success) {
        setCurrentPath(data.data.path)
        setDbStats(data.data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch database info:", error)
    }
  }

  const handleSetDatabasePath = async () => {
    if (!customPath.trim()) {
      setStatus("error")
      setMessage("Please enter a valid path")
      return
    }

    // Basic path validation
    const trimmedPath = customPath.trim()
    if (trimmedPath.length < 3) {
      setStatus("error")
      setMessage("Path is too short. Please provide a valid file path.")
      return
    }

    // Check if path ends with .db, if not add it
    let finalPath = trimmedPath
    if (!finalPath.endsWith('.db')) {
      finalPath = finalPath.endsWith('/') || finalPath.endsWith('\\') 
        ? finalPath + 'employee_management.db'
        : finalPath + '/employee_management.db'
    }

    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      console.log("Setting database path to:", finalPath)
      
      const response = await fetch("/api/database/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: finalPath }),
      })

      const data = await response.json()
      console.log("Database setup response:", data)

      if (data.success) {
        setStatus("success")
        setMessage(`Database location updated successfully! New path: ${data.data.path}`)
        setCurrentPath(data.data.path)
        setCustomPath("") // Clear the input
        await fetchDatabaseInfo() // Refresh the info
        onSetupComplete?.()
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to set database path. Please check the path and permissions.")
      }
    } catch (error) {
      console.error("Database setup error:", error)
      setStatus("error")
      setMessage("Failed to connect to server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database/backup", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(`Backup created successfully at: ${data.data.backupPath}`)
      } else {
        setStatus("error")
        setMessage(data.error || "Backup failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Failed to create backup")
    } finally {
      setIsLoading(false)
    }
  }

  const getRecommendedPaths = () => {
    const platform = navigator.platform.toLowerCase()
    if (platform.includes("win")) {
      return [
        "C:\\Users\\Public\\Documents\\EmployeeManagement",
        "C:\\EmployeeManagement",
        "D:\\EmployeeManagement",
      ]
    } else if (platform.includes("mac")) {
      return [
        "/Users/Shared/EmployeeManagement",
        "/Applications/EmployeeManagement",
        "/tmp/EmployeeManagement",
      ]
    } else {
      return [
        "/home/shared/EmployeeManagement", 
        "/opt/EmployeeManagement", 
        "/tmp/EmployeeManagement"
      ]
    }
  }

  const handleQuickSetPath = (path: string) => {
    setCustomPath(path)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Database className="h-12 w-12 mx-auto text-blue-600" />
        <h1 className="text-3xl font-bold">Database Configuration</h1>
        <p className="text-muted-foreground">Configure where your employee management data will be stored locally</p>
      </div>

      {/* Current Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Database Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Database Location:</Label>
            <Badge variant="outline" className="font-mono text-xs">
              {currentPath || "Not configured"}
            </Badge>
          </div>

          {dbStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dbStats.employees}</div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dbStats.attendance}</div>
                <div className="text-sm text-muted-foreground">Attendance Records</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dbStats.credits}</div>
                <div className="text-sm text-muted-foreground">Credits</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dbStats.tasks}</div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Location Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Set Database Location
          </CardTitle>
          <CardDescription>
            Choose where you want to store your employee management database on your local system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="database-path">Database Path</Label>
            <div className="flex gap-2">
              <Input
                id="database-path"
                placeholder="Enter full path (e.g., C:\MyCompany\EmployeeDB or /home/user/EmployeeDB)"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleSetDatabasePath} disabled={isLoading || !customPath.trim()} className="shrink-0">
                <Settings className="h-4 w-4 mr-2" />
                {isLoading ? "Setting..." : "Set Path"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              If you enter a directory path, we'll automatically add the database filename. 
              Make sure you have write permissions to the selected location.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Recommended Paths:</Label>
            <div className="grid gap-2">
              {getRecommendedPaths().map((path, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSetPath(path)}
                  className="justify-start font-mono text-xs"
                >
                  <HardDrive className="h-3 w-3 mr-2" />
                  {path}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click on a recommended path to use it, then click "Set Path" to apply.
            </p>
          </div>

          {status !== "idle" && (
            <Alert className={status === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {status === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={status === "success" ? "text-green-800" : "text-red-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>Backup and manage your database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleBackup} disabled={isLoading} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Restore Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center">
        <Button onClick={onSetupComplete} size="lg">
          Continue to Application
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import DatabaseSetup from "@/components/database-setup"

export default function DatabaseSetupPage() {
  const router = useRouter()

  const handleSetupComplete = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <DatabaseSetup onSetupComplete={handleSetupComplete} />
    </div>
  )
}

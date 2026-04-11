"use client"

import { useRouter } from "next/navigation"
import DatabaseSetup from "@/components/database-setup"

export default function DatabaseSetupPage() {
  const router = useRouter()

  const handleSetupComplete = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background py-4 md:py-6">
      <DatabaseSetup onSetupComplete={handleSetupComplete} />
    </div>
  )
}

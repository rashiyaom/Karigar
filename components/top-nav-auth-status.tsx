"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"

type AuthUser = {
  id: string
  username: string
  role: "admin" | "user"
}

export function TopNavAuthStatus() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const shouldRender = useMemo(() => {
    if (!pathname) {
      return false
    }

    if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/admin")) {
      return false
    }

    return true
  }, [pathname])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    let isMounted = true

    const fetchMe = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const result = await response.json()

        if (!isMounted) {
          return
        }

        if (response.ok && result?.success) {
          setUser(result.user)
        } else {
          setUser(null)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchMe()

    return () => {
      isMounted = false
    }
  }, [shouldRender, pathname])

  const onLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.replace("/login")
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!shouldRender) {
    return null
  }

  if (isLoading) {
    return (
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-end px-4 text-xs text-muted-foreground">
          Checking session...
        </div>
      </div>
    )
  }

  if (!user || user.role !== "user") {
    return null
  }

  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BrandMark size="xs" />
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="font-medium text-foreground">{user.username}</span>
          <span>Signed in</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
}

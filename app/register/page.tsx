"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Layers3, LockKeyhole, Sparkles, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success) {
        setError(result?.error || "Registration failed.")
        return
      }

      router.replace("/dashboard")
    } catch {
      setError("Unable to create account right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ecfeff_0,#f8fafc_38%,#e2e8f0_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_right,#0b1120_0,#020617_45%,#111827_100%)] md:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-border/60 bg-background/85 shadow-2xl backdrop-blur md:grid-cols-2">
        <section className="relative hidden min-h-[580px] overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white md:flex md:flex-col md:justify-between">
          <div className="auth-float absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="auth-float absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" style={{ animationDelay: "0.6s" }} />
          <div className="auth-enter-fade relative space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Create Workspace
            </p>
            <h1 className="auth-enter-up text-4xl font-semibold leading-tight" style={{ animationDelay: "90ms" }}>
              Set up your Karigar account in under a minute.
            </h1>
            <p className="max-w-md text-sm text-white/90">
              Each account has isolated attendance, credit, task, and report data tied to your session.
            </p>
            <div className="auth-enter-up inline-flex w-fit items-center gap-3 rounded-2xl border border-white/30 bg-white/10 px-4 py-3" style={{ animationDelay: "170ms" }}>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 font-semibold tracking-wide text-white">KG</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/75">Brand Mark</p>
                <p className="flex items-center gap-1 text-sm font-medium">
                  Karigar OS <Star className="h-3.5 w-3.5" />
                </p>
              </div>
            </div>
          </div>
          <div className="relative grid gap-3">
            <div className="auth-enter-up flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 p-3 text-sm" style={{ animationDelay: "230ms" }}>
              <Layers3 className="h-4 w-4" /> Private workspace per account owner
            </div>
            <div className="auth-enter-up flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 p-3 text-sm" style={{ animationDelay: "290ms" }}>
              <LockKeyhole className="h-4 w-4" /> Role and session based access control
            </div>
          </div>
        </section>

        <section className="flex min-h-[580px] items-center bg-background/95 p-5 sm:p-8">
          <Card className="w-full border-border/60 shadow-none sm:shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Start your isolated workspace with secure login credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="username">
                    Username
                  </label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    autoComplete="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    autoComplete="new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Already registered?{" "}
                <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  )
}

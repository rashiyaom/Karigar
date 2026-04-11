"use client"

import { FormEvent, Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Sparkles, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath = useMemo(() => {
    const next = searchParams.get("next")
    if (!next || !next.startsWith("/")) {
      return "/dashboard"
    }
    return next
  }, [searchParams])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success) {
        setError(result?.error || "Login failed.")
        return
      }

      const role = result?.user?.role
      if (role === "admin") {
        router.replace("/admin/users")
        return
      }

      if (nextPath.startsWith("/admin")) {
        router.replace("/dashboard")
        return
      }

      router.replace(nextPath)
    } catch {
      setError("Unable to sign in right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,104,64,0.22),transparent_40%),radial-gradient(circle_at_75%_68%,rgba(255,104,64,0.12),transparent_34%),linear-gradient(180deg,#07090d_0%,#06080c_58%,#0a0f17_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,96,54,0.42)_0%,rgba(202,70,33,0.18)_42%,rgba(15,19,27,0.05)_72%,transparent_100%)] blur-[1px] md:h-[540px] md:w-[540px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-white/90">
            <Star className="h-4 w-4 text-[#ff6a45]" />
            Karigar Network
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 transition hover:border-white/25 hover:text-white"
            >
              Register
            </Link>
            <span className="rounded-md border border-[#ff6a45]/40 bg-[#ff6a45]/15 px-3 py-1.5 text-xs font-medium text-[#ffb39d]">
              Login
            </span>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-[#ff7f5f]" /> Workforce OS Preview
            </p>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Next level of <span className="text-[#ff6a45]">attendance</span>, <span className="text-[#ff6a45]">tasks</span>, and payroll operations.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Karigar centralizes employee records, attendance, credits, task workflows, and analytics into one secured workspace for daily operations.
            </p>

            <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { value: "99.9%", label: "Data uptime" },
                { value: "1 dashboard", label: "Unified ops" },
                { value: "Role-aware", label: "Access model" },
                { value: "Audit-ready", label: "History trail" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur">
                  <p className="text-lg font-semibold text-[#ff9e85]">{item.value}</p>
                  <p className="text-xs text-white/60">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Constant Monitoring",
                  desc: "Track attendance, tasks, and credits in real time.",
                },
                {
                  title: "AI-based Detection",
                  desc: "Spot delays, missing actions, and credit risk early.",
                },
                {
                  title: "Automatic Triage",
                  desc: "Prioritize what requires immediate manager action.",
                },
              ].map((card, index) => (
                <article
                  key={card.title}
                  className="group rounded-2xl border border-white/10 bg-[#0c1017]/80 p-4 transition hover:-translate-y-1 hover:border-[#ff6a45]/45 hover:bg-[#0f141d]"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className="mb-3 h-24 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,106,69,0.24),rgba(255,255,255,0.02)_52%,transparent_72%)]" />
                  <h2 className="text-sm font-semibold text-white/90">{card.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{card.desc}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative">
            <div className="sticky top-6 rounded-2xl border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_80px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-6">
              <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
              <p className="mt-1 text-sm text-white/55">Sign in to continue to your Karigar workspace.</p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80" htmlFor="username">
                    Username
                  </label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    required
                    className="border-white/10 bg-black/35 text-white placeholder:text-white/35 focus-visible:ring-[#ff6a45]/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="border-white/10 bg-black/35 text-white placeholder:text-white/35 focus-visible:ring-[#ff6a45]/40"
                  />
                </div>

                {error ? <p className="text-sm text-[#ff8b6e]">{error}</p> : null}

                <Button
                  className="w-full border border-[#ff8a68]/40 bg-gradient-to-r from-[#ff6a45] to-[#ff7f5f] text-white hover:from-[#ff7a58] hover:to-[#ff967a]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-white/55">
                New account?{" "}
                <Link className="font-medium text-[#ff9f85] transition hover:text-[#ffc2b1]" href="/register">
                  Register here
                </Link>
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#07090d]" />}>
      <LoginForm />
    </Suspense>
  )
}

"use client"

import { FormEvent, Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle2, Users, BarChart3, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import Image from "next/image"

// Lightweight social proof data
const testimonials = [
  { quote: "Payroll used to take 3 days. Now we close it in an afternoon.", author: "Priya M.", role: "Operations Head" },
  { quote: "Attendance disputes dropped to near zero. Everyone trusts the record.", author: "Rahul K.", role: "Factory Manager" },
  { quote: "The analytics view alone saved us hours every month.", author: "Anita S.", role: "HR Lead" },
]

const highlights = [
  { icon: Users, label: "Workforce Records", desc: "Central employee & attendance hub" },
  { icon: CheckCircle2, label: "Task Workflows", desc: "Assign, track, and close with accountability" },
  { icon: BarChart3, label: "Payroll Analytics", desc: "Close cycles faster with clear data" },
  { icon: Clock, label: "Real-time Signals", desc: "Attendance and status updates live" },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success) {
        setError(result?.error || "Login failed.")
        return
      }

      // CSRF token is now set via Set-Cookie by the server on login.
      // No need to store it in sessionStorage.

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
    <main className="relative min-h-screen overflow-hidden flex" style={{ background: "#060709" }}>

      {/* ── Left panel — branding + product preview ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "55%",
          background: "linear-gradient(145deg, #080b10 0%, #0d1118 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "70%",
            height: "60%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,85,51,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "0",
            right: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,85,51,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top bar — logo */}
        <div className="relative z-10 p-8">
          <Link href="/landing.html" className="inline-flex items-center gap-2.5 no-underline">
            <BrandMark size="sm" showName nameClassName="text-white/90 font-semibold text-lg" />
          </Link>
        </div>

        {/* Center — hero image + overlay text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-6">
          <div className="mb-8">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#ff8866", letterSpacing: "0.14em" }}
            >
              Workforce OS
            </p>
            <h1
              className="font-bold leading-tight mb-4"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(28px, 3vw, 44px)",
                letterSpacing: "-0.03em",
                color: "#eef0f5",
              }}
            >
              One workspace for<br />
              every operation
            </h1>
            <p style={{ fontSize: "15px", color: "rgba(238,240,245,0.6)", lineHeight: "1.7", maxWidth: "440px" }}>
              Karigar centralises attendance, tasks, credits, and analytics — so your team spends less time coordinating and more time executing.
            </p>
          </div>

          {/* Dashboard screenshot */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,85,51,0.1)",
              maxHeight: "320px",
            }}
          >
            <Image
              src="/images/feature-analytics.png"
              alt="Karigar analytics dashboard preview"
              width={800}
              height={500}
              className="w-full object-cover object-top"
              style={{ maxHeight: "320px" }}
              priority
            />
            {/* Bottom fade */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(8,11,16,1) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(238,240,245,0.65)",
                  padding: "6px 12px",
                  borderRadius: "999px",
                }}
              >
                <Icon className="w-3 h-3" style={{ color: "#ff7755" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — rotating testimonial */}
        <div
          className="relative z-10 m-6 p-5 rounded-2xl"
          style={{
            border: "1px solid rgba(255,85,51,0.2)",
            background: "rgba(255,85,51,0.05)",
          }}
        >
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "rgba(238,240,245,0.75)", fontStyle: "italic" }}
          >
            "{testimonials[activeTestimonial].quote}"
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-semibold" style={{ color: "#eef0f5" }}>
                {testimonials[activeTestimonial].author}
              </span>
              <span className="text-xs" style={{ color: "rgba(238,240,245,0.45)" }}>
                {testimonials[activeTestimonial].role}
              </span>
            </div>
            {/* Dot nav */}
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Testimonial ${i + 1}`}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    background: i === activeTestimonial ? "#ff5533" : "rgba(255,255,255,0.2)",
                    width: i === activeTestimonial ? "20px" : "6px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-6 py-12"
        style={{ minHeight: "100vh" }}
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8">
          <Link href="/landing.html">
            <BrandMark size="sm" showName nameClassName="text-white/90 font-semibold text-lg" />
          </Link>
        </div>

        <div className="w-full" style={{ maxWidth: "400px" }}>
          {/* Form header */}
          <div className="mb-8">
            <h2
              className="font-bold mb-2"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "28px",
                letterSpacing: "-0.03em",
                color: "#eef0f5",
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(238,240,245,0.5)" }}>
              Sign in with your username, mobile number, or email.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-sm font-medium"
                style={{ color: "rgba(238,240,245,0.7)" }}
              >
                Username / Mobile / Email
              </label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username, mobile, or email"
                required
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#eef0f5",
                  borderRadius: "12px",
                  height: "46px",
                  fontSize: "14px",
                }}
                className="placeholder:text-white/30 focus-visible:ring-[#ff5533]/40 focus-visible:border-[#ff5533]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: "rgba(238,240,245,0.7)" }}
              >
                Password
              </label>
              <Input
                id="password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#eef0f5",
                  borderRadius: "12px",
                  height: "46px",
                  fontSize: "14px",
                }}
                className="placeholder:text-white/30 focus-visible:ring-[#ff5533]/40 focus-visible:border-[#ff5533]/50"
              />
            </div>

            {error && (
              <div
                className="text-sm rounded-xl px-4 py-3"
                role="alert"
                style={{
                  background: "rgba(255,60,40,0.1)",
                  border: "1px solid rgba(255,60,40,0.25)",
                  color: "#ff9985",
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-semibold"
              style={{
                height: "46px",
                borderRadius: "12px",
                fontSize: "15px",
                background: isSubmitting
                  ? "rgba(255,85,51,0.6)"
                  : "linear-gradient(135deg, #ff6040 0%, #e83a20 100%)",
                boxShadow: isSubmitting ? "none" : "0 4px 20px rgba(255,85,51,0.35)",
                border: "none",
                color: "#fff",
                transition: "all 0.22s ease",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs" style={{ color: "rgba(238,240,245,0.3)" }}>OR</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: "rgba(238,240,245,0.5)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold transition-colors"
              style={{ color: "#ff8866" }}
            >
              Register here
            </Link>
          </p>

          {/* Security note */}
          <div
            className="mt-8 flex items-start gap-3 p-4 rounded-xl"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#60c080" }} />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(238,240,245,0.4)" }}>
              All sessions are protected with HTTP-only cookies, CSRF validation, and rate limiting.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#060709" }} />}>
      <LoginForm />
    </Suspense>
  )
}

"use client"

import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Sparkles, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const heroMetrics = [
  { target: 1, suffix: " min", label: "Quick setup" },
  { target: 3, suffix: " roles", label: "Access model" },
  { target: 100, suffix: "%", label: "Audit traceability" },
  { target: 256, suffix: "-bit", label: "Secure API" },
]

const featureCards = [
  { title: "Constant monitoring", desc: "Run attendance, credits, and tasks from one workspace." },
  { title: "AI-based detection", desc: "Get proactive operational visibility with faster decisions." },
  { title: "Automatic triage", desc: "Prioritize actions by urgency without losing context." },
]

export default function RegisterPage() {
  const router = useRouter()
  const formPanelRef = useRef<HTMLDivElement | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyLogoUrl, setCompanyLogoUrl] = useState("")
  const [workingStart, setWorkingStart] = useState("09:00")
  const [workingEnd, setWorkingEnd] = useState("17:00")
  const [leaveDeductionType, setLeaveDeductionType] = useState<"percentage" | "fixed">("percentage")
  const [leaveDeductionValue, setLeaveDeductionValue] = useState(10)
  const [backupFrequency, setBackupFrequency] = useState("daily")
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [weekendDays, setWeekendDays] = useState<string[]>(["saturday", "sunday"])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metricCounts, setMetricCounts] = useState<number[]>(heroMetrics.map(() => 0))
  const [cardTilts, setCardTilts] = useState<Record<number, { rotateX: number; rotateY: number }>>({})
  const [scrollProgress, setScrollProgress] = useState(0)

  const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const completionSignals = [
    username.trim().length >= 3,
    password.length >= 8,
    confirmPassword.length > 0 && confirmPassword === password,
    organizationName.trim().length > 0,
    companyEmail.trim().includes("@"),
    companyPhone.trim().length >= 8,
    companyAddress.trim().length > 0,
    Boolean(workingStart),
    Boolean(workingEnd),
    weekendDays.length > 0,
    leaveDeductionValue > 0,
    Boolean(backupFrequency),
  ]
  const completedSignals = completionSignals.filter(Boolean).length
  const formCompletion = Math.round((completedSignals / completionSignals.length) * 100)
  const setupProgress = Math.round(formCompletion * 0.65 + scrollProgress * 0.35)

  useEffect(() => {
    const duration = 1450
    const start = performance.now()
    let frameId = 0

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)

      setMetricCounts(heroMetrics.map((metric) => Math.round(metric.target * progress)))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const updateScrollProgress = () => {
      if (!formPanelRef.current) return

      const rect = formPanelRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const track = rect.height + viewportHeight
      const traveled = viewportHeight - rect.top
      const progress = Math.min(100, Math.max(0, (traveled / track) * 100))

      setScrollProgress(progress)
    }

    updateScrollProgress()
    window.addEventListener("scroll", updateScrollProgress, { passive: true })
    window.addEventListener("resize", updateScrollProgress)

    return () => {
      window.removeEventListener("scroll", updateScrollProgress)
      window.removeEventListener("resize", updateScrollProgress)
    }
  }, [])

  const toggleWeekendDay = (day: string) => {
    setWeekendDays((prev) =>
      prev.includes(day) ? prev.filter((existingDay) => existingDay !== day) : [...prev, day]
    )
  }

  const handleFeatureMouseMove = (index: number, event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 12
    const rotateX = (0.5 - y) * 10

    setCardTilts((prev) => ({ ...prev, [index]: { rotateX, rotateY } }))
  }

  const handleFeatureMouseLeave = (index: number) => {
    setCardTilts((prev) => ({ ...prev, [index]: { rotateX: 0, rotateY: 0 } }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!organizationName.trim()) {
      setError("Organization name is required.")
      return
    }

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
        body: JSON.stringify({
          username,
          password,
          settings: {
            organizationName: organizationName.trim(),
            companyLogoUrl: companyLogoUrl.trim() || undefined,
            companyEmail: companyEmail.trim() || undefined,
            companyPhone: companyPhone.trim() || undefined,
            companyAddress: companyAddress.trim() || undefined,
            workingHours: {
              start: workingStart,
              end: workingEnd,
            },
            weekendDays,
            leaveDeduction: {
              type: leaveDeductionType,
              value: leaveDeductionValue,
            },
            autoMarkAbsent,
            emailNotifications,
            backupFrequency,
          },
        }),
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
    <main className="relative min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_26%_16%,rgba(255,98,63,0.24),transparent_36%),radial-gradient(circle_at_76%_76%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(180deg,#06080d_0%,#05070b_55%,#090f18_100%)]" />
      <div className="pointer-events-none absolute left-[28%] top-[11%] h-[360px] w-[360px] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,95,55,0.36)_0%,rgba(255,95,55,0.1)_42%,rgba(255,255,255,0.02)_66%,transparent_100%)] blur-[1px] md:h-[520px] md:w-[520px]" />
      <div className="pointer-events-none absolute left-[6%] top-10 hidden h-[420px] w-[420px] rounded-full border border-white/5 md:block" />
      <div className="pointer-events-none absolute right-[4%] top-20 hidden h-[390px] w-[390px] rounded-full border border-white/5 lg:block" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide text-white/90">
            <Star className="h-4 w-4 text-[#ff6f4a]" />
            Karigar Network
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-[#ff6f4a]/50 bg-[#ff6f4a]/15 px-3 py-1.5 text-xs font-medium text-[#ffb39f]">
              Register
            </span>
            <Link
              href="/login"
              className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 transition hover:border-white/25 hover:text-white"
            >
              Login
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div className="space-y-7 lg:sticky lg:top-8 lg:self-start">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-[#ff8968]" /> Create Workspace
              </p>
              <span className="rounded-full border border-[#ff6f4a]/40 bg-[#ff6f4a]/10 px-3 py-1 text-xs text-[#ffc3b2]">01 Onboarding</span>
            </div>

            <div className="pointer-events-none relative mx-auto hidden h-56 w-56 lg:block">
              <div className="hero-ring-spin absolute inset-0 rounded-full border border-white/20" />
              <div className="hero-ring-spin absolute inset-4 rounded-full border border-[#ff6f4a]/45" style={{ animationDuration: "18s", animationDirection: "reverse" }} />
              <div className="hero-ring-spin absolute inset-9 rounded-full border border-[#ffb09a]/35" style={{ animationDuration: "22s" }} />
              <div className="hero-orb-pulse absolute inset-[26%] rounded-full border border-[#ff8c6d]/40 bg-[radial-gradient(circle,#ff7b57_0%,#ff6440_52%,#19120f_100%)] shadow-[0_0_70px_rgba(255,108,73,0.45)]" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">Karigar</p>
                  <p className="text-sm font-semibold text-[#ffd3c6]">Workspace OS</p>
                </div>
              </div>
            </div>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
              Build your <span className="text-[#ff6f4a]">Karigar workspace</span> with complete ops settings in one setup flow.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Configure company profile, work hours, leave policy, weekend rules, backup cadence, and notification controls before your team starts using the dashboard.
            </p>

            <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {heroMetrics.map((item, index) => (
                <div
                  key={item.label}
                  className="counter-float rounded-xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <p className="text-base font-semibold text-[#ffb39f] sm:text-lg">{metricCounts[index]}{item.suffix}</p>
                  <p className="text-xs text-white/60">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map((feature, idx) => {
                const tilt = cardTilts[idx] || { rotateX: 0, rotateY: 0 }
                return (
                <article
                  key={feature.title}
                  className="tile-float tilt-card rounded-2xl border border-white/10 bg-[#0b1018]/90 p-3 transition hover:border-[#ff6f4a]/45"
                  style={{
                    transitionDelay: `${idx * 70}ms`,
                    animationDelay: `${idx * 140}ms`,
                    transform: `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-3px)`,
                  }}
                  onMouseMove={(event) => handleFeatureMouseMove(idx, event)}
                  onMouseLeave={() => handleFeatureMouseLeave(idx)}
                >
                  <div className="mb-3 h-24 rounded-xl border border-white/10 bg-[#dfe8ea] bg-[radial-gradient(circle_at_20%_20%,rgba(255,111,74,0.24),rgba(11,16,24,0.03)_66%)]" />
                  <h2 className="text-sm font-semibold text-white/90">{feature.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{feature.desc}</p>
                </article>
                )
              })}
            </div>
          </div>

          <aside className="relative">
            <div ref={formPanelRef} className="rounded-2xl border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_80px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-6">
              <h2 className="text-2xl font-semibold text-white">Create Account</h2>
              <p className="mt-1 text-sm text-white/55">Start your isolated workspace with complete operations setup.</p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                  <span>Onboarding Progress</span>
                  <span>{setupProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#ff6f4a] to-[#ffae96] transition-all duration-500" style={{ width: `${setupProgress}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-white/45">Form completion {formCompletion}% + scroll progress {Math.round(scrollProgress)}%</p>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">Access Credentials</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white/80">Username</Label>
                      <Input
                        id="username"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Choose a username"
                        required
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/80">Password</Label>
                      <Input
                        id="password"
                        autoComplete="new-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        required
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        autoComplete="new-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your password"
                        required
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">Organization Profile</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="organizationName" className="text-white/80">Company Name</Label>
                      <Input
                        id="organizationName"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        placeholder="Enter company name"
                        required
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail" className="text-white/80">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(event) => setCompanyEmail(event.target.value)}
                        placeholder="company@example.com"
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone" className="text-white/80">Company Phone</Label>
                      <Input
                        id="companyPhone"
                        value={companyPhone}
                        onChange={(event) => setCompanyPhone(event.target.value)}
                        placeholder="+91 98765 43210"
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="companyLogoUrl" className="text-white/80">Company Logo URL</Label>
                      <Input
                        id="companyLogoUrl"
                        type="url"
                        value={companyLogoUrl}
                        onChange={(event) => setCompanyLogoUrl(event.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="companyAddress" className="text-white/80">Company Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(event) => setCompanyAddress(event.target.value)}
                        placeholder="Enter company address"
                        rows={3}
                        className="border-white/10 bg-black/35 text-white placeholder:text-white/35"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">Work Rules & Automation</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="workingStart" className="text-white/80">Work Hours Start</Label>
                      <Input
                        id="workingStart"
                        type="time"
                        value={workingStart}
                        onChange={(event) => setWorkingStart(event.target.value)}
                        className="border-white/10 bg-black/35 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingEnd" className="text-white/80">Work Hours End</Label>
                      <Input
                        id="workingEnd"
                        type="time"
                        value={workingEnd}
                        onChange={(event) => setWorkingEnd(event.target.value)}
                        className="border-white/10 bg-black/35 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80">Leave Deduction Type</Label>
                      <Select value={leaveDeductionType} onValueChange={(value: "percentage" | "fixed") => setLeaveDeductionType(value)}>
                        <SelectTrigger className="border-white/10 bg-black/35 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leaveDeductionValue" className="text-white/80">
                        Leave Deduction Value {leaveDeductionType === "percentage" ? "(%)" : "(₹)"}
                      </Label>
                      <Input
                        id="leaveDeductionValue"
                        type="number"
                        min={0}
                        value={leaveDeductionValue}
                        onChange={(event) => setLeaveDeductionValue(Number(event.target.value || 0))}
                        className="border-white/10 bg-black/35 text-white"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-white/80">Weekend Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {dayOptions.map((day) => {
                          const active = weekendDays.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleWeekendDay(day)}
                              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                                active
                                  ? "border-[#ff6f4a]/60 bg-[#ff6f4a]/20 text-[#ffd1c4]"
                                  : "border-white/15 bg-white/[0.03] text-white/65 hover:border-white/25"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80">Backup Frequency</Label>
                      <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                        <SelectTrigger className="border-white/10 bg-black/35 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80">Automation</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAutoMarkAbsent((prev) => !prev)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs transition ${
                            autoMarkAbsent
                              ? "border-[#ff6f4a]/60 bg-[#ff6f4a]/20 text-[#ffd1c4]"
                              : "border-white/15 bg-white/[0.03] text-white/65"
                          }`}
                        >
                          Auto Mark Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailNotifications((prev) => !prev)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-xs transition ${
                            emailNotifications
                              ? "border-[#ff6f4a]/60 bg-[#ff6f4a]/20 text-[#ffd1c4]"
                              : "border-white/15 bg-white/[0.03] text-white/65"
                          }`}
                        >
                          Email Notifications
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {error ? <p className="text-sm text-[#ff8b6e]">{error}</p> : null}

                <Button
                  className="w-full border border-[#ff8a6b]/45 bg-gradient-to-r from-[#ff6f4a] to-[#ff8f61] text-white hover:from-[#ff7f5d] hover:to-[#ffa07e]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-white/55">
                Already registered?{" "}
                <Link className="font-medium text-[#ffc0ad] transition hover:text-[#ffd9cc]" href="/login">
                  Sign in
                </Link>
              </p>
            </div>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        @keyframes heroRingSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes heroOrbPulse {
          0%,
          100% {
            transform: scale(1);
            filter: saturate(0.95);
          }
          50% {
            transform: scale(1.07);
            filter: saturate(1.2);
          }
        }

        @keyframes tileFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes counterFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        .hero-ring-spin {
          animation: heroRingSpin 26s linear infinite;
        }

        .hero-orb-pulse {
          animation: heroOrbPulse 4.2s ease-in-out infinite;
        }

        .tile-float {
          animation: tileFloat 5.6s ease-in-out infinite;
        }

        .tilt-card {
          transform-style: preserve-3d;
          will-change: transform;
        }

        .counter-float {
          animation: counterFloat 4.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-ring-spin,
          .hero-orb-pulse,
          .tile-float,
          .counter-float {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  )
}

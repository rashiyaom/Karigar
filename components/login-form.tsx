'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Mail, Lock } from 'lucide-react'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      setSuccessMessage(`Welcome back, ${data.user.username}!`)
      
      // Redirect to dashboard immediately
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animation-delay-4000"></div>
        
        {/* Flowing lines accent */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 600">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path
            d="M 0 300 Q 300 100 600 300 T 1200 300"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <path
            d="M 0 100 Q 300 300 600 100 T 1200 100"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            className="animation-delay-2000"
          />
        </svg>
      </div>

      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6 md:max-w-lg lg:max-w-xl">
        {/* Card with premium styling */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

          {/* Content */}
          <div className="relative z-20 p-6 sm:p-8 md:p-12">
            {/* Header with logo area */}
            <div className="text-center mb-8 md:mb-10">
              {/* Icon container */}
              <div className="flex justify-center mb-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl blur-lg opacity-75"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                    <span className="text-2xl sm:text-3xl font-bold text-white">K</span>
                  </div>
                </div>
              </div>

              {/* Title and subtitle */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                Karigar
              </h1>
              <p className="text-gray-300 text-sm md:text-base font-light">
                Log in to access your company workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-900/20 backdrop-blur">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300 ml-2">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {successMessage && (
                <Alert className="border-green-500/50 bg-green-900/20 backdrop-blur">
                  <AlertDescription className="text-green-300 font-medium">{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Username/Email Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm md:text-base font-medium text-gray-200">
                  Username
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="omkar"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 md:h-13 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20 transition-all rounded-lg"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm md:text-base font-medium text-gray-200">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 md:h-13 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20 transition-all rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Remember me checkbox - Optional */}
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500/20 bg-white/10 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-300 group-hover:text-gray-200 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-12 md:h-13 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 hover:shadow-2xl mt-2 md:mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </div>
              </Button>

              {/* Demo credentials info */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Demo Credentials</p>
                <div className="space-y-2 bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-white/10 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-300">Username:</span>
                    <code className="text-xs md:text-sm font-mono font-bold text-purple-300 bg-white/10 px-2 md:px-3 py-1 rounded border border-purple-500/30">omkar</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-gray-300">Password:</span>
                    <code className="text-xs md:text-sm font-mono font-bold text-purple-300 bg-white/10 px-2 md:px-3 py-1 rounded border border-purple-500/30">omkar@123</code>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-xs md:text-sm text-gray-400">
            © 2026 Karigar. All rights reserved.
          </p>
        </div>
      </div>

      {/* Mobile safe area adjustment */}
      <style jsx>{`
        @media (max-height: 600px) {
          .min-h-screen {
            min-height: auto;
            padding: 20px 0;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const router = useRouter()

  // Get CSRF token from cookies on component mount
  useEffect(() => {
    const getCsrfTokenFromCookie = async () => {
      try {
        // The CSRF token is set as an HTTP-only cookie by the server
        // We'll get it from the login response, not directly from cookies
        setCsrfToken('') // Initialize empty, will be set after login
      } catch (err) {
        console.error('Failed to setup CSRF protection')
      }
    }
    getCsrfTokenFromCookie()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'x-csrf-token': csrfToken }),
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Include cookies in request
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      
      // Store CSRF token for future requests
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken)
        // Store in sessionStorage for use in other forms
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('csrf-token', data.csrfToken)
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Animated background with subtle gradients */}
      <div className="absolute inset-0">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        {/* Subtle animated orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl opacity-40 animation-delay-2000"></div>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] login-grid-pattern"
        ></div>
      </div>

      {/* Login container */}
      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Main card - compact and elegant */}
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 shadow-2xl overflow-hidden">
          {/* Subtle top accent line */}
          <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600"></div>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Logo - Karigar official logo */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/images/karigar-logo.svg"
                  alt="Karigar Logo"
                  width={48}
                  height={48}
                  priority
                  className="rounded-lg shadow-lg"
                />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-1">Karigar</h1>
              <p className="text-sm text-gray-400">Sign in to your workspace</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-900/20 border border-red-900/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="omkar"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 w-full h-10 bg-gray-900/50 border border-gray-800 text-white placeholder-gray-600 rounded-lg focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 focus:bg-gray-900 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10 w-full h-10 bg-gray-900/50 border border-gray-800 text-white placeholder-gray-600 rounded-lg focus:border-purple-600 focus:ring-1 focus:ring-purple-600/50 focus:bg-gray-900 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & forgot password */}
              <div className="flex items-center justify-between text-sm py-2">
                <label className="flex items-center cursor-pointer text-gray-400 hover:text-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-purple-600 cursor-pointer"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot?
                </a>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-600/50 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo credentials - compact */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Demo Credentials</p>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Username:</span>
                  <code className="text-purple-400 font-mono bg-gray-950 px-2 py-1 rounded border border-gray-800">omkar</code>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Password:</span>
                  <code className="text-purple-400 font-mono bg-gray-950 px-2 py-1 rounded border border-gray-800">omkar@123</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600">© 2026 Karigar. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

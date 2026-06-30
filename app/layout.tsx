import type React from "react"
import { Inter, Poppins, Syne } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/query-provider"
import { AttendanceAutoReset } from "@/components/attendance-auto-reset"
import { ErrorBoundary } from "@/components/error-boundary"
import { TopNavAuthStatus } from "@/components/top-nav-auth-status"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
})

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  weight: ["500", "600", "700", "800"],
})

export const metadata = {
  title: "Karigar - Employee Management System",
  description: "A comprehensive employee management system with attendance, credits, and task management.",
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/images/karigar-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/karigar-logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${syne.variable} antialiased dark`} suppressHydrationWarning>
      <body className="font-sans">
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <LanguageProvider>
              <QueryProvider>
                <AttendanceAutoReset />
                <TopNavAuthStatus />
                {children}
                <Toaster />
              </QueryProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

import type React from "react"
import { Inter, Poppins } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/components/query-provider"
import { AttendanceAutoReset } from "@/components/attendance-auto-reset"
import { ErrorBoundary } from "@/components/error-boundary"
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

export const metadata = {
  title: "Karigar - Employee Management System",
  description: "A comprehensive employee management system with attendance, credits, and task management.",
  icons: {
    icon: "/images/karigar-logo.svg",
  },
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} antialiased dark`} suppressHydrationWarning>
      <body className="font-sans">
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <LanguageProvider>
              <QueryProvider>
                <AttendanceAutoReset />
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

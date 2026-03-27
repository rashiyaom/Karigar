import { redirect } from 'next/navigation'
import { getCurrentUser, getAuthToken, logoutUser, clearAuthCookie } from '@/lib/auth'
import { Dashboard } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

async function LogoutButton() {
  const handleLogout = async () => {
    'use server'
    const token = (await getAuthToken())
    if (token) {
      await logoutUser(token)
    }
    await clearAuthCookie()
    redirect('/login')
  }

  return (
    <form action={handleLogout} className="ml-auto">
      <Button variant="outline" size="sm" type="submit">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </form>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Karigar</h1>
          <p className="text-sm text-gray-600">Welcome, {user.username}</p>
        </div>
        <LogoutButton />
      </div>
      <div className="flex-1">
        <Dashboard />
      </div>
    </div>
  )
}

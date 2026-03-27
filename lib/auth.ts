import { cookies } from 'next/headers'
import { UserModel, SessionModel } from './mongodb-models'
import { connectToDatabase } from './mongodb'
import crypto from 'crypto'

const HARDCODED_USERNAME = 'omkar'
const HARDCODED_PASSWORD = 'omkar@123'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
const COOKIE_NAME = 'auth-token'

export interface AuthUser {
  id: string
  username: string
}

// Generate a secure token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Login user
export async function loginUser(username: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
  try {
    await connectToDatabase()

    // Validate hardcoded credentials
    if (username !== HARDCODED_USERNAME || password !== HARDCODED_PASSWORD) {
      return null
    }

    // Find or create user in database
    let user = await UserModel.findOne({ username: HARDCODED_USERNAME.toLowerCase() })

    if (!user) {
      user = await UserModel.create({
        username: HARDCODED_USERNAME.toLowerCase(),
        password: HARDCODED_PASSWORD, // In production, hash this with bcrypt
      })
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    await SessionModel.create({
      userId: user._id.toString(),
      token,
      expiresAt,
    })

    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

// Verify token
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    await connectToDatabase()

    const session = await SessionModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).populate('userId')

    if (!session) {
      return null
    }

    const user = await UserModel.findById(session.userId)
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      username: user.username,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Get current user from cookies
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await verifyToken(token)
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Logout user
export async function logoutUser(token: string): Promise<void> {
  try {
    await connectToDatabase()
    await SessionModel.deleteOne({ token })
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  })
}

// Clear auth cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Get auth token from cookies
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value || null
  } catch (error) {
    console.error('Get auth token error:', error)
    return null
  }
}

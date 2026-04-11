import { cookies } from 'next/headers'
import { UserModel, SessionModel } from './mongodb-models'
import { connectToDatabase } from './mongodb'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

// Get credentials from environment variables
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'omkar'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'omkar@123'
const DEMO_PASSWORD_HASH = process.env.DEMO_PASSWORD_HASH as string
const SESSION_DURATION = (parseInt(process.env.SESSION_EXPIRY_HOURS || '24') * 60 * 60 * 1000) // Default 24 hours
const COOKIE_NAME = 'auth-token'

export interface AuthUser {
  id: string
  username: string
}

// Generate a secure token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Login user with bcrypt password verification
export async function loginUser(username: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
  try {
    await connectToDatabase()

    // Validate credentials against environment configuration
    if (username !== DEMO_USERNAME) {
      return null
    }

    // Use hash verification when configured; otherwise use demo password fallback.
    const passwordMatch = DEMO_PASSWORD_HASH
      ? await bcrypt.compare(password, DEMO_PASSWORD_HASH)
      : password === DEMO_PASSWORD
    if (!passwordMatch) {
      return null
    }

    // Find or create user in database
    let user = await UserModel.findOne({ username: DEMO_USERNAME.toLowerCase() })

    if (!user) {
      user = await UserModel.create({
        username: DEMO_USERNAME.toLowerCase(),
        password: DEMO_PASSWORD_HASH || (await bcrypt.hash(DEMO_PASSWORD, 10)),
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

// Set auth cookie with secure flags
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
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

// Regenerate session on login (prevent session fixation attacks)
export async function regenerateSession(oldToken: string): Promise<string> {
  try {
    await connectToDatabase()

    // Delete old session
    if (oldToken) {
      await SessionModel.deleteOne({ token: oldToken })
    }

    // Create new session with fresh token
    const newToken = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    await SessionModel.create({
      token: newToken,
      user: {
        username: DEMO_USERNAME,
        id: 'demo-user',
      },
      createdAt: new Date(),
      expiresAt,
    })

    return newToken
  } catch (error) {
    console.error('Session regeneration error:', error)
    throw error
  }
}

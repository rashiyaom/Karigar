import { cookies } from 'next/headers'
import { UserModel, SessionModel } from './mongodb-models'
import { connectToDatabase } from './mongodb'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const MAIN_ADMIN_USERNAME = (process.env.MAIN_ADMIN_USERNAME || process.env.DEMO_USERNAME || 'admin').toLowerCase()
const MAIN_ADMIN_PASSWORD = process.env.MAIN_ADMIN_PASSWORD || process.env.DEMO_PASSWORD || 'admin@123'
const MAIN_ADMIN_PASSWORD_HASH = process.env.MAIN_ADMIN_PASSWORD_HASH
const SESSION_DURATION = (parseInt(process.env.SESSION_EXPIRY_HOURS || '24') * 60 * 60 * 1000) // Default 24 hours
const COOKIE_NAME = 'auth-token'

export interface AuthUser {
  id: string
  username: string
  role: 'admin' | 'user'
}

// Generate a secure token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

async function ensureMainAdminAccount() {
  const existingAdmin = await UserModel.findOne({ username: MAIN_ADMIN_USERNAME })
  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin'
      await existingAdmin.save()
    }
    return existingAdmin
  }

  const passwordHash = MAIN_ADMIN_PASSWORD_HASH
    ? MAIN_ADMIN_PASSWORD_HASH
    : await bcrypt.hash(MAIN_ADMIN_PASSWORD, 10)

  return UserModel.create({
    username: MAIN_ADMIN_USERNAME,
    password: passwordHash,
    role: 'admin',
  })
}

// Login user with bcrypt password verification
export async function loginUser(username: string, password: string): Promise<{ token: string; user: AuthUser } | null> {
  try {
    await connectToDatabase()
    await ensureMainAdminAccount()

    const normalizedUsername = username.trim().toLowerCase()
    if (!normalizedUsername || !password) {
      return null
    }

    const user = await UserModel.findOne({ username: normalizedUsername })
    if (!user) {
      return null
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return null
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
        role: user.role,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export async function registerUser(
  username: string,
  password: string
): Promise<{ token: string; user: AuthUser } | null> {
  try {
    await connectToDatabase()
    await ensureMainAdminAccount()

    const normalizedUsername = username.trim().toLowerCase()
    if (!normalizedUsername || password.length < 8) {
      return null
    }

    const existing = await UserModel.findOne({ username: normalizedUsername })
    if (existing) {
      return null
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await UserModel.create({
      username: normalizedUsername,
      password: passwordHash,
      role: 'user',
    })

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
        role: user.role,
      },
    }
  } catch (error) {
    console.error('Registration error:', error)
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
      role: user.role,
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
    await ensureMainAdminAccount()

    // Delete old session
    if (oldToken) {
      await SessionModel.deleteOne({ token: oldToken })
    }

    // Create new session with fresh token
    const newToken = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)
    const adminUser = await UserModel.findOne({ username: MAIN_ADMIN_USERNAME })

    if (!adminUser) {
      throw new Error('Failed to find main admin account')
    }

    await SessionModel.create({
      userId: adminUser._id.toString(),
      token: newToken,
      createdAt: new Date(),
      expiresAt,
    })

    return newToken
  } catch (error) {
    console.error('Session regeneration error:', error)
    throw error
  }
}

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

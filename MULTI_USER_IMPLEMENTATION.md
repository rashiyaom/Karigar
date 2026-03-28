# Multi-User Implementation Guide for Karigar

## Overview
This guide explains how to convert your single-user Karigar system into a full multi-user employee management platform.

---

## Phase 1: Database Schema Updates

### 1. Update User Schema
**File: `lib/mongodb-models.ts`**

```typescript
export interface IUser extends Document {
  username: string
  email: string
  password: string // bcrypt hashed
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true }, // Already bcrypt hashed
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
      index: true 
    },
    department: String,
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    lastLogin: Date,
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

// Add indexes for efficient queries
UserSchema.index({ email: 1, isActive: 1 })
UserSchema.index({ role: 1 })
```

### 2. Update Employee Schema to Track Creator/Owner
**File: `lib/mongodb-models.ts`**

```typescript
export interface IEmployee extends Document {
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  salary: number
  userId: string // Reference to user who created this record
  createdBy: string // User who created
  managedBy?: string // Manager ID if applicable
  companyName: string
  // ... existing fields ...
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    // ... existing fields ...
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    managedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  {
    timestamps: true,
    collection: 'employees',
  }
)
```

### 3. Update Attendance, Credits, Tasks to Be User-Scoped
Similarly update these schemas to include `userId` field:

```typescript
// For Attendance
attendanceSchema.add({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

// For Credits
creditSchema.add({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

// For Tasks
taskSchema.add({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' }
})
```

---

## Phase 2: User Management API

### 1. Create User Management Routes

**File: `app/api/users/route.ts`** - List and Create Users

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UserModel } from '@/lib/mongodb-models'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectToDatabase()
    const users = await UserModel.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { username, email, password, firstName, lastName, role, department } = await request.json()

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await UserModel.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'employee',
      department,
      permissions: getDefaultPermissions(role || 'employee'),
    })

    return NextResponse.json(
      {
        ...newUser.toObject(),
        password: undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: ['users.manage', 'employees.manage', 'attendance.manage', 'credits.manage', 'tasks.manage', 'reports.view'],
    manager: ['employees.view', 'attendance.view', 'credits.view', 'tasks.manage', 'reports.view'],
    employee: ['employees.view', 'attendance.view', 'credits.view', 'tasks.view'],
  }
  return permissions[role] || permissions.employee
}
```

**File: `app/api/users/[id]/route.ts`** - Update and Delete Users

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { UserModel } from '@/lib/mongodb-models'
import { connectToDatabase } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    const targetUser = await UserModel.findById(params.id).select('-password')

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.id !== params.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { firstName, lastName, email, role, department, isActive } = await request.json()

    await connectToDatabase()
    const updated = await UserModel.findByIdAndUpdate(
      params.id,
      {
        firstName,
        lastName,
        email: email?.toLowerCase(),
        role,
        department,
        isActive,
      },
      { new: true }
    ).select('-password')

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectToDatabase()
    await UserModel.findByIdAndUpdate(params.id, { isActive: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
```

---

## Phase 3: Update Authentication

### 1. Update Login to Handle Multiple Users
**File: `app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { UserModel, SessionModel } from '@/lib/mongodb-models'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '@/lib/database'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    await connectToDatabase()

    // Find user by username or email
    const user = await UserModel.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ],
      isActive: true,
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Compare passwords with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create session
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await SessionModel.create({
      userId: user._id,
      token,
      expiresAt,
    })

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 200 }
    )

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
```

---

## Phase 4: Data Isolation

### 1. Update Employee Fetching to Be User-Scoped
**File: `app/api/employees/route.ts`**

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Build query based on user role
    let query: any = {}

    if (user.role === 'admin') {
      // Admin sees all employees
      query = {}
    } else if (user.role === 'manager') {
      // Manager sees their team and their own entries
      query = {
        $or: [
          { createdBy: user.id },
          { managedBy: user.id },
        ]
      }
    } else {
      // Employee only sees their own records
      query = { userId: user.id }
    }

    const employees = await EmployeeModel.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })

    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await request.json()

    await connectToDatabase()
    const employee = await EmployeeModel.create({
      ...data,
      userId: user.id,
      createdBy: user.id,
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
```

### 2. Update Attendance, Credits, Tasks Similarly
Apply the same user-scoping pattern to:
- `app/api/attendance/route.ts`
- `app/api/credits/route.ts`
- `app/api/tasks/route.ts`

---

## Phase 5: UI Components Update

### 1. Create User Registration Page
**File: `app/signup/page.tsx`**

```tsx
import { SignupForm } from '@/components/signup-form'

export const metadata = {
  title: 'Sign Up - Karigar',
  description: 'Create a new account',
}

export default function SignupPage() {
  return <SignupForm />
}
```

### 2. Create User Management Component
**File: `components/user-management.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function UserManagement() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            {/* Add form here */}
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 3. Update Login Form for Multi-User
**File: `components/login-form.tsx`** (Update existing)

The current form already works but you can enhance it to accept email or username.

---

## Phase 6: Authorization & Role-Based Access

### 1. Create Permission Checker Utility
**File: `lib/permissions.ts`**

```typescript
export type Permission = 
  | 'users.manage'
  | 'employees.manage'
  | 'attendance.manage'
  | 'credits.manage'
  | 'tasks.manage'
  | 'reports.view'
  | 'employees.view'
  | 'attendance.view'
  | 'credits.view'
  | 'tasks.view'

export function checkPermission(userPermissions: string[], required: Permission): boolean {
  return userPermissions.includes(required)
}

export function checkAnyPermission(userPermissions: string[], required: Permission[]): boolean {
  return required.some(p => userPermissions.includes(p))
}

export function checkAllPermissions(userPermissions: string[], required: Permission[]): boolean {
  return required.every(p => userPermissions.includes(p))
}
```

### 2. Add Authorization Middleware
**File: `lib/auth-middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function requireRole(request: NextRequest, roles: string[]) {
  const user = await getCurrentUser()
  if (!user || !roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
```

---

## Phase 7: Migration from Single-User

### 1. Create Admin User Seeding Script
**File: `scripts/seed-users.ts`**

```typescript
import { connectToDatabase } from '../lib/database'
import { UserModel } from '../lib/mongodb-models'
import bcrypt from 'bcrypt'

async function seedUsers() {
  await connectToDatabase()

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin@123', 10)
  const adminUser = await UserModel.create({
    username: 'admin',
    email: 'admin@karigar.com',
    password: adminPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    permissions: ['users.manage', 'employees.manage', 'attendance.manage', 'credits.manage', 'tasks.manage', 'reports.view'],
    isActive: true,
  })

  console.log('Admin user created:', adminUser.username)

  // Convert existing 'omkar' to regular user
  const omkarPassword = await bcrypt.hash('omkar@123', 10)
  const omkarUser = await UserModel.create({
    username: 'omkar',
    email: 'omkar@karigar.com',
    password: omkarPassword,
    firstName: 'Omkar',
    lastName: 'Ceramics',
    role: 'manager',
    permissions: ['employees.view', 'attendance.view', 'credits.view', 'tasks.manage', 'reports.view'],
    isActive: true,
  })

  console.log('Omkar user created:', omkarUser.username)
}

seedUsers().catch(console.error)
```

### 2. Update Environment Variables
**File: `.env.local`** - Remove single-user variables, add multi-user config:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Auth
SESSION_EXPIRY_HOURS=24
TOKEN_EXPIRY_DAYS=3
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MINUTES=15

# Encryption
ENCRYPTION_KEY=your_64_char_hex_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Multi-user
ENABLE_USER_REGISTRATION=false
ENABLE_EMAIL_VERIFICATION=false
```

---

## Phase 8: Testing Checklist

- [ ] User registration API works
- [ ] User login with username and email works
- [ ] Password hashing with bcrypt
- [ ] Session creation per user
- [ ] Role-based access control
- [ ] Data isolation (users only see their data)
- [ ] Admin can manage all users
- [ ] Audit logging tracks user actions
- [ ] Audit logs show user context
- [ ] Employee creation assigns to current user
- [ ] Cannot access other user's data via API

---

## Phase 9: Security Considerations

1. **Email Verification** - Add email verification on signup
2. **Password Reset** - Implement password reset flow
3. **2FA** - Add two-factor authentication
4. **Audit Trail** - Track who accessed what data
5. **Data Encryption** - Encrypt sensitive fields per user
6. **API Rate Limiting** - Already implemented globally
7. **CORS** - Already implemented with origin checking
8. **Input Validation** - Already implemented with sanitization

---

## Implementation Order

1. ✅ **Week 1**: Update database schemas
2. ✅ **Week 2**: Create user management APIs
3. ✅ **Week 3**: Update authentication system
4. ✅ **Week 4**: Implement data isolation
5. ✅ **Week 5**: Update UI components
6. ✅ **Week 6**: Add role-based access control
7. ✅ **Week 7**: Migrate existing data
8. ✅ **Week 8**: Testing and deployment

---

## Summary of Changes

| Component | Changes |
|-----------|---------|
| **Database** | Add userId to all collections, support multiple users |
| **Auth** | Support multiple users instead of hardcoded credentials |
| **APIs** | Filter data by userId, implement authorization |
| **UI** | Add user management, signup, login enhancements |
| **Security** | Role-based permissions, audit logging per user |
| **Config** | Remove single-user env vars, add multi-user config |

Your security infrastructure from Phases 1-6 is already in place and will work perfectly with multi-user system!

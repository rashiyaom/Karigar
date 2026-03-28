# Authentication System - Karigar

## Overview

The Karigar application now includes a complete authentication system with persistent login functionality. Users are required to authenticate before accessing the employee management dashboard.

## Features

### 1. **Hardcoded Credentials**
- **Username**: `omkar`
- **Password**: `omkar@123`

### 2. **Persistent Sessions**
- Sessions are stored in MongoDB for persistence across browser refreshes
- Session tokens are stored as secure HTTP-only cookies
- Default session duration: 30 days

### 3. **MongoDB Integration**
- Two new collections: `users` and `sessions`
- User credentials stored in MongoDB
- Session tokens automatically expire after 30 days

## Architecture

### User Flow

1. **Unauthenticated Access**: User visits `/` → Redirected to `/login`
2. **Login**: User enters credentials on `/login` page
3. **Authentication**: POST to `/api/auth/login` validates credentials
4. **Session Creation**: Successful login creates session in MongoDB
5. **Cookie Storage**: Auth token stored as HTTP-only cookie
6. **Protected Access**: User can access `/dashboard` and other protected routes
7. **Logout**: User can logout, which clears session and cookie

### File Structure

```
lib/auth.ts                      # Core authentication functions
├── loginUser()                  # Validate credentials & create session
├── verifyToken()                # Check if token is valid
├── getCurrentUser()             # Get logged-in user from cookie
├── setAuthCookie()              # Set secure HTTP-only cookie
├── getAuthToken()               # Retrieve token from cookie
└── logoutUser()                 # Delete session from DB

app/api/auth/login/route.ts      # Login endpoint
app/api/auth/logout/route.ts     # Logout endpoint
app/api/auth/check/route.ts      # Check authentication status

app/login/page.tsx               # Login page
components/login-form.tsx        # Login UI component

app/dashboard/page.tsx           # Protected dashboard
app/page.tsx                      # Root redirect

middleware.ts                    # Route protection middleware
```

## API Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "username": "omkar",
  "password": "omkar@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "username": "omkar"
  },
  "token": "token_string"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /api/auth/logout
**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/check
**Success Response (200):**
```json
{
  "authenticated": true,
  "user": {
    "id": "user_id",
    "username": "omkar"
  }
}
```

**Unauthorized Response (401):**
```json
{
  "authenticated": false
}
```

## MongoDB Schemas

### Users Collection
```typescript
{
  _id: ObjectId
  username: string (unique, lowercase)
  password: string
  createdAt: Date
  updatedAt: Date
}
```

### Sessions Collection
```typescript
{
  _id: ObjectId
  userId: string (reference to user)
  token: string (unique)
  expiresAt: Date (with TTL index - auto-delete after 30 days)
  createdAt: Date
}
```

## Security Features

1. **HTTP-Only Cookies**: Tokens stored in secure HTTP-only cookies, preventing XSS attacks
2. **Secure Cookie Flag**: Enabled in production (HTTPS only)
3. **SameSite Protection**: Set to 'lax' to prevent CSRF attacks
4. **Token Expiration**: Sessions automatically expire after 30 days
5. **MongoDB TTL Index**: Expired sessions auto-deleted from database
6. **Route Protection**: Middleware validates authentication for all routes

## Testing

### Test Login
1. Navigate to http://localhost:3001
2. You'll be redirected to `/login`
3. Enter credentials:
   - Username: `omkar`
   - Password: `omkar@123`
4. Click "Sign In"
5. You'll be redirected to `/dashboard`

### Test Persistence
1. Login to the system
2. Refresh the page (Ctrl+R or Cmd+R)
3. You remain logged in (session persists)

### Test Logout
1. While logged in, click the "Logout" button
2. You'll be redirected to `/login`
3. Your session is deleted from MongoDB

## Future Enhancements

1. **Password Hashing**: Use bcrypt to hash passwords in production
2. **Password Reset**: Implement email-based password reset
3. **2FA**: Add two-factor authentication
4. **OAuth**: Integrate with Google/Microsoft OAuth
5. **Audit Logging**: Track login/logout events in history collection
6. **Rate Limiting**: Limit login attempts per IP address
7. **User Management**: Admin panel to create/manage users
8. **Permissions**: Role-based access control (RBAC)

## Troubleshooting

### "Invalid credentials" error
- Verify username: `omkar` (case-sensitive)
- Verify password: `omkar@123`
- Check MongoDB connection in `.env.local`

### Session not persisting
- Check browser cookies are enabled
- Verify MONGODB_URI in `.env.local`
- Check if sessions collection exists in MongoDB

### "Unauthorized" when accessing API
- Ensure you're logged in first
- Check if auth token cookie exists
- Verify token hasn't expired

## Configuration

Edit these values in `lib/auth.ts` to customize:

```typescript
const HARDCODED_USERNAME = 'omkar'        // Username
const HARDCODED_PASSWORD = 'omkar@123'    // Password
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000  // 30 days in ms
const COOKIE_NAME = 'auth-token'          // Cookie name
```

## Notes

- This is a demo system with hardcoded credentials
- In production, implement proper user management with password hashing
- Consider adding more sophisticated authentication methods
- Always use HTTPS in production for secure cookie transmission

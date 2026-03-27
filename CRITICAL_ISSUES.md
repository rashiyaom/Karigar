# Karigar - Critical Issues Report

## 🚨 CRITICAL ISSUES THAT MAY FAIL THE PROJECT

---

## 1. ❌ **CRITICAL: Dual Database Systems Conflict**

**Severity:** 🔴 CRITICAL - Project Breaking

**Location:** 
- `lib/database.ts` (SQLiteStore - 828 lines)
- `lib/store.ts` (InMemoryStore - 654 lines)
- Multiple API routes importing from different stores

**Problem:**
The project has **TWO CONFLICTING DATA STORAGE SYSTEMS** that are NOT synchronized:

1. **SQLiteStore** (`lib/database.ts`) - Actual SQLite database on disk
2. **InMemoryStore** (`lib/store.ts`) - In-memory data storage

**Current Usage:**
```
API Routes using store: /api/attendance, /api/credits, /api/employees, /api/tasks, /api/stats, /api/settings
API Routes using sqliteStore: /api/database/*, /api/database/info, /api/database/backup
```

**Why This Is Critical:**
- When you fetch data via `/api/employees`, it uses `store` (InMemoryStore)
- When you check database info via `/api/database/info`, it uses `sqliteStore` (SQLiteStore)
- **Data written to one system does NOT exist in the other**
- Server restart will lose all data from InMemoryStore
- Application will see data inconsistency

**Evidence of Conflict:**
```typescript
// lib/store.ts exports InMemoryStore
export const store = (() => { ... })()

// lib/database.ts exports SQLiteStore
export const sqliteStore = new SQLiteStore()

// API routes import different stores
// app/api/credits/route.ts
import { store } from "@/lib/store"  // ← InMemoryStore

// app/api/database/info/route.ts
import { sqliteStore } from "@/lib/database"  // ← SQLiteStore
```

**Impact:**
- ✗ Data loss on server restart
- ✗ Data inconsistency between API endpoints
- ✗ Database backup feature won't capture all data
- ✗ Production deployment will fail

**Recommendation:**
1. **Choose ONE storage system:** Either SQLite OR In-Memory
2. **If using SQLite:** Replace all `store` imports with `sqliteStore`
3. **If using In-Memory:** Remove SQLiteStore completely
4. **Sync All API endpoints:** Make sure they use the same store

---

## 2. ❌ **CRITICAL: Database Path Configuration Issues**

**Severity:** 🔴 CRITICAL - Server-side failure

**Location:** `lib/database.ts` lines 17-30

**Problem:**
```typescript
const defaultPath = path.join(process.cwd(), "data", "employee_management.db")
```

**Issues:**
1. **`process.cwd()` is unreliable** in serverless/Next.js environment
   - Different behavior in development vs production
   - May fail in deployed environments (Vercel, AWS, etc.)
   
2. **File system not writable** in serverless environments
   - Vercel: Files must be in `/tmp`
   - AWS Lambda: Same limitation
   - Docker containers: Depends on volume mapping

3. **No error recovery** if path is invalid
   - Application will crash on startup
   - No fallback mechanism

**Code Issue:**
```typescript
// No check if path is writable
const dir = path.dirname(this.dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })  // ← May fail silently
}
```

**Impact:**
- ✗ Application won't start in production
- ✗ Data corruption if database can't be written
- ✗ Deployments to serverless platforms will fail

**Recommendation:**
```typescript
// Use environment variable
const dbPath = process.env.DATABASE_PATH || '/tmp/employee_management.db'
// Or use a service like Neon, Supabase for PostgreSQL
```

---

## 3. ❌ **CRITICAL: No Data Persistence Between Server Restarts**

**Severity:** 🔴 CRITICAL - Data loss

**Location:** `lib/store.ts` (InMemoryStore)

**Problem:**
All data is stored ONLY in memory. When the server restarts:
- All employees data deleted
- All attendance records deleted
- All credits deleted
- All tasks deleted

**Code:**
```typescript
// All data is in memory
private employees: Map<string, Employee> = new Map()
private attendance: Map<string, Attendance> = new Map()
// ... etc

// HMR persistence only works in development
if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
  // HMR persistence in dev only
}
```

**Impact:**
- ✗ Every deployment loses all historical data
- ✗ Impossible to use for real HR operations
- ✗ Business operations cannot continue after server restart
- ✗ No audit trail persistence

**Recommendation:**
- Implement proper database persistence (PostgreSQL, MongoDB)
- OR properly implement and use the SQLiteStore
- Setup database migrations for deployment

---

## 4. ❌ **CRITICAL: Attendance Auto-Reset Logic Is Broken**

**Severity:** 🔴 CRITICAL - Silent data loss

**Location:** 
- `components/attendance-auto-reset.tsx`
- `app/api/attendance/auto-reset/route.ts`

**Problem:**
The auto-reset **DELETES all attendance records for the day**, not resets them:

```typescript
// In store.ts
resetDailyAttendance(date?: string): number {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const attendanceToDelete = Array.from(this.attendance.values())
    .filter(a => a.date === targetDate)
  
  // ← DELETES the records, doesn't mark absent!
  attendanceToDelete.forEach(attendance => {
    if (this.attendance.delete(attendance.id)) {
      deletedCount++
    }
  })
}
```

**What Should Happen:**
- Employees not marked as absent should be marked as "absent"
- Current attendance records should persist for reporting

**What Actually Happens:**
- All attendance data for the day is DELETED
- Creates gaps in audit trail
- Makes payroll calculation impossible for deleted days

**Impact:**
- ✗ Attendance data loss at end of every day
- ✗ Impossible to generate accurate reports
- ✗ Payroll calculations will be incorrect
- ✗ Legal/compliance issues with missing records

**Recommendation:**
```typescript
// Instead of deleting, mark unmarked employees as absent
resetDailyAttendance(date?: string): number {
  const targetDate = date || ...
  const employees = this.getAllEmployees()
  const markedEmployees = this.getAttendanceByDate(targetDate)
    .map(a => a.employeeId)
  
  let addedCount = 0
  employees.forEach(emp => {
    if (!markedEmployees.includes(emp.id)) {
      this.createAttendance({
        employeeId: emp.id,
        date: targetDate,
        status: "absent"
      })
      addedCount++
    }
  })
  return addedCount
}
```

---

## 5. ❌ **CRITICAL: No Input Validation for Duplicate Attendance**

**Severity:** 🔴 CRITICAL - Data integrity issue

**Location:** `lib/store.ts` - `createAttendance` method

**Problem:**
The InMemoryStore checks for duplicates, but SQLiteStore does NOT:

**InMemoryStore (store.ts):**
```typescript
createAttendance(attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Attendance {
  // Checks for existing attendance
  const existingAttendance = this.getAttendanceByEmployeeAndDate(...)
  if (existingAttendance) {
    throw new Error(`Attendance already marked for this employee on ${attendance.date}...`)
  }
  // ...
}
```

**SQLiteStore (database.ts):**
```typescript
createAttendance(attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Attendance {
  // ← NO DUPLICATE CHECK!
  const stmt = this.db.prepare(`
    INSERT INTO attendance (id, employeeId, date, status, ...)
    VALUES (?, ?, ?, ?, ...)
  `)
  stmt.run(...)
}
```

**Database Constraint Missing:**
```sql
-- This is missing:
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique 
  ON attendance(employeeId, date)
```

**Impact:**
- ✗ Multiple attendance records for same employee on same day
- ✗ Payroll calculations will be incorrect
- ✗ Reports will show duplicate entries
- ✗ Data integrity issues

**Recommendation:**
```sql
-- Add constraint to SQLiteStore.createTables()
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique 
  ON attendance(employeeId, date);
```

---

## 6. ❌ **CRITICAL: Missing GET/PUT/DELETE Endpoints**

**Severity:** 🔴 CRITICAL - Incomplete API

**Location:** Multiple API route directories

**Problem:**
Only `/api/employees/route.ts` has GET/POST. Missing ID-specific routes:

```
Expected routes that are MISSING:
✗ GET  /api/employees/[id]
✗ PUT  /api/employees/[id]
✗ DELETE /api/employees/[id]
✗ GET  /api/attendance/[id]
✗ PUT  /api/attendance/[id]
✗ DELETE /api/attendance/[id]
✗ GET  /api/credits/[id]
✗ PUT  /api/credits/[id]
✗ DELETE /api/credits/[id]
✗ GET  /api/tasks/[id]
✗ PUT  /api/tasks/[id]
✗ DELETE /api/tasks/[id]
```

**Actual Empty Directories:**
```
app/api/employees/[id]/          ← EMPTY
app/api/attendance/[id]/         ← EMPTY
app/api/credits/[id]/            ← EMPTY
app/api/tasks/[id]/              ← EMPTY
app/api/history/[id]/            ← EMPTY
```

**Code Trying to Use Missing Endpoints:**
```typescript
// hooks/use-api.ts
export function useUpdateEmployee() {
  return useMutation({
    mutationFn: ({ id, ...updates }) =>
      apiCall<Employee>(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    // ← This will 404 - endpoint doesn't exist!
  })
}

export function useDeleteEmployee() {
  return useMutation({
    mutationFn: (id: string) =>
      apiCall(`/api/employees/${id}`, {
        method: "DELETE",
      }),
    // ← This will 404 - endpoint doesn't exist!
  })
}
```

**Impact:**
- ✗ Edit employee feature doesn't work → 404 errors
- ✗ Delete employee feature doesn't work → 404 errors
- ✗ Update attendance doesn't work → 404 errors
- ✗ Update credits doesn't work → 404 errors
- ✗ Update tasks doesn't work → 404 errors
- ✗ Dashboard functionality completely broken

**Recommendation:**
Create all missing endpoints:
```
app/api/employees/[id]/route.ts
app/api/attendance/[id]/route.ts
app/api/credits/[id]/route.ts
app/api/tasks/[id]/route.ts
```

---

## 7. ❌ **CRITICAL: TypeScript Compilation Errors Are Ignored**

**Severity:** 🔴 CRITICAL - Hidden bugs

**Location:** `next.config.mjs`

**Problem:**
```javascript
export default nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ← IGNORING ALL TS ERRORS!
  },
  eslint: {
    ignoreDuringBuilds: true,  // ← IGNORING ALL LINTING!
  },
}
```

**Why This Is Dangerous:**
- Type errors are silently ignored during build
- Runtime errors will only appear in production
- No type safety
- Hard to debug issues

**Impact:**
- ✗ Silent type errors in production
- ✗ Runtime crashes that could have been caught
- ✗ No type safety guarantees

**Recommendation:**
Remove these ignore flags and fix actual TypeScript errors:
```javascript
// Remove ignoreBuildErrors and ignoreDuringBuilds
// Run: npm run type-check to find issues
```

---

## 8. ❌ **CRITICAL: Better-SQLite3 Won't Work in Production**

**Severity:** 🔴 CRITICAL - Deployment failure

**Location:** `package.json` - dependency: `better-sqlite3`

**Problem:**
`better-sqlite3` is a **native Node.js module** that:
1. Requires compilation at install time
2. Won't work on serverless platforms (Vercel, Netlify, AWS Lambda)
3. Requires file system persistence
4. Architecture-specific (x86 vs ARM)

**Error You'll See in Production:**
```
Error: The module's exports were not defined by the plugin or host.
// or
Error: Cannot find module 'better-sqlite3'
// or
ENOENT: no such file or directory
```

**Impact:**
- ✗ Application won't start on Vercel/AWS/Netlify
- ✗ Docker builds may fail
- ✗ Serverless deployments impossible
- ✗ Production deployment will fail

**Recommendation:**
Use a proper backend database:
- **PostgreSQL** (via Supabase, Railway, Neon)
- **MongoDB** (via Atlas)
- **MySQL** (via PlanetScale)
- **Firebase** Firestore (serverless)

---

## 9. ❌ **CRITICAL: WebSocket Completely Disabled**

**Severity:** 🟡 HIGH - Fallback in place but not optimal

**Location:** `lib/websocket.ts` lines 30-70

**Problem:**
```typescript
const connect = () => {
  console.log("Using polling fallback for real-time updates")
  startPolling()
  return

  // WebSocket code commented out completely
  // ... (dead code below)
}
```

**Issues:**
1. WebSocket is completely disabled with no fallback
2. Polls every 10 seconds instead of real-time updates
3. Inefficient and doesn't scale
4. No real-time collaboration features

**Impact:**
- ~ Updates take up to 10 seconds to appear
- ~ Not suitable for real-time attendance marking
- ~ Excessive network requests

**Recommendation:**
Either implement working WebSocket server or use a service like:
- Pusher
- Socket.io with proper backend
- Firebase Realtime Database

---

## 10. ❌ **CRITICAL: No Environment Configuration**

**Severity:** 🔴 CRITICAL - Configuration issues

**Location:** Missing `.env.local` file

**Problem:**
No environment variables configured:
- Database URL/Path not configurable
- No API secrets
- No feature flags
- Hard-coded configuration

**Expected `.env.local` Missing:**
```env
DATABASE_PATH=/path/to/db
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=...
NODE_ENV=production
```

**Impact:**
- ✗ Can't deploy to different environments
- ✗ Database path issues in production
- ✗ Configuration inflexible

**Recommendation:**
Create `.env.local` and `.env.example` files

---

## 11. ❌ **CRITICAL: No Error Handling in Components**

**Severity:** 🟡 HIGH - Runtime crashes

**Location:** `components/dashboard.tsx` and other components

**Problem:**
```typescript
// No error boundaries
// No try-catch in async operations
// API errors might crash component

const filteredEmployees = employees.filter(...)
// If employees is undefined, this crashes

const handleDeleteEmployee = async (employee: Employee) => {
  // No error boundary
  // No try-catch for mutations
}
```

**Impact:**
- ~ White screen of death on errors
- ~ Poor error recovery
- ~ Users confused about failures

**Recommendation:**
Add Error Boundaries and better error handling

---

## 12. ❌ **CRITICAL: No Salary History Tracking**

**Severity:** 🟡 HIGH - Business logic issue

**Location:** `lib/database.ts` - `calculateEmployeeSalary` method

**Problem:**
Salary calculation only uses **current month's data**:
```typescript
const currentMonth = new Date().toISOString().slice(0, 7)
const monthlyAttendance = this.getAttendanceByEmployee(employeeId)
  .filter((a) => a.date.startsWith(currentMonth))
```

But there's no `salary_history` table to track:
- Historical salary calculations
- Audit trail for payroll
- Legal/compliance records

**Impact:**
- ~ Impossible to verify past salary payments
- ~ Compliance issues
- ~ No audit trail for HR/Finance

---

## Summary of Critical Issues

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Dual Database Systems | 🔴 CRITICAL | Data loss, inconsistency |
| 2 | Database Path Issues | 🔴 CRITICAL | Won't work in production |
| 3 | No Data Persistence | 🔴 CRITICAL | Complete data loss on restart |
| 4 | Broken Auto-Reset | 🔴 CRITICAL | Data loss daily |
| 5 | No Duplicate Validation | 🔴 CRITICAL | Data integrity |
| 6 | Missing API Endpoints | 🔴 CRITICAL | UI features won't work |
| 7 | TS Errors Ignored | 🔴 CRITICAL | Hidden runtime errors |
| 8 | SQLite Won't Deploy | 🔴 CRITICAL | Production deployment fails |
| 9 | WebSocket Disabled | 🟡 HIGH | Slow updates |
| 10 | No Configuration | 🔴 CRITICAL | Can't deploy to production |
| 11 | No Error Handling | 🟡 HIGH | App crashes on errors |
| 12 | No Salary History | 🟡 HIGH | Compliance issues |

---

## 🛑 PRIORITY FIX ORDER

**DO THESE FIRST (Today):**
1. Choose ONE database system (SQLite or In-Memory)
2. Create missing API endpoints for [id] routes
3. Fix the attendance auto-reset logic
4. Remove TypeScript/ESLint ignore flags

**DO THESE SECOND (Before Production):**
5. Migrate to proper backend database (PostgreSQL/MongoDB)
6. Add environment configuration
7. Fix database path issues
8. Add Error Boundaries to components

**DO THESE THIRD (Production-Ready):**
9. Implement proper WebSocket or event system
10. Add data persistence and backups
11. Add salary history tracking
12. Add comprehensive error handling

---

## Estimated Effort

- **Critical Fixes:** 2-3 days
- **Production Ready:** 1-2 weeks
- **Fully Stable:** 2-3 weeks

**Without these fixes, the project WILL FAIL in production.**


# Critical Issues Scan Report
**Date:** March 27, 2026  
**Status:** 🔴 6 Issues Found (3 Critical, 2 Medium, 1 Low)

---

## 🔴 CRITICAL ISSUES

### 1. **ObjectId/String Type Mismatch in Database Queries** (HIGH SEVERITY)

**Location:** `lib/mongo-store.ts` (12 occurrences)

**Problem:**
- Mongoose schemas define `employeeId` as `String` type
- Code attempts to convert to `ObjectId` in 12+ places
- Queries will fail to match documents correctly
- Data becomes inaccessible after creation

**Affected Lines:**
```
Line 158: AttendanceModel.findOne({ employeeId: new mongoose.Types.ObjectId(...) })
Line 169: AttendanceModel.create({ employeeId: new mongoose.Types.ObjectId(...) })
Line 191: AttendanceModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 323: CreditModel.create({ employeeId: new mongoose.Types.ObjectId(...) })
Line 347: CreditModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 424: TaskModel.create({ employeeId: new mongoose.Types.ObjectId(...) })
Line 449: TaskModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 566: AttendanceModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 586: CreditModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 606: AttendanceModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
Line 626: CreditModel.find({ employeeId: new mongoose.Types.ObjectId(...) })
```

**Schema Definition (lib/mongodb-models.ts, Line 29):**
```typescript
employeeId: { type: String, required: true, index: true },
```

**Fix Required:**
Remove all `new mongoose.Types.ObjectId()` conversions and use strings directly.

**Impact:**
- ❌ Attendance creation/lookup will fail
- ❌ Credit creation/lookup will fail
- ❌ Task creation/lookup will fail
- ❌ Salary calculations broken
- ❌ Data queries return incorrect results

---

### 2. **Type Inconsistency in resetDailyAttendance** (HIGH SEVERITY)

**Location:** `lib/mongo-store.ts`, Line 287

**Problem:**
```typescript
await AttendanceModel.create({
  employeeId: employee._id,  // ← ObjectId from Employee doc
  date: targetDate,
  status: 'absent',
})
```

- Other attendance operations store `employeeId` as string
- This operation stores ObjectId
- Breaks uniqueness and consistency
- Dual data format in same collection

**Fix Required:**
Convert to string: `employeeId: employee._id.toString()`

**Impact:**
- ❌ Inconsistent data format in collection
- ❌ Unique index on (employeeId, date) ineffective
- ❌ Queries against auto-reset data may fail
- ❌ Cross-device data sync issues

---

### 3. **Ineffective Database Indexes** (HIGH SEVERITY)

**Location:** `lib/mongodb-models.ts`, Line 48

**Problem:**
```typescript
// Index definition:
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })

// But queries use ObjectId for employeeId
AttendanceModel.findOne({ 
  employeeId: new mongoose.Types.ObjectId(...),
  date: '2026-03-27'
})

// While inserts use string OR ObjectId inconsistently
```

- Unique index won't prevent duplicates with mixed types
- Index performance degraded
- Duplicate prevention fails

**Impact:**
- ❌ Multiple attendance records for same employee/date possible
- ❌ Index queries inefficient
- ❌ Performance degradation as data grows

---

## 🟠 MEDIUM ISSUES

### 4. **Generic Error Messages Hide Real Problems** (MEDIUM SEVERITY)

**Location:** Throughout API routes and mongoStore

**Pattern:**
```typescript
catch (error) {
  console.error('Failed to reset daily attendance:', error)
  return 0
}

// Caller receives only count, not error info
```

**Problems:**
- Production errors return vague messages: "Failed to fetch"
- No error context logged for debugging
- Silent failures in async operations
- No way to distinguish validation errors from DB errors

**Example from `app/api/employees/[id]/route.ts`:**
```typescript
catch (error) {
  if (error instanceof Error) {
    return NextResponse.json({
      success: false,
      error: error.message,  // Could be validation or DB error
    }, { status: 400 })
  }
}
```

**Fix:**
- Log full error stack
- Differentiate error types (validation vs DB vs not-found)
- Return appropriate HTTP status codes (400, 404, 500)

**Impact:**
- 🟡 Difficult to debug in production
- 🟡 Poor error reporting to client
- 🟡 No audit trail of failures

---

### 5. **Missing Input Validation for Date Formats** (MEDIUM SEVERITY)

**Location:** 
- `lib/mongo-store.ts` - date parameters not validated
- `lib/validation.ts` - no date format validation
- API routes - no date format checks

**Problem:**
```typescript
// Date passed as string, no format validation
async createAttendance(
  attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Attendance> {
  // attendance.date could be any string format
  // Should enforce ISO format: YYYY-MM-DD
}

// Validation schema doesn't check format:
export const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),  // ← No format validation!
  status: z.enum([...]),
})
```

**Issues:**
- Invalid date strings accepted: "invalid", "2026/03/27", "27-03-2026"
- Inconsistent date filtering results
- Unique index doesn't catch duplicates with different formats
- Timezone issues with date comparisons

**Fix:**
```typescript
date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
```

**Impact:**
- 🟡 Duplicate records with different date formats
- 🟡 Attendance queries miss records
- 🟡 Auto-reset logic fails for formatted dates

---

## 🟡 LOW ISSUES

### 6. **Inconsistent Error Handling Pattern** (LOW SEVERITY)

**Location:** Multiple files

**Pattern Repetition:**
```typescript
try {
  // operation
} catch (error) {
  console.error('Failed to X:', error)
  return null  // or 0 or false
}
```

**Issues:**
- No validation error differentiation
- Same handling for all error types
- No request ID/tracing
- Difficult to aggregate errors

**Recommendation:**
- Create unified error handler
- Add error type discrimination
- Implement request correlation IDs

**Impact:**
- 🔵 Code maintainability slightly reduced
- 🔵 No performance impact

---

## Summary Table

| Issue | Severity | Affects | Resolution Time |
|-------|----------|---------|-----------------|
| ObjectId/String Mismatch | 🔴 CRITICAL | All data operations | 30 mins |
| Type in resetDailyAttendance | 🔴 CRITICAL | Auto-reset & queries | 5 mins |
| Ineffective Indexes | 🔴 CRITICAL | Performance & integrity | 10 mins |
| Generic Error Messages | 🟠 MEDIUM | Debugging & UX | 20 mins |
| Missing Date Validation | 🟠 MEDIUM | Data integrity | 15 mins |
| Error Pattern Inconsistency | 🟡 LOW | Maintainability | 45 mins |

---

## Recommended Fix Priority

1. **FIRST** (Blocks all data operations):
   - Fix ObjectId/String type mismatch across 12 locations
   - Test with actual MongoDB

2. **SECOND** (Breaks data consistency):
   - Fix resetDailyAttendance type issue
   - Add date format validation

3. **THIRD** (Improves debugging):
   - Enhance error messages
   - Add error differentiation

4. **FOURTH** (Code quality):
   - Standardize error handling pattern

---

## Testing Recommendations

After fixes, test:
1. ✅ Create attendance for employee (should not throw ObjectId error)
2. ✅ Query attendance by employeeId (should return records)
3. ✅ Auto-reset marks absent correctly
4. ✅ Unique index prevents duplicates
5. ✅ Invalid date format rejected
6. ✅ Error messages contain useful context

---

## Files Requiring Changes

1. `lib/mongo-store.ts` - Remove 12+ ObjectId conversions
2. `lib/validation.ts` - Add date format regex
3. `lib/mongodb-models.ts` - Verify schema consistency
4. `app/api/**/*.ts` - Enhance error messages (9 files)


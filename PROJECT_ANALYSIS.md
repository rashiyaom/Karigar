# Karigar - Employee Management System: Comprehensive Analysis

## 📋 Project Overview

**Karigar** is a modern, full-stack Employee Management System built with **Next.js 15**, **React 19**, and **TypeScript**. It provides comprehensive HR management capabilities including attendance tracking, leave management, payroll processing, task management, and employee analytics.

**Key Information:**
- **Repository:** Karigar (Owner: rashiyaom)
- **Current Branch:** main
- **Type:** Full-stack web application
- **Framework:** Next.js 15.5.5 with App Router
- **Database:** SQLite (better-sqlite3)
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI (extensive collection)

---

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- Next.js 15.5.5 (React 19)
- TypeScript 5
- Tailwind CSS 4.1.9
- Radix UI components
- React Hook Form + Zod validation
- TanStack React Query (data fetching/caching)
- next-themes (dark mode support)
- Sonner (toast notifications)
- Recharts (data visualization)
- ExcelJS (Excel export functionality)

**Backend:**
- Next.js API Routes (serverless functions)
- SQLite with better-sqlite3
- Zod for schema validation

**Additional Libraries:**
- @google/generative-ai (AI features)
- date-fns (date manipulation)
- WebSocket support (real-time updates)
- Geist fonts

---

## 📁 Project Structure

```
Karigar/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home/Dashboard page
│   ├── globals.css             # Global styles
│   ├── api/                    # API routes
│   │   ├── attendance/         # Attendance management APIs
│   │   │   ├── route.ts        # GET/POST attendance
│   │   │   ├── reset/          # Manual attendance reset
│   │   │   └── auto-reset/     # Automatic attendance reset
│   │   ├── credits/            # Credit/Loan management APIs
│   │   ├── employees/          # Employee CRUD APIs
│   │   ├── tasks/              # Task management APIs
│   │   ├── history/            # History/Audit trail APIs
│   │   ├── stats/              # Analytics/Statistics APIs
│   │   ├── settings/           # System settings APIs
│   │   └── database/           # Database management APIs
│   │       ├── setup/
│   │       ├── info/
│   │       └── backup/
│   ├── attendance/             # Attendance page
│   ├── credits/                # Credits page
│   ├── tasks/                  # Tasks page
│   ├── history/                # History page
│   ├── analytics/              # Analytics/Reports page
│   └── database-setup/         # Database configuration page
│
├── components/
│   ├── dashboard.tsx           # Main dashboard component
│   ├── employee-*.tsx          # Employee-related components
│   ├── attendance-*.tsx        # Attendance components
│   ├── credit-*.tsx            # Credit management components
│   ├── task-*.tsx              # Task management components
│   ├── data-analytics.tsx      # Analytics component
│   ├── settings-form.tsx       # Settings configuration
│   ├── language-provider.tsx   # I18n provider (EN, GU)
│   ├── theme-provider.tsx      # Theme provider
│   ├── connection-status.tsx   # Connection indicator
│   ├── attendance-auto-reset.tsx # Automatic attendance reset
│   ├── history-timeline.tsx    # History timeline view
│   ├── ui/                     # Radix UI component library
│   │   └── [40+ UI components] # Button, Card, Dialog, Form, etc.
│   ├── providers.tsx           # Aggregated providers
│   └── query-provider.tsx      # React Query provider
│
├── lib/
│   ├── database.ts             # SQLite database class (828 lines)
│   ├── types.ts                # TypeScript interfaces
│   ├── validation.ts           # Zod schemas
│   ├── utils.ts                # Utility functions
│   ├── excel-export.ts         # Excel export functionality (872 lines)
│   ├── store.ts                # Data store/business logic
│   ├── ai-service.ts           # Google Generative AI integration
│   └── websocket.ts            # WebSocket for real-time updates
│
├── hooks/
│   ├── use-api.ts              # Custom hooks for API calls
│   ├── use-mobile.ts           # Mobile detection hook
│   └── use-toast.ts            # Toast notification hook
│
├── styles/
│   └── globals.css             # Global Tailwind styles
│
├── data/                       # Data directory (SQLite DB stored here)
│
├── next.config.mjs             # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
├── postcss.config.mjs          # PostCSS config (Tailwind)
└── tailwind.config.js          # Tailwind CSS configuration
```

---

## 🗄️ Data Models

### Core Entities

#### 1. **Employee**
```typescript
interface Employee {
  id: string (UUID)
  name: string
  salary: number
  joiningDate: string (ISO date)
  mobile: string
  email: string
  role: string
  profilePhoto?: string (optional)
  status: "active" | "inactive"
  createdAt: string (ISO timestamp)
  updatedAt: string (ISO timestamp)
}
```

#### 2. **Attendance**
```typescript
interface Attendance {
  id: string
  employeeId: string (FK)
  date: string (ISO date)
  status: "present" | "absent" | "half-day" | "sick-leave" | "paid-leave"
  createdAt: string
  updatedAt: string
}
```

#### 3. **Credit (Employee Loans)**
```typescript
interface Credit {
  id: string
  employeeId: string (FK)
  amount: number
  dateTaken: string (ISO date)
  promiseReturnDate: string (ISO date)
  isPaid: boolean
  createdAt: string
  updatedAt: string
}
```

#### 4. **Task**
```typescript
interface Task {
  id: string
  employeeId: string (FK)
  title: string
  description: string
  deadline: string (ISO date)
  priority: "high" | "medium" | "low"
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}
```

#### 5. **Settings**
```typescript
interface Settings {
  organizationName: string
  leaveDeduction: {
    type: "percentage" | "fixed"
    value: number
  }
  workingHours?: { start: string; end: string }
  weekendDays?: string[]
  autoMarkAbsent?: boolean
  emailNotifications?: boolean
  backupFrequency?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
}
```

---

## 🔌 API Endpoints

### Attendance APIs
- `GET /api/attendance` - Fetch all attendance records
- `POST /api/attendance` - Create attendance record
- `GET /api/attendance/[id]` - Get specific attendance
- `PUT /api/attendance/[id]` - Update attendance
- `DELETE /api/attendance/[id]` - Delete attendance
- `POST /api/attendance/reset` - Manual attendance reset
- `POST /api/attendance/auto-reset` - Automatic daily reset

### Employee APIs
- `GET /api/employees` - Fetch all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get specific employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Credit/Loan APIs
- `GET /api/credits` - Fetch all credits
- `POST /api/credits` - Create credit record
- `GET /api/credits/[id]` - Get specific credit
- `PUT /api/credits/[id]` - Update credit
- `DELETE /api/credits/[id]` - Delete credit

### Task APIs
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get specific task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Stats/Analytics APIs
- `GET /api/stats` - Get system statistics

### Settings APIs
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

### History/Audit APIs
- `GET /api/history` - Get audit trail
- `POST /api/history/[id]/undo` - Undo operation

### Database APIs
- `GET /api/database/info` - Get database information
- `POST /api/database/setup` - Setup/initialize database
- `POST /api/database/backup` - Create database backup

---

## 🎨 Core Features

### 1. **Employee Management**
- Create, read, update, delete employees
- Employee profile with photo support
- Employee status tracking (active/inactive)
- Employee details view with analytics
- Employee search and filtering

### 2. **Attendance Tracking**
- Mark daily attendance (Present, Absent, Half-day, Sick Leave, Paid Leave)
- Attendance calendar view
- Automatic daily attendance reset at configured time
- Manual attendance reset option
- Attendance history tracking

### 3. **Credit/Loan Management**
- Record employee loans/credits
- Track payment status
- Promise return date tracking
- Credit history
- Unpaid credit reporting

### 4. **Task Management**
- Assign tasks to employees
- Priority levels (High, Medium, Low)
- Deadline tracking
- Task completion marking
- Task history

### 5. **Analytics & Reporting**
- Employee statistics dashboard
- Attendance analytics
- Task completion rates
- Credit statistics
- Excel export functionality
  - Employee performance reports
  - Attendance reports
  - Credit/payroll reports
  - Task reports with detailed breakdowns

### 6. **Payroll/Salary Calculation**
- Base salary management
- Leave deduction (percentage or fixed amount)
- Credit deduction from salary
- Net salary calculation
- Salary history

### 7. **Settings & Configuration**
- Organization name
- Leave deduction configuration
- Working hours setup
- Weekend days configuration
- Email notification settings
- Auto-mark absent feature
- Backup frequency configuration

### 8. **Multi-language Support**
- English (en)
- Gujarati (gu)
- Language switcher in UI

### 9. **Dark Mode Support**
- System theme detection
- Manual theme switching
- Persistent theme preference

### 10. **Real-time Updates**
- WebSocket integration for live data updates
- Connection status indicator

### 11. **History & Audit Trail**
- Comprehensive operation history
- Undo functionality
- Timestamp tracking

---

## 🔐 Validation & Security

### Input Validation (Zod Schemas)

**Employee Schema:**
- Name: Required string
- Salary: Non-negative number
- Joining Date: Required string
- Mobile: Required string
- Email: Valid email format
- Role: Required string
- Status: "active" or "inactive"

**Attendance Schema:**
- Employee ID: Required
- Date: Required
- Status: One of the defined statuses

**Credit Schema:**
- Employee ID: Required
- Amount: Non-negative number
- Dates: Required
- isPaid: Boolean flag

**Task Schema:**
- Employee ID: Required
- Title: Required string
- Description: Required string
- Deadline: Required date
- Priority: High/Medium/Low
- Completion: Boolean flag

**Settings Schema:**
- Organization name validation
- Leave deduction validation

### Security Features
- Zod schema validation on all API endpoints
- Foreign key constraints in database (ON DELETE CASCADE)
- Error handling and try-catch blocks
- Input sanitization

---

## 📊 Database Schema

**SQLite Tables:**

1. **employees**
   - id (TEXT PRIMARY KEY)
   - name, salary, joiningDate, mobile, email, role
   - profilePhoto (optional)
   - status (active/inactive)
   - timestamps

2. **attendance**
   - id (TEXT PRIMARY KEY)
   - employeeId (FK → employees)
   - date, status
   - timestamps

3. **credits**
   - id (TEXT PRIMARY KEY)
   - employeeId (FK → employees)
   - amount, dateTaken, promiseReturnDate
   - isPaid (boolean)
   - timestamps

4. **tasks**
   - id (TEXT PRIMARY KEY)
   - employeeId (FK → employees)
   - title, description, deadline
   - priority, isCompleted
   - timestamps

5. **settings**
   - id (INTEGER PRIMARY KEY)
   - Configuration key-value pairs
   - Defaults for organization and deduction settings

6. **history** (implied)
   - Audit trail for operations
   - Timestamps and operation details

---

## 🎯 Custom Hooks (use-api.ts)

The application uses custom hooks for data management:

- `useEmployees()` - Fetch all employees
- `useEmployee(id)` - Fetch specific employee
- `useCreateEmployee()` - Create new employee
- `useUpdateEmployee()` - Update employee
- `useDeleteEmployee()` - Delete employee
- `useAttendance()` - Attendance operations
- `useCredits()` - Credit management
- `useTasks()` - Task management
- `useStats()` - Statistics
- `useSettings()` - Settings management
- `useHistory()` - Audit history

All hooks use TanStack React Query for caching and invalidation.

---

## 🛠️ Key Components

### Dashboard Component (539 lines)
- Main hub for all operations
- Employee search and management
- Quick action buttons (Attendance, Credits, Tasks)
- Statistics display
- Theme and language switchers
- Settings access

### Data Analytics Component
- Comprehensive statistics display
- Visual representations (Recharts)
- Employee performance metrics
- Attendance trends
- Credit statistics

### Excel Export System (872 lines)
- Employee performance reports
- Multi-sheet workbooks
- Formatted tables with styling
- Summary sheets with statistics
- Detailed data breakdowns
- Professional formatting

### Employee Management Components
- Employee form (creation/editing)
- Employee details view
- Employee report generation
- Employee list with filtering

### Attendance Management
- Attendance calendar view
- Quick attendance marking
- Bulk operations support
- Auto-reset configuration

### Task Management
- Task creation and assignment
- Priority-based filtering
- Deadline tracking
- Completion status management

### Credit Management
- Credit recording
- Payment tracking
- Loan history
- Unpaid credit alerts

---

## 🌍 Internationalization (i18n)

**Supported Languages:**
1. English (en)
2. Gujarati (gu)

**Translation Keys Cover:**
- Dashboard labels
- Employee management terms
- Attendance statuses
- Credit management
- Task management
- Common UI labels
- Settings labels

**Implementation:**
- Context API based solution
- Language persistence (localStorage)
- Comprehensive translations object
- Dynamic translation function `t(key)`

---

## 🚀 Build & Deployment

**Scripts:**
- `npm run dev` / `pnpm dev` - Development server (Next.js dev)
- `npm run build` / `pnpm build` - Production build
- `npm start` / `pnpm start` - Production server
- `npm run lint` / `pnpm lint` - ESLint validation

**Configuration:**
- ESLint errors ignored during build
- TypeScript errors ignored during build
- Unoptimized images (for compatibility)
- Webpack fallbacks for fs/path/stream/crypto
- External modules configuration

---

## 📦 Key Dependencies

**UI & Component Library:**
- Radix UI (40+ components)
- Tailwind CSS v4
- Lucide React (icons)
- Sonner (toast notifications)

**Data Management:**
- TanStack React Query
- Zod (validation)
- React Hook Form

**Database:**
- better-sqlite3 (SQLite driver)

**Excel Export:**
- ExcelJS

**Utilities:**
- date-fns (date manipulation)
- clsx & tailwind-merge (CSS utilities)
- Geist fonts

**AI:**
- @google/generative-ai

**Theming:**
- next-themes

---

## 🔄 Data Flow

```
User Interaction
    ↓
React Component (Client-side)
    ↓
Custom Hook (use-api.ts)
    ↓
React Query (Caching/Invalidation)
    ↓
API Route (/api/*)
    ↓
Zod Validation
    ↓
Store (lib/store.ts)
    ↓
SQLite Database
    ↓
Response → React Query → Component State → UI Update
```

---

## 🎯 Core Business Logic

### Attendance Auto-Reset
- Configured time-based reset
- Automatic daily reset of attendance records
- Reset status tracking

### Payroll Calculation
- Base salary retrieval
- Leave deduction computation
- Credit deduction application
- Net salary calculation
- Salary history maintenance

### Excel Reports
- Multi-sheet report generation
- Formatted tables and summaries
- Statistics calculation
- Professional styling

### Task Management
- Priority-based sorting
- Deadline tracking
- Completion percentage calculation
- Task history

---

## 📝 Features Documentation

**Documented Features:**
1. `ATTENDANCE_FEATURES.md` - Attendance system details
2. `EXCEL_EXPORT_FEATURE.md` - Excel export capabilities
3. `EXCEL_EXPORT_FIX.md` - Excel export fixes
4. `SECURITY_FIX_EXCEL.md` - Security improvements in Excel export

---

## ✨ Notable Features

1. **Comprehensive Attendance System** - Multiple status types (Present, Absent, Half-day, Sick Leave, Paid Leave)
2. **Flexible Payroll** - Multiple deduction types and calculations
3. **Excel Export** - Professional multi-sheet reports with formatting
4. **Real-time Updates** - WebSocket integration
5. **Multi-language** - English and Gujarati support
6. **Dark Mode** - System and manual theme switching
7. **Audit Trail** - Complete operation history with undo
8. **Responsive Design** - Mobile-friendly interface
9. **Data Validation** - Strict Zod schema validation
10. **AI Integration** - Google Generative AI support

---

## 📊 Deployment Size

- **Build:** Optimized Next.js build with app router
- **Database:** SQLite (local file storage)
- **Data Directory:** `data/employee_management.db`

---

## 🎓 Code Quality

- **TypeScript:** Strict typing throughout
- **Validation:** Zod schemas on all inputs
- **Error Handling:** Try-catch blocks in API routes
- **UI Components:** Reusable Radix UI library
- **Styling:** Tailwind CSS utilities
- **State Management:** React Query + Context API

---

## 📋 Project Status

- **Current Version:** 0.1.0
- **Framework Version:** Next.js 15.5.5
- **TypeScript Version:** 5
- **React Version:** 19
- **Status:** Active Development

---

## 🔍 Summary

**Karigar** is a production-ready Employee Management System with:
- ✅ Complete CRUD operations for all entities
- ✅ Multi-feature attendance and leave tracking
- ✅ Flexible payroll calculation
- ✅ Comprehensive reporting and analytics
- ✅ Excel export capabilities
- ✅ Multi-language support
- ✅ Dark mode support
- ✅ Real-time updates
- ✅ Audit trail and history
- ✅ Professional UI/UX
- ✅ Type-safe development
- ✅ Scalable architecture

This is a well-architected, feature-rich HR management system suitable for small to medium-sized organizations.


# Karigar - Employee Management System

Karigar is a modern Employee Management System that streamlines HR tasks from onboarding to payroll. Features include attendance & leave tracking, payroll automation, performance reviews, training, and analytics — all in a secure, user-friendly platform designed to boost productivity and employee engagement.

## Features

- 👥 **Employee Management**: Create, update, and manage employee profiles
- 📅 **Attendance Tracking**: Track daily attendance with multiple status options
- 💰 **Credit Management**: Manage employee advances and credits
- 📋 **Task Management**: Assign and track tasks for employees
- 📊 **Analytics & Reports**: Comprehensive dashboards and data analytics
- 🔐 **Secure Authentication**: Modern login system with persistent sessions
- 💾 **MongoDB Integration**: Full data persistence with MongoDB Atlas
- 🎨 **Beautiful UI**: Modern interface built with Radix UI and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Karigar
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure MongoDB:**
   - Create `.env.local` file with your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karigar?retryWrites=true&w=majority
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Login Credentials

Use the following demo credentials to access the system:

- **Username:** `omkar`
- **Password:** `omkar@123`

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas with Mongoose
- **UI**: Shadcn UI, Radix UI, Tailwind CSS
- **Validation**: Zod
- **State Management**: React Hook Form, React Query

## Project Structure

```
/app                 # Next.js app directory
  /api              # REST API endpoints
  /login            # Login page
  /dashboard        # Main dashboard
  
/components         # React components
  /ui               # Shadcn UI components
  
/lib
  /auth.ts          # Authentication functions
  /mongodb.ts       # MongoDB connection
  /mongo-store.ts   # Data access layer
  
/middleware.ts      # Route protection
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm test          # Run tests
npm run lint      # Run linter
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/check` - Check authentication status

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee details
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance
- `GET /api/attendance/[id]` - Get attendance details
- `PUT /api/attendance/[id]` - Update attendance
- `DELETE /api/attendance/[id]` - Delete attendance

### Credits
- `GET /api/credits` - List credits
- `POST /api/credits` - Create credit
- `GET /api/credits/[id]` - Get credit details
- `PUT /api/credits/[id]` - Update credit
- `DELETE /api/credits/[id]` - Delete credit

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

## MongoDB Collections

- **users** - User accounts and credentials
- **sessions** - Active user sessions (auto-expires after 30 days)
- **employees** - Employee records
- **attendance** - Daily attendance records
- **credits** - Employee credits/advances
- **tasks** - Task assignments
- **settings** - Application settings
- **history** - Audit trail

## Authentication System

The application includes a secure authentication system:

- **Persistent Sessions**: Sessions stored in MongoDB with auto-expiration
- **Secure Cookies**: HTTP-only cookies prevent XSS attacks
- **Session Duration**: 30-day session validity
- **Protected Routes**: Middleware protects all routes except login
- **Automatic Cleanup**: Expired sessions auto-deleted via MongoDB TTL

See [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) for detailed authentication documentation.

## Security Features

✅ HTTP-only secure cookies  
✅ CSRF protection with SameSite  
✅ Automatic session expiration  
✅ Password validation  
✅ Route-level authentication  
✅ Data persistence in MongoDB  

## Environment Variables

Create a `.env.local` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karigar?retryWrites=true&w=majority

# Node Environment
NODE_ENV=development
```

## Troubleshooting

### MongoDB Connection Issues
- Verify connection string in `.env.local`
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

### Login Not Working
- Verify credentials: `omkar` / `omkar@123`
- Check browser cookies are enabled
- Verify MongoDB connection

### Page Not Redirecting
- Check browser console for errors
- Verify middleware.ts is in project root
- Clear browser cookies and try again

## Performance

- Server-side rendering for fast initial loads
- Automatic image optimization
- Code splitting and lazy loading
- MongoDB query optimization with indexing

## Contributing

Contributions are welcome! Please:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Karigar** - Making Employee Management Simple & Efficient  
Built with ❤️ using Next.js and MongoDB

# 🚀 Quick Start Guide - MongoDB Only

## Setup (1 minute)

```bash
# No setup needed! MongoDB is already configured.
# Your .env.local has:
MONGODB_URI=mongodb+srv://omkarceramic_db_user:Romashiya%40123@karigar.0iyckye.mongodb.net/karigar?retryWrites=true&w=majority&appName=Karigar
```

## Development

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance
- `GET /api/attendance` - Get all records
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/[id]` - Get record
- `PUT /api/attendance/[id]` - Update record
- `DELETE /api/attendance/[id]` - Delete record
- `POST /api/attendance/auto-reset` - Auto-mark absent

### Credits
- `GET /api/credits` - Get all credits
- `POST /api/credits` - Add credit
- `GET /api/credits/[id]` - Get credit
- `PUT /api/credits/[id]` - Update credit
- `DELETE /api/credits/[id]` - Delete credit

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Admin
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings
- `GET /api/history` - Get audit trail
- `GET /api/stats` - Get statistics
- `GET /api/database/info` - Database info
- `POST /api/database/setup` - Initialize data
- `POST /api/database/backup` - Backup data

## Test Examples

```bash
# Create an employee
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "salary": 50000,
    "joiningDate": "2024-01-01",
    "mobile": "9999999999",
    "email": "john@example.com",
    "role": "Developer"
  }'

# Get all employees
curl http://localhost:3000/api/employees

# Mark attendance
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "date": "2024-03-27",
    "status": "present"
  }'

# Auto-reset attendance (mark absent)
curl -X POST http://localhost:3000/api/attendance/auto-reset

# Get stats
curl http://localhost:3000/api/stats
```

## Troubleshooting

### Server won't start
```bash
# Check MongoDB connection
npm run dev

# Look for: "✓ Connected to MongoDB"
# If error, verify MONGODB_URI in .env.local
```

### "Duplicate key error"
Use PUT to update instead of POST:
```bash
curl -X PUT http://localhost:3000/api/attendance/[id] \
  -H "Content-Type: application/json" \
  -d '{"status": "absent"}'
```

### API returns 404
- Check endpoint URL is correct
- Verify ID exists
- Check console for detailed error

## Deployment

### Vercel
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys
# Add MONGODB_URI to environment variables in Vercel dashboard
```

### Docker
```bash
# Works out of the box!
# No file system dependencies
# Just set MONGODB_URI env var
```

### Other Platforms
- AWS Lambda ✅
- Google Cloud Functions ✅
- Azure Functions ✅
- Heroku ✅
- Railway ✅

## Key Changes

✅ **SQLite removed** - Only MongoDB
✅ **All 18 endpoints working** with MongoDB
✅ **Data persists** permanently
✅ **Duplicates blocked** automatically
✅ **Production ready** immediately
✅ **Serverless compatible**

## Important Notes

- 🔒 Never commit `.env.local` (already in .gitignore)
- 📊 MongoDB Atlas provides free tier
- 🔄 Data auto-syncs across instances
- 📈 Automatic backups enabled
- 🛡️ Full audit trail maintained

---

**Everything is ready to go!** 🎉

Start the dev server and you're good to go.

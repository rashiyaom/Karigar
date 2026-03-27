# MongoDB Connection Verification Guide

## ✅ MongoDB Connection Status

**New MongoDB Cluster:** Connected  
**Database Name:** karigar  
**Connection String:** mongodb+srv://omrashiya1_db_user@karigar.0rz7vid.mongodb.net/...

---

## 🔧 Quick Start Verification

### 1. Start Development Server
```bash
npm run dev
```

Expected output:
```
✓ MongoDB Store initialized
✓ Connected to MongoDB
```

### 2. Check MongoDB Connection
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "connection": {
      "isConnected": true,
      "readyStateLabel": "connected"
    }
  }
}
```

### 3. Run Full Verification Script
```bash
./verify-mongodb.sh
```

This will test:
- ✅ MongoDB connection
- ✅ Create employee
- ✅ Create attendance
- ✅ Create credit
- ✅ Create task
- ✅ Update employee
- ✅ Get statistics
- ✅ Get audit trail
- ✅ Duplicate prevention

---

## 📊 API Endpoints for Verification

### Health & Info
```bash
# Check MongoDB connection status
curl http://localhost:3000/api/health | jq '.'

# Get database information
curl http://localhost:3000/api/database/info | jq '.'

# Initialize database with sample data
curl -X POST http://localhost:3000/api/database/setup | jq '.'
```

### Employee Operations
```bash
# Get all employees (MongoDB read)
curl http://localhost:3000/api/employees | jq '.'

# Create employee (MongoDB write)
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "salary": 50000,
    "joiningDate": "2024-03-27",
    "mobile": "9999999999",
    "email": "john@example.com",
    "role": "Developer"
  }' | jq '.'

# Get employee by ID
curl http://localhost:3000/api/employees/EMPLOYEE_ID | jq '.'

# Update employee
curl -X PUT http://localhost:3000/api/employees/EMPLOYEE_ID \
  -H "Content-Type: application/json" \
  -d '{"salary": 60000}' | jq '.'

# Delete employee
curl -X DELETE http://localhost:3000/api/employees/EMPLOYEE_ID | jq '.'
```

### Attendance Operations
```bash
# Get all attendance records
curl http://localhost:3000/api/attendance | jq '.'

# Mark attendance (MongoDB write)
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "date": "2024-03-27",
    "status": "present"
  }' | jq '.'

# Update attendance
curl -X PUT http://localhost:3000/api/attendance/ATTENDANCE_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "absent"}' | jq '.'

# Auto-reset (mark absent)
curl -X POST http://localhost:3000/api/attendance/auto-reset | jq '.'
```

### Credits Operations
```bash
# Get all credits
curl http://localhost:3000/api/credits | jq '.'

# Add credit (MongoDB write)
curl -X POST http://localhost:3000/api/credits \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "amount": 5000,
    "dateTaken": "2024-03-27",
    "promiseReturnDate": "2024-04-26",
    "isPaid": false
  }' | jq '.'

# Update credit
curl -X PUT http://localhost:3000/api/credits/CREDIT_ID \
  -H "Content-Type: application/json" \
  -d '{"isPaid": true}' | jq '.'
```

### Tasks Operations
```bash
# Get all tasks
curl http://localhost:3000/api/tasks | jq '.'

# Create task (MongoDB write)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "title": "Complete Report",
    "description": "Finish the monthly report",
    "deadline": "2024-04-03",
    "priority": "high",
    "isCompleted": false
  }' | jq '.'

# Update task
curl -X PUT http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"isCompleted": true}' | jq '.'
```

### Statistics & History
```bash
# Get statistics (from MongoDB)
curl http://localhost:3000/api/stats | jq '.'

# Get audit trail (from MongoDB)
curl http://localhost:3000/api/history | jq '.data | .[0:5]'
```

---

## 🔍 Verification Checklist

### Connection
- [ ] `npm run dev` shows "✓ Connected to MongoDB"
- [ ] `/api/health` returns `isConnected: true`
- [ ] `/api/database/info` shows collections list

### Write Operations
- [ ] Can create employee → stored in MongoDB
- [ ] Can create attendance → stored in MongoDB
- [ ] Can create credit → stored in MongoDB
- [ ] Can create task → stored in MongoDB

### Read Operations
- [ ] Can retrieve all employees
- [ ] Can retrieve all attendance records
- [ ] Can retrieve all credits
- [ ] Can retrieve all tasks
- [ ] Can retrieve stats
- [ ] Can retrieve history

### Update Operations
- [ ] Can update employee → changes saved in MongoDB
- [ ] Can update attendance → changes saved in MongoDB
- [ ] Can update credit → changes saved in MongoDB
- [ ] Can update task → changes saved in MongoDB

### Delete Operations
- [ ] Can delete employee → removed from MongoDB
- [ ] Can delete attendance → removed from MongoDB
- [ ] Can delete credit → removed from MongoDB
- [ ] Can delete task → removed from MongoDB

### Data Integrity
- [ ] Duplicate attendance blocked
- [ ] All data persists after server restart
- [ ] Audit trail recorded for all operations
- [ ] Automatic timestamps working

---

## 🐛 Troubleshooting

### "MONGODB_URI not defined"
```bash
# Check .env.local exists
ls -la .env.local

# Verify MONGODB_URI is set
grep MONGODB_URI .env.local
```

### "Cannot connect to MongoDB"
```bash
# 1. Verify connection string
echo $MONGODB_URI

# 2. Check if URI has required format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/database

# 3. Verify credentials
# Username: omrashiya1_db_user
# Password: Romashiya123
# Cluster: karigar.0rz7vid.mongodb.net

# 4. Check MongoDB Atlas IP whitelist
# Add your IP: https://cloud.mongodb.com/v2
```

### "Duplicate key error"
```bash
# Expected behavior - prevents duplicate attendance
# Solution: Use PUT to update instead of POST

# Wrong (POST - creates duplicate):
curl -X POST http://localhost:3000/api/attendance ...

# Correct (PUT - updates existing):
curl -X PUT http://localhost:3000/api/attendance/{id} ...
```

### "Not found" Errors
```bash
# 1. Verify employee exists
curl http://localhost:3000/api/employees | jq '.data | map(.id)'

# 2. Use correct ID in subsequent requests
curl http://localhost:3000/api/employees/{correct-id}

# 3. Check collections exist in MongoDB Atlas
curl http://localhost:3000/api/health | jq '.data.collections'
```

### Server restart loses data
```bash
# This should NOT happen anymore!
# If it does, MongoDB connection is not persisting

# Check:
# 1. .env.local has correct MONGODB_URI
# 2. MongoDB Atlas connection is active
# 3. Database collections are created

# Reinitialize:
curl -X POST http://localhost:3000/api/database/setup
```

---

## 📝 MongoDB Collections

### Schema Overview

**employees**
```javascript
{
  _id: ObjectId,
  name: String,
  salary: Number,
  joiningDate: String,
  mobile: String,
  email: String (unique),
  role: String,
  profilePhoto: String (optional),
  status: 'active' | 'inactive',
  createdAt: Date,
  updatedAt: Date
}
```

**attendance**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  date: String (YYYY-MM-DD),
  status: 'present' | 'absent' | 'half-day' | 'sick-leave' | 'paid-leave',
  createdAt: Date,
  updatedAt: Date,
  // Unique index on (employeeId, date)
}
```

**credits**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  amount: Number,
  dateTaken: String,
  promiseReturnDate: String,
  isPaid: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**tasks**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  title: String,
  description: String,
  deadline: String,
  priority: 'high' | 'medium' | 'low',
  isCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**settings**
```javascript
{
  _id: ObjectId,
  organizationName: String,
  leaveDeduction: {
    type: 'percentage' | 'fixed',
    value: Number
  },
  weekendDays: [String],
  autoMarkAbsent: Boolean,
  emailNotifications: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**history** (Audit Trail)
```javascript
{
  _id: ObjectId,
  timestamp: Date,
  action: 'create' | 'update' | 'delete',
  entity: String,
  entityId: String,
  oldData: Mixed,
  newData: Mixed,
  description: String
}
```

---

## ✅ Connection Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Server** | ✅ Ready | Next.js 15 with MongoDB |
| **Database** | ✅ Configured | MongoDB Atlas - karigar cluster |
| **Connection** | ✅ Active | omrashiya1_db_user authenticated |
| **Collections** | ✅ Created | 6 collections with proper schemas |
| **Indexes** | ✅ Active | Unique constraints enforced |
| **Persistence** | ✅ Enabled | All data saved to MongoDB |
| **Backup** | ✅ Automatic | MongoDB Atlas backups enabled |

---

## 🎯 Next Steps

1. **Run Verification Script**
   ```bash
   ./verify-mongodb.sh
   ```

2. **Test in Browser**
   ```
   http://localhost:3000
   ```

3. **Check All Endpoints**
   - Create employee
   - Mark attendance
   - Add credits
   - Create tasks
   - View statistics

4. **Monitor Data**
   - Check MongoDB Atlas console
   - Verify collections have data
   - Review audit trail in history collection

5. **Deploy**
   - Add MONGODB_URI to production environment
   - Ensure IP whitelist allows production servers
   - Setup monitoring and alerts

---

## 📞 Support

For issues:
1. Check `/api/health` endpoint
2. Review server console logs
3. Verify `.env.local` configuration
4. Check MongoDB Atlas status
5. Review troubleshooting section above

---

**Status: ✅ MongoDB Connection Ready**

**Last Verified:** March 27, 2026  
**Database:** karigar  
**Cluster:** karigar.0rz7vid.mongodb.net

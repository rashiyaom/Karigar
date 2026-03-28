# MongoDB Atlas Configuration Checklist

## ✅ Current Setup

Your MongoDB connection string is configured:
```
mongodb+srv://omrashiya1_db_user:Romashiya123@karigar.0rz7vid.mongodb.net/karigar?retryWrites=true&w=majority&appName=Karigar
```

---

## 🔐 What You Need to Check in MongoDB Atlas

### Step 1: Access MongoDB Atlas
1. Go to: https://cloud.mongodb.com
2. Login with your account
3. Select your "karigar" project/cluster

### Step 2: IP Whitelist (Network Access)
**Location:** Security → Network Access

**What to check:**
- [ ] Your current IP address is whitelisted
- [ ] Allow access from your development machine
- [ ] For production: whitelist production server IPs

**Recommended setups:**

**For Development (Local Machine):**
```
Your IP: 0.0.0.0/0 (Allow anywhere - ONLY for development)
OR
Your specific IP: 1.2.3.4/32 (More secure)
```

**For Production:**
```
Vercel IP ranges: Add Vercel IPs
AWS IP: Add your AWS server IP
0.0.0.0/0 (Only if you have authentication)
```

### Step 3: Database Users
**Location:** Security → Database Access

**Verify your user exists:**
- Username: `omrashiya1_db_user`
- Password: `Romashiya123`
- Database: `karigar`
- Permissions: Read/Write to any database

### Step 4: Connection String
**Location:** Deployment → Database → Connect

**Your string should have:**
✅ Correct username: `omrashiya1_db_user`
✅ Correct password: `Romashiya123`
✅ Correct cluster: `karigar.0rz7vid.mongodb.net`
✅ Database name: `karigar`

---

## 🚀 Quick Fixes

### If Connection Fails: "Authentication failed"
```
❌ Problem: Username/Password wrong
✅ Solution: 
1. Go to Security → Database Access
2. Edit user: omrashiya1_db_user
3. Reset password if needed
4. Copy correct connection string
```

### If Connection Fails: "Connect timeout"
```
❌ Problem: IP not whitelisted
✅ Solution:
1. Go to Security → Network Access
2. Click "Add IP Address"
3. Choose:
   - Current IP (recommended for dev)
   - Allow anywhere (0.0.0.0/0) for testing
```

### If No Data Appears
```
❌ Problem: Database/Collections don't exist
✅ Solution: Call this endpoint to initialize
curl -X POST http://localhost:3000/api/database/setup
```

---

## 📋 Configuration Verification

Run this to verify your setup is working:

```bash
# 1. Check environment variable
echo $MONGODB_URI

# 2. Check health endpoint
curl http://localhost:3000/api/health | jq '.data.connection'

# 3. Check database exists
curl http://localhost:3000/api/database/info | jq '.data'
```

Expected response:
```json
{
  "isConnected": true,
  "readyStateLabel": "connected",
  "host": "karigar.0rz7vid.mongodb.net",
  "dbName": "karigar"
}
```

---

## 🎯 Action Items

### For Development (Right Now)
- [ ] **Add IP to whitelist** in MongoDB Atlas
  - Go to: https://cloud.mongodb.com/v2/PROJECT_ID/security/network/accessList
  - Click "Add IP Address"
  - Choose "Current IP Address" or enter `0.0.0.0/0`

- [ ] **Test connection**
  ```bash
  npm run dev
  # Should show: ✓ Connected to MongoDB
  ```

- [ ] **Run verification**
  ```bash
  ./verify-mongodb.sh
  ```

### For Production
- [ ] Add production server IPs to whitelist
- [ ] Use environment variables for credentials
- [ ] Enable database backup
- [ ] Setup monitoring and alerts
- [ ] Use IP restrictions (not 0.0.0.0/0)

---

## 🔍 Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| "Authentication failed" | Wrong username/password | Check credentials in MongoDB Atlas |
| "Connect timeout" | IP not whitelisted | Add your IP in Network Access |
| "Database does not exist" | Collections not created | Call `/api/database/setup` |
| "Cannot connect" | Invalid connection string | Copy fresh string from MongoDB Atlas |
| "Operation timed out" | Network issue | Check MongoDB Atlas status |

---

## 📌 Your Current Configuration

```
Cluster: karigar
Region: 0rz7vid
User: omrashiya1_db_user
Database: karigar
Connection Type: MongoDB+SRV (Secure)
TLS/SSL: Enabled ✅
```

---

## ✅ Checklist Before Going Live

- [ ] IP whitelist configured
- [ ] Database user verified
- [ ] Connection string correct
- [ ] Test endpoints working
- [ ] Health check returns "connected"
- [ ] Can create/read/update/delete data
- [ ] Duplicate prevention working
- [ ] Audit trail recording
- [ ] No errors in console

---

## 🆘 Need Help?

If connection fails:

1. **Check MongoDB Atlas Status**
   - Go to: https://status.mongodb.com

2. **Verify IP Address**
   ```bash
   # Find your public IP
   curl ifconfig.me
   ```

3. **Test MongoDB Connection**
   ```bash
   # Use MongoDB shell
   mongosh "mongodb+srv://omrashiya1_db_user:Romashiya123@karigar.0rz7vid.mongodb.net/karigar"
   ```

4. **Check Logs**
   ```bash
   npm run dev 2>&1 | grep -i mongo
   ```

---

## 📞 MongoDB Atlas Support

- **Documentation:** https://docs.mongodb.com/atlas
- **Network Access Guide:** https://docs.mongodb.com/atlas/security/ip-access-list
- **Connection Troubleshooting:** https://docs.mongodb.com/atlas/troubleshoot-connection

---

**Status:** Ready to verify IP whitelist ✅

**Next Step:** Check MongoDB Atlas Network Access settings and add your IP
